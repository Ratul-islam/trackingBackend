import bcrypt from 'bcrypt'
import { DeviceModel } from './device.model.js'
import mongoose, { Types } from 'mongoose'
import { TrackerRuleModel } from '../trackerRule/trackerRule.model.js'

type DeviceState = {
  lastSeenAt?: number
  lastPersistedAt?: number
  lastLocation?: { lat: number; lng: number }
}

const deviceState = new Map<string, DeviceState>()
const PERSIST_INTERVAL = 30_000


export async function getAllDevices(userId:Types.ObjectId) {
  const device = await DeviceModel.find({ownerUserId:userId}).select('name deviceId createdAt lastLocation lastSeenAt')
  return device;;
}

export async function getDeviceDetails(deviceId:string, ownerUserId:Types.ObjectId) {
  const device = await DeviceModel.findOne({deviceId, ownerUserId}).select('name, deviceId ownerUserId createdAt lastLocation lastSeenAt')
  return device;;
}

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

}

export async function unpairDeviceService({ userId, deviceId }: {userId:string, deviceId:string}) {
  if (!Types.ObjectId.isValid(userId)) {
    return { statusCode: 400, body: { message: "Invalid user id" } };
  }

  const userObjectId = new Types.ObjectId(userId);

  // 1️⃣ Delete device ONLY if owned by user
  const device = await DeviceModel.findOneAndDelete({
    deviceId,
    ownerUserId: userObjectId,
  }).lean();

  if (!device) {
    return {
      statusCode: 404,
      body: { message: "Device not found or not owned by you" },
    };
  }

  await TrackerRuleModel.deleteOne({
    deviceId,
    userId: userObjectId,
  });

  return {
    statusCode: 200,
    body: {
      message: "Device removed successfully",
      deviceId,
    },
  };
}