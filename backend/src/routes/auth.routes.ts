import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { registerValidation, loginValidation, requestPasswordResetValidation, resetPasswordValidation } from '../utils/validation.util';
import rateLimit from 'express-rate-limit';

const router = Router();
const authController = new AuthController();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// More restrictive rate limiter for password reset
const resetPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 requests per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Public routes
router.post('/register', registerValidation, authController.register.bind(authController));
router.post('/login', authLimiter, loginValidation, authController.login.bind(authController));
router.post('/request-password-reset', resetPasswordLimiter, requestPasswordResetValidation, authController.requestPasswordReset.bind(authController));
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidation, authController.resetPassword.bind(authController));

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile.bind(authController));
router.post('/logout', authenticateToken, authController.logout.bind(authController));

export default router;
