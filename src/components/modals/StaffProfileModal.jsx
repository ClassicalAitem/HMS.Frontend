import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usersAPI from '@/services/api/usersAPI';
import shiftAccessAPI from '@/services/api/shiftAccessAPI';
import toast from 'react-hot-toast';
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import {
  FaUserCircle,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUserFriends,
  FaLock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEdit,
  FaTimes,
  FaIdBadge,
  FaHospital,
  FaClock,
  FaHistory,
  FaExternalLinkAlt,
  FaBan,
  FaCheck,
  FaKey,
  FaSync,
  FaUserCheck,
} from 'react-icons/fa';

const generateInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last || 'U';
};

const formatRole = (role) => {
  if (!role) return 'Staff';
  return role
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const StaffProfileModal = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onToggleLeave,
  onEdit,
  onResetPassword,
}) => {
  const navigate = useNavigate();

  const [fullUser, setFullUser] = useState(user || null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);
  const [shiftRequests, setShiftRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  // Load fresh user data and shift requests
  const loadUserDetails = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoadingUser(true);
    setIsLoadingRequests(true);

    try {
      // 1. Fetch fresh full user record
      const res = await usersAPI.getUserById(userId);
      const freshUser = res?.data?.data || res?.data;
      if (freshUser) {
        setFullUser(freshUser);
      }
    } catch (err) {
      console.warn('Could not load fresh user profile:', err?.message);
    } finally {
      setIsLoadingUser(false);
    }

    try {
      // 2. Fetch shift access requests for this user
      const reqRes = await shiftAccessAPI.getAllRequests();
      const allReqs = reqRes?.data?.data || [];
      const userReqs = allReqs.filter((r) => r.userId === userId || r.user?.id === userId);
      setShiftRequests(userReqs);
    } catch (err) {
      console.warn('Could not load shift requests for staff:', err?.message);
    } finally {
      setIsLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && user?.id) {
      setFullUser(user);
      loadUserDetails(user.id);
    } else {
      setFullUser(null);
      setShiftRequests([]);
    }
  }, [isOpen, user, loadUserDetails]);

  if (!isOpen || !user) return null;

  const activeUser = fullUser || user;
  const isProfileComplete = Boolean(activeUser?.isProfileCompleted);
  const isOnLeave = Boolean(activeUser?.isOnLeave);
  const isDisabled = Boolean(activeUser?.isDisabled);

  // Handle reviewing pending shift request from within this modal
  const handleReviewShiftRequest = async (requestId, decisionStatus) => {
    setReviewingId(requestId);
    try {
      await shiftAccessAPI.reviewRequest(requestId, {
        status: decisionStatus,
      });
      toast.success(`Shift request ${decisionStatus} successfully!`);
      loadUserDetails(activeUser.id);
      if (onUserUpdated) onUserUpdated();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to review request');
    } finally {
      setReviewingId(null);
    }
  };

  const handleOpenFullPage = () => {
    onClose();
    navigate(`/profile/${activeUser.id}`);
  };

  return (
    <div className="modal modal-open z-50">
      <div className="modal-box w-11/12 max-w-4xl max-h-[92vh] p-0 rounded-2xl overflow-hidden shadow-2xl border border-base-300 bg-base-100 flex flex-col">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-r from-teal-700 via-cyan-700 to-sky-800 text-white p-5 sm:p-6 pb-6">
          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4 text-white hover:bg-white/20 transition-all"
            title="Close"
          >
            ✕
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/10 backdrop-blur-md border-2 border-white/20 text-white flex items-center justify-center font-extrabold text-xl sm:text-2xl shadow-lg shrink-0">
                {generateInitials(activeUser.firstName, activeUser.lastName)}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight capitalize">
                    {activeUser.firstName} {activeUser.lastName}
                  </h2>
                  <span className="badge badge-sm bg-white/20 text-white border-0 font-medium font-mono text-[11px]">
                    ID: {activeUser.id?.slice(0, 8)}...
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="badge badge-sm bg-emerald-500 text-white border-0 font-semibold text-xs">
                    {formatRole(activeUser.role || activeUser.accountType)}
                  </span>

                  {activeUser.shift && (
                    <span className="badge badge-sm bg-white/20 text-white border-0 capitalize flex items-center gap-1 text-xs">
                      <FaClock className="w-2.5 h-2.5" />
                      <span>{activeUser.shift} Shift</span>
                    </span>
                  )}

                  {isOnLeave ? (
                    <span className="badge badge-sm bg-amber-500 text-white border-0 font-semibold flex items-center gap-1 text-xs">
                      <FaBan className="w-2.5 h-2.5" />
                      <span>On Leave (Login Blocked)</span>
                    </span>
                  ) : (
                    <span className="badge badge-sm bg-teal-500 text-white border-0 font-semibold flex items-center gap-1 text-xs">
                      <FaUserCheck className="w-2.5 h-2.5" />
                      <span>On Duty / Active</span>
                    </span>
                  )}

                  {isDisabled && (
                    <span className="badge badge-sm bg-rose-600 text-white border-0 font-semibold text-xs">
                      Account Disabled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Buttons in Banner */}
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEdit(activeUser);
                  }}
                  className="btn btn-xs sm:btn-sm bg-white/15 hover:bg-white/25 text-white border-white/20 gap-1.5 font-medium"
                  title="Edit staff details"
                >
                  <FaEdit className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              )}

              {onToggleLeave && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onToggleLeave(activeUser, isOnLeave);
                  }}
                  className={`btn btn-xs sm:btn-sm border-0 gap-1.5 font-medium ${
                    isOnLeave
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                  title={isOnLeave ? 'Return staff to active duty' : 'Mark staff on leave'}
                >
                  <FaClock className="w-3 h-3" />
                  <span>{isOnLeave ? 'Return to Duty' : 'Set On Leave'}</span>
                </button>
              )}

              {onResetPassword && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onResetPassword(activeUser);
                  }}
                  className="btn btn-xs sm:btn-sm bg-white/15 hover:bg-white/25 text-white border-white/20 gap-1.5 font-medium"
                  title="Reset staff password"
                >
                  <FaKey className="w-3 h-3" />
                  <span>Password</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleOpenFullPage}
                className="btn btn-xs sm:btn-sm bg-white text-teal-800 hover:bg-white/90 border-0 gap-1.5 font-bold shadow-sm"
                title="Open complete dedicated profile page"
              >
                <FaExternalLinkAlt className="w-3 h-3" />
                <span>Full Page</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto flex-1 p-5 sm:p-6 space-y-6">
          {isLoadingUser && (
            <div className="alert alert-info py-2 px-3 text-xs flex items-center gap-2">
              <span className="loading loading-spinner loading-xs"></span>
              <span>Syncing latest staff profile details...</span>
            </div>
          )}

          {/* Grid Layout: Contact & Personal Details (Left) + Hospital Account (Right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left 2 Cols: Personal & Emergency Contact */}
            <div className="md:col-span-2 space-y-6">
              {/* Card 1: Personal & Contact Details */}
              <div className="card bg-base-100 border border-base-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                  <FaPhoneAlt className="text-primary text-sm" />
                  <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                    Personal & Contact Details
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <span className="text-[11px] font-semibold text-base-content/60 flex items-center gap-1.5">
                      <FaPhoneAlt className="w-2.5 h-2.5 text-primary" />
                      Phone Number
                    </span>
                    <p className="text-sm font-bold text-base-content mt-1">
                      {activeUser.phoneNumber || (
                        <span className="text-base-content/40 italic font-normal">Not provided</span>
                      )}
                    </p>
                  </div>

                  {/* Email */}
                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-base-content/60 flex items-center gap-1.5">
                        <FaEnvelope className="w-2.5 h-2.5 text-primary" />
                        Email Address
                      </span>
                      <span className="badge badge-ghost badge-xs text-[10px]">Optional</span>
                    </div>
                    <p className="text-sm font-bold text-base-content mt-1 truncate">
                      {activeUser.email || (
                        <span className="text-base-content/40 italic font-normal">Not provided</span>
                      )}
                    </p>
                  </div>

                  {/* Date of Birth */}
                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-base-content/60 flex items-center gap-1.5">
                        <FaCalendarAlt className="w-2.5 h-2.5 text-primary" />
                        Date of Birth
                      </span>
                      <span className="badge badge-ghost badge-xs text-[10px]">Optional</span>
                    </div>
                    <p className="text-sm font-bold text-base-content mt-1">
                      {activeUser.dob ? (
                        formatNigeriaDate(activeUser.dob)
                      ) : (
                        <span className="text-base-content/40 italic font-normal">Not specified</span>
                      )}
                    </p>
                  </div>

                  {/* Profile Status */}
                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <span className="text-[11px] font-semibold text-base-content/60 flex items-center gap-1.5">
                      <FaCheckCircle className="w-2.5 h-2.5 text-primary" />
                      Profile Completion
                    </span>
                    <div className="mt-1">
                      {isProfileComplete ? (
                        <span className="badge badge-success badge-sm gap-1 text-white font-semibold">
                          <FaCheck className="w-2.5 h-2.5" />
                          Complete
                        </span>
                      ) : (
                        <span className="badge badge-warning badge-sm gap-1 font-semibold">
                          <FaExclamationTriangle className="w-2.5 h-2.5" />
                          Incomplete
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Residential Address */}
                <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                  <span className="text-[11px] font-semibold text-base-content/60 flex items-center gap-1.5">
                    <FaMapMarkerAlt className="w-2.5 h-2.5 text-primary" />
                    Residential Address
                  </span>
                  <p className="text-sm font-medium text-base-content mt-1 leading-relaxed">
                    {activeUser.address || (
                      <span className="text-base-content/40 italic font-normal">
                        No residential address recorded
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Card 2: Emergency Contact / Next of Kin */}
              <div className="card bg-base-100 border border-base-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-base-200 pb-3">
                  <div className="flex items-center gap-2">
                    <FaUserFriends className="text-primary text-sm" />
                    <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                      Emergency Contact / Next of Kin
                    </h3>
                  </div>
                  <span className="badge badge-ghost badge-sm text-[10px]">Optional</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <span className="text-[11px] font-semibold text-base-content/60">
                      Contact Name
                    </span>
                    <p className="text-sm font-bold text-base-content mt-1">
                      {activeUser.nextOfKin?.name || (
                        <span className="text-base-content/40 italic font-normal">Not provided</span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <span className="text-[11px] font-semibold text-base-content/60">
                      Emergency Phone
                    </span>
                    <p className="text-sm font-bold text-base-content mt-1">
                      {activeUser.nextOfKin?.phone || (
                        <span className="text-base-content/40 italic font-normal">Not provided</span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-base-200/50 border border-base-200">
                    <span className="text-[11px] font-semibold text-base-content/60">
                      Relationship
                    </span>
                    <p className="text-sm font-bold text-base-content mt-1">
                      {activeUser.nextOfKin?.relationship || (
                        <span className="text-base-content/40 italic font-normal">Not provided</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 1 Col: Hospital Account & Security */}
            <div className="space-y-6">
              <div className="card bg-base-100 border border-base-200 shadow-xs p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                  <FaHospital className="text-primary text-sm" />
                  <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                    Hospital Account
                  </h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Full Name</span>
                    <span className="font-bold text-base-content capitalize">
                      {activeUser.firstName} {activeUser.lastName}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Role / Cadre</span>
                    <span className="badge badge-primary badge-sm font-semibold capitalize">
                      {formatRole(activeUser.role || activeUser.accountType)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Department</span>
                    <span className="font-bold text-base-content">
                      {activeUser.department?.name || activeUser.departmentName || 'General Hospital'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Shift Schedule</span>
                    <span className="badge badge-outline badge-sm font-semibold capitalize">
                      {activeUser.shift ? `${activeUser.shift} Shift` : 'Flexible / Unassigned'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Account Status</span>
                    <span
                      className={`badge badge-xs font-semibold ${
                        isDisabled ? 'badge-error' : 'badge-success text-white'
                      }`}
                    >
                      {isDisabled ? 'Disabled' : 'Active'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Leave Governance</span>
                    <span
                      className={`badge badge-xs font-semibold ${
                        isOnLeave ? 'badge-warning' : 'badge-success text-white'
                      }`}
                    >
                      {isOnLeave ? 'On Leave (Login Blocked)' : 'On Duty'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Password</span>
                    <span
                      className={`badge badge-xs font-semibold ${
                        activeUser.isDefaultPassword ? 'badge-warning' : 'badge-success text-white'
                      }`}
                    >
                      {activeUser.isDefaultPassword ? 'Default' : 'Changed'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5 border-b border-base-200/60">
                    <span className="text-base-content/60">Last Login</span>
                    <span className="font-semibold text-base-content">
                      {activeUser.lastLogin ? formatNigeriaDateTime(activeUser.lastLogin) : 'Never'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-base-content/60">Created Date</span>
                    <span className="font-semibold text-base-content">
                      {activeUser.createdAt ? formatNigeriaDate(activeUser.createdAt) : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift Hours Hint */}
              <div className="p-4 rounded-xl bg-base-200/40 border border-base-200 text-xs text-base-content/70 space-y-1.5">
                <p className="font-bold text-base-content flex items-center gap-1.5">
                  <FaClock className="text-primary w-3 h-3" />
                  <span>Hospital Shift Hours (Lagos WAT):</span>
                </p>
                <p>• Morning Shift: <strong>7:00 AM – 6:30 PM</strong></p>
                <p>• Night Shift: <strong>5:00 PM – 8:30 AM</strong> next morning</p>
              </div>
            </div>
          </div>

          {/* Card 4: Shift Access & Overtime History */}
          <div className="card bg-base-100 border border-base-200 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div className="flex items-center gap-2">
                <FaHistory className="text-primary text-sm" />
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                  Shift Access & Overtime History
                </h3>
              </div>
              <span className="badge badge-primary badge-outline badge-sm text-[11px] font-semibold">
                {shiftRequests.length} Record{shiftRequests.length !== 1 ? 's' : ''}
              </span>
            </div>

            {isLoadingRequests ? (
              <div className="py-8 flex justify-center items-center gap-2 text-xs text-base-content/60">
                <span className="loading loading-spinner loading-xs"></span>
                <span>Loading shift requests...</span>
              </div>
            ) : shiftRequests.length === 0 ? (
              <div className="text-center py-6 text-base-content/50 text-xs">
                <FaClock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                <p>No shift access or double shift requests recorded for this staff member.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-xs w-full">
                  <thead>
                    <tr className="bg-base-200/60 text-base-content/70 text-[11px]">
                      <th>Date</th>
                      <th>Requested Shift</th>
                      <th>Reason</th>
                      <th>Status</th>
                      <th>Reviewed By</th>
                      <th>Notes</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {shiftRequests.map((req) => {
                      const isPending = req.status === 'pending';
                      const isReviewing = reviewingId === req.id;

                      return (
                        <tr key={req.id} className="hover:bg-base-200/30">
                          <td className="font-mono text-[11px] whitespace-nowrap">
                            {formatNigeriaDateTime(req.createdAt)}
                          </td>
                          <td className="capitalize font-semibold">
                            {req.requestedShiftType || 'Shift Access'}
                          </td>
                          <td className="max-w-xs truncate" title={req.reason}>
                            {req.reason || 'No reason provided'}
                          </td>
                          <td>
                            {req.status === 'approved' && (
                              <span className="badge badge-success badge-xs text-white font-semibold">
                                Approved
                              </span>
                            )}
                            {req.status === 'rejected' && (
                              <span className="badge badge-error badge-xs font-semibold">
                                Rejected
                              </span>
                            )}
                            {isPending && (
                              <span className="badge badge-warning badge-xs font-semibold">
                                Pending
                              </span>
                            )}
                          </td>
                          <td className="text-xs">
                            {req.reviewedBy ? (
                              <span>
                                {req.reviewedBy.firstName} {req.reviewedBy.lastName}
                              </span>
                            ) : (
                              <span className="text-base-content/40 italic">—</span>
                            )}
                          </td>
                          <td className="max-w-xs truncate text-[11px]" title={req.reviewNotes}>
                            {req.reviewNotes || '—'}
                          </td>
                          <td className="text-right">
                            {isPending ? (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  disabled={isReviewing}
                                  onClick={() => handleReviewShiftRequest(req.id, 'approved')}
                                  className="btn btn-xs btn-success text-white font-semibold"
                                  title="Approve access"
                                >
                                  {isReviewing ? (
                                    <span className="loading loading-spinner loading-xs"></span>
                                  ) : (
                                    'Approve'
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={isReviewing}
                                  onClick={() => handleReviewShiftRequest(req.id, 'rejected')}
                                  className="btn btn-xs btn-error text-white font-semibold"
                                  title="Reject access"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-base-content/40">Resolved</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-base-200 bg-base-200/30 flex items-center justify-between">
          <span className="text-xs text-base-content/60">
            Staff Personnel Record • Kolak Hospital Management System
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenFullPage}
              className="btn btn-sm btn-ghost gap-1.5 text-xs text-primary font-semibold"
            >
              <FaExternalLinkAlt className="w-3 h-3" />
              <span>Open in Full Page</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-sm btn-primary px-5 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;
