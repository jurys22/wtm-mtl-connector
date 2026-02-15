import { Router } from 'express';
import { MatchingController } from '../controllers/matching.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();
const matchingController = new MatchingController();

// All routes require authentication
router.use(authenticateToken);

router.get('/matches', matchingController.getMatches.bind(matchingController));

export default router;
