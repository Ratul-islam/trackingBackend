import { FastifyRequest, FastifyReply } from 'fastify'
import { AlertModel } from './alerts.model.js'

export async function acknowledgeAlertController(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.id
  const { alertId } = req.params as { alertId: string }

  const alert = await AlertModel.findOne({ _id: alertId, userId })
  if (!alert) return reply.status(404).send({ message: 'Alert not found' })

  if (alert.acknowledged) return reply.send({ success: true })

  alert.acknowledged = true
  alert.acknowledgedAt = new Date()
  await alert.save()

  reply.send({ success: true })
}
