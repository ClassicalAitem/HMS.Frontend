import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaCreditCard } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { useAppDispatch } from '@/store/hooks';
import { createServiceCharge } from '@/store/slices/serviceChargesSlice';

const addServiceChargeSchema = yup.object({
  service: yup
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
    .max(10000000, 'Amount must not exceed ₦10,000,000'),
  isBillable: yup
    .boolean()
    .default(true)
});

const AddServiceChargeModal = ({ isOpen, onClose, onServiceChargeAdded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [admissionCovered, setAdmissionCovered] = useState([]);
  const [admissionInput, setAdmissionInput] = useState('');
  const [admissionInputError, setAdmissionInputError] = useState('');
  const dispatch = useAppDispatch();

  const categories = [
    'General',
    'Laboratory',
    'Radiology',
    'Surgical',
    'Emergency',
    'Pharmacy',
    'Therapy',
    'Consultation',
    'Admission',
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch: formWatch,
    setValue
  } = useForm({
    resolver: yupResolver(addServiceChargeSchema),
    defaultValues: {
      service: '',
      category: '',
      amount: '',
      isBillable: true
    }
  });

  const isBillable = formWatch('isBillable');
  const watchedCategory = formWatch('category');
  const isAdmission = watchedCategory === 'Admission';

  const handleAddAdmissionItem = () => {
    const trimmed = admissionInput.trim();
    if (!trimmed) {
      setAdmissionInputError('Please enter a value before adding');
      return;
    }
    if (admissionCovered.includes(trimmed)) {
      setAdmissionInputError('This item has already been added');
      return;
    }
    setAdmissionCovered((prev) => [...prev, trimmed]);
    setAdmissionInput('');
    setAdmissionInputError('');
  };

  const handleAdmissionInputKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddAdmissionItem();
    }
  };

  const handleRemoveAdmissionItem = (item) => {
    setAdmissionCovered((prev) => prev.filter((i) => i !== item));
  };

  const onSubmit = async (data) => {
    if (isAdmission && admissionCovered.length === 0) {
      setAdmissionInputError('Please add at least one item covered by this admission');
      return;
    }

    setIsLoading(true);
    try {
      const finalAmount = !data.isBillable ? '0' : data.amount.toString();

      const payload = {
        service: data.service,
        category: data.category,
        amount: finalAmount,
        isBillable: data.isBillable,
        ...(isAdmission && { admissionCovered }),
      };

      await dispatch(createServiceCharge(payload)).unwrap();
      toast.success('Service charge added successfully!');
      reset();
      setAdmissionCovered([]);
      setAdmissionInput('');
      setAdmissionInputError('');
      onServiceChargeAdded();
    } catch (error) {
      console.error('❌ Error adding service charge:', error);
      toast.error(error?.message || 'Failed to add service charge');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setAdmissionCovered([]);
    setAdmissionInput('');
    setAdmissionInputError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-base-300">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 mr-3 rounded-full bg-primary/10">
              <FaCreditCard className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-base-content">Add Service Charge</h3>
          </div>
          <button onClick={handleClose} className="btn btn-ghost btn-sm" disabled={isLoading}>
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

            {/* Admission Covered — only shown when category is Admission */}
            {isAdmission && (
              <div>
                <label className="block text-sm font-medium text-base-content/70 mb-2">
                  Admission Covered <span className="text-error">*</span>
                </label>

                {/* Input row */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={admissionInput}
                    onChange={(e) => {
                      setAdmissionInput(e.target.value);
                      if (admissionInputError) setAdmissionInputError('');
                    }}
                    onKeyDown={handleAdmissionInputKeyDown}
                    placeholder="e.g. Bed fee, Nursing care..."
                    className={`input input-bordered flex-1 ${admissionInputError ? 'input-error' : ''}`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={handleAddAdmissionItem}
                    className="btn btn-primary btn-sm h-12"
                    disabled={isLoading}
                  >
                    Add
                  </button>
                </div>
                <p className="text-xs text-base-content/50 mt-1">Press Enter or click Add</p>
                {admissionInputError && (
                  <p className="text-error text-xs mt-1">{admissionInputError}</p>
                )}

                {/* Added items preview */}
                {admissionCovered.length > 0 && (
                  <div className="mt-3 p-3 rounded-lg border border-base-300 bg-base-200/50">
                    <p className="text-xs font-medium text-base-content/60 mb-2">
                      Added ({admissionCovered.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {admissionCovered.map((item) => (
                        <span
                          key={item}
                          className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() => handleRemoveAdmissionItem(item)}
                            className="ml-1 hover:text-error transition-colors"
                            disabled={isLoading}
                            aria-label={`Remove ${item}`}
                          >
                            <FaTimes className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

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