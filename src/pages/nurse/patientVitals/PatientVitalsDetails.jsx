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
import { getInvestigationRequestByPatientId } from "@/services/api/investigationRequestAPI";
import { CashierActionModal, PharmacyActionModal } from "@/components/modals";
import { toast } from "react-hot-toast";
import { hasStatus, mergePatientStatus } from "@/utils/statusUtils";
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
  const [isSendPharmacyOpen, setIsSendPharmacyOpen] = useState(false);
  const [isSendCashierOpen, setIsSendCashierOpen] = useState(false);
  const [dependants, setDependants] = useState([]);
  const [dependantsLoading, setDependantsLoading] = useState(true);
  const [isCreateBillOpen, setIsCreateBillOpen] = useState(false);
  const [isReviewBillOpen, setIsReviewBillOpen] = useState(false);
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

// Fetch doctor's consultation data
useEffect(() => {
  let mounted = true;

  const fetchConsultationData = async () => {
    try {
      setConsultationLoading(true);
      
      // Fetch all consultations and filter by patientId
      const consultationRes = await getConsultations();
      console.log('PatientVitalsDetails: consultationRes =', consultationRes);
      const allConsults = Array.isArray(consultationRes?.data) ? consultationRes.data : Array.isArray(consultationRes) ? consultationRes : [];
      const patientConsult = allConsults.find(c => c.patientId === patientId);
      
      if (mounted && patientConsult) {
        setConsultation(patientConsult);
      }

      // Fetch prescriptions and investigations in parallel using Promise.allSettled
      console.log('PatientVitalsDetails: Fetching prescriptions and investigations for patientId=', patientId);
      
      const promises = [
        getPrescriptionByPatientId(patientId),
        getInvestigationRequestByPatientId(patientId)
      ];

      const results = await Promise.allSettled(promises);

      // 1. Prescriptions
      if (results[0].status === 'fulfilled') {
        const presRes = results[0].value;
        let presList = [];
        if (Array.isArray(presRes)) {
          presList = presRes;
        } else if (presRes?.data && Array.isArray(presRes.data)) {
          presList = presRes.data;
        } else if (presRes?.data?.data && Array.isArray(presRes.data.data)) {
          presList = presRes.data.data;
        } else if (presRes && typeof presRes === 'object' && Object.keys(presRes).length > 0) {
          presList = [presRes];
        }
        if (mounted) {
          setPrescriptions(presList);
          setPrescriptionError(presList.length === 0);
        }
      } else {
        if (mounted) {
          setPrescriptions([]);
          setPrescriptionError(true);
        }
      }

      // 2. Investigations
      if (results[1].status === 'fulfilled') {
        const invRes = results[1].value;
        let invList = [];
        if (Array.isArray(invRes)) {
          invList = invRes;
        } else if (invRes?.data && Array.isArray(invRes.data)) {
          invList = invRes.data;
        } else if (invRes?.data?.data && Array.isArray(invRes.data.data)) {
          invList = invRes.data.data;
        }
        if (mounted) {
          setInvestigations(invList);
          setInvestigationError(invList.length === 0);
        }
      } else {
        if (mounted) {
          setInvestigations([]);
          setInvestigationError(true);
        }
      }

    } catch (error) {
      console.error('PatientVitalsDetails: Error fetching consultation data', error);
    } finally {
      if (mounted) setConsultationLoading(false);
    }
  };

  fetchConsultationData();
  return () => { mounted = false; };
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
                        <span className="text-sm text-base-content/70">Patient ID</span>
                        <span className="text-base font-medium text-base-content">{patientUUID || '—'}</span>
                        <span className="text-xs text-base-content/70">Hospital ID: {patient?.hospitalId || '—'}</span>
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
                          {`${h?.memberId || '—'} - ${h?.provider || '—'} - ${h?.plan || '—'} (${h?.expiresAt ? new Date(h.expiresAt).toLocaleDateString('en-US') : '—'})`}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-base-content/70">None</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="btn btn-primary btn-sm" onClick={() => setIsSendDoctorOpen(true)}>Send to Doctor</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsSendPharmacyOpen(true)}>Send to Pharmacy</button>
                  <button className="btn btn-outline btn-sm" onClick={() => setIsReviewBillOpen(true)}>Preview Doctor's Bill</button>
                  {/* <button className="btn btn-outline btn-sm" onClick={() => setIsCreateBillOpen(true)}>Send to Cashier</button> */}
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
                <div>
                  <h2 className="text-xl font-semibold text-base-content">Current Vitals - {subjectName}</h2>
                  <div className="flex items-center gap-2 text-sm text-base-content/70">
                    {currentSubject?.ward || currentSubject?.bed ? (
                      <span>
                        {patient?.ward ? `Ward ${patient.ward}` : ''}
                        {patient?.ward && patient?.bed ? ' - ' : ''}
                        {patient?.bed ? `Bed ${patient.bed}` : ''}
                      </span>
                    ) : (
                      <span>Ward info unavailable</span>
                    )}
                    <span>•</span>
                    <span>Last updated {formatRelativeTime(latest?.createdAt)}</span>
                  </div>
                </div>
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

              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-20 w-full" />
                  ))}
                </div>
              ) : latest ? (
                <>
                  {/* Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {/* Heart Rate */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <FiHeart className="w-5 h-5" />
                        <span>Heart Rate</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.heartRate ?? latest?.pulse ?? '—'}</span>
                        <span className="text-sm text-base-content/70">bpm</span>
                      </div>
                    </div>

                    {/* Blood Pressure */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <TbHeartbeat className="w-5 h-5" />
                        <span>Blood Pressure</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.bloodPressure ?? latest?.bp ?? '—'}</span>
                        <span className="text-sm text-base-content/70">mnHg</span>
                      </div>
                    </div>

                    {/* Oxygen */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <LuDroplet className="w-5 h-5" />
                        <span>Oxygen</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.oxygenSaturation ?? latest?.oxygen ?? latest?.spo2 ?? '—'}</span>
                        <span className="text-sm text-base-content/70">%</span>
                      </div>
                    </div>

                    {/* Temperature */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <LuThermometer className="w-5 h-5" />
                        <span>Temperature</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.temperature ?? '—'}</span>
                        <span className="text-sm text-base-content/70">°C</span>
                      </div>
                    </div>

                    {/* Weight */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <GiWeightLiftingUp  className="w-5 h-5" />
                        <span>Weight</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.weight ?? '—'}</span>
                        <span className="text-sm text-base-content/70">kg</span>
                      </div>
                    </div>
                    {/* Height */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <GiBodyHeight className="w-5 h-5" />
                        <span>Height</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.height ?? '—'}</span>
                        <span className="text-sm text-base-content/70">cm</span>
                      </div>
                    </div>
                    {/* Respiratory Rate */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <LuActivity className="w-5 h-5" />
                        <span>Respiratory Rate</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{latest?.respiratoryRate ?? '—'}</span>
                        <span className="text-sm text-base-content/70">rpm</span>
                      </div>
                    </div>

                    {/* Last Updated */}
                    <div className="rounded-xl border border-base-300 p-3">
                      <div className="flex items-center gap-2 text-sm text-base-content/80">
                        <FiClock className="w-5 h-5" />
                        <span>Last Updated</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-semibold">{formatRelativeTime(latest?.createdAt) || '—'}</span>
                      </div>
                    </div>
                  </div>

        
                </>
              ) : (
                <EmptyState title="No vitals available" description="No vitals recorded for this patient yet." />
              )}
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
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? `${item.relation}: ${item.condition}` : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {consultation?.socialHistory?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold mb-2">Social History</h4>
                        <ul className="text-sm space-y-1">
                          {consultation.socialHistory.map((item, idx) => (
                            <li key={idx} className="text-base-content/80">• {typeof item === 'object' ? `${item.relation}: ${item.condition}` : item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

  {/* Prescriptions */}
  {prescriptions && prescriptions.length > 0 ? (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Prescriptions ({prescriptions.length})
        </h2>

        <div className="space-y-3">
          {prescriptions.map((pres, idx) => (
            <div key={idx} className="border border-base-200 rounded-lg p-3">
              {pres.medications && pres.medications.length > 0 ? (
                pres.medications.map((med, mIdx) => (
                  <div key={mIdx} className="text-sm">
                    <span className="font-medium">{med.drugName}</span> -{" "}
                    {med.dosage}, {med.frequency}, {med.duration}
                  </div>
                ))
              ) : (
                <div className="text-sm text-base-content/60 italic">
                  No medications in this prescription
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Prescriptions
        </h2>
        <p className="text-sm text-base-content/60">
          No prescriptions found for this patient
        </p>
      </div>
    </div>
  )}

  {/* Lab Investigations */}
  {investigations && investigations.length > 0 ? (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Lab Investigations ({investigations.length})
        </h2>

        <div className=" flex flex-wrap space-y-3 ">
          {investigations.map((inv, idx) => ( 
            <div key={idx} className="border border-base-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`badge ${
                    inv.status === "completed"
                      ? "badge-success"
                      : "badge-info"
                  }`}
                >
                  {inv.status}
                </span>

                {inv.priority === "urgent" && (
                  <span className="badge badge-error badge-xs">
                    Urgent
                  </span>
                )}
              </div>

              {inv.tests && inv.tests.length > 0 ? (
                inv.tests.map((tests, tIdx) => (
                  <div key={tIdx} className="text-sm text-base-content/80">
                    • {tests.name}
                  </div>
                ))
              ) : (
                <div className="text-sm text-base-content/60 italic">
                  No tests in this investigation
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <h2 className="text-lg font-semibold text-base-content mb-4">
          Lab Investigations
        </h2>
        <p className="text-sm text-base-content/60">
          No lab investigations found for this patient
        </p>
      </div>
    </div>
  )}

</div>
          {/* Dependant History */}
          <div className="shadow-xl card bg-base-100">
            <div className="p-4 card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-base-content">Dependant History</h2>
                <div className="text-sm text-base-content/70">Showing {dependants?.length || 0} readings</div>
              </div>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto max-h-64 overflow-y-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>First Name</th>
                        <th>Last Name</th>
                        <th>Relationship</th>
                        <th>Gender</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDependants?.length ? sortedDependants.map((v, i) => (
                        <tr key={i} className="hover">
                          <td>{v?.firstName ?? '—'}</td>
                          <td>{v?.lastName ?? '—'}</td>
                          <td>{v?.relationshipType ?? '—'}</td>
                          <td>{v?.gender ?? '—'}</td>
                          <td>
                          <button
                            className="px-3 py-1 rounded-full bg-primary text-white"
                            // onClick={() => v?.id && navigate(`/dashboard/nurse/dependant/${v.id}`, { state: { from: 'vitals', patientSnapshot: patient } })}
                          >
                            View Dependant Details
                          </button></td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7}>
                            <EmptyState title="No Dependant" description="No dependant history found for this patient." />
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Vitals History */}
          <div className="shadow-xl card bg-base-100 mt-4">
            <div className="p-4 card-body">
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold text-base-content">Vitals History</h2>
                <div className="text-sm text-base-content/70">Showing {sortedVitals?.length || 0} readings</div>
              </div>
             {dependantsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="skeleton h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="overflow-x-auto max-h-96 overflow-y-auto">
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Record For</th>
                          <th>Time</th>
                          <th>Blood Pressure</th>
                          <th>Heart Rate</th>
                          <th>Temperature</th>
                          <th>Weight</th>
                          <th>Height</th>
                          <th>O2 Saturation</th>
                          <th>Respiratory Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const start = (vitalsPage - 1) * vitalsPerPage;
                          const end = start + vitalsPerPage;
                          const paginatedVitals = sortedVitals?.slice(start, end);
                          
                          return paginatedVitals?.length ? paginatedVitals.map((v, i) => (
                            <tr key={i} className="hover">
                              <td>
                                  {v?.dependantId ? (
                                    <span className="badge badge-info">
                                      Dependant
                                    </span>
                                  ) : (
                                    <span className="badge badge-primary">
                                    Patient
                                    </span>
                                  )}
                                </td>
                              <td>{v?.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                              <td>{v?.bp ?? '—'} <span className="text-sm text-base-content/70">mmHg</span></td>
                              <td>{v?.pulse ?? '—'} <span className="text-sm text-base-content/70">bpm</span></td>
                              <td>{v?.temperature ?? '—'} <span className="text-sm text-base-content/70">°C</span></td>
                              <td>{v?.height ?? '—'} <span className="text-sm text-base-content/70">cm</span></td>
                              <td>{v?.weight ?? '—'} <span className="text-sm text-base-content/70">kg</span></td>
                              <td>{v?.spo2 ?? v?.oxygen ?? '—'} <span className="text-sm text-base-content/70">%</span></td>
                              <td>{v?.respiratoryRate ?? '—'} <span className="text-sm text-base-content/70">bpm</span></td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={7}>
                                <EmptyState title="No history" description="No vitals history found for this patient." />
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Controls */}
                  {sortedVitals?.length > vitalsPerPage && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-base-content/70">
                        Showing {Math.min((vitalsPage - 1) * vitalsPerPage + 1, sortedVitals.length)}–{Math.min(vitalsPage * vitalsPerPage, sortedVitals.length)} of {sortedVitals.length}
                      </div>
                      <div className="join">
                        <button
                          className="join-item btn btn-sm"
                          disabled={vitalsPage <= 1}
                          onClick={() => setVitalsPage((p) => Math.max(1, p - 1))}
                        >
                          Prev
                        </button>
                        <span className="join-item btn btn-sm no-animation">
                          Page {vitalsPage} / {Math.ceil(sortedVitals.length / vitalsPerPage)}
                        </span>
                        <button
                          className="join-item btn btn-sm"
                          disabled={vitalsPage >= Math.ceil(sortedVitals.length / vitalsPerPage)}
                          onClick={() => setVitalsPage((p) => Math.min(Math.ceil(sortedVitals.length / vitalsPerPage), p + 1))}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

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

          {/* Send to Pharmacy Modal */}
          {isSendPharmacyOpen && (
            <PharmacyActionModal
              isOpen={isSendPharmacyOpen}
              onClose={() => setIsSendPharmacyOpen(false)}
              patientId={patientUUID || patientId}
              currentStatus={patient?.status || ''}
              defaultStatus={PATIENT_STATUS.AWAITING_PHARMACY}
              itemsCount={0}
              medicationNames={[]}
              patientLabel={`${subjectName} (${subjectHospitalId || '—'})`}
              onUpdated={() => setIsSendPharmacyOpen(false)}
            />
          )}

          {/* Send to Cashier Modal */}

            <CashierActionModal
              isOpen={isSendCashierOpen}
              onClose={() => setIsSendCashierOpen(false)}
              patientId={patientId}
              currentStatus={patient?.status || ''}
              defaultStatus={PATIENT_STATUS.AWAITING_CASHIER}
              onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
            />


          <CreateBillModal
            isOpen={isCreateBillOpen}
            onClose={() => setIsCreateBillOpen(false)}
            patientId={patientId}
            prescriptions={prescriptions}
            investigations={investigations}
            onSuccess={() => {
              setIsSendCashierOpen(true);
            }}
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