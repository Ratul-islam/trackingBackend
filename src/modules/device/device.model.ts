import mongoose, { HydratedDocument, Types } from 'mongoose'

export interface IDevice {
  _id: Types.ObjectId
  deviceId: string
  deviceSecretHash: string
  ownerUserId?: Types.ObjectId
  status: 'UNPAIRED' | 'PAIRED'
  name?: string 
  lastLocation?: { lat: number; lng: number }
  lastSeenAt?: Date
}

const deviceSchema = new mongoose.Schema<IDevice>(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    deviceSecretHash: { type: String, required: true },
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['UNPAIRED', 'PAIRED'],
      default: 'UNPAIRED',
    },
    name: { type: String, default: '' },
    lastLocation: { lat: Number, lng: Number },
    lastSeenAt: Date,
  },
  { timestamps: true }
)

export const DeviceModel = mongoose.model<IDevice>('Device', deviceSchema)
export type DeviceDoc = HydratedDocument<IDevice>
