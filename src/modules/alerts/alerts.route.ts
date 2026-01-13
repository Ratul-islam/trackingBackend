import { FastifyInstance } from 'fastify'
import { authenticateAlertSocket } from './alerts.auth.js'
import { addUserSocket, removeUserSocket } from './alerts.socket.js'
import { authenticateUser } from '../../middleware/auth.middleware.js'
import { acknowledgeAlertController } from './alerts.controller.js'

export default async function alertRoutes(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    const user = authenticateAlertSocket(req)
    const userId = user.id.toString()

    addUserSocket(userId, socket)

    socket.on('close', () => {
      removeUserSocket(userId, socket)
    })
  })


  app.post(
    '/:alertId/acknowledge',
    { preHandler: authenticateUser },
    acknowledgeAlertController
  )
}
