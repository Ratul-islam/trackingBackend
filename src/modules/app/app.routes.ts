import { FastifyInstance } from 'fastify'
import {
  getAllDevicesController,
  getDeviceByIdController,
} from './app.controller.js'

import { authenticateUser } from '../../middleware/auth.middleware.js'
import { getRuleController, upsertRuleController } from '../trackerRule/trackerRule.controller.js'
import { upsertTrackerRuleSchema } from '../trackerRule/trackerRule.Schema.js'
import { UpsertTrackerRulePayload } from '../trackerRule/trackerRule.services.js'

export default async function appRoutes(app: FastifyInstance) {
  app.get('/devices', { preHandler: authenticateUser }, async (req, reply) => {
    await getAllDevicesController(req, reply)
  })

  app.get<{ Params: { deviceId: string } }>(
    '/devices/:deviceId',
    { preHandler: authenticateUser },
    async (req, reply) => {
      await getDeviceByIdController(req, reply)
    }
  )

  app.post<{ Params: {deviceId: string}; Body: UpsertTrackerRulePayload }>(
    '/devices/:deviceId/rule',
    { preHandler: authenticateUser, schema: upsertTrackerRuleSchema },
    upsertRuleController
  )

  app.get(
    '/devices/:deviceId/rule',
    { preHandler: authenticateUser },
    getRuleController
  )
}
