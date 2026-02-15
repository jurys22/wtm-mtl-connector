export interface Session {
  id: number;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  created_at: string;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
}
