import mongoose from "mongoose";
import { UserModel } from "./user.model.js";
export async function createUser(firstName, lastName, email, password, isVerified = false) {
    const user = await UserModel.create({ firstName, lastName, email, password, isVerified });
    return user;
}
export async function getUserBy(query) {
    if (query.id) {
        if (!mongoose.Types.ObjectId.isValid(query.id))
            return null;
        return UserModel.findById(query.id).exec();
    }
    const mongoQuery = {};
    if (query.email)
        mongoQuery.email = query.email;
    if (query.refreshToken)
        mongoQuery.refreshToken = query.refreshToken;
    if (Object.keys(mongoQuery).length === 0) {
        throw new Error('Provide at least one search field');
    }
    return UserModel.findOne(mongoQuery).exec();
}
export async function getUserByIdUpdateRefreshToken(userId, token) {
    const status = await UserModel.findByIdAndUpdate(userId, { refreshToken: token });
    return status;
}
