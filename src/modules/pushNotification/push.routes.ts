import { FastifyInstance } from 'fastify'
import { authenticateUser } from '../../middleware/auth.middleware.js'
import { registerPushTokenController } from './push.controller.js'

export default async function pushRoutes(app: FastifyInstance) {
  app.post(
    '/register',
    { preHandler: authenticateUser,schema: {
      body: {
        type: 'object',
        required: ['token', 'platform'],
        properties: {
          token: { type: 'string', minLength: 20 },
          platform: { type: 'string', enum: ['ios', 'android'] },
        },
      },
    } 
  },
    registerPushTokenController
  )
}
