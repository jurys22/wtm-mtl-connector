import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { getDatabase, saveDatabase } from '../db';
import { UserModel } from '../models/user.model';

export class ProfileController {
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const db = await getDatabase();
      const userModel = new UserModel(db);

      const user = userModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(userModel.toResponse(user));
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to fetch profile' });
    }
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { display_name, networking_intention, industry, tech_skills, soft_skills } = req.body;

      const db = await getDatabase();
      const userModel = new UserModel(db);

      // Check if user exists
      const user = userModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update user profile
      const updated = userModel.update(req.user.userId, {
        display_name: display_name || user.display_name,
        networking_intention: networking_intention || user.networking_intention,
        industry: industry || user.industry,
        tech_skills: tech_skills || user.tech_skills,
        soft_skills: soft_skills || user.soft_skills
      });

      if (!updated) {
        res.status(500).json({ error: 'Failed to update profile' });
        return;
      }

      // Save database
      saveDatabase();

      // Get updated user
      const updatedUser = userModel.findById(req.user.userId);
      if (!updatedUser) {
        res.status(500).json({ error: 'Failed to fetch updated profile' });
        return;
      }

      res.status(200).json({
        message: 'Profile updated successfully',
        user: userModel.toResponse(updatedUser)
      });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Failed to update profile' });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const db = await getDatabase();
      const userModel = new UserModel(db);

      const users = userModel.findAll();
      
      // Exclude current user from the list
      const otherUsers = users
        .filter(u => u.id !== req.user!.userId)
        .map(u => userModel.toResponse(u));

      res.status(200).json({
        users: otherUsers,
        total: otherUsers.length
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const db = await getDatabase();
      const userModel = new UserModel(db);

      const user = userModel.findById(userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json(userModel.toResponse(user));
    } catch (error) {
      console.error('Get user by ID error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }
}
