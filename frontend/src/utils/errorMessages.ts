/**
 * Error handling utilities for meeting request booking
 */

// Error codes for different failure scenarios
export enum BookingErrorCode {
  // Validation errors
  INVALID_TIME = 'INVALID_TIME',
  INVALID_LOCATION = 'INVALID_LOCATION',
  NOTE_TOO_LONG = 'NOTE_TOO_LONG',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // Conflict errors
  TIME_CONFLICT_REQUESTER = 'TIME_CONFLICT_REQUESTER',
  TIME_CONFLICT_RECIPIENT = 'TIME_CONFLICT_RECIPIENT',
  DUPLICATE_REQUEST = 'DUPLICATE_REQUEST',

  // User errors
  RECIPIENT_NOT_FOUND = 'RECIPIENT_NOT_FOUND',
  SELF_REQUEST = 'SELF_REQUEST',

  // Network/Server errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Error severity levels
export enum ErrorSeverity {
  ERROR = 'error',     // Cannot proceed, user must fix
  WARNING = 'warning', // Can proceed but not recommended
  INFO = 'info'        // Informational message
}

// Error message templates
export interface ErrorMessageTemplate {
  code: BookingErrorCode;
  severity: ErrorSeverity;
  title: string;
  message: string;
  action?: string;
  icon: string;
  isRetryable: boolean;
}

// Define user-friendly error messages
export const ERROR_MESSAGES: Record<BookingErrorCode, ErrorMessageTemplate> = {
  [BookingErrorCode.INVALID_TIME]: {
    code: BookingErrorCode.INVALID_TIME,
    severity: ErrorSeverity.ERROR,
    title: 'Invalid Time',
    message: 'Please select a valid meeting time between 9:00 AM and 5:00 PM.',
    action: 'Choose a different time slot',
    icon: '🕐',
    isRetryable: false
  },

  [BookingErrorCode.INVALID_LOCATION]: {
    code: BookingErrorCode.INVALID_LOCATION,
    severity: ErrorSeverity.ERROR,
    title: 'Invalid Location',
    message: 'Please select a valid meeting location (Main corridor or Garden).',
    action: 'Select a location from the dropdown',
    icon: '📍',
    isRetryable: false
  },

  [BookingErrorCode.NOTE_TOO_LONG]: {
    code: BookingErrorCode.NOTE_TOO_LONG,
    severity: ErrorSeverity.ERROR,
    title: 'Note Too Long',
    message: 'Your note exceeds the 200 character limit.',
    action: 'Shorten your message and try again',
    icon: '📝',
    isRetryable: false
  },

  [BookingErrorCode.MISSING_REQUIRED_FIELD]: {
    code: BookingErrorCode.MISSING_REQUIRED_FIELD,
    severity: ErrorSeverity.ERROR,
    title: 'Missing Information',
    message: 'Please fill in all required fields before submitting.',
    action: 'Check that time and location are selected',
    icon: '⚠️',
    isRetryable: false
  },

  [BookingErrorCode.TIME_CONFLICT_REQUESTER]: {
    code: BookingErrorCode.TIME_CONFLICT_REQUESTER,
    severity: ErrorSeverity.ERROR,
    title: 'Schedule Conflict',
    message: 'This time conflicts with a conference session you\'re attending.',
    action: 'Choose a different time that doesn\'t overlap with your sessions',
    icon: '⚠️',
    isRetryable: false
  },

  [BookingErrorCode.TIME_CONFLICT_RECIPIENT]: {
    code: BookingErrorCode.TIME_CONFLICT_RECIPIENT,
    severity: ErrorSeverity.ERROR,
    title: 'Recipient Unavailable',
    message: 'The person you\'re trying to meet has a conflict at this time.',
    action: 'Select a different time when they\'re available',
    icon: '⚠️',
    isRetryable: false
  },

  [BookingErrorCode.DUPLICATE_REQUEST]: {
    code: BookingErrorCode.DUPLICATE_REQUEST,
    severity: ErrorSeverity.ERROR,
    title: 'Request Already Exists',
    message: 'You already have a pending meeting request with this person.',
    action: 'Wait for them to respond, or cancel your previous request first',
    icon: '📬',
    isRetryable: false
  },

  [BookingErrorCode.RECIPIENT_NOT_FOUND]: {
    code: BookingErrorCode.RECIPIENT_NOT_FOUND,
    severity: ErrorSeverity.ERROR,
    title: 'User Not Found',
    message: 'The person you\'re trying to meet could not be found.',
    action: 'This person may have been removed from the system',
    icon: '❌',
    isRetryable: false
  },

  [BookingErrorCode.SELF_REQUEST]: {
    code: BookingErrorCode.SELF_REQUEST,
    severity: ErrorSeverity.ERROR,
    title: 'Invalid Request',
    message: 'You cannot send a meeting request to yourself.',
    action: 'Select a different person to meet with',
    icon: '🚫',
    isRetryable: false
  },

  [BookingErrorCode.NETWORK_ERROR]: {
    code: BookingErrorCode.NETWORK_ERROR,
    severity: ErrorSeverity.ERROR,
    title: 'Connection Problem',
    message: 'Unable to connect to the server. Please check your internet connection.',
    action: 'Check your connection and try again',
    icon: '📡',
    isRetryable: true
  },

  [BookingErrorCode.SERVER_ERROR]: {
    code: BookingErrorCode.SERVER_ERROR,
    severity: ErrorSeverity.ERROR,
    title: 'Server Error',
    message: 'We\'re experiencing technical difficulties. Please try again in a few moments.',
    action: 'Wait a moment and try again',
    icon: '⚙️',
    isRetryable: true
  },

  [BookingErrorCode.TIMEOUT_ERROR]: {
    code: BookingErrorCode.TIMEOUT_ERROR,
    severity: ErrorSeverity.ERROR,
    title: 'Request Timeout',
    message: 'The request took too long to complete. This might be due to a slow connection.',
    action: 'Try again with a better connection',
    icon: '⏱️',
    isRetryable: true
  },

  [BookingErrorCode.UNKNOWN_ERROR]: {
    code: BookingErrorCode.UNKNOWN_ERROR,
    severity: ErrorSeverity.ERROR,
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred while processing your request.',
    action: 'Please try again or contact support if the problem persists',
    icon: '❗',
    isRetryable: true
  }
};

/**
 * Parse error from API response and return appropriate error code
 */
export function parseBookingError(error: any): BookingErrorCode {
  // Network errors
  if (!error || error.message === 'Failed to fetch' || error.message === 'Network request failed') {
    return BookingErrorCode.NETWORK_ERROR;
  }

  // Check for structured error code from backend
  if (error.errorCode) {
    return error.errorCode as BookingErrorCode;
  }

  // Parse from error message
  const errorMessage = error.error || error.message || '';

  if (errorMessage.includes('Time conflict with your')) {
    return BookingErrorCode.TIME_CONFLICT_REQUESTER;
  }

  if (errorMessage.includes('Time conflict with recipient')) {
    return BookingErrorCode.TIME_CONFLICT_RECIPIENT;
  }

  if (errorMessage.includes('pending meeting request already exists')) {
    return BookingErrorCode.DUPLICATE_REQUEST;
  }

  if (errorMessage.includes('Recipient not found')) {
    return BookingErrorCode.RECIPIENT_NOT_FOUND;
  }

  if (errorMessage.includes('Cannot send meeting request to yourself')) {
    return BookingErrorCode.SELF_REQUEST;
  }

  if (errorMessage.includes('Note must not exceed')) {
    return BookingErrorCode.NOTE_TOO_LONG;
  }

  if (error.status === 500 || errorMessage.includes('technical difficulties')) {
    return BookingErrorCode.SERVER_ERROR;
  }

  if (error.status === 408 || errorMessage.includes('timeout')) {
    return BookingErrorCode.TIMEOUT_ERROR;
  }

  return BookingErrorCode.UNKNOWN_ERROR;
}

/**
 * Get error message template for a given error code
 */
export function getErrorMessage(errorCode: BookingErrorCode): ErrorMessageTemplate {
  return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[BookingErrorCode.UNKNOWN_ERROR];
}

/**
 * Get contextual error message with additional details
 */
export function getContextualErrorMessage(
  errorCode: BookingErrorCode,
  context?: { sessionName?: string; recipientName?: string }
): ErrorMessageTemplate {
  const template = getErrorMessage(errorCode);

  // Customize message based on context
  if (errorCode === BookingErrorCode.TIME_CONFLICT_REQUESTER && context?.sessionName) {
    return {
      ...template,
      message: `This time conflicts with "${context.sessionName}" session you're attending.`
    };
  }

  if (errorCode === BookingErrorCode.TIME_CONFLICT_RECIPIENT && context?.recipientName) {
    return {
      ...template,
      message: `${context.recipientName} has a conflict at this time.`
    };
  }

  return template;
}
