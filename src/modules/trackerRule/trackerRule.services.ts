import { AppError } from '../../utils/AppError.js'
import { getDeviceDetails } from '../device/device.service.js'
import { TrackerRuleModel } from './trackerRule.model.js'
import { Types } from 'mongoose'

type Geofence = {
  lat: number
  lng: number
  radiusMeters: number
}

export type UpsertTrackerRulePayload = {
  isActive?: boolean
  timerSeconds: number
  home: Geofence
  destinations: Geofence[] 
  resetTrip?: boolean
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === 'number' && Number.isFinite(n)
}

function validateGeofence(g: any, fieldName: string) {
  if (!g || typeof g !== 'object') {
    throw new AppError(`${fieldName} is required`, 400)
  }

  if (!isFiniteNumber(g.lat) || g.lat < -90 || g.lat > 90) {
    throw new AppError(`${fieldName}.lat must be a valid latitude`, 400)
  }

  if (!isFiniteNumber(g.lng) || g.lng < -180 || g.lng > 180) {
    throw new AppError(`${fieldName}.lng must be a valid longitude`, 400)
  }

  if (
    !isFiniteNumber(g.radiusMeters) ||
    g.radiusMeters < 10 ||
    g.radiusMeters > 20000
  ) {
    throw new AppError(
      `${fieldName}.radiusMeters must be between 10 and 20000`,
      400
    )
  }
}

function validatePayload(payload: UpsertTrackerRulePayload) {
  if (!payload || typeof payload !== 'object') {
    throw new AppError('Invalid body', 400)
  }

  if (
    !isFiniteNumber(payload.timerSeconds) ||
    payload.timerSeconds < 5 ||
    payload.timerSeconds > 24 * 60 * 60
  ) {
    throw new AppError('timerSeconds must be between 5 and 86400', 400)
  }

  validateGeofence(payload.home, 'home')

  if (!Array.isArray(payload.destinations)) {
    throw new AppError('destinations must be an array', 400)
  }

  if (payload.destinations.length === 0) {
    throw new AppError('destinations must have at least one item', 400)
  }

  payload.destinations.forEach((d, i) =>
    validateGeofence(d, `destinations[${i}]`)
  )

  if (payload.isActive !== undefined && typeof payload.isActive !== 'boolean') {
    throw new AppError('isActive must be boolean', 400)
  }

  if (payload.resetTrip !== undefined && typeof payload.resetTrip !== 'boolean') {
    throw new AppError('resetTrip must be boolean', 400)
  }
}

export async function upsertRuleService(
  userId: string,
  deviceId: string,
  payload: UpsertTrackerRulePayload
) {
  if (!Types.ObjectId.isValid(userId)) {
    throw new AppError("Invalid userId", 400);
  }
  if (!deviceId || typeof deviceId !== "string") {
    throw new AppError("Invalid deviceId", 400);
  }

  const device = await getDeviceDetails(deviceId, new Types.ObjectId(userId));
  validatePayload(payload);

  const userObjectId = new Types.ObjectId(userId);
  const deviceObjectId = device?._id; 

  const update: any = {
    $set: {
      userId: userObjectId,
      deviceId: deviceObjectId,
      isActive: payload.isActive ?? true,
      timerSeconds: payload.timerSeconds,
      home: payload.home,
      destinations: payload.destinations,
      lastEvaluatedAt: new Date(),
    },
    $setOnInsert: {
      tripStatus: "IDLE",
      alertSuppressed: false,
    },
  };

  if (payload.resetTrip) {
    update.$set.tripStatus = "IDLE";
    update.$set.alertSuppressed = false;
    update.$unset = {
      exitedHomeAt: "",
      deadlineAt: "",
      activeAlertId: "",
    };
  }

  const rule = await TrackerRuleModel.findOneAndUpdate(
    { userId: userObjectId, deviceId: deviceObjectId }, 
    update,
    { upsert: true, new: true, runValidators: true }
  );

  return rule;
}
export async function getRuleService(userId: Types.ObjectId, deviceId: Types.ObjectId) {
  if (!Types.ObjectId.isValid(userId)) throw new AppError("Invalid userId", 400);
  if (!Types.ObjectId.isValid(deviceId)) throw new AppError("Invalid deviceId", 400);

  return TrackerRuleModel.findOne({
    userId,    
    deviceId,  
  })
    .select("deviceId isActive timerSeconds home destinations tripStatus exitedHomeAt deadlineAt lastEvaluatedAt")
    .populate({
      path: "deviceId",
      select: "deviceId status name lastSeenAt lastLocation",
    });
}
export async function getAllRuleService(userId: Types.ObjectId) {
  if (!Types.ObjectId.isValid(userId)) throw new AppError("Invalid userId", 400);

  return TrackerRuleModel.find({
    userId,    
  })
    .select("deviceId isActive timerSeconds home destinations tripStatus exitedHomeAt deadlineAt lastEvaluatedAt")
    .populate({
      path: "deviceId",
      select: "deviceId status name lastSeenAt lastLocation",
    });
}
