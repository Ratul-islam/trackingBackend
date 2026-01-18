import mongoose from "mongoose";
import { AlertModel } from "./alerts.model"
import { AppError } from "../../utils/AppError";
import { TrackerRuleModel } from "../trackerRule/trackerRule.model";



export async function getAlertById(userId: string, alertId: String) {  
const alert = await AlertModel.findOne({ _id: alertId, userId })
  return alert;
}


export async function getAllAlertsByUserId(userId: string) {  
const alerts = await AlertModel.find({ userId }).sort({ createdAt: -1 });
  return alerts; 
}


export async function acknowledgeAlertService(userId: string, alertId: string) {
  if (!mongoose.isValidObjectId(alertId)) throw new AppError('Invalid alertId', 400)

  const alert = await AlertModel.findOne({ _id: alertId, userId })
  if (!alert) throw new AppError('Alert not found', 404)

  if (!alert.acknowledged) {
    alert.acknowledged = true
    alert.acknowledgedAt = new Date()
    await alert.save()
  }

  await TrackerRuleModel.updateOne(
    { userId, deviceId: alert.deviceId },
    { $set: { alertSuppressed: true } }
  )

  return { success: true }
}