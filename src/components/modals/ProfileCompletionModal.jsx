import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { updateUserProfile, logoutUser } from '@/store/slices/authSlice';
import usersAPI from '@/services/api/usersAPI';
import toast from 'react-hot-toast';
import {
  FaUserShield,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUserFriends,
  FaSignOutAlt,
  FaCheckCircle,
} from 'react-icons/fa';

const EXEMPT_ROLES = ['super-admin', 'superadmin', 'medical-director', 'medical_director'];

const ProfileCompletionModal = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [nextOfKinName, setNextOfKinName] = useState('');
  const [nextOfKinPhone, setNextOfKinPhone] = useState('');
  const [nextOfKinRelationship, setNextOfKinRelationship] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Sync form state when user changes
  useEffect(() => {
    if (user) {
      setPhoneNumber(user.phoneNumber ? String(user.phoneNumber) : '');
      setEmail(user.email || '');
      setAddress(user.address || '');
      if (user.dob) {
        try {
          const d = new Date(user.dob);
          if (!isNaN(d.getTime())) {
            setDob(d.toISOString().split('T')[0]);
          } else {
            setDob(String(user.dob).slice(0, 10));
          }
        } catch {
          setDob('');
        }
      }
      if (user.nextOfKin) {
        setNextOfKinName(user.nextOfKin.name || '');
        setNextOfKinPhone(user.nextOfKin.phone || '');
        setNextOfKinRelationship(user.nextOfKin.relationship || '');
      }
    }
  }, [user]);

  // Determine visibility
  const normalizedRole = String(user?.role || user?.accountType || '')
    .toLowerCase()
    .trim()
    .replace(/[_ ]/g, '-');

  const isExempt = EXEMPT_ROLES.includes(normalizedRole);
  const isAuthPath = ['/login', '/forgot-password', '/change-password-default'].includes(location.pathname);
  const isCompleted = Boolean(user?.isProfileCompleted);

  // If user is not authenticated, or on auth page, or exempt, or profile already completed: do not show
  if (!isAuthenticated || !user || isExempt || isCompleted || isAuthPath) {
    return null;
  }

  const validate = () => {
    const newErrors = {};

    // Phone validation
    const cleanedPhone = phoneNumber.trim();
    if (!cleanedPhone) {
      newErrors.phoneNumber = 'Phone number is required.';
    } else if (!/^[0-9+() -]{7,20}$/.test(cleanedPhone)) {
      newErrors.phoneNumber = 'Please enter a valid phone number (at least 7 digits).';
    }

    // Email validation (optional)
    const cleanedEmail = email.trim();
    if (cleanedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    // Address validation
    const cleanedAddress = address.trim();
    if (!cleanedAddress) {
      newErrors.address = 'Residential address is required.';
    } else if (cleanedAddress.length < 5) {
      newErrors.address = 'Please enter a complete residential address (min 5 characters).';
    }

    // Optional Next of Kin phone format validation
    if (nextOfKinPhone.trim() && !/^[0-9+() -]{7,20}$/.test(nextOfKinPhone.trim())) {
      newErrors.nextOfKinPhone = 'Please enter a valid phone number for emergency contact.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fill in all required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
        address: address.trim(),
        dob: dob || null,
        nextOfKin: {
          name: nextOfKinName.trim() || undefined,
          phone: nextOfKinPhone.trim() || undefined,
          relationship: nextOfKinRelationship.trim() || undefined,
        },
      };

      const response = await usersAPI.updateProfile(payload);
      const updatedUser = response?.data?.data || response?.data || payload;

      dispatch(
        updateUserProfile({
          ...updatedUser,
          isProfileCompleted: true,
        })
      );

      toast.success('Profile completed successfully! Welcome to Kolak HMS.');
    } catch (err) {
      const message =
        err?.response?.data?.message?.message ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        'Failed to update profile. Please try again.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    const toastId = toast.loading('Logging you out...');
    try {
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
    } catch {
      window.location.replace('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 p-3 sm:p-5 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="relative my-auto w-full max-w-2xl rounded-2xl bg-base-100 shadow-2xl border border-primary/20 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-teal-600 to-cyan-700 px-6 py-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs shadow-inner">
              <FaUserShield className="h-6 w-6" />
            </div>
            <div>
              <h2 id="profile-modal-title" className="text-xl font-bold tracking-tight">
                Complete Your Staff Profile
              </h2>
              <p className="text-xs text-teal-100 mt-0.5">
                Hospital compliance requires all active staff to provide up-to-date contact and address details.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Welcome User Pill */}
          <div className="flex items-center justify-between rounded-xl bg-base-200/60 p-3 px-4 border border-base-300">
            <div>
              <p className="text-xs text-base-content/60 font-medium">Signed in as:</p>
              <p className="text-sm font-semibold text-base-content">
                {user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email}
              </p>
            </div>
            <span className="badge badge-primary badge-outline text-xs capitalize font-semibold">
              {normalizedRole}
            </span>
          </div>

          {/* Section 1: Personal & Contact Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-base-200 pb-2">
              <FaPhoneAlt className="text-primary text-xs" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                Personal & Contact Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-base-content mb-1">
                  Phone Number <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <FaPhoneAlt className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 08012345678"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: null }));
                    }}
                    className={`input input-bordered input-sm sm:input-md w-full pl-9 text-sm ${
                      errors.phoneNumber ? 'input-error' : ''
                    }`}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-[11px] text-error mt-1">{errors.phoneNumber}</p>
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
                <div className="relative">
                  <FaEnvelope className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                  <input
                    type="email"
                    placeholder="name@kolakhospital.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    className={`input input-bordered input-sm sm:input-md w-full pl-9 text-sm ${
                      errors.email ? 'input-error' : ''
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-error mt-1">{errors.email}</p>}
              </div>

              {/* Date of Birth (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-base-content">
                    Date of Birth
                  </label>
                  <span className="text-[10px] text-base-content/50 font-normal">Optional</span>
                </div>
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
              </div>
            </div>

            {/* Residential Address */}
            <div>
              <label className="block text-xs font-semibold text-base-content mb-1">
                Residential Address <span className="text-error">*</span>
              </label>
              <div className="relative">
                <FaMapMarkerAlt className="absolute left-3 top-3 text-base-content/40 text-xs pointer-events-none" />
                <textarea
                  rows={2}
                  required
                  placeholder="Street address, apartment/suite, city, state"
                  value={address}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address) setErrors((prev) => ({ ...prev, address: null }));
                  }}
                  className={`textarea textarea-bordered w-full pl-9 text-sm leading-relaxed ${
                    errors.address ? 'textarea-error' : ''
                  }`}
                />
              </div>
              {errors.address && <p className="text-[11px] text-error mt-1">{errors.address}</p>}
            </div>
          </div>

          {/* Section 2: Optional Emergency Contact */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between border-b border-base-200 pb-2">
              <div className="flex items-center gap-2">
                <FaUserFriends className="text-base-content/70 text-xs" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-base-content/70">
                  Emergency Contact / Next of Kin
                </h3>
              </div>
              <span className="badge badge-ghost badge-sm text-[10px]">Optional</span>
            </div>

            {/* Next of Kin / Emergency Contact fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-base-content/80 mb-1">
                  Next of Kin Name
                </label>
                <input
                  type="text"
                  placeholder="Full name"
                  value={nextOfKinName}
                  onChange={(e) => setNextOfKinName(e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-base-content/80 mb-1">
                  Next of Kin Phone
                </label>
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={nextOfKinPhone}
                  onChange={(e) => {
                    setNextOfKinPhone(e.target.value);
                    if (errors.nextOfKinPhone) setErrors((prev) => ({ ...prev, nextOfKinPhone: null }));
                  }}
                  className={`input input-bordered input-sm sm:input-md w-full text-sm ${
                    errors.nextOfKinPhone ? 'input-error' : ''
                  }`}
                />
                {errors.nextOfKinPhone && (
                  <p className="text-[11px] text-error mt-1">{errors.nextOfKinPhone}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-base-content/80 mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spouse, Sibling"
                  value={nextOfKinRelationship}
                  onChange={(e) => setNextOfKinRelationship(e.target.value)}
                  className="input input-bordered input-sm sm:input-md w-full text-sm"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-base-200">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="btn btn-ghost btn-sm text-xs text-error gap-1.5 w-full sm:w-auto"
              title="Sign out of current account"
            >
              <FaSignOutAlt className="w-3.5 h-3.5" />
              <span>{isLoggingOut ? 'Logging out...' : 'Log out instead'}</span>
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm sm:btn-md gap-2 w-full sm:w-auto px-6 font-semibold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="w-4 h-4" />
                  <span>Save & Continue to Dashboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileCompletionModal;
