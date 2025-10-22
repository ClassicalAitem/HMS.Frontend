/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { EditPatientModal, AddHmoModal, EditHmoModal, AddDependantModal, EditDependantModal } from '@/components/modals';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import { FaChevronUp, FaChevronDown } from 'react-icons/fa';
import { LuPencilLine } from 'react-icons/lu';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import toast from 'react-hot-toast';
import { Skeleton } from '@heroui/skeleton';
import { IoAddCircleOutline } from 'react-icons/io5';
import { MdEditNote } from 'react-icons/md';
import { RiUserAddLine } from 'react-icons/ri';
import { CiEdit } from 'react-icons/ci';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [paymentHistoryExpanded, setPaymentHistoryExpanded] = useState(false);
  const [isAddHmoOpen, setIsAddHmoOpen] = useState(false);
  const [isEditHmoOpen, setIsEditHmoOpen] = useState(false);
  const [isAddDependantOpen, setIsAddDependantOpen] = useState(false);
  const [isEditDependantOpen, setIsEditDependantOpen] = useState(false);

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

  const isTransitionLoading = isLoading || (currentPatient && String(currentPatient.id) !== String(patientId));

  // Loading handled via Skeleton overlays; do not early return.

  // Show error state or redirect if no patient (only when not loading)
  if (!currentPatient && !isTransitionLoading) {
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
  const patient = (!isTransitionLoading && currentPatient) ? currentPatient : {};

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
                      <div className="w-20 h-20 rounded-full border-3 border-primary/80 flex items-center justify-center overflow-hidden p-[2px]">
                          <Skeleton isLoaded={!isTransitionLoading} className="w-full h-full rounded-full flex items-center justify-center bg-primary">
                            <div className="w-full h-full grid place-items-center bg-primary text-primary-content text-2xl font-bold">
                              {getInitials(patient.firstName, patient.lastName)}
                            </div>
                          </Skeleton>
                      </div>
                    </div>

                    <div className="flex gap-12 justify-around px-8 w-auto 2xl:gap-0 2xl:w-full">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient Name </span>
                        <Skeleton isLoaded={!isTransitionLoading}>
                          <span className="text-xl font-semibold text-base-content">
                            {(patient.firstName || '')} {(patient.lastName || '')}
                          </span>
                        </Skeleton>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Gender</span>
                        <Skeleton isLoaded={!isTransitionLoading}>
                          <span className="text-xl font-semibold text-base-content capitalize">{patient.gender || ''}</span>
                        </Skeleton>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Phone Number</span>
                        <Skeleton isLoaded={!isTransitionLoading}>
                          <span className="text-xl font-semibold text-base-content">{patient.phone || ''}</span>
                        </Skeleton>
                      </div>

                      <div className="w-[1px] h-auto bg-base-content/70"></div>

                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Hospital ID</span>
                        <Skeleton isLoaded={!isTransitionLoading}>
                          <span className="text-xl font-semibold text-base-content">{patient.hospitalId || ''}</span>
                        </Skeleton>
                      </div>

                    </div>
                  </div>

                  <div className="flex justify-between items-center px-4 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
                    <div>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <li className="text-sm font-semibold text-base-content">
                          HMO: {patient.hmos?.length > 0 ? `${patient.hmos[0]?.provider || ''} (${patient.hmos[0]?.memberId || ''})` : 'None'}
                        </li>
                      </Skeleton>
                    </div>

                    <div className="flex justify-center items-center gap-1">
                      <span className="text-sm font-semibold text-base-content">Status</span>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="px-12 text-sm font-semibold text-base-100 btn btn-xs bg-primary capitalize">{patient.status || ''}</span>
                      </Skeleton>
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
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.address || 'Not provided'}</span>
                      </Skeleton>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Middle Name</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.middleName || 'Not provided'}</span>
                      </Skeleton>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Date of Birth</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not provided'}
                        </span>
                      </Skeleton>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Email</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.email || 'Not provided'}</span>
                      </Skeleton>
                    </div>

                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Created</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}
                        </span>
                      </Skeleton>
                    </div>
                    
                    <div className="flex flex-col space-y-1">
                      <p className="font-regular text-base-content/70 text-md">Last Updated</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'Not available'}
                        </span>
                      </Skeleton>
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
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.nextOfKin?.name || 'Not provided'}
                        </span>
                      </Skeleton>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">Relationship</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.nextOfKin?.relationship || 'Not provided'}
                        </span>
                      </Skeleton>
                    </div>

                    <div>
                      <p className="font-regular text-base-content/70 text-md">Phone number</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.nextOfKin?.phone || 'Not provided'}
                        </span>
                      </Skeleton>
                    </div>

                    <div className="md:col-span-3">
                      <p className="font-regular text-base-content/70 text-md">Address</p>
                      <Skeleton isLoaded={!isTransitionLoading}>
                        <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
                          {patient.nextOfKin?.address || 'Not provided'}
                        </span>
                      </Skeleton>
                    </div>
                    
                  </div>
                </div>
              </div>

              {/* HMO & Dependants Info */}
              <div className="shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <h3 className="mb-4 text-lg font-medium text-primary flex items-center justify-between">
                    HMO & Dependants Information 
                    <span className='flex items-center gap-2'>
                      {/* HMO ICONS */}
                        <label className="label text-base-content text-sm">HMO</label>
                        {/* Add Icons*/}
                        <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Add HMO Plan">
                          <IoAddCircleOutline className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={() => setIsAddHmoOpen(true)}/>
                        </div>
                        {/*Edit Icons*/}
                        <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Edit HMO Plan">
                          <MdEditNote className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={() => setIsEditHmoOpen(true)}/>
                        </div>

                        <div>
                          <label className="label text-base-content text-sm">: | :</label>
                        </div>

                      {/* Dependants ICONS */}
                        {/* Add Dependant */}
                        <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Add Dependant">
                          <RiUserAddLine className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={() => setIsAddDependantOpen(true)}/>
                        </div>
                        {/* Edit Dependant */}
                        <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Edit Dependant">
                          <CiEdit className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={() => setIsEditDependantOpen(true)}/>
                        </div>
                        <label className="label text-base-content text-sm">Dependants</label>
                    </span>
                  </h3>
                  <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
                     {/* Left Column - HMO & Dependants */}
                     <div className="space-y-6 w-full lg:w-7/12 2xl:pl-12">
                       {/* HMO Plans */}
                       <div>
                         <Skeleton isLoaded={!isTransitionLoading}>
                           <div className="mb-2 text-sm text-base-content/70">
                             <span className="font-medium">HMO Plans:</span> {patient.hmos?.length > 0 ? `${patient.hmos.length} plan(s)` : "No HMO plans"}
                           </div>
                           {patient.hmos?.length > 0 && (
                             <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                               {patient.hmos.map((hmo, index) => (
                                 <div key={index} className="p-4 rounded-lg border border-base-300">
                                   <div className="text-sm font-semibold text-primary">
                                     {hmo.planName || hmo.plan || hmo.planType || 'Unknown Plan'}
                                   </div>
                                   <div className="mt-2 space-y-1">
                                     <div className="text-xs text-base-content/70">
                                       <span className="font-medium">Provider:</span> {hmo.provider || '—'}
                                     </div>
                                     <div className="text-xs text-base-content/70">
                                       <span className="font-medium">Member ID:</span> {hmo.memberId || '—'}
                                     </div>
                                     <div className="text-xs text-base-content/70">
                                       <span className="font-medium">Expires:</span> {hmo.expirationDate ? new Date(hmo.expirationDate).toLocaleDateString('en-US') : '—'}
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           )}
                         </Skeleton>
                       </div>

                       {/* Dependants */}
                       <div>
                         <Skeleton isLoaded={!isTransitionLoading}>
                           <div className="mb-2 text-sm text-base-content/70">
                             <span className="font-medium">Dependants:</span> {patient.dependants?.length > 0 ? `${patient.dependants.length} dependant(s)` : "No dependants"}
                           </div>
                         </Skeleton>
                         {patient.dependants?.length > 0 && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                             {patient.dependants.map((dep, index) => {
                               const middleInitial = dep.middleName ? ` ${dep.middleName.charAt(0)}.` : '';
                               const fullName = `${dep.lastName || ''}, ${dep.firstName || ''}${middleInitial}`.trim();
                               const dobFormatted = dep.dob ? new Date(dep.dob).toLocaleDateString('en-US') : '—';
                               const relationship = dep.relationshipType || dep.relationship || '—';
                               const statusText = dep.status || 'Unknown';
                               const statusColor = dep.status === 'Active' ? 'bg-green-500' : dep.status === 'Inactive' ? 'bg-gray-400' : dep.status === 'Pending' ? 'bg-yellow-500' : 'bg-base-300';
                               return (
                                 <Skeleton key={index} isLoaded={!isTransitionLoading}>
                                   <div className="p-4 rounded-lg border border-base-300">
                                     <div className="text-sm font-semibold text-primary">{fullName}</div>
                                     <div className="mt-2 grid grid-cols-2 gap-y-1 gap-x-3">
                                       <div className="text-xs text-base-content/70"><span className="font-medium">DOB:</span> {dobFormatted}</div>
                                       <div className="text-xs text-base-content/70"><span className="font-medium">Gender:</span> {dep.gender || '—'}</div>
                                       <div className="text-xs text-base-content/70"><span className="font-medium">Relationship:</span> {relationship}</div>
                                       <div className="text-xs text-base-content/70 flex items-center">
                                         <span className="font-medium mr-2">Status:</span>
                                         <span className={`w-2 h-2 rounded-full mr-2 ${statusColor}`}></span>
                                         <span>{statusText}</span>
                                       </div>
                                     </div>
                                   </div>
                                 </Skeleton>
                               );
                             })}
                           </div>
                         )}
                       </div>
                     </div>

                    {/* Right Column - Appointments */}
                    <div className="w-full lg:w-5/12">
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
                               <Skeleton isLoaded={!isTransitionLoading}>
                                 <p className="text-sm text-base-content/70">
                                   No upcoming appointment
                                 </p>
                               </Skeleton>
                             </div>
                             <div>
                               <h4 className="font-medium text-base-content">Last Appointment:</h4>
                               <Skeleton isLoaded={!isTransitionLoading}>
                                 <p className="text-sm text-base-content/70">
                                   No previous appointment
                                 </p>
                               </Skeleton>
                             </div>
                             <div>
                               <h4 className="font-medium text-base-content">Registration Date:</h4>
                               <Skeleton isLoaded={!isTransitionLoading}>
                                 <p className="text-sm text-base-content/70">
                                   {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}
                                 </p>
                               </Skeleton>
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
                    <Skeleton isLoaded={!isLoading}>
                      <p className="font-medium">{patient.id || ''}</p>
                    </Skeleton>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Hospital ID</p>
                    <Skeleton isLoaded={!isLoading}>
                      <p className="font-medium">{patient.hospitalId || ''}</p>
                    </Skeleton>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Status</p>
                    <Skeleton isLoaded={!isLoading}>
                      <p className="font-medium capitalize">{patient.status || ''}</p>
                    </Skeleton>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Last Updated</p>
                    <Skeleton isLoaded={!isLoading}>
                      <p className="font-medium">
                        {patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : 'Not available'}
                      </p>
                    </Skeleton>
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
      <AddHmoModal
        isOpen={isAddHmoOpen}
        onClose={() => setIsAddHmoOpen(false)}
        patient={patient}
        onSuccess={() => {
          if (patientId) {
            dispatch(fetchPatientById(patientId));
          }
          setIsAddHmoOpen(false);
        }}
      />
      <EditHmoModal
        isOpen={isEditHmoOpen}
        onClose={() => setIsEditHmoOpen(false)}
        patient={patient}
        onSuccess={() => {
          if (patientId) {
            dispatch(fetchPatientById(patientId));
          }
          setIsEditHmoOpen(false);
        }}
      />
      <AddDependantModal
        isOpen={isAddDependantOpen}
        onClose={() => setIsAddDependantOpen(false)}
        patient={patient}
        onSuccess={() => {
          if (patientId) {
            dispatch(fetchPatientById(patientId));
          }
          setIsAddDependantOpen(false);
        }}
      />
      <EditDependantModal
        isOpen={isEditDependantOpen}
        onClose={() => setIsEditDependantOpen(false)}
        patient={patient}
        onSuccess={() => {
          if (patientId) {
            dispatch(fetchPatientById(patientId));
          }
          setIsEditDependantOpen(false);
        }}
      />
    </div>
  );
};

export default PatientDetails;

// Helper: compute initials from first/last name with fallback
const getInitials = (firstName, lastName) => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (!f && !l) return 'U';
  const firstInitial = f ? f.charAt(0).toUpperCase() : '';
  const lastInitial = l ? l.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}` || 'U';
};
