import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { createServiceCharge } from '@/store/slices/serviceChargesSlice';
import { updateServiceCharge } from '@/services/api/serviceChargesAPI';

const updateServiceChargeSchema = yup.object({
  service: yup
    .string()
    .min(2, 'Service name must be at least 2 characters')
    .max(100, 'Service name must not exceed 100 characters'),
  category: yup
    .string(),
  amount: yup
    .number()
    .min(1, 'Amount must be at least ₦1')
    .max(10000000, 'Amount must not exceed ₦10,000,000'),
  status: yup
    .string(),
  isBillable: yup
    .boolean()
    .default(true),
});

const EditServiceChargeModal = ({ isOpen, onClose, onServiceChargeUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useAppDispatch();

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
    reset,
    setValue,
    control,
    watch: formWatch,
  } = useForm({
    resolver: yupResolver(updateServiceChargeSchema), defaultValues: {
      service: '',
      category: '',
      amount: '',
      status: 'active',
      isBillable: true,
    }
  });

  const isBillable = formWatch('isBillable');

  useEffect(() => {
    if (onServiceChargeUpdated && isOpen) {
      // Pre-fill form with existing service charge data
      setValue('service', onServiceChargeUpdated.service || '');
      setValue('category', onServiceChargeUpdated.category || '');
      setValue('amount', parseFloat(onServiceChargeUpdated.amount) || '');
      setValue('status', onServiceChargeUpdated.status || 'active');
      setValue('isBillable', onServiceChargeUpdated.isBillable !== false); // default true if undefined
    }
  }, [onServiceChargeUpdated, isOpen, setValue]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // If not billable, set amount to 0
      const finalAmount = !data.isBillable ? '0' : data.amount.toString();
      
      const updateData = {
        service: data.service,
        category: data.category,
        amount: finalAmount,
        status: data.status,
        isBillable: data.isBillable
      };
      
      console.log('Data to be sent for update:', updateData);
      await updateServiceCharge(onServiceChargeUpdated.id, updateData);
      console.log('Service charge updated:', updateData);
      toast.success('Service charge updated successfully!');
      reset();
      onClose();
    } catch (error) {
      console.error('❌ Error updating service charge:', error);
      toast.error('Failed to update service charge');
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
            <h3 className="text-lg font-semibold text-base-content">Edit Service Charge</h3>
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
                {...register('service')}
                className={`input input-bordered w-full ${errors.service ? 'input-error' : ''}`}
                placeholder="Enter service name"
                disabled={isLoading}
              />
              {errors.service && (
                <p className="text-error text-xs mt-1">{errors.service.message}</p>
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

            {/* Billable Checkbox */}
            <div className="flex items-center space-x-3">
              <Controller
                name="isBillable"
                control={control}
                render={({ field }) => (
                  <input
                    type="checkbox"
                    {...field}
                    checked={field.value}
                    onChange={(e) => {
                      field.onChange(e.target.checked);
                      if (!e.target.checked) {
                        setValue('amount', 0);
                      }
                    }}
                    className="checkbox checkbox-primary"
                    disabled={isLoading}
                  />
                )}
              />
              <label className="text-sm font-medium text-base-content/70">
                Billable Service
              </label>
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
                disabled={isLoading || !isBillable}
              />
              {!isBillable && (
                <p className="text-warning text-xs mt-1">Non-billable services have no charge</p>
              )}
              {errors.amount && (
                <p className="text-error text-xs mt-1">{errors.amount.message}</p>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Status
              </label>
              <select
                {...register('status')}
                className={`select select-bordered w-full ${errors.status ? 'select-error' : ''}`}
                disabled={isLoading}
              >
                <option value="active">Active</option>
                <option value="inactive">InActive</option>
              </select>
              {errors.status && (
                <p className="text-error text-xs mt-1">{errors.status.message}</p>
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
                  Updating...
                </>
              ) : (
                'Update Service Charge'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditServiceChargeModal;