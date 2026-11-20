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

  const userRole = normalizeRole(user?.role || user?.accountType);
  const userShift = (user?.shift || '').toLowerCase().trim();
  const isExempt = EXEMPT_ROLES.includes(userRole) || (!userShift || (userShift !== 'morning' && userShift !== 'night'));

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

        // If locked, reset acknowledged warning
        if (data.isLocked) {
          setIsWarningActive(false);
        }
      }
    } catch (err) {
      console.warn('Shift status check failed:', err?.message);
    } finally {
      setIsCheckingStatus(false);
    }
  }, [isAuthenticated, user, isExempt]);

  // Initial status check & periodic sync
  useEffect(() => {
    if (!isAuthenticated || !user || isExempt) return;

    fetchShiftStatus();
    const interval = setInterval(fetchShiftStatus, 45000); // sync every 45s
    return () => clearInterval(interval);
  }, [fetchShiftStatus, isAuthenticated, user, isExempt]);

  // Handle Logout Execution
  const handleAutoLogout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      await shiftAccessAPI.recordShiftEnd().catch(() => {});
      await dispatch(logoutUser());
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
      navigate('/login', { replace: true });
    } catch {
      navigate('/login', { replace: true });
    }
  }, [dispatch, navigate]);

  // Client-side second-by-second countdown clock for active shift strictly in Africa/Lagos time (WAT)
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

      if (userShift === 'morning') {
        const morningStartSec = 7 * 3600; // 07:00 AM Lagos Time
        const warningSec = 18 * 3600; // 18:00 / 6:00 PM Lagos Time
        const logoutSec = 18 * 3600 + 30 * 60; // 18:30 / 6:30 PM Lagos Time

        // Morning Shift login is allowed from 7:00 AM to 6:30 PM in the evening
        // Outside of 07:00 to 18:30: lock out
        if (currentTotalSec >= logoutSec || currentTotalSec < morningStartSec) {
          setIsLocked(true);
          setLockoutReason(
            'Morning Shift login is allowed from 7:00 AM to 6:30 PM (Lagos Time). Your shift ended at 6:30 PM.'
          );
          if (currentTotalSec >= logoutSec && currentTotalSec < logoutSec + 15) {
            handleAutoLogout();
          }
          return null;
        }

        // Inside 30-min warning window (18:00 - 18:30 Lagos Time)
        if (currentTotalSec >= warningSec && currentTotalSec < logoutSec) {
          const rem = logoutSec - currentTotalSec;
          setIsWarningActive(true);
          setIsLocked(false);
          return rem;
        }

        // Active morning working window (07:00 - 18:00 Lagos Time)
        setIsWarningActive(false);
        setIsLocked(false);
        return logoutSec - currentTotalSec;
      }

      if (userShift === 'night') {
        const nightStartSec = 17 * 3600; // 17:00 / 5:00 PM Lagos Time
        const warningSec = 8 * 3600; // 08:00 AM Lagos Time
        const logoutSec = 8 * 3600 + 30 * 60; // 08:30 AM Lagos Time

        // Night Shift login is allowed from 5:00 PM to 8:30 AM next morning
        // Outside of 17:00 to 08:30 (i.e. 08:30 to 17:00 in the daytime): lock out
        if (currentTotalSec >= logoutSec && currentTotalSec < nightStartSec) {
          setIsLocked(true);
          setLockoutReason(
            'Night Shift login is allowed from 5:00 PM to 8:30 AM (Lagos Time). Your shift ended at 8:30 AM.'
          );
          if (currentTotalSec >= logoutSec && currentTotalSec < logoutSec + 15) {
            handleAutoLogout();
          }
          return null;
        }

        // Inside 30-min warning window (08:00 - 08:30 AM Lagos Time)
        if (currentTotalSec >= warningSec && currentTotalSec < logoutSec) {
          const rem = logoutSec - currentTotalSec;
          setIsWarningActive(true);
          setIsLocked(false);
          return rem;
        }

        // Active night working window (17:00 to 08:00 AM Lagos Time)
        setIsWarningActive(false);
        setIsLocked(false);
        if (currentTotalSec >= nightStartSec) {
          return 24 * 3600 - currentTotalSec + logoutSec;
        } else {
          return logoutSec - currentTotalSec;
        }
      }

      return null;
    };

    const timer = setInterval(() => {
      const rem = calculateClientSeconds();
      setSecondsRemaining(rem);
    }, 1000);

    const initialRem = calculateClientSeconds();
    setSecondsRemaining(initialRem);

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

  const handleManualLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
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
                  {userShift} Shift
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
                    (userShift === 'morning'
                      ? 'Your Morning Shift ended at 6:30 PM. Your account cannot access the system until your next shift begins tomorrow at 7:00 AM.'
                      : 'Your Night Shift ended at 8:30 AM. Your account cannot access the system until your next shift begins this evening at 5:00 PM.')}
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
                    Your request for extra shift access is currently awaiting review by Super Admin or HR.
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
                    Request Extra Shift / Overtime Access
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
                      <option value="double_shift">Double Shift (Full next shift)</option>
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
                  className="btn btn-outline btn-error btn-sm w-full sm:w-auto gap-2"
                >
                  <FaSignOutAlt className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {!showRequestForm && (
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(true)}
                      className="btn btn-primary btn-sm w-full sm:w-auto gap-1.5 font-semibold shadow-md"
                    >
                      <FaPaperPlane className="w-3 h-3" />
                      <span>{pendingRequest ? 'Update Request' : 'Request Access'}</span>
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
                  Your {userShift === 'morning' ? 'Morning Shift (ends 6:30 PM)' : 'Night Shift (ends 8:30 AM)'} is finishing.
                </p>
                <p>
                  Please conclude and save any open consultations, prescriptions, or patient vitals.
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
