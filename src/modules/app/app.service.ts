import { DeviceModel } from '../device/device.model.js'
import { Types } from 'mongoose'

export async function getAllDevicesService(userId: string) {
  const devices = await DeviceModel.find({ ownerUserId: new Types.ObjectId(userId) }).select(
    'deviceId name lastLocation lastSeenAt status'
  )

  return devices
}

export async function getDeviceByIdService(userId: string, deviceId: string) {
  const device = await DeviceModel.findOne({
    ownerUserId: new Types.ObjectId(userId),
    deviceId,
  }).select('deviceId name lastLocation lastSeenAt status')

  return device
}
