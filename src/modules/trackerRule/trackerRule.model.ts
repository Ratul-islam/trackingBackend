import mongoose, { HydratedDocument, Types } from 'mongoose'

export type TripStatus = 'IDLE' | 'OUTSIDE_HOME' | 'IN_DESTINATION' | 'ALERTED'



export interface ITrackerRule {
  _id: Types.ObjectId;

  userId: Types.ObjectId;
  deviceId: Types.ObjectId;

  isActive: boolean;
  timerSeconds: number;
  home: { lat: number; lng: number; radiusMeters: number };
  destinations: { lat: number; lng: number; radiusMeters: number }[];

  tripStatus: TripStatus;
  exitedHomeAt?: Date;
  deadlineAt?: Date;

  activeAlertId?: Types.ObjectId;
  alertSuppressed?: boolean;

  lastEvaluatedAt?: Date;
}

const trackerRuleSchema = new mongoose.Schema<ITrackerRule>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deviceId: { type: mongoose.Schema.Types.ObjectId,ref: 'Device',required: true, index: true },

    isActive: { type: Boolean, default: true },
    timerSeconds: { type: Number, required: true, min: 5 },

    home: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      radiusMeters: { type: Number, required: true, min: 10 },
    },

    destinations: [
      {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        radiusMeters: { type: Number, required: true, min: 10 },
      },
    ],

    tripStatus: {
      type: String,
      enum: ['IDLE', 'OUTSIDE_HOME', 'IN_DESTINATION', 'ALERTED'],
      default: 'IDLE',
      index: true,
    },

    exitedHomeAt: { type: Date },
    deadlineAt: { type: Date, index: true },

    activeAlertId: { type: mongoose.Schema.Types.ObjectId, ref: 'Alert' },
    alertSuppressed: { type: Boolean, default: false },

    lastEvaluatedAt: { type: Date },
  },
  { timestamps: true }
)

trackerRuleSchema.index({ isActive: 1, deadlineAt: 1, tripStatus: 1 })

export const TrackerRuleModel = mongoose.model<ITrackerRule>('TrackerRule', trackerRuleSchema)
export type TrackerRuleDoc = HydratedDocument<ITrackerRule>
