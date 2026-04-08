import toast from 'react-hot-toast';

// Track recently shown errors to prevent duplicates
const recentErrors = new Map();
const ERROR_THROTTLE_TIME = 3000; // 3 seconds

/**
 * Extract error message from various error response formats
 */
const extractErrorMessage = (error) => {
  // Check multiple possible locations for error message
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error?.message ||
    error?.response?.data?.errors?.[0]?.message ||
    error?.message ||
    'An unexpected error occurred'
  );
};

/**
 * Show error toast with throttling to prevent duplicates
 */
export const showErrorToast = (error, customMessage = null) => {
  const errorMessage = customMessage || extractErrorMessage(error);
  
  // Check if this error was shown recently
  const errorKey = errorMessage;
  const now = Date.now();
  const lastShown = recentErrors.get(errorKey);
  
  if (lastShown && now - lastShown < ERROR_THROTTLE_TIME) {
    // Error was shown recently, skip it
    console.warn('Duplicate error prevented:', errorMessage);
    return;
  }
  
  // Record this error as shown
  recentErrors.set(errorKey, now);
  
  // Clean up old entries to prevent memory leak
  if (recentErrors.size > 50) {
    const oldestKey = recentErrors.keys().next().value;
    recentErrors.delete(oldestKey);
  }
  
  // Show the toast
  toast.error(errorMessage, {
    duration: 4000,
    position: 'top-right',
  });
  
  console.error('Error:', errorMessage, error);
};

/**
 * Show success toast
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

/**
 * Clear all pending toasts
 */
export const clearAllToasts = () => {
  toast.remove();
};
