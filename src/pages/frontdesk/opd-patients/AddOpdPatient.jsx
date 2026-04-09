import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createOpdPatient } from '@/services/api/opdPatientAPI';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler';
import { FaArrowLeft } from 'react-icons/fa';
import { FrontdeskLayout } from '@/layouts';

const opdPatientSchema = yup.object().shape({
  fullName: yup.string().required('Full name is required').min(2),
  phone: yup.string().required('Phone number is required').matches(/^[0-9+\-() ]+$/, 'Invalid phone number'),
  address: yup.string().optional(),
});

const AddOpdPatient = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(opdPatientSchema),
    defaultValues: { fullName: '', phone: '', address: '' }
  });




  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const patientRes = await createOpdPatient({
        ...data,
        address: data.address?.trim() || '.',

      });
      const newPatient = patientRes?.data?.data ?? patientRes?.data ?? patientRes;
      const newPatientId = newPatient?.id;

      if (!newPatientId) throw new Error('Failed to get patient ID');

      showSuccessToast('Patient registered successfully');
      navigate(`/frontdesk/opd-patients`);
    } catch (error) {
      showErrorToast(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FrontdeskLayout>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/frontdesk/opd-patients')} className="btn btn-ghost btn-sm">
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-base-content">Register OPD Patient</h1>
            </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-lg">Patient Information</h2>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Full Name *</span></label>
              <input type="text" placeholder="Enter full name"
                className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`}
                {...register('fullName')} />
              {errors.fullName && <span className="text-error text-sm mt-1">{errors.fullName.message}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Phone Number *</span></label>
              <input type="tel" placeholder="Enter phone number"
                className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                {...register('phone')} />
              {errors.phone && <span className="text-error text-sm mt-1">{errors.phone.message}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Address (optional)</span></label>
              <input type="text" placeholder="Enter address"
                className="input input-bordered w-full"
                {...register('address')} />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/cashier/opd-patients')} className="btn btn-ghost" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading
              ? <><span className="loading loading-spinner loading-sm"></span> Creating...</>
              : 'Register Patient'
            }
          </button>
        </div>
      </form>
    </FrontdeskLayout>
  );
};

export default AddOpdPatient;
