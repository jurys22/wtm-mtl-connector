export interface User {
  id: number;
  email: string;
  display_name: string;
  networking_intention: 'Searching for a job' | 'Searching for a hire' | 'Just chat';
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  display_name: string;
  networking_intention: 'Searching for a job' | 'Searching for a hire' | 'Just chat';
  industry: string;
  tech_skills: string[];
  soft_skills: string[];
}

export interface ApiError {
  error: string;
  errors?: Array<{
    msg: string;
    param: string;
  }>;
}
