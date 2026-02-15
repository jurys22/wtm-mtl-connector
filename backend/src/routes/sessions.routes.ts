import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const sessionsController = new SessionsController();

// All routes require authentication
router.use(authenticateToken);

// Session routes
router.get('/sessions', sessionsController.getAllSessions.bind(sessionsController));
router.get('/user-sessions', sessionsController.getUserSessions.bind(sessionsController));
router.post('/user-sessions', sessionsController.addUserSession.bind(sessionsController));
router.delete('/user-sessions/:sessionId', sessionsController.removeUserSession.bind(sessionsController));

export default router;
