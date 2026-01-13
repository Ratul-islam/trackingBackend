import { FastifyRequest, FastifyReply } from 'fastify'
import util from 'node:util'
import {
  pairDeviceService,
  authenticateDeviceService,
  handleLocationUpdateService,
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
  console.log("sjjfhsjdfjhdjfgj" +userId)
  if (!deviceId || !deviceSecret || !userId ||name) {
    throw new AppError('Missing required fields', 400);
  }

  try {
    const result = await pairDeviceService(deviceId, deviceSecret, userId, name)
    return reply.code(201).send({ message: 'Device paired successfully', device: result })
  } catch (err: any) {
    return reply.code(400).send({ message: err.message })
  }
}

export async function deviceAuthController(req: FastifyRequest, reply: FastifyReply) {
  const { deviceId, deviceSecret } = req.body as any
  try {
    const token = await authenticateDeviceService(deviceId, deviceSecret, req.server)
    return sendSuccess(reply , { data: {accessToken: token}, message: 'success', statusCode:200 })
  } catch (err: any) {
    return reply.code(400).send({ message: err.message })
  }
}

export async function locationController(req: FastifyRequest, reply: FastifyReply) {
  const { deviceId } = (req as any).device
  const { lat, lng, speed, battery } = req.body as any

  await handleLocationUpdateService(deviceId, { lat, lng })
  return reply.code(204).send()
}
