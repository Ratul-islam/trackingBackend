import { FastifyRequest, FastifyReply } from 'fastify'
import { registerPushTokenService } from './push.service.js'

export async function registerPushTokenController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (req as any).user.id
  const { token, platform } = req.body as {
    token: string
    platform: 'ios' | 'android'
  }

  await registerPushTokenService(userId, token, platform)
  reply.send({ success: true })
}
