import bcrypt from 'bcrypt'
import { DeviceModel } from './device.model.js'
import { Types } from 'mongoose'
import { evaluateTrackerRule } from '../../utils/ruleEngine.js'

type DeviceState = {
  lastSeenAt?: number
  lastPersistedAt?: number
  lastLocation?: { lat: number; lng: number }
}

const deviceState = new Map<string, DeviceState>()
const PERSIST_INTERVAL = 30_000

export async function pairDeviceService(
  deviceId: string,
  deviceSecret: string,
  userId: Types.ObjectId,
  name: string
) {
  let device = await DeviceModel.findOne({ deviceId })

  if (device) {
    if (device.ownerUserId && device.ownerUserId !== userId) {
      throw new Error('Device already paired by another user')
    }

    if (!device.ownerUserId) {
      device.ownerUserId = userId
      device.status = 'PAIRED'
      device.deviceSecretHash = await bcrypt.hash(deviceSecret, 10)
      await device.save()
    }
  } else {
    const hash = await bcrypt.hash(deviceSecret, 10)
    device = new DeviceModel({
      deviceId,
      name,
      deviceSecretHash: hash,
      ownerUserId: userId,
      status: 'PAIRED',
    })
    await device.save()
  }

  return {
    deviceId: device.deviceId,
    ownerUserId: device.ownerUserId,
    status: device.status,
  }
}

export async function authenticateDeviceService(
  deviceId: string,
  deviceSecret: string,
  fastify: any
) {
  const device = await DeviceModel.findOne({ deviceId })
  if (!device) throw new Error('Device not found')
  if (!device.ownerUserId) throw new Error('Device not paired')

  const valid = await bcrypt.compare(deviceSecret, device.deviceSecretHash)
  if (!valid) throw new Error('Invalid device secret')

  const token = fastify.jwt.sign({ deviceId, type: 'device' }, { expiresIn: '1d' })
  return token
}


export async function handleLocationUpdateService(
  deviceId: string,
  data: { lat: number; lng: number; }
) {
  const now = Date.now()
  const state = deviceState.get(deviceId) || {}

  state.lastLocation = { lat: data.lat, lng: data.lng }
  state.lastSeenAt = now

  if (!state.lastPersistedAt || now - state.lastPersistedAt > PERSIST_INTERVAL) {
    await DeviceModel.updateOne(
      { deviceId },
      { $set: { lastLocation: state.lastLocation, lastSeenAt: new Date() } }
    )
    state.lastPersistedAt = now
  }

  deviceState.set(deviceId, state)

  await evaluateTrackerRule(deviceId, data)
}
