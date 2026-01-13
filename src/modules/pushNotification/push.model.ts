import mongoose from 'mongoose'

const pushTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    token: {
      type: String,
      unique: true,
      required: true,
    },
    platform: {
      type: String,
      enum: ['ios', 'android'],
    },
  },
  { timestamps: true }
)

export const PushTokenModel = mongoose.model(
  'PushToken',
  pushTokenSchema
)
