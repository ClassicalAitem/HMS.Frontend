import React, { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaSave, FaTimes, FaHospital, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { getHospitalInfo, updateHospitalInfo } from '@/services/api/settingsAPI';

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
    .required('Phone number is required'),
  emailAddress: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address'),
  emergencyContact: yup
    .string()
    .optional(),
  description: yup
    .string()
    .required('Hospital description is required')
    .min(10, 'Description must be at least 10 characters')
});

const HospitalInfoTab = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(hospitalInfoSchema),
    defaultValues: {
      hospitalName: '',
      hospitalType: '',
      licenseNumber: '',
      address: '',
      phoneNumber: '',
      emailAddress: '',
      emergencyContact: '',
      description: ''
    }
  });

  const currentValues = watch();

  const fetchInfo = useCallback(async () => {
    try {
      setFetching(true);
      setFetchError('');
      const response = await getHospitalInfo();
      const data = response?.data?.data ?? response?.data ?? response;
      if (!data || typeof data !== 'object') {
        throw new Error('Hospital information was not returned by the server.');
      }

      reset({
        hospitalName: data.hospitalName || '',
        hospitalType: data.hospitalType || '',
        licenseNumber: data.licenseNumber || '',
        address: data.address || '',
        phoneNumber: data.phoneNumber || '',
        emailAddress: data.emailAddress || '',
        emergencyContact: data.emergencyContact || '',
        description: data.description || ''
      });
    } catch (err) {
      console.error('Failed to load hospital info:', err);
      setFetchError(getErrorMessage(err, 'Failed to load hospital information.'));
    } finally {
      setFetching(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await updateHospitalInfo(data);
      toast.success('Hospital administrative profile updated & saved to database!');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update hospital information'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    toast.info('Changes reset');
  };

  if (fetching) {
    return (
      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-8 flex flex-col items-center justify-center min-h-[300px]">
        <span className="loading loading-spinner loading-lg text-primary mb-3"></span>
        <p className="text-sm text-base-content/60 font-medium">Loading hospital administrative records...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="bg-base-100 rounded-2xl shadow-sm border border-error/30 p-8 flex flex-col items-center justify-center min-h-[300px] text-center">
        <FaHospital className="w-10 h-10 text-error mb-3" />
        <p className="text-sm text-error font-semibold">Unable to load hospital information</p>
        <p className="text-xs text-base-content/60 mt-1 mb-4">{fetchError}</p>
        <button type="button" onClick={fetchInfo} className="btn btn-primary btn-sm" disabled={fetching}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live Facility Summary Card */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-base-100 rounded-2xl border border-primary/20 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-primary text-primary-content flex items-center justify-center text-3xl font-bold shadow-md shadow-primary/20">
            <FaHospital />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-base-content">{currentValues.hospitalName || 'Hospital Profile'}</h2>
              <span className="badge badge-success badge-sm font-semibold gap-1">
                <FaShieldAlt className="w-2.5 h-2.5" /> Licensed
              </span>
            </div>
            <p className="text-xs text-base-content/70 mt-0.5">{currentValues.hospitalType} • License #{currentValues.licenseNumber || 'N/A'}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-base-content/60 mt-2">
              <span className="flex items-center gap-1"><FaPhoneAlt className="text-primary w-3 h-3" /> {currentValues.phoneNumber}</span>
              <span className="flex items-center gap-1"><FaEnvelope className="text-primary w-3 h-3" /> {currentValues.emailAddress}</span>
              <span className="flex items-center gap-1"><FaMapMarkerAlt className="text-primary w-3 h-3" /> {currentValues.address?.slice(0, 35)}...</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-2 rounded-xl bg-base-100 border border-base-300 text-center">
            <span className="text-[10px] font-semibold tracking-wider uppercase text-base-content/60 block">System Mode</span>
            <span className="text-xs font-bold text-success">Live Production</span>
          </div>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 sm:p-8">
        <div className="flex items-center justify-between border-b border-base-200 pb-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-base-content">Administrative Facility Profile</h3>
            <p className="text-xs text-base-content/60">Update institutional credentials, regulatory permits, and public contact information</p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hospital Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                Hospital / Institution Name
              </label>
              <input
                type="text"
                {...register('hospitalName')}
                className={`input input-bordered w-full rounded-xl ${errors.hospitalName ? 'input-error' : ''}`}
                placeholder="e.g. Kolak Hospital & Specialist Clinics"
              />
              {errors.hospitalName && (
                <p className="text-error text-xs mt-1">{errors.hospitalName.message}</p>
              )}
            </div>

            {/* Hospital Type */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                Facility Classification
              </label>
              <select
                {...register('hospitalType')}
                className={`select select-bordered w-full rounded-xl ${errors.hospitalType ? 'select-error' : ''}`}
              >
                <option value="">Select facility classification</option>
                <option value="General Hospital">General Hospital</option>
                <option value="Specialty Hospital">Specialty Hospital</option>
                <option value="Teaching Hospital">Teaching Hospital</option>
                <option value="Private Specialist Hospital">Private Specialist Hospital</option>
                <option value="Diagnostic & Imaging Centre">Diagnostic & Imaging Centre</option>
                <option value="Tertiary Care Hospital">Tertiary Care Hospital</option>
              </select>
              {errors.hospitalType && (
                <p className="text-error text-xs mt-1">{errors.hospitalType.message}</p>
              )}
            </div>

            {/* License Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                Operational License / Permit ID
              </label>
              <input
                type="text"
                {...register('licenseNumber')}
                className={`input input-bordered w-full rounded-xl ${errors.licenseNumber ? 'input-error' : ''}`}
                placeholder="e.g. HOS-2024-001"
              />
              {errors.licenseNumber && (
                <p className="text-error text-xs mt-1">{errors.licenseNumber.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                Primary Telephone
              </label>
              <input
                type="tel"
                {...register('phoneNumber')}
                className={`input input-bordered w-full rounded-xl ${errors.phoneNumber ? 'input-error' : ''}`}
                placeholder="+234-801-234-5678"
              />
              {errors.phoneNumber && (
                <p className="text-error text-xs mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                Official Email Address
              </label>
              <input
                type="email"
                {...register('emailAddress')}
                className={`input input-bordered w-full rounded-xl ${errors.emailAddress ? 'input-error' : ''}`}
                placeholder="info@kolakhospital.com"
              />
              {errors.emailAddress && (
                <p className="text-error text-xs mt-1">{errors.emailAddress.message}</p>
              )}
            </div>

            {/* Emergency Hotline */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
                Emergency Dispatch Hotline
              </label>
              <input
                type="text"
                {...register('emergencyContact')}
                className="input input-bordered w-full rounded-xl"
                placeholder="+234-800-EMERGENCY"
              />
            </div>
          </div>

          {/* Physical Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
              Physical Street & Premises Address
            </label>
            <textarea
              {...register('address')}
              rows={2}
              className={`textarea textarea-bordered w-full rounded-xl ${errors.address ? 'textarea-error' : ''}`}
              placeholder="123 Medical Center Drive, Victoria Island, Lagos, Nigeria"
            />
            {errors.address && (
              <p className="text-error text-xs mt-1">{errors.address.message}</p>
            )}
          </div>

          {/* Hospital Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-base-content/70 mb-1.5">
              Mission Statement & Facility Overview
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className={`textarea textarea-bordered w-full rounded-xl ${errors.description ? 'textarea-error' : ''}`}
              placeholder="Describe clinical departments, specialized care units, and diagnostic capabilities"
            />
            {errors.description && (
              <p className="text-error text-xs mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-base-200">
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-outline rounded-xl"
              disabled={isLoading}
            >
              <FaTimes className="w-3.5 h-3.5 mr-1.5" />
              Reset
            </button>
            <button
              type="submit"
              className="btn btn-primary rounded-xl px-6 shadow-md shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Saving Changes...
                </>
              ) : (
                <>
                  <FaSave className="w-3.5 h-3.5 mr-1.5" />
                  Save Facility Profile
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalInfoTab;
