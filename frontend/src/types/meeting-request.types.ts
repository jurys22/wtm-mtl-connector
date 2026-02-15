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
  requester_name?: string;
  requester_email?: string;
  recipient_name?: string;
  recipient_email?: string;
}

export interface CreateMeetingRequestData {
  recipient_id: number;
  proposed_time: string;
  proposed_place: 'Main corridor' | 'Garden';
  note?: string;
}

export interface MeetingRequestsResponse {
  meetingRequests: MeetingRequest[];
  count: number;
}

export interface MeetingRequestResponse {
  message: string;
  meetingRequest: MeetingRequest;
}
