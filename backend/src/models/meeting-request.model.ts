import { getDatabase, saveDatabase } from '../db/index.js';

export interface MeetingRequest {
  id: number;
  requester_id: number;
  recipient_id: number;
  proposed_time: string;
  proposed_place: 'Main corridor' | 'Garden';
  note: string | null;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled' | 'unconfirmed';
  created_at: string;
  updated_at: string;
}

export interface MeetingRequestWithUsers extends MeetingRequest {
  requester_name: string;
  requester_email: string;
  recipient_name: string;
  recipient_email: string;
}

export interface CreateMeetingRequestDto {
  recipient_id: number;
  proposed_time: string;
  proposed_place: 'Main corridor' | 'Garden';
  note?: string;
}

export class MeetingRequestModel {
  /**
   * Create a new meeting request
   */
  async create(requester_id: number, data: CreateMeetingRequestDto): Promise<MeetingRequest> {
    const db = await getDatabase();

    // Validate note length
    if (data.note && data.note.length > 200) {
      throw new Error('Note must not exceed 200 characters');
    }

    // Check if requester and recipient are different
    if (requester_id === data.recipient_id) {
      throw new Error('Cannot send meeting request to yourself');
    }

    // Check if recipient exists
    const recipientResult = db.exec(
      'SELECT id FROM users WHERE id = ?',
      [data.recipient_id]
    );

    if (recipientResult.length === 0 || recipientResult[0].values.length === 0) {
      throw new Error('Recipient not found');
    }

    // Check for existing pending request between these users (in either direction)
    const existingResult = db.exec(
      `SELECT id FROM meeting_requests
       WHERE ((requester_id = ? AND recipient_id = ?) OR (requester_id = ? AND recipient_id = ?))
       AND status = 'pending'`,
      [requester_id, data.recipient_id, data.recipient_id, requester_id]
    );

    if (existingResult.length > 0 && existingResult[0].values.length > 0) {
      throw new Error('A pending meeting request already exists between these users');
    }

    // Insert the meeting request
    db.run(
      `INSERT INTO meeting_requests (requester_id, recipient_id, proposed_time, proposed_place, note, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [requester_id, data.recipient_id, data.proposed_time, data.proposed_place, data.note || null]
    );

    await saveDatabase();

    // Get the inserted record
    const result = db.exec(
      'SELECT * FROM meeting_requests WHERE requester_id = ? AND recipient_id = ? ORDER BY id DESC LIMIT 1',
      [requester_id, data.recipient_id]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      throw new Error('Failed to create meeting request');
    }

    return this.mapRowToMeetingRequest(result[0].columns, result[0].values[0]);
  }

  /**
   * Get all meeting requests for a user's inbox (where they are the recipient)
   */
  async getInbox(userId: number): Promise<MeetingRequestWithUsers[]> {
    const db = await getDatabase();

    const result = db.exec(
      `SELECT
        mr.*,
        requester.display_name as requester_name,
        requester.email as requester_email,
        recipient.display_name as recipient_name,
        recipient.email as recipient_email
       FROM meeting_requests mr
       INNER JOIN users requester ON mr.requester_id = requester.id
       INNER JOIN users recipient ON mr.recipient_id = recipient.id
       WHERE mr.recipient_id = ?
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    if (result.length === 0) {
      return [];
    }

    return result[0].values.map(row => this.mapRowToMeetingRequestWithUsers(result[0].columns, row));
  }

  /**
   * Get all meeting requests sent by a user (where they are the requester)
   */
  async getOutbox(userId: number): Promise<MeetingRequestWithUsers[]> {
    const db = await getDatabase();

    const result = db.exec(
      `SELECT
        mr.*,
        requester.display_name as requester_name,
        requester.email as requester_email,
        recipient.display_name as recipient_name,
        recipient.email as recipient_email
       FROM meeting_requests mr
       INNER JOIN users requester ON mr.requester_id = requester.id
       INNER JOIN users recipient ON mr.recipient_id = recipient.id
       WHERE mr.requester_id = ?
       ORDER BY mr.created_at DESC`,
      [userId]
    );

    if (result.length === 0) {
      return [];
    }

    return result[0].values.map(row => this.mapRowToMeetingRequestWithUsers(result[0].columns, row));
  }

  /**
   * Get a meeting request by ID
   */
  async findById(id: number): Promise<MeetingRequestWithUsers | null> {
    const db = await getDatabase();

    const result = db.exec(
      `SELECT
        mr.*,
        requester.display_name as requester_name,
        requester.email as requester_email,
        recipient.display_name as recipient_name,
        recipient.email as recipient_email
       FROM meeting_requests mr
       INNER JOIN users requester ON mr.requester_id = requester.id
       INNER JOIN users recipient ON mr.recipient_id = recipient.id
       WHERE mr.id = ?`,
      [id]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return null;
    }

    return this.mapRowToMeetingRequestWithUsers(result[0].columns, result[0].values[0]);
  }

  /**
   * Update meeting request status (accept or decline)
   */
  async updateStatus(id: number, status: 'accepted' | 'declined'): Promise<boolean> {
    const db = await getDatabase();

    // Check if the request exists and is pending
    const checkResult = db.exec(
      'SELECT status FROM meeting_requests WHERE id = ?',
      [id]
    );

    if (checkResult.length === 0 || checkResult[0].values.length === 0) {
      return false;
    }

    const currentStatus = checkResult[0].values[0][0];
    if (currentStatus !== 'pending') {
      throw new Error('Can only accept or decline pending meeting requests');
    }

    db.run(
      'UPDATE meeting_requests SET status = ? WHERE id = ?',
      [status, id]
    );

    await saveDatabase();
    return true;
  }

  /**
   * Cancel a pending meeting request (requester only)
   */
  async cancel(id: number, userId: number): Promise<boolean> {
    try {
      const db = await getDatabase();

      // Check if the request exists and get its current status
      const checkResult = db.exec(
        'SELECT status, requester_id FROM meeting_requests WHERE id = ?',
        [id]
      );

      if (checkResult.length === 0 || checkResult[0].values.length === 0) {
        console.error(`Cancel failed: Meeting request ${id} not found`);
        throw new Error('Meeting request not found');
      }

      const currentStatus = checkResult[0].values[0][0] as string;
      const requesterId = checkResult[0].values[0][1] as number;

      // Only the requester can cancel
      if (requesterId !== userId) {
        console.error(`Cancel failed: User ${userId} is not the requester (${requesterId}) for meeting request ${id}`);
        throw new Error('Only the requester can cancel a meeting request');
      }

      // Can only cancel pending requests
      if (currentStatus !== 'pending') {
        console.error(`Cancel failed: Meeting request ${id} has status '${currentStatus}', expected 'pending'`);
        throw new Error(`Can only cancel pending meeting requests. Current status: ${currentStatus}`);
      }

      // Delete the pending request (no need to keep cancelled pending requests)
      db.run(
        'DELETE FROM meeting_requests WHERE id = ?',
        [id]
      );

      // Save database changes
      await saveDatabase();

      console.log(`Meeting request ${id} successfully cancelled (deleted) by user ${userId}`);
      return true;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof Error && error.message.includes('Meeting request')) {
        throw error;
      }

      // Log and wrap unexpected errors
      console.error(`Unexpected error cancelling meeting request ${id}:`, error);
      throw new Error('Failed to cancel meeting request due to database error');
    }
  }

  /**
   * Unconfirm an accepted meeting request (either party can unconfirm)
   */
  async unconfirm(id: number, userId: number): Promise<boolean> {
    try {
      const db = await getDatabase();

      // Check if the request exists and get its current status
      const checkResult = db.exec(
        'SELECT status, requester_id, recipient_id FROM meeting_requests WHERE id = ?',
        [id]
      );

      if (checkResult.length === 0 || checkResult[0].values.length === 0) {
        console.error(`Unconfirm failed: Meeting request ${id} not found`);
        throw new Error('Meeting request not found');
      }

      const currentStatus = checkResult[0].values[0][0] as string;
      const requesterId = checkResult[0].values[0][1] as number;
      const recipientId = checkResult[0].values[0][2] as number;

      // Only requester or recipient can unconfirm
      if (requesterId !== userId && recipientId !== userId) {
        console.error(`Unconfirm failed: User ${userId} is not involved in meeting request ${id} (requester: ${requesterId}, recipient: ${recipientId})`);
        throw new Error('Only parties involved in the meeting can unconfirm it');
      }

      // Can only unconfirm accepted requests
      if (currentStatus !== 'accepted') {
        console.error(`Unconfirm failed: Meeting request ${id} has status '${currentStatus}', expected 'accepted'`);
        throw new Error(`Can only unconfirm accepted meeting requests. Current status: ${currentStatus}`);
      }

      // Perform the update - set back to pending
      db.run(
        'UPDATE meeting_requests SET status = ? WHERE id = ?',
        ['pending', id]
      );

      // Save database changes
      await saveDatabase();

      console.log(`Meeting request ${id} successfully unconfirmed by user ${userId}`);
      return true;
    } catch (error) {
      // Re-throw known errors
      if (error instanceof Error && error.message.includes('Meeting request') || error instanceof Error && error.message.includes('parties')) {
        throw error;
      }

      // Log and wrap unexpected errors
      console.error(`Unexpected error unconfirming meeting request ${id}:`, error);
      throw new Error('Failed to unconfirm meeting request due to database error');
    }
  }

  /**
   * Check if a proposed meeting time conflicts with user's scheduled sessions
   */
  async checkTimeConflict(userId: number, proposedTime: string): Promise<{ hasConflict: boolean; conflictingSession?: string }> {
    const db = await getDatabase();

    // Get all user's sessions
    const result = db.exec(
      `SELECT s.title, s.start_time, s.end_time
       FROM sessions s
       INNER JOIN user_sessions us ON s.id = us.session_id
       WHERE us.user_id = ?`,
      [userId]
    );

    if (result.length === 0 || result[0].values.length === 0) {
      return { hasConflict: false };
    }

    const proposedDate = new Date(proposedTime);

    for (const row of result[0].values) {
      const startTime = new Date(row[1] as string);
      const endTime = new Date(row[2] as string);

      // Check if proposed time falls within any session time
      if (proposedDate >= startTime && proposedDate < endTime) {
        return {
          hasConflict: true,
          conflictingSession: row[0] as string
        };
      }
    }

    return { hasConflict: false };
  }

  /**
   * Map database row to MeetingRequest object
   */
  private mapRowToMeetingRequest(columns: string[], values: any[]): MeetingRequest {
    const obj: any = {};
    columns.forEach((col, index) => {
      obj[col] = values[index];
    });

    return {
      id: obj.id,
      requester_id: obj.requester_id,
      recipient_id: obj.recipient_id,
      proposed_time: obj.proposed_time,
      proposed_place: obj.proposed_place,
      note: obj.note,
      status: obj.status,
      created_at: obj.created_at,
      updated_at: obj.updated_at
    };
  }

  /**
   * Map database row to MeetingRequestWithUsers object
   */
  private mapRowToMeetingRequestWithUsers(columns: string[], values: any[]): MeetingRequestWithUsers {
    const obj: any = {};
    columns.forEach((col, index) => {
      obj[col] = values[index];
    });

    return {
      id: obj.id,
      requester_id: obj.requester_id,
      recipient_id: obj.recipient_id,
      proposed_time: obj.proposed_time,
      proposed_place: obj.proposed_place,
      note: obj.note,
      status: obj.status,
      created_at: obj.created_at,
      updated_at: obj.updated_at,
      requester_name: obj.requester_name,
      requester_email: obj.requester_email,
      recipient_name: obj.recipient_name,
      recipient_email: obj.recipient_email
    };
  }
}
