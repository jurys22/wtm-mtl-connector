import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getDatabase, saveDatabase } from '../db';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt.util';
import { generateResetToken, getResetTokenExpiry, hashResetToken } from '../utils/token.util';
import { config } from '../config';

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password, display_name, networking_intention, industry, tech_skills, soft_skills } = req.body;

      // Get database
      const db = await getDatabase();
      const userModel = new UserModel(db);

      // Check if user already exists
      const existingUser = userModel.findByEmail(email);
      if (existingUser) {
        res.status(409).json({ error: 'Email already registered' });
        return;
      }

      // Create user
      const user = await userModel.create({
        email,
        password,
        display_name,
        networking_intention,
        industry,
        tech_skills,
        soft_skills
      });

      // Save database
      saveDatabase();

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email
      });

      // Return user data and token
      res.status(201).json({
        user: userModel.toResponse(user),
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, password } = req.body;

      // Get database
      const db = await getDatabase();
      const userModel = new UserModel(db);

      // Find user
      const user = userModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verify password
      const isValidPassword = await userModel.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate token
      const token = generateToken({
        userId: user.id,
        email: user.email
      });

      // Return user data and token
      res.status(200).json({
        user: userModel.toResponse(user),
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get database
      const db = await getDatabase();
      const userModel = new UserModel(db);

      // Find user
      const user = userModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Return user data
      res.status(200).json(userModel.toResponse(user));
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  logout(req: Request, res: Response): void {
    // With JWT, logout is handled client-side by removing the token
    // This endpoint is here for completeness and potential future server-side session management
    res.status(200).json({ message: 'Logged out successfully' });
  }

  async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email } = req.body;

      // Get database
      const db = await getDatabase();
      const userModel = new UserModel(db);

      // Find user by email
      const user = userModel.findByEmail(email);

      // Security: Always return success even if user doesn't exist
      // This prevents email enumeration attacks
      if (!user) {
        res.status(200).json({
          message: 'If an account exists with that email, a reset token has been generated',
          // In development, hint that email doesn't exist
          ...(config.nodeEnv === 'development' && { dev_note: 'User not found' })
        });
        return;
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const hashedToken = hashResetToken(resetToken);
      const expiry = getResetTokenExpiry();

      // Store hashed token in database
      const success = await userModel.setResetToken(email, hashedToken, expiry);

      if (!success) {
        res.status(500).json({ error: 'Failed to generate reset token' });
        return;
      }

      // Save database
      saveDatabase();

      // In development: return token in response (no email sending)
      // In production: send email with token link
      if (config.nodeEnv === 'development') {
        res.status(200).json({
          message: 'Password reset token generated',
          token: resetToken, // Only in development!
          expiresIn: '1 hour',
          dev_note: 'In production, this would be sent via email'
        });
      } else {
        // TODO: Send email with reset link
        // const resetLink = `${config.frontendUrl}/reset-password?token=${resetToken}`;
        // await emailService.sendPasswordReset(user.email, resetLink);

        res.status(200).json({
          message: 'If an account exists with that email, a reset link has been sent'
        });
      }
    } catch (error) {
      console.error('Request password reset error:', error);
      res.status(500).json({ error: 'Failed to process password reset request' });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { token, password } = req.body;

      // Get database
      const db = await getDatabase();
      const userModel = new UserModel(db);

      // Hash token and find user (includes expiry check)
      const hashedToken = hashResetToken(token);
      const user = userModel.findByResetToken(hashedToken);

      if (!user) {
        res.status(400).json({
          error: 'Invalid or expired reset token'
        });
        return;
      }

      // Reset password (also clears reset token)
      const success = await userModel.resetPassword(user.id, password);

      if (!success) {
        res.status(500).json({ error: 'Failed to reset password' });
        return;
      }

      // Save database
      saveDatabase();

      // Generate new JWT token for automatic login
      const authToken = generateToken({
        userId: user.id,
        email: user.email
      });

      // Return user data and token (auto-login)
      res.status(200).json({
        message: 'Password reset successful',
        user: userModel.toResponse(user),
        token: authToken
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Failed to reset password' });
    }
  }
}
