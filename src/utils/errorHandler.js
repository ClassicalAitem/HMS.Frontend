import toast from 'react-hot-toast';

// Track recently shown errors to prevent duplicates
const recentErrors = new Map();
const ERROR_THROTTLE_TIME = 3000; // 3 seconds

/**
 * Extract error message from various error response formats
 */
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (typeof error === 'string' && error.trim()) return error;

  const data = error?.response?.data ?? error?.data ?? error;
  const message = data?.message ?? data?.error?.message ?? data?.error ?? data?.errors ?? error?.message;

  if (Array.isArray(message)) {
    return message
      .map((item) => (typeof item === 'string' ? item : item?.message || item?.msg || item?.error))
      .filter(Boolean)
      .join(', ') || fallback;
  }

  if (typeof message === 'object' && message !== null) {
    return getErrorMessage(message, fallback);
  }

  return typeof message === 'string' && message.trim() ? message : fallback;
};

/**
 * Show error toast with throttling to prevent duplicates
 */
export const showErrorToast = (error, customMessage = null) => {
  // If error was already displayed by interceptor and no custom override was provided, avoid repeat
  if (error && typeof error === 'object' && error._toastShown && !customMessage) {
    return;
  }

  const errorMessage = customMessage || getErrorMessage(error);
  
  if (error && typeof error === 'object') {
    error._toastShown = true;
  }

  // Check if this error was shown recently
  const errorKey = errorMessage;
  const now = Date.now();
  const lastShown = recentErrors.get(errorKey);
  
  if (lastShown && now - lastShown < ERROR_THROTTLE_TIME) {
    return;
  }
  
  // Record this error as shown
  recentErrors.set(errorKey, now);
  
  // Clean up old entries to prevent memory leak
  if (recentErrors.size > 50) {
    const oldestKey = recentErrors.keys().next().value;
    recentErrors.delete(oldestKey);
  }
  
  // Show the toast with deterministic ID to prevent duplicates
  toast.error(errorMessage, {
    id: `error:${errorMessage}`,
    duration: 4000,
  });
};

/**
 * Show success toast
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    id: `success:${message}`,
    duration: 3000,
  });
};

/**
 * Clear all pending toasts
 */
export const clearAllToasts = () => {
  toast.remove();
};
