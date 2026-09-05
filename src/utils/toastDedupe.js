import toast from 'react-hot-toast';

/**
 * Global Toast Deduplicator for HMS
 * 
 * Prevents duplicate identical toasts from dropping onto the UI simultaneously.
 * Resolves race conditions between:
 *  1. Axios response interceptors (showErrorToast) and component catch blocks.
 *  2. Rapid double-clicks or repeated state dispatches.
 *  3. Multiple components firing notifications for the same event.
 */

const recentToasts = new Map();
const DEDUPE_WINDOW_MS = 2500; // 2.5 seconds duplicate suppression window

/**
 * Normalizes message input into a consistent string key
 */
const getMessageKey = (message, type) => {
  if (typeof message === 'string' && message.trim()) {
    return `${type}:${message.trim()}`;
  }
  if (typeof message === 'number') {
    return `${type}:${message}`;
  }
  return null;
};

/**
 * Wraps a react-hot-toast dispatch method with deduplication logic
 */
const createDeduplicatedMethod = (originalMethod, type) => {
  return function (message, options = {}) {
    const key = options?.id || getMessageKey(message, type);

    if (key) {
      const now = Date.now();
      const lastShown = recentToasts.get(key);

      // If an identical toast with this key was dispatched recently, suppress duplicate
      if (lastShown && now - lastShown < DEDUPE_WINDOW_MS) {
        return options?.id || key;
      }

      // Record dispatch timestamp
      recentToasts.set(key, now);

      // Housekeeping: prevent unbounded map growth
      if (recentToasts.size > 100) {
        const oldestKey = recentToasts.keys().next().value;
        recentToasts.delete(oldestKey);
      }

      // Explicitly pass id to react-hot-toast so its internal state updater
      // treats matching IDs as in-place updates rather than creating new toast cards
      options = { ...options, id: options?.id || key };
    }

    return originalMethod.call(this, message, options);
  };
};

// Apply singleton patch once
if (!toast._isDeduplicated) {
  toast._isDeduplicated = true;
  toast.error = createDeduplicatedMethod(toast.error, 'error');
  toast.success = createDeduplicatedMethod(toast.success, 'success');
  toast.loading = createDeduplicatedMethod(toast.loading, 'loading');
  toast.custom = createDeduplicatedMethod(toast.custom, 'custom');
}

export default toast;
export { toast };
