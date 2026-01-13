import { FastifyInstance } from 'fastify'
import * as authController from './auth.controller.js'
import { authenticateUser } from '../../middleware/auth.middleware.js'


type RefreshBody = { refreshToken: string }

export default async function authRoutes(app: FastifyInstance) {
  app.post(
    '/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['firstName', 'lastName', 'email', 'password'],
          properties: {
            firstName: { type: 'string', minLength: 2 },
            lastName: { type: 'string', minLength: 2 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.register(app, request, reply)
    }
  )

  app.post(
    '/verify',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'code', 'type'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string', minLength: 4 },
            type: { type: 'string', enum: ['EMAIL_VERIFICATION', 'PASSWORD_RESET'] },
            password: { type: 'string', minLength: 6 },
          },
          if: {
            properties: { type: { const: 'PASSWORD_RESET' } },
          },
          then: {
            required: ['password'],
          },
        },
      },
    },
    async (request, reply) => {
      await authController.verify(request, reply)
    }
  )

  app.post(
    '/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    authController.login
  )

  app.post<{Body: RefreshBody}>(
    '/refresh',
    {
      schema: {
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.refreshToken(request, reply)
    }
  )

   app.post<{ Body: { email: string } }>(
    '/forgot-password',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email'],
          properties: {
            email: { type: 'string', format: 'email' },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.forgotPassword(app, request, reply)
    }
  )

  app.post<{ Body: { email: string; code: string; password: string } }>(
    '/reset-password',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'code', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            code: { type: 'string', minLength: 4 },
            password: { type: 'string', minLength: 6 },
          },
        },
      },
    },
    async (request, reply) => {
      await authController.resetPassword(request, reply)
    }
  )
  app.get(
    '/logout',
    {
      preHandler: authenticateUser
    },
    authController.logout
  )
}
