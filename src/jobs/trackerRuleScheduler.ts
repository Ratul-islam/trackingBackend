import { TrackerRuleModel } from '../modules/trackerRule/trackerRule.model'
import { DeviceModel } from '../modules/device/device.model'
import { AlertModel } from '../modules/alerts/alerts.model'
import { isInsideGeofence } from '../utils/geo'
import { pushAlertToUser } from '../modules/alerts/alerts.socket'
import { sendPushToUser } from '../modules/pushNotification/push.service'

const INTERVAL_MS = 5000
const PUSH_REPEAT_MS = 30_000

const pushRepeatRuntime = new Map<string, number>()

const INSTANCE_ID = `${process.pid}-${Math.random().toString(16).slice(2, 8)}`

function log(ruleId: string, deviceId: string, msg: string, extra?: any) {
  if (extra) console.log(`[SCHEDULER ${INSTANCE_ID}][${ruleId}][${deviceId}] ${msg}`, extra)
  else console.log(`[SCHEDULER ${INSTANCE_ID}][${ruleId}][${deviceId}] ${msg}`)
}

type TripStatus = 'IDLE' | 'OUTSIDE_HOME' | 'IN_DESTINATION' | 'ALERTED'

export function startTrackerRuleScheduler() {
  let running = false

  console.log(`[SCHEDULER ${INSTANCE_ID}] TrackerRuleScheduler starting, interval=${INTERVAL_MS}ms`)

  setInterval(async () => {
    if (running) {
      console.warn(`[SCHEDULER ${INSTANCE_ID}] skip tick: previous tick still running`)
      return
    }
    running = true

    const startedAt = Date.now()
    const now = new Date()
    const nowMs = now.getTime()

    try {
      const rules = await TrackerRuleModel.find({ isActive: true })
  .limit(200)
  .populate({
    path: "deviceId",
    select: "_id deviceId name lastLocation lastSeenAt status",
  })
  .lean()


      if (rules.length) {
        console.log(`[SCHEDULER ${INSTANCE_ID}] tick: rules=${rules.length} time=${now.toISOString()}`)
      }

      const deviceIds = Array.from(new Set(rules.map((r: any) => r.deviceId).filter(Boolean)))
      const devices = await DeviceModel.find({ _id: { $in: deviceIds } }).lean()

      const deviceMap = new Map<string, any>(devices.map((d: any) => [d.deviceId, d]))
      
      for (const rule of rules as any[]) {
        const ruleId = rule._id.toString()
        const deviceId = rule.deviceId.deviceId

        try {
          const device = deviceMap.get(deviceId)
          const loc = device?.lastLocation

          if (!loc) {
            log(ruleId, deviceId, 'skip: no lastLocation')
            continue
          }

          const insideHome = !!rule.home && isInsideGeofence(loc, rule.home)
          const insideDestination = (rule.destinations ?? []).some((d: any) => isInsideGeofence(loc, d))

          log(ruleId, deviceId, 'state check', {
            tripStatus: rule.tripStatus,
            insideHome,
            insideDestination,
            deadlineAt: rule.deadlineAt,
            alertSuppressed: rule.alertSuppressed,
            activeAlertId: rule.activeAlertId?.toString?.() ?? rule.activeAlertId,
          })
          if (insideHome) {
            pushRepeatRuntime.delete(ruleId)

            const res = await TrackerRuleModel.updateOne(
              { _id: rule._id },
              {
                $set: {
                  tripStatus: 'IDLE' as TripStatus,
                  alertSuppressed: false,
                  lastEvaluatedAt: now,
                },
                $unset: {
                  exitedHomeAt: '',
                  deadlineAt: '',
                  activeAlertId: '',
                },
              }
            )

            const fresh = await TrackerRuleModel.findById(rule._id).lean()

            log(ruleId, deviceId, 'RESET -> IDLE (inside home)', {
              matched: (res as any).matchedCount ?? (res as any).n,
              modified: (res as any).modifiedCount ?? (res as any).nModified,
              freshTripStatus: fresh?.tripStatus,
              freshActiveAlertId: fresh?.activeAlertId?.toString?.() ?? fresh?.activeAlertId,
              freshDeadlineAt: fresh?.deadlineAt,
            })

            continue
          }

          if ((rule.tripStatus as TripStatus) === 'IDLE') {
            const exitedHomeAt = now
            const deadlineAt = new Date(nowMs + (rule.timerSeconds ?? 0) * 1000)

            await TrackerRuleModel.updateOne(
              { _id: rule._id },
              {
                $set: {
                  tripStatus: 'OUTSIDE_HOME' as TripStatus,
                  exitedHomeAt,
                  deadlineAt,
                  alertSuppressed: false,
                  lastEvaluatedAt: now,
                },
                $unset: {
                  activeAlertId: '',
                },
              }
            )

            log(ruleId, deviceId, 'TRIP START -> OUTSIDE_HOME', { exitedHomeAt, deadlineAt })
            continue
          }

          if (insideDestination) {
            pushRepeatRuntime.delete(ruleId)

            await TrackerRuleModel.updateOne(
              { _id: rule._id },
              {
                $set: {
                  tripStatus: 'IN_DESTINATION' as TripStatus,
                  alertSuppressed: false,
                  lastEvaluatedAt: now,
                },
                $unset: {
                  activeAlertId: '',
                },
              }
            )

            log(ruleId, deviceId, 'SUCCESS -> IN_DESTINATION')
            continue
          }

          if ((rule.tripStatus as TripStatus) === 'IN_DESTINATION') {
            await TrackerRuleModel.updateOne({ _id: rule._id }, { $set: { lastEvaluatedAt: now } })
            log(ruleId, deviceId, 'hold: IN_DESTINATION (waiting for home reset)')
            continue
          }

          if ((rule.tripStatus as TripStatus) === 'OUTSIDE_HOME') {
            const deadline = rule.deadlineAt ? new Date(rule.deadlineAt) : null

            if (deadline && now >= deadline) {
              let existingAlert: any = null
              if (rule.activeAlertId) {
                existingAlert = await AlertModel.findById(rule.activeAlertId).lean()
              }

              const canCreateNewAlert =
                !rule.activeAlertId || !existingAlert || existingAlert.acknowledged === true

              if (!canCreateNewAlert) {
                await TrackerRuleModel.updateOne(
                  { _id: rule._id },
                  { $set: { tripStatus: 'ALERTED' as TripStatus, lastEvaluatedAt: now, alertSuppressed: false } }
                )
                log(ruleId, deviceId, 'deadline passed but existing alert still active; keep ALERTED')
                continue
              }

              const alert = await AlertModel.create({
                userId: rule.userId,
                deviceId,
                message: 'Tracker did not reach destination in time',
                type: 'ALERT',
                acknowledged: false,
              })

              await TrackerRuleModel.updateOne(
                { _id: rule._id },
                {
                  $set: {
                    tripStatus: 'ALERTED' as TripStatus,
                    activeAlertId: alert._id,
                    alertSuppressed: false,
                    lastEvaluatedAt: now,
                  },
                }
              )

              pushRepeatRuntime.set(ruleId, nowMs)

              log(ruleId, deviceId, 'ALERT TRIGGERED -> ALERTED', { alertId: alert._id.toString() })

              pushAlertToUser(rule.userId.toString(), {
                alertId: alert._id.toString(),
                type: 'ALERT',
                deviceId,
                message: alert.message,
              })

              await sendPushToUser(rule.userId.toString(), {
                title: 'Tracker Alert',
                body: alert.message,
                data: { alertId: alert._id.toString(), deviceId },
              })

              log(ruleId, deviceId, 'push sent (new alert)')
            } else {
              await TrackerRuleModel.updateOne({ _id: rule._id }, { $set: { lastEvaluatedAt: now } })

              log(ruleId, deviceId, 'waiting: OUTSIDE_HOME timer running', {
                secondsLeft: deadline ? Math.max(0, Math.ceil((deadline.getTime() - nowMs) / 1000)) : null,
              })
            }
            continue
          }

          if ((rule.tripStatus as TripStatus) === 'ALERTED') {
            await TrackerRuleModel.updateOne({ _id: rule._id }, { $set: { lastEvaluatedAt: now } })

            if (rule.alertSuppressed) {
              log(ruleId, deviceId, 'stop repeats: alertSuppressed=true')
              continue
            }

            if (!rule.activeAlertId) {
              log(ruleId, deviceId, 'stop repeats: no activeAlertId')
              continue
            }

            const alert = await AlertModel.findById(rule.activeAlertId).lean()
            if (!alert) {
              log(ruleId, deviceId, 'stop repeats: alert not found in DB; suppressing')
              await TrackerRuleModel.updateOne({ _id: rule._id }, { $set: { alertSuppressed: true } })
              continue
            }

            if (alert.acknowledged) {
              log(ruleId, deviceId, 'stop repeats: alert acknowledged; suppressing')
              await TrackerRuleModel.updateOne({ _id: rule._id }, { $set: { alertSuppressed: true } })
              continue
            }

            const lastPushAt = pushRepeatRuntime.get(ruleId) ?? 0
            const due = nowMs - lastPushAt >= PUSH_REPEAT_MS

            if (!due) {
              log(ruleId, deviceId, 'repeat not due yet', {
                msRemaining: PUSH_REPEAT_MS - (nowMs - lastPushAt),
              })
              continue
            }

            pushRepeatRuntime.set(ruleId, nowMs)

            await sendPushToUser(rule.userId.toString(), {
              title: 'Tracker Alert',
              body: alert.message,
              data: { alertId: alert._id.toString(), deviceId },
            })

            log(ruleId, deviceId, 'push sent (repeat)')
            continue
          }

          log(ruleId, deviceId, `unknown tripStatus: ${rule.tripStatus}`)
        } catch (e) {
          console.error(`[SCHEDULER ${INSTANCE_ID}] rule error`, rule._id.toString(), e)
        }
      }

      const took = Date.now() - startedAt
      if (rules.length) console.log(`[SCHEDULER ${INSTANCE_ID}] tick done in ${took}ms`)
    } catch (e) {
      console.error(`[SCHEDULER ${INSTANCE_ID}] tick error`, e)
    } finally {
      running = false
    }
  }, INTERVAL_MS)
}
