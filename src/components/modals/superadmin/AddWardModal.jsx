import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaBed } from 'react-icons/fa';
import toast from 'react-hot-toast';

const addWardSchema = yup.object({
  name: yup
    .string()
    .required('Ward name is required')
    .min(2, 'Ward name must be at least 2 characters')
    .max(50, 'Ward name must not exceed 50 characters'),
  department: yup
    .string()
    .required('Department is required'),
  floor: yup
    .string()
    .required('Floor is required')
    .min(1, 'Floor must be at least 1 character'),
  bedCapacity: yup
    .number()
    .required('Bed capacity is required')
    .min(1, 'Bed capacity must be at least 1')
    .max(100, 'Bed capacity must not exceed 100'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
});

const AddWardModal = ({ isOpen, onClose, onWardAdded }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Sample departments for dropdown
  const departments = [
    'General Medicine',
    'Cardiology',
    'Emergency',
    'Pediatrics',
    'Surgery',
    'Intensive Care',
    'Radiology',
    'Oncology'
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(addWardSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Ward added:', data);
      toast.success('Ward added successfully!');
      reset();
      onWardAdded();
    } catch (error) {
      console.error('Error adding ward:', error);
      toast.error('Failed to add ward');
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
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
              <FaBed className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Add New Ward</h3>
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
          <div className="space-y-4">
            {/* Ward Name */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Ward Name
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter ward name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-error text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Department
              </label>
              <select
                {...register('department')}
                className={`select select-bordered w-full ${errors.department ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select department</option>
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
              {errors.department && (
                <p className="text-error text-xs mt-1">{errors.department.message}</p>
              )}
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Floor
              </label>
              <input
                type="text"
                {...register('floor')}
                className={`input input-bordered w-full ${errors.floor ? 'input-error' : ''}`}
                placeholder="e.g., 2nd Floor, Ground Floor"
                disabled={isLoading}
              />
              {errors.floor && (
                <p className="text-error text-xs mt-1">{errors.floor.message}</p>
              )}
            </div>

            {/* Bed Capacity */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Bed Capacity
              </label>
              <input
                type="number"
                {...register('bedCapacity', { valueAsNumber: true })}
                className={`input input-bordered w-full ${errors.bedCapacity ? 'input-error' : ''}`}
                placeholder="Enter bed capacity"
                min="1"
                max="100"
                disabled={isLoading}
              />
              {errors.bedCapacity && (
                <p className="text-error text-xs mt-1">{errors.bedCapacity.message}</p>
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
                placeholder="Enter ward description"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="text-error text-xs mt-1">{errors.description.message}</p>
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
                  Adding...
                </>
              ) : (
                'Add Ward'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWardModal;
