/* eslint-disable */
import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { AuthLayout, AuthInput } from "@/components/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../../utils/formValidator";
import { useTheme } from "../../contexts/ThemeContext";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser, clearError, logoutUser } from "../../store/slices/authSlice";
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

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));

  // Clear error when user starts typing
  //   if (error) {
  //     setError("");
  //   }
  // };

  // const handleClearInput = (fieldName) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [fieldName]: "",
  //   }));
  // };

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
        };
        const roleOrType = user.role || user.accountType;
        redirectPath = roleRoutes[roleOrType] || '/frontdesk/dashboard';
      }
      
      console.log('🔄 Login: Redirecting to:', redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [isAuthenticated, user, needsPasswordChange, navigate, location.state, token, dispatch]);

  const onSubmit = async (data) => {
    console.log('🚀 Login: Starting login process');
    console.log('📤 Login: Form data:', data);
    
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
      } else {
        const errorMessage = typeof result.payload === 'string' ? result.payload : 
                           (result.payload?.message || 'Login failed. Please try again.');
        toast.error(errorMessage);
      }
    }
    // Error handling is done in the Redux slice
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'frontdesk':
      case 'front-desk': // Handle backend role format
        return '/frontdesk/dashboard';
      case 'nurse':
        return '/dashboard/nurse';
      case 'doctor':
        return '/dashboard/doctor';
      case 'admin':
        return '/dashboard/admin';
      case 'super-admin':
        return '/dashboard/superadmin';
      case 'cashier':
        return '/cashier/dashboard';
      case 'pharmacist':
        return '/dashboard/pharmacist';
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
                const dashboardPath = getDashboardPath(user?.role);
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
          // value={formData.username}
          // onChange={handleInputChange}
          placeholder="Enter Your Email"
          icon={FaUser}
          showClearButton={true}
          {...register("email")}
          // onClear={() => handleClearInput("username")}
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
          // value={formData.password}
          // onChange={handleInputChange}
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

        {/* Forgot Password */}
        {/* <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm transition-colors 2xl:text-base text-primary hover:text-green-600"
          >
            Forgot Password?
          </Link>
        </div> */}

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

      {/* Debug Components - Remove in production */}
      {/* <div className="hidden overflow-y-auto fixed right-4 bottom-4 z-50 space-y-4 max-h-96">
        <AuthTest />
        <RouteProtectionTest />
        <LoginRedirectTest />
        <LogoutTest />
        <TokenDebug />
      </div> */}
    </AuthLayout>
  );
};

export default Login;
