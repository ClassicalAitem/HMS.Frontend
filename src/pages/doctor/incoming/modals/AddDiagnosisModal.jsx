import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateConsultation } from '@/services/api/consultationAPI';

const diagnosisSchema = yup.object({
  diagnosis: yup.string().required('Diagnosis is required').min(3, 'Diagnosis must be at least 3 characters'),
});

const AddDiagnosisModal = ({ isOpen, onClose, consultationId, onDiagnosisAdded }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(diagnosisSchema),
    defaultValues: {
      diagnosis: '',
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Ensure only diagnosis is sent in the payload
      const payload = { diagnosis: data.diagnosis };
      await updateConsultation(consultationId, payload);
      toast.success('Diagnosis updated successfully!');
      reset();
      onDiagnosisAdded();
      onClose();
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      toast.error(error.response?.data?.message || 'Failed to update diagnosis');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg mx-4 bg-base-100 rounded-xl shadow-2xl overflow-hidden border border-base-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-base-content">Add Diagnosis</h2>
            <button onClick={onClose} className="text-base-content/60 hover:text-base-content transition-colors">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="label-text font-medium text-base-content">Diagnosis</span>
              </label>
              <textarea 
                className={`w-full textarea textarea-bordered h-24 focus:outline-none focus:border-primary bg-base-100 text-base-content ${errors.diagnosis ? 'textarea-error' : ''}`}
                placeholder="Enter diagnosis..."
                {...register('diagnosis')}
              />
              {errors.diagnosis && (
                <span className="text-error text-sm mt-1">{errors.diagnosis.message}</span>
              )}
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-ghost text-base-content"
                onClick={onClose}
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
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <FaPlus className="mr-2" /> Add Diagnosis
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

export default AddDiagnosisModal;