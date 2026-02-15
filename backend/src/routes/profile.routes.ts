import { Router } from 'express';
import { ProfileController } from '../controllers/profile.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { updateProfileValidation } from '../utils/profile-validation.util';

const router = Router();
const profileController = new ProfileController();

// All profile routes require authentication
router.use(authenticateToken);

// Profile management routes
router.get('/profile', profileController.getProfile.bind(profileController));
router.put('/profile', updateProfileValidation, profileController.updateProfile.bind(profileController));

// User discovery routes
router.get('/users', profileController.getAllUsers.bind(profileController));
router.get('/users/:id', profileController.getUserById.bind(profileController));

export default router;
