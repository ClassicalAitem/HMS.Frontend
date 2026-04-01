import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import toast from 'react-hot-toast';
import { createObdPatient, getObdPatientById, updateObdPatient } from '@/services/api/obdPatientAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';

const obdPatientSchema = yup.object().shape({
  fullName: yup.string().required('Full name is required').min(2, 'Full name must be at least 2 characters'),
  phone: yup.string().required('Phone number is required').matches(/^[0-9+\-() ]+$/, 'Invalid phone number'),
  address: yup.string().optional(),
  serviceChargeId: yup.string().required('Please select a lab test')
});

const AddObdPatient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEditing);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [testSearch, setTestSearch] = useState("");
  const [testDropdownOpen, setTestDropdownOpen] = useState(false);
  const testWrapperRef = useRef(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(obdPatientSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      address: '',
      serviceChargeId: ''
    }
  });

  // Load service charges
  useEffect(() => {
    const loadCharges = async () => {
      try {
        const res = await getServiceCharges();
        const data = res?.data ?? res ?? [];
        const labCharges = data.filter(
          (item) => (item.category || '').toLowerCase() === 'laboratory'
        );
        setServiceCharges(labCharges);
      } catch (err) {
        console.error('Failed to load service charges', err);
      }
    };
    loadCharges();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (testWrapperRef.current && !testWrapperRef.current.contains(e.target)) {
        setTestDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Fetch patient data if editing
  useEffect(() => {
    if (isEditing) {
      const fetchPatient = async () => {
        try {
          const response = await getObdPatientById(id);
          const patient = response?.data ?? response;
          reset({
            fullName: patient.fullName || '',
            phone: patient.phone || '',
            address: patient.address || '',
            serviceChargeId: patient.serviceChargeId || ''
          });
        } catch (error) {
          console.error('Failed to fetch OBD patient:', error);
          toast.error('Failed to load OBD patient');
          navigate('/frontdesk/obd-patients');
        } finally {
          setIsFetching(false);
        }
      };
      fetchPatient();
    }
  }, [id, isEditing, reset, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      if (isEditing) {
        await updateObdPatient(id, data);
        toast.success('OBD patient updated successfully');
      } else {
        await createObdPatient(data);
        toast.success('OBD patient added successfully');
      }
      navigate('/frontdesk/obd-patients');
    } catch (error) {
      console.error('Failed to save OBD patient:', error);
      toast.error(error?.response?.data?.message || 'Failed to save OBD patient');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center">
          <div className="loading loading-spinner loading-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">
              {isEditing ? 'Edit OPD Patient' : 'Add New OPD Patient'}
            </h1>
            <p className="text-sm text-base-content/60 2xl:text-base mt-1">
              {isEditing ? 'Update patient information' : 'Register a new patient without hospital card'}
            </p>
          </div>

          {/* Form */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full max-w-2xl shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Full Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Full Name *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter patient's full name"
                      className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`}
                      {...register('fullName')}
                    />
                    {errors.fullName && (
                      <span className="text-error text-sm mt-1">{errors.fullName.message}</span>
                    )}
                  </div>

                  {/* Phone Number */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Phone Number *</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="Enter phone number"
                      className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                      {...register('phone')}
                    />
                    {errors.phone && (
                      <span className="text-error text-sm mt-1">{errors.phone.message}</span>
                    )}
                  </div>

                  {/* Address */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Address</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Enter patient's address"
                      className={`input input-bordered w-full ${errors.address ? 'input-error' : ''}`}
                      {...register('address')}
                    />
                    {errors.address && (
                      <span className="text-error text-sm mt-1">{errors.address.message}</span>
                    )}
                  </div>

                  {/* Lab Test Selection */}
                  <div className="form-control relative" ref={testWrapperRef}>
                    <label className="label">
                      <span className="label-text font-medium">Lab Test *</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Search and select lab test..."
                      className={`input input-bordered w-full ${errors.serviceChargeId ? 'input-error' : ''}`}
                      value={testSearch || (watch('serviceChargeId') ? serviceCharges.find(t => t.id === watch('serviceChargeId'))?.service || '' : '')}
                      onChange={(e) => {
                        setTestSearch(e.target.value);
                        setTestDropdownOpen(true);
                      }}
                      onFocus={() => setTestDropdownOpen(true)}
                      autoComplete="off"
                    />

                    {testDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto z-50">
                        {serviceCharges
                          .filter(
                            (test) =>
                              !testSearch ||
                              test.service?.toLowerCase().includes(testSearch.toLowerCase())
                          )
                          .map((test) => (
                            <div
                              key={test.id}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between text-sm"
                              onClick={() => {
                                setValue('serviceChargeId', test.id);
                                setTestSearch('');
                                setTestDropdownOpen(false);
                              }}
                            >
                              <span>{test.service}</span>
                              <span className="text-xs text-gray-500">
                                ₦{Number(test.amount).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        {serviceCharges.filter(
                          (test) =>
                            !testSearch ||
                            test.service?.toLowerCase().includes(testSearch.toLowerCase())
                        ).length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-400">
                            No lab tests found
                          </div>
                        )}
                      </div>
                    )}

                    {errors.serviceChargeId && (
                      <span className="text-error text-sm mt-1">{errors.serviceChargeId.message}</span>
                    )}
                  </div>

                  {/* Form Actions */}
                  <div className="flex gap-3 justify-end pt-4">
                    <button
                      type="button"
                      onClick={() => navigate('/frontdesk/obd-patients')}
                      className="btn btn-ghost"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
                      disabled={isLoading}
                    >
                      {isEditing ? 'Update Patient' : 'Add Patient'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddObdPatient;
