import { FastifyRequest, FastifyReply } from 'fastify'
import { getAlertById, getAllAlertsByUserId } from './alerts.service.js'
import { sendError, sendSuccess } from '../../utils/responses.js'

export async function acknowledgeAlertController(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.id
  const { alertId } = req.params as { alertId: string }

  const alert = await getAlertById(userId, alertId);
  if (!alert) return sendError(reply, {message: 'Alert not found', statusCode:404});

  if (alert.acknowledged) return reply.send({ success: true })

  alert.acknowledged = true
  alert.acknowledgedAt = new Date()
  await alert.save()

  return sendSuccess(reply , {data: alert});
}

export async function getAlerts(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req as any).user.id

  const alerts = await getAllAlertsByUserId(userId);
  if (!alerts) return sendError(reply, {message:"No alerts found!", statusCode:404})
  return sendSuccess(reply , {data: alerts});
}
