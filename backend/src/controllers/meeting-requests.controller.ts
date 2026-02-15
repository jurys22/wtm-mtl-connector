import { Request, Response } from 'express';
import { MeetingRequestModel, CreateMeetingRequestDto } from '../models/meeting-request.model.js';
import { body, validationResult } from 'express-validator';
import { config } from '../config/index.js';

const meetingRequestModel = new MeetingRequestModel();

export class MeetingRequestsController {
  /**
   * Validation rules for creating a meeting request
   */
  static createValidationRules() {
    return [
      body('recipient_id')
        .isInt({ min: 1 })
        .withMessage('Recipient ID must be a positive integer'),
      body('proposed_time')
        .isISO8601()
        .withMessage('Proposed time must be a valid ISO 8601 datetime')
        .custom((value) => {
          const proposedDate = new Date(value);
          const now = new Date();
          if (proposedDate < now) {
            throw new Error('Proposed time must be in the future');
          }

          // Check if the date is on the event date (April 18th, 2026)
          // Use UTC methods to avoid timezone issues
          const eventDate = new Date(config.event.date);
          const proposedDateOnly = new Date(Date.UTC(proposedDate.getUTCFullYear(), proposedDate.getUTCMonth(), proposedDate.getUTCDate()));
          const eventDateOnly = new Date(Date.UTC(eventDate.getUTCFullYear(), eventDate.getUTCMonth(), eventDate.getUTCDate()));

          if (proposedDateOnly.getTime() !== eventDateOnly.getTime()) {
            throw new Error(`Meeting requests can only be scheduled for ${config.event.displayDate}`);
          }

          return true;
        }),
      body('proposed_place')
        .isIn(['Main corridor', 'Garden'])
        .withMessage('Proposed place must be either "Main corridor" or "Garden"'),
      body('note')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Note must not exceed 200 characters')
    ];
  }

  /**
   * Create a new meeting request
   * POST /api/meeting-requests
   */
  async createMeetingRequest(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const requesterId = req.user!.userId;
      const data: CreateMeetingRequestDto = {
        recipient_id: req.body.recipient_id,
        proposed_time: req.body.proposed_time,
        proposed_place: req.body.proposed_place,
        note: req.body.note
      };

      // Check for time conflicts with requester's schedule
      const requesterConflict = await meetingRequestModel.checkTimeConflict(
        requesterId,
        data.proposed_time
      );

      if (requesterConflict.hasConflict) {
        res.status(409).json({
          errorCode: 'TIME_CONFLICT_REQUESTER',
          error: 'Time conflict with your scheduled session',
          conflictingSession: requesterConflict.conflictingSession,
          details: {
            sessionName: requesterConflict.conflictingSession
          }
        });
        return;
      }

      // Check for time conflicts with recipient's schedule
      const recipientConflict = await meetingRequestModel.checkTimeConflict(
        data.recipient_id,
        data.proposed_time
      );

      if (recipientConflict.hasConflict) {
        res.status(409).json({
          errorCode: 'TIME_CONFLICT_RECIPIENT',
          error: 'Time conflict with recipient\'s scheduled session',
          conflictingSession: recipientConflict.conflictingSession,
          details: {
            sessionName: recipientConflict.conflictingSession
          }
        });
        return;
      }

      const meetingRequest = await meetingRequestModel.create(requesterId, data);

      res.status(201).json({
        message: 'Meeting request sent successfully',
        meetingRequest
      });
    } catch (error: any) {
      if (error.message === 'Recipient not found') {
        res.status(404).json({
          errorCode: 'RECIPIENT_NOT_FOUND',
          error: error.message
        });
        return;
      }

      if (error.message === 'Cannot send meeting request to yourself') {
        res.status(400).json({
          errorCode: 'SELF_REQUEST',
          error: error.message
        });
        return;
      }

      if (error.message === 'A pending meeting request already exists between these users') {
        res.status(409).json({
          errorCode: 'DUPLICATE_REQUEST',
          error: error.message
        });
        return;
      }

      console.error('Error creating meeting request:', error);
      res.status(500).json({
        errorCode: 'SERVER_ERROR',
        error: 'Failed to create meeting request. Please try again in a few moments.'
      });
    }
  }

  /**
   * Get meeting requests inbox (where user is the recipient)
   * GET /api/meeting-requests/inbox
   */
  async getInbox(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const meetingRequests = await meetingRequestModel.getInbox(userId);

      res.json({
        meetingRequests,
        count: meetingRequests.length
      });
    } catch (error) {
      console.error('Error fetching inbox:', error);
      res.status(500).json({ error: 'Failed to fetch meeting requests' });
    }
  }

  /**
   * Get meeting requests outbox (where user is the requester)
   * GET /api/meeting-requests/outbox
   */
  async getOutbox(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const meetingRequests = await meetingRequestModel.getOutbox(userId);

      res.json({
        meetingRequests,
        count: meetingRequests.length
      });
    } catch (error) {
      console.error('Error fetching outbox:', error);
      res.status(500).json({ error: 'Failed to fetch meeting requests' });
    }
  }

  /**
   * Accept a meeting request
   * PUT /api/meeting-requests/:id/accept
   */
  async acceptMeetingRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user!.userId;

      // Get the meeting request
      const meetingRequest = await meetingRequestModel.findById(requestId);

      if (!meetingRequest) {
        res.status(404).json({ error: 'Meeting request not found' });
        return;
      }

      // Check if the current user is the recipient
      if (meetingRequest.recipient_id !== userId) {
        res.status(403).json({ error: 'You can only accept meeting requests sent to you' });
        return;
      }

      await meetingRequestModel.updateStatus(requestId, 'accepted');

      res.json({
        message: 'Meeting request accepted',
        meetingRequest: await meetingRequestModel.findById(requestId)
      });
    } catch (error: any) {
      if (error.message === 'Can only accept or decline pending meeting requests') {
        res.status(400).json({ error: error.message });
        return;
      }

      console.error('Error accepting meeting request:', error);
      res.status(500).json({ error: 'Failed to accept meeting request' });
    }
  }

  /**
   * Decline a meeting request
   * PUT /api/meeting-requests/:id/decline
   */
  async declineMeetingRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user!.userId;

      // Get the meeting request
      const meetingRequest = await meetingRequestModel.findById(requestId);

      if (!meetingRequest) {
        res.status(404).json({ error: 'Meeting request not found' });
        return;
      }

      // Check if the current user is the recipient
      if (meetingRequest.recipient_id !== userId) {
        res.status(403).json({ error: 'You can only decline meeting requests sent to you' });
        return;
      }

      await meetingRequestModel.updateStatus(requestId, 'declined');

      res.json({
        message: 'Meeting request declined',
        meetingRequest: await meetingRequestModel.findById(requestId)
      });
    } catch (error: any) {
      if (error.message === 'Can only accept or decline pending meeting requests') {
        res.status(400).json({ error: error.message });
        return;
      }

      console.error('Error declining meeting request:', error);
      res.status(500).json({ error: 'Failed to decline meeting request' });
    }
  }

  /**
   * Cancel a pending meeting request (requester only)
   * PUT /api/meeting-requests/:id/cancel
   */
  async cancelMeetingRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user!.userId;

      if (isNaN(requestId) || requestId <= 0) {
        res.status(400).json({ error: 'Invalid request ID' });
        return;
      }

      await meetingRequestModel.cancel(requestId, userId);

      const updatedRequest = await meetingRequestModel.findById(requestId);

      res.json({
        message: 'Meeting request cancelled successfully',
        meetingRequest: updatedRequest
      });
    } catch (error: any) {
      console.error(`Error cancelling meeting request ${req.params.id}:`, error);

      if (error.message === 'Meeting request not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Only the requester can cancel a meeting request') {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message && error.message.startsWith('Can only cancel pending meeting requests')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to cancel meeting request. Please try again or contact support if the problem persists.'
      });
    }
  }

  /**
   * Unconfirm an accepted meeting request (either party)
   * PUT /api/meeting-requests/:id/unconfirm
   */
  async unconfirmMeetingRequest(req: Request, res: Response): Promise<void> {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user!.userId;

      if (isNaN(requestId) || requestId <= 0) {
        res.status(400).json({ error: 'Invalid request ID' });
        return;
      }

      await meetingRequestModel.unconfirm(requestId, userId);

      const updatedRequest = await meetingRequestModel.findById(requestId);

      res.json({
        message: 'Meeting unconfirmed successfully',
        meetingRequest: updatedRequest
      });
    } catch (error: any) {
      console.error(`Error unconfirming meeting request ${req.params.id}:`, error);

      if (error.message === 'Meeting request not found') {
        res.status(404).json({ error: error.message });
        return;
      }

      if (error.message === 'Only parties involved in the meeting can unconfirm it') {
        res.status(403).json({ error: error.message });
        return;
      }

      if (error.message && error.message.startsWith('Can only unconfirm accepted meeting requests')) {
        res.status(400).json({ error: error.message });
        return;
      }

      res.status(500).json({
        error: 'Failed to unconfirm meeting. Please try again or contact support if the problem persists.'
      });
    }
  }
}
