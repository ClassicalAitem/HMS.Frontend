import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaUserPlus, FaSave, FaTimes, FaEye, FaEyeSlash } from 'react-icons/fa';
import { usersAPI } from '@/services/api/usersAPI';
import toast from 'react-hot-toast';

// Validation schema
const registrationSchema = yup.object({
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
  phone: yup
    .string()
    .required('Phone number is required')
    .matches(/^[+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['superAdmin', 'admin', 'doctor', 'nurse', 'front-desk', 'cashier'], 'Please select a valid role'),
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

const SuperAdminRegistration = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
    resolver: yupResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedRole = watch('role');

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const onSubmit = async (data) => {
    console.log('📝 SuperAdminRegistration: Form submitted with data:', data);
    setIsLoading(true);

    try {
      // Prepare the data for the API (excluding department as requested)
      const userData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        role: data.role,
        password: data.password,
      };

      console.log('📤 SuperAdminRegistration: Sending user data:', userData);

      // Call the appropriate API based on role
      let response;
      if (data.role === 'admin') {
        response = await usersAPI.createAdmin(userData);
      } else {
        // For other roles, use the general createUser endpoint
        response = await usersAPI.createUser(userData);
      }

      console.log('✅ SuperAdminRegistration: User created successfully:', response.data);

      // Show success message
      toast.success(`${data.role.charAt(0).toUpperCase() + data.role.slice(1)} registered successfully!`);

      // Reset form
      reset();
    } catch (error) {
      console.error('❌ SuperAdminRegistration: Error creating user:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to register user. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    toast.info('Form reset successfully');
  };

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
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">User Registration</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">Register new users to the hospital management system</p>
          </div>

          {/* Registration Form */}
          <div className="max-w-4xl">
            <div className="p-6 rounded-lg shadow-lg bg-base-100">
              <div className="flex items-center mb-6 space-x-3">
                <div className="flex justify-center items-center w-10 h-10 rounded-lg bg-primary/10">
                  <FaUserPlus className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-base-content">New User Registration</h2>
                  <p className="text-sm text-base-content/70">Fill in the details below to register a new user</p>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Personal Information */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">First Name</label>
                    <input
                      type="text"
                      placeholder="Enter first name"
                      className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
                      {...register('firstName')}
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-xs text-error">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Last Name</label>
                    <input
                      type="text"
                      placeholder="Enter last name"
                      className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
                      {...register('lastName')}
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-xs text-error">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Email Address</label>
                    <input
                      type="email"
                      placeholder="Enter email address"
                      className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                      {...register('email')}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-error">{errors.email.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                      {...register('phone')}
                      disabled={isLoading}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-error">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Role Selection */}
                <div>
                  <label className="block mb-2 text-sm font-medium text-base-content">Role</label>
                  <select
                    className={`select select-bordered w-full ${errors.role ? 'select-error' : ''}`}
                    {...register('role')}
                    disabled={isLoading}
                  >
                    <option value="">Select a role</option>
                    <option value="superAdmin">Super Admin</option>
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="nurse">Nurse</option>
                    <option value="front-desk">Front Desk</option>
                    <option value="cashier">Cashier</option>
                    <option value="lab-technician">Lab Technician</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-xs text-error">{errors.role.message}</p>
                  )}
                </div>

                {/* Password Information */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Password</label>
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
                      <p className="mt-1 text-xs text-error">{errors.password.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block mb-2 text-sm font-medium text-base-content">Confirm Password</label>
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
                      <p className="mt-1 text-xs text-error">{errors.confirmPassword.message}</p>
                    )}
                  </div>
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

                {/* Form Actions */}
                <div className="flex gap-4 pt-6">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isLoading}
                    className="flex-1 btn btn-outline"
                  >
                    <FaTimes className="mr-2 w-4 h-4" />
                    Reset Form
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn btn-primary"
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-sm"></span>
                        Registering...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2 w-4 h-4" />
                        Register User
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminRegistration;
