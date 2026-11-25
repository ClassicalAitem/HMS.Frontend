/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock, FaClock, FaTimes, FaPaperPlane, FaSpinner, FaExclamationTriangle, FaShieldAlt } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { AuthLayout, AuthInput } from "@/components/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../../utils/formValidator";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser, clearError, logoutUser } from "../../store/slices/authSlice";
import shiftAccessAPI from "../../services/api/shiftAccessAPI";
import toast from "react-hot-toast";
import AuthTest from "../../components/common/AuthTest";
import RouteProtectionTest from "../../components/common/RouteProtectionTest";
import LoginRedirectTest from "../../components/common/LoginRedirectTest";
import LogoutTest from "../../components/common/LogoutTest";
import TokenDebug from "../../components/common/TokenDebug";
import "../../utils/testAPI"; // This will run the API config test

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentTheme } = useTheme();
  
  // Redux state
  const { isLoading, error, isAuthenticated, user, needsPasswordChange, token } = useAppSelector((state) => state.auth);
  
  // Local state
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Shift Lockout & Emergency Request state
  const [shiftLockData, setShiftLockData] = useState(null);
  const [showShiftLockModal, setShowShiftLockModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestReason, setRequestReason] = useState("");
  const [requestType, setRequestType] = useState("double_shift");
  const [isSubmittingShiftRequest, setIsSubmittingShiftRequest] = useState(false);

  //Made use of yupResolver for validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  // Watch form fields to clear errors when user starts typing
  const watchedFields = watch();
  
  useEffect(() => {
    if (error && (watchedFields.email || watchedFields.password)) {
      dispatch(clearError());
    }
  }, [watchedFields.email, watchedFields.password, error, dispatch]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (showSuccessModal) return; // Allow smooth login modal and timeout transition without double-navigate race
    const localToken = localStorage.getItem('token');
    if (!localToken) return; // Do not auto-redirect if token is missing from localStorage (e.g. during or after logout)
    if (isAuthenticated && user) {
      let expired = false;
      try {
        const parts = String(token || '').split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(decodeURIComponent(escape(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')))));
          const expMs = Number(payload?.exp || 0) * 1000;
          expired = expMs > 0 && Date.now() >= expMs;
        }
      } catch {}

      if (expired) {
        dispatch(logoutUser());
        return;
      }
      console.log('🔄 Login: User already authenticated, redirecting...');
      console.log('🔄 Login: User role:', user.role);
      console.log('🔄 Login: Needs password change:', needsPasswordChange);
      
      // If user needs to change password, redirect to change password page
      if (needsPasswordChange || user.isDefaultPassword) {
        console.log('🔄 Login: Redirecting to change password page');
        navigate('/change-password', { replace: true });
        return;
      }
      
      // Get the intended destination from location state, or use default dashboard
      const from = location.state?.from?.pathname;
      let redirectPath = from;
      
      // If no intended destination, redirect to user's default dashboard
      if (!redirectPath) {
        const roleRoutes = {
          'frontdesk': '/frontdesk/dashboard',
          'front-desk': '/frontdesk/dashboard', // Handle backend role format
          'nurse': '/dashboard/nurse',
          'doctor': '/dashboard/doctor',
          'admin': '/dashboard/admin',
          'super-admin': '/dashboard/superadmin',
          'cashier': '/cashier/dashboard',
          'pharmacist': '/dashboard/pharmacist',
          'hmo': '/dashboard/hmo',
          'developer': '/developer/logs',
          'it-support': '/developer/logs',
          'medical-laboratory': '/dashboard/laboratory',
          'medicallaboratory': '/dashboard/laboratory',
          'medical laboratory': '/dashboard/laboratory',
          'lab-technician': '/dashboard/laboratory',
          'labtechnician': '/dashboard/laboratory',
          'laboratory': '/dashboard/laboratory',
          'sonographer': '/dashboard/sonographer',
          'surgeon': '/dashboard/surgeon',
          'human-resource': '/dashboard/hr',
          'hr': '/dashboard/hr',
        };
        const roleOrType = user.role || user.accountType;
        redirectPath = roleRoutes[roleOrType] || '/frontdesk/dashboard';
      }
      
      console.log('🔄 Login: Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, needsPasswordChange, navigate, location.state, token, dispatch]);

  const onSubmit = async (data) => {
    // Clear any previous errors
    dispatch(clearError());
    
    // Dispatch login action
    console.log('🔄 Login: Dispatching loginUser action');
    const result = await dispatch(loginUser(data));
    
    console.log('📥 Login: Login result received:', result);
    console.log('📥 Login: Result type:', result.type);
    console.log('📥 Login: Result payload:', result.payload);
    
    if (loginUser.fulfilled.match(result)) {
      console.log('✅ Login: Login successful, showing success modal');
      // Login successful
      toast.success(`Welcome back, ${result.payload.user.firstName}!`);
      setShowSuccessModal(true);
      
      // Check if user needs to change password
      if (result.payload.needsPasswordChange) {
        console.log('🔒 Login: User needs to change password, redirecting to change password page');
        toast('Please change your default password to continue', { icon: 'ℹ️' });
        // Redirect to change password page
        setTimeout(() => {
          navigate('/change-password');
        }, 2000);
      } else {
        console.log('🏠 Login: Redirecting to dashboard');
        // Navigate to role-specific dashboard after delay
        setTimeout(() => {
          const dashboardPath = getDashboardPath(result.payload.user.role || result.payload.user.accountType);
          console.log('🏠 Login: Dashboard path:', dashboardPath);
          navigate(dashboardPath);
        }, 2000);
      }
    } else {
      console.log('❌ Login: Login failed or rejected');
      console.log('📥 Login: Error details:', result.payload);
      
      // Check if it's a default password error (403)
      if (result.payload && typeof result.payload === 'object' && result.payload.type === 'default_password') {
        console.log('🔒 Login: Default password detected, redirecting to change password');
        console.log('🔒 Login: User ID:', result.payload.userId);
        toast('Please change your default password to continue', { icon: 'ℹ️' });
        // Store user ID for change password page
        localStorage.setItem('changePasswordUserId', result.payload.userId);
        setTimeout(() => {
          navigate('/change-password-default');
        }, 2000);
      } else if (result.payload && typeof result.payload === 'object' && result.payload.type === 'shift_locked') {
        // Shift is locked / outside working hours (403)
        const payloadData = result.payload.shiftData;
        setShiftLockData({
          message: result.payload.message,
          lockoutReason: payloadData?.lockoutReason || result.payload.message,
          nextAllowedLoginTime: payloadData?.nextAllowedLoginTime,
          shift: payloadData?.shift,
          email: payloadData?.email || data.email,
        });
        setRequestEmail(data.email || payloadData?.email || '');
        setShowShiftLockModal(true);
      } else {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 
                           (result.payload?.message || 'Login failed. Please try again.');
        toast.error(errorMessage);
      }
    }
    // Error handling is done in the Redux slice
  };

  const handleSendShiftRequest = async (e) => {
    e?.preventDefault();
    if (!requestEmail || !requestReason || requestReason.trim().length < 5) {
      toast.error('Please enter a detailed reason for requesting shift access (min 5 characters).');
      return;
    }

    try {
      setIsSubmittingShiftRequest(true);
      const res = await shiftAccessAPI.requestAccessByEmail({
        email: requestEmail.trim(),
        reason: requestReason.trim(),
        requestType,
      });

      toast.success(
        res?.data?.message || 'Shift access request submitted! Please wait for HR or Super Admin approval.',
        { duration: 6000 }
      );
      setShowRequestModal(false);
      setShowShiftLockModal(false);
      setRequestReason('');
    } catch (err) {
      const errMsg = err?.response?.data?.message || err?.message || 'Failed to submit request';
      toast.error(typeof errMsg === 'string' ? errMsg : 'Failed to submit request');
    } finally {
      setIsSubmittingShiftRequest(false);
    }
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'frontdesk':
      case 'front-desk': // Handle backend role format
        return '/frontdesk/dashboard';
      case 'nurse':
        return '/dashboard/nurse';
      case 'doctor':
      case 'medical-director':
        return '/dashboard/medical-director'; // Medical director uses doctor dashboard
      case 'admin':
        return '/dashboard/admin';
      case 'super-admin':
        return '/dashboard/superadmin';
      case 'cashier':
        return '/cashier/dashboard';
      case 'pharmacist':
        return '/dashboard/pharmacist';
      case 'hmo':
        return '/dashboard/hmo';
      case 'developer':
      case 'it-support':
        return '/developer/logs';
      case 'human-resource':
      case 'hr':
        return '/dashboard/hr';
      default:
        return '/frontdesk/dashboard';
    }
  };

  const getUserInitials = (user) => {
    if (!user) return 'U';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    if (firstName && lastName) {
      return (firstName[0] + lastName[0]).toUpperCase();
    }
    return firstName[0]?.toUpperCase() || 'U';
  };

  const getUserFullName = (user) => {
    if (!user) return 'User';
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'User';
  };

  const SuccessModal = () => (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex fixed inset-0 z-50 justify-center items-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#EAFFF3] rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
          >
            <div className="flex overflow-hidden justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-primary">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={getUserFullName(user)}
                  className="object-cover w-full h-full"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {getUserInitials(user)}
                </span>
              )}
            </div>
            <h3 className="mb-2 text-2xl font-bold text-primary">
              Welcome Back,
            </h3>
            <h3 className="mb-6 text-2xl font-bold text-gray-800">
              {getUserFullName(user)?.toUpperCase() || 'USER'}
            </h3>
            <button
              onClick={() => {
                const dashboardPath = getDashboardPath(user?.role || user?.accountType);
                navigate(dashboardPath);
              }}
              className="flex justify-center items-center py-3 w-full font-medium rounded-lg transition-colors text-base-100 bg-primary hover:bg-primary/80"
            >
              <span className="mr-2">→</span>
              Proceed To Dashboard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AuthLayout
      title="Welcome Back 😊"
      subtitle="Please log in into your account"
      showCarousel={true}
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username Field */}
        <AuthInput
          type="text"
          name="email"
          autoComplete="off"
          placeholder="Enter Your Email"
          icon={FaUser}
          showClearButton={true}
          {...register("email")}
          error={errors.email || !!error}
          theme={currentTheme}
          className="text-sm 2xl:text-base"
        />
        <p className="mt-1 text-sm text-red-500">{errors.email?.message}</p>

        {/* Password Field */}
        <AuthInput
          type={showPassword ? "text" : "password"}
          name="password"
          autoComplete="off"
          placeholder="Enter Your Password"
          icon={FaLock}
          {...register("password")}
          rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
          onRightIconClick={() => setShowPassword(!showPassword)}
          error={errors.password || !!error}
          theme={currentTheme}
          className="text-sm 2xl:text-base"
        />
        <p className="mt-1 text-sm text-red-500">{errors.password?.message}</p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 2xl:py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-green-500 active:scale-95"
          }`}
        >
          {isLoading ? (
            <div className="flex justify-center items-center">
              <div className="mr-2 w-5 h-5 rounded-full border-b-2 border-white animate-spin"></div>
              Signing in...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-3 mt-4 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
          {typeof error === 'string' ? error : (error?.message || 'An error occurred')}
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal />

      {/* Shift Lockout Notification Modal */}
      <AnimatePresence>
        {showShiftLockModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-warning/30 text-center relative"
            >
              <div className="w-16 h-16 rounded-full bg-warning/15 text-warning flex items-center justify-center mx-auto mb-4 text-3xl shadow-xs">
                <FaClock />
              </div>

              <h3 className="text-xl font-bold text-base-content mb-1">
                Shift Access Restricted
              </h3>
              <p className="text-xs text-base-content/50 uppercase tracking-wider font-semibold mb-4">
                Hospital Shift Schedule Policy
              </p>

              <div className="bg-base-200/70 p-4 rounded-2xl border border-base-300 text-left mb-6 space-y-2">
                <div className="flex items-start gap-2.5">
                  <FaExclamationTriangle className="text-warning text-sm shrink-0 mt-0.5" />
                  <p className="text-xs text-base-content/80 leading-relaxed font-medium">
                    {shiftLockData?.lockoutReason || shiftLockData?.message || "Your shift has ended and login is restricted during the resting period."}
                  </p>
                </div>

                {shiftLockData?.nextAllowedLoginTime && (
                  <div className="pt-2 border-t border-base-300 text-[11px] text-base-content/60 flex items-center justify-between">
                    <span>Next Allowed Login:</span>
                    <span className="font-semibold text-primary">
                      {new Date(shiftLockData.nextAllowedLoginTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setShowShiftLockModal(false);
                    setShowRequestModal(true);
                  }}
                  className="w-full py-3 rounded-xl font-semibold text-xs text-white bg-warning hover:bg-warning/90 transition shadow-sm flex items-center justify-center gap-2"
                >
                  <FaPaperPlane className="text-xs" />
                  Request Emergency / Double Shift Access
                </button>

                <button
                  type="button"
                  onClick={() => setShowShiftLockModal(false)}
                  className="w-full py-2.5 rounded-xl font-medium text-xs text-base-content/60 hover:text-base-content hover:bg-base-200 transition"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Request Shift Access Modal (By Staff Email) */}
      <AnimatePresence>
        {showRequestModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex fixed inset-0 z-50 justify-center items-center p-4 bg-black/60 backdrop-blur-xs"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-base-100 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-base-300 relative text-left"
            >
              <div className="flex items-center justify-between pb-3 border-b border-base-200 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm">
                    <FaShieldAlt />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-base-content">
                      Request Shift Access
                    </h3>
                    <p className="text-[10px] text-base-content/50">
                      Submit request to HR & Super Admin
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="btn btn-ghost btn-circle btn-xs text-base-content/50 hover:text-base-content"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSendShiftRequest} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Staff Email Address
                  </label>
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    required
                    placeholder="Enter your registered staff email"
                    className="input input-sm w-full bg-base-200/80 border border-base-300 rounded-xl text-xs focus:bg-base-100 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Request Category
                  </label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value)}
                    className="select select-sm w-full bg-base-200/80 border border-base-300 rounded-xl text-xs focus:bg-base-100 focus:border-primary"
                  >
                    <option value="double_shift">Double Shift (Covering Next Shift)</option>
                    <option value="overtime">Overtime / Critical Patient Care</option>
                    <option value="emergency_call">Emergency Call Duty / Surgeries</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Reason for Access <span className="text-error">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    required
                    minLength={5}
                    placeholder="E.g. Standing in for Nurse Grace in Emergency ICU ward..."
                    className="textarea textarea-sm w-full bg-base-200/80 border border-base-300 rounded-xl text-xs focus:bg-base-100 focus:border-primary leading-relaxed"
                  />
                  <span className="text-[10px] text-base-content/40">
                    HR or Super Admin will review and grant an override.
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="btn btn-sm btn-ghost flex-1 rounded-xl text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingShiftRequest || !requestEmail || !requestReason}
                    className="btn btn-sm btn-primary flex-1 rounded-xl text-xs gap-1.5"
                  >
                    {isSubmittingShiftRequest ? (
                      <>
                        <FaSpinner className="animate-spin text-xs" /> Submitting...
                      </>
                    ) : (
                      <>
                        <FaPaperPlane className="text-xs" /> Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
};

export default Login;
