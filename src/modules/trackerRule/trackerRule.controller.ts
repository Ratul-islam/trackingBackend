import { FastifyRequest, FastifyReply } from 'fastify'
import { upsertRuleService, getRuleService, UpsertTrackerRulePayload } from './trackerRule.services.js'
import { sendSuccess } from '../../utils/responses.js'
import { getDeviceByIdService } from '../app/app.service.js'
import { AppError } from '../../utils/AppError.js'
import { Types } from 'mongoose'
import { getDeviceDetails } from '../device/device.service.js'

type Params = { deviceId: string }

export async function upsertRuleController(
  req: FastifyRequest<{ Params: Params; Body: UpsertTrackerRulePayload }>,
  reply: FastifyReply
) {
  const userId = (req as any).user.id
  const { deviceId } = req.params

  const rule = await upsertRuleService(userId, deviceId, req.body)

  sendSuccess(reply, {
    data: rule,
    message: 'success',
    statusCode: 200,
  })
}


export async function getRuleController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = new Types.ObjectId((req as any).user.id)
  const { deviceId } = req.params as any

  const device = await getDeviceDetails(deviceId, userId)
  if(!device){
    throw new AppError('no such device',404)
  }
  const rule = await getRuleService(userId, device._id)
  if(device==null) {
    throw new AppError("No such device", 404)
  }
  sendSuccess(reply, {
    statusCode: 200,
    data: rule
  })
}
