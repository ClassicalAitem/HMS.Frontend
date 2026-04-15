import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createOpdPatient, getOpdPatientById, updateOpdPatient } from '@/services/api/opdPatientAPI';
import { showErrorToast, showSuccessToast } from '@/utils/errorHandler';
import { FaArrowLeft } from 'react-icons/fa';
import { FrontdeskLayout } from '@/layouts';

const opdPatientSchema = yup.object().shape({
  fullName: yup.string().required('Full name is required').min(2),
  phone: yup.string().required('Phone number is required').matches(/^[0-9+\-() ]+$/, 'Invalid phone number'),
  dob: yup.date().optional().nullable(),
  gender: yup.string().optional().oneOf(['Male', 'Female', 'Other', 'Prefer_not_to_say'], 'Invalid gender value'),
  address: yup.string().optional(),
});

const AddOpdPatient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm({
    resolver: yupResolver(opdPatientSchema),
    defaultValues: { fullName: '', phone: '', dob: '', gender: '', address: '' }
  });

  useEffect(() => {
    if (isEdit && id) {
      const loadPatient = async () => {
        try {
          const patient = await getOpdPatientById(id);
          const patientData = patient?.data ?? patient;
          setValue('fullName', patientData.fullName || '');
          setValue('phone', patientData.phone || '');
          setValue('dob', patientData.dob ? new Date(patientData.dob).toISOString().split('T')[0] : '');
          setValue('gender', patientData.gender || '');
          setValue('address', patientData.address || '');
        } catch (error) {
          showErrorToast('Failed to load patient data');
          navigate('/frontdesk/opd-patients');
        }
      };
      loadPatient();
    }
  }, [isEdit, id, setValue, navigate]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Format dob to YYYY-MM-DD if it's a Date object
      const formattedData = {
        ...data,
        dob: data.dob ? (data.dob instanceof Date ? data.dob.toISOString().split('T')[0] : data.dob) : null,
        address: data.address?.trim() || '.',
      };

      if (isEdit) {
        await updateOpdPatient(id, formattedData);
        showSuccessToast('Patient updated successfully');
        navigate('/frontdesk/opd-patients');
      } else {
        const patientRes = await createOpdPatient(formattedData);
        const newPatient = patientRes?.data?.data ?? patientRes?.data ?? patientRes;
        const newPatientId = newPatient?.id;

        if (!newPatientId) throw new Error('Failed to get patient ID');

        showSuccessToast('Patient registered successfully');
        navigate(`/frontdesk/opd-patients`);
      }
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
          <h1 className="text-2xl font-bold text-base-content">{isEdit ? 'Edit OPD Patient' : 'Register OPD Patient'}</h1>
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
              <label className="label"><span className="label-text font-medium">Date of Birth *</span></label>
              <input type="date" placeholder="Enter date of birth"
                className={`input input-bordered w-full ${errors.dob ? 'input-error' : ''}`}
                {...register('dob')} />
              {errors.dob && <span className="text-error text-sm mt-1">{errors.dob.message}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Gender *</span></label>
              <select
                className={`select select-bordered w-full ${errors.gender ? 'select-error' : ''}`}
                {...register('gender')}
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer_not_to_say">Prefer not to say</option>
              </select>
              {errors.gender && <span className="text-error text-sm mt-1">{errors.gender.message}</span>}
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
          <button type="button" onClick={() => navigate('/frontdesk/opd-patients')} className="btn btn-ghost" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading
              ? <><span className="loading loading-spinner loading-sm"></span> {isEdit ? 'Updating...' : 'Creating...'}</>
              : isEdit ? 'Update Patient' : 'Register Patient'
            }
          </button>
        </div>
      </form>
    </FrontdeskLayout>
  );
};

export default AddOpdPatient;
