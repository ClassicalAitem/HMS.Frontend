import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaUserShield } from 'react-icons/fa';
import toast from 'react-hot-toast';

const createRoleSchema = yup.object({
  name: yup
    .string()
    .required('Role name is required')
    .min(2, 'Role name must be at least 2 characters')
    .max(50, 'Role name must not exceed 50 characters'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters'),
  permissions: yup
    .object()
    .test('at-least-one', 'At least one permission must be selected', (value) => {
      return Object.values(value).some(permission => permission === true);
    })
});

const CreateRoleModal = ({ isOpen, onClose, onRoleCreated }) => {
  const [isLoading, setIsLoading] = useState(false);

  const permissions = [
    { id: 'editPatients', label: 'Edit Patients', description: 'Allow editing patient information' },
    { id: 'deletePatients', label: 'Delete Patients', description: 'Allow deleting patient records' },
    { id: 'viewReports', label: 'View Reports', description: 'Allow viewing system reports' },
    { id: 'billManagement', label: 'Bill Management', description: 'Allow managing billing and payments' },
    { id: 'userManagement', label: 'User Management', description: 'Allow managing users and roles' },
    { id: 'systemSettings', label: 'System Settings', description: 'Allow accessing system settings' }
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm({
    resolver: yupResolver(createRoleSchema),
    defaultValues: {
      permissions: {
        editPatients: false,
        deletePatients: false,
        viewReports: false,
        billManagement: false,
        userManagement: false,
        systemSettings: false
      }
    }
  });

  const watchedPermissions = watch('permissions');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Role created:', data);
      toast.success('Role created successfully!');
      reset();
      onRoleCreated();
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Failed to create role');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-lg mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
              <FaUserShield className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Create New Role</h3>
          </div>
          <button
            onClick={handleClose}
            className="btn btn-ghost btn-sm"
            disabled={isLoading}
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6">
          <div className="space-y-6">
            {/* Role Name */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Role Name
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter role name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-error text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className={`textarea textarea-bordered w-full ${errors.description ? 'textarea-error' : ''}`}
                placeholder="Enter role description"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-error text-xs mt-1">{errors.description.message}</p>
              )}
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-3">
                Permissions
              </label>
              <div className="space-y-3">
                {permissions.map((permission) => (
                  <div key={permission.id} className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      {...register(`permissions.${permission.id}`)}
                      className="checkbox checkbox-primary mt-1"
                      disabled={isLoading}
                    />
                    <div className="flex-1">
                      <label className="text-sm font-medium text-base-content">
                        {permission.label}
                      </label>
                      <p className="text-xs text-base-content/70">
                        {permission.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {errors.permissions && (
                <p className="text-error text-xs mt-2">{errors.permissions.message}</p>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-base-300">
            <button
              type="button"
              onClick={handleClose}
              className="btn btn-outline"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRoleModal;
