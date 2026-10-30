/**
 * In-Memory Diagnostics Collector for Support & Bug Tickets
 * Automatically captures client environment, failed API requests, and uncaught console errors
 * without transmitting anything until a ticket is submitted.
 */

const MAX_BUFFER_SIZE = 15;

const failedRequestsBuffer = [];
const consoleErrorsBuffer = [];
let isInitialized = false;

// Redact sensitive keys from request payloads
const SENSITIVE_KEYS = ['password', 'token', 'authorization', 'secret', 'pin', 'creditCard'];

const sanitizeData = (data) => {
  if (!data) return data;
  if (typeof data !== 'object') return data;
  try {
    const copy = Array.isArray(data) ? [...data] : { ...data };
    for (const key of Object.keys(copy)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        copy[key] = '[REDACTED]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = sanitizeData(copy[key]);
      }
    }
    return copy;
  } catch {
    return '[Unserializable data]';
  }
};

/**
 * Record a failed HTTP/API request from axios interceptor
 */
export const recordFailedRequest = ({
  method,
  url,
  status,
  statusText,
  requestData,
  responseData,
}) => {
  try {
    const entry = {
      id: `req-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      method: (method || 'GET').toUpperCase(),
      url: url || '',
      status: status || 0,
      statusText: statusText || '',
      requestData: sanitizeData(requestData),
      responseData: sanitizeData(responseData),
    };

    failedRequestsBuffer.push(entry);
    if (failedRequestsBuffer.length > MAX_BUFFER_SIZE) {
      failedRequestsBuffer.shift();
    }
  } catch (err) {
    // Fail silently so diagnostics never breaks the app
  }
};

/**
 * Record a console error or unhandled JS error
 */
export const recordConsoleError = (errorOrMessage, errorObj = null) => {
  try {
    let message = '';
    let stack = '';

    if (errorOrMessage instanceof Error) {
      message = errorOrMessage.message;
      stack = errorOrMessage.stack || '';
    } else if (typeof errorOrMessage === 'object' && errorOrMessage !== null) {
      message = errorOrMessage.message || JSON.stringify(errorOrMessage);
      stack = errorOrMessage.stack || '';
    } else {
      message = String(errorOrMessage);
      stack = errorObj?.stack || '';
    }

    const entry = {
      id: `err-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      message,
      stack,
      route: window?.location?.pathname || '',
    };

    consoleErrorsBuffer.push(entry);
    if (consoleErrorsBuffer.length > MAX_BUFFER_SIZE) {
      consoleErrorsBuffer.shift();
    }
  } catch {
    // Fail silently
  }
};

/**
 * Global collector initialization
 */
export const initDiagnosticsCollector = () => {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // Intercept uncaught JS exceptions
  window.addEventListener('error', (event) => {
    recordConsoleError(event.error || event.message, event.error);
  });

  // Intercept unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    recordConsoleError(
      event.reason?.message || 'Unhandled Promise Rejection',
      event.reason
    );
  });

  // Intercept console.error calls safely
  const originalConsoleError = console.error;
  console.error = (...args) => {
    try {
      const firstArg = args[0];
      const errorObj = args.find((a) => a instanceof Error);
      recordConsoleError(firstArg, errorObj);
    } catch {}
    originalConsoleError.apply(console, args);
  };
};

/**
 * Returns a complete diagnostics snapshot for ticket submission
 */
export const getDiagnosticsSnapshot = () => {
  try {
    const client = {
      userAgent: navigator.userAgent || 'Unknown',
      platform: navigator.platform || 'Unknown',
      language: navigator.language || 'Unknown',
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      viewport: `${window.innerWidth || 0}x${window.innerHeight || 0}`,
      online: navigator.onLine !== false,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',
      url: window.location.href,
      route: window.location.pathname + window.location.search,
    };

    return {
      capturedAt: new Date().toISOString(),
      client,
      failedRequests: [...failedRequestsBuffer].reverse(),
      consoleErrors: [...consoleErrorsBuffer].reverse(),
    };
  } catch (err) {
    return {
      capturedAt: new Date().toISOString(),
      error: 'Failed to capture diagnostics snapshot',
    };
  }
};

export default {
  initDiagnosticsCollector,
  recordFailedRequest,
  recordConsoleError,
  getDiagnosticsSnapshot,
};

