import { Expo } from 'expo-server-sdk'
import { PushTokenModel } from './push.model.js'
import { AppError } from '../../utils/AppError.js'

const expo = new Expo()

export async function registerPushTokenService(
  userId: string,
  token: string,
  platform: 'ios' | 'android'
) {
  if (!Expo.isExpoPushToken(token)) {
    throw new AppError('Invalid Expo push token', 400)
  }

  await PushTokenModel.updateOne(
    { token },
    { $set: { userId, platform } },
    { upsert: true }
  )
}

export async function sendPushToUser(
  userId: string,
  payload: {
    title: string
    body: string
    data?: Record<string, any>
  }
) {
  const tokens = await PushTokenModel.find({ userId })
  if (!tokens.length) return

  const messages = tokens.map(t => ({
  to: t.token,
  title: payload.title,
  body: payload.body,
  data: payload.data,
  sound: 'default' as const,
  priority: 'high' as 'high',
}))

  const chunks = expo.chunkPushNotifications(messages)

  for (const chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk)
    } catch (err) {
      console.error('Expo push error:', err)
    }
  }
}
