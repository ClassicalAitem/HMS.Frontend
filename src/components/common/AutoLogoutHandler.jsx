import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { FaClock, FaSignOutAlt, FaShieldAlt } from 'react-icons/fa';

// 15 minutes of inactivity timeout; warning shows up 2 minutes before the 15 minutes is complete
const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 900,000 ms (15 minutes)
const WARNING_DURATION_MS = 2 * 60 * 1000; // 2 minutes warning countdown before logout (120,000 ms)
const WARNING_THRESHOLD_MS = INACTIVITY_TIMEOUT_MS - WARNING_DURATION_MS; // 13 minutes (780,000 ms)
const THROTTLE_MS = 1000; // Throttle event listeners to run at most once per second
const CHECK_INTERVAL_MS = 1000; // Interval for checking inactivity elapsed time

const STORAGE_KEY_LAST_ACTIVITY = 'hms_last_activity';
const STORAGE_KEY_LOGOUT_EVENT = 'hms_inactivity_logout';

/**
 * Format total seconds into a readable MM:SS or m/s string
 */
const formatTimeRemaining = (totalSeconds) => {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins > 0) {
    return `${mins}m ${String(secs).padStart(2, '0')}s`;
  }
  return `${secs}s`;
};

const AutoLogoutHandler = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  const [showWarning, setShowWarning] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(WARNING_DURATION_MS / 1000);

  const lastActivityRef = useRef(Date.now());
  const isLoggingOutRef = useRef(false);
  const showWarningRef = useRef(false);

  // Keep ref synchronized with state for event handlers
  useEffect(() => {
    showWarningRef.current = showWarning;
  }, [showWarning]);

  // Execute logout
  const handleLogout = useCallback(
    async (isTimeout = true) => {
      if (isLoggingOutRef.current) return;
      isLoggingOutRef.current = true;
      setShowWarning(false);

      try {
        // Broadcast logout event to other open tabs
        try {
          localStorage.setItem(STORAGE_KEY_LOGOUT_EVENT, Date.now().toString());
        } catch {
          // Ignore localStorage errors
        }

        await dispatch(logoutUser());

        // Thoroughly clear all cached auth data
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
          localStorage.removeItem('changePasswordUserId');
          localStorage.removeItem(STORAGE_KEY_LAST_ACTIVITY);
          localStorage.removeItem(STORAGE_KEY_LOGOUT_EVENT);
        } catch {
          // Ignore localStorage errors
        }

        if (isTimeout) {
          toast.dismiss();
          toast.error('You were logged out due to 15 minutes of inactivity.', {
            id: 'inactivity-logout',
            duration: 6000,
            position: 'top-center',
            style: {
              background: '#ef4444',
              color: '#fff',
              fontSize: '15px',
              fontWeight: '500',
              padding: '14px 20px',
              borderRadius: '10px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            },
          });
        }

        navigate('/login', { replace: true });
      } catch (error) {
        console.error('Inactivity logout error:', error);
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('persist:root');
        } catch {}
        navigate('/login', { replace: true });
      } finally {
        setTimeout(() => {
          isLoggingOutRef.current = false;
        }, 1000);
      }
    },
    [dispatch, navigate]
  );

  // Extend session / reset activity timestamp
  const resetActivity = useCallback((isManualExtend = false) => {
    const now = Date.now();
    lastActivityRef.current = now;
    setShowWarning(false);
    setSecondsRemaining(WARNING_DURATION_MS / 1000);

    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
    } catch {
      // Ignore localStorage errors
    }

    if (isManualExtend) {
      toast.success('Session extended. You are still logged in.', {
        id: 'session-extended',
        duration: 3000,
      });
    }
  }, []);

  // Sync activity across tabs and listen for logout from other tabs
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    // Initialize lastActivity timestamp on login
    const initialTime = Date.now();
    lastActivityRef.current = initialTime;
    try {
      localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, initialTime.toString());
    } catch {
      // Ignore localStorage errors
    }

    const handleStorageEvent = (event) => {
      if (event.key === STORAGE_KEY_LAST_ACTIVITY && event.newValue) {
        const remoteTime = parseInt(event.newValue, 10);
        if (!isNaN(remoteTime) && remoteTime > lastActivityRef.current) {
          lastActivityRef.current = remoteTime;
          setShowWarning(false);
          setSecondsRemaining(WARNING_DURATION_MS / 1000);
        }
      } else if (event.key === STORAGE_KEY_LOGOUT_EVENT) {
        // Another tab triggered logout
        handleLogout(false);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    return () => {
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [isAuthenticated, token, handleLogout]);

  // Track user interaction events
  useEffect(() => {
    if (!isAuthenticated || !token) return;

    let lastRecorded = 0;

    const handleUserInteraction = (event) => {
      const now = Date.now();

      // If warning modal is currently shown:
      // Clicking anywhere or pressing any key directly resets activity and closes the modal
      if (showWarningRef.current) {
        if (event.type === 'click' || event.type === 'keydown' || event.type === 'touchstart') {
          resetActivity(true);
        }
        return;
      }

      // Normal activity tracking (throttled)
      if (now - lastRecorded < THROTTLE_MS) return;
      lastRecorded = now;

      lastActivityRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVITY, now.toString());
      } catch {
        // Ignore localStorage errors
      }
    };

    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'wheel', 'click'];

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleUserInteraction, { capture: true, passive: true });
    });

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleUserInteraction, { capture: true });
      });
    };
  }, [isAuthenticated, token, resetActivity]);

  // Main inactivity interval check & wake/visibility listener
  useEffect(() => {
    if (!isAuthenticated || !token) {
      setShowWarning(false);
      return;
    }

    const checkInactivity = () => {
      if (isLoggingOutRef.current) return;

      // Check the latest timestamp from localStorage (in case updated by another tab)
      let lastTime = lastActivityRef.current;
      try {
        const stored = localStorage.getItem(STORAGE_KEY_LAST_ACTIVITY);
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastTime) {
            lastTime = parsed;
            lastActivityRef.current = parsed;
          }
        }
      } catch {
        // Ignore localStorage errors
      }

      const now = Date.now();
      const elapsed = now - lastTime;

      // 1. If user has been inactive for 15 minutes or longer: auto logout
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        handleLogout(true);
        return;
      }

      // 2. If user is in the final 2 minutes (between 13 and 15 minutes): show warning modal
      if (elapsed >= WARNING_THRESHOLD_MS) {
        const remainingMs = INACTIVITY_TIMEOUT_MS - elapsed;
        const remainingSec = Math.max(1, Math.ceil(remainingMs / 1000));
        setShowWarning(true);
        setSecondsRemaining(remainingSec);
      } else {
        setShowWarning(false);
      }
    };

    const intervalId = setInterval(checkInactivity, CHECK_INTERVAL_MS);

    // Also check immediately when tab becomes visible or receives focus
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        checkInactivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [isAuthenticated, token, handleLogout]);

  // If not authenticated or warning shouldn't be shown, render nothing
  if (!showWarning || !isAuthenticated) return null;

  const totalWarningSeconds = WARNING_DURATION_MS / 1000; // 120 seconds (2 minutes)

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={() => resetActivity(true)}
      />

      {/* Modal Card */}
      <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl bg-base-100 p-6 shadow-2xl border border-warning/30 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center">
          {/* Animated Warning Icon */}
          <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-warning/20 opacity-75" />
            <FaClock className="h-8 w-8" />
          </div>

          {/* Heading */}
          <h3 className="text-xl font-bold text-base-content mb-1">
            Session Inactivity Warning
          </h3>

          {/* Countdown indicator badge */}
          <div className="my-2 inline-flex items-center gap-2 rounded-full bg-warning/15 px-3.5 py-1 text-sm font-semibold text-warning">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warning opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-warning"></span>
            </span>
            Logging out in {formatTimeRemaining(secondsRemaining)}
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-base-200 rounded-full h-2 overflow-hidden my-3">
            <div
              className="bg-warning h-full transition-all duration-1000 ease-linear rounded-full"
              style={{ width: `${Math.min(100, Math.max(0, (secondsRemaining / totalWarningSeconds) * 100))}%` }}
            />
          </div>

          {/* Explanation */}
          <p className="mt-1 text-sm text-base-content/70 leading-relaxed">
            You have been inactive for over 13 minutes. For hospital security and patient privacy, your session will automatically log out when the countdown reaches zero.
          </p>

          {/* Action Buttons */}
          <div className="mt-6 flex w-full flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => resetActivity(true)}
              className="btn btn-primary flex-1 font-semibold shadow-md flex items-center justify-center gap-2"
            >
              <FaShieldAlt className="h-4 w-4" />
              Stay Logged In
            </button>
            <button
              type="button"
              onClick={() => handleLogout(false)}
              className="btn btn-outline btn-error flex-1 font-semibold flex items-center justify-center gap-2"
            >
              <FaSignOutAlt className="h-4 w-4" />
              Log Out Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoLogoutHandler;
