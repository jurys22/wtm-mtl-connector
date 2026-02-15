export interface MatchUser {
  id: number;
  display_name: string;
  networking_intention: string;
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
}

export interface Match {
  user: MatchUser;
  matchScore: number;
  sharedAttributes: {
    sameIntention: boolean;
    sameIndustry: boolean;
    sharedTechSkills: string[];
    sharedSoftSkills: string[];
  };
}

export interface MatchesResponse {
  matches: Match[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}
