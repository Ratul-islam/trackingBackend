import { FastifyRequest, FastifyReply } from 'fastify'
import { getAllDevicesService, getDeviceByIdService } from './app.service.js'

export async function getAllDevicesController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    console.log(userId)
    const devices = await getAllDevicesService(userId)
    return reply.send(devices)
  } catch (err: any) {
    return reply.code(500).send({ message: err.message })
  }
}

export async function getDeviceByIdController(req: FastifyRequest, reply: FastifyReply) {
  try {
    const userId = (req as any).user.id
    const { deviceId } = req.params as { deviceId: string }

    const device = await getDeviceByIdService(userId, deviceId)
    if (!device) return reply.code(404).send({ message: 'Device not found' })

    return reply.send(device)
  } catch (err: any) {
    return reply.code(500).send({ message: err.message })
  }
}
