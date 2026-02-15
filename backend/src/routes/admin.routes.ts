import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();
const controller = new AdminController();

/**
 * Admin routes - database management endpoints
 *
 * SECURITY: These routes are only available in development/test environments
 * The controller itself blocks production usage
 */

// Reset database and seed with test users
router.post('/reset-database', controller.resetDatabase.bind(controller));

export default router;
