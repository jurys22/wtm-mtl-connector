import { Database } from 'sql.js';

interface User {
  id: number;
  email: string;
  display_name: string;
  networking_intention: string;
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
}

interface MatchResult {
  user: User;
  matchScore: number;
  sharedAttributes: {
    sameIntention: boolean;
    sameIndustry: boolean;
    sharedTechSkills: string[];
    sharedSoftSkills: string[];
  };
}

export class MatchingService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  private parseUser(result: any, row: any[]): User {
    const user: any = {};
    result.columns.forEach((col: string, index: number) => {
      user[col] = row[index];
    });

    // Parse JSON fields
    if (typeof user.tech_skills === 'string') {
      user.tech_skills = JSON.parse(user.tech_skills);
    }
    if (typeof user.soft_skills === 'string') {
      user.soft_skills = JSON.parse(user.soft_skills);
    }

    return user as User;
  }

  private calculateMatchScore(currentUser: User, otherUser: User): number {
    let score = 0;

    // 1. Networking intention match (40% weight)
    if (currentUser.networking_intention === otherUser.networking_intention) {
      score += 40;
    }

    // 2. Industry match (30% weight)
    if (currentUser.industry === otherUser.industry) {
      score += 30;
    }

    // 3. Skills overlap (30% weight total: 15% tech + 15% soft)
    const techSkillsOverlap = this.calculateSkillOverlap(
      currentUser.tech_skills,
      otherUser.tech_skills
    );
    const softSkillsOverlap = this.calculateSkillOverlap(
      currentUser.soft_skills,
      otherUser.soft_skills
    );

    score += techSkillsOverlap * 15;
    score += softSkillsOverlap * 15;

    return Math.round(score);
  }

  private calculateSkillOverlap(skills1: string[], skills2: string[]): number {
    if (skills1.length === 0 || skills2.length === 0) {
      return 0;
    }

    const sharedSkills = skills1.filter(skill => skills2.includes(skill));
    const totalUniqueSkills = new Set([...skills1, ...skills2]).size;

    return sharedSkills.length / totalUniqueSkills;
  }

  private getSharedAttributes(currentUser: User, otherUser: User) {
    return {
      sameIntention: currentUser.networking_intention === otherUser.networking_intention,
      sameIndustry: currentUser.industry === otherUser.industry,
      sharedTechSkills: currentUser.tech_skills.filter(skill =>
        otherUser.tech_skills.includes(skill)
      ),
      sharedSoftSkills: currentUser.soft_skills.filter(skill =>
        otherUser.soft_skills.includes(skill)
      )
    };
  }

  findMatches(userId: number, limit: number = 20, offset: number = 0): MatchResult[] {
    // Get current user
    const currentUserResult = this.db.exec(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    );

    if (currentUserResult.length === 0 || !currentUserResult[0].values ||
        currentUserResult[0].values.length === 0) {
      return [];
    }

    const currentUser = this.parseUser(currentUserResult[0], currentUserResult[0].values[0]);

    // Get all other users (excluding current user)
    const otherUsersResult = this.db.exec(
      'SELECT * FROM users WHERE id != ? ORDER BY created_at DESC',
      [userId]
    );

    if (otherUsersResult.length === 0 || !otherUsersResult[0].values) {
      return [];
    }

    // Calculate match scores for all users
    const matches: MatchResult[] = otherUsersResult[0].values.map(row => {
      const otherUser = this.parseUser(otherUsersResult[0], row);
      const matchScore = this.calculateMatchScore(currentUser, otherUser);
      const sharedAttributes = this.getSharedAttributes(currentUser, otherUser);

      return {
        user: otherUser,
        matchScore,
        sharedAttributes
      };
    });

    // Sort by match score (descending)
    matches.sort((a, b) => b.matchScore - a.matchScore);

    // Apply pagination
    return matches.slice(offset, offset + limit);
  }

  getMatchesCount(userId: number): number {
    const result = this.db.exec(
      'SELECT COUNT(*) as count FROM users WHERE id != ?',
      [userId]
    );

    if (result.length === 0 || !result[0].values || result[0].values.length === 0) {
      return 0;
    }

    return result[0].values[0][0] as number;
  }
}
