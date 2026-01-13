import { FastifyRequest, FastifyReply } from 'fastify'
import { AppError } from '../../utils/AppError.js'

export async function authenticateDevice(req: FastifyRequest, reply: FastifyReply) {
  const auth = req.headers.authorization
  if (!auth) throw new AppError('Missing token', 401)

  try {
    const token = auth.replace('Bearer ', '')
    const payload = (req.server as any).jwt.verify(token)

    if (payload.type !== 'device') throw new AppError('Invalid token type', 403)

    ;(req as any).device = payload
  } catch {
    throw new AppError('Invalid token', 403)
  }
}
