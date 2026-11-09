/**
 * Multi-Tab Auth & Inactivity Synchronization
 * Coordinates the shared session token and activity timers across all open tabs.
 */

const CHANNEL_NAME = 'hms_auth_sync';
export const STORAGE_KEY_LAST_ACTIVITY = 'hms_last_activity';
export const STORAGE_KEY_LOGOUT_EVENT = 'hms_inactivity_logout';

let channel = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    channel = new BroadcastChannel(CHANNEL_NAME);
  }
} catch (e) {
  console.warn('BroadcastChannel not supported or failed to initialize', e);
}

// Throttling for activity broadcast
let lastBroadcast = 0;
const THROTTLE_MS = 1000;

/**
 * Broadcast user activity across all open browser tabs
 */
export const broadcastActivity = () => {
  const now = Date.now();
  if (now - lastBroadcast < THROTTLE_MS) return;
  lastBroadcast = now;

  try {
    localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
  } catch {}

  if (channel) {
    try {
      channel.postMessage({ type: 'USER_ACTIVITY', timestamp: now });
    } catch {}
  }
};

/**
 * Broadcast logout event across all open browser tabs
 */
export const broadcastLogout = (reason = 'manual') => {
  try {
    localStorage.setItem(
      STORAGE_KEY_LOGOUT_EVENT,
      JSON.stringify({ reason, timestamp: Date.now() })
    );
  } catch {}

  if (channel) {
    try {
      channel.postMessage({ type: 'LOGOUT', reason, timestamp: Date.now() });
    } catch {}
  }
};

/**
 * Check if ANY other open tab is currently active or visible.
 * Prevents a background tab from killing the session while the user is actively working in another tab.
 */
export const checkOtherTabsActive = (timeoutMs = 1200) => {
  return new Promise((resolve) => {
    // Fallback if BroadcastChannel is unavailable
    if (!channel) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
        if (stored) {
          const last = parseInt(stored, 10);
          if (!isNaN(last) && Date.now() - last < 5 * 60 * 1000) {
            resolve({ isActive: true, timestamp: last });
            return;
          }
        }
      } catch {}
      resolve({ isActive: false });
      return;
    }

    let hasResponded = false;
    let latestTimestamp = 0;

    const handler = (event) => {
      if (event?.data?.type === 'TAB_STILL_ACTIVE') {
        hasResponded = true;
        const ts = Number(event.data.timestamp || Date.now());
        if (ts > latestTimestamp) latestTimestamp = ts;
      }
    };

    channel.addEventListener('message', handler);

    try {
      channel.postMessage({ type: 'PRE_LOGOUT_PING' });
    } catch {
      resolve({ isActive: false });
      return;
    }

    setTimeout(() => {
      try {
        channel.removeEventListener('message', handler);
      } catch {}
      resolve({ isActive: hasResponded, timestamp: latestTimestamp || Date.now() });
    }, timeoutMs);
  });
};

export const getAuthChannel = () => channel;

