import { Request, Response } from 'express';
import { resetDatabase } from '../utils/dbReset.js';

export class AdminController {
  /**
   * Reset database and seed with test users
   * POST /api/admin/reset-database
   *
   * SECURITY: Only available in development/test environments
   */
  async resetDatabase(req: Request, res: Response): Promise<void> {
    try {
      const nodeEnv = process.env.NODE_ENV || 'development';

      // Safety check: Only allow in non-production
      if (nodeEnv === 'production') {
        res.status(403).json({
          error: 'Database reset is not allowed in production environment',
          environment: nodeEnv
        });
        return;
      }

      console.log(`\n🔄 API: Database reset requested (environment: ${nodeEnv})`);

      // Perform reset
      await resetDatabase();

      res.status(200).json({
        message: 'Database reset completed successfully',
        environment: nodeEnv,
        testUsers: [
          { email: 'sarah.developer@wtmmtl.com', password: 'Test123!' },
          { email: 'michael.pm@wtmmtl.com', password: 'Test123!' },
          { email: 'emily.datascience@wtmmtl.com', password: 'Test123!' }
        ],
        note: 'Use these credentials to log in and test the application'
      });

    } catch (error: any) {
      console.error('Database reset failed:', error);

      res.status(500).json({
        error: 'Failed to reset database',
        details: error.message
      });
    }
  }
}
