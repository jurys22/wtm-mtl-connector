import { useEffect, useState } from 'react';
import { ErrorMessageTemplate, ErrorSeverity } from '../utils/errorMessages';
import './ErrorBanner.css';

interface ErrorBannerProps {
  error: ErrorMessageTemplate | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  autoDismiss?: boolean;
  autoDismissDelay?: number; // milliseconds
  showRetryButton?: boolean;
}

export const ErrorBanner = ({
  error,
  onDismiss,
  onRetry,
  autoDismiss = false,
  autoDismissDelay = 8000,
  showRetryButton = false
}: ErrorBannerProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    if (error) {
      setIsVisible(true);

      if (autoDismiss) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoDismissDelay);

        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoDismiss, autoDismissDelay]);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      if (onDismiss) {
        onDismiss();
      }
    }, 300); // Wait for animation
  };

  const handleRetry = () => {
    setRetryAttempt(prev => prev + 1);
    if (onRetry) {
      onRetry();
    }
  };

  if (!error || !isVisible) {
    return null;
  }

  const getSeverityClass = () => {
    switch (error.severity) {
      case ErrorSeverity.ERROR:
        return 'severity-error';
      case ErrorSeverity.WARNING:
        return 'severity-warning';
      case ErrorSeverity.INFO:
        return 'severity-info';
      default:
        return 'severity-error';
    }
  };

  const shouldShowRetry = showRetryButton && error.isRetryable && onRetry;

  return (
    <div
      className={`error-banner ${getSeverityClass()}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="error-icon" aria-hidden="true">
        {error.icon}
      </div>

      <div className="error-content">
        <div className="error-title">
          {error.title}
        </div>
        <div className="error-message">
          {error.message}
        </div>
        {error.action && (
          <div className="error-action-hint">
            {error.action}
          </div>
        )}
      </div>

      <div className="error-actions">
        {shouldShowRetry && (
          <button
            className="error-retry-btn"
            onClick={handleRetry}
            aria-label="Retry action"
          >
            🔄 Retry
            {retryAttempt > 0 && ` (${retryAttempt + 1})`}
          </button>
        )}
        {onDismiss && (
          <button
            className="error-close-btn"
            onClick={handleDismiss}
            aria-label="Dismiss error"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
