import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import NurseSidebar from "@/components/nurse/dashboard/Sidebar";
import DoctorSidebar from "@/components/doctor/dashboard/Sidebar";
import { useAppSelector } from "@/store/hooks";
import { getVitalsByPatient, createVital, updateVital, normalizeVitalsResponse, getLatestVital, sortVitalsByTime } from "@/services/api/vitalsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { getConsultations } from "@/services/api/consultationAPI";
import { getPrescriptionByPatientId } from "@/services/api/prescriptionsAPI";
import { getAnteNatalRecordByPatientId } from "@/services/api/anteNatalAPI";
import SendPatientModal from "@/components/modals/SendPatientModal";
import { toast } from "react-hot-toast";
import { hasStatus, mergePatientStatus } from "@/utils/statusUtils";
import { formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import { PATIENT_STATUS } from "@/constants/patientStatus";
// Use DaisyUI/Tailwind skeletons to match nurse dashboard styling
import { FiHeart, FiClock } from "react-icons/fi";
import { TbHeartbeat } from "react-icons/tb";
import { LuActivity, LuDroplet, LuThermometer } from "react-icons/lu";
import { GiBodyHeight, GiWeightLiftingUp } from "react-icons/gi";
import InjectionModals from "../incoming/modals/InjectionModals";
import SamplingModals from "../incoming/modals/SamplingModals";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import CreateBillModal from "@/components/modals/CreateBillModal";
import DoctorBillModal from "@/components/modals/DoctorBillModal";
import { fetchPatientById } from "@/store/slices/patientsSlice";
import { useDispatch } from "react-redux";
import PatientOrdersPanel from "@/components/common/PatientOrderPanel";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import VitalsHistoryTable from "@/components/doctor/patient/VitalsHistoryTable";
import ViewAllVitals from "./ViewAllPatientVitals";
import { getInvestigationByPatientId } from "@/services/api/investigationAPI";

const PatientVitalsDetails = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const fromIncoming = location?.state?.from === 'incoming';
  const { user } = useAppSelector((state) => state.auth);
  const role = String(user?.role || '').toLowerCase();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vitals, setVitals] = useState([]);
  const [patient, setPatient] = useState(null);
  // Record vitals modal state
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [isRecordInjection, setIsRecordInjection] = useState(false);
  const [isRecordSampling, setIsRecordSampling] = useState(false);
  const [recordLoading, setRecordLoading] = useState(false);
  const [recordError, setRecordError] = useState("");
  const [editingVitalId, setEditingVitalId] = useState(null);
  const [recordForm, setRecordForm] = useState({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", height: "", respiratoryRate: "", notes: "" });
  const [selectedDependantId, setSelectedDependantId] = useState(null);
  const [isSendDoctorOpen, setIsSendDoctorOpen] = useState(false);
  const [dependants, setDependants] = useState([]);
  const [dependantsLoading, setDependantsLoading] = useState(true);
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [isReviewBillOpen, setIsReviewBillOpen] = useState(false);
  const [antenatalRecords, setAntenatalRecords] = useState([]);
  const [antenatalLoading, setAntenatalLoading] = useState(true);
  const [selectedAntenatalRecord, setSelectedAntenatalRecord] = useState(null);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  // Doctor's consultation data
  const [consultation, setConsultation] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [investigations, setInvestigations] = useState([]);
  const [consultationLoading, setConsultationLoading] = useState(false);
  // Track if prescription/investigation failed to load
  const [prescriptionError, setPrescriptionError] = useState(false);
  const [investigationError, setInvestigationError] = useState(false);
  // Vitals pagination
  const [vitalsPage, setVitalsPage] = useState(1);
  const vitalsPerPage = 8;

  // Use patient snapshot from navigation if available to render immediately
  useEffect(() => {
    const snap = location?.state?.patientSnapshot;
    console.log('let me see snap:', snap);
    if (snap) {
      setPatient((prev) => prev || snap);
    }

    console.log('PatientVitalsDetails: patientId from params:', patientId);
  }, [location?.state, patientId]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);

        // Fetch vitals for this patient
        const res = await getVitalsByPatient(patientId);
        const list = normalizeVitalsResponse(res);
        if (mounted) setVitals(list);

        // Try to infer patient info from vitals; fallback to patient API
        const fromVitalsPatient = list?.[0]?.patient;
        if (fromVitalsPatient) {
          if (mounted) setPatient(fromVitalsPatient);
        } else {
          try {
            const pRes = await getPatientById(patientId);
            const pData = pRes?.data ?? pRes;
            if (mounted) setPatient(pData);
          } catch (e) {
            console.warn("PatientVitalsDetails: fallback patient fetch failed", e);
          }
        }
      } catch (e) {
        console.error("PatientVitalsDetails: fetch error", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId]);

  // Get All Dependant
useEffect(() => {
  let mounted = true;

  const fetchDependant = async () => {
    try {
      setDependantsLoading(true);

      const res = await getAllDependantsForPatient(patientId);
      console.log('Dependants response:', res);

      const raw =
        res?.data?.data?.dependants ??
        res?.data?.dependants ??
        res?.data ??
        [];

      if (mounted) {
        setDependants(Array.isArray(raw) ? raw : []);
      }
    } catch (error) {
      console.error('Error fetching dependant data:', error);
    } finally {
      if (mounted) setDependantsLoading(false);
    }
  };

  fetchDependant();
  return () => { mounted = false; };
}, [patientId]);

// Fetch antenatal records (nurse read-only view)
useEffect(() => {
  let mounted = true;
  const fetchAntenatal = async () => {
    setAntenatalLoading(true);
    try {
      const records = await getAnteNatalRecordByPatientId(patientId);
      if (mounted) setAntenatalRecords(Array.isArray(records) ? records : []);
    } catch (error) {
      console.error('Error fetching antenatal records:', error);
      if (mounted) setAntenatalRecords([]);
    } finally {
      if (mounted) setAntenatalLoading(false);
    }
  };

  if (patientId) fetchAntenatal();

  return () => { mounted = false; };
}, [patientId]);

// Fetch doctor's consultation data
useEffect(() => {
  let mounted = true;

  const fetchConsultationData = async () => {
    try {
      setConsultationLoading(true);

      const consultationRes = await getConsultations();

      const allConsults = Array.isArray(consultationRes?.data)
        ? consultationRes.data
        : [];

      const patientConsult = allConsults.find(
        c => String(c.patientId) === String(patientId)
      );

      if (mounted) setConsultation(patientConsult || null);

      const [presRes, invRes] = await Promise.allSettled([
        getPrescriptionByPatientId(patientId),
        getInvestigationByPatientId(patientId)
      ]);

      // ================= PRESCRIPTIONS =================
      let presList = [];

      if (presRes.status === "fulfilled") {
        const raw = presRes.value;

        const data =
          raw?.data?.data ??
          raw?.data ??
          raw;

        presList = Array.isArray(data)
          ? data
          : data
          ? [data]
          : [];
      }

      if (mounted) {
        setPrescriptions(presList);
        setPrescriptionError(presList.length === 0);
      }

      // ================= INVESTIGATIONS =================
      let invList = [];

      if (invRes.status === "fulfilled") {
        const raw = invRes.value;

        const data =
          raw?.data?.data ??
          raw?.data ??
          raw;

        invList = Array.isArray(data)
          ? data
          : data
          ? [data]
          : [];
      }

      if (mounted) {
        setInvestigations(invList);
        setInvestigationError(invList.length === 0);
      }

    } catch (error) {
      console.error("consultation fetch error", error);
    } finally {
      if (mounted) setConsultationLoading(false);
    }
  };

  fetchConsultationData();

  return () => {
    mounted = false;
  };
}, [patientId]);
  // Log state changes for debugging
  useEffect(() => {
    console.log('=== PatientVitalsDetails State ===');
    console.log('prescriptions state:', prescriptions);
    console.log('investigations state:', investigations);
    console.log('consultation state:', consultation);
  }, [prescriptions, investigations, consultation]);

  const latest = useMemo(() => getLatestVital(vitals), [vitals]);

  // Sort vitals history by time descending so latest appears first
  const sortedVitals = useMemo(() => sortVitalsByTime(vitals), [vitals]);

  const currentSubject = useMemo(() => {
    if (!latest) return patient;
    if (latest.dependant && typeof latest.dependant === 'object') return latest.dependant;
    if (latest.dependantId) {
      const found = dependants.find((d) => (d?.id || '') === latest.dependantId);
      if (found) return found;
    }
    return patient;
  }, [latest, patient, dependants]);

  const sortedDependants = useMemo(() => {
    if (!Array.isArray(dependants)) return [];
    return [...dependants].sort((a, b) => {
      const at = new Date(a?.createdAt || 0).getTime();
      const bt = new Date(b?.createdAt || 0).getTime();
      return bt - at;
    });
  }, [dependants]);

  const patientUUID = patient?.id || location?.state?.patientSnapshot?.id || "";
  const subjectUUID = currentSubject?.id || patientUUID;
  const subjectHospitalId = currentSubject?.hospitalId || patient?.hospitalId || location?.state?.patientSnapshot?.hospitalId || patientId || "";
  const subjectName = currentSubject?.fullName || `${currentSubject?.firstName || ''} ${currentSubject?.lastName || ''}`.trim() || 'Unknown';

    const enrichedVitals = useMemo(() =>
      Array.isArray(sortedVitals)
        ? sortedVitals.map(vital => {
            const isDependant = !!vital.dependantId;
  
            const dependant = isDependant
              ? dependants.find(
                  d => d.id === vital.dependantId || d._id === vital.dependantId
                )
              : null;
  
            const forName = isDependant
              ? dependant
                ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim()
                : 'Dependant'
              : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim();
  
            return {
              ...vital,
              isForDependant: isDependant,
              forName
            };
          })
        : [],
      [sortedVitals, dependants, patient]
    );
  
   
    const enrichedLatest = useMemo(() => enrichedVitals[0] || latest, [enrichedVitals, latest]);
  

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {role === 'doctor' ? (
          <DoctorSidebar />
        ) : (
          <NurseSidebar onCloseSidebar={closeSidebar} />
        )}
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Header actions */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Patient Details</h1>
              <p className="text-sm text-base-content/70">Vitals overview and history</p>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => {
                const base = role === 'doctor' ? '/dashboard/doctor' : '/dashboard/nurse';
                const backPath = fromIncoming ? `${base}/incoming` : role === 'doctor' ? `${base}/patientVitals` : `${base}/patient`;
                navigate(backPath);
              }}
            >
              {fromIncoming ? 'Back to Incoming' : 'Back to Patients'}
            </button>
          </div>

          {/* Patient card */}
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              {loading ? (
                <div className="flex gap-4 items-center">
                  <div className="skeleton w-14 h-14 rounded-full" />
                  <div className="flex-1">
                    <div className="skeleton h-4 w-48 mb-2" />
                    <div className="skeleton h-3 w-32" />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="ml-4 avatar">
                    <div className="w-20 h-20 rounded-full border-3 border-primary/80 flex items-center justify-center overflow-hidden p-[2px]">
                      {loading ? (
                        <div className="skeleton w-full h-full rounded-full" />
                      ) : (
                        <div className="w-full h-full grid place-items-center bg-primary text-primary-content text-2xl font-bold">
                          {getInitials(patient?.firstName, patient?.lastName)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    {/* Top row items mimicking frontdesk style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Patient Name</span>
                        <span className="text-base font-medium text-base-content">{patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Gender</span>
                        <span className="text-base font-medium text-base-content capitalize">{patient?.gender || '—'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        <span className="text-sm text-base-content/70">Phone Number</span>
                        <span className="text-base font-medium text-base-content">{patient?.phone || patient?.phoneNumber || '—'}</span>
                      </div>
                      <div className="flex flex-col space-y-1">
                        {/* <span className="text-sm text-base-content/70">Patient ID</span>
                        <span className="text-base font-medium text-base-content">{patientUUID || '—'}</span> */}
                        <span className="text-sm text-base font-medium text-base-content/70">Hospital ID: {patient?.hospitalId || '—'}</span>
                </div>
              </div>

              {/* Insurance / HMO list */}
              <div className="flex justify-between items-center px-1 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
                <div className="space-y-1">
                  <span className="block text-sm font-semibold text-base-content">Insurance / HMO:</span>
                  {Array.isArray(patient?.hmos) && patient.hmos.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {patient.hmos.map((h, i) => (
                        <span key={i} className="badge badge-outline font-normal text-sm">
                          {`${h?.memberId || '—'} - ${h?.provider || '—'} - ${h?.plan || '—'} (${h?.expiresAt ? formatNigeriaDate(h.expiresAt) : '—'})`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-base-content/70">None</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <SendPatientModal
                    patientId={patientUUID || patientId}
                    onUpdated={() => {}}
                    buttonLabel="Send to Department"
                    buttonClass="btn btn-outline btn-sm"
                    allowedRoles={[ 'doctor', 'pharmacist', 'lab-technician', 'cashier', 'hmo']}
                  />
                  <button className="btn btn-outline btn-sm" onClick={() => setIsReviewBillOpen(true)}>Preview Doctor's Bill</button>
                </div>
              </div>
            </div>
          </div>
              )}
            </div>
          </div>

          {/* Current vitals */}
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              {/* Header matching design */}
              <div className="flex justify-between items-center mb-3">
                
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Record Vitals - Primary if AWAITING_VITALS */}
                    <button
                      className={`btn btn-sm ${
                        hasStatus(patient?.status, PATIENT_STATUS.AWAITING_VITALS)
                          ? "btn-success"
                          : "btn-outline"
                      }`}
                      onClick={() => { setIsRecordOpen(true); setEditingVitalId(null); }}
                    >
                      + Record Vitals
                      {hasStatus(patient?.status, PATIENT_STATUS.AWAITING_VITALS) && (
                        <span className="badge badge-xs badge-warning ml-1">Primary</span>
                      )}
                    </button>

                    {/* Edit Vitals */}
                    {latest && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          // Prefill modal with latest values for editing
                          setEditingVitalId(latest?.id || latest?._id || null);
                          setSelectedDependantId(latest?.dependantId || null);
                          setRecordForm({
                            bp: latest?.bp || latest?.bloodPressure || "",
                            pulse: latest?.pulse || latest?.heartRate || "",
                            temperature: latest?.temperature || "",
                            weight: latest?.weight || "",
                            spo2: latest?.spo2 || latest?.oxygenSaturation || latest?.oxygen || "",
                            height: latest?.height || "",
                            respiratoryRate: latest?.respiratoryRate || "",
                            notes: latest?.notes || "",
                          });
                          setIsRecordOpen(true);
                        }}
                      >
                        Edit Vitals
                      </button>
                    )}

                    {/* Record Injection - Primary if AWAITING_INJECTION */}
                    <button
                      className={`btn btn-sm ${
                        hasStatus(patient?.status, PATIENT_STATUS.AWAITING_INJECTION)
                          ? "btn-success"
                          : "btn-outline"
                      }`}
                      disabled={prescriptionError}
                      title={prescriptionError ? "No prescriptions found for this patient" : ""}
                      onClick={() => setIsRecordInjection(true)}
                    >
                      + Record Injection
                      {hasStatus(patient?.status, PATIENT_STATUS.AWAITING_INJECTION) && (
                        <span className="badge badge-xs badge-warning ml-1">Primary</span>
                      )}
                    </button>

                    {/* Collect Sampling - Primary if AWAITING_SAMPLING */}
                    <button
                      className={`btn btn-sm ${
                        hasStatus(patient?.status, PATIENT_STATUS.AWAITING_SAMPLING)
                          ? "btn-success"
                          : "btn-outline"
                      }`}
                      disabled={investigationError}
                      title={investigationError ? "No investigation requests found for this patient" : ""}
                      onClick={() => setIsRecordSampling(true)}
                    >
                      + Collect Sampling
                      {hasStatus(patient?.status, PATIENT_STATUS.AWAITING_SAMPLING) && (
                        <span className="badge badge-xs badge-warning ml-1">Primary</span>
                      )}
                    </button>
                  </div>
              </div>

             
                    <CurrentVitalsCard patient={patient} latest={enrichedLatest} loading={loading} onRecordOpen={() => setIsRecordOpen(true)} buttonHidden={true} />
            </div>
          </div>

          

          {/* Doctor's Consultation Data */}
          {consultation && (
            <div className="shadow-xl card bg-base-100 mb-4">
              <div className="p-4 card-body">
                <h2 className="text-lg font-semibold text-base-content mb-4">Doctor's Tasks</h2>
                
                {/* Diagnosis & Visit Reason */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm font-medium text-base-content/70">Visit Reason:</span>
                    <p className="text-base font-medium">{consultation?.visitReason || '—'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-base-content/70">Diagnosis:</span>
                    <p className="text-base font-medium">{consultation?.diagnosis || '—'}</p>
                  </div>
                </div>

                {/* Complaints */}
                {consultation?.complaint?.length > 0 && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-base-content/70">Patient Complaints:</span>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {consultation.complaint.map((item, idx) => (
                        <span key={idx} className="badge badge-outline">
                          {item.symptom} ({item.durationInDays} days)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Notes from Doctor - Doctor's Observations */}
                {consultation?.notes && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-base-content/70">Doctor's Observations:</span>
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg mt-2 text-sm text-base-content/90">
                      <p className="text-xs text-blue-600 font-semibold mb-2">Clinical Findings & Assessment</p>
                      {consultation.notes}
                    </div>
                  </div>
                )}

                {/* Additional Notes for Nurse - What Doctor Wants Nurse to Do */}
                {consultation?.additionalNotes && (
                  <div className="mb-4">
                    <span className="text-sm font-medium text-base-content/70">Doctor's Instructions for Nurse:</span>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg mt-2 text-sm text-base-content/90">
                      <p className="text-xs text-amber-600 font-semibold mb-2">What Doctor Wants You to Do</p>
                      {consultation.additionalNotes}
                    </div>
                  </div>
                )}

                {/* Medical History */}
                {(consultation?.medicalHistory?.length > 0 || consultation?.surgicalHistory?.length > 0 || consultation?.familyHistory?.length > 0) && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {consultation?.medicalHistory?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-2">Medical History</h4>
                        <ul className="text-sm space-y-1">
                          {consultation.medicalHistory.map((item, idx) => (
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? item.title : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {consultation?.surgicalHistory?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-2">Surgical History</h4>
                        <ul className="text-sm space-y-1">
                          {consultation.surgicalHistory.map((item, idx) => (
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? item.procedureName : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {consultation?.familyHistory?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-2">Family History</h4>
                        <ul className="text-sm space-y-1">
                          {consultation.familyHistory.map((item, idx) => (
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? `${item.relation}: ${item.condition}` : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {consultation?.allergicHistory?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-2">Allergic History</h4>
                        <ul className="text-sm space-y-1">
                          {consultation.allergicHistory.map((item, idx) => (
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? (item.allergen || item.reaction || 'Unknown allergy') : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {consultation?.socialHistory?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-2">Social History</h4>
                        <ul className="text-sm space-y-1">
                          {consultation.socialHistory.map((item, idx) => (
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? (item.title || item.habit || 'Social history item') : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

<PatientOrdersPanel
  role="nurse"
  prescriptions={prescriptions}
  investigations={investigations}
  loading={consultationLoading}
  patientName={`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}
/>

          {/* Antenatal Records (Nurse, Female patients only). Read-only, view all/details */}
          {patient?.gender?.toLowerCase() === 'female' && (
          <div className="shadow-xl card bg-base-100 mb-4">
            <div className="p-4 card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-base-content">Antenatal Records</h2>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => navigate(`/dashboard/nurse/patient/${patientId}/antenatal-records`)}
                  disabled={antenatalLoading || antenatalRecords.length === 0}
                >
                  View All ({antenatalRecords.length})
                </button>
              </div>

              {antenatalLoading ? (
                <div className="flex justify-center py-8">
                  <div className="loading loading-spinner loading-md" />
                </div>
              ) : antenatalRecords.length === 0 ? (
                <EmptyState title="No antenatal records" description="No antenatal records available for this patient." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Booking date</th>
                        <th>LMP</th>
                        <th>EDD</th>
                        <th>Gestation</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {antenatalRecords.slice(0, 4).map((record, idx) => {
                        const presentPregnancy = record?.presentPregnancy || record?.presentPregnancyHistories?.[0] || {};
                        return (
                          <tr key={record._id || record.id || idx}>
                            <td>{idx + 1}</td>
                            <td>{presentPregnancy?.dateOfBooking ? formatNigeriaDate(presentPregnancy.dateOfBooking) : '—'}</td>
                            <td>{presentPregnancy?.LMP || presentPregnancy?.lmp ? formatNigeriaDate(presentPregnancy.LMP || presentPregnancy.lmp) : '—'}</td>
                            <td>{presentPregnancy?.EDD || presentPregnancy?.edd ? formatNigeriaDate(presentPregnancy.EDD || presentPregnancy.edd) : '—'}</td>
                            <td>{presentPregnancy?.durationOfPregnancyInWeek || presentPregnancy?.durationInWeeks ? `${presentPregnancy.durationOfPregnancyInWeek || presentPregnancy.durationInWeeks} w` : '—'}</td>
                            <td className="text-right">
                              <button type="button" className="btn btn-xs btn-primary" onClick={() => setSelectedAntenatalRecord(record)}>
                                View details
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedAntenatalRecord && (() => {
                const pregnancyData = selectedAntenatalRecord?.presentPregnancy || selectedAntenatalRecord?.presentPregnancyHistories?.[0] || {};
                return (
                <div className="mt-4 p-3 border rounded-lg bg-base-200">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-base font-semibold">Antenatal details</h3>
                    <button className="btn btn-xs btn-ghost" onClick={() => setSelectedAntenatalRecord(null)}>Close</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="font-medium">Booking date</p>
                      <p>{pregnancyData?.dateOfBooking ? formatNigeriaDate(pregnancyData.dateOfBooking) : '—'}</p>
                    </div>
                    <div>
                      <p className="font-medium">LMP</p>
                      <p>{pregnancyData?.LMP || pregnancyData?.lmp ? formatNigeriaDate(pregnancyData.LMP || pregnancyData.lmp) : '—'}</p>
                    </div>
                    <div>
                      <p className="font-medium">EDD</p>
                      <p>{pregnancyData?.EDD || pregnancyData?.edd ? formatNigeriaDate(pregnancyData.EDD || pregnancyData.edd) : '—'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Gestational age</p>
                      <p>{pregnancyData?.durationOfPregnancyInWeek || pregnancyData?.durationInWeeks ? `${pregnancyData.durationOfPregnancyInWeek || pregnancyData.durationInWeeks} w` : '—'}</p>
                    </div>
                  </div>

                  {((selectedAntenatalRecord?.antenatalExaminations || selectedAntenatalRecord?.anteNatalExamination || []))?.length > 0 ? (
                    <div className="mt-3">
                      <h4 className="font-medium">Antenatal Examinations</h4>
                      <ul className="list-disc list-inside text-sm">
                        {(selectedAntenatalRecord?.antenatalExaminations || selectedAntenatalRecord?.anteNatalExamination || []).map((exam, idx) => (
                          <li key={idx}>
                            {exam?.Date ? `${formatNigeriaDate(exam.Date)} — ` : ''}{exam?.remark || exam?.fetalHeart || exam?.foetalHeart || exam?.bloodPressure || 'No details'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <p className="text-sm mt-3 text-base-content/70">No examination entries for this record.</p>
                  )}
                </div>
                );
              })()}
            </div>
          </div>
          )}



 <VitalsHistoryTable 
            sortedVitals={enrichedVitals} 
            loading={loading}
            // patientName={patient.}
            onViewAll={() => navigate(`/dashboard/nurse/view-vitals/${patientId}`)}
          />
       
          {/* Record Vitals Modal */}
          {isRecordOpen && (
            <div className="modal modal-open">
              <div className="modal-box">
                <h3 className="font-bold text-lg">Record New Vitals - {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}</h3>
                <p className="py-1 text-sm">Enter the latest vital signs for this patient.</p>

                <div className="mb-4">
                  <label className="block mb-1 text-sm text-base-content/70">Family Member / Dependant (Optional)</label>
                  <select 
                    value={selectedDependantId || ''} 
                    onChange={(e) => setSelectedDependantId(e.target.value || null)}
                    className="select select-bordered w-full"
                  >
                    <option value="">Record for main patient</option>
                    {dependants && dependants.length > 0 ? (
                      dependants.map((dep) => (
                        <option key={dep?.id} value={dep?.id}>
                          {dep?.fullName || `${dep?.firstName || ''} ${dep?.lastName || ''}`.trim() || 'Unknown'} - {dep?.relationship || 'Family'}
                        </option>
                      ))
                    ) : (
                      <option disabled>No family members added</option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Blood Pressure</label>
                    <input type="text" placeholder="120/80" className="input input-bordered w-full"
                      value={recordForm.bp}
                      onChange={(e) => setRecordForm((f) => ({ ...f, bp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Pulse</label>
                    <input type="number" placeholder="78" className="input input-bordered w-full"
                      value={recordForm.pulse}
                      onChange={(e) => setRecordForm((f) => ({ ...f, pulse: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Weight</label>
                    <input type="number" placeholder="62" className="input input-bordered w-full"
                      value={recordForm.weight}
                      onChange={(e) => setRecordForm((f) => ({ ...f, weight: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Temperature (°C)</label>
                    <input type="number" placeholder="98.6" className="input input-bordered w-full"
                      value={recordForm.temperature}
                      onChange={(e) => setRecordForm((f) => ({ ...f, temperature: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">SpO2</label>
                    <input type="number" placeholder="98" className="input input-bordered w-full"
                      value={recordForm.spo2}
                      onChange={(e) => setRecordForm((f) => ({ ...f, spo2: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Height (cm)</label>
                    <input type="number" placeholder="170" className="input input-bordered w-full"
                      value={recordForm.height}
                      onChange={(e) => setRecordForm((f) => ({ ...f, height: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-sm text-base-content/70">Respiratory Rate (bpm)</label>
                    <input type="number" placeholder="16" className="input input-bordered w-full"
                      value={recordForm.respiratoryRate}
                      onChange={(e) => setRecordForm((f) => ({ ...f, respiratoryRate: e.target.value }))}
                    />
                  </div>
                </div>

                {recordError && <p className="mt-2 text-sm text-error">{recordError}</p>}

                <div className="modal-action">
                  <button className="btn btn-ghost" onClick={() => { setIsRecordOpen(false); setRecordError(""); setSelectedDependantId(null); }}>Cancel</button>
                  <button className={`btn btn-primary ${recordLoading ? 'loading' : ''}`} onClick={async () => {
                    try {
                      setRecordLoading(true);
                      setRecordError("");
                      const payload = {
                        patientId: patientUUID || patientId,
                        dependantId: selectedDependantId || undefined,
                        bp: recordForm.bp,
                        temperature: recordForm.temperature ? Number(recordForm.temperature) : undefined,
                        weight: recordForm.weight ? Number(recordForm.weight) : undefined,
                        pulse: recordForm.pulse ? Number(recordForm.pulse) : undefined,
                        spo2: recordForm.spo2 ? Number(recordForm.spo2) : undefined,
                        height: recordForm.height ? Number(recordForm.height) : undefined,
                        respiratoryRate: recordForm.respiratoryRate ? Number(recordForm.respiratoryRate) : undefined,
                        notes: recordForm.notes || undefined,
                      };

                      if (editingVitalId) {
                        // Edit existing vital
                        const res = await updateVital(editingVitalId, payload);
                        const updated = res?.data ?? res;
                        setVitals((prev) => (Array.isArray(prev) ? prev.map((v) => ((v?.id === editingVitalId || v?._id === editingVitalId) ? updated : v)) : [updated]));
                      } else {
                        // Create new vital
                        const res = await createVital(payload);
                        const created = res?.data ?? res;
                        setVitals((prev) => [created, ...(Array.isArray(prev) ? prev : [])]);
                      }

                      setIsRecordOpen(false);
                      setRecordForm({ bp: "", pulse: "", temperature: "", weight: "", spo2: "", height: "", respiratoryRate: "", notes: "" });
                      setSelectedDependantId(null);
                      setEditingVitalId(null);
                    } catch (e) {
                      const msg = e?.response?.data?.message || 'Failed to record vitals';
                      setRecordError(msg);
                    } finally {
                      setRecordLoading(false);
                    }
                  }}>Record Vitals</button>
                </div>
              </div>
            </div>
          )}

          {/* Send to Doctor Modal */}
          {isSendDoctorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => setIsSendDoctorOpen(false)} />
              <div className="relative z-10 w-full max-w-lg shadow-xl card bg-base-100">
                <div className="p-6 card-body">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-base-content">Confirm Send to Doctor</h2>
                    <button className="btn btn-ghost btn-sm" onClick={() => setIsSendDoctorOpen(false)}>Close</button>
                  </div>
                  <p className="mb-4 text-sm text-base-content/70">
                    Are you sure you want to send this patient to the doctor for consultation? This will update the status to <span className="font-medium">awaiting_consultation</span> for {subjectName} ({subjectHospitalId || '—'}).
                  </p>
                  <div className="flex justify-end gap-3 mt-6">
                    <button className="btn" onClick={() => setIsSendDoctorOpen(false)}>Cancel</button>
                    <button
                      className="btn btn-success"
                      onClick={async () => {
                        try {
                          const newStatus = PATIENT_STATUS.AWAITING_CONSULTATION;
                          const promise = updatePatientStatus(patientUUID || patientId, newStatus);
                          toast.promise(promise, {
                            loading: 'Sending to doctor...',
                            success: 'Patient sent to doctor successfully',
                            error: (err) => err?.response?.data?.message || 'Failed to send to doctor',
                          });
                          await promise;
                          setIsSendDoctorOpen(false);
                        } catch (e) {
                          console.error("PatientVitalsDetails: send to doctor failed", e);
                        }
                      }}
                    >
                      Confirm & Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}




          <CreateBillModal
            isOpen={isCreateBillOpen}
            onClose={() => setIsCreateBillOpen(false)}
            patientId={patientId}
            prescriptions={prescriptions}
            investigations={investigations}
            onSuccess={() => {}}
          />

          <DoctorBillModal
            isOpen={isReviewBillOpen}
            onClose={() => setIsReviewBillOpen(false)}
            patientId={patientId}
              currentStatus={patient?.status || ''}
/>
          {/* Injection Modal */}
          {isRecordInjection && (
            <InjectionModals
              isOpen={isRecordInjection}
              setIsRecordInjection={setIsRecordInjection}
              patientId={patientId}
              patientData={patient}
            />
          )}

          {/* Sampling Modal */}
          {isRecordSampling && (
            <SamplingModals
              setIsRecordSampling={setIsRecordSampling}
              patientId={patientId}
              patientData={patient}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientVitalsDetails;

// Helper: compute initials from first/last name with fallback
const getInitials = (firstName, lastName) => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (!f && !l) return 'U';
  const firstInitial = f ? f.charAt(0).toUpperCase() : '';
  const lastInitial = l ? l.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}` || 'U';
};

// Helper: relative time like "10 mins ago"
const formatRelativeTime = (dateInput) => {
  if (!dateInput) return '';
  const now = new Date();
  const then = new Date(dateInput);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return '';
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? 's' : ''} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
};