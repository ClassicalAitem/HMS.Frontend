import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logoutUser } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import {
  FaClock,
  FaShieldAlt,
  FaSignOutAlt,
  FaExclamationTriangle,
  FaPaperPlane,
  FaSync,
  FaCheckCircle,
} from 'react-icons/fa';
import shiftAccessAPI from '@/services/api/shiftAccessAPI';

const EXEMPT_ROLES = [
  'super-admin',
  'superadmin',
  'admin',
  'medical-director',
  'medical_director',
  'human-resource',
  'hr',
];

const normalizeRole = (role) =>
  String(role || '')
    .toLowerCase()
    .trim()
    .replace(/[_ ]/g, '-');

/**
 * Extracts date and time strictly in Africa/Lagos (UTC+1, WAT).
 * Guarantees hospital shift enforcement matches Lagos time regardless of local device timezone.
 */
const getLagosDateTime = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map = {};
  for (const p of parts) map[p.type] = p.value;

  const hour = parseInt(map.hour, 10) === 24 ? 0 : parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);
  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);

  const totalSeconds = hour * 3600 + minute * 60 + second;
  return { year, month, day, hour, minute, second, totalSeconds };
};

const ShiftCountdown = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Evaluation & lock states
  const [shiftStatus, setShiftStatus] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutReason, setLockoutReason] = useState('');
  const [nextAllowedTime, setNextAllowedTime] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(null);

  // Warning modal & countdown
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isWarningActive, setIsWarningActive] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);

  // Request Access Form inside lock modal
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [requestType, setRequestType] = useState('double_shift');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const isLoggingOutRef = useRef(false);
  const preWarningCheckedForRef = useRef(null);

  const userRole = normalizeRole(user?.role || user?.accountType);
  const userShift = (user?.shift || '').toLowerCase().trim();
  // Only SuperAdmin, Medical Director, and HR are exempt from shift logout limits
  const isExempt = EXEMPT_ROLES.includes(userRole);

  // Query backend for accurate shift lock status
  const fetchShiftStatus = useCallback(async () => {
    if (!isAuthenticated || !user || isExempt) return;
    try {
      setIsCheckingStatus(true);
      const res = await shiftAccessAPI.getShiftStatus();
      if (res?.data?.data) {
        const data = res.data.data;
        setShiftStatus(data);
        setIsLocked(Boolean(data.isLocked));
        setLockoutReason(data.lockoutReason || '');
        setNextAllowedTime(data.nextAllowedLoginTime || null);
        setPendingRequest(data.pendingRequest || null);

        if (data.isLocked) {
          setIsWarningActive(false);
          handleAutoLogout();
        } else if (data.state === 'warning') {
          setIsWarningActive(true);
          if (data.secondsUntilLogout != null) {
            setSecondsRemaining(data.secondsUntilLogout);
            if (data.secondsUntilLogout <= 0) {
              handleAutoLogout();
            }
          }
        } else if (data.state === 'active') {
          setIsLocked(false);
        }
      }
    } catch (err) {
      console.warn('Shift status check failed:', err?.message);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [isAuthenticated, user, isExempt]);

  // Initial status check on mount / auth change
  useEffect(() => {
    if (!isAuthenticated || !user || isExempt) return;

    fetchShiftStatus();
  }, [fetchShiftStatus, isAuthenticated, user, isExempt]);

  // Schedule a single backend status sync 1 minute before the 30-minute warning window
  useEffect(() => {
    if (!isAuthenticated || !user || isExempt || !shiftStatus) return;
    if (shiftStatus.isLocked || shiftStatus.hasActiveOverride || shiftStatus.state !== 'active') return;

    const shiftKey = shiftStatus.autoLogoutTime || shiftStatus.warningStartTime || 'current';
    if (preWarningCheckedForRef.current === shiftKey) return;

    let delayMs = null;
    if (typeof shiftStatus.secondsUntilLogout === 'number') {
      delayMs = (shiftStatus.secondsUntilLogout - 31 * 60) * 1000;
    } else if (shiftStatus.warningStartTime) {
      delayMs = new Date(shiftStatus.warningStartTime).getTime() - 60 * 1000 - Date.now();
    }

    if (delayMs === null || delayMs <= 0) return;

    const timeout = setTimeout(() => {
      preWarningCheckedForRef.current = shiftKey;
      fetchShiftStatus();
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [fetchShiftStatus, isAuthenticated, user, isExempt, shiftStatus]);

  // Handle Logout Execution
  const handleAutoLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await shiftAccessAPI.recordShiftEnd().catch(() => {});
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('persist:root');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('changePasswordUserId');
      } catch {}
      await dispatch(logoutUser()).catch(() => {});
      toast.dismiss();
      toast.error('Your shift has ended and your account has been logged out for the scheduled resting period.', {
        id: 'shift-logout',
        duration: 7000,
        position: 'top-center',
        style: {
          background: '#ef4444',
          color: '#fff',
          fontSize: '15px',
          fontWeight: 'bold',
          padding: '16px 22px',
          borderRadius: '12px',
          boxShadow: '0 15px 30px -5px rgba(0, 0, 0, 0.4)',
        },
      });
      window.location.replace('/login');
    } catch {
      window.location.replace('/login');
    }
  }, [dispatch]);

  // Client-side second-by-second countdown clock strictly in Africa/Lagos time (WAT)
  useEffect(() => {
    if (!isAuthenticated || !user || isExempt) {
      setSecondsRemaining(null);
      setIsWarningActive(false);
      return;
    }

    if (shiftStatus?.hasActiveOverride) {
      setIsLocked(false);
      setIsWarningActive(false);
      return;
    }

    const calculateClientSeconds = () => {
      const lagos = getLagosDateTime(new Date());
      const currentTotalSec = lagos.totalSeconds;

      // Determine active shift:
      // Morning Shift: 08:00 AM to 06:30 PM (18:30)
      // Night Shift: 05:00 PM (17:00) to 08:30 AM next morning
      let activeShift = userShift === 'morning' || userShift === 'night' ? userShift : shiftStatus?.shift;
      if (!activeShift) {
        if (currentTotalSec >= 8 * 3600 && currentTotalSec < 17 * 3600) {
          activeShift = 'morning';
        } else if (currentTotalSec >= 17 * 3600 && currentTotalSec < 18 * 3600 + 30 * 60) {
          activeShift = shiftStatus?.hasWorkedEndingShift ? 'morning' : 'night';
        } else if (currentTotalSec >= 8 * 3600 && currentTotalSec < 8 * 3600 + 30 * 60) {
          activeShift = shiftStatus?.hasWorkedEndingShift ? 'night' : 'morning';
        } else {
          activeShift = 'night';
        }
      }

      if (activeShift === 'morning') {
        const morningStartSec = 8 * 3600; // 08:00 AM Lagos Time
        const warningSec = 18 * 3600; // 18:00 / 6:00 PM Lagos Time
        const logoutSec = 18 * 3600 + 30 * 60; // 18:30 / 6:30 PM Lagos Time

        // Inside 30-min warning window (18:00 - 18:30 Lagos Time)
        if (currentTotalSec >= warningSec && currentTotalSec < logoutSec) {
          const rem = logoutSec - currentTotalSec;
          setIsWarningActive(true);
          setIsLocked(false);
          return rem;
        }

        // Active morning working window (08:00 - 18:00 Lagos Time)
        if (currentTotalSec >= morningStartSec && currentTotalSec < warningSec) {
          setIsWarningActive(false);
          setIsLocked(false);
          return logoutSec - currentTotalSec;
        }

        // Shift ended (past 6:30 PM / 18:30 or before 8:00 AM Lagos Time)
        if (currentTotalSec >= logoutSec || currentTotalSec < morningStartSec) {
          setIsWarningActive(false);
          setIsLocked(true);
          setLockoutReason(
            'Morning Shift login is allowed from 8:00 AM to 6:30 PM (Lagos Time). Your shift ended at 6:30 PM.'
          );
          handleAutoLogout();
          return 0;
        }
      }

      if (activeShift === 'night') {
        const nightStartSec = 17 * 3600; // 17:00 / 5:00 PM Lagos Time
        const warningSec = 8 * 3600; // 08:00 AM Lagos Time
        const logoutSec = 8 * 3600 + 30 * 60; // 08:30 AM Lagos Time

        // Inside 30-min warning window (08:00 - 08:30 AM Lagos Time)
        if (currentTotalSec >= warningSec && currentTotalSec < logoutSec) {
          const rem = logoutSec - currentTotalSec;
          setIsWarningActive(true);
          setIsLocked(false);
          return rem;
        }

        // Active night working window (17:00 to 08:00 AM Lagos Time)
        if (currentTotalSec >= nightStartSec || currentTotalSec < warningSec) {
          setIsWarningActive(false);
          setIsLocked(false);
          if (currentTotalSec >= nightStartSec) {
            return 24 * 3600 - currentTotalSec + logoutSec;
          } else {
            return logoutSec - currentTotalSec;
          }
        }

        // Shift ended (past 08:30 AM and before 5:00 PM Lagos Time)
        if (currentTotalSec >= logoutSec && currentTotalSec < nightStartSec) {
          setIsWarningActive(false);
          setIsLocked(true);
          setLockoutReason(
            'Night Shift login is allowed from 5:00 PM to 8:30 AM (Lagos Time). Your shift ended at 8:30 AM.'
          );
          handleAutoLogout();
          return 0;
        }
      }

      return null;
    };

    const timer = setInterval(() => {
      const rem = calculateClientSeconds();
      setSecondsRemaining(rem);
      if (rem !== null && rem <= 0) {
        handleAutoLogout();
      }
    }, 1000);

    const initialRem = calculateClientSeconds();
    setSecondsRemaining(initialRem);
    if (initialRem !== null && initialRem <= 0) {
      handleAutoLogout();
    }

    return () => clearInterval(timer);
  }, [isAuthenticated, user, isExempt, userShift, shiftStatus, handleAutoLogout]);

  // Submit Shift Access / Double Shift Request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestReason.trim()) {
      toast.error('Please provide a reason for requesting shift access.');
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const res = await shiftAccessAPI.requestAccess({
        reason: requestReason.trim(),
        requestType,
      });

      toast.success('Access request submitted! Awaiting Super Admin or HR approval.');
      setPendingRequest(res?.data?.data || { reason: requestReason, status: 'pending' });
      setShowRequestForm(false);
      setRequestReason('');
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to submit request.');
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleManualLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const toastId = toast.loading('Logging you out...');
    try {
      setIsLocked(false);
      try {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('persist:root');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        localStorage.removeItem('changePasswordUserId');
      } catch {}
      await dispatch(logoutUser()).catch(() => {});
      toast.success('Logged out successfully', { id: toastId });
      window.location.replace('/login');
    } catch (err) {
      console.error('Logout failed:', err);
      window.location.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Format seconds into MM:SS
  const formatTimer = (totalSec) => {
    if (!totalSec || totalSec <= 0) return '00:00';
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Don't render anything if exempt or on auth pages
  const isAuthPage = ['/login', '/forgot-password', '/change-password-default'].includes(location.pathname);
  if (!isAuthenticated || !user || isExempt || isAuthPage) {
    return null;
  }

  // Active shift label for UI
  const currentShiftLabel = userShift === 'morning' || shiftStatus?.shift === 'morning'
    ? 'Morning Shift (ends 6:30 PM)'
    : 'Night Shift (ends 8:30 AM)';

  return (
    <>
      {/* =========================================================================
          STATE 1: POST-SHIFT COOLDOWN LOCKOUT MODAL (FULL SCREEN BLOCKER)
          ========================================================================= */}
      {isLocked && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative my-auto w-full max-w-lg rounded-2xl bg-base-100 shadow-2xl border border-error/30 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Ribbon */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-6 text-white text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-xs mb-3 shadow-inner">
                <FaShieldAlt className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                Shift Completed — Access Restricted
              </h2>
              <p className="text-xs text-rose-100 mt-1">
                Hospital rest policy: staff accounts are locked between completed shifts.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* User Shift Badge */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-base-200/70 border border-base-300">
                <div>
                  <p className="text-xs text-base-content/60 font-medium">Staff Member:</p>
                  <p className="text-sm font-bold text-base-content capitalize">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
                  </p>
                </div>
                <span className="badge badge-error badge-outline text-xs capitalize font-semibold">
                  {userShift || shiftStatus?.shift || 'Hospital'} Shift
                </span>
              </div>

              {/* Explanatory Message */}
              <div className="rounded-xl bg-error/10 p-4 border border-error/20 text-xs sm:text-sm text-base-content leading-relaxed space-y-2">
                <p className="font-semibold text-error flex items-center gap-1.5">
                  <FaExclamationTriangle className="shrink-0" />
                  <span>Scheduled resting period in effect</span>
                </p>
                <p className="text-base-content/80">
                  {lockoutReason ||
                    (userShift === 'night'
                      ? 'Your Night Shift ended at 8:30 AM. Your account cannot access the system until your next shift begins this evening at 5:00 PM.'
                      : 'Your Morning Shift ended at 6:30 PM. Your account cannot access the system until your next shift begins tomorrow at 8:00 AM.')}
                </p>
                {nextAllowedTime && (
                  <p className="text-[11px] text-base-content/60 font-medium pt-1">
                    Next standard access opens:{' '}
                    <span className="font-bold text-base-content">
                      {new Date(nextAllowedTime).toLocaleString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                )}
              </div>

              {/* Pending Request Status Banner */}
              {pendingRequest && (
                <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="badge badge-warning text-xs font-semibold gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-800 animate-ping"></span>
                      Pending Approval
                    </span>
                    <button
                      onClick={fetchShiftStatus}
                      disabled={isCheckingStatus}
                      className="btn btn-ghost btn-xs gap-1 text-xs text-primary"
                    >
                      <FaSync className={`w-3 h-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
                      <span>Check Status</span>
                    </button>
                  </div>
                  <p className="text-xs text-base-content/80">
                    Your request for rollover / double shift access is currently awaiting review by Super Admin or HR.
                  </p>
                  <p className="text-[11px] text-base-content/60 italic">
                    Reason: &ldquo;{pendingRequest.reason}&rdquo;
                  </p>
                </div>
              )}

              {/* Request Access Form (Expanded) */}
              {showRequestForm && (
                <form onSubmit={handleSubmitRequest} className="rounded-xl bg-base-200/60 p-4 border border-base-300 space-y-3">
                  <h4 className="text-xs font-bold text-base-content uppercase tracking-wider">
                    Request Rollover / Double Shift Access
                  </h4>

                  <div>
                    <label className="block text-xs font-semibold text-base-content/80 mb-1">
                      Request Type
                    </label>
                    <select
                      value={requestType}
                      onChange={(e) => setRequestType(e.target.value)}
                      className="select select-bordered select-sm w-full text-xs"
                    >
                      <option value="double_shift">Rollover Shift (Full next shift)</option>
                      <option value="overtime">Emergency Overtime Extension</option>
                      <option value="shift_extension">Shift Handover Extension</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-base-content/80 mb-1">
                      Reason for Access <span className="text-error">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="e.g. Covering emergency surgical theater, covering duty for sick colleague..."
                      value={requestReason}
                      onChange={(e) => setRequestReason(e.target.value)}
                      className="textarea textarea-bordered w-full text-xs leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(false)}
                      className="btn btn-ghost btn-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingRequest}
                      className="btn btn-primary btn-xs gap-1.5 font-semibold"
                    >
                      {isSubmittingRequest ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="w-2.5 h-2.5" />
                          <span>Submit to Admin/HR</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleManualLogout}
                  disabled={isLoggingOut}
                  className="btn btn-outline btn-error btn-sm w-full sm:w-auto gap-2"
                >
                  {isLoggingOut ? (
                    <>
                      <span className="loading loading-spinner loading-xs" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <FaSignOutAlt className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!showRequestForm && (
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(true)}
                      className="btn btn-primary btn-sm w-full sm:w-auto gap-1.5 font-semibold shadow-md"
                    >
                      <FaPaperPlane className="w-3 h-3" />
                      <span>{pendingRequest ? 'Update Request' : 'Request Rollover Shift'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE 2: 30-MINUTE AUTO-LOGOUT WARNING MODAL
          ========================================================================= */}
      {isWarningActive && !hasAcknowledgedWarning && !isLocked && (
        <div
          className="fixed inset-0 z-[99998] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-base-100 shadow-2xl border border-warning/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Header */}
            <div className="bg-gradient-to-r from-amber-500 to-orange-600 p-5 text-white flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-xs shrink-0">
                <FaClock className="h-6 w-6 text-white animate-spin" style={{ animationDuration: '6s' }} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Shift Ending Soon</h3>
                <p className="text-xs text-amber-100">
                  Automatic logout in 30 minutes.
                </p>
              </div>
            </div>

            {/* Warning Content */}
            <div className="p-6 space-y-4 text-center">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-base-content/80 leading-relaxed">
                <p className="font-semibold text-base-content mb-1">
                  Your {currentShiftLabel} is finishing.
                </p>
                <p>
                  Please conclude and save any open consultations, laboratory tests, billing, or patient records.
                  You will be automatically logged out when the countdown reaches zero.
                </p>
              </div>

              {/* Big Countdown Display */}
              <div className="py-2">
                <div className="inline-flex flex-col items-center justify-center px-6 py-3 rounded-2xl bg-base-200 border border-base-300 shadow-inner">
                  <span className="text-xs text-base-content/60 font-semibold uppercase tracking-wider">
                    Auto-Logout In
                  </span>
                  <span className="font-mono text-3xl font-black text-warning">
                    {formatTimer(secondsRemaining)}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => setHasAcknowledgedWarning(true)}
                className="btn btn-primary btn-sm sm:btn-md w-full gap-2 font-semibold shadow-md"
              >
                <FaCheckCircle className="w-4 h-4" />
                <span>I Understand (Continue Working)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STATE 3: STICKY FLOATING COUNTDOWN BADGE (LESS THAN 30 MINS REMAINING)
          ========================================================================= */}
      {isWarningActive && hasAcknowledgedWarning && !isLocked && (
        <div className="fixed top-3 left-1/2 transform -translate-x-1/2 z-[99990] flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500 text-white font-bold text-xs shadow-xl animate-pulse">
          <FaClock className="w-3.5 h-3.5 shrink-0" />
          <span>
            Shift Auto-Logout: <span className="font-mono font-black">{formatTimer(secondsRemaining)}</span>
          </span>
          <button
            onClick={() => setHasAcknowledgedWarning(false)}
            className="ml-1 underline text-[11px] opacity-90 hover:opacity-100"
          >
            Details
          </button>
        </div>
      )}
    </>
  );
};

export default ShiftCountdown;
