import { Router } from 'express';
import { MeetingRequestsController } from '../controllers/meeting-requests.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();
const controller = new MeetingRequestsController();

// All meeting request routes require authentication
router.use(authenticateToken);

// Create a new meeting request
router.post(
  '/',
  MeetingRequestsController.createValidationRules(),
  controller.createMeetingRequest.bind(controller)
);

// Get inbox (received requests)
router.get('/inbox', controller.getInbox.bind(controller));

// Get outbox (sent requests)
router.get('/outbox', controller.getOutbox.bind(controller));

// Accept a meeting request
router.put('/:id/accept', controller.acceptMeetingRequest.bind(controller));

// Decline a meeting request
router.put('/:id/decline', controller.declineMeetingRequest.bind(controller));

// Cancel a pending meeting request (requester only)
router.put('/:id/cancel', controller.cancelMeetingRequest.bind(controller));

// Unconfirm an accepted meeting request (either party)
router.put('/:id/unconfirm', controller.unconfirmMeetingRequest.bind(controller));

export default router;
