import { trackerRuntime, TrackerRuntimeState } from '../modules/trackerRule/trackerRuntime.js'
import { TrackerRuleModel } from '../modules/trackerRule/trackerRule.model.js'
import { isInsideGeofence } from './geo.js'
import { pushAlertToUser } from '../modules/alerts/alerts.socket.js'
import { sendPushToUser } from '../modules/pushNotification/push.service.js'
import { AlertModel } from '../modules/alerts/alerts.model.js'

interface Location {
  lat: number
  lng: number
}

const PUSH_REPEAT_INTERVAL = 30_000

export async function evaluateTrackerRule(deviceId: string, location: Location) {
  const rule = await TrackerRuleModel.findOne({ deviceId, isActive: true })
  if (!rule) return

  const now = Date.now()

  const state: TrackerRuntimeState = trackerRuntime.get(deviceId) ?? {
    isInsideHome: true,
    alertActive: false,
    lastLocation: undefined,
    alertTimer: undefined,
    timerStartedAt: undefined,
    currentAlertId: undefined,
    alertSentAt: undefined,
  }

  state.lastLocation = location

  const insideHome = isInsideGeofence(location, rule.home)
  const insideDestination = rule.destinations.some(d => isInsideGeofence(location, d))

  console.log('[RULE]', { deviceId, insideHome, insideDestination, state })

  if (insideHome) {
    if (state.alertTimer) {
      clearInterval(state.alertTimer)
    }
    trackerRuntime.set(deviceId, {
      isInsideHome: true,
      alertActive: false,
      lastLocation: location,
      alertTimer: undefined,
      timerStartedAt: undefined,
      currentAlertId: undefined,
      alertSentAt: undefined,
    })
    return
  }

  if (insideDestination) {
    if (state.alertTimer) {
      clearInterval(state.alertTimer)
    }
    trackerRuntime.set(deviceId, {
      isInsideHome: false,
      alertActive: false,
      lastLocation: location,
      alertTimer: undefined,
      timerStartedAt: undefined,
      currentAlertId: undefined,
      alertSentAt: undefined,
    })
    return
  }

  if (state.isInsideHome) {
    state.isInsideHome = false
    state.timerStartedAt = now
    console.log('[RULE] exited home', deviceId)
  }

  if (
    state.timerStartedAt &&
    now - state.timerStartedAt >= rule.timerSeconds * 1000 &&
    !state.alertActive
  ) {
    state.alertActive = true

    const alert = await AlertModel.create({
      userId: rule.userId,
      deviceId,
      message: 'Tracker did not reach destination in time',
      type: 'ALERT',
      acknowledged: false,
    })

    state.currentAlertId = alert._id.toString()
    state.alertSentAt = now

    console.log('[RULE] ALERT TRIGGERED', deviceId, 'alertId:', state.currentAlertId)

    pushAlertToUser(rule.userId.toString(), {
      alertId: state.currentAlertId,
      type: 'ALERT',
      deviceId,
      message: alert.message,
    })

    await sendPushToUser(rule.userId.toString(), {
      title: 'Tracker Alert',
      body: alert.message,
      data: { alertId: state.currentAlertId, deviceId },
    })

    state.alertTimer = setInterval(async () => {
      const currentAlert = await AlertModel.findById(state.currentAlertId)
      if (!currentAlert || currentAlert.acknowledged) {
        if (state.alertTimer) {
          clearInterval(state.alertTimer)
          state.alertTimer = undefined
        }
        return
      }

      console.log('[RULE] Resending push for alert', state.currentAlertId)
      await sendPushToUser(rule.userId.toString(), {
        title: 'Tracker Alert',
        body: currentAlert.message,
        data: { alertId: state.currentAlertId, deviceId },
      })
    }, PUSH_REPEAT_INTERVAL)
  }

  trackerRuntime.set(deviceId, state)
}
