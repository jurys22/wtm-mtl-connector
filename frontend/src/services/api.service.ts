import { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth.types';
import { SessionsResponse } from '../types/session.types';
import { MatchesResponse } from '../types/matching.types';
import {
  CreateMeetingRequestData,
  MeetingRequestResponse,
  MeetingRequestsResponse
} from '../types/meeting-request.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

class ApiService {
  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'An error occurred' }));
      throw error;
    }
    return response.json();
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return this.handleResponse<AuthResponse>(response);
  }

  async getProfile(): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: this.getAuthHeader()
    });
    return this.handleResponse<User>(response);
  }

  async logout(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: this.getAuthHeader()
    });
    await this.handleResponse<{ message: string }>(response);
  }

  async requestPasswordReset(data: { email: string }): Promise<{ message: string; token?: string; expiresIn?: string; dev_note?: string }> {
    const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse<{ message: string; token?: string; expiresIn?: string; dev_note?: string }>(response);
  }

  async resetPassword(data: { token: string; password: string }): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return this.handleResponse<AuthResponse>(response);
  }

  // Session methods
  async getAllSessions(): Promise<SessionsResponse> {
    const response = await fetch(`${API_BASE_URL}/schedule/sessions`, {
      headers: this.getAuthHeader()
    });
    return this.handleResponse<SessionsResponse>(response);
  }

  async getUserSessions(): Promise<SessionsResponse> {
    const response = await fetch(`${API_BASE_URL}/schedule/user-sessions`, {
      headers: this.getAuthHeader()
    });
    return this.handleResponse<SessionsResponse>(response);
  }

  async addUserSession(sessionId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/schedule/user-sessions`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify({ session_id: sessionId })
    });
    return this.handleResponse<{ message: string }>(response);
  }

  async removeUserSession(sessionId: number): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/schedule/user-sessions/${sessionId}`, {
      method: 'DELETE',
      headers: this.getAuthHeader()
    });
    return this.handleResponse<{ message: string }>(response);
  }

  // Matching methods
  async getMatches(limit: number = 20, offset: number = 0): Promise<MatchesResponse> {
    const response = await fetch(
      `${API_BASE_URL}/matching/matches?limit=${limit}&offset=${offset}`,
      {
        headers: this.getAuthHeader()
      }
    );
    return this.handleResponse<MatchesResponse>(response);
  }

  // Meeting request methods
  async createMeetingRequest(data: CreateMeetingRequestData): Promise<MeetingRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests`, {
      method: 'POST',
      headers: this.getAuthHeader(),
      body: JSON.stringify(data)
    });
    return this.handleResponse<MeetingRequestResponse>(response);
  }

  async getInbox(): Promise<MeetingRequestsResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests/inbox`, {
      headers: this.getAuthHeader()
    });
    return this.handleResponse<MeetingRequestsResponse>(response);
  }

  async getOutbox(): Promise<MeetingRequestsResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests/outbox`, {
      headers: this.getAuthHeader()
    });
    return this.handleResponse<MeetingRequestsResponse>(response);
  }

  async acceptMeetingRequest(requestId: number): Promise<MeetingRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests/${requestId}/accept`, {
      method: 'PUT',
      headers: this.getAuthHeader()
    });
    return this.handleResponse<MeetingRequestResponse>(response);
  }

  async declineMeetingRequest(requestId: number): Promise<MeetingRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests/${requestId}/decline`, {
      method: 'PUT',
      headers: this.getAuthHeader()
    });
    return this.handleResponse<MeetingRequestResponse>(response);
  }

  async cancelMeetingRequest(requestId: number): Promise<MeetingRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests/${requestId}/cancel`, {
      method: 'PUT',
      headers: this.getAuthHeader()
    });
    return this.handleResponse<MeetingRequestResponse>(response);
  }

  async unconfirmMeetingRequest(requestId: number): Promise<MeetingRequestResponse> {
    const response = await fetch(`${API_BASE_URL}/meeting-requests/${requestId}/unconfirm`, {
      method: 'PUT',
      headers: this.getAuthHeader()
    });
    return this.handleResponse<MeetingRequestResponse>(response);
  }
}

export const apiService = new ApiService();
