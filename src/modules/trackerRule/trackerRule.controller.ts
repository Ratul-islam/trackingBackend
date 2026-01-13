import { FastifyRequest, FastifyReply } from 'fastify'
import { upsertRuleService, getRuleService } from './trackerRule.services.js'
import { sendSuccess } from '../../utils/responses.js'
import { getDeviceByIdService } from '../app/app.service.js'
import { AppError } from '../../utils/AppError.js'

export async function upsertRuleController(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.id

  const { deviceId } = req.params as any
  const rule = await upsertRuleService(userId, deviceId, req.body)
  sendSuccess(reply, {data:rule, message:"success", statusCode:200})
}



export async function getRuleController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req as any).user.id
  const { deviceId } = req.params as any

  const rule = await getRuleService(userId, deviceId)
  const device = await getDeviceByIdService(userId, deviceId)
  if(device==null) {
    throw new AppError("No such device", 404)
  }
  sendSuccess(reply, {
    statusCode: 200,
    data: {
      rule: rule
        ? {
            id: rule._id,
            deviceId: rule.deviceId,
            isActive: rule.isActive,
            timerSeconds: rule.timerSeconds,
            home: rule.home,
            destinations: rule.destinations,
          }
        : null,
      device: device
        ? {
            id: device._id,
            status: device.status,
            name: device.name,
            lastSeenAt: device.lastSeenAt,
            lastLocation: device.lastLocation
          }
        : null
    }
  })
}
