import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaUserPlus, FaEye, FaEyeSlash } from 'react-icons/fa';
import { usersAPI } from '../../../services/api/usersAPI';
import toast from 'react-hot-toast';

// Validation schema
const addUserSchema = yup.object({
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
    .oneOf(['admin', 'doctor', 'nurse', 'frontdesk', 'cashier'], 'Please select a valid role'),
  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must not exceed 50 characters'),
  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match'),
});

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(addUserSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedRole = watch('role');

  const onSubmit = async (data) => {
    console.log('📝 AddUserModal: Form submitted with data:', data);
    setIsLoading(true);

    try {
      // Prepare the data for the API
      const userData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        role: data.role,
        password: data.password,
      };

      console.log('📤 AddUserModal: Sending user data:', userData);

      // Call the appropriate API based on role
      let response;
      if (data.role === 'admin') {
        response = await usersAPI.createAdmin(userData);
      } else {
        // For other roles, use the general createUser endpoint
        response = await usersAPI.createUser(userData);
      }

      console.log('✅ AddUserModal: User created successfully:', response.data);

      // Show success message
      toast.success(`${data.role.charAt(0).toUpperCase() + data.role.slice(1)} created successfully!`);

      // Reset form and close modal
      reset();
      onClose();

      // Notify parent component to refresh the users list
      if (onUserAdded) {
        onUserAdded();
      }
    } catch (error) {
      console.error('❌ AddUserModal: Error creating user:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to create user. Please try again.';
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

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/70">
      <div className="mx-4 w-full max-w-md shadow-xl 2xl:max-w-lg card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col gap-2 items-start">
              <FaUserPlus className="hidden w-5 h-5 text-primary" />
              <h2 className="text-xl font-normal text-primary">Add New User</h2>
              <p className="text-sm text-base-content/70">Create a new user account and assign a role.</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* First Name */}
            <div className="form-control">
              <label className="label">
                <span className="font-medium label-text text-base-content">First Name</span>
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
                <span className="font-medium label-text text-base-content">Last Name</span>
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
                <span className="font-medium label-text text-base-content">Email Address</span>
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
                <span className="font-medium label-text text-base-content">Role</span>
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
                <span className="font-medium label-text text-base-content">Password</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
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

            {/* Confirm Password */}
            <div className="form-control">
              <label className="label">
                <span className="font-medium label-text text-base-content">Confirm Password</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
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

            {/* Role-specific info */}
            {watchedRole === 'admin' && (
              <div className="alert alert-info">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      Admin users will be created using the dedicated admin creation endpoint.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaUserPlus className="w-4 h-4" />
                    Create User
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1 btn btn-outline"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUserModal;
