import { Request, Response } from 'express';
import { getDatabase, saveDatabase } from '../db';

interface Session {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  created_at: string;
}

interface UserSession {
  user_id: number;
  session_id: number;
}

export class SessionsController {
  async getAllSessions(req: Request, res: Response): Promise<void> {
    try {
      const db = await getDatabase();
      
      const result = db.exec('SELECT * FROM sessions ORDER BY start_time');
      
      if (result.length === 0 || !result[0].values) {
        res.status(200).json({ sessions: [] });
        return;
      }

      const sessions = result[0].values.map((row: any[]) => {
        const session: any = {};
        result[0].columns.forEach((col, index) => {
          session[col] = row[index];
        });
        return session;
      });

      res.status(200).json({ sessions, total: sessions.length });
    } catch (error) {
      console.error('Get sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch sessions' });
    }
  }

  async getUserSessions(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const db = await getDatabase();
      
      const result = db.exec(`
        SELECT s.* FROM sessions s
        INNER JOIN user_sessions us ON s.id = us.session_id
        WHERE us.user_id = ?
        ORDER BY s.start_time
      `, [req.user.userId]);

      if (result.length === 0 || !result[0].values) {
        res.status(200).json({ sessions: [] });
        return;
      }

      const sessions = result[0].values.map((row: any[]) => {
        const session: any = {};
        result[0].columns.forEach((col, index) => {
          session[col] = row[index];
        });
        return session;
      });

      res.status(200).json({ sessions, total: sessions.length });
    } catch (error) {
      console.error('Get user sessions error:', error);
      res.status(500).json({ error: 'Failed to fetch user sessions' });
    }
  }

  async addUserSession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { session_id } = req.body;

      if (!session_id) {
        res.status(400).json({ error: 'Session ID is required' });
        return;
      }

      const db = await getDatabase();

      // Check if session exists
      const sessionResult = db.exec('SELECT * FROM sessions WHERE id = ?', [session_id]);
      if (sessionResult.length === 0 || !sessionResult[0].values || sessionResult[0].values.length === 0) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      const sessionData = sessionResult[0].values[0];
      const sessionStartTime = sessionData[sessionResult[0].columns.indexOf('start_time')];
      const sessionEndTime = sessionData[sessionResult[0].columns.indexOf('end_time')];

      // Check for time conflicts with existing sessions
      const conflictResult = db.exec(`
        SELECT s.id, s.title FROM sessions s
        INNER JOIN user_sessions us ON s.id = us.session_id
        WHERE us.user_id = ?
        AND (
          (s.start_time <= ? AND s.end_time > ?) OR
          (s.start_time < ? AND s.end_time >= ?) OR
          (s.start_time >= ? AND s.end_time <= ?)
        )
      `, [req.user.userId, sessionStartTime, sessionStartTime, sessionEndTime, sessionEndTime, sessionStartTime, sessionEndTime]);

      if (conflictResult.length > 0 && conflictResult[0].values && conflictResult[0].values.length > 0) {
        const conflictingSession = conflictResult[0].values[0];
        const conflictTitle = conflictingSession[conflictResult[0].columns.indexOf('title')];
        res.status(409).json({ 
          error: 'Time conflict with another session',
          conflictingSession: conflictTitle
        });
        return;
      }

      // Check if already added
      const existingResult = db.exec(
        'SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ?',
        [req.user.userId, session_id]
      );

      if (existingResult.length > 0 && existingResult[0].values && existingResult[0].values.length > 0) {
        res.status(409).json({ error: 'Session already added' });
        return;
      }

      // Add session
      db.run(
        'INSERT INTO user_sessions (user_id, session_id) VALUES (?, ?)',
        [req.user.userId, session_id]
      );

      saveDatabase();

      res.status(201).json({ message: 'Session added successfully' });
    } catch (error) {
      console.error('Add user session error:', error);
      res.status(500).json({ error: 'Failed to add session' });
    }
  }

  async removeUserSession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const sessionId = parseInt(req.params.sessionId);

      if (isNaN(sessionId)) {
        res.status(400).json({ error: 'Invalid session ID' });
        return;
      }

      const db = await getDatabase();

      // Check if user has this session
      const existingResult = db.exec(
        'SELECT * FROM user_sessions WHERE user_id = ? AND session_id = ?',
        [req.user.userId, sessionId]
      );

      if (existingResult.length === 0 || !existingResult[0].values || existingResult[0].values.length === 0) {
        res.status(404).json({ error: 'Session not found in your schedule' });
        return;
      }

      // Remove session
      db.run(
        'DELETE FROM user_sessions WHERE user_id = ? AND session_id = ?',
        [req.user.userId, sessionId]
      );

      saveDatabase();

      res.status(200).json({ message: 'Session removed successfully' });
    } catch (error) {
      console.error('Remove user session error:', error);
      res.status(500).json({ error: 'Failed to remove session' });
    }
  }
}
