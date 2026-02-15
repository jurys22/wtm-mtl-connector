import { useState, useCallback } from 'react';
import { apiService } from '../services/api.service';
import { EVENT_DATE, EVENT_DATE_DISPLAY } from '../utils/constants';
import { ErrorBanner } from './ErrorBanner';
import {
  parseBookingError,
  getContextualErrorMessage,
  ErrorMessageTemplate
} from '../utils/errorMessages';
import './MeetingRequestModal.css';

interface MeetingRequestModalProps {
  recipientId: number;
  recipientName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const MeetingRequestModal = ({
  recipientId,
  recipientName,
  onClose,
  onSuccess
}: MeetingRequestModalProps) => {
  const [selectedTime, setSelectedTime] = useState('09:00'); // Time only, not full datetime
  const [proposedPlace, setProposedPlace] = useState<'Main corridor' | 'Garden'>('Main corridor');
  const [note, setNote] = useState('');
  const [error, setError] = useState<ErrorMessageTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  const submitRequest = useCallback(async () => {
    setError(null);

    // Combine fixed event date with selected time
    const proposedDateTime = `${EVENT_DATE}T${selectedTime}:00`;

    setLoading(true);

    try {
      await apiService.createMeetingRequest({
        recipient_id: recipientId,
        proposed_time: new Date(proposedDateTime).toISOString(),
        proposed_place: proposedPlace,
        note: note.trim() || undefined
      });

      // Success! Close modal
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Meeting request error:', err);

      // Parse error and get user-friendly message
      const errorCode = parseBookingError(err);
      const errorMessage = getContextualErrorMessage(errorCode, {
        sessionName: err.details?.sessionName,
        recipientName
      });

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [selectedTime, proposedPlace, note, recipientId, recipientName, onSuccess, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Client-side validation
    if (!selectedTime) {
      const errorMessage = getContextualErrorMessage('MISSING_REQUIRED_FIELD' as any);
      setError(errorMessage);
      return;
    }

    if (note.length > 200) {
      const errorMessage = getContextualErrorMessage('NOTE_TOO_LONG' as any);
      setError(errorMessage);
      return;
    }

    await submitRequest();
  };

  const handleRetry = () => {
    submitRequest();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Request Meeting with {recipientName}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="meeting-request-form">
          <div className="form-group">
            <label htmlFor="meeting-date">
              Meeting Date
            </label>
            <div className="fixed-date-display">
              <span className="calendar-icon">📅</span>
              <span className="date-text">{EVENT_DATE_DISPLAY}</span>
            </div>
            <p className="date-note">Date is fixed and cannot be changed</p>
          </div>

          <div className="form-group">
            <label htmlFor="proposed-time">
              Meeting Time <span className="required">*</span>
            </label>
            <input
              type="time"
              id="proposed-time"
              value={selectedTime}
              onChange={(e) => setSelectedTime(e.target.value)}
              min="09:00"
              max="17:00"
              required
            />
            <p className="time-note">Select a time between 9:00 AM and 5:00 PM</p>
          </div>

          <div className="form-group">
            <label htmlFor="proposed-place">
              Meeting Location <span className="required">*</span>
            </label>
            <select
              id="proposed-place"
              value={proposedPlace}
              onChange={(e) => setProposedPlace(e.target.value as 'Main corridor' | 'Garden')}
              required
            >
              <option value="Main corridor">Main corridor</option>
              <option value="Garden">Garden</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="note">
              Note (Optional)
              <span className="char-count">
                {note.length}/200
              </span>
            </label>
            <textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={4}
              placeholder="Add a message to your meeting request..."
            />
          </div>

          <ErrorBanner
            error={error}
            onDismiss={() => setError(null)}
            onRetry={handleRetry}
            showRetryButton={true}
          />

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
