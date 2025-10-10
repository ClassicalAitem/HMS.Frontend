import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { changePasswordSchema } from '../../../utils/formValidator';
import { AuthLayout, AuthLogo, CarouselComponent } from '@/components/auth';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { loginUser } from '@/store/slices/authSlice';
import toast from 'react-hot-toast';
import { FaEye, FaEyeSlash, FaLock, FaArrowLeft } from 'react-icons/fa';

const ChangePasswordDefault = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword');

  // Get user ID from localStorage (stored during login redirect)
  useEffect(() => {
    const storedUserId = localStorage.getItem('changePasswordUserId');
    if (storedUserId) {
      setUserId(storedUserId);
      console.log('🔑 ChangePasswordDefault: User ID from localStorage:', storedUserId);
    } else {
      console.log('❌ ChangePasswordDefault: No user ID found, redirecting to login');
      navigate('/login');
    }
  }, [navigate]);

  // Redirect if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🏠 ChangePasswordDefault: User already authenticated, redirecting to dashboard');
      const roleRoutes = {
        'frontdesk': '/frontdesk/dashboard',
        'front-desk': '/frontdesk/dashboard',
        'nurse': '/dashboard/nurse',
        'doctor': '/dashboard/doctor',
        'admin': '/dashboard/admin',
        'super-admin': '/dashboard/superadmin',
        'cashier': '/dashboard/cashier',
      };
      
      const dashboardPath = roleRoutes[user.role] || '/frontdesk/dashboard';
      navigate(dashboardPath);
    }
  }, [isAuthenticated, user, navigate]);

  const onSubmit = async (data) => {
    if (!userId) {
      toast.error('User ID not found. Please try logging in again.');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('🔄 ChangePasswordDefault: Changing password for user:', userId);
      console.log('📊 ChangePasswordDefault: Password data:', data);
      
      // Prepare data for API
      const passwordData = {
        oldPassword: data.currentPassword,
        newPassword: data.newPassword
      };
      
      console.log('📤 ChangePasswordDefault: API data:', passwordData);
      
      // Make API call to change password
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/user/changePassword/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwordData),
      });
      
      const result = await response.json();
      console.log('📥 ChangePasswordDefault: API response:', result);
      
      if (response.ok && result.success) {
        console.log('✅ ChangePasswordDefault: Password changed successfully');
        toast.success('Password changed successfully!');
        
        // Clear the stored user ID
        localStorage.removeItem('changePasswordUserId');
        
        // Show success modal
        setShowSuccessModal(true);
        
        // Auto-login with new credentials after delay
        setTimeout(() => {
          // We need to get the user's email/phone for login
          // For now, we'll redirect to login page with a success message
          toast.success('Please log in with your new password');
          navigate('/login');
        }, 2000);
        
      } else {
        console.error('❌ ChangePasswordDefault: Password change failed:', result.message);
        toast.error(result.message || 'Failed to change password');
      }
      
    } catch (error) {
      console.error('❌ ChangePasswordDefault: Password change error:', error);
      toast.error('Failed to change password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'frontdesk':
      case 'front-desk':
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
        return '/dashboard/cashier';
      default:
        return '/frontdesk/dashboard';
    }
  };

  return (
    <AuthLayout>
      <div className="flex">
        {/* Right Side - Change Password Form */}
        <div className="flex justify-center items-center w-full lg:w-full bg-base-100">
          <div className="w-full">
            {/* Header */}
            <div className="mb-4 text-center">
              <h1 className="mb-2 text-3xl font-bold text-base-content">
                Change Your Password
              </h1>
              <p className="text-base-content/70">
                Please change your default password to continue
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Current Password */}
              <div className="form-control">
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Current Password
                </label>
                <div className="relative">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <FaLock className="w-5 h-5 text-base-content/40" />
                  </div>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    {...register('currentPassword')}
                    className="py-3 pr-10 pl-10 w-full rounded-lg border transition-colors border-base-300 focus:ring-2 focus:ring-primary focus:border-transparent bg-base-100"
                    placeholder="Enter your current password"
                  />
                  <button
                    type="button"
                    className="flex absolute inset-y-0 right-0 items-center pr-3"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? (
                      <FaEyeSlash className="w-5 h-5 text-base-content/40" />
                    ) : (
                      <FaEye className="w-5 h-5 text-base-content/40" />
                    )}
                  </button>
                </div>
                {errors.currentPassword && (
                  <p className="mt-1 text-sm text-error">{errors.currentPassword.message}</p>
                )}
              </div>

              {/* New Password */}
              <div className="form-control">
                <label className="block mb-2 text-sm font-medium text-base-content">
                  New Password
                </label>
                <div className="relative">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <FaLock className="w-5 h-5 text-base-content/40" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    {...register('newPassword')}
                    className="py-3 pr-10 pl-10 w-full rounded-lg border transition-colors border-base-300 focus:ring-2 focus:ring-primary focus:border-transparent bg-base-100"
                    placeholder="Enter your new password"
                  />
                  <button
                    type="button"
                    className="flex absolute inset-y-0 right-0 items-center pr-3"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <FaEyeSlash className="w-5 h-5 text-base-content/40" />
                    ) : (
                      <FaEye className="w-5 h-5 text-base-content/40" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="mt-1 text-sm text-error">{errors.newPassword.message}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="form-control">
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="flex absolute inset-y-0 left-0 items-center pl-3 pointer-events-none">
                    <FaLock className="w-5 h-5 text-base-content/40" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    {...register('confirmPassword')}
                    className="py-3 pr-10 pl-10 w-full rounded-lg border transition-colors border-base-300 focus:ring-2 focus:ring-primary focus:border-transparent bg-base-100"
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    className="flex absolute inset-y-0 right-0 items-center pr-3"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <FaEyeSlash className="w-5 h-5 text-base-content/40" />
                    ) : (
                      <FaEye className="w-5 h-5 text-base-content/40" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-3 w-full font-medium rounded-lg shadow-md transition-colors bg-primary hover:bg-primary-focus text-primary-content focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
                >
                  {isLoading ? (
                    <span className="flex justify-center items-center">
                      <svg className="mr-3 -ml-1 w-5 h-5 text-white animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Changing Password...
                    </span>
                  ) : (
                    'Change Password'
                  )}
                </button>
              </div>
            </form>

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="flex justify-center items-center mx-auto transition-colors text-primary hover:text-primary-focus"
              >
                <FaArrowLeft className="mr-2" /> Back to Login
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
          <div className="p-8 w-full max-w-md rounded-lg shadow-xl bg-base-100">
            <div className="text-center">
              <div className="flex justify-center items-center mx-auto w-16 h-16 rounded-full bg-success/20">
                <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-medium text-base-content">Password Changed Successfully!</h3>
              <p className="mt-2 text-base-content/70">
                Your password has been changed successfully. You will be redirected to the login page.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex justify-center px-6 py-2 text-sm font-medium rounded-md shadow-md text-primary-content bg-primary hover:bg-primary-focus focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AuthLayout>
  );
};

export default ChangePasswordDefault;
