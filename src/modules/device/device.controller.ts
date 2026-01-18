import { FastifyRequest, FastifyReply } from 'fastify'
import util from 'node:util'
import {
  pairDeviceService,
  authenticateDeviceService,
  handleLocationUpdateService,
  unpairDeviceService,
} from './device.service.js'
import { Types } from 'mongoose'
import { AppError } from '../../utils/AppError.js'
import { sendError, sendSuccess } from '../../utils/responses.js'

export async function pairDeviceController(req: FastifyRequest, reply: FastifyReply) {
  const { deviceId, deviceSecret, name } = req.body as {
    deviceId: string
    deviceSecret: string
    name:string
  }
  const userId = (req as any).user.id;
  try {
    const result = await pairDeviceService(deviceId, deviceSecret, userId, name)
    return sendSuccess(reply, { message: 'Device paired successfully', data: result, statusCode:201 })
  } catch (err: any) {
    return sendError(reply,{ message: err.message, statusCode:400})
  }
}




export async function unpairDeviceController(
  req: FastifyRequest<{Params:{deviceId:string}}>,
  reply: FastifyReply
) {
  const { deviceId } = req.params;
  const userId = (req as any).user?.id;

  if (!userId) return sendError(reply, {statusCode:401, message:"unauthoried"});

  const result = await unpairDeviceService({ userId: String(userId), deviceId });
  return sendSuccess(reply, {statusCode:result.statusCode, data:result.body})
}

export async function deviceAuthController(req: FastifyRequest, reply: FastifyReply) {
  const { deviceId, deviceSecret } = req.body as any
  
  try {
    
    const token = await authenticateDeviceService(deviceId, deviceSecret, req.server)
    return reply.code(200).send(token);
  } catch (err: any) {
    return reply.code(400).send({ message: err.message })
  }
}

export async function locationController(req: FastifyRequest, reply: FastifyReply) {

  const { lat, lng, token} = req.body as any
    const payload = (req.server as any).jwt.verify(token)

  await handleLocationUpdateService(payload.deviceId, { lat, lng })
  return reply.code(204).send()
}
