import { User } from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateTokens } from '../utils/token.util.js';
import { generateOTP, verifyOTP } from '../utils/otp.util.js';
import { sendOTPEmail } from '../utils/mail.util.js';
import kafkaInstance from '../config/kafka.js';
import redisClient from '../config/redis.js';
import { logger } from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';
import ApiResponse from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';

class AuthController {

    signup = asyncHandler(async (req, res) => {
        const { username, email, password ,roleRequested, adminSecret} = req.body;
        let finalRole
        const userExists = await User.findOne({ email });
        if (userExists) {
            throw new ApiError(400, "User already exists");
        }

        if (roleRequested === 'admin') {
            if (adminSecret !== process.env.ADMIN_SIGNUP_SECRET) {
                res.status(403);
                throw new ApiError("Invalid Admin Secret. Access Denied.");
            }
             finalRole = 'admin';
        }
        
        const user = await User.create({ username, email, password ,role:finalRole });
        const otp = await generateOTP(email);

        await sendOTPEmail(email, otp);
        
        logger.info(`Signup started for ${email}`);

        res.status(201).json(
            new ApiResponse(201, { userId: user._id }, "User registered. Verification OTP sent.")
        );
    })

    verify = asyncHandler(async (req, res) => {
        const { email, otp } = req.body;
        const isValid = await verifyOTP(email, otp);
        
        if (!isValid) {
            throw new ApiError(400, "Invalid or expired OTP");
        }

        const user = await User.findOneAndUpdate({ email }, { isVerified: true }, { new: true });
        
        await kafkaInstance.sendEvent('auth-events', { 
            type: 'SEND_WELCOME_EMAIL', 
            email: user.email 
        });

        const tokens = generateTokens(user._id);
        await redisClient.set(`refresh:${user._id}`, tokens.refreshToken, 'EX', 604800);
        res.status(200).json(
            new ApiResponse(200, tokens, "OTP verified successfully")
        );
    })

    login = asyncHandler(async (req, res) => {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && (await user.comparePassword(password))) {
            if (!user.isVerified) {
                throw new ApiError(403, "Account not verified");
            }

            const tokens = generateTokens(user._id);
            await redisClient.set(`refresh:${user._id}`, tokens.refreshToken, 'EX', 604800);

            res.status(200).json(
                new ApiResponse(200, { ...tokens, user: { id: user._id, username: user.username } }, "Login successful")
            );
        } else {
            throw new ApiError(401, "Invalid credentials");
        }
    })

    listUsers = asyncHandler(async (req, res) => {
        const { page = 1, limit = 10 } = req.query;
        const cacheKey = `users_list_p${page}`;

        const cached = await redisClient.get(cacheKey);
        if (cached) {
            const parsedCache = JSON.parse(cached);
            return res.status(200).json(
                new ApiResponse(200, parsedCache.data, "Users fetched from cache")
            );
        }

        const users = await User.find().select('-password').limit(limit * 1).skip((page - 1) * limit);
        const total = await User.countDocuments();
        
        const responseData = { data: users, total, page };
        await redisClient.set(cacheKey, JSON.stringify(responseData), 'EX', 180);

        res.status(200).json(
            new ApiResponse(200, responseData, "Users fetched successfully")
        );
    })

    update = asyncHandler(async (req, res) => {
        const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
        
        if (!updatedUser) {
            throw new ApiError(404, "User not found");
        }

        const keys = await redisClient.keys('users_list_*');
        if (keys.length > 0) await redisClient.del(keys);

        res.status(200).json(
            new ApiResponse(200, updatedUser, "User updated successfully")
        );
    });

    remove = asyncHandler(async (req, res) => {
        const user = await User.findByIdAndDelete(req.params.id);
        
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        await redisClient.del(`refresh:${req.params.id}`);
        res.status(200).json(
            new ApiResponse(200, null, "User deleted")
        );
    });

    logout = asyncHandler(async (req, res) => {
        await redisClient.del(`refresh:${req.user.id}`);
        res.status(200).json(
            new ApiResponse(200, null, "Logged out")
        );
    });

    refreshToken = asyncHandler(async (req, res) => {
    const { token } = req.body;
    if (!token) throw new ApiError(401, "Refresh Token is required");

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    
    const storedToken = await redisClient.get(`refresh:${decoded.id}`);
    if (storedToken !== token) throw new ApiError(403, "Invalid or expired refresh token");

    const tokens = generateTokens(decoded.id);

    res.status(200).json(new ApiResponse(200, tokens, "Token refreshed"));
});
}

export default new AuthController();