import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import { User } from '../models/user.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import ApiError from "../utils/ApiError.js"

export const protect = asyncHandler(async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                throw new ApiError(401, "User associated with this token no longer exists.");
            }

            next();
        } catch (error) {
            throw new ApiError(401, "Not authorized, token failed");
        }
    }

    if (!token) {
        throw new ApiError(401, "Not authorized, no token");
    }
});

export const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        throw new ApiError(403, "Access denied: Admins only");
    }
};