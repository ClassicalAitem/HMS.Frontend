import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaUserPlus, FaEye, FaEyeSlash, FaPlus } from 'react-icons/fa';
import { usersAPI } from '../../../services/api/usersAPI';
import toast from 'react-hot-toast';
import { createMedicalRecord } from '@/services/api/medicalRecordAPI';

// Validation schema
const addComplaintSchema = yup.object({
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

const AddComplaintModal = ({ isOpen, onClose, onMedicalRecordAdded }) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(addComplaintSchema),
    defaultValues: {
      name: '',
      category: ''
    },
  });


  const onSubmit = async (data) => {
    console.log('📝 AddComplaintModal: Form submitted with data:', data);
    setIsLoading(true);

    try {
      // Fetch data from the API
    const response = await createMedicalRecord(data);
    console.log('Medical record added:', response.data);
    toast.success('Medical record added successfully!');
    reset();
    onMedicalRecordAdded();
    } catch (error) {
      
      // Show error message
      const errorMessage = error.response?.data?.message || 'Failed to create complaint. Please try again.';
      console.error('❌ AddUserModal: Error creating user:', error);
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

  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/70">
      <div className="mx-4 w-full max-w-md shadow-xl 2xl:max-w-lg card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-col gap-2 items-start">
              
              <h2 className="text-xl font-normal text-primary">Add New Medical Data</h2>
              <p className="text-sm text-base-content/70">Create a new medical data for medical procedures or consultations.</p>
            </div>
            <button
              onClick={handleClose}
              disabled={isLoading}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Complaint Name */}
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
            {/* Complaint Category */}
            <div className="form-control">
              <label className="label">
                <span className="font-medium label-text text-base-content"> Category</span>
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


            {/* Action Buttons */}
            <div className="flex gap-3 mt-6">
              
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn btn-primary"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating...
                  </>
                ) : (
                  <>
                    <FaPlus className="w-4 h-4 mr-2" />
                    Create Medical Data
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

export default AddComplaintModal;



