import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';

const addServiceChargeSchema = yup.object({
  name: yup
    .string()
    .required('Service name is required')
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must not exceed 100 characters'),
  category: yup
    .string()
    .required('Category is required'),
  amount: yup
    .number()
    .required('Amount is required')
    .min(1, 'Amount must be at least ₦1')
    .max(10000000, 'Amount must not exceed ₦10,000,000'),
  description: yup
    .string()
    .required('Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(500, 'Description must not exceed 500 characters')
});

const AddServiceChargeModal = ({ isOpen, onClose, onServiceChargeAdded }) => {
  const [isLoading, setIsLoading] = useState(false);

  // Sample categories for dropdown
  const categories = [
    'General',
    'Laboratory',
    'Radiology',
    'Surgical',
    'Emergency',
    'Pharmacy',
    'Therapy',
    'Consultation'
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(addServiceChargeSchema)
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Service charge added:', data);
      toast.success('Service charge added successfully!');
      reset();
      onServiceChargeAdded();
    } catch (error) {
      console.error('Error adding service charge:', error);
      toast.error('Failed to add service charge');
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
              <FaCreditCard className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Add Service Charge</h3>
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
            {/* Service Name */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Service Name
              </label>
              <input
                type="text"
                {...register('name')}
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                placeholder="Enter service name"
                disabled={isLoading}
              />
              {errors.name && (
                <p className="text-error text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Category
              </label>
              <select
                {...register('category')}
                className={`select select-bordered w-full ${errors.category ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="text-error text-xs mt-1">{errors.category.message}</p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Amount (₦)
              </label>
              <input
                type="number"
                {...register('amount', { valueAsNumber: true })}
                className={`input input-bordered w-full ${errors.amount ? 'input-error' : ''}`}
                placeholder="Enter amount"
                min="1"
                max="10000000"
                disabled={isLoading}
              />
              {errors.amount && (
                <p className="text-error text-xs mt-1">{errors.amount.message}</p>
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
                placeholder="Enter service description"
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
                'Add Service Charge'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddServiceChargeModal;
