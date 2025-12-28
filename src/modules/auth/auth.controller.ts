import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import * as authService from './auth.service.js'
import { sendSuccess, sendError } from '../../utils/responses.js'
import { AppError } from '../../utils/AppError.js'
import { createOTP } from '../otp/otp.sevice.js'
import { sendOTPEmail } from '../notification/notification.service.js'

type RefreshBody = {
  refreshToken: string
}
export const register = async (
  fastify: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply
) => {
  if (!request.body) throw new AppError('Request body required', 400)

  const { firstName, lastName, email, password } = request.body as {
    firstName: string
    lastName: string
    email: string
    password: string
  }

  const user = await authService.registerUser(firstName, lastName, email, password);

  const otp = await createOTP(user.id, 'EMAIL_VERIFICATION')
  sendOTPEmail(fastify, user.email, otp, 'EMAIL_VERIFICATION', 2)

  return sendSuccess(reply, {
    data: { id: user.id, email: user.email },
    message: 'Registered successfully. Check your email to verify your account.',
  })
}

export const verify = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const { email, code } = request.body as {
      email: string,
      code: string,
    }
    const result = await authService.verifyUserOTP(email, code, 'EMAIL_VERIFICATION')
    return sendSuccess(reply, { message: result.message, data: result })
  } catch (err: any) {
    return sendError(reply, { message: err.message })
  }
}

export const login = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    if (!request.body) throw new AppError('Request body required', 400)

    const { email, password } = request.body as {
      email: string,
      password:string
    }
    const user = await authService.loginUser(email, password)

    const accessToken = await reply.jwtSign({ id: user._id }, { expiresIn: '15m' })
    const refreshToken = await reply.jwtSign({ id: user._id }, { expiresIn: '7d' })
    await authService.saveRefreshToken(user._id, refreshToken)

    return sendSuccess(reply, { data: { accessToken, refreshToken }, message: 'Logged in' })
  } catch (err: any) {
    console.log(err)
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}



export const refreshToken = async (
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply
) => {
  try {
    if (!request.body) throw new AppError('Request body required', 400)

    const { refreshToken } = request.body
    if (!refreshToken) throw new AppError('Refresh token required', 400)

    const user = await authService.verifyRefreshToken(refreshToken)
    const newAccessToken = await reply.jwtSign({ id: user._id }, { expiresIn: '15m' })

    return sendSuccess(reply, { data: { accessToken: newAccessToken }, message: 'Access token refreshed' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}


export const forgotPassword = async (
  fastify: FastifyInstance,
  request: FastifyRequest<{ Body: { email: string } }>,
  reply: FastifyReply
) => {
  try {
    const { email } = request.body
    if (!email) throw new AppError('Email required', 400)

    await authService.requestPasswordReset(fastify, email)
    return sendSuccess(reply, { message: 'OTP sent to email if the account exists' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}

export const resetPassword = async (
  request: FastifyRequest<{ Body: { email: string; code: string; password: string } }>,
  reply: FastifyReply
) => {
  try {
    const { email, code, password } = request.body
    if (!email || !code || !password) throw new AppError('Email, code and password are required', 400)

    await authService.resetPassword(email, code, password)
    return sendSuccess(reply, { message: 'Password reset successfully' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}

export const logout = async (
  request: FastifyRequest<{ Body: RefreshBody }>,
  reply: FastifyReply
) => {
  try {
    const token = request.body?.refreshToken
    if (!token) throw new AppError('Refresh token required', 400)

    const revoked = await authService.revokeRefreshToken(token)
    if (!revoked) {
      return sendSuccess(reply, { message: 'Logged out' })
    }

    return sendSuccess(reply, { message: 'Logged out' })
  } catch (err: any) {
    return sendError(reply, { message: err.message, statusCode: err.statusCode })
  }
}