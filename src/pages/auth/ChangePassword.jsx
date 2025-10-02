/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { FaEye, FaEyeSlash, FaLock, FaCheck } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { changePasswordSchema } from '../../../utils/formValidator';
import { motion, AnimatePresence } from 'framer-motion';
import { MdLockOpen } from 'react-icons/md';
import { FiEye } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { changePassword, passwordChanged } from '../../store/slices/authSlice';

const ChangePassword = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { isLoading, error, user } = useAppSelector((state) => state.auth);
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(changePasswordSchema),
  });

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    // Dispatch change password action
    const result = await dispatch(changePassword(data));
    
    if (changePassword.fulfilled.match(result)) {
      // Password change successful
      dispatch(passwordChanged());
      setShowSuccessModal(true);
      
      // Navigate to appropriate dashboard after delay
      setTimeout(() => {
        const getDashboardPath = (role) => {
          switch (role) {
            case 'frontdesk':
              return '/dashboard/frontdesk';
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
              return '/dashboard/frontdesk';
          }
        };
        
        const dashboardPath = getDashboardPath(user?.role);
        navigate(dashboardPath);
      }, 2000);
    }
    // Error handling is done in the Redux slice
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
            className="p-8 mx-4 w-full max-w-sm text-center rounded-2xl shadow-xl bg-base-100"
          >
            <div className="flex justify-center items-center mx-auto mb-6 w-20 h-20 rounded-full bg-success">
              <FaCheck className="w-10 h-10 text-white" />
            </div>
            <h3 className="mb-2 text-2xl font-bold text-base-content">
              Password Updated!
            </h3>
            <p className="mb-6 text-base-content/70">
              Your password has been successfully changed.
            </p>
            <button
              onClick={() => setShowSuccessModal(false)}
              className="py-3 w-full font-medium text-white rounded-lg transition-colors bg-primary hover:bg-primary/90"
            >
              Continue
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const PasswordRequirement = ({ text, isValid }) => (
    <div className="flex items-center space-x-2">
      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
        isValid ? 'bg-success' : 'bg-base-300'
      }`}>
        {isValid && <FaCheck className="w-2 h-2 text-white" />}
      </div>
      <span className={`text-sm ${isValid ? 'text-success' : 'text-base-content/70'}`}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">Change Password</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">Update your password to keep your account secure.</p>
          </div>

          {/* Change Password Form */}
          <div className="space-y-6 max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Password Settings Card */}
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                <div className="flex items-center mb-6 space-x-3">
                  <div className="flex justify-center items-center w-8 h-8 rounded-lg bg-primary/10">
                    <MdLockOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-base-content">Password Settings</h2>          
                    <p className="text-sm text-base-content/70">
                      Choose a strong password that you haven't used before.
                    </p>
                  </div>
                </div>

                <div className="space-y-5">
                  {/* Current Password */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? "text" : "password"}
                        placeholder="Enter your current Password"
                        className="px-3 py-2 w-full rounded-none border-0 border-b 2xl:py-3 text-base-content bg-base-200 border-base-300 focus:border-primary focus:outline-none focus:ring-0"
                        {...register('currentPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('current')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content/70"
                      >
                        {showPasswords.current ? <FaEyeSlash className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.currentPassword && (
                      <p className="mt-1 text-sm text-error">{errors.currentPassword.message}</p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        placeholder="Enter your New Password"
                        className="px-3 py-2 w-full rounded-none border-0 border-b 2xl:py-3 text-base-content bg-base-200 border-base-300 focus:border-primary focus:outline-none focus:ring-0"
                        {...register('newPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content/70"
                      >
                        {showPasswords.new ? <FaEyeSlash className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && (
                      <p className="mt-1 text-sm text-error">{errors.newPassword.message}</p>
                    )}
                  </div>

                  {/* Confirm New Password */}
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        placeholder="Confirm your New Password"
                        className="px-3 py-2 w-full rounded-none border-0 border-b 2xl:py-3 text-base-content bg-base-200 border-base-300 focus:border-primary focus:outline-none focus:ring-0"
                        {...register('confirmPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content/70"
                      >
                        {showPasswords.confirm ? <FaEyeSlash className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Password Requirements Card */}
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                <h3 className="mb-4 text-lg font-semibold text-base-content">Password Requirement</h3>
                
                <div className="space-y-3">
                  <PasswordRequirement 
                    text="At least 8 charatcers long" 
                    isValid={newPassword && newPassword.length >= 8} 
                  />
                  <PasswordRequirement 
                    text="Different from your current passwords" 
                    isValid={true} 
                  />
                  <PasswordRequirement 
                    text="Confirmation password matches" 
                    isValid={watch('confirmPassword') && watch('confirmPassword') === newPassword} 
                  />
                </div>
              </div>

              {/* Save Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isLoading
                    ? "cursor-not-allowed bg-base-300"
                    : "bg-primary hover:bg-primary/90 active:scale-95"
                }`}
              >
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="mr-2 w-5 h-5 rounded-full border-b-2 border-white animate-spin"></div>
                    Updating Password...
                  </div>
                ) : (
                  "Save Password"
                )}
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal />
    </div>
  );
};

export default ChangePassword;
