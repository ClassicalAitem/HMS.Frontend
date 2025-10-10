import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaSave, FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';

const hospitalInfoSchema = yup.object({
  hospitalName: yup
    .string()
    .required('Hospital name is required')
    .min(2, 'Hospital name must be at least 2 characters'),
  hospitalType: yup
    .string()
    .required('Hospital type is required'),
  licenseNumber: yup
    .string()
    .required('License number is required'),
  address: yup
    .string()
    .required('Address is required'),
  phoneNumber: yup
    .string()
    .required('Phone number is required')
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Please enter a valid phone number'),
  emailAddress: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  description: yup
    .string()
    .required('Hospital description is required')
    .min(10, 'Description must be at least 10 characters')
});

const HospitalInfoTab = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(hospitalInfoSchema),
    defaultValues: {
      hospitalName: 'Kolak Hospital',
      hospitalType: 'General Hospital',
      licenseNumber: 'HOS-2024-001',
      address: '123 Medical Center Drive, Lagos, Nigeria',
      phoneNumber: '+234-801-234-5678',
      emailAddress: 'info@kolakhospital.com',
      description: 'Kolak Hospital is a leading healthcare facility providing comprehensive medical services to the community with state-of-the-art equipment and experienced medical professionals.'
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Hospital info updated:', data);
      toast.success('Hospital information updated successfully!');
    } catch (error) {
      console.error('Error updating hospital info:', error);
      toast.error('Failed to update hospital information');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    toast.info('Changes cancelled');
  };

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-base-content mb-6">Hospital Information</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hospital Name */}
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              Hospital Name
            </label>
            <input
              type="text"
              {...register('hospitalName')}
              className={`input input-bordered w-full ${errors.hospitalName ? 'input-error' : ''}`}
              placeholder="Enter hospital name"
            />
            {errors.hospitalName && (
              <p className="text-error text-xs mt-1">{errors.hospitalName.message}</p>
            )}
          </div>

          {/* Hospital Type */}
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              Hospital Type
            </label>
            <select
              {...register('hospitalType')}
              className={`select select-bordered w-full ${errors.hospitalType ? 'select-error' : ''}`}
            >
              <option value="">Select hospital type</option>
              <option value="General Hospital">General Hospital</option>
              <option value="Specialty Hospital">Specialty Hospital</option>
              <option value="Teaching Hospital">Teaching Hospital</option>
              <option value="Private Hospital">Private Hospital</option>
              <option value="Public Hospital">Public Hospital</option>
            </select>
            {errors.hospitalType && (
              <p className="text-error text-xs mt-1">{errors.hospitalType.message}</p>
            )}
          </div>

          {/* License Number */}
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              License Number
            </label>
            <input
              type="text"
              {...register('licenseNumber')}
              className={`input input-bordered w-full ${errors.licenseNumber ? 'input-error' : ''}`}
              placeholder="Enter license number"
            />
            {errors.licenseNumber && (
              <p className="text-error text-xs mt-1">{errors.licenseNumber.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-base-content/70 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              {...register('phoneNumber')}
              className={`input input-bordered w-full ${errors.phoneNumber ? 'input-error' : ''}`}
              placeholder="Enter phone number"
            />
            {errors.phoneNumber && (
              <p className="text-error text-xs mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Address
          </label>
          <textarea
            {...register('address')}
            rows={3}
            className={`textarea textarea-bordered w-full ${errors.address ? 'textarea-error' : ''}`}
            placeholder="Enter hospital address"
          />
          {errors.address && (
            <p className="text-error text-xs mt-1">{errors.address.message}</p>
          )}
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Email Address
          </label>
          <input
            type="email"
            {...register('emailAddress')}
            className={`input input-bordered w-full ${errors.emailAddress ? 'input-error' : ''}`}
            placeholder="Enter email address"
          />
          {errors.emailAddress && (
            <p className="text-error text-xs mt-1">{errors.emailAddress.message}</p>
          )}
        </div>

        {/* Hospital Description */}
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Hospital Description
          </label>
          <textarea
            {...register('description')}
            rows={4}
            className={`textarea textarea-bordered w-full ${errors.description ? 'textarea-error' : ''}`}
            placeholder="Enter hospital description"
          />
          {errors.description && (
            <p className="text-error text-xs mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-base-300">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-outline"
            disabled={isLoading}
          >
            <FaTimes className="w-4 h-4 mr-2" />
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
  );
};

export default HospitalInfoTab;
