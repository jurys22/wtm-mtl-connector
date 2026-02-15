import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { MeetingRequest } from '../types/meeting-request.types';
import './MeetingRequests.css';

type TabType = 'inbox' | 'outbox';

export const MeetingRequests = () => {
  const [activeTab, setActiveTab] = useState<TabType>('inbox');
  const [inbox, setInbox] = useState<MeetingRequest[]>([]);
  const [outbox, setOutbox] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Auto-dismiss error after 8 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const [inboxData, outboxData] = await Promise.all([
        apiService.getInbox(),
        apiService.getOutbox()
      ]);
      setInbox(inboxData.meetingRequests);
      setOutbox(outboxData.meetingRequests);
    } catch (err: any) {
      setError(err.error || 'Failed to load meeting requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: number) => {
    // Prevent duplicate submissions
    if (actionLoading !== null) {
      return;
    }

    try {
      setActionLoading(requestId);
      setError(null);
      await apiService.acceptMeetingRequest(requestId);
      await loadRequests();
    } catch (err: any) {
      console.error('Accept request error:', err);
      const errorMessage = err.error || err.message || 'Failed to accept request. Please try again.';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: number) => {
    // Prevent duplicate submissions
    if (actionLoading !== null) {
      return;
    }

    try {
      setActionLoading(requestId);
      setError(null);
      await apiService.declineMeetingRequest(requestId);
      await loadRequests();
    } catch (err: any) {
      console.error('Decline request error:', err);
      const errorMessage = err.error || err.message || 'Failed to decline request. Please try again.';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (requestId: number) => {
    // Prevent duplicate submissions
    if (actionLoading !== null) {
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this meeting request?')) {
      return;
    }

    try {
      setActionLoading(requestId);
      setError(null);
      await apiService.cancelMeetingRequest(requestId);
      await loadRequests();
    } catch (err: any) {
      console.error('Cancel request error:', err);
      const errorMessage = err.error || err.message || 'Failed to cancel request. Please try again.';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnconfirm = async (requestId: number) => {
    // Prevent duplicate submissions
    if (actionLoading !== null) {
      return;
    }

    if (!window.confirm('Are you sure you want to unconfirm this meeting? The other party will be notified.')) {
      return;
    }

    try {
      setActionLoading(requestId);
      setError(null);
      await apiService.unconfirmMeetingRequest(requestId);
      await loadRequests();
    } catch (err: any) {
      console.error('Unconfirm meeting error:', err);
      const errorMessage = err.error || err.message || 'Failed to unconfirm meeting. Please try again.';
      setError(errorMessage);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDateTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'accepted':
        return 'status-accepted';
      case 'declined':
        return 'status-declined';
      case 'cancelled':
        return 'status-cancelled';
      case 'unconfirmed':
        return 'status-unconfirmed';
      case 'pending':
      default:
        return 'status-pending';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status) {
      case 'accepted':
        return '✓';
      case 'declined':
        return '✗';
      case 'cancelled':
        return '🚫';
      case 'unconfirmed':
        return '↩';
      case 'pending':
      default:
        return '⏱';
    }
  };

  const renderInboxRequest = (request: MeetingRequest) => (
    <div key={request.id} className="request-card">
      <div className="request-header">
        <div className="request-user">
          <h3>{request.requester_name}</h3>
          <p className="request-email">{request.requester_email}</p>
        </div>
        <div className={`status-badge ${getStatusBadgeClass(request.status)}`}>
          <span className="status-icon">{getStatusIcon(request.status)}</span>
          <span className="status-text">{request.status}</span>
        </div>
      </div>

      <div className="request-details">
        <div className="request-detail-item">
          <span className="detail-icon">📅</span>
          <div className="detail-content">
            <span className="detail-label">Proposed Time:</span>
            <span className="detail-value">{formatDateTime(request.proposed_time)}</span>
          </div>
        </div>

        <div className="request-detail-item">
          <span className="detail-icon">📍</span>
          <div className="detail-content">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{request.proposed_place}</span>
          </div>
        </div>

        {request.note && (
          <div className="request-note">
            <span className="detail-icon">💬</span>
            <div className="detail-content">
              <span className="detail-label">Message:</span>
              <p className="note-text">{request.note}</p>
            </div>
          </div>
        )}
      </div>

      {request.status === 'pending' && (
        <div className="request-actions">
          <button
            onClick={() => handleDecline(request.id)}
            disabled={actionLoading === request.id}
            className="btn btn-decline"
          >
            {actionLoading === request.id ? 'Processing...' : 'Decline'}
          </button>
          <button
            onClick={() => handleAccept(request.id)}
            disabled={actionLoading === request.id}
            className="btn btn-accept"
          >
            {actionLoading === request.id ? 'Processing...' : 'Accept'}
          </button>
        </div>
      )}

      {request.status === 'accepted' && (
        <div className="request-actions">
          <button
            onClick={() => handleUnconfirm(request.id)}
            disabled={actionLoading === request.id}
            className="btn btn-unconfirm"
          >
            {actionLoading === request.id ? 'Processing...' : 'Unconfirm Meeting'}
          </button>
        </div>
      )}
    </div>
  );

  const renderOutboxRequest = (request: MeetingRequest) => (
    <div key={request.id} className="request-card">
      <div className="request-header">
        <div className="request-user">
          <h3>{request.recipient_name}</h3>
          <p className="request-email">{request.recipient_email}</p>
        </div>
        <div className={`status-badge ${getStatusBadgeClass(request.status)}`}>
          <span className="status-icon">{getStatusIcon(request.status)}</span>
          <span className="status-text">{request.status}</span>
        </div>
      </div>

      <div className="request-details">
        <div className="request-detail-item">
          <span className="detail-icon">📅</span>
          <div className="detail-content">
            <span className="detail-label">Proposed Time:</span>
            <span className="detail-value">{formatDateTime(request.proposed_time)}</span>
          </div>
        </div>

        <div className="request-detail-item">
          <span className="detail-icon">📍</span>
          <div className="detail-content">
            <span className="detail-label">Location:</span>
            <span className="detail-value">{request.proposed_place}</span>
          </div>
        </div>

        {request.note && (
          <div className="request-note">
            <span className="detail-icon">💬</span>
            <div className="detail-content">
              <span className="detail-label">Message:</span>
              <p className="note-text">{request.note}</p>
            </div>
          </div>
        )}
      </div>

      <div className="request-timestamp">
        Sent {formatDateTime(request.created_at)}
      </div>

      {request.status === 'pending' && (
        <div className="request-actions">
          <button
            onClick={() => handleCancel(request.id)}
            disabled={actionLoading === request.id}
            className="btn btn-cancel"
          >
            {actionLoading === request.id ? 'Processing...' : 'Cancel Request'}
          </button>
        </div>
      )}

      {request.status === 'accepted' && (
        <div className="request-actions">
          <button
            onClick={() => handleUnconfirm(request.id)}
            disabled={actionLoading === request.id}
            className="btn btn-unconfirm"
          >
            {actionLoading === request.id ? 'Processing...' : 'Unconfirm Meeting'}
          </button>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="requests-loading">
        <div className="spinner"></div>
        <p>Loading meeting requests...</p>
      </div>
    );
  }

  const pendingInboxCount = inbox.filter(r => r.status === 'pending').length;
  const currentRequests = activeTab === 'inbox' ? inbox : outbox;

  return (
    <div className="meeting-requests">
      <div className="requests-header">
        <h2>Meeting Requests</h2>
        <p className="requests-info">
          Manage your meeting requests and connections
        </p>
      </div>

      {error && (
        <div className="error-banner">
          <span className="error-message">{error}</span>
          <button
            className="error-close"
            onClick={() => setError(null)}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      <div className="requests-tabs">
        <button
          className={`tab-button ${activeTab === 'inbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('inbox')}
        >
          Inbox
          {pendingInboxCount > 0 && (
            <span className="tab-badge">{pendingInboxCount}</span>
          )}
        </button>
        <button
          className={`tab-button ${activeTab === 'outbox' ? 'active' : ''}`}
          onClick={() => setActiveTab('outbox')}
        >
          Sent
        </button>
      </div>

      <div className="requests-content">
        {currentRequests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              {activeTab === 'inbox' ? '📬' : '📤'}
            </div>
            <h3>No {activeTab === 'inbox' ? 'incoming' : 'sent'} requests</h3>
            <p>
              {activeTab === 'inbox'
                ? 'When someone sends you a meeting request, it will appear here.'
                : "You haven't sent any meeting requests yet. Visit the Matches page to connect with attendees!"}
            </p>
          </div>
        ) : (
          <div className="requests-list">
            {activeTab === 'inbox'
              ? currentRequests.map(renderInboxRequest)
              : currentRequests.map(renderOutboxRequest)}
          </div>
        )}
      </div>
    </div>
  );
};
