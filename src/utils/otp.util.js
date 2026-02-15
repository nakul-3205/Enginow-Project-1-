import redisClient from '../config/redis.js';
import { logger } from './logger.js';
import ApiError from "./ApiError.js"
export const generateOTP = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    try {
        await redisClient.set(`otp:${email}`, otp, 'EX', 300);
        return otp;
    } catch (error) {
        logger.error({ error }, "Error saving OTP to Redis");
        throw new ApiError("Could not generate OTP");
    }
};

export const verifyOTP = async (email, userOtp) => {
    const storedOtp = await redisClient.get(`otp:${email}`);
    if (!storedOtp) return false;
    return storedOtp === userOtp;
};