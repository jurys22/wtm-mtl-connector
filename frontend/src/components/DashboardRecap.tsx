import { useState, useEffect, useMemo } from 'react';
import { apiService } from '../services/api.service';
import { Session } from '../types/session.types';
import { MeetingRequest } from '../types/meeting-request.types';
import { useAuth } from '../contexts/AuthContext';
import './DashboardRecap.css';

// Unified schedule item type
interface ScheduleItem {
  id: string;
  type: 'session' | 'meeting';
  title: string;
  startTime: Date;
  endTime: Date;
  location: string;
  participants?: { name: string; email: string }[];
  note?: string;
  hasConflict?: boolean;
  originalData: Session | MeetingRequest;
}

type FilterType = 'all' | 'sessions' | 'meetings';

export const DashboardRecap = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [meetings, setMeetings] = useState<MeetingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [sessionsData, inboxData, outboxData] = await Promise.all([
          apiService.getUserSessions(),
          apiService.getInbox(),
          apiService.getOutbox()
        ]);

        setSessions(sessionsData.sessions);

        // Get only accepted meetings from both inbox and outbox
        const acceptedMeetings = [
          ...inboxData.meetingRequests.filter(m => m.status === 'accepted'),
          ...outboxData.meetingRequests.filter(m => m.status === 'accepted')
        ];

        // Remove duplicates (same meeting appears in both inbox and outbox)
        const uniqueMeetings = acceptedMeetings.filter(
          (meeting, index, self) =>
            index === self.findIndex(m => m.id === meeting.id)
        );

        setMeetings(uniqueMeetings);
      } catch (err: any) {
        console.error('Error fetching schedule data:', err);
        setError('Failed to load your schedule. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Convert sessions and meetings to unified schedule items
  const scheduleItems = useMemo(() => {
    const items: ScheduleItem[] = [];

    // Add sessions
    sessions.forEach(session => {
      items.push({
        id: `session-${session.id}`,
        type: 'session',
        title: session.title,
        startTime: new Date(session.start_time),
        endTime: new Date(session.end_time),
        location: session.location,
        originalData: session
      });
    });

    // Add meetings
    meetings.forEach(meeting => {
      const isRequester = meeting.requester_id === user?.id;
      const otherParty = isRequester
        ? { name: meeting.recipient_name || 'Unknown', email: meeting.recipient_email || '' }
        : { name: meeting.requester_name || 'Unknown', email: meeting.requester_email || '' };

      // Calculate meeting end time (assume 30 minutes)
      const startTime = new Date(meeting.proposed_time);
      const endTime = new Date(startTime.getTime() + 30 * 60 * 1000);

      items.push({
        id: `meeting-${meeting.id}`,
        type: 'meeting',
        title: `Meeting with ${otherParty.name}`,
        startTime,
        endTime,
        location: meeting.proposed_place,
        participants: [otherParty],
        note: meeting.note || undefined,
        originalData: meeting
      });
    });

    // Sort chronologically
    items.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    return items;
  }, [sessions, meetings, user]);

  // Detect conflicts
  const itemsWithConflicts = useMemo(() => {
    return scheduleItems.map(item => {
      // Check if this item overlaps with any other item
      const hasConflict = scheduleItems.some(other => {
        if (item.id === other.id) return false;

        // Check for time overlap
        return (
          (item.startTime >= other.startTime && item.startTime < other.endTime) ||
          (item.endTime > other.startTime && item.endTime <= other.endTime) ||
          (item.startTime <= other.startTime && item.endTime >= other.endTime)
        );
      });

      return { ...item, hasConflict };
    });
  }, [scheduleItems]);

  // Apply filters
  const filteredItems = useMemo(() => {
    if (filter === 'all') return itemsWithConflicts;
    return itemsWithConflicts.filter(item =>
      filter === 'sessions' ? item.type === 'session' : item.type === 'meeting'
    );
  }, [itemsWithConflicts, filter]);

  // Format time for display
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatTimeRange = (start: Date, end: Date): string => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  // Export to iCalendar format
  const exportToCalendar = () => {
    let icsContent = 'BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//WTM MTL Connector//EN\n';

    filteredItems.forEach(item => {
      const startTime = item.startTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      const endTime = item.endTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

      icsContent += 'BEGIN:VEVENT\n';
      icsContent += `DTSTART:${startTime}\n`;
      icsContent += `DTEND:${endTime}\n`;
      icsContent += `SUMMARY:${item.title}\n`;
      icsContent += `LOCATION:${item.location}\n`;
      if (item.note) {
        icsContent += `DESCRIPTION:${item.note}\n`;
      }
      icsContent += 'END:VEVENT\n';
    });

    icsContent += 'END:VCALENDAR';

    // Download the file
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wtm-mtl-schedule.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="recap-loading">
        <div className="spinner"></div>
        <p>Loading your schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recap-error">
        <span className="error-icon">⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  const hasItems = filteredItems.length > 0;
  const hasConflicts = itemsWithConflicts.some(item => item.hasConflict);

  return (
    <div className="dashboard-recap">
      <div className="recap-header">
        <h2>Your WTM MTL Schedule</h2>
        <p className="recap-subtitle">April 18th, 2026</p>
      </div>

      {hasConflicts && (
        <div className="conflict-warning">
          <span className="warning-icon">⚠️</span>
          <span>You have scheduling conflicts. Please review your schedule.</span>
        </div>
      )}

      <div className="recap-controls">
        <div className="filter-buttons">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({itemsWithConflicts.length})
          </button>
          <button
            className={`filter-btn ${filter === 'sessions' ? 'active' : ''}`}
            onClick={() => setFilter('sessions')}
          >
            Sessions ({sessions.length})
          </button>
          <button
            className={`filter-btn ${filter === 'meetings' ? 'active' : ''}`}
            onClick={() => setFilter('meetings')}
          >
            Meetings ({meetings.length})
          </button>
        </div>

        {hasItems && (
          <button className="export-btn" onClick={exportToCalendar}>
            📥 Export Calendar
          </button>
        )}
      </div>

      {!hasItems ? (
        <div className="empty-schedule">
          <div className="empty-icon">📅</div>
          <h3>No scheduled items yet</h3>
          <p>
            {filter === 'sessions' && 'You haven\'t selected any conference sessions yet.'}
            {filter === 'meetings' && 'You don\'t have any confirmed meetings yet.'}
            {filter === 'all' && 'Start by selecting conference sessions or scheduling meetings with other attendees.'}
          </p>
        </div>
      ) : (
        <div className="schedule-timeline">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className={`schedule-item ${item.type} ${item.hasConflict ? 'conflict' : ''}`}
            >
              <div className="item-time">
                <span className="time-range">{formatTimeRange(item.startTime, item.endTime)}</span>
              </div>

              <div className="item-content">
                <div className="item-header">
                  <div className="item-type-badge">
                    {item.type === 'session' ? '🎤 Session' : '🤝 Meeting'}
                  </div>
                  {item.hasConflict && (
                    <span className="conflict-badge">⚠️ Conflict</span>
                  )}
                </div>

                <h3 className="item-title">{item.title}</h3>

                <div className="item-details">
                  <div className="item-detail">
                    <span className="detail-icon">📍</span>
                    <span>{item.location}</span>
                  </div>

                  {item.participants && item.participants.length > 0 && (
                    <div className="item-detail">
                      <span className="detail-icon">👤</span>
                      <span>
                        {item.participants.map(p => p.name).join(', ')}
                      </span>
                    </div>
                  )}

                  {item.note && (
                    <div className="item-note">
                      <span className="detail-icon">💬</span>
                      <span>{item.note}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasItems && (
        <div className="recap-summary">
          <p>
            Total: {itemsWithConflicts.length} item{itemsWithConflicts.length !== 1 ? 's' : ''}
            ({sessions.length} session{sessions.length !== 1 ? 's' : ''}, {meetings.length} meeting{meetings.length !== 1 ? 's' : ''})
          </p>
        </div>
      )}
    </div>
  );
};
