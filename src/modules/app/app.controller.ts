import { FastifyRequest, FastifyReply } from 'fastify'
import { Types } from 'mongoose'
import { getAllDevices, getDeviceDetails } from '../device/device.service.js'
import { getAllRuleService, getRuleService } from '../trackerRule/trackerRule.services.js'
import { sendError, sendSuccess } from '../../utils/responses.js'


export async function getAllDevicesController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = new Types.ObjectId((req as any).user.id)

    const [rules, devices] = await Promise.all([
      getAllRuleService(userId),
      getAllDevices(userId),
    ])

    const ruleByDeviceId = new Map<string, any>()

    for (const rule of rules ?? []) {
      const d = (rule as any).deviceId
      const key =
        (d && typeof d === "object" && d._id ? String(d._id) : String(d)) || ""

      if (key) ruleByDeviceId.set(key, rule)
    }

    const mergedDevices = (devices ?? []).map((device: any) => {
      const deviceKey = String(device._id)

      return {
        ...device?.toObject?.() ?? device,
        rule: ruleByDeviceId.get(deviceKey) ?? null,
      }
    })

    return sendSuccess(reply, {
      message: "got your devices",
      statusCode: 200,
      data: { devices: mergedDevices },
    })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: 500 })
  }
}
export async function getDeviceByIdController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { deviceId } = req.params as { deviceId: string }

    const deviceDoc = await getDeviceDetails(deviceId, userId)
    if (!deviceDoc) return sendError(reply, { message: "device not found", statusCode: 404 })

    const rule = await getRuleService(new Types.ObjectId(userId), deviceDoc._id)

    const ruleObj = rule ? (typeof (rule as any).toObject === "function" ? (rule as any).toObject() : rule) : null
    if (ruleObj) delete (ruleObj as any).deviceId

    const deviceObj =
      typeof (deviceDoc as any).toObject === "function" ? (deviceDoc as any).toObject() : deviceDoc

    return sendSuccess(reply, {
      data: { ...deviceObj, rule: ruleObj },
      message: "got your device",
      statusCode: 200,
    })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: 500 })
  }
}

