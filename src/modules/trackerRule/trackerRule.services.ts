import { TrackerRuleModel } from './trackerRule.model.js'
import { Types } from 'mongoose'

export async function upsertRuleService(
  userId: string,
  deviceId: string,
  payload: any
) {
  return TrackerRuleModel.findOneAndUpdate(
    { userId: new Types.ObjectId(userId), deviceId },
    { ...payload, userId, deviceId },
    { upsert: true, new: true }
  )
}

export async function getRuleService(userId: string, deviceId: string) {
  return TrackerRuleModel.findOne({
    userId: userId,
    deviceId,
  })
}
