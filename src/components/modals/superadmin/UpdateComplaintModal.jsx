import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaSave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateComplaint } from '@/services/api/medicalRecordAPI';

const updateComplaintSchema = yup.object({
  name: yup
    .string()
    .required('Data name is required')
    .min(2, 'Data name must be at least 2 characters')
    .max(50, 'Data name must not exceed 50 characters'),
  category: yup
    .string()
    .required('Category is required')
    .oneOf(['symptoms', 'surgical', 'family', 'social', 'allergic'], 'Please select a valid category'),
});

const UpdateComplaintModal = ({ isOpen, onClose, complaint, onUpdated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(updateComplaintSchema),
    defaultValues: {
      name: complaint?.name || '',
      category: complaint?.category || '',
    },
  });

  React.useEffect(() => {
    reset({
      name: complaint?.name || '',
      category: complaint?.category || '',
    });
  }, [complaint, reset]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await updateComplaint(complaint.id, data);
      toast.success('Complaint updated successfully!');
      onUpdated();
      onClose();
    } catch (error) {
      toast.error(error?.message || 'Failed to update complaint.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/70">
      <div className="mx-4 w-full max-w-md shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-normal text-primary">Update Complaint</h2>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="font-medium label-text text-base-content">Data Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter data name"
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                disabled={isLoading}
                {...register('name')}
              />
              {errors.name && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.name.message}</span>
                </label>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="font-medium label-text text-base-content">Category</span>
              </label>
              <select
                className={`select select-bordered w-full ${errors.category ? 'select-error' : ''}`}
                {...register('category')}
                disabled={isLoading}
              >
                <option value="">Select a category</option>
                <option value="symptoms">Symptoms</option>
                <option value="surgical">Surgical</option>
                <option value="family">Family</option>
                <option value="social">Social</option>
                <option value="allergic">Allergic</option>
              </select>
              {errors.category && (
                <label className="label">
                  <span className="label-text-alt text-error">{errors.category.message}</span>
                </label>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4 mr-2" />
                    Save Changes
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

export default UpdateComplaintModal;
