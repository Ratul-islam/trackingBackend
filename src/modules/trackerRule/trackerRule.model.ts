import mongoose, { Types } from 'mongoose'

export interface ITrackerRule {
  _id: Types.ObjectId
  deviceId: string
  userId: Types.ObjectId

  home: {
    lat: number
    lng: number
    radius: number
  }

  destinations: {
    lat: number
    lng: number
    radius: number
  }[]

  timerSeconds: number
  isActive: boolean
}

const trackerRuleSchema = new mongoose.Schema<ITrackerRule>(
  {
    deviceId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    home: {
      lat: Number,
      lng: Number,
      radius: Number,
    },

    destinations: [
      {
        lat: Number,
        lng: Number,
        radius: Number,
      },
    ],

    timerSeconds: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const TrackerRuleModel = mongoose.model<ITrackerRule>(
  'TrackerRule',
  trackerRuleSchema
)
