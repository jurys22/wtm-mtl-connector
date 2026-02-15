import { useState, useEffect } from 'react';
import { apiService } from '../services/api.service';
import { Session } from '../types/session.types';
import './Schedule.css';

export const Schedule = () => {
  const [allSessions, setAllSessions] = useState<Session[]>([]);
  const [userSessions, setUserSessions] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsData, userSessionsData] = await Promise.all([
        apiService.getAllSessions(),
        apiService.getUserSessions()
      ]);

      setAllSessions(sessionsData.sessions);
      setUserSessions(userSessionsData.sessions.map(s => s.id));
    } catch (err: any) {
      setError(err.error || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const toggleSession = async (sessionId: number) => {
    const isAdded = userSessions.includes(sessionId);
    setActionLoading(sessionId);
    setError(null);

    try {
      if (isAdded) {
        await apiService.removeUserSession(sessionId);
        setUserSessions(userSessions.filter(id => id !== sessionId));
      } else {
        await apiService.addUserSession(sessionId);
        setUserSessions([...userSessions, sessionId]);
      }
    } catch (err: any) {
      setError(err.error || `Failed to ${isAdded ? 'remove' : 'add'} session`);
      if (err.conflictingSession) {
        setError(`Time conflict with: ${err.conflictingSession}`);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatTime = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (datetime: string) => {
    const date = new Date(datetime);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="schedule-loading">
        <div className="spinner"></div>
        <p>Loading schedule...</p>
      </div>
    );
  }

  const eventDate = allSessions.length > 0 ? formatDate(allSessions[0].start_time) : '';

  return (
    <div className="schedule">
      <div className="schedule-header">
        <h2>Conference Schedule</h2>
        {eventDate && <p className="event-date">{eventDate}</p>}
        <p className="schedule-info">
          {userSessions.length} session{userSessions.length !== 1 ? 's' : ''} selected
        </p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
        </div>
      )}

      <div className="sessions-grid">
        {allSessions.map((session) => {
          const isSelected = userSessions.includes(session.id);
          const isLoading = actionLoading === session.id;

          return (
            <div
              key={session.id}
              className={`session-card ${isSelected ? 'selected' : ''} ${isLoading ? 'loading' : ''}`}
            >
              <div className="session-time">
                <span className="time-range">
                  {formatTime(session.start_time)} - {formatTime(session.end_time)}
                </span>
                <span className="session-location">{session.location}</span>
              </div>

              <h3 className="session-title">{session.title}</h3>

              <button
                onClick={() => toggleSession(session.id)}
                className={`btn-toggle ${isSelected ? 'btn-remove' : 'btn-add'}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="btn-loading">
                    <span className="mini-spinner"></span>
                  </span>
                ) : isSelected ? (
                  <>
                    <span className="check-icon">✓</span> Attending
                  </>
                ) : (
                  '+ Add to Schedule'
                )}
              </button>
            </div>
          );
        })}
      </div>

      {allSessions.length === 0 && (
        <div className="empty-state">
          <p>No sessions available yet</p>
        </div>
      )}
    </div>
  );
};
