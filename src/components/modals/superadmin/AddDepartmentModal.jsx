import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaBuilding } from 'react-icons/fa';
import toast from 'react-hot-toast';

const addDepartmentSchema = yup.object({
  name: yup
    .string()
    .required('Department name is required')
    .min(2, 'Department name must be at least 2 characters')
    .max(50, 'Department name must not exceed 50 characters'),
  head: yup
    .string()
    .required('Department head is required')
    .min(2, 'Department head name must be at least 2 characters'),
  beds: yup
    .number()
    .required('Number of beds is required')
    .min(1, 'Number of beds must be at least 1')
    .max(1000, 'Number of beds must not exceed 1000'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
});

const AddDepartmentModal = ({ isOpen, onClose, onDepartmentAdded }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(addDepartmentSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Department added:', data);
      toast.success('Department added successfully!');
      reset();
      onDepartmentAdded();
    } catch (error) {
      console.error('Error adding department:', error);
      toast.error('Failed to add department');
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
    <div className="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
      <div className="mx-4 w-full max-w-md rounded-lg shadow-xl bg-base-100">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex justify-center items-center mr-3 w-10 h-10 rounded-full bg-primary/10">
              <FaBuilding className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Add New Department</h3>
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
            {/* Department Name */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Department Name
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter department name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="mt-1 text-xs text-error">{errors.name.message}</p>
              )}
            </div>

            {/* Department Head */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Department Head
              </label>
              <input
                type="text"
                {...register('head')}
                className={`input input-bordered w-full ${errors.head ? 'input-error' : ''}`}
                placeholder="Enter department head name"
                disabled={isLoading}
              />
              {errors.head && (
                <p className="mt-1 text-xs text-error">{errors.head.message}</p>
              )}
            </div>

            {/* Number of Beds */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Number of Beds
              </label>
              <input
                type="number"
                {...register('beds', { valueAsNumber: true })}
                className={`input input-bordered w-full ${errors.beds ? 'input-error' : ''}`}
                placeholder="Enter number of beds"
                min="1"
                max="1000"
                disabled={isLoading}
              />
              {errors.beds && (
                <p className="mt-1 text-xs text-error">{errors.beds.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content/70">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className={`textarea textarea-bordered w-full ${errors.description ? 'textarea-error' : ''}`}
                placeholder="Enter department description"
                disabled={isLoading}
              />
              {errors.description && (
                <p className="mt-1 text-xs text-error">{errors.description.message}</p>
              )}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end pt-4 mt-6 space-x-3 border-t border-base-300">
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
                'Add Department'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDepartmentModal;
