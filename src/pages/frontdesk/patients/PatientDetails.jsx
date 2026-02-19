/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { EditPatientModal, AddHmoModal, EditHmoModal, AddDependantModal, EditDependantModal, NurseActionModal, CashierActionModal } from '@/components/modals';
import CreateBillModal from '@/components/modals/CreateBillModal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
// Icons and utilities now handled within extracted components
import PatientPageHeader from '@/components/frontdesk/patients/PatientPageHeader';
import PatientIdentificationCard from '@/components/frontdesk/patients/PatientIdentificationCard';
import GeneralInfoCard from '@/components/frontdesk/patients/GeneralInfoCard';
import AdditionalInfoCard from '@/components/frontdesk/patients/AdditionalInfoCard';
import HmoDependantsSection from '@/components/frontdesk/patients/HmoDependantsSection';
import AdditionalInformationCard from '@/components/frontdesk/patients/AdditionalInformationCard';
import ActionButtons from '@/components/frontdesk/patients/ActionButtons';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddHmoOpen, setIsAddHmoOpen] = useState(false);
  const [isEditHmoOpen, setIsEditHmoOpen] = useState(false);
  const [isAddDependantOpen, setIsAddDependantOpen] = useState(false);
  const [isEditDependantOpen, setIsEditDependantOpen] = useState(false);
  const [isSendToNurseOpen, setIsSendToNurseOpen] = useState(false);
  const [isSendToCashierOpen, setIsSendToCashierOpen] = useState(false);
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);

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

  // Removed unused helpers to keep file lean

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
          <PatientPageHeader onEdit={() => setIsEditModalOpen(true)} onClose={() => navigate('/frontdesk/patients')} />

          {/* Patient Information */}
          <div className="grid grid-cols-1 gap-6">
            {/* Left Column - Patient Info */}
            <div className="space-y-6 lg:col-span-2">
              {/* Patient Identification */}
              <PatientIdentificationCard patient={patient} isTransitionLoading={isTransitionLoading} />

              {/* General Info */}
              <GeneralInfoCard patient={patient} isTransitionLoading={isTransitionLoading} />

              {/* Additional Info */}
              <AdditionalInfoCard patient={patient} isTransitionLoading={isTransitionLoading} />

              {/* HMO & Dependants Info */}
              <HmoDependantsSection
                patient={patient}
                isTransitionLoading={isTransitionLoading}
                onAddHmo={() => setIsAddHmoOpen(true)}
                onEditHmo={() => setIsEditHmoOpen(true)}
                onAddDependant={() => setIsAddDependantOpen(true)}
                onEditDependant={() => setIsEditDependantOpen(true)}
              />
            </div>


          </div>

            {/* Additional Information */}
            <AdditionalInformationCard patient={patient} isLoading={isLoading} />

          {/* Action Buttons */}
          <ActionButtons
            onSendToCashier={() => setIsCreateBillOpen(true)}
            onSendToNurse={() => setIsSendToNurseOpen(true)}
          />
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

      {/* Send to Nurse Modal */}
      <NurseActionModal
        isOpen={isSendToNurseOpen}
        onClose={() => setIsSendToNurseOpen(false)}
        patientId={patient?.id || patientId}
        defaultAction={'awaiting_vitals'}
        onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
      />

      {/* Send to Cashier Modal (Status Update) - Triggered AFTER Bill Creation */}
      <CashierActionModal
        isOpen={isSendToCashierOpen}
        onClose={() => setIsSendToCashierOpen(false)}
        patientId={patient?.id || patientId}
        defaultStatus={'awaiting_cashier'}
        onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
      />

      {/* Create Bill Modal - Intercepts "Send to Cashier" */}
      <CreateBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        patientId={patientId}
        onSuccess={() => {
          // After bill is created, proceed to status update modal
          setIsSendToCashierOpen(true);
        }}
        // defaultItems={[{ code: 'registered', description: 'Registration Fee', quantity: 1, price: 5000 }]} // Example default
      />
    </div>
  );
};

export default PatientDetails;
