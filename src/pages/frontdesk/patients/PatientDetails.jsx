/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/frontdesk/dashboard';
import { EditPatientModal, AddHmoModal, EditHmoModal, AddDependantModal, EditDependantModal, NurseActionModal, CashierActionModal } from '@/components/modals';
import SendToHmoModal from '@/components/modals/SendToHmoModal';
import PharmacyActionModal from '@/components/modals/PharmacyActionModal';
import LabActionModal from '@/components/modals/labActionModal';
import DoctorActionModal from '@/components/modals/doctorActionModal';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import CreateBillModal from '@/components/modals/CreateBillModal';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
// Icons and utilities now handled within extracted components
import PatientPageHeader from '@/components/frontdesk/patients/PatientPageHeader';
import PatientIdentificationCard from '@/components/frontdesk/patients/PatientIdentificationCard';
import GeneralInfoCard from '@/components/frontdesk/patients/GeneralInfoCard';
import AdditionalInfoCard from '@/components/frontdesk/patients/AdditionalInfoCard';
import HmoDependantsSection  from '@/components/frontdesk/patients/HmoDependantsSection';
import AdditionalInformationCard from '@/components/frontdesk/patients/AdditionalInformationCard';
import ActionButtons from '@/components/frontdesk/patients/ActionButtons';
import SendPatientModal from '@/components/modals/SendPatientModal';
import PatientDetailsCard from '@/components/common/PatientDetailsCard';
import KolakLoader from '@/components/common/KolakLoader';

const PatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddHmoOpen, setIsAddHmoOpen] = useState(false);
  const [hmoTargetDependantId, setHmoTargetDependantId] = useState(null);
  const [isEditHmoOpen, setIsEditHmoOpen] = useState(false);
  const [isAddDependantOpen, setIsAddDependantOpen] = useState(false);
  const [isEditDependantOpen, setIsEditDependantOpen] = useState(false);
  const [isSendToCashierOpen, setIsSendToCashierOpen] = useState(false);
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [isSendToHmoOpen, setIsSendToHmoOpen] = useState(false);
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;



    // Prefer snapshot passed from Incoming; fallback to store
    const snapshot = location?.state?.patientSnapshot || null;
    const patient = currentPatient || snapshot || null;
  
     const filterSubjectRecords = (items) => {
      if (!Array.isArray(items)) return [];
      return items.filter((item) => (
        isViewingDependant && dependantId ? item?.dependantId === dependantId : !item?.dependantId
      ));
    };
  
    const [subject, setSubject] = useState(null);
    const [subjectLoading, setSubjectLoading] = useState(true);
  
    useEffect(() => {
      let mounted = true;
      const loadSubject = async () => {
        try {
          setSubjectLoading(true);
          if (isViewingDependant && dependantId) {
            try {
              const res = await getDependantById(dependantId);
              const dep = res?.data?.data?.dependant || res?.data?.dependant || dependantSnapshot;
              if (mounted) setSubject(dep || dependantSnapshot);
            } catch {
              if (mounted) setSubject(dependantSnapshot);
            }
          } else {
            if (mounted) setSubject(patient);
          }
        } finally {
          if (mounted) setSubjectLoading(false);
        }
      };
      loadSubject();
      return () => { mounted = false; };
    }, [isViewingDependant, dependantId, dependantSnapshot, patient]);
  
     const summarySubject = useMemo(() => {
      const guardian = patient || {};
  
      if (!isViewingDependant) {
        return {
          id: guardian.id,
          fullName: `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || guardian.name || 'Unknown',
          gender: guardian.gender,
          phone: guardian.phone || guardian.phoneNumber,
          hospitalId: guardian.hospitalId,
          status: guardian.status,
          hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
          relationshipType: null,
        };
      }
  
      const dep = subject || dependantSnapshot || {};
  
      // Dependants don't carry their own hmos — pull them out of the guardian's list
      const ownHmos = Array.isArray(guardian.hmos)
        ? guardian.hmos.filter(h => h.dependantId === (dep.id || dependantId))
        : [];
  
      return {
        id: dep.id || dependantId,
        fullName: `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || 'Dependant',
        gender: dep.gender || '—',
        // Dependants don't carry their own phone in this schema — fall back to guardian's
        phone: dep.phone || guardian.phone || guardian.phoneNumber,
        // Hospital ID always belongs to the parent/guardian patient record
        hospitalId: guardian.hospitalId,
        status: dep.status || dependantSnapshot?.status || 'Unknown',
        hmos: ownHmos,
        relationshipType: dep.relationshipType || dependantSnapshot?.relationshipType,
      };
    }, [isViewingDependant, subject, dependantSnapshot, patient, dependantId]);
  

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


  return (
    <div className="flex h-screen">
            {isLoading && <KolakLoader fullscreen />}

      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-opacity-50 lg:hidden"
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
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-4 lg:p-6">
          {/* Page Header */}
          <PatientPageHeader onEdit={() => setIsEditModalOpen(true)} onClose={() => navigate('/frontdesk/patients')} />

          {/* Patient Information */}
          <div className="space-y-6">
            <div className="space-y-6">
              {/* Patient Identification */}
              {/* <PatientIdentificationCard patient={patient} isTransitionLoading={isTransitionLoading} /> */}
              <PatientDetailsCard
                      patient={patient}
                      summarySubject={summarySubject}
                      isViewingDependant={isViewingDependant}
                    />
              

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
                <SendPatientModal
                  patientId={patient?.id || patientId}
                  patient={patient}
                  onUpdated={() => navigate('/frontdesk/dashboard')}
                  allowedRoles={['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'cashier', 'hmo']}
                />
              </div>

              {/* General Info */}
              <GeneralInfoCard patient={patient} isTransitionLoading={isTransitionLoading} />

              {/* Additional Info */}
              <AdditionalInfoCard patient={patient} isTransitionLoading={isTransitionLoading} />

              {/* HMO & Dependants Info */}
              <HmoDependantsSection
                patient={patient}
                isTransitionLoading={isTransitionLoading}
                onAddHmo={() => {
                  setHmoTargetDependantId(null); // patient-level HMO
                  setIsAddHmoOpen(true);
                }}
                onEditHmo={() => setIsEditHmoOpen(true)}
                onAddDependant={() => setIsAddDependantOpen(true)}
                onEditDependant={() => setIsEditDependantOpen(true)}
                onAddHmoForDependant={(dep) => {
                  setHmoTargetDependantId(dep.id);
                  setIsAddHmoOpen(true);
                }}
              />
            </div>

            {/* Additional Information */}
            <AdditionalInformationCard patient={patient} isLoading={isLoading} />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {/* Action Buttons */}
              <ActionButtons
                onSendToCashier={() => setIsCreateBillOpen(true)}
                onSendToHmo={() => setIsSendToHmoOpen(true)}
              />
            </div>
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
        onClose={() => {
          setIsAddHmoOpen(false);
          setHmoTargetDependantId(null);
        }}
        patient={patient}
        dependantId={hmoTargetDependantId}
        onSuccess={() => {
          if (patientId) {
            dispatch(fetchPatientById(patientId));
          }
          setIsAddHmoOpen(false);
          setHmoTargetDependantId(null);
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
      {/* <NurseActionModal
        isOpen={isSendToNurseOpen}
        onClose={() => setIsSendToNurseOpen(false)}
        patientId={patient?.id || patientId}
        currentStatus={patient?.status || ''}
        defaultAction={PATIENT_STATUS.AWAITING_VITALS}
        onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
      /> */}

      {/* Send to Cashier Modal (Status Update) - Triggered AFTER Bill Creation */}
      <CashierActionModal
        isOpen={isSendToCashierOpen}
        onClose={() => setIsSendToCashierOpen(false)}
        patientId={patient?.id || patientId}
        currentStatus={patient?.status || ''}
        defaultStatus={PATIENT_STATUS.AWAITING_CASHIER}
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
        defaultItems={[]}
        // defaultItems={[{ code: 'registered', description: 'Registration Fee', quantity: 1, price: 5000 }]} // Example default
      />

      {/* Send to HMO Modal */}
      <SendToHmoModal
        isOpen={isSendToHmoOpen}
        onClose={() => setIsSendToHmoOpen(false)}
        patientId={patient?.id || patientId}
        patientName={patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()}
        doctorName="Doctor"
        consultationDate={new Date().toLocaleDateString()}
        visitReason=""
        diagnosis=""
        defaultItems={[]}
        onSentSuccessfully={() => {
          setIsSendToHmoOpen(false);
          patientId && dispatch(fetchPatientById(patientId));
        }}
      />

      {/* Send to Pharmacy Modal */}
      {/* <PharmacyActionModal
        isOpen={isSendToPharmacyOpen}
        onClose={() => setIsSendToPharmacyOpen(false)}
        patientId={patient?.id || patientId}
        currentStatus={patient?.status || ''}
        defaultStatus={PATIENT_STATUS.AWAITING_PHARMACY}
        onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
        itemsCount={0}
        medicationNames={[]}
        patientLabel={patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()}
      /> */}

      {/* Send to Lab Modal */}
      {/* <LabActionModal
        isOpen={isSendToLabOpen}
        onClose={() => setIsSendToLabOpen(false)}
        patientId={patient?.id || patientId}
        currentStatus={patient?.status || ''}
        defaultAction={{ status: PATIENT_STATUS.AWAITING_LAB }}
        onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
      /> */}

      {/* Send to Doctor Modal */}
      {/* <DoctorActionModal
        isOpen={isSendToDoctorOpen}
        onClose={() => setIsSendToDoctorOpen(false)}
        patientId={patient?.id || patientId}
        currentStatus={patient?.status || ''}
        defaultAction={PATIENT_STATUS.AWAITING_CONSULTATION}
        onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
      /> */}
    </div>
  );
};

export default PatientDetails;
