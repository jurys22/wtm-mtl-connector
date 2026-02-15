import { Request, Response } from 'express';
import { getDatabase } from '../db';
import { MatchingService } from '../services/matching.service';

export class MatchingController {
  async getMatches(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;

      const db = await getDatabase();
      const matchingService = new MatchingService(db);

      const matches = matchingService.findMatches(req.user.userId, limit, offset);
      const totalCount = matchingService.getMatchesCount(req.user.userId);

      // Remove sensitive data
      const sanitizedMatches = matches.map(match => ({
        user: {
          id: match.user.id,
          display_name: match.user.display_name,
          networking_intention: match.user.networking_intention,
          industry: match.user.industry,
          tech_skills: match.user.tech_skills,
          soft_skills: match.user.soft_skills
        },
        matchScore: match.matchScore,
        sharedAttributes: match.sharedAttributes
      }));

      res.status(200).json({
        matches: sanitizedMatches,
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      });
    } catch (error) {
      console.error('Get matches error:', error);
      res.status(500).json({ error: 'Failed to fetch matches' });
    }
  }
}
