import mongoose, { Types } from "mongoose";
import { IUser, UserDoc, UserModel } from "./user.model.js";


export async function createUser(firstName:string , lastName:string, email:string, password: string, isVerified=false){
    const user = await UserModel.create({ firstName, lastName, email, password, isVerified })
    return user;
}
type Query = { id?: string; email?: string; refreshToken?: string }

export async function getUserBy(query: Query): Promise<UserDoc | null> {
  if (query.id) {
    if (!mongoose.Types.ObjectId.isValid(query.id)) return null
    return UserModel.findById(query.id).exec()
  }

  const mongoQuery: any = {}
  if (query.email) mongoQuery.email = query.email
  if (query.refreshToken) mongoQuery.refreshToken = query.refreshToken

  if (Object.keys(mongoQuery).length === 0) {
    throw new Error('Provide at least one search field')
  }

  return UserModel.findOne(mongoQuery).exec()
}
export async function getUserByIdUpdateRefreshToken(userId: Types.ObjectId, token: string) {
    const status = await UserModel.findByIdAndUpdate(userId, { refreshToken: token })
    return status;
}