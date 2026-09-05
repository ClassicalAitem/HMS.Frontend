/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
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
import { getErrorMessage } from '@/utils/errorHandler';
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
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import ViewPatientModal from '@/components/frontdesk/modal/ViewPatientModal';
import { ConsultationDetailModal } from '@/components/modals';
import { FaBed } from 'react-icons/fa';

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
  const [consultationLoading, setConsultationLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [prescriptionsByConsultation, setPrescriptionsByConsultation] = useState({});
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [latestVital, setLatestVital] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(true);
  const [admissions, setAdmissions] = useState([]);
  const [admissionsLoading, setAdmissionsLoading] = useState(true);

  // Prefer snapshot passed from Incoming; fallback to store
  const snapshot = location?.state?.patientSnapshot || null;
  const patient = currentPatient || snapshot || null;

  const [subject, setSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadClinicalData = async () => {
      if (!patientId) return;
      setConsultationsLoading(true);
      setAppointmentsLoading(true);
      setVitalsLoading(true);
      setAdmissionsLoading(true);
      const [consultationResult, appointmentResult, vitalResult, admissionResult] = await Promise.allSettled([
        getConsultations({ patientId }),
        getAllAppointments({ patientId }),
        getVitalsByPatient(patientId),
        getAdmissionByPatientId(patientId, { ...(dependantId ? { dependantId } : {}) }),
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

      if (admissionResult.status === 'fulfilled') {
        const raw = admissionResult.value?.data?.data ?? admissionResult.value?.data ?? admissionResult.value ?? [];
        const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
        const scoped = list.filter((item) => (isViewingDependant ? String(item.dependantId) === String(dependantId) : !item.dependantId));
        setAdmissions([...scoped].sort((a, b) => new Date(b.admittedAt || b.createdAt || 0) - new Date(a.admittedAt || a.createdAt || 0)));
      } else setAdmissions([]);
      setAdmissionsLoading(false);
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
        statusSenderName: guardian.statusSenderName,
        statusUser: guardian.statusUser,
        updatedAt: guardian.updatedAt,
        hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
        relationshipType: null,
      };
    }

    const dep = subject || dependantSnapshot || {};

    const ownHmos = Array.isArray(guardian.hmos)
      ? guardian.hmos.filter(h => h.dependantId === (dep.id || dependantId))
      : [];

    return {
      id: dep.id || dependantId,
      fullName: `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || 'Dependant',
      gender: dep.gender || '—',
      phone: dep.phone || guardian.phone || guardian.phoneNumber,
      hospitalId: guardian.hospitalId,
      status: dep.status || dependantSnapshot?.status || 'Unknown',
      statusSenderName: dep.statusSenderName || dependantSnapshot?.statusSenderName,
      statusUser: dep.statusUser || dependantSnapshot?.statusUser,
      updatedAt: dep.updatedAt || dependantSnapshot?.updatedAt,
      hmos: ownHmos,
      relationshipType: dep.relationshipType || dependantSnapshot?.relationshipType,
    };
  }, [isViewingDependant, subject, dependantSnapshot, patient, dependantId]);

  const displayPatient = useMemo(() => {
    if (!isViewingDependant) return patient;

    const guardian = patient || {};
    const dep = subject || dependantSnapshot || {};

    return {
      ...guardian,
      id: dep.id || dependantId,
      firstName: dep.firstName,
      lastName: dep.lastName,
      middleName: dep.middleName,
      dob: dep.dob,
      gender: dep.gender,
      status: dep.status || dependantSnapshot?.status,
      statusSenderName: dep.statusSenderName || dependantSnapshot?.statusSenderName,
      statusUser: dep.statusUser || dependantSnapshot?.statusUser,
      updatedAt: dep.updatedAt || dependantSnapshot?.updatedAt,
      relationshipType: dep.relationshipType || dependantSnapshot?.relationshipType,
      hospitalId: guardian.hospitalId,
      hmos: Array.isArray(guardian.hmos)
        ? guardian.hmos.filter((h) => h.dependantId === (dep.id || dependantId))
        : [],
      dependants: [],
    };
  }, [isViewingDependant, patient, subject, dependantSnapshot, dependantId]);

  // Fetch patient data from backend
  useEffect(() => {
    if (patientId) {
      dispatch(fetchPatientById(patientId));
    }
  }, [patientId, dispatch]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
      dispatch(clearPatientsError());
      navigate('/superadmin/patients/Patients');
    }
  }, [error, dispatch, navigate]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleEditPatient = (updatedData) => {
    if (patientId) {
      dispatch(fetchPatientById(patientId));
    }
    setIsEditModalOpen(false);
  };

  const isTransitionLoading = isLoading || (currentPatient && String(currentPatient.id) !== String(patientId));

  // Show error state or redirect if no patient (only when not loading)
  if (!currentPatient && !isTransitionLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="text-base-content/70">Patient not found</p>
          <p className="text-sm text-base-content/50 mt-2">Patient ID: {patientId}</p>
          <button
            onClick={() => navigate('/superadmin/patients/Patients')}
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
          <PatientPageHeader onEdit={() => setIsEditModalOpen(true)} onClose={() => navigate('/superadmin/patients/Patients')} />

          {/* Patient Information */}
          <div className="space-y-6">
            <div className="space-y-6">
              <PatientDetailsCard
                patient={displayPatient}
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
                  patient={displayPatient}
                  onUpdated={() => navigate('/superadmin/patients/Patients')}
                  allowedRoles={['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'cashier', 'hmo', 'sonographer']}
                  defaultDependantId={isViewingDependant ? dependantId : null}
                  defaultDependantLabel={summarySubject?.fullName}
                  lockSubject={isViewingDependant}
                />
                <ViewPatientModal patientId={patient?.id || patientId} patient={patient} />
              </div>

               <div className="space-y-3 mb-4">
                          <details className="group rounded-lg border border-base-300 bg-base-100" open>
                            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold text-base-content">
                              <span>Consultations ({consultations.length})</span>
                              <span className="text-xs text-base-content/50 group-open:rotate-180">⌄</span>
                            </summary>
                            <div className="border-t border-base-200 p-4">
                              {consultationLoading ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                  {Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-28 w-full rounded-lg" />)}
                                </div>
                              ) : consultations.length === 0 ? (
                                <div className="py-6 text-center text-sm text-base-content/50">No consultations found.</div>
                              ) : (
                                <div className="space-y-3">
                                  {consultations.map((item) => {
                                    const docName = item.doctor
                                      ? `${item.doctor.firstName || ''} ${item.doctor.lastName || ''}`.trim()
                                      : item.doctorName || '';
                                    return (
                                      <article
                                        key={item.id || item._id}
                                        className="rounded-xl border border-base-300 bg-base-100 p-4 transition-all hover:border-primary/50 hover:bg-base-200/40 cursor-pointer shadow-sm"
                                        onClick={() => setSelectedConsultation(item)}
                                      >
                                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <span className="badge badge-primary badge-sm font-medium">Consultation</span>
                                            {docName && (
                                              <span className="text-xs font-medium text-base-content/80">
                                                Dr. {docName}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-base-content/50">
                                              {item.createdAt ? formatNigeriaDateTime(item.createdAt) : '—'}
                                            </span>
                                            <button
                                              type="button"
                                              className="btn btn-xs btn-primary btn-outline"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedConsultation(item);
                                              }}
                                            >
                                              View Details
                                            </button>
                                          </div>
                                        </div>
                                        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
                                          <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Visit Reason</span>
                                            <p className="font-medium capitalize text-base-content mt-0.5">{item.visitReason || '—'}</p>
                                          </div>
                                          <div>
                                            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Diagnosis</span>
                                            <p className="font-semibold text-primary mt-0.5">{item.diagnosis || 'Pending diagnosis'}</p>
                                          </div>
                                          {item.notes && (
                                            <div className="md:col-span-2">
                                              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Doctor's Observations</span>
                                              <p className="line-clamp-2 text-xs text-base-content/80 whitespace-pre-wrap mt-0.5">{item.notes}</p>
                                            </div>
                                          )}
                                          {item.additionalNotes && (
                                            <div className="md:col-span-2 bg-warning/10 border border-warning/30 p-2.5 rounded-lg">
                                              <span className="text-xs text-warning-content font-bold uppercase tracking-wider">Doctor's Instructions for Nurse</span>
                                              <p className="line-clamp-2 text-xs text-base-content whitespace-pre-wrap font-medium mt-0.5">{item.additionalNotes}</p>
                                            </div>
                                          )}
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </details>
              
                          <details className="group rounded-lg border border-base-300 bg-base-100">
                            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold text-base-content">
                              <span>Appointments ({appointments.length})</span>
                              <span className="text-xs text-base-content/50 group-open:rotate-180">⌄</span>
                            </summary>
                            <div className="border-t border-base-200 p-4">
                              {appointmentsLoading ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                  {Array.from({ length: 3 }).map((_, index) => <div key={index} className="skeleton h-28 w-full rounded-lg" />)}
                                </div>
                              ) : appointments.length === 0 ? (
                                <div className="py-6 text-center text-sm text-base-content/50">No appointments found.</div>
                              ) : (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                  {appointments.map((appointment) => {
                                    const appointmentId = appointment.id || appointment._id || appointment.appointmentId;
                                    const status = String(appointment.status || '').toLowerCase();
                                    const statusClass = status === 'completed' ? 'badge-primary' : status === 'scheduled' ? 'badge-info' : status === 'cancelled' ? 'badge-error' : 'badge-neutral';
                                    return (
                                      <button key={appointmentId} type="button" onClick={() => { if (appointmentId) { setSelectedAppointmentId(appointmentId); setIsAppointmentModalOpen(true); } }} className="rounded-lg border border-base-300 p-4 text-left transition-colors hover:border-primary/50 hover:bg-base-200/60">
                                        <div className="mb-2 flex items-center justify-between gap-2"><span className={`badge badge-sm ${statusClass}`}>{appointment.status || 'Unknown'}</span><span className="text-xs text-base-content/40">{appointment.appointmentDate ? formatNigeriaDate(appointment.appointmentDate) : '—'}{appointment.appointmentTime ? ` · ${appointment.appointmentTime}` : ''}</span></div>
                                        <p className="line-clamp-1 text-sm font-medium">{appointment.procedureName || appointment.appointmentType || 'General appointment'}</p>
                                        {appointment.department && <p className="mt-1 text-xs capitalize text-base-content/60">{appointment.department}</p>}
                                        {appointment.notes && <p className="mt-1 line-clamp-2 text-xs text-base-content/50">{appointment.notes}</p>}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </details>

                          <details className="group rounded-lg border border-base-300 bg-base-100">
                            <summary className="flex cursor-pointer list-none items-center justify-between p-4 font-semibold text-base-content">
                              <span className="flex items-center gap-2">
                                <FaBed className="text-primary w-4 h-4" />
                                <span>Admissions & Inpatient Records ({admissions.length})</span>
                              </span>
                              <span className="text-xs text-base-content/50 group-open:rotate-180">⌄</span>
                            </summary>
                            <div className="border-t border-base-200 p-4">
                              {admissionsLoading ? (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                                  {Array.from({ length: 2 }).map((_, index) => (
                                    <div key={index} className="skeleton h-28 w-full rounded-lg" />
                                  ))}
                                </div>
                              ) : admissions.length === 0 ? (
                                <div className="py-6 text-center text-sm text-base-content/50">
                                  No admission history found for this patient.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                                  {admissions.map((adm) => {
                                    const admId = adm.id || adm._id;
                                    const isDischarged = adm.status === 'discharged';
                                    const wardName = adm.ward?.name || adm.wardName || 'Ward Unassigned';
                                    const bedNum = adm.bedNumber || adm.bed?.bedNumber || 'Pending Bed';
                                    const docName =
                                      adm.admittedByDoctor?.name ||
                                      adm.doctorName ||
                                      (adm.doctor
                                        ? `Dr. ${adm.doctor.firstName || ''} ${adm.doctor.lastName || ''}`.trim()
                                        : 'Attending Doctor');

                                    return (
                                      <article
                                        key={admId}
                                        className="rounded-xl border border-base-300 bg-base-100 p-4 transition-all hover:border-primary/50 hover:bg-base-200/40 shadow-sm"
                                      >
                                        <div className="mb-2 flex items-center justify-between gap-2">
                                          <div className="flex items-center gap-2">
                                            <span
                                              className={`badge badge-sm font-semibold ${
                                                isDischarged
                                                  ? 'badge-success'
                                                  : adm.confirmedAt
                                                  ? 'badge-primary'
                                                  : 'badge-warning'
                                              }`}
                                            >
                                              {isDischarged
                                                ? 'Discharged'
                                                : adm.confirmedAt
                                                ? 'Admitted'
                                                : 'Awaiting Ward'}
                                            </span>
                                            <span className="text-xs text-base-content/70 font-semibold">
                                              {wardName} {bedNum ? `· Bed ${bedNum}` : ''}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              if (isViewingDependant) {
                                                navigate(
                                                  `/superadmin/admitted/patient/${patientId}/dependant/${dependantId}`,
                                                  {
                                                    state: {
                                                      patientSnapshot: patient,
                                                      dependantSnapshot: subject || dependantSnapshot,
                                                      dependantId,
                                                      admission: adm,
                                                    },
                                                  }
                                                );
                                              } else {
                                                navigate(`/superadmin/admitted/patient/${patientId}`, {
                                                  state: {
                                                    patientSnapshot: patient,
                                                    admission: adm,
                                                  },
                                                });
                                              }
                                            }}
                                            className="btn btn-xs btn-primary btn-outline"
                                          >
                                            View Inpatient Record
                                          </button>
                                        </div>
                                        <div className="text-xs space-y-1 mt-2">
                                          <p className="text-base-content/80">
                                            <span className="font-semibold text-base-content/50 uppercase tracking-wider text-[10px] block">
                                              Diagnosis / Reason:
                                            </span>
                                            {adm.diagnosis || adm.reason || 'General inpatient care'}
                                          </p>
                                          <div className="flex items-center justify-between text-base-content/60 pt-2 border-t border-base-200 mt-2">
                                            <span>Doctor: {docName}</span>
                                            <span>
                                              Admitted:{' '}
                                              {adm.admittedAt || adm.createdAt
                                                ? formatNigeriaDate(adm.admittedAt || adm.createdAt)
                                                : '—'}
                                            </span>
                                          </div>
                                        </div>
                                      </article>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </details>
                        </div>
              

              {/* General Info */}
              <GeneralInfoCard patient={displayPatient} isTransitionLoading={isTransitionLoading} />

              {/* Additional Info */}
              <AdditionalInfoCard patient={displayPatient} isTransitionLoading={isTransitionLoading} />

              {/* HMO & Dependants Info */}
              <HmoDependantsSection
                patient={displayPatient}
                isTransitionLoading={isTransitionLoading}
                onAddHmo={() => {
                  setHmoTargetDependantId(null);
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
            <AdditionalInformationCard patient={displayPatient} isLoading={isLoading} />

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
        patient={displayPatient}
        onSave={handleEditPatient}
      />
      <AddHmoModal
        isOpen={isAddHmoOpen}
        onClose={() => {
          setIsAddHmoOpen(false);
          setHmoTargetDependantId(null);
        }}
        patient={displayPatient}
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
        patient={displayPatient}
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
        patient={displayPatient}
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
        patient={displayPatient}
        onSuccess={() => {
          if (patientId) {
            dispatch(fetchPatientById(patientId));
          }
          setIsEditDependantOpen(false);
        }}
      />

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
    </div>
  );
};

export default PatientDetails;
