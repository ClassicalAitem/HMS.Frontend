import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { FaEye, FaEyeSlash, FaLock, FaCheck } from 'react-icons/fa';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { changePasswordSchema } from '../../../utils/formValidator';
import { motion, AnimatePresence } from 'framer-motion';

const ChangePassword = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isLoading, setIsLoading] = useState(false);
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
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Show success modal
      setShowSuccessModal(true);
      
      // Reset form after delay
      setTimeout(() => {
        reset();
        setShowSuccessModal(false);
      }, 2000);
    } catch (error) {
      console.error('Password change failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const SuccessModal = () => (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-base-100 rounded-2xl p-8 max-w-sm w-full mx-4 text-center shadow-xl"
          >
            <div className="mx-auto mb-6 w-20 h-20 bg-success rounded-full flex items-center justify-center">
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
              className="w-full py-3 font-medium text-white bg-primary rounded-lg transition-colors hover:bg-primary/90"
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
            <p className="text-base-content/70 2xl:text-lg">Update your password to keep your account secure.</p>
          </div>

          {/* Change Password Form */}
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Password Settings Card */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FaLock className="w-5 h-5 text-primary" />
                    </div>
                    <h2 className="text-xl font-semibold text-base-content">Password Settings</h2>
                  </div>
                  
                  <p className="text-base-content/70 mb-6">
                    Choose a strong password that you haven't used before.
                  </p>

                  <div className="space-y-4">
                    {/* Current Password */}
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? "text" : "password"}
                          placeholder="Enter your current password"
                          className="input input-bordered w-full pr-12"
                          {...register('currentPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                        >
                          {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-error">{errors.currentPassword.message}</p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? "text" : "password"}
                          placeholder="Enter your new password"
                          className="input input-bordered w-full pr-12"
                          {...register('newPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('new')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                        >
                          {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-error">{errors.newPassword.message}</p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? "text" : "password"}
                          placeholder="Confirm your new password"
                          className="input input-bordered w-full pr-12"
                          {...register('confirmPassword')}
                        />
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('confirm')}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                        >
                          {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-error">{errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Password Requirements Card */}
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-6">
                  <h3 className="text-lg font-semibold text-base-content mb-4">Password Requirements</h3>
                  
                  <div className="space-y-3">
                    <PasswordRequirement 
                      text="At least 8 characters long" 
                      isValid={newPassword && newPassword.length >= 8} 
                    />
                    <PasswordRequirement 
                      text="Different from your current password" 
                      isValid={true} 
                    />
                    <PasswordRequirement 
                      text="Confirmation password matches" 
                      isValid={watch('confirmPassword') && watch('confirmPassword') === newPassword} 
                    />
                  </div>
                </div>
              </div>

              {/* Save Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
                  isLoading
                    ? "bg-base-300 cursor-not-allowed"
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
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <SuccessModal />
    </div>
  );
};

export default ChangePassword;
