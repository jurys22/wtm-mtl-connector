import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import sessionsRoutes from './sessions.routes';
import matchingRoutes from './matching.routes';
import meetingRequestsRoutes from './meeting-requests.routes';
import adminRoutes from './admin.routes';

const router = Router();

// Mount route modules
router.use('/auth', authRoutes);
router.use('/users', profileRoutes);
router.use('/schedule', sessionsRoutes);
router.use('/matching', matchingRoutes);
router.use('/meeting-requests', meetingRequestsRoutes);
router.use('/admin', adminRoutes);

export default router;
