/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import HrLayout from "@/layouts/hr/HrLayout";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchPatientById, clearPatientsError } from "@/store/slices/patientsSlice";
import toast from "react-hot-toast";
import { getErrorMessage } from "@/utils/errorHandler";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import GeneralInfoCard from "@/components/frontdesk/patients/GeneralInfoCard";
import AdditionalInfoCard from "@/components/frontdesk/patients/AdditionalInfoCard";
import HmoDependantsSection from "@/components/frontdesk/patients/HmoDependantsSection";
import PatientBillsHistory from "@/components/frontdesk/patients/PatientBillsHistory";
import SendPatientModal from "@/components/modals/SendPatientModal";
import ViewPatientModal from "@/components/frontdesk/modal/ViewPatientModal";
import KolakLoader from "@/components/common/KolakLoader";
import { ConsultationDetailModal, AppointmentDetailsModal, AntenatalDetailModal } from "@/components/modals";
import { getConsultations } from "@/services/api/consultationAPI";
import { getAnteNatalRecordByPatientId, unwrapAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { getPrescriptionByPatientId } from "@/services/api/prescriptionsAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import {
  getVitalsByPatient,
  getLatestVital,
  normalizeVitalsResponse,
} from "@/services/api/vitalsAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import {
  FaArrowLeft,
  FaStethoscope,
  FaCalendarAlt,
  FaFileInvoiceDollar,
  FaInfoCircle,
} from "react-icons/fa";

const HrPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);

  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryDependantId = searchParams.get("dependantId");
  const dependantId = location?.state?.dependantId || queryDependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = Boolean(dependantId);

  const snapshot = location?.state?.patientSnapshot || null;
  const patient = currentPatient || snapshot || null;

  const [consultations, setConsultations] = useState([]);
  const [consultationsLoading, setConsultationsLoading] = useState(true);
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [antenatalLoading, setAntenatalLoading] = useState(true);
  const [selectedAntenatal, setSelectedAntenatal] = useState(null);
  const [prescriptionsByConsultation, setPrescriptionsByConsultation] = useState({});

  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  const [latestVital, setLatestVital] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(true);

  const [subject, setSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(true);

  // Fetch patient profile if not loaded
  useEffect(() => {
    if (patientId) {
      dispatch(fetchPatientById(patientId));
    }
  }, [patientId, dispatch]);

  // Handle errors
  useEffect(() => {
    if (error) {
      toast.error(getErrorMessage(error));
      dispatch(clearPatientsError());
      navigate("/dashboard/hr/patients");
    }
  }, [error, dispatch, navigate]);

  // Fetch clinical data (consultations, appointments, vitals)
  useEffect(() => {
    let mounted = true;
    const loadClinicalData = async () => {
      if (!patientId) return;
      setConsultationsLoading(true);
      setAntenatalLoading(true);
      setAppointmentsLoading(true);
      setVitalsLoading(true);

      const [consultationResult, appointmentResult, vitalResult, antenatalResult] = await Promise.allSettled([
        getConsultations({ patientId }),
        getAllAppointments({ patientId }),
        getVitalsByPatient(patientId),
        getAnteNatalRecordByPatientId(patientId),
      ]);

      if (!mounted) return;

      if (consultationResult.status === "fulfilled") {
        const raw =
          consultationResult.value?.data?.data ??
          consultationResult.value?.data ??
          consultationResult.value ??
          [];
        const list = Array.isArray(raw) ? raw : raw?.consultations ?? [];
        const scoped = list.filter((item) =>
          isViewingDependant ? item.dependantId === dependantId : !item.dependantId
        );
        setConsultations(
          [...scoped].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        );
      } else {
        setConsultations([]);
      }
      setConsultationsLoading(false);

      if (appointmentResult.status === "fulfilled") {
        const raw =
          appointmentResult.value?.data?.data ??
          appointmentResult.value?.data ??
          appointmentResult.value ??
          [];
        const list = Array.isArray(raw) ? raw : raw?.appointments ?? [];
        const scoped = list.filter((item) =>
          isViewingDependant ? item.dependantId === dependantId : !item.dependantId
        );
        setAppointments(
          [...scoped].sort(
            (a, b) =>
              new Date(`${b.appointmentDate || ""} ${b.appointmentTime || ""}`) -
              new Date(`${a.appointmentDate || ""} ${a.appointmentTime || ""}`)
          )
        );
      } else {
        setAppointments([]);
      }
      setAppointmentsLoading(false);

      if (vitalResult.status === "fulfilled") {
        const vitals = normalizeVitalsResponse(vitalResult.value).filter((item) =>
          isViewingDependant ? item.dependantId === dependantId : !item.dependantId
        );
        setLatestVital(getLatestVital(vitals));
      } else {
        setLatestVital(null);
      }
      setVitalsLoading(false);

      if (antenatalResult.status === "fulfilled") {
        setAntenatalRecords(unwrapAnteNatalRecords(antenatalResult.value, { isViewingDependant, dependantId }));
      } else {
        setAntenatalRecords([]);
      }
      setAntenatalLoading(false);
    };

    loadClinicalData();
    return () => {
      mounted = false;
    };
  }, [patientId, isViewingDependant, dependantId]);

  // Fetch prescriptions
  useEffect(() => {
    let mounted = true;
    const loadPrescriptions = async () => {
      if (!consultations.length) {
        if (mounted) setPrescriptionsByConsultation({});
        return;
      }

      try {
        const res = await getPrescriptionByPatientId(patientId);
        const raw = res?.data ?? res ?? [];
        const allPrescriptions = Array.isArray(raw)
          ? raw
          : raw && typeof raw === "object"
          ? [raw]
          : [];

        const grouped = {};
        allPrescriptions.forEach((p) => {
          if (p.consultationId) {
            if (!grouped[p.consultationId]) grouped[p.consultationId] = [];
            grouped[p.consultationId].push(p);
          }
        });
        consultations.forEach((c) => {
          if (!grouped[c.id]) grouped[c.id] = [];
        });

        if (mounted) setPrescriptionsByConsultation(grouped);
      } catch (err) {
        if (mounted) {
          const fallbackGroup = {};
          consultations.forEach((c) => {
            fallbackGroup[c.id] = [];
          });
          setPrescriptionsByConsultation(fallbackGroup);
        }
      }
    };

    loadPrescriptions();
    return () => {
      mounted = false;
    };
  }, [consultations, patientId]);

  // Load subject (dependant or principal)
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
            if (mounted) {
              const fromPatient = (patient?.dependants || []).find(
                (d) => String(d.id || d._id) === String(dependantId)
              );
              setSubject(fromPatient || dependantSnapshot);
            }
          }
        } else {
          if (mounted) setSubject(patient);
        }
      } finally {
        if (mounted) setSubjectLoading(false);
      }
    };

    loadSubject();
    return () => {
      mounted = false;
    };
  }, [isViewingDependant, dependantId, dependantSnapshot, patient]);

  // Summary subject for vitals and cards
  const summarySubject = useMemo(() => {
    const guardian = patient || {};

    if (!isViewingDependant) {
      return {
        id: guardian.id || patientId,
        fullName:
          `${guardian.firstName || ""} ${guardian.lastName || ""}`.trim() ||
          guardian.name ||
          "Unknown",
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
      ? guardian.hmos.filter((h) => h.dependantId === (dep.id || dependantId))
      : [];

    return {
      id: dep.id || dependantId,
      fullName: `${dep.firstName || ""} ${dep.lastName || ""}`.trim() || "Dependant",
      gender: dep.gender || "—",
      dob: dep.dob || dep.dateOfBirth || dep.birthDate,
      phone: dep.phone || guardian.phone || guardian.phoneNumber,
      hospitalId: guardian.hospitalId,
      status: dep.status || dependantSnapshot?.status || "Unknown",
      statusSenderName: dep.statusSenderName || dependantSnapshot?.statusSenderName,
      statusUser: dep.statusUser || dependantSnapshot?.statusUser,
      updatedAt: dep.updatedAt || dependantSnapshot?.updatedAt,
      hmos: ownHmos,
      relationshipType: dep.relationshipType || dependantSnapshot?.relationshipType,
    };
  }, [isViewingDependant, subject, dependantSnapshot, patient, dependantId, patientId]);

  // Display patient for Info cards
  const displayPatient = useMemo(() => {
    if (!isViewingDependant) return patient || {};

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

  if (isLoading && !patient) {
    return (
      <HrLayout>
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <KolakLoader size="lg" />
          <p className="text-sm text-base-content/60 font-medium">Loading patient details...</p>
        </div>
      </HrLayout>
    );
  }

  if (!patient && !isLoading) {
    return (
      <HrLayout>
        <div className="p-8 text-center bg-base-100 rounded-2xl border border-base-200">
          <h2 className="text-xl font-bold text-base-content mb-2">Patient Not Found</h2>
          <p className="text-sm text-base-content/60 mb-6">
            The requested patient record could not be found or has been removed.
          </p>
          <button
            onClick={() => navigate("/dashboard/hr/patients")}
            className="btn btn-primary btn-sm gap-2"
          >
            <FaArrowLeft /> Back to Patient Directory
          </button>
        </div>
      </HrLayout>
    );
  }

  return (
    <HrLayout>
      <div className="space-y-6">
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate("/dashboard/hr/patients")}
              className="btn btn-sm btn-ghost gap-2 text-base-content/70 hover:text-primary"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Patients</span>
            </button>
            <div className="h-4 w-px bg-base-300" />
            <div>
              <h1 className="text-xl font-bold text-base-content">
                Patient Details
              </h1>
            </div>
          </div>
        </div>

        {/* Patient Details & Status Card */}
        <PatientDetailsCard
          patient={displayPatient}
          summarySubject={summarySubject}
          isViewingDependant={isViewingDependant}
        />

        {/* Current Vitals Card */}
        <CurrentVitalsCard
          patient={summarySubject}
          latest={latestVital}
          loading={vitalsLoading}
          buttonHidden={true}
        />

        {/* Action Buttons: Send Patient & Switch / View Patient */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-start">
          <SendPatientModal
            patientId={patient?.id || patientId}
            patient={displayPatient}
            onUpdated={() => {
              if (patientId) dispatch(fetchPatientById(patientId));
            }}
            allowedRoles={[
              "nurse",
              "doctor",
              "medical-director",
              "pharmacist",
              "medical-laboratory",
              "labtechnician",
              "cashier",
              "hmo",
            ]}
            defaultDependantId={isViewingDependant ? dependantId : null}
            defaultDependantLabel={summarySubject?.fullName}
            lockSubject={isViewingDependant}
          />
          <ViewPatientModal patientId={patient?.id || patientId} patient={patient} />
        </div>

        {/* Consultations Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaStethoscope className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-base-content">Consultations History</h2>
            </div>
            <span className="text-xs text-base-content/60">
              {consultations.length} recorded consultation{consultations.length === 1 ? "" : "s"}
            </span>
          </div>

          {consultationsLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : consultations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50 bg-base-100">
              No consultations found for this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {consultations.map((consultation) => (
                <button
                  key={consultation.id}
                  type="button"
                  onClick={() =>
                    setSelectedConsultation({
                      ...consultation,
                      prescriptions: prescriptionsByConsultation[consultation.id] || [],
                    })
                  }
                  className="rounded-xl border border-base-200 bg-base-100 p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm group"
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="badge badge-primary badge-sm font-semibold">
                      Consultation
                    </span>
                    <span className="text-xs text-base-content/50">
                      {consultation.createdAt ? formatNigeriaDate(consultation.createdAt) : "—"}
                    </span>
                  </div>
                  <p className="line-clamp-1 text-sm font-semibold text-base-content group-hover:text-primary transition-colors">
                    {consultation.diagnosis || "General / Pending Diagnosis"}
                  </p>
                  {consultation.visitReason && (
                    <span className="badge badge-ghost badge-xs mt-2 capitalize">
                      {consultation.visitReason}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* Antenatal Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaStethoscope className="w-4 h-4 text-accent" />
              <h2 className="text-lg font-bold text-base-content">Antenatal</h2>
            </div>
            <span className="text-xs text-base-content/60">
              {antenatalRecords.length} antenatal record{antenatalRecords.length === 1 ? "" : "s"}
            </span>
          </div>

          {antenatalLoading ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="skeleton h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : antenatalRecords.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50 bg-base-100">
              No antenatal records found for this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {antenatalRecords.map((rec, idx) => {
                const present = rec.presentPregnancyHistories?.[0] || rec.presentPregnancy;
                return (
                  <button
                    key={rec.id || rec._id || idx}
                    type="button"
                    onClick={() => setSelectedAntenatal(rec)}
                    className="rounded-xl border border-base-200 bg-base-100 p-4 text-left transition-all hover:border-accent/40 hover:shadow-sm group"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="badge badge-accent badge-sm font-semibold">Antenatal</span>
                      <span className="text-xs text-base-content/50">
                        {rec.createdAt ? formatNigeriaDate(rec.createdAt) : "—"}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold text-base-content group-hover:text-accent transition-colors">
                      {present?.EDD ? `EDD: ${formatNigeriaDate(present.EDD)}` : `Antenatal Record #${antenatalRecords.length - idx}`}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {present?.durationOfPregnancyInWeek != null && (
                        <span className="badge badge-ghost badge-xs">{present.durationOfPregnancyInWeek} wks</span>
                      )}
                      {(rec.createdByName || rec.doctorName || rec.nurseName) && (
                        <span className="badge badge-outline badge-xs">{rec.createdByName || rec.doctorName || rec.nurseName}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Appointments Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-base-content">Appointments</h2>
            </div>
            <span className="text-xs text-base-content/60">
              {appointments.length} appointment{appointments.length === 1 ? "" : "s"}
            </span>
          </div>

          {appointmentsLoading ? (
            <div className="flex justify-center py-6">
              <KolakLoader size="sm" />
            </div>
          ) : appointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-base-300 py-8 text-center text-sm text-base-content/50 bg-base-100">
              No appointments found for this patient.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
              {appointments.map((appointment) => {
                const appointmentId =
                  appointment.id || appointment._id || appointment.appointmentId;
                const status = String(appointment.status || "").toLowerCase();
                const statusClass =
                  status === "completed"
                    ? "badge-primary"
                    : status === "scheduled"
                    ? "badge-info"
                    : status === "cancelled"
                    ? "badge-error"
                    : "badge-neutral";

                return (
                  <button
                    key={appointmentId}
                    type="button"
                    onClick={() => {
                      if (appointmentId) {
                        setSelectedAppointmentId(appointmentId);
                        setIsAppointmentModalOpen(true);
                      }
                    }}
                    className="rounded-xl border border-base-200 bg-base-100 p-4 text-left transition-all hover:border-primary/40 hover:shadow-sm"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className={`badge badge-sm font-semibold ${statusClass}`}>
                        {appointment.status || "Unknown"}
                      </span>
                      <span className="text-xs text-base-content/50">
                        {appointment.appointmentDate
                          ? formatNigeriaDate(appointment.appointmentDate)
                          : "—"}
                        {appointment.appointmentTime ? ` · ${appointment.appointmentTime}` : ""}
                      </span>
                    </div>
                    <p className="line-clamp-1 text-sm font-semibold text-base-content">
                      {appointment.procedureName ||
                        appointment.appointmentType ||
                        "General appointment"}
                    </p>
                    {appointment.department && (
                      <p className="mt-1 text-xs capitalize text-base-content/60">
                        {appointment.department}
                      </p>
                    )}
                    {appointment.notes && (
                      <p className="mt-1 line-clamp-2 text-xs text-base-content/50">
                        {appointment.notes}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* General Info Card */}
        <GeneralInfoCard patient={displayPatient} isTransitionLoading={isLoading} />

        {/* Additional Info Card */}
        <AdditionalInfoCard patient={displayPatient} isTransitionLoading={isLoading} />

        {/* HMO & Dependants Section (Strictly Read-Only with HR baseRoute) */}
        <HmoDependantsSection
          patient={patient}
          isTransitionLoading={isLoading}
          viewingDependantId={isViewingDependant ? dependantId : null}
          readOnly={true}
          baseRoute="/dashboard/hr/patients"
        />

        {/* Patient Billing History */}
        <PatientBillsHistory patientId={patientId} />

        {/* Modals for consultation & appointment inspection */}
        {selectedConsultation && (
          <ConsultationDetailModal
            consultation={selectedConsultation}
            onClose={() => setSelectedConsultation(null)}
          />
        )}

        {selectedAntenatal && (
          <AntenatalDetailModal
            antenatalRecord={selectedAntenatal}
            patientId={patientId}
            patient={patient}
            onClose={() => setSelectedAntenatal(null)}
          />
        )}

        <AppointmentDetailsModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          appointmentId={selectedAppointmentId}
        />
      </div>
    </HrLayout>
  );
};

export default HrPatientDetails;
