import { DeviceModel } from '../device/device.model.js'
import { Types } from 'mongoose'
import { TrackerRuleModel } from '../trackerRule/trackerRule.model.js'

// export async function getAllDevicesService(userId: Types.ObjectId) {
//   const devices = await DeviceModel.find({ ownerUserId: new Types.ObjectId(userId) }).select(
//     'deviceId name lastLocation lastSeenAt status'
//   )

//   const gg = await TrackerRuleModel.find({userId})
//   console.log
//   return gg
// }
export async function getDeviceByIdService(
  userId: Types.ObjectId,
  deviceId: Types.ObjectId
) {
  const device = await DeviceModel.findOne({
    _id: deviceId,
    ownerUserId: userId,
  }).select("name lastLocation lastSeenAt status");

  return device;
}