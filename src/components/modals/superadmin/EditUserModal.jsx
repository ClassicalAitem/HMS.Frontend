import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaUserEdit, FaEye, FaEyeSlash, FaSave } from 'react-icons/fa';
import { usersAPI } from '../../../services/api/usersAPI';
import toast from 'react-hot-toast';
import { getAllDepartments } from '@/services/api/departmentAPI';

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
  role: yup
    .string()
    .required('Role is required')
    .oneOf(['admin', 'doctor', 'nurse', 'frontdesk', 'cashier', 'pharmacist', 'lab-technician'], 'Please select a valid role'),
  departmentId: yup
    .string()
    .notRequired(),
});

const EditUserModal = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    if(!isOpen) return;

    const fetchDepartment = async() => {
      try {
        const res = await getAllDepartments();
        const list = res.data || [];
        setDepartments(list);
      } catch (error) {
        console.error(error);
      }
    }
    fetchDepartment();
  }, [isOpen]);

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
      departmentId: '',
    },
  });

  const watchedRole = watch('role');

  // Update form values when user prop changes
  useEffect(() => {
    if (user && isOpen) {
      console.log('📝 EditUserModal: Setting form values for user:', user);
      setValue('firstName', user.firstName || '');
      setValue('lastName', user.lastName || '');
      setValue('email', user.email || '');
      setValue('role', user.accountType || '');
      setValue('departmentId', '');
      setValue('confirmPassword', '');
    }
  }, [user, isOpen, setValue]);

  const onSubmit = async (data) => {
    console.log('📝 EditUserModal: Form submitted with data:', data);
    setIsLoading(true);

    try {
      console.log('Data to be sent for update:', data);
      // Prepare the data for the API
      const updateData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        accountType: data.role,
      };

      // Only add departmentId if it's selected
      if (data.departmentId && data.departmentId.trim()) {
        updateData.departmentId = data.departmentId;
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
                <option value="lab-technician">Lab Technician</option>
              </select>
              {errors.role && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.role.message}</span>
                </label>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Department
              </label>
              <select
                {...register('departmentId')}
                className={`select select-bordered w-full ${errors.department ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-error text-xs mt-1">{errors.department.message}</p>
              )}
            </div>

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
