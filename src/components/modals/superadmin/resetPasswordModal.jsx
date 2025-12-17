import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaUserEdit, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';
import { usersAPI } from '../../../services/api/usersAPI';
import toast from 'react-hot-toast';

// Validation schema
const resetPasswordSchema = yup.object({
  password: yup
    .string()
    .min(6, 'Password must be at least 8 characters')
    .max(50, 'Password must not exceed 50 characters'),
  confirmPassword: yup
    .string()
    .when('password', {
      is: (password) => password && password.length > 0,
      then: (schema) => schema.required('Please confirm your password').oneOf([yup.ref('password')], 'Passwords do not match'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const ResetPasswordModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');

  // Update form values when user prop changes
  useEffect(() => {
    if (user && isOpen) {
      console.log('📝 ResetPasswordModal: Setting form values for user:', user);
      setValue('password', '');
      setValue('confirmPassword', '');
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data) => {
    console.log('📝 ResetPasswordModal: Form submitted with data:', data);
    setIsLoading(true);

    const resetPasswordData = {
      id: user.id,
    };

    // Only include password if it's provided
    if (data.password && data.password.trim()) {
      resetPasswordData.password = data.password;
    }

    console.log('📤 ResetPasswordModal: Sending update data:', resetPasswordData);

    try {
      await toast.promise(
        usersAPI.resetUserPassword(resetPasswordData),
        {
          loading: 'Resetting user password...',
          success: 'User password reset successfully!',
          error: (err) => {
            console.error('❌ ResetPasswordModal: Error updating user:', err);
            const responseMsg = err.response?.data?.message;
            
            // Handle object error messages safely to prevent React crash
            if (typeof responseMsg === 'object' && responseMsg !== null) {
              return responseMsg.message || 'Failed to reset password';
            }
            
            return responseMsg || 'Failed to reset password. Please try again.';
          }
        }
      );

      // Reset form and close modal on success
      reset();
      onClose();

      // Notify parent component to refresh the users list
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      // Error is handled by toast.promise error callback
      console.error('❌ ResetPasswordModal: Error caught in submit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      reset();
      onClose();
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaUserEdit className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-base-content">Reset Password</h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* User Info Display */}
          <div className="mb-4 p-3 bg-base-200 rounded-lg">
            <div className="text-sm text-base-content/70">
              <div><strong>User ID:</strong> {user.id}</div>
              <div><strong>Current Status:</strong>
                <span className={`ml-1 badge ${user.isActive ? 'badge-success' : 'badge-error'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div><strong>Created:</strong> {new Date(user.createdAt).toLocaleDateString()}</div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">First Name</span>
              </label>
              <input
                type="text"
                value={user?.firstName || ''}
                className="input input-bordered w-full"
                disabled
                readOnly
              />
            </div>

            {/* Last Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Last Name</span>
              </label>
              <input
                type="text"
                value={user?.lastName || ''}
                className="input input-bordered w-full"
                disabled
                readOnly
              />
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <input
                type="email"
                value={user?.email || ''}
                className={"input input-bordered w-full"}
                disabled
                readOnly
              />
            </div>

            {/* Role */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Role</span>
              </label>
              <select
                className={"select select-bordered w-full"}
                disabled
                readOnly
              >
                <option value="">{user?.accountType || ''}</option>
              </select>
            </div>

            {/* Password */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">New Password</span>
                <span className="label-text-alt text-base-content/60">(Leave blank to keep current password)</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter new password (optional)"
                  className={`input input-bordered w-full pr-10 ${errors.password ? 'input-error' : ''}`}
                  {...register('password')}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content"
                  disabled={isLoading}
                >
                  {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.password.message}</span>
                </label>
              )}
            </div>

            {/* Confirm Password - Only show if password is provided */}
            {watchedPassword && watchedPassword.length > 0 && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Confirm New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className={`input input-bordered w-full pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    {...register('confirmPassword')}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/60 hover:text-base-content"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error">{errors.confirmPassword.message}</span>
                  </label>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    resetting password...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Reset Password User
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordModal;
