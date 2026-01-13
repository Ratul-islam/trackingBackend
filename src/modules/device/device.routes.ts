import { FastifyInstance } from 'fastify'
import {
  pairDeviceController,
  deviceAuthController,
  locationController,
} from './device.controller.js'
import { authenticateDevice } from './device.auth.middleware.js'
import { pairDeviceSchema, deviceAuthSchema, deviceLocationSchema } from './device.shcema.js'
import { authenticateUser } from '../../middleware/auth.middleware.js'

export default async function deviceRoutes(app: FastifyInstance) {
  app.post('/pair-device', { preHandler: authenticateUser, schema: pairDeviceSchema}, async (req, reply) => {
    await pairDeviceController(req, reply)
  })

  app.post('/auth', { schema: deviceAuthSchema }, async (req, reply) => {
    await deviceAuthController(req, reply)
  })

  app.post(
    '/location',
    { preHandler: authenticateDevice, schema: deviceLocationSchema },
    async (req, reply) => {
      await locationController(req, reply)
    }
  )
}
