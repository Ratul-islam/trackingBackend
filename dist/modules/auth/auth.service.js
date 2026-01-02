import bcrypt from 'bcrypt';
import { AppError } from '../../utils/AppError.js';
import { createOTP, verifyOTP } from '../otp/otp.sevice.js';
import { createUser, getUserBy, getUserByIdUpdateRefreshToken } from '../user/user.service.js';
import { sendOTPEmail } from '../notification/notification.service.js';
export const hashPassword = async (password) => {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
};
export const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const registerUser = async (firstName, lastName, email, password) => {
    const exists = await getUserBy({ email });
    if (exists)
        if (exists.isVerified) {
            throw new AppError('User already exists', 400);
        }
        else {
            return { id: exists._id, firstName: exists.firstName, lastName: exists.lastName, email: exists.email, isVerified: exists.isVerified };
            ;
        }
    const hashed = await hashPassword(password);
    const user = await createUser(firstName, lastName, email, hashed, false);
    return { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isVerified: user.isVerified };
};
export const loginUser = async (email, password) => {
    const user = await getUserBy({ email });
    if (!user)
        throw new AppError('Invalid credentials', 401);
    const valid = await verifyPassword(password, user.password);
    if (!valid)
        throw new AppError('Invalid credentials', 401);
    return user;
};
export async function verifyUserOTP(email, code, type) {
    const user = await getUserBy({ email });
    if (!user)
        throw new Error('User not found');
    const valid = await verifyOTP(user._id, code, type);
    if (!valid)
        throw new Error('Invalid or expired OTP');
    if (type === 'EMAIL_VERIFICATION') {
        user.isVerified = true;
        await user.save();
        return { message: 'Email verified successfully' };
    }
    if (type === 'PASSWORD_RESET') {
        return { message: 'OTP verified, user can reset password', userId: user._id };
    }
    throw new Error('Unknown OTP type');
}
export const saveRefreshToken = async (userId, token) => {
    await getUserByIdUpdateRefreshToken(userId, token);
};
export const verifyRefreshToken = async (token) => {
    const user = await getUserBy({ refreshToken: token });
    if (!user)
        throw new AppError('Invalid refresh token', 401);
    return user;
};
export async function revokeRefreshToken(refreshToken) {
    const user = await getUserBy({ refreshToken });
    if (!user)
        return false;
    user.refreshToken = undefined;
    await user.save();
    return true;
}
export const requestPasswordReset = async (fastify, email) => {
    const user = await getUserBy({ email });
    if (!user) {
        return;
    }
    const otp = await createOTP(user._id, 'PASSWORD_RESET', 6, 10);
    sendOTPEmail(fastify, email, otp, 'PASSWORD_RESET', 10);
};
export const resetPassword = async (email, code, newPassword) => {
    const user = await getUserBy({ email });
    if (!user)
        throw new AppError('User not found', 404);
    await verifyOTP(user._id, code, 'PASSWORD_RESET');
    user.password = await hashPassword(newPassword);
    await user.save();
    return;
};
