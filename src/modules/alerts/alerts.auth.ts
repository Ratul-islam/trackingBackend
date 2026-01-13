import { FastifyRequest } from 'fastify'
import { AppError } from '../../utils/AppError.js'

export function authenticateAlertSocket(req: FastifyRequest) {
  const token = (req.query as { token?: string })?.token
  if (!token) throw new AppError('Missing token', 401)

  const payload = (req.server as any).jwt.verify(token)
  if (payload.type !== 'user') {
    throw new AppError('Invalid token type', 403)
  }

  return payload
}
