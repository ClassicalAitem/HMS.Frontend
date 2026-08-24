/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import CurrentVitalsCard from '@/components/doctor/patient/CurrentVitalsCard';
import { AppointmentDetailsModal } from '@/components/modals';
import { getConsultations } from '@/services/api/consultationAPI';
import { getPrescriptionsForConsultation } from '@/services/api/prescriptionsAPI';
import { getAllAppointments } from '@/services/api/appointmentsAPI';
import {
  getVitalsByPatient,
  getLatestVital,
  normalizeVitalsResponse,
} from '@/services/api/vitalsAPI';
import { formatNigeriaDate, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import { getDependantById } from '@/services/api/dependantAPI';
import ViewPatientModal from '@/components/frontdesk/modal/ViewPatientModal';

const ConsultationDetailModal = ({ consultation, onClose }) => {
  const prescriptions = consultation.prescriptions || [];
  const isDependant = !!consultation.dependantId;
  const subjectName = isDependant
    ? `${consultation.dependant?.firstName || ''} ${consultation.dependant?.lastName || ''}`.trim()
    : `${consultation.patient?.firstName || ''} ${consultation.patient?.lastName || ''}`.trim();
  const doctorName = `${consultation.doctor?.firstName || ''} ${consultation.doctor?.lastName || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-base-100 shadow-xl sm:rounded-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-base-200 bg-base-100 p-4">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`badge badge-sm shrink-0 ${isDependant ? 'badge-secondary' : 'badge-primary'}`}>
              {isDependant ? consultation.dependant?.relationshipType || 'Dependant' : 'Patient'}
            </span>
            {isDependant && <span className="truncate text-sm text-base-content/70">{subjectName}</span>}
          </div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-sm btn-circle">✕</button>
        </div>

        <div className="space-y-5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-base-content/50">
            <span>{consultation.createdAt ? formatNigeriaDateTime(consultation.createdAt) : '—'}</span>
            {consultation.visitReason && <span className="badge badge-ghost badge-xs capitalize">{consultation.visitReason}</span>}
          </div>
          {doctorName && <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">Doctor</h4><p className="text-sm">Dr. {doctorName}</p></div>}
          <div><h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">Diagnosis</h4><p className="text-sm font-medium">{consultation.diagnosis || 'Pending'}</p></div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">Notes</h4>
            <p className="whitespace-pre-wrap break-words text-sm text-base-content/80">{consultation.notes || 'None recorded'}</p>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-base-content/50">Active Prescriptions</h4>
            {prescriptions.length ? (
              <div className="divide-y divide-base-200 overflow-hidden rounded-lg border border-base-200">
                {prescriptions.map((prescription, index) => (
                  <div key={prescription.id || index} className="space-y-2 p-4">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span>Prescription Status:</span>
                      <span className={`badge badge-sm ${prescription.status === 'pending' ? 'badge-warning' : 'badge-success'}`}>{prescription.status || '—'}</span>
                      <span className="text-xs text-base-content/50">Ordered {prescription.createdAt ? formatNigeriaDate(prescription.createdAt) : '—'}</span>
                    </div>
                    {(prescription.medications || []).map((medication, medicationIndex) => (
                      <div key={medication.id || medicationIndex} className="flex flex-col gap-0.5 border-l-2 border-success/40 pl-3">
                        <span className="text-sm font-medium">{medication.drugName}</span>
                        <span className="text-xs text-base-content/60">Dosage: {medication.dosage}</span>
                        <span className="text-xs text-base-content/60">Frequency: {medication.frequency}</span>
                        <span className="text-xs text-base-content/60">Duration: {medication.duration}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-base-content/50">No prescriptions ordered yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const location = useLocation();
  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;
  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [prescriptionsByConsultation, setPrescriptionsByConsultation] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [latestVital, setLatestVital] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(true);



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
      const loadClinicalData = async () => {
        if (!patientId) return;
        setConsultationsLoading(true);
        setAppointmentsLoading(true);
        setVitalsLoading(true);
        const [consultationResult, appointmentResult, vitalResult] = await Promise.allSettled([
          getConsultations({ patientId }),
          getAllAppointments({ patientId }),
          getVitalsByPatient(patientId),
        ]);

        if (!mounted) return;
        if (consultationResult.status === 'fulfilled') {
          const raw = consultationResult.value?.data?.data ?? consultationResult.value?.data ?? consultationResult.value ?? [];
          const list = Array.isArray(raw) ? raw : raw?.consultations ?? [];
          const scoped = list.filter((item) => (isViewingDependant ? item.dependantId === dependantId : !item.dependantId));
          setConsultations([...scoped].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)));
        } else setConsultations([]);
        setConsultationsLoading(false);

        if (appointmentResult.status === 'fulfilled') {
          const raw = appointmentResult.value?.data?.data ?? appointmentResult.value?.data ?? appointmentResult.value ?? [];
          const list = Array.isArray(raw) ? raw : raw?.appointments ?? [];
          const scoped = list.filter((item) => (isViewingDependant ? item.dependantId === dependantId : !item.dependantId));
          setAppointments([...scoped].sort((a, b) => new Date(`${b.appointmentDate || ''} ${b.appointmentTime || ''}`) - new Date(`${a.appointmentDate || ''} ${a.appointmentTime || ''}`)));
        } else setAppointments([]);
        setAppointmentsLoading(false);

        if (vitalResult.status === 'fulfilled') {
          const vitals = normalizeVitalsResponse(vitalResult.value).filter((item) => (isViewingDependant ? item.dependantId === dependantId : !item.dependantId));
          setLatestVital(getLatestVital(vitals));
        } else setLatestVital(null);
        setVitalsLoading(false);
      };
      loadClinicalData();
      return () => { mounted = false; };
    }, [patientId, isViewingDependant, dependantId]);

    useEffect(() => {
      let mounted = true;
      const loadPrescriptions = async () => {
        const results = await Promise.all(consultations.map(async (consultation) => {
          try {
            const response = await getPrescriptionsForConsultation(consultation.id);
            const raw = response?.data ?? response ?? [];
            return [consultation.id, Array.isArray(raw) ? raw : raw && typeof raw === 'object' ? [raw] : []];
          } catch { return [consultation.id, []]; }
        }));
        if (mounted) setPrescriptionsByConsultation(Object.fromEntries(results));
      };
      if (consultations.length) loadPrescriptions();
      else setPrescriptionsByConsultation({});
      return () => { mounted = false; };
    }, [consultations]);
  
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
           
            <PatientDetailsCard
              patient={patient}
              summarySubject={summarySubject}
              isViewingDependant={isViewingDependant}
            />

            <CurrentVitalsCard
              patient={summarySubject}
              latest={latestVital}
              loading={vitalsLoading}
              buttonHidden
            />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
            <SendPatientModal
              patientId={patient?.id || patientId}
              patient={patient}
              onUpdated={() => navigate('/frontdesk/dashboard')}
              allowedRoles={['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'cashier', 'hmo']}
            />
            <ViewPatientModal patientId={patient?.id || patientId} patient={patient} />
          </div>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-base-content">Consultations</h2>
              {consultationsLoading ? (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-28 w-full rounded-lg" />)}
                </div>
              ) : consultations.length === 0 ? (
                <div className="rounded-lg border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50">No consultations found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {consultations.map((consultation) => (
                    <button
                      key={consultation.id}
                      type="button"
                      onClick={() => setSelectedConsultation({ ...consultation, prescriptions: prescriptionsByConsultation[consultation.id] || [] })}
                      className="rounded-lg border border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/50 hover:bg-base-200/60"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className="badge badge-primary badge-sm">Consultation</span>
                        <span className="text-xs text-base-content/40">{consultation.createdAt ? formatNigeriaDate(consultation.createdAt) : '—'}</span>
                      </div>
                      <p className="line-clamp-1 text-sm font-medium">{consultation.diagnosis || 'Pending diagnosis'}</p>
                      {consultation.visitReason && <span className="badge badge-ghost badge-xs mt-2 capitalize">{consultation.visitReason}</span>}
                    </button>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-base-content">Appointments</h2>
              {appointmentsLoading ? (
                <div className="flex justify-center py-8"><span className="loading loading-spinner loading-md" /></div>
              ) : appointments.length === 0 ? (
                <div className="rounded-lg border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50">No appointments found.</div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {appointments.map((appointment) => {
                    const appointmentId = appointment.id || appointment._id || appointment.appointmentId;
                    const status = String(appointment.status || '').toLowerCase();
                    const statusClass = status === 'completed' ? 'badge-primary' : status === 'scheduled' ? 'badge-info' : status === 'cancelled' ? 'badge-error' : 'badge-neutral';
                    return (
                      <button
                        key={appointmentId}
                        type="button"
                        onClick={() => { if (appointmentId) { setSelectedAppointmentId(appointmentId); setIsAppointmentModalOpen(true); } }}
                        className="rounded-lg border border-base-300 bg-base-100 p-4 text-left transition-colors hover:border-primary/50 hover:bg-base-200/60"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className={`badge badge-sm ${statusClass}`}>{appointment.status || 'Unknown'}</span>
                          <span className="text-xs text-base-content/40">{appointment.appointmentDate ? formatNigeriaDate(appointment.appointmentDate) : '—'}{appointment.appointmentTime ? ` · ${appointment.appointmentTime}` : ''}</span>
                        </div>
                        <p className="line-clamp-1 text-sm font-medium">{appointment.procedureName || appointment.appointmentType || 'General appointment'}</p>
                        {appointment.department && <p className="mt-1 text-xs capitalize text-base-content/60">{appointment.department}</p>}
                        {appointment.notes && <p className="mt-1 line-clamp-2 text-xs text-base-content/50">{appointment.notes}</p>}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
              

           

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

   

      {/* Create Bill Modal - Intercepts "Send to Cashier" */}
      <CreateBillModal
        isOpen={isCreateBillOpen}
        onClose={() => setIsCreateBillOpen(false)}
        patientId={patientId}
        dependantId={isViewingDependant ? dependantId : null}
        onSuccess={() => {
          setIsSendToCashierOpen(true);
        }}
        defaultItems={[]}
      />
      {/* Send to HMO Modal */}
      <SendToHmoModal
        isOpen={isSendToHmoOpen}
        onClose={() => setIsSendToHmoOpen(false)}
        patientId={patient?.id || patientId}
        dependantId={isViewingDependant ? dependantId : null}
        patientName={summarySubject?.fullName}
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

      {selectedConsultation && (
        <ConsultationDetailModal
          consultation={selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
        />
      )}

      <AppointmentDetailsModal
        isOpen={isAppointmentModalOpen}
        onClose={() => setIsAppointmentModalOpen(false)}
        appointmentId={selectedAppointmentId}
        onUpdated={(updated) => {
          const updatedId = updated?.id || updated?._id || updated?.appointmentId;
          setAppointments((previous) => previous.map((appointment) => (
            (appointment.id || appointment._id || appointment.appointmentId) === updatedId
              ? { ...appointment, status: updated?.status }
              : appointment
          )));
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
