/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { EditPatientModal } from '@/components/modals';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { LuPencilLine } from 'react-icons/lu';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import toast from 'react-hot-toast';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [paymentHistoryExpanded, setPaymentHistoryExpanded] = useState(false);

  // Fetch patient data from backend
  useEffect(() => {
    if (patientId) {
      console.log('🔄 PatientDetails: Fetching patient by ID:', patientId);
      dispatch(fetchPatientById(patientId));
    }
  }, [patientId, dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPatientsError());
      // Redirect to patients list on error
      navigate('/frontdesk/patients');
    }
  }, [error, dispatch, navigate]);

  // Only redirect on error, not on missing patient (let the component handle it)
  // The component will show "Patient not found" message instead of redirecting

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleEditPatient = (updatedData) => {
    console.log('✅ PatientDetails: Patient updated successfully:', updatedData);
    // The modal already handles the update via Redux
    // We can refresh the patient data here if needed
    if (patientId) {
      dispatch(fetchPatientById(patientId));
    }
    setIsEditModalOpen(false);
  };

  const calculateOutstandingBalance = () => {
    if (!currentPatient) return 0;
    return currentPatient.outstandingBills?.reduce((total, bill) => total + bill.balance, 0) || 0;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Debug logging
  console.log('🔍 PatientDetails: Component render state:', {
    isLoading,
    currentPatient: currentPatient ? 'Present' : 'Missing',
    error,
    patientId
  });

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="mt-4 text-base-content/70">Loading patient details...</p>
        </div>
      </div>
    );
  }

  // Show error state or redirect if no patient
  if (!currentPatient) {
    console.log('❌ PatientDetails: No currentPatient, showing not found message');
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-base-content/70">Patient not found</p>
          <p className="text-sm text-base-content/50 mt-2">Patient ID: {patientId}</p>
          <button 
            onClick={() => navigate('/frontdesk/patients')}
            className="btn btn-primary mt-4"
          >
            Back to Patients
          </button>
        </div>
      </div>
    );
  }

  // Use currentPatient as patient for the rest of the component
  const patient = currentPatient;

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
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-xl font-regular text-base-content/70 2xl:text-2xl">Patient Details</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn btn-ghost btn-sm"
              >
                <LuPencilLine className="w-4 h-4 2xl:w-6 2xl:h-6" />
              </button>
              <button
                onClick={() => navigate('/frontdesk/patients')}
                className="btn btn-ghost btn-sm"
              >
                <IoIosCloseCircleOutline className="w-4 h-4 2xl:w-6 2xl:h-6" />
              </button>
            </div>
          </div>

          {/* Patient Information */}
          <div className="grid grid-cols-1 gap-6">
            {/* Left Column - Patient Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Patient Identification */}
              <div className="shadow-xl card bg-base-100">
                <div className="flex flex-col p-6 card-body">

                  <div className="flex flex-row items-center space-x-4">
                    <div className="ml-4 avatar">
                      <div className="w-20 h-20 rounded-full border-3 border-primary">
                        <div className="flex items-center justify-center w-full h-full bg-primary text-primary-content text-2xl font-bold">
                          {patient.firstName?.[0]}{patient.lastName?.[0]}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-12 justify-around px-8 w-auto 2xl:gap-0 2xl:w-full">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient Name </span>
                        <span className="text-xl font-semibold text-base-content">
                          {patient.firstName} {patient.lastName}
                        </span>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Gender</span>
                        <span className="text-xl font-semibold text-base-content capitalize">{patient.gender}</span>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Phone Number</span>
                        <span className="text-xl font-semibold text-base-content">{patient.phone}</span>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Hospital ID</span>
                        <span className="text-xl font-semibold text-base-content">{patient.hospitalId}</span>
                      </div>

                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
                    <div>
                      <li className="text-sm font-semibold text-base-content">
                        HMO: {patient.hmos?.length > 0 ? `${patient.hmos[0].provider} (${patient.hmos[0].memberId})` : 'None'}
                      </li>
                    </div>

                    <div>
                      <span className="text-sm font-semibold text-base-content">Status</span>
                      <span className="px-12 text-sm font-semibold text-base-100 btn btn-xs bg-primary capitalize">{patient.status}</span>
                    </div>
                  </div>


                </div>
              </div>

              {/* General Info */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">General Info</h3>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-regular text-base-content/70 text-md">Address</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.address || 'Not provided'}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Middle Name</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.middleName || 'Not provided'}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Date of Birth</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not provided'}
                      </span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Email</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.email || 'Not provided'}</span>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Created</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}
                      </span>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Last Updated</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'Not available'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">Additional Info</h3>
                  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="font-regular text-base-content/70 text-md">Next of kin</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.nextOfKin?.name || 'Not provided'}
                      </span>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">Relationship</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.nextOfKin?.relationship || 'Not provided'}
                      </span>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">Phone number</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.nextOfKin?.phone || 'Not provided'}
                      </span>
                    </div>

                    <div className="md:col-span-3">
                      <p className="font-regular text-base-content/70 text-md">Address</p>
                      <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                        {patient.nextOfKin?.address || 'Not provided'}
                      </span>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* HMO & Dependants Info */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary">HMO & Dependants Information</h3>
                  <div className="flex justify-around 2xl:justify-start">
                     <div className="space-y-3 2xl:pl-12">
                       <div>
                         <li className="text-sm text-base-content/70">
                           <span className="font-medium">HMO Plans:</span> {patient.hmos?.length > 0 ? patient.hmos.map(hmo => `${hmo.provider} (${hmo.memberId})`).join(', ') : "No HMO plans"}
                         </li>
                       </div>
                       <div>
                         <li className="text-sm text-base-content/70">
                           <span className="font-medium">Dependants:</span> {patient.dependants?.length > 0 ? `${patient.dependants.length} dependant(s)` : "No dependants"}
                         </li>
                       </div>
                       {patient.dependants?.length > 0 && (
                         <div className="ml-4">
                           {patient.dependants.map((dep, index) => (
                             <li key={index} className="text-sm text-base-content/70">
                               • {dep.firstName} {dep.lastName} ({dep.relationshipType}) - {dep.gender}
                             </li>
                           ))}
                         </div>
                       )}
                     </div>

                    {/* Right Column - Appointments */}
                    <div className="">
                      {/* Appointments */}
                      <div className="shadow-xl card">
                        <div className="py-0 card-body">
                          <div className="flex items-center mb-4 space-x-2">
                            <div className="w-3 h-3 rounded-full bg-primary"></div>
                            <h3 className="text-lg font-semibold text-base-content">Appointments</h3>
                          </div>
                          
                           <div className="space-y-4">
                             <div>
                               <h4 className="font-medium text-base-content">Upcoming Appointment:</h4>
                               <p className="text-sm text-base-content/70">
                                 No upcoming appointment
                               </p>
                             </div>
                             <div>
                               <h4 className="font-medium text-base-content">Last Appointment:</h4>
                               <p className="text-sm text-base-content/70">
                                 No previous appointment
                               </p>
                             </div>
                             <div>
                               <h4 className="font-medium text-base-content">Registration Date:</h4>
                               <p className="text-sm text-base-content/70">
                                 {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}
                               </p>
                             </div>
                           </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            
          </div>

            {/* Additional Information */}
            <div className="mt-6 shadow-xl card bg-base-100">
              <div className="p-6 card-body">
                <h3 className="mb-4 text-lg font-medium text-primary">Additional Information</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-base-content/70">Patient ID</p>
                    <p className="font-medium">{patient.id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Hospital ID</p>
                    <p className="font-medium">{patient.hospitalId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Status</p>
                    <p className="font-medium capitalize">{patient.status}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Last Updated</p>
                    <p className="font-medium">
                      {patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : 'Not available'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

          {/* Action Buttons */}
          <div className="flex justify-center mt-6 space-x-4">
            <button className="btn btn-outline">
              Send to Cashier
            </button>
            <button className="btn btn-primary">
              Send to Nurse
            </button>
          </div>
        </div>
      </div>

      {/* Edit Patient Modal */}
      <EditPatientModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        patient={patient}
        onSave={handleEditPatient}
      />
    </div>
  );
};

export default PatientDetails;
