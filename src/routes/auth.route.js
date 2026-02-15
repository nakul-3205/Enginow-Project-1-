import { Router } from 'express';
import authController from '../controllers/auth.controller.js';
import { protect, adminOnly } from '../middleware/auth.middleware.js';
import ApiResponse from '../utils/ApiResponse.js';
const router = Router();

// Public Routes
router.post('/signup', authController.signup);
router.post('/verify', authController.verify);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);

// Protected Routes (User must be logged in)
router.post('/logout', protect, authController.logout);
router.get('/me', protect, (req, res) => {
    res.status(200).json(new ApiResponse(200, req.user, "User profile fetched"));
});

// Admin/Protected Routes
router.get('/users', protect, adminOnly, authController.listUsers);
router.put('/users/:id', protect, authController.update);
router.delete('/users/:id', protect, adminOnly, authController.remove);

export default router;