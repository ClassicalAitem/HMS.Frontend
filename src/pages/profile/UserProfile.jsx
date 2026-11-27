import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUserProfile } from '@/store/slices/authSlice';
import usersAPI from '@/services/api/usersAPI';
import shiftAccessAPI from '@/services/api/shiftAccessAPI';
import UserAuthHistoryCard from '@/components/common/UserAuthHistoryCard';
import toast from 'react-hot-toast';
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
  FaSave,
  FaIdBadge,
  FaHospital,
  FaClock,
  FaHistory,
  FaUserCheck,
  FaUserTimes,
  FaSync,
  FaCheck,
  FaBan,
  FaArrowLeft,
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

const UserProfile = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user } = useAppSelector((state) => state.auth);

  // If a userId is in the URL and it differs from the logged-in user, we are viewing another staff member's profile
  const isViewingOther = Boolean(userId && userId !== user?.id);
  const [targetUser, setTargetUser] = useState(null);

  const activeUser = isViewingOther ? (targetUser || {}) : user;

  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState('');
  const [errors, setErrors] = useState({});

  const populateForm = (userData) => {
    if (!userData) return;
    setPhoneNumber(userData.phoneNumber ? String(userData.phoneNumber) : '');
    setEmail(userData.email || '');
    setAddress(userData.address || '');
    if (userData.dob) {
      try {
        const d = new Date(userData.dob);
        if (!isNaN(d.getTime())) {
          setDob(d.toISOString().split('T')[0]);
        } else {
          setDob(String(userData.dob).slice(0, 10));
        }
      } catch {
        setDob('');
      }
    } else {
      setDob('');
    }
    if (userData.nextOfKin) {
      setNextOfKinName(userData.nextOfKin.name || '');
      setNextOfKinPhone(userData.nextOfKin.phone || '');
      setNextOfKinRelationship(userData.nextOfKin.relationship || '');
    } else {
      setNextOfKinName('');
      setNextOfKinPhone('');
      setNextOfKinRelationship('');
    }
  };

  useEffect(() => {
    if (!isViewingOther && user) {
      populateForm(user);
    }
  }, [user, isViewingOther]);

  // Fetch fresh profile from API on mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      setIsLoadingProfile(true);
      try {
        if (isViewingOther && userId) {
          const res = await usersAPI.getUserById(userId);
          const freshData = res?.data?.data || res?.data;
          if (freshData) {
            setTargetUser(freshData);
            populateForm(freshData);
          }
        } else {
          const res = await usersAPI.getProfile();
          if (res?.data?.data) {
            const freshData = res.data.data;
            dispatch(updateUserProfile(freshData));
            populateForm(freshData);
          }
        }
      } catch (err) {
        console.warn('Could not refresh profile from server:', err?.message);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchLatestProfile();
  }, [dispatch, isViewingOther, userId]);

  const userRole = String(user?.role || user?.accountType || '')
    .toLowerCase()
    .trim()
    .replace(/[_ ]/g, '-');
  const isManager = ['super-admin', 'superadmin', 'human-resource', 'hr', 'admin'].includes(userRole);

  const targetRole = String(activeUser?.role || activeUser?.accountType || '')
    .toLowerCase()
    .trim()
    .replace(/[_ ]/g, '-');
  const isTargetManager = ['super-admin', 'superadmin', 'human-resource', 'hr', 'admin'].includes(targetRole);

  // Super Admin, HR, and Admin profile pages do not show change password on their page, nor do staff profiles in view mode
  const showChangePassword = !isManager && !isTargetManager && !isViewingOther;

  const [shiftRequests, setShiftRequests] = useState([]);
  const [allStaffRequests, setAllStaffRequests] = useState([]);
  const [activeShiftTab, setActiveShiftTab] = useState(
    isViewingOther ? 'my_history' : isManager ? 'staff_requests' : 'my_history'
  );
  const [isLoadingShiftRequests, setIsLoadingShiftRequests] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);

  const fetchShiftRequests = React.useCallback(async () => {
    setIsLoadingShiftRequests(true);
    try {
      if (isViewingOther && userId) {
        const allRes = await shiftAccessAPI.getAllRequests();
        const allReqs = allRes?.data?.data || [];
        setAllStaffRequests(allReqs);
        setShiftRequests(allReqs.filter((r) => r.userId === userId || r.user?.id === userId));
      } else {
        const myRes = await shiftAccessAPI.getMyRequests();
        setShiftRequests(myRes?.data?.data || []);

        if (isManager) {
          const allRes = await shiftAccessAPI.getAllRequests();
          setAllStaffRequests(allRes?.data?.data || []);
        }
      }
    } catch (err) {
      console.warn('Could not load shift access requests:', err?.message);
    } finally {
      setIsLoadingShiftRequests(false);
    }
  }, [isManager, isViewingOther, userId]);

  useEffect(() => {
    fetchShiftRequests();
  }, [fetchShiftRequests]);

  const handleReviewRequest = async (requestId, decisionStatus) => {
    setReviewingId(requestId);
    try {
      await shiftAccessAPI.reviewRequest(requestId, {
        status: decisionStatus,
      });
      toast.success(`Request ${decisionStatus} successfully!`);
      fetchShiftRequests();
    } catch (err) {
      toast.error(err?.response?.data?.error || err?.message || 'Failed to review request');
    } finally {
      setReviewingId(null);
    }
  };

  const validate = () => {
    const newErrors = {};

    const cleanPhone = phoneNumber.trim();
    if (!cleanPhone) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^[0-9+() -]{7,20}$/.test(cleanPhone)) {
      newErrors.phoneNumber = 'Valid phone number is required (at least 7 digits).';
    }

    const cleanEmail = email.trim();
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      newErrors.email = 'Valid email address is required.';
    }

    const cleanAddress = address.trim();
    if (!cleanAddress) {
      newErrors.address = 'Residential address is required.';
    } else if (cleanAddress.length < 5) {
      newErrors.address = 'Please provide a complete address (min 5 characters).';
    }

    if (nextOfKinPhone.trim() && !/^[0-9+() -]{7,20}$/.test(nextOfKinPhone.trim())) {
      newErrors.nextOfKinPhone = 'Valid emergency contact phone number required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please correct the highlighted errors before saving.');
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
        address: address.trim(),
        dob: dob || null,
        nextOfKin: {
          name: nextOfKinName.trim() || undefined,
          phone: nextOfKinPhone.trim() || undefined,
          relationship: nextOfKinRelationship.trim() || undefined,
        },
      };

      if (isViewingOther && userId) {
        const res = await usersAPI.updateUser(userId, payload);
        const updatedData = res?.data?.data || res?.data || payload;
        setTargetUser((prev) => ({ ...prev, ...updatedData, isProfileCompleted: true }));
        toast.success('Staff profile updated successfully!');
      } else {
        const res = await usersAPI.updateProfile(payload);
        const updatedData = res?.data?.data || res?.data || payload;
        dispatch(
          updateUserProfile({
            ...updatedData,
            isProfileCompleted: true,
          })
        );
        toast.success('Profile updated successfully!');
      }

      setIsEditing(false);
    } catch (err) {
      const message =
        err?.response?.data?.message?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to save profile changes.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    populateForm(activeUser);
    setErrors({});
    setIsEditing(false);
  };

  const isProfileComplete = Boolean(activeUser?.isProfileCompleted);

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Admin / HR Return Navigation Pill */}
      {isViewingOther && (
        <div className="flex items-center justify-between pb-2 border-b border-base-200">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="btn btn-sm btn-ghost gap-2 text-xs font-semibold text-base-content/70 hover:text-primary"
          >
            <FaArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Staff Management</span>
          </button>
          <span className="badge badge-primary badge-outline text-xs font-semibold">
            Administrative Staff View
          </span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-base-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-base-content">
            {isViewingOther
              ? `${activeUser?.firstName || 'Staff'} ${activeUser?.lastName || ''}'s Profile`
              : 'Staff Profile'}
          </h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-1">
            {isViewingOther
              ? 'View complete personnel records, residential address, emergency contact, and shift history.'
              : 'Manage your personal profile, contact information, and emergency records.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary btn-sm gap-2 font-semibold shadow-xs"
            >
              <FaEdit className="w-3.5 h-3.5" />
              <span>{isViewingOther ? 'Edit Staff Profile' : 'Edit Profile'}</span>
            </button>
          ) : (
            <button
              onClick={handleCancel}
              className="btn btn-ghost btn-sm gap-1.5 text-base-content/70"
            >
              <FaTimes className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          )}

          {showChangePassword && (
            <Link
              to="/change-password"
              className="btn btn-outline btn-sm gap-2 font-medium"
              title="Update your account password"
            >
              <FaLock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Change Password</span>
            </Link>
          )}
        </div>
      </div>

      {/* Top Profile Card Banner */}
      <div className="card bg-base-100 shadow-sm border border-base-200 overflow-hidden">
        <div className="h-24 sm:h-28 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-700 relative">
          {/* Status Badge in corner */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            {isProfileComplete ? (
              <span className="badge badge-success gap-1.5 py-3 px-3 text-white text-xs font-semibold shadow-sm">
                <FaCheckCircle className="w-3 h-3" />
                <span>Profile Verified</span>
              </span>
            ) : (
              <span className="badge badge-warning gap-1.5 py-3 px-3 text-xs font-semibold shadow-sm">
                <FaExclamationTriangle className="w-3 h-3" />
                <span>Profile Incomplete</span>
              </span>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative">
              <div className="flex h-24 w-24 sm:h-28 sm:w-28 items-center justify-center rounded-2xl bg-base-100 p-1.5 shadow-lg border-2 border-base-200">
                <div className="flex h-full w-full items-center justify-center rounded-xl bg-primary/10 text-primary font-black text-2xl sm:text-3xl">
                  {generateInitials(activeUser?.firstName, activeUser?.lastName)}
                </div>
              </div>
            </div>

            {/* Name & Role */}
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-base-content capitalize">
                {activeUser?.firstName ? `${activeUser.firstName} ${activeUser.lastName || ''}`.trim() : 'Staff Member'}
              </h2>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-0.5">
                <span className="badge badge-primary text-xs font-semibold">
                  {formatRole(activeUser?.role || activeUser?.accountType)}
                </span>
                {activeUser?.shift && (
                  <span className="badge badge-outline text-xs capitalize flex items-center gap-1">
                    <FaClock className="w-2.5 h-2.5" />
                    <span>{activeUser.shift} Shift</span>
                  </span>
                )}
                {activeUser?.isOnLeave && (
                  <span className="badge badge-error badge-outline text-xs font-semibold">
                    On Leave
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Staff ID Badge */}
          <div className="flex items-center justify-center sm:justify-end gap-1 text-xs text-base-content/60 bg-base-200/50 rounded-lg p-2 px-3 border border-base-300">
            <FaIdBadge className="text-primary w-3.5 h-3.5" />
            <span className="font-mono font-medium">ID: {activeUser?.id?.slice(0, 8)}...</span>
          </div>
        </div>
      </div>

      {/* Main Details Body */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Personal & Emergency Contact (2 cols) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card 1: Personal & Contact Details */}
            <div className="card bg-base-100 shadow-sm border border-base-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                <FaPhoneAlt className="text-primary" />
                <h3 className="text-base font-bold text-base-content">
                  Personal & Contact Details
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-semibold text-base-content mb-1">
                    Phone Number {isEditing && <span className="text-error">*</span>}
                  </label>
                  {isEditing ? (
                    <div>
                      <div className="relative">
                        <FaPhoneAlt className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                        <input
                          type="tel"
                          required
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="e.g. 08012345678"
                          className={`input input-bordered input-sm sm:input-md w-full pl-9 text-sm ${
                            errors.phoneNumber ? 'input-error' : ''
                          }`}
                        />
                      </div>
                      {errors.phoneNumber && (
                        <p className="text-[11px] text-error mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                      <FaPhoneAlt className="text-base-content/40 text-xs shrink-0" />
                      <span className="truncate">{activeUser?.phoneNumber || 'No phone number'}</span>
                    </div>
                  )}
                </div>

                {/* Email Address (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-base-content">
                      Email Address
                    </label>
                    <span className="text-[10px] text-base-content/50 font-normal">Optional</span>
                  </div>
                  {isEditing ? (
                    <div>
                      <div className="relative">
                        <FaEnvelope className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@kolakhospital.com"
                          className={`input input-bordered input-sm sm:input-md w-full pl-9 text-sm ${
                            errors.email ? 'input-error' : ''
                          }`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-[11px] text-error mt-1">{errors.email}</p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                      <FaEnvelope className="text-base-content/40 text-xs shrink-0" />
                      <span className="truncate">{activeUser?.email || 'Not provided'}</span>
                    </div>
                  )}
                </div>

                {/* Date of Birth (Optional) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-base-content">
                      Date of Birth
                    </label>
                    <span className="text-[10px] text-base-content/50 font-normal">Optional</span>
                  </div>
                  {isEditing ? (
                    <div className="relative">
                      <FaCalendarAlt className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                      <input
                        type="date"
                        max={new Date().toISOString().split('T')[0]}
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="input input-bordered input-sm sm:input-md w-full pl-9 text-sm"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                      <FaCalendarAlt className="text-base-content/40 text-xs shrink-0" />
                      <span className="truncate">
                        {activeUser?.dob
                          ? new Date(activeUser.dob).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : 'Not specified'}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Residential Address */}
              <div>
                <label className="block text-xs font-semibold text-base-content mb-1">
                  Residential Address {isEditing && <span className="text-error">*</span>}
                </label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <FaMapMarkerAlt className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                      <textarea
                        rows={2}
                        required
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Street address, city, state"
                        className={`textarea textarea-bordered w-full pl-9 text-sm ${
                          errors.address ? 'textarea-error' : ''
                        }`}
                      />
                    </div>
                    {errors.address && (
                      <p className="text-[11px] text-error mt-1">{errors.address}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-start gap-2 text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                    <FaMapMarkerAlt className="text-base-content/40 text-xs mt-1 shrink-0" />
                    <span>{activeUser?.address || 'No residential address recorded'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Emergency Contact / Next of Kin */}
            <div className="card bg-base-100 shadow-sm border border-base-200 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-base-200 pb-3">
                <div className="flex items-center gap-2">
                  <FaUserFriends className="text-primary" />
                  <h3 className="text-base font-bold text-base-content">
                    Emergency Contact / Next of Kin
                  </h3>
                </div>
                <span className="badge badge-ghost badge-sm text-[10px]">Optional</span>
              </div>

              {/* Next of Kin Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-base-content mb-1">
                    Next of Kin Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="Full name"
                      value={nextOfKinName}
                      onChange={(e) => setNextOfKinName(e.target.value)}
                      className="input input-bordered input-sm sm:input-md w-full text-sm"
                    />
                  ) : (
                    <div className="text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                      {activeUser?.nextOfKin?.name || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content mb-1">
                    Next of Kin Phone
                  </label>
                  {isEditing ? (
                    <div>
                      <input
                        type="tel"
                        placeholder="Phone number"
                        value={nextOfKinPhone}
                        onChange={(e) => setNextOfKinPhone(e.target.value)}
                        className={`input input-bordered input-sm sm:input-md w-full text-sm ${
                          errors.nextOfKinPhone ? 'input-error' : ''
                        }`}
                      />
                      {errors.nextOfKinPhone && (
                        <p className="text-[11px] text-error mt-1">{errors.nextOfKinPhone}</p>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                      {activeUser?.nextOfKin?.phone || 'Not provided'}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content mb-1">
                    Relationship
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      placeholder="e.g. Spouse, Sibling"
                      value={nextOfKinRelationship}
                      onChange={(e) => setNextOfKinRelationship(e.target.value)}
                      className="input input-bordered input-sm sm:input-md w-full text-sm"
                    />
                  ) : (
                    <div className="text-sm font-medium text-base-content bg-base-200/40 p-2.5 rounded-lg border border-base-300">
                      {activeUser?.nextOfKin?.relationship || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save Button in edit mode */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn btn-ghost btn-sm sm:btn-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="btn btn-primary btn-sm sm:btn-md gap-2 font-semibold shadow-md px-6"
                >
                  {isSaving ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <FaSave className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Account & Security Overview (1 col) */}
          <div className="space-y-6">
            {/* Account Details Card */}
            <div className="card bg-base-100 shadow-sm border border-base-200 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                <FaHospital className="text-primary" />
                <h3 className="text-base font-bold text-base-content">Hospital Account</h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-base-200/60">
                  <span className="text-base-content/60">Full Name</span>
                  <span className="font-semibold text-base-content capitalize">
                    {activeUser?.firstName} {activeUser?.lastName}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-base-200/60">
                  <span className="text-base-content/60">Role</span>
                  <span className="font-semibold text-primary">
                    {formatRole(activeUser?.role || activeUser?.accountType)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-base-200/60">
                  <span className="text-base-content/60">Shift</span>
                  <span className="font-semibold text-base-content capitalize">
                    {activeUser?.shift || 'Flexible / Unassigned'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-base-200/60">
                  <span className="text-base-content/60">Account Status</span>
                  <span
                    className={`badge badge-xs font-semibold ${
                      activeUser?.isDisabled ? 'badge-error' : 'badge-success text-white'
                    }`}
                  >
                    {activeUser?.isDisabled ? 'Disabled' : 'Active'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-base-200/60">
                  <span className="text-base-content/60">Profile Status</span>
                  <span
                    className={`badge badge-xs font-semibold ${
                      isProfileComplete ? 'badge-success text-white' : 'badge-warning'
                    }`}
                  >
                    {isProfileComplete ? 'Complete' : 'Incomplete'}
                  </span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-base-content/60">Last Login</span>
                  <span className="font-semibold text-base-content">
                    {activeUser?.lastLogin
                      ? new Date(activeUser.lastLogin).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'First session'}
                  </span>
                </div>
              </div>
            </div>

            {/* Security Quick Link - hidden on Super Admin and HR profile pages and view mode */}
            {showChangePassword && (
              <div className="card bg-base-100 shadow-sm border border-base-200 p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <FaLock className="text-primary text-sm" />
                  <h4 className="text-sm font-bold text-base-content">Account Security</h4>
                </div>
                <p className="text-xs text-base-content/60">
                  It is recommended to use a strong password and update it regularly.
                </p>
                <Link
                  to="/change-password"
                  className="btn btn-outline btn-sm w-full gap-2 text-xs font-semibold"
                >
                  <FaLock className="w-3 h-3" />
                  <span>Change Account Password</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Shift Access & Overtime History Card */}
      <div className="card bg-base-100 shadow-sm border border-base-200 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary shrink-0">
              <FaHistory className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-base-content">
                {isManager ? "Hospital Shift Access & Overtime Requests" : "Shift & Overtime Access History"}
              </h3>
              <p className="text-xs text-base-content/60">
                {isManager
                  ? "Review staff requests for double shifts, overtime extensions, and grant emergency hospital access."
                  : "Track requests submitted to Super Admin or HR for double shifts and overtime extensions."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <div className="join">
                <button
                  type="button"
                  onClick={() => setActiveShiftTab('staff_requests')}
                  className={`btn btn-sm join-item text-xs font-semibold ${
                    activeShiftTab === 'staff_requests' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <span>Staff Requests</span>
                  {allStaffRequests.filter((r) => r.status === 'pending').length > 0 && (
                    <span className="badge badge-warning badge-xs font-bold ml-1">
                      {allStaffRequests.filter((r) => r.status === 'pending').length}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveShiftTab('my_history')}
                  className={`btn btn-sm join-item text-xs font-semibold ${
                    activeShiftTab === 'my_history' ? 'btn-primary' : 'btn-ghost'
                  }`}
                >
                  <span>My History</span>
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={fetchShiftRequests}
              disabled={isLoadingShiftRequests}
              className="btn btn-ghost btn-circle btn-sm text-base-content/70"
              title="Refresh shift requests"
            >
              <FaSync className={`w-3.5 h-3.5 ${isLoadingShiftRequests ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Content Table */}
        {activeShiftTab === 'staff_requests' && isManager ? (
          <div className="overflow-x-auto">
            {allStaffRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-base-content/60">
                No shift access requests recorded yet.
              </div>
            ) : (
              <table className="table table-sm w-full text-xs">
                <thead>
                  <tr className="bg-base-200/60 text-base-content/70">
                    <th>Staff Name</th>
                    <th>Role / Shift</th>
                    <th>Request Type</th>
                    <th>Reason</th>
                    <th>Date Requested</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allStaffRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-base-200/40">
                      <td className="font-bold text-base-content">{req.userName}</td>
                      <td>
                        <div className="flex flex-col">
                          <span className="capitalize font-semibold">{req.userRole}</span>
                          <span className="text-[10px] text-base-content/60 capitalize">
                            {req.userShift ? `${req.userShift} Shift` : 'Flexible'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm text-[10px] capitalize">
                          {req.requestType?.replace(/_/g, ' ') || 'Double Shift'}
                        </span>
                      </td>
                      <td className="max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td>
                        {new Date(req.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        {req.status === 'approved' && (
                          <span className="badge badge-success text-white badge-xs gap-1 font-semibold">
                            <FaCheck className="w-2 h-2" /> Approved
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="badge badge-warning badge-xs gap-1 font-semibold">
                            Pending
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="badge badge-error text-white badge-xs gap-1 font-semibold">
                            <FaBan className="w-2 h-2" /> Rejected
                          </span>
                        )}
                      </td>
                      <td>
                        {req.status === 'pending' ? (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleReviewRequest(req.id, 'approved')}
                              disabled={reviewingId === req.id}
                              className="btn btn-success btn-xs text-white gap-1"
                              title="Approve access"
                            >
                              <FaCheck className="w-2.5 h-2.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewRequest(req.id, 'rejected')}
                              disabled={reviewingId === req.id}
                              className="btn btn-error btn-xs text-white gap-1"
                              title="Reject access"
                            >
                              <FaBan className="w-2.5 h-2.5" />
                              <span>Reject</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-base-content/50 italic">
                            {req.reviewedBy ? `Reviewed by ${req.reviewerName || 'Admin'}` : 'Processed'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            {shiftRequests.length === 0 ? (
              <div className="text-center py-8 text-xs text-base-content/60">
                You have not submitted any extra shift access requests.
              </div>
            ) : (
              <table className="table table-sm w-full text-xs">
                <thead>
                  <tr className="bg-base-200/60 text-base-content/70">
                    <th>Date Requested</th>
                    <th>Type</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Reviewer & Notes</th>
                    <th>Access Valid Until</th>
                  </tr>
                </thead>
                <tbody>
                  {shiftRequests.map((req) => (
                    <tr key={req.id} className="hover:bg-base-200/40">
                      <td>
                        {new Date(req.createdAt).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td>
                        <span className="badge badge-outline badge-sm text-[10px] capitalize">
                          {req.requestType?.replace(/_/g, ' ') || 'Double Shift'}
                        </span>
                      </td>
                      <td className="max-w-xs truncate" title={req.reason}>
                        {req.reason}
                      </td>
                      <td>
                        {req.status === 'approved' && (
                          <span className="badge badge-success text-white badge-xs gap-1 font-semibold">
                            <FaCheck className="w-2 h-2" /> Approved
                          </span>
                        )}
                        {req.status === 'pending' && (
                          <span className="badge badge-warning badge-xs gap-1 font-semibold">
                            Pending
                          </span>
                        )}
                        {req.status === 'rejected' && (
                          <span className="badge badge-error text-white badge-xs gap-1 font-semibold">
                            <FaBan className="w-2 h-2" /> Rejected
                          </span>
                        )}
                      </td>
                      <td>
                        {req.reviewerName ? (
                          <div className="flex flex-col">
                            <span className="font-semibold">{req.reviewerName}</span>
                            {req.note && <span className="text-[10px] text-base-content/60 italic">{req.note}</span>}
                          </div>
                        ) : (
                          <span className="text-base-content/50">—</span>
                        )}
                      </td>
                      <td>
                        {req.grantedUntil ? (
                          <span className="font-medium text-success">
                            {new Date(req.grantedUntil).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        ) : (
                          <span className="text-base-content/50">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {isViewingOther && <UserAuthHistoryCard userId={activeUser?.id || activeUser?._id} />}
    </div>
  );
};

export default UserProfile;
