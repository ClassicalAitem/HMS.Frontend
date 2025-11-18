import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaUserEdit, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';
import { usersAPI } from '../../../services/api/usersAPI';
import toast from 'react-hot-toast';

// Validation schema
const editUserSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),
  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address'),
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['admin', 'doctor', 'nurse', 'frontdesk', 'cashier', 'pharmacist'], 'Please select a valid role'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must not exceed 50 characters'),
  confirmPassword: yup
    .string()
    .when('password', {
      is: (password) => password && password.length > 0,
      then: (schema) => schema.required('Please confirm your password').oneOf([yup.ref('password')], 'Passwords do not match'),
      otherwise: (schema) => schema.notRequired(),
    }),
});

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
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
    resolver: yupResolver(editUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedPassword = watch('password');
  const watchedRole = watch('role');

  // Update form values when user prop changes
  useEffect(() => {
    if (user && isOpen) {
      console.log('📝 EditUserModal: Setting form values for user:', user);
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email || '');
      setValue('role', user.accountType || '');
      setValue('password', '');
      setValue('confirmPassword', '');
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data) => {
    console.log('📝 EditUserModal: Form submitted with data:', data);
    setIsLoading(true);

    try {
      // Prepare the data for the API
      const updateData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        accountType: data.role,
      };

      // Only include password if it's provided
      if (data.password && data.password.trim()) {
        updateData.password = data.password;
      }

      console.log('📤 EditUserModal: Sending update data:', updateData);
      console.log('📤 EditUserModal: Updating user ID:', user.id);

      // Call the update user API
      const response = await usersAPI.updateUser(user.id, updateData);

      console.log('✅ EditUserModal: User updated successfully:', response.data);

      // Show success message
      toast.success('User updated successfully!');

      // Reset form and close modal
      reset();
      onClose();

      // Notify parent component to refresh the users list
      if (onUserUpdated) {
        onUserUpdated();
      }
    } catch (error) {
      console.error('❌ EditUserModal: Error updating user:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to update user. Please try again.';
      toast.error(errorMessage);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FaUserEdit className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-base-content">Edit User</h2>
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
                placeholder="Enter first name"
                className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.firstName.message}</span>
                </label>
              )}
            </div>

            {/* Last Name */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Last Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter last name"
                className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.lastName.message}</span>
                </label>
              )}
            </div>

            {/* Email */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Email Address</span>
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.email.message}</span>
                </label>
              )}
            </div>

            {/* Role */}
            <div className="form-control">
              <label className="label">
                <span className="label-text font-medium">Role</span>
              </label>
              <select
                className={`select select-bordered w-full ${errors.role ? 'select-error' : ''}`}
                {...register('role')}
                disabled={isLoading}
              >
                <option value="">Select a role</option>
                <option value="admin">Admin</option>
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="frontdesk">Front Desk</option>
                <option value="cashier">Cashier</option>
                <option value="pharmacist">Pharmacist</option>
              </select>
              {errors.role && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.role.message}</span>
                </label>
              )}
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

            {/* Role-specific info */}
            {watchedRole && (
              <div className="alert alert-info">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      Changing the role will update the user's permissions and access levels.
                    </p>
                  </div>
                </div>
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
                    Updating...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    Update User
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

export default EditUserModal;
