import mongoose from 'mongoose'

export interface IAlert {
  userId: mongoose.Types.ObjectId
  deviceId: string
  message: string
  type: 'ALERT' | 'INFO'
  createdAt: Date
  acknowledged: boolean
  acknowledgedAt?: Date
}

const alertSchema = new mongoose.Schema<IAlert>({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deviceId: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['ALERT', 'INFO'], default: 'ALERT' },
  acknowledged: { type: Boolean, default: false },
  acknowledgedAt: { type: Date },
}, { timestamps: true })

export const AlertModel = mongoose.model<IAlert>('Alert', alertSchema)
