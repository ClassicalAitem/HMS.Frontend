import React, { useMemo, useState, useEffect } from "react";

import { Header } from "@/components/common";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";
import CurrentVitalsCard from "@/components/doctor/patient/CurrentVitalsCard";
import VitalsHistoryTable from "@/components/doctor/patient/VitalsHistoryTable";
import SendPatientModal from "@/components/modals/SendPatientModal";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  FaProcedures,
  FaUserMd,
  FaSyringe,
  FaHeartbeat,
  FaClipboardList,
  FaPills,
  FaStickyNote,
  FaBaby,
  FaPlus,
  FaTrashAlt,
  FaTimes,
  FaTint,
  FaPrescriptionBottleAlt,
  FaBoxOpen,
} from "react-icons/fa";
import { createSurgery, updateSurgery, getSurgeryById } from "@/services/api/surgeryAPI";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { updateDependantStatus } from "@/services/api/dependantAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { getVitalsByPatient, createVital, normalizeVitalsResponse, getLatestVital, sortVitalsByTime } from "@/services/api/vitalsAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { getInventories } from "@/services/api/inventoryAPI";
import { createPrescription } from "@/services/api/prescriptionsAPI";
import { buildDurationString, hasConcentrationData, parseMedicationString } from "@/utils/prescriptionsCalculator";
import BloodTransfusionTab from "@/components/admitted/BloodTransfusionTab";
import avatarImg from "@/assets/images/incomingLogo.jpg";
import toast from "react-hot-toast";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";

const ORAL_FREQUENCIES = ['STAT', 'dly', 'b.d', 'tds', 'qds', 'mane', 'nocte', 'prn', 'alt die'];
const INJECTION_FREQUENCIES = ['STAT', 'dly', 'hly', '4hly', '6hly', '8hly', '12hly', '24hly', 'mane', 'nocte', 'prn'];

const MEDICATION_TABS = [
  { value: 'tablet', label: 'Tab/Cap', icon: FaPills },
  { value: 'syrup', label: 'Syr/Susp', icon: FaPrescriptionBottleAlt },
  { value: 'sublingual', label: 'Sublingual', icon: FaPills },
  { value: 'rectal', label: 'Rectal Form', icon: FaBoxOpen },
  { value: 'subcutaneous', label: 'Subcutaneous', icon: FaSyringe },
  { value: 'gutt', label: 'Gutt', icon: FaTint },
  { value: 'cream', label: 'Cream', icon: FaBoxOpen },
  { value: 'infusion', label: 'Infusion', icon: FaTint },
  { value: 'injection', label: 'Injection', icon: FaSyringe },
];

const getUnitOptions = (medicationType, selectedDrug) => {
  const hasConcentration = hasConcentrationData(selectedDrug);

  if (medicationType === 'tablet' || medicationType === 'sublingual') {
    return hasConcentration
      ? [{ value: 'mg', label: 'mg' }, { value: 'g', label: 'g' }, { value: 'tablet', label: 'tablet(s)/cap(s)' }]
      : [{ value: 'tablet', label: 'tablet(s)/cap(s)' }];
  }
  if (medicationType === 'rectal') {
    return hasConcentration
      ? [{ value: 'mg', label: 'mg' }, { value: 'suppository', label: 'suppository' }, { value: 'enema', label: 'enema' }, { value: 'piece', label: 'piece(s)' }, { value: 'tablet', label: 'tablet(s)' }]
      : [{ value: 'suppository', label: 'suppository' }, { value: 'enema', label: 'enema' }, { value: 'piece', label: 'piece(s)' }, { value: 'tablet', label: 'tablet(s)' }];
  }
  if (medicationType === 'syrup') {
    return hasConcentration
      ? [{ value: 'mg', label: 'mg' }, { value: 'g', label: 'g' }, { value: 'ml', label: 'ml' }]
      : [{ value: 'ml', label: 'ml' }];
  }
  if (medicationType === 'gutt') return [{ value: 'bottle', label: 'bottle(s)' }, { value: 'ml', label: 'drops' }];
  if (medicationType === 'infusion') return [{ value: 'ml', label: 'ml' }];
  if (medicationType === 'cream') {
    return hasConcentration
      ? [{ value: 'mg', label: 'mg' }, { value: 'g', label: 'g' }, { value: 'tube', label: 'tube(s)' }]
      : [{ value: 'tube', label: 'tube(s)' }];
  }
  if (medicationType === 'injection' || medicationType === 'subcutaneous') {
    const invUnit = selectedDrug?.unit === 'iu' ? 'iu' : selectedDrug?.unit === 'ampoule' ? 'ampoule' : 'ml';
    const physicalOpt = { value: invUnit, label: invUnit === 'iu' ? 'IU' : invUnit === 'ampoule' ? 'ampoule(s)' : 'ml' };
    return hasConcentration ? [{ value: 'mg', label: 'mg' }, { value: 'g', label: 'g' }, physicalOpt] : [physicalOpt];
  }
  return [{ value: 'unit', label: 'unit' }];
};

const matchesMedicationType = (drug, medicationType) => {
  const form = (drug.form || '').toLowerCase();
  if (!form) return false;

  if (medicationType === 'tablet') {
    return form.includes('tablet') || form.includes('caplet') || form.includes('capsule') || form.includes('suppository') || form.includes('implant') || form.includes('powder') || form.includes('granules') || form.includes('enema');
  }
  if (medicationType === 'sublingual') {
    return form.includes('sublingual') || form.includes('buccal') || form.includes('lozenge') || form.includes('tablet');
  }
  if (medicationType === 'rectal') {
    return form.includes('rectal') || form.includes('suppository') || form.includes('enema') || form.includes('pessary');
  }
  if (medicationType === 'syrup') {
    return form.includes('syrup') || form.includes('suspension') || (form.includes('solution') && !form.includes('topical') && !form.includes('nebulizer')) || form.includes('oral gel');
  }
  if (medicationType === 'cream') {
    return form.includes('cream') || form.includes('ointment') || form.includes('gel') || form.includes('lotion') || form.includes('shampoo') || form.includes('lacquer') || form.includes('preparation');
  }
  if (medicationType === 'gutt') {
    return form.includes('drop') || form.includes('spray') || form.includes('inhaler') || form.includes('inhalation') || form.includes('nebulizer') || form.includes('gutt') || form.includes('mouthwash') || form.includes('gas');
  }
  if (medicationType === 'injection') {
    return form.includes('injection');
  }
  if (medicationType === 'subcutaneous') {
    return form.includes('subcutaneous') || form.includes('sc') || form.includes('injection') || form.includes('vial') || form.includes('ampoule');
  }
  if (medicationType === 'infusion') {
    return form.includes('infusion');
  }
  return false;
};

const initialPrescription = {
  medicationType: 'tablet',
  drugName: '',
  dosageAmount: '',
  dosageUnit: 'tablet',
  frequency: '',
  durationAmount: '',
  durationUnit: 'day',
  instructions: '',
  inventoryId: null,
  availability: 'available',
  _selectedDrug: null,
};


const initialApgarScore = {
  appearance: '',
  pulse: '',
  grimace: '',
  activity: '',
  respiration: '',
};

const initialBabyAssessment = {
  apgarScore: { ...initialApgarScore },
  weight: '',
  length: '',
  headCircumference: '',
  deliveryTime: '',
  abdominalCircumference: '',
  randomBloodSugar: '',
  vitalSign: '',
  deformity: '',
};

// Small presentational helpers kept local to this file so the section
// markup below stays readable — none of these touch form state/logic.
const SectionCard = ({ icon: Icon, title, subtitle, tone = "primary", right = null, children }) => (
  <div className="card bg-base-100 border border-base-200 shadow-sm">
    <div className="p-5 border-b border-base-200 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl bg-${tone}/10 text-${tone} shrink-0`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-base-content">{title}</h2>
          {subtitle && <p className="text-xs text-base-content/60 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
    <div className="p-5 space-y-4">{children}</div>
  </div>
);

const Field = ({ label, required, className = "", children }) => (
  <div className={className}>
    <label className="label px-0 pb-1.5">
      <span className="label-text text-xs font-semibold text-base-content/70">
        {label}
        {required && <span className="text-error ml-0.5">*</span>}
      </span>
    </label>
    {children}
  </div>
);

const RemoveRowButton = ({ onClick, label = "Remove" }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn btn-ghost btn-sm text-error hover:bg-error/10 gap-1.5 shrink-0"
  >
    <FaTrashAlt className="w-3 h-3" />
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const AddRowButton = ({ onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className="btn btn-sm btn-outline btn-primary gap-1.5 font-medium normal-case"
  >
    <FaPlus className="w-3 h-3" />
    {label}
  </button>
);

const CreateSurgicalNote = () => {
  const { investigationRequestId: paramInvestigationRequestId, consultationId, patientId: paramPatientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const querySurgeryId = searchParams.get('surgeryId') || searchParams.get('id');
  const queryPatientId = searchParams.get('patientId');
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const appointmentSnapshot = location?.state?.appointmentSnapshot;
  const [loadedSurgery, setLoadedSurgery] = useState(location?.state?.editSurgery || null);
  const editSurgery = loadedSurgery;
  const isEditMode = !!editSurgery || !!querySurgeryId;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const initialPatientId =
    paramPatientId ||
    queryPatientId ||
    location?.state?.patientId ||
    appointmentSnapshot?.patientId ||
    (appointmentSnapshot?.patient && (appointmentSnapshot.patient.id || appointmentSnapshot.patient._id)) ||
    editSurgery?.patientId ||
    snapshot?.id ||
    snapshot?._id ||
    paramInvestigationRequestId;

  const [patientId, setPatientId] = useState(initialPatientId);
  const [patient, setPatient] = useState(snapshot || appointmentSnapshot?.patient || null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [latestVital, setLatestVital] = useState(null);
  const [vitalsLoading, setVitalsLoading] = useState(false);
  const [vitals, setVitals] = useState([]);
  const [sortedVitals, setSortedVitals] = useState([]);

  // Record vitals modal state (for theatre/surgery room)
  const [isRecordVitalsOpen, setIsRecordVitalsOpen] = useState(false);
  const [recordVitalsLoading, setRecordVitalsLoading] = useState(false);
  const [recordVitalsError, setRecordVitalsError] = useState("");
  const [recordVitalsForm, setRecordVitalsForm] = useState({
    bp: "",
    pulse: "",
    temperature: "",
    spo2: "",
    respiratoryRate: "",
    weight: "",
    height: "",
    notes: "",
  });

  const dependantId = location?.state?.dependantId || appointmentSnapshot?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || appointmentSnapshot?.dependant || null;
  const isViewingDependant = Boolean(dependantId);

  useEffect(() => {
    if (!patientId) return;
    let mounted = true;
    setPatientLoading(true);
    getPatientById(patientId)
      .then((res) => {
        if (mounted) setPatient(res?.data || res);
      })
      .catch((err) => {
        console.error('[SurgicalNote] Error fetching patient:', err);
      })
      .finally(() => {
        if (mounted) setPatientLoading(false);
      });
    return () => { mounted = false; };
  }, [patientId]);

  const fetchPatientVitals = async (targetId) => {
    const pid = targetId || patientId || initialPatientId;
    if (!pid) return;
    setVitalsLoading(true);
    try {
      const response = await getVitalsByPatient(pid);
      const list = normalizeVitalsResponse(response)
        .filter((vital) => (isViewingDependant ? vital.dependantId === dependantId : !vital.dependantId));
      setVitals(list);
      const latest = getLatestVital(list);
      setLatestVital(latest);
      return latest;
    } catch (err) {
      console.error("[SurgicalNote] Error fetching vitals:", err);
      setVitals([]);
      setLatestVital(null);
      return null;
    } finally {
      setVitalsLoading(false);
    }
  };

  useEffect(() => {
    const pid = patientId || initialPatientId;
    if (!pid) return;
    fetchPatientVitals(pid);
  }, [patientId, initialPatientId, dependantId, isViewingDependant]);

  useEffect(() => {
    if (vitals.length > 0) {
      setSortedVitals(sortVitalsByTime([...vitals]));
    } else {
      setSortedVitals([]);
    }
  }, [vitals]);

  const enrichedVitals = useMemo(() =>
    Array.isArray(sortedVitals)
      ? sortedVitals.map(vital => ({
          ...vital,
          date: vital.date || vital.createdAt,
          recordedByName: vital.nurseName || vital.recordedBy || 'Unknown',
          isForDependant: isViewingDependant,
        }))
      : [],
    [sortedVitals, isViewingDependant]
  );

  const enrichedLatest = useMemo(() => enrichedVitals[0] || latestVital, [enrichedVitals, latestVital]);

  // Procedure name/code combobox — sourced from past appointments (procedureName+procedureCode are
  // free-text columns on Appointment; there's no dedicated procedure catalog endpoint)
  const [procedureOptions, setProcedureOptions] = useState([]);
  const [procedureOptionsLoading, setProcedureOptionsLoading] = useState(false);
  const [procedureSearch, setProcedureSearch] = useState("");
  const [procedureDropdownOpen, setProcedureDropdownOpen] = useState(false);
  const procedureWrapperRef = React.useRef(null);

  useEffect(() => {
    let mounted = true;
    const loadProcedureOptions = async () => {
      setProcedureOptionsLoading(true);
      try {
        const res = await getAllAppointments();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const seen = new Map();
        list.forEach((appt) => {
          const name = appt?.procedureName;
          const code = appt?.procedureCode;
          if (name && code && !seen.has(name)) {
            seen.set(name, code);
          }
        });
        const options = Array.from(seen.entries()).map(([name, code]) => ({ name, code }));
        if (mounted) setProcedureOptions(options);
      } catch (err) {
        console.error('[SurgicalNote] Error fetching procedure options:', err);
        if (mounted) setProcedureOptions([]);
      } finally {
        if (mounted) setProcedureOptionsLoading(false);
      }
    };
    loadProcedureOptions();
    return () => { mounted = false; };
  }, []);

  const [activeMainTab, setActiveMainTab] = useState("surgical_note");
  const [prescriptions, setPrescriptions] = useState([{ ...initialPrescription }]);
  const [drugList, setDrugList] = useState([]);
  const [drugDropdownIndex, setDrugDropdownIndex] = useState(null);
  const [drugSearch, setDrugSearch] = useState("");
  const drugWrapperRef = React.useRef(null);

  useEffect(() => {
    let mounted = true;
    getInventories()
      .then((res) => {
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.data ?? res ?? []);
        if (mounted) setDrugList(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error('[SurgicalNote] Error fetching inventories:', err));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (drugWrapperRef.current && !drugWrapperRef.current.contains(e.target)) {
        setDrugDropdownIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!querySurgeryId || loadedSurgery) return;
    let mounted = true;
    getSurgeryById(querySurgeryId)
      .then((res) => {
        if (!mounted) return;
        const s = res?.data?.data ?? res?.data ?? res;
        if (s && (s._id || s.id)) {
          setLoadedSurgery(s);
          const pId = s.patientId || s.opdPatientId || s.dependantId;
          if (pId && !patientId) setPatientId(pId);
          if (s.patient && !patient) setPatient(s.patient);
        }
      })
      .catch((err) => console.error("[WriteSurgicalNote] Error loading surgery by ID:", err));
    return () => { mounted = false; };
  }, [querySurgeryId, loadedSurgery, patientId, patient]);

  useEffect(() => {
    if (!editSurgery) return;
    setForm((prev) => ({
      ...prev,
      procedureName: editSurgery.procedureName || "",
      procedureCode: editSurgery.procedureCode || "",
      scheduledDate: editSurgery.scheduledDate
        ? new Date(editSurgery.scheduledDate).toISOString().split("T")[0]
        : "",
      startTime: editSurgery.startTime || "",
      endTime: editSurgery.endTime || "",
      operationRoom: editSurgery.operationRoom || "",
      status: editSurgery.status || "scheduled",
      notes: editSurgery.notes || "",
      outcomes: editSurgery.outcomes || "",
      surgeonTeam: editSurgery.surgeonTeam?.length ? editSurgery.surgeonTeam : [{ surgeonName: "" }],
      surgeonAssistants: editSurgery.surgeonAssistants?.length ? editSurgery.surgeonAssistants : [{ assistantName: "" }],
      anesthesiaDosages: editSurgery.anesthesiaDosages?.length
        ? editSurgery.anesthesiaDosages.map(a => ({
            anesthesiaType: a.anesthesiaType || "",
            dosage: a.dosage || "",
            anestheticNote: a.anestheticNote || "",
          }))
        : [{ anesthesiaType: "", dosage: "", anestheticNote: "" }],
      vitalSigns: editSurgery.vitalSigns?.length ? editSurgery.vitalSigns : [{
        bloodPressure: '', heartRate: '', respiratoryRate: '', temperature: '', oxygenSaturation: '',
      }],
      postOperativeAssessments: editSurgery.postOperativeAssessment?.length ? editSurgery.postOperativeAssessment : [{ medication: "" }],
      babyAssessment: editSurgery.babyAssessment?.length ? editSurgery.babyAssessment : [{ ...initialBabyAssessment }],
      estimatedBloodLoss: editSurgery.estimatedBloodLoss ?? '',
      complications: editSurgery.complications || '',
      swabUsed: editSurgery.swabsUsed ?? '',
      specimensForHistology: editSurgery.specimensForHistology || "not_sent",
      surgicalFindings: editSurgery.surgicalFindings || "",
      procedure: editSurgery.procedure || "",
      showBaby: !!editSurgery.babyAssessment?.length,
    }));
    setProcedureSearch(editSurgery.procedureName || "");

    if (editSurgery.postOperativeAssessment?.length) {
      const existingMeds = editSurgery.postOperativeAssessment
        .filter((p) => p && (p.medication || p.drugName))
        .map((p) => {
          const raw = p.medication || p.drugName || "";
          const parsed = parseMedicationString(raw);
          const dosageMatch = parsed.dosage ? parsed.dosage.match(/^([\d.]+)\s*(.*)$/) : null;
          const durationMatch = parsed.duration ? parsed.duration.match(/^([\d.]+)\s*(.*)$/) : null;

          return {
            ...initialPrescription,
            drugName: parsed.drugName || raw,
            dosageAmount: dosageMatch ? dosageMatch[1] : (parsed.dosage || ""),
            dosageUnit: dosageMatch && dosageMatch[2] ? dosageMatch[2].toLowerCase() : 'tablet',
            frequency: parsed.frequency || '',
            durationAmount: durationMatch ? durationMatch[1] : (parsed.duration || ''),
            durationUnit: durationMatch && durationMatch[2] ? durationMatch[2].toLowerCase().replace(/s$/, '') : 'day',
            instructions: parsed.instructions || '',
          };
        });
      setPrescriptions(existingMeds.length ? existingMeds : [{ ...initialPrescription }]);
    }
  }, [editSurgery]);

  useEffect(() => {
    if (!procedureDropdownOpen) return;
    const handleClick = (e) => {
      if (procedureWrapperRef.current && !procedureWrapperRef.current.contains(e.target)) {
        setProcedureDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [procedureDropdownOpen]);

  const filteredProcedureOptions = useMemo(() => {
    const q = (procedureSearch || "").toLowerCase();
    if (!q) return procedureOptions;
    return procedureOptions.filter((p) => p.name.toLowerCase().includes(q));
  }, [procedureOptions, procedureSearch]);

  const selectProcedure = (option) => {
    setForm((prev) => ({ ...prev, procedureName: option.name, procedureCode: option.code }));
    setProcedureSearch(option.name);
    setProcedureDropdownOpen(false);
  };


  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  // Patient ID logic: prefer hospitalId, fallback to id, then param patientId
  const displayPatientId = useMemo(() => (
    patient?.hospitalId || patient?.id || patientId || "—"
  ), [patient, patientId]);

  const summarySubject = useMemo(() => {
    const subject = isViewingDependant ? dependantSnapshot || {} : patient || {};
    const guardian = isViewingDependant ? subject.patient || patient || {} : subject;
    return {
      id: subject.id || subject._id || patientId,
      fullName: patientName || "Unknown Patient",
      gender: subject.gender || "—",
      phone: subject.phone || subject.phoneNumber || guardian.phone || guardian.phoneNumber || "—",
      hospitalId: guardian.hospitalId || patient?.hospitalId || patientId || "—",
      status: subject.status || guardian.status || "Unknown",
      statusSenderName: subject.statusSenderName || guardian.statusSenderName,
      statusUser: subject.statusUser || guardian.statusUser,
      updatedAt: subject.updatedAt || guardian.updatedAt,
      dob: subject.dob || subject.dateOfBirth || subject.birthDate,
      cardType: subject.cardType || guardian.cardType || "personal",
      familyName: subject.familyName || guardian.familyName || guardian.lastName,
      companyName: subject.companyName || guardian.companyName,
      hmos: Array.isArray(guardian.hmos)
        ? guardian.hmos.filter((hmo) => !isViewingDependant || hmo.dependantId === dependantId)
        : [],
      relationshipType: subject.relationshipType,
    };
  }, [dependantId, dependantSnapshot, isViewingDependant, patient, patientId, patientName]);

  const effectivePatientId = useMemo(() => (
    patientId ||
    patient?.id ||
    patient?._id ||
    appointmentSnapshot?.patientId ||
    (appointmentSnapshot?.patient && (appointmentSnapshot.patient.id || appointmentSnapshot.patient._id)) ||
    summarySubject?.id
  ), [patientId, patient, appointmentSnapshot, summarySubject]);

  const [form, setForm] = useState({
    procedureName: "",
    procedureCode: "",
    scheduledDate: "",
    startTime: "",
    endTime: "",
    operationRoom: "",
    status: "scheduled",
    notes: "",
    outcomes: "",
    surgeonTeam: [{ surgeonName: "" }],
    surgeonAssistants: [{ assistantName: "" }],
    anesthesiaDosages: [{ anesthesiaType: "", dosage: "", anestheticNote: "" }],
    vitalSigns: [{
      bloodPressure: '',
      heartRate: '',
      respiratoryRate: '',
      temperature: '',
      oxygenSaturation: '',
    }],
    postOperativeAssessments: [{ medication: "" }],
    babyAssessment: [{ ...initialBabyAssessment }],
    estimatedBloodLoss: '',
    complications: '',
    swabUsed: '',
    specimensForHistology: "not_sent",
    surgicalFindings: "",
    procedure: "",
    showBaby: false,
  });

  // Handle submitting vitals recorded in surgery / theatre room
  const handleRecordVitalsSubmit = async (e) => {
    e.preventDefault();
    setRecordVitalsError("");

    const hasReading =
      recordVitalsForm.bp ||
      recordVitalsForm.pulse ||
      recordVitalsForm.temperature ||
      recordVitalsForm.spo2 ||
      recordVitalsForm.respiratoryRate ||
      recordVitalsForm.weight ||
      recordVitalsForm.height;

    if (!hasReading) {
      setRecordVitalsError("Please enter at least one vital sign measurement.");
      return;
    }

    setRecordVitalsLoading(true);
    try {
      const targetId = effectivePatientId || patientId || initialPatientId;
      const payload = {
        patientId: targetId,
        dependantId: dependantId || undefined,
        consultationId: consultationId || undefined,
        bp: recordVitalsForm.bp ? recordVitalsForm.bp.trim() : undefined,
        pulse: recordVitalsForm.pulse ? Number(recordVitalsForm.pulse) : undefined,
        temperature: recordVitalsForm.temperature ? Number(recordVitalsForm.temperature) : undefined,
        spo2: recordVitalsForm.spo2 ? Number(recordVitalsForm.spo2) : undefined,
        respiratoryRate: recordVitalsForm.respiratoryRate ? Number(recordVitalsForm.respiratoryRate) : undefined,
        weight: recordVitalsForm.weight ? Number(recordVitalsForm.weight) : undefined,
        height: recordVitalsForm.height ? Number(recordVitalsForm.height) : undefined,
        notes: recordVitalsForm.notes ? recordVitalsForm.notes.trim() : "Recorded in Theatre / Surgery room",
      };

      await createVital(payload);

      // Auto-sync into theatre vital signs form immediately
      const bp = recordVitalsForm.bp ? recordVitalsForm.bp.trim() : "";
      const hr = recordVitalsForm.pulse ? String(recordVitalsForm.pulse) : "";
      const rr = recordVitalsForm.respiratoryRate ? String(recordVitalsForm.respiratoryRate) : "";
      const temp = recordVitalsForm.temperature ? String(recordVitalsForm.temperature) : "";
      const o2 = recordVitalsForm.spo2 ? String(recordVitalsForm.spo2) : "";

      setForm((prev) => {
        const existing = prev.vitalSigns || [];
        const updatedFirst = {
          bloodPressure: bp || existing[0]?.bloodPressure || "",
          heartRate: hr || existing[0]?.heartRate || "",
          respiratoryRate: rr || existing[0]?.respiratoryRate || "",
          temperature: temp || existing[0]?.temperature || "",
          oxygenSaturation: o2 || existing[0]?.oxygenSaturation || "",
        };
        return {
          ...prev,
          vitalSigns: [updatedFirst, ...existing.slice(1)],
        };
      });

      await fetchPatientVitals(targetId);

      toast.success("Vitals recorded and auto-synced to surgery notes!");
      setIsRecordVitalsOpen(false);
      setRecordVitalsForm({
        bp: "",
        pulse: "",
        temperature: "",
        spo2: "",
        respiratoryRate: "",
        weight: "",
        height: "",
        notes: "",
      });
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Failed to record vitals";
      setRecordVitalsError(msg);
      toast.error(msg);
    } finally {
      setRecordVitalsLoading(false);
    }
  };

  // Auto-sync theatre vitals on initial load or whenever latest vitals change
  useEffect(() => {
    if (isEditMode) return;
    const v = enrichedLatest || latestVital;
    if (!v) return;

    const bp = v.bp || v.bloodPressure || '';
    const hr = v.pulse ? String(v.pulse) : (v.heartRate ? String(v.heartRate) : '');
    const rr = v.respiratoryRate ? String(v.respiratoryRate) : '';
    const temp = v.temperature ? String(v.temperature) : '';
    const o2 = v.spo2 ? String(v.spo2) : (v.oxygenSaturation ? String(v.oxygenSaturation) : '');

    if (!bp && !hr && !rr && !temp && !o2) return;

    setForm((prev) => {
      const existing = prev.vitalSigns || [];
      const first = existing[0] || {};
      const isFirstEmpty = !first.bloodPressure && !first.heartRate && !first.respiratoryRate && !first.temperature && !first.oxygenSaturation;
      if (!isFirstEmpty) return prev;

      return {
        ...prev,
        vitalSigns: [{
          bloodPressure: bp,
          heartRate: hr,
          respiratoryRate: rr,
          temperature: temp,
          oxygenSaturation: o2,
        }, ...(prev.vitalSigns?.slice(1) || [])],
      };
    });
  }, [enrichedLatest, latestVital, isEditMode]);

  // Prescription field handlers for post-operative recovery
  const handlePrescriptionChange = (idx, field, value) => {
    setPrescriptions((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSelectDrug = (idx, drug) => {
    const medType = prescriptions[idx]?.medicationType || 'tablet';
    const opts = getUnitOptions(medType, drug);
    setPrescriptions((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              drugName: drug.name,
              inventoryId: drug._id || drug.id,
              availability: 'available',
              _selectedDrug: drug,
              dosageUnit: opts[0]?.value || item.dosageUnit || '',
            }
          : item
      )
    );
    setDrugDropdownIndex(null);
    setDrugSearch('');
  };

  const handleSelectUnavailableDrug = (idx, customName) => {
    setPrescriptions((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              drugName: customName,
              inventoryId: null,
              availability: 'unavailable',
              _selectedDrug: null,
            }
          : item
      )
    );
    setDrugDropdownIndex(null);
    setDrugSearch('');
  };

  const addPrescriptionRow = () => {
    setPrescriptions((prev) => [...prev, { ...initialPrescription }]);
  };

  const removePrescriptionRow = (idx) => {
    setPrescriptions((prev) => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    if (!appointmentSnapshot) return;
    const appointmentPatientId = appointmentSnapshot.patientId || appointmentSnapshot.patient?.id || appointmentSnapshot.patient?._id;
    if (appointmentPatientId && !patientId) {
      setPatientId(appointmentPatientId);
    }
    if (appointmentSnapshot.patient && !patient) {
      setPatient(appointmentSnapshot.patient);
    } else if (appointmentPatientId && !patient) {
      getPatientById(appointmentPatientId)
        .then((res) => setPatient(res?.data || res))
        .catch(() => setPatient(null));
    }
  }, [appointmentSnapshot, patientId, patient]);

  useEffect(() => {
    if (!appointmentSnapshot) return;
    setForm((prev) => ({
      ...prev,
      procedureName: appointmentSnapshot.procedureName || prev.procedureName,
      procedureCode: appointmentSnapshot.procedureCode || prev.procedureCode,
      scheduledDate: appointmentSnapshot.appointmentDate
        ? new Date(appointmentSnapshot.appointmentDate).toISOString().split('T')[0]
        : prev.scheduledDate,
      startTime: appointmentSnapshot.appointmentTime || prev.startTime,
      notes: appointmentSnapshot.notes || prev.notes,
    }));
    if (appointmentSnapshot.procedureName) {
      setProcedureSearch(appointmentSnapshot.procedureName);
    }
  }, [appointmentSnapshot]);

  // Handlers for dynamic fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleListChange = (list, idx, value, key = null) => {
    setForm((prev) => ({
      ...prev,
      [list]: prev[list].map((item, i) =>
        i === idx ? (key ? { ...item, [key]: value } : value) : item
      ),
    }));
  };

  const addToList = (list, empty) => {
    setForm((prev) => ({ ...prev, [list]: [...prev[list], empty] }));
  };

  const removeFromList = (list, idx) => {
    setForm((prev) => ({ ...prev, [list]: prev[list].filter((_, i) => i !== idx) }));
  };

  // Baby assessment handlers
  const handleBabyChange = (idx, e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      babyAssessment: prev.babyAssessment.map((b, i) =>
        i === idx ? { ...b, [name]: value } : b
      ),
    }));
  };

  const handleApgarChange = (idx, e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      babyAssessment: prev.babyAssessment.map((b, i) =>
        i === idx
          ? { ...b, apgarScore: { ...b.apgarScore, [name]: value } }
          : b
      ),
    }));
  };

  const validateForm = () => {
    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      toast("End time must be after start time.");
      return false;
    }

    if (form.estimatedBloodLoss && Number(form.estimatedBloodLoss) < 0) {
      toast("Estimated blood loss cannot be negative.");
      return false;
    }

    if (form.swabUsed && Number(form.swabUsed) < 0) {
      toast("Number of swabs used cannot be negative.");
      return false;
    }

    for (const v of form.vitalSigns) {
      const fields = ["heartRate", "respiratoryRate", "temperature", "oxygenSaturation"];
      for (const f of fields) {
        if (v[f] && Number(v[f]) < 0) {
          toast("Vital sign values cannot be negative.");
          return false;
        }
      }
    }

    if (form.showBaby) {
      for (const b of form.babyAssessment) {
        const fields = ["weight", "length", "headCircumference", "abdominalCircumference", "randomBloodSugar"];
        for (const f of fields) {
          if (b[f] && Number(b[f]) < 0) {
            toast("Baby assessment measurements cannot be negative.");
            return false;
          }
        }
        const apgarFields = ["appearance", "pulse", "grimace", "activity", "respiration"];
        for (const f of apgarFields) {
          const val = b.apgarScore[f];
          if (val !== "" && (Number(val) < 0 || Number(val) > 2)) {
            toast("Apgar scores must be between 0 and 2.");
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateForm()) return;
    setSaving(true);

    const effectivePatientId =
      patientId ||
      patient?.id ||
      patient?._id ||
      appointmentSnapshot?.patientId ||
      (appointmentSnapshot?.patient && (appointmentSnapshot.patient.id || appointmentSnapshot.patient._id));

    if (!effectivePatientId) {
      toast.error("No patient selected for this surgical note. Please go back to Incoming.");
      setSaving(false);
      return;
    }

    // Prepare post-operative medications summary from prescriptions
    const validPrescriptions = prescriptions.filter(p => p.drugName && p.drugName.trim());
    const formattedPostOps = validPrescriptions.map(p => {
      const durationStr = p.durationAmount
        ? `${p.durationAmount} ${p.durationUnit}${Number(p.durationAmount) > 1 ? 's' : ''}`
        : '';
      const parts = [
        p.drugName.trim(),
        p.dosageAmount ? `${p.dosageAmount} ${p.dosageUnit || ''}`.trim() : '',
        p.frequency ? p.frequency.trim() : '',
        durationStr ? `for ${durationStr}` : '',
        p.instructions ? `(${p.instructions.trim()})` : ''
      ].filter(Boolean);
      return { medication: parts.join(' | ') };
    });

    // Prepare payload to match ISurgery
    const payload = {
      ...form,
      procedure: form.procedure ? form.procedure.trim() : undefined,
      appointmentId: appointmentSnapshot?._id || appointmentSnapshot?.id || undefined,
      patientId: effectivePatientId,
      dependantId: dependantId || undefined,
      surgeonTeam: form.surgeonTeam.filter((s) => s.surgeonName.trim()),
      surgeonAssistants: form.surgeonAssistants.filter((a) => a.assistantName.trim()),
      anesthesiaDosages: form.anesthesiaDosages.map(a => ({
        anesthesiaType: a.anesthesiaType?.trim() || "",
        dosage: a.dosage?.trim() || "",
        anestheticNote: a.anestheticNote?.trim() || "",
      })).filter((a) => a.anesthesiaType || a.dosage || a.anestheticNote),
      estimatedBloodLoss: form.estimatedBloodLoss ? Number(form.estimatedBloodLoss) : undefined,
      swabUsed: form.swabUsed ? Number(form.swabUsed) : undefined,
      babyAssessment: form.showBaby ? form.babyAssessment.map((b) => ({
        ...b,
        weight: b.weight ? Number(b.weight) : undefined,
        length: b.length ? Number(b.length) : undefined,
        headCircumference: b.headCircumference ? Number(b.headCircumference) : undefined,
        abdominalCircumference: b.abdominalCircumference ? Number(b.abdominalCircumference) : undefined,
        randomBloodSugar: b.randomBloodSugar ? Number(b.randomBloodSugar) : undefined,
        deliveryTime: b.deliveryTime || undefined,
        apgarScore: {
          appearance: b.apgarScore.appearance ? Number(b.apgarScore.appearance) : undefined,
          pulse: b.apgarScore.pulse ? Number(b.apgarScore.pulse) : undefined,
          grimace: b.apgarScore.grimace ? Number(b.apgarScore.grimace) : undefined,
          activity: b.apgarScore.activity ? Number(b.apgarScore.activity) : undefined,
          respiration: b.apgarScore.respiration ? Number(b.apgarScore.respiration) : undefined,
        },
      })) : undefined,
      vitalSigns: form.vitalSigns
        .filter((v) => v.bloodPressure || v.heartRate || v.respiratoryRate || v.temperature || v.oxygenSaturation)
        .map((v) => ({
          bloodPressure: v.bloodPressure ? String(v.bloodPressure).trim() : undefined,
          heartRate: v.heartRate !== '' && v.heartRate !== undefined ? Number(v.heartRate) : undefined,
          respiratoryRate: v.respiratoryRate !== '' && v.respiratoryRate !== undefined ? Number(v.respiratoryRate) : undefined,
          temperature: v.temperature !== '' && v.temperature !== undefined ? Number(v.temperature) : undefined,
          oxygenSaturation: v.oxygenSaturation !== '' && v.oxygenSaturation !== undefined ? Number(v.oxygenSaturation) : undefined,
        })),
      postOperativeAssessment: formattedPostOps.length
        ? formattedPostOps
        : form.postOperativeAssessments
            .filter((m) => m.medication?.trim())
            .map((m) => ({ medication: m.medication.trim() })),
    };

    try {
      let surgeryResult = null;
      const targetSurgeryId = editSurgery?._id || editSurgery?.id || querySurgeryId;
      if (isEditMode && targetSurgeryId) {
        surgeryResult = await updateSurgery(targetSurgeryId, payload);
        toast.success("Surgical note updated successfully!");
      } else {
        surgeryResult = await createSurgery(payload);
        toast.success("Surgical note submitted successfully!");
      }

      const createdSurgeryId = (
        surgeryResult?.data?._id ||
        surgeryResult?.data?.id ||
        surgeryResult?._id ||
        surgeryResult?.id ||
        targetSurgeryId
      );

      // Create prescription in pharmacy queue if medications were entered
      if (validPrescriptions.length > 0) {
        try {
          const rxMedications = validPrescriptions.map((med) => {
            const normalizedDuration = buildDurationString(med.durationAmount, med.durationUnit) || (med.durationAmount ? `${med.durationAmount}/7` : '1/7');
            const dosageUnitLabel = med.dosageUnit === 'tablet'
              ? (Number(med.dosageAmount) === 1 ? 'tablet' : 'tablets')
              : (med.dosageUnit || 'tablet');
            return {
              medicationType: med.medicationType || 'tablet',
              drugName: med.drugName.trim(),
              dosage: `${med.dosageAmount || 1} ${dosageUnitLabel}`,
              dosageAmount: med.dosageAmount ? Number(med.dosageAmount) : 1,
              dosageUnit: med.dosageUnit || 'tablet',
              frequency: med.frequency || 'STAT',
              duration: normalizedDuration,
              instructions: med.instructions ? med.instructions.trim() : undefined,
              inventoryId: med.inventoryId || null,
              availability: med.availability || 'available',
              dosesGiven: ['injection', 'subcutaneous'].includes(med.medicationType) ? 0 : undefined,
              injectionStatus: ['injection', 'subcutaneous'].includes(med.medicationType) ? 'pending' : undefined,
            };
          });

          await createPrescription({
            patientId: effectivePatientId,
            ...(dependantId ? { dependantId } : {}),
            ...(consultationId ? { consultationId } : {}),
            surgeryId: createdSurgeryId,
            status: 'pending',
            medications: rxMedications,
          }, createdSurgeryId, 'surgery');

          // Explicitly update patient / dependant status to awaiting_pharmacy so Pharmacist sees them in their queue
          try {
            if (dependantId) {
              await updateDependantStatus(dependantId, { status: PATIENT_STATUS.AWAITING_PHARMACY });
            } else if (effectivePatientId) {
              await updatePatientStatus(effectivePatientId, { status: PATIENT_STATUS.AWAITING_PHARMACY });
            }
          } catch (stErr) {
            console.warn("[SurgicalNote] Status update error:", stErr);
          }

          toast.success("Post-operative prescriptions sent to pharmacy!");
        } catch (rxErr) {
          console.warn("[SurgicalNote] Failed to submit prescription order:", rxErr);
        }
      }

      const isFromHistory = location?.state?.from === "history" || !!querySurgeryId;
      navigate(
        isFromHistory
          ? '/dashboard/surgeon/surgical-notes'
          : fromIncoming
          ? '/dashboard/surgeon/incoming'
          : consultationId
          ? `/dashboard/medical-director/medical-history/${effectivePatientId}/consultation/${consultationId}`
          : '/dashboard/surgeon/surgical-notes',
        { state: { from: fromIncoming ? "incoming" : "history", patientSnapshot: patient } },
      );
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      setError("Failed to submit surgical note.\n" + message);
      toast.error(message || "Failed to submit surgical note.");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = Boolean(
    patientId ||
    patient?.id ||
    patient?._id ||
    appointmentSnapshot?.patientId
  );

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex flex-col gap-4 p-3 sm:p-4 lg:p-5 h-full">
          {/* PAGE HEADER */}
          <PatientHeaderActions
            title="Surgical Note"
            subtitle="Document the procedure, team, and post-operative care"
            fromIncoming={fromIncoming}
            onBack={() =>
              navigate(
                location?.state?.from === "history" || !!querySurgeryId
                  ? "/dashboard/surgeon/surgical-notes"
                  : fromIncoming
                  ? "/dashboard/surgeon/incoming"
                  : "/dashboard/surgeon/appointments"
              )
            }
          />


          {error && (
            <div className="alert alert-error text-sm shadow-sm whitespace-pre-line">
              {error}
            </div>
          )}

          {/* Patient Info */}
          <PatientDetailsCard
            patientId={patientId}
            patient={patient}
            summarySubject={summarySubject}
            isViewingDependant={isViewingDependant}
          />

          {/* Centered Main Tab Switcher */}
          <div className="flex justify-center w-full my-1">
            <div className="tabs tabs-boxed bg-base-100 p-1.5 shadow-sm border border-base-200 rounded-2xl gap-2 inline-flex">
              <button
                type="button"
                className={`tab px-6 py-2 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
                  activeMainTab === 'surgical_note'
                    ? 'tab-active bg-primary text-white shadow-sm'
                    : 'hover:bg-base-200 text-base-content/70'
                }`}
                onClick={() => setActiveMainTab('surgical_note')}
              >
                <FaProcedures className="w-4 h-4" />
                Surgical Note
              </button>
              <button
                type="button"
                className={`tab px-6 py-2 rounded-xl font-bold transition-all duration-200 flex items-center gap-2 ${
                  activeMainTab === 'blood_transfusion'
                    ? 'tab-active bg-error text-white shadow-sm'
                    : 'hover:bg-base-200 text-base-content/70'
                }`}
                onClick={() => setActiveMainTab('blood_transfusion')}
              >
                <FaTint className={`w-4 h-4 ${activeMainTab === 'blood_transfusion' ? 'text-white' : 'text-error'}`} />
                Blood Transfusion
              </button>
            </div>
          </div>

          {activeMainTab === 'blood_transfusion' ? (
            <div className="card bg-base-100 border border-base-200 shadow-sm p-4 sm:p-6">
              <BloodTransfusionTab
                patientId={effectivePatientId}
                dependantId={dependantId}
                consultationId={consultationId}
                admissionId={loadedSurgery?.admissionId || editSurgery?.admissionId || undefined}
                isDoctor={true}
              />
            </div>
          ) : (
            <>
              {/* Vitals Overview */}
              <div className="grid grid-cols-1 gap-6">
                <CurrentVitalsCard
                  patient={summarySubject}
                  latest={enrichedLatest}
                  loading={vitalsLoading}
                  onRecordOpen={() => setIsRecordVitalsOpen(true)}
                  buttonHidden={false}
                />
              </div>

              <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* PROCEDURE & SCHEDULING */}
            <SectionCard
              icon={FaProcedures}
              title="Procedure & Scheduling"
              subtitle="What's being done, and when"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Procedure Name" required>
                  <div ref={procedureWrapperRef} className="relative w-full">
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder={procedureOptionsLoading ? "Loading procedures..." : "Search or type procedure name..."}
                      value={procedureSearch || form.procedureName}
                      onChange={(e) => {
                        const value = e.target.value;
                        setProcedureSearch(value);
                        setProcedureDropdownOpen(true);
                        // Allow free typing; keep procedureName in sync so a manually-typed
                        // name still submits even if it isn't in the options list
                        setForm((prev) => ({ ...prev, procedureName: value }));
                      }}
                      onFocus={() => setProcedureDropdownOpen(true)}
                      autoComplete="off"
                      required
                    />
                    {procedureDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {filteredProcedureOptions.length > 0 ? (
                          <ul className="py-1">
                            {filteredProcedureOptions.map((option) => (
                              <li
                                key={option.name}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  selectProcedure(option);
                                }}
                                className="px-4 py-2 hover:bg-base-200 cursor-pointer text-sm text-base-content flex justify-between items-center"
                              >
                                <span>{option.name}</span>
                                <span className="text-xs text-base-content/40 ml-2 font-mono">{option.code}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="py-2 px-4 text-base-content/40 text-sm">
                            {procedureOptionsLoading ? "Loading..." : "No matching past procedures — you can type a new one"}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Field>

                <Field label="Procedure Code">
                  <input
                    name="procedureCode"
                    value={form.procedureCode}
                    onChange={handleChange}
                    className="input input-bordered w-full"
                    placeholder="Auto-filled from procedure name, or enter manually"
                  />
                </Field>

                <Field label="Schedule Date" required>
                  <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange} className="input input-bordered w-full" required />
                </Field>

                <Field label="Status">
                  <select name="status" value={form.status} onChange={handleChange} className="select select-bordered w-full">
                    <option value="scheduled">Scheduled</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </Field>

                <Field label="Start Time">
                  <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="input input-bordered w-full" />
                </Field>

                <Field label="End Time">
                  <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="input input-bordered w-full" />
                </Field>

                <Field label="Operation Room" className="md:col-span-2">
                  <input name="operationRoom" value={form.operationRoom} onChange={handleChange} className="input input-bordered w-full md:w-1/2" required />
                </Field>
              </div>
            </SectionCard>

            {/* SURGICAL TEAM */}
            <SectionCard
              icon={FaUserMd}
              title="Surgical Team"
              subtitle="Lead surgeons and assisting staff"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Field label="Surgeons" required>
                    <div className="space-y-2">
                      {form.surgeonTeam.map((s, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            placeholder="Surgeon name"
                            value={s.surgeonName}
                            onChange={e => handleListChange('surgeonTeam', i, e.target.value, 'surgeonName')}
                            className="input input-bordered flex-1"
                            required
                          />
                          {form.surgeonTeam.length > 1 && (
                            <RemoveRowButton onClick={() => removeFromList('surgeonTeam', i)} />
                          )}
                        </div>
                      ))}
                    </div>
                  </Field>
                  <div className="mt-2">
                    <AddRowButton label="Add Surgeon" onClick={() => addToList('surgeonTeam', { surgeonName: "" })} />
                  </div>
                </div>

                <div>
                  <Field label="Assistants">
                    <div className="space-y-2">
                      {form.surgeonAssistants.map((a, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            placeholder="Assistant name"
                            value={a.assistantName}
                            onChange={e => handleListChange('surgeonAssistants', i, e.target.value, 'assistantName')}
                            className="input input-bordered flex-1"
                          />
                          {form.surgeonAssistants.length > 1 && (
                            <RemoveRowButton onClick={() => removeFromList('surgeonAssistants', i)} />
                          )}
                        </div>
                      ))}
                    </div>
                  </Field>
                  <div className="mt-2">
                    <AddRowButton label="Add Assistant" onClick={() => addToList('surgeonAssistants', { assistantName: "" })} />
                  </div>
                </div>
              </div>
            </SectionCard>

            {/* ANESTHESIA */}
            <SectionCard
              icon={FaSyringe}
              title="Anesthesia"
              subtitle="Type and dosage administered"
              tone="secondary"
            >
              <div className="space-y-4">
                {form.anesthesiaDosages.map((a, i) => (
                  <div key={i} className="flex flex-col gap-3 p-3.5 rounded-xl bg-base-200/40 border border-base-200 relative">
                    {form.anesthesiaDosages.length > 1 && (
                      <div className="absolute top-2 right-2">
                        <RemoveRowButton onClick={() => removeFromList('anesthesiaDosages', i)} />
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <Field label="Anesthesia Type">
                        <input
                          placeholder="e.g. General, Local, Spinal"
                          value={a.anesthesiaType || ""}
                          onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'anesthesiaType')}
                          className="input input-bordered w-full"
                        />
                      </Field>
                      <Field label="Dosage">
                        <input
                          placeholder="e.g. 50mg, 10ml"
                          value={a.dosage || ""}
                          onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'dosage')}
                          className="input input-bordered w-full"
                        />
                      </Field>
                      <Field label="Anesthetic Note" className="md:col-span-2">
                        <textarea
                          placeholder="Enter anesthetic notes or remarks..."
                          value={a.anestheticNote || ""}
                          onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'anestheticNote')}
                          className="textarea textarea-bordered w-full"
                          rows={3}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2">
                <AddRowButton label="Add Anesthesia" onClick={() => addToList('anesthesiaDosages', { anesthesiaType: "", dosage: "", anestheticNote: "" })} />
              </div>
            </SectionCard>

            {/* VITAL SIGNS */}
            <SectionCard
              icon={FaHeartbeat}
              title="Vital Signs (Theatre)"
              subtitle="Readings taken during the procedure"
              tone="error"
            >
              <div className="space-y-3">
                {form.vitalSigns.map((v, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-base-200/40 border border-base-200 relative">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                        Reading #{i + 1}
                      </span>
                      {form.vitalSigns.length > 1 && (
                        <RemoveRowButton onClick={() => removeFromList('vitalSigns', i)} />
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-base-content/70 mb-1 flex items-center justify-between">
                          <span>Blood Pressure</span>
                          <span className="text-[10px] text-primary font-bold">mmHg</span>
                        </label>
                        <div className="flex items-center rounded-lg border border-base-300 bg-base-100 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                          <input
                            name="bloodPressure"
                            placeholder="120/80"
                            value={v.bloodPressure}
                            onChange={e => handleListChange('vitalSigns', i, e.target.value, 'bloodPressure')}
                            className="input input-sm border-0 focus:outline-none flex-1 font-mono px-2.5"
                          />
                          <span className="px-2 text-[11px] text-base-content/60 bg-base-200/50 font-semibold border-l border-base-300 py-1.5 shrink-0">
                            mmHg
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-base-content/70 mb-1 flex items-center justify-between">
                          <span>Heart Rate</span>
                          <span className="text-[10px] text-secondary font-bold">bpm</span>
                        </label>
                        <div className="flex items-center rounded-lg border border-base-300 bg-base-100 overflow-hidden focus-within:border-secondary focus-within:ring-1 focus-within:ring-secondary/20">
                          <input
                            name="heartRate"
                            type="number"
                            placeholder="70"
                            value={v.heartRate}
                            onChange={e => handleListChange('vitalSigns', i, e.target.value, 'heartRate')}
                            className="input input-sm border-0 focus:outline-none flex-1 font-mono px-2.5"
                          />
                          <span className="px-2 text-[11px] text-base-content/60 bg-base-200/50 font-semibold border-l border-base-300 py-1.5 shrink-0">
                            bpm
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-base-content/70 mb-1 flex items-center justify-between">
                          <span>Resp. Rate</span>
                          <span className="text-[10px] text-info font-bold">bpm</span>
                        </label>
                        <div className="flex items-center rounded-lg border border-base-300 bg-base-100 overflow-hidden focus-within:border-info focus-within:ring-1 focus-within:ring-info/20">
                          <input
                            name="respiratoryRate"
                            type="number"
                            placeholder="20"
                            value={v.respiratoryRate}
                            onChange={e => handleListChange('vitalSigns', i, e.target.value, 'respiratoryRate')}
                            className="input input-sm border-0 focus:outline-none flex-1 font-mono px-2.5"
                          />
                          <span className="px-2 text-[11px] text-base-content/60 bg-base-200/50 font-semibold border-l border-base-300 py-1.5 shrink-0">
                            bpm
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-base-content/70 mb-1 flex items-center justify-between">
                          <span>Temperature</span>
                          <span className="text-[10px] text-warning font-bold">°C</span>
                        </label>
                        <div className="flex items-center rounded-lg border border-base-300 bg-base-100 overflow-hidden focus-within:border-warning focus-within:ring-1 focus-within:ring-warning/20">
                          <input
                            name="temperature"
                            type="number"
                            step="any"
                            placeholder="37.0"
                            value={v.temperature}
                            onChange={e => handleListChange('vitalSigns', i, e.target.value, 'temperature')}
                            className="input input-sm border-0 focus:outline-none flex-1 font-mono px-2.5"
                          />
                          <span className="px-2 text-[11px] text-base-content/60 bg-base-200/50 font-semibold border-l border-base-300 py-1.5 shrink-0">
                            °C
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-base-content/70 mb-1 flex items-center justify-between">
                          <span>Oxygen (SpO2)</span>
                          <span className="text-[10px] text-primary font-bold">%</span>
                        </label>
                        <div className="flex items-center rounded-lg border border-base-300 bg-base-100 overflow-hidden focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                          <input
                            name="oxygenSaturation"
                            type="number"
                            placeholder="98"
                            value={v.oxygenSaturation}
                            onChange={e => handleListChange('vitalSigns', i, e.target.value, 'oxygenSaturation')}
                            className="input input-sm border-0 focus:outline-none flex-1 font-mono px-2.5"
                          />
                          <span className="px-2 text-[11px] text-base-content/60 bg-base-200/50 font-semibold border-l border-base-300 py-1.5 shrink-0">
                            %
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <AddRowButton label="Add Vital Sign" onClick={() => addToList('vitalSigns', { bloodPressure: '', heartRate: '', respiratoryRate: '', temperature: '', oxygenSaturation: '' })} />
            </SectionCard>

            {/* FINDINGS & OUTCOME */}
            <SectionCard
              icon={FaClipboardList}
              title="Findings & Outcome"
              subtitle="Operative summary and post-op status"
              tone="info"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Surgical Findings" className="md:col-span-2">
                  <textarea name="surgicalFindings" value={form.surgicalFindings} onChange={handleChange} className="textarea textarea-bordered w-full" rows={3} />
                </Field>

                <Field label="Procedure" className="md:col-span-2">
                  <textarea
                    name="procedure"
                    value={form.procedure || ""}
                    onChange={handleChange}
                    className="textarea textarea-bordered w-full"
                    rows={3}
                    placeholder="Enter detailed surgical procedure performed..."
                  />
                </Field>

                <Field label="Estimated Blood Loss (EBL)">
                  <input name="estimatedBloodLoss" value={form.estimatedBloodLoss} onChange={handleChange} className="input input-bordered w-full" />
                </Field>

                <Field label="No. of Swabs Used">
                  <input name="swabUsed" value={form.swabUsed} onChange={handleChange} className="input input-bordered w-full" />
                </Field>

                <Field label="Specimens for Histology" className="md:col-span-2">
                  <div className="flex gap-6 pt-1">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="specimensForHistology" value="sent" checked={form.specimensForHistology === "sent"} onChange={handleChange} className="radio radio-sm radio-primary" />
                      Sent
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="radio" name="specimensForHistology" value="not_sent" checked={form.specimensForHistology === "not_sent"} onChange={handleChange} className="radio radio-sm radio-primary" />
                      Not Sent
                    </label>
                  </div>
                </Field>

                <Field label="Complications">
                  <textarea name="complications" value={form.complications} onChange={handleChange} className="textarea textarea-bordered w-full" rows={2} />
                </Field>

                <Field label="Outcomes">
                  <textarea name="outcomes" value={form.outcomes} onChange={handleChange} className="textarea textarea-bordered w-full" rows={2} />
                </Field>
              </div>
            </SectionCard>

            {/* POST-OPERATIVE MEDICATIONS */}
            <SectionCard
              icon={FaPills}
              title="Post-Operative Medications"
              subtitle="Prescribed for recovery and post-op care"
              tone="accent"
            >
              <div className="space-y-4">
                {prescriptions.map((p, idx) => {
                  const medicationType = p.medicationType || 'tablet';
                  const unitOptions = getUnitOptions(medicationType, p._selectedDrug);
                  const isInjectionType = ['injection', 'infusion', 'subcutaneous'].includes(medicationType);
                  const freqList = isInjectionType ? INJECTION_FREQUENCIES : ORAL_FREQUENCIES;

                  return (
                    <div
                      key={idx}
                      className="p-3.5 sm:p-4 rounded-xl bg-base-200/40 border border-base-200 relative transition-all"
                    >
                      {/* Row Header: Label & Remove */}
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-base-200">
                        <div className="flex items-center gap-2">
                          <span className="badge badge-primary badge-sm font-bold">Rx #{idx + 1}</span>
                          <span className="text-xs font-semibold text-base-content/70">Medication Category</span>
                        </div>
                        {prescriptions.length > 1 && (
                          <RemoveRowButton onClick={() => removePrescriptionRow(idx)} />
                        )}
                      </div>

                      {/* Compact Medication Tabs */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {MEDICATION_TABS.map((tab) => {
                          const Icon = tab.icon;
                          const active = medicationType === tab.value;
                          return (
                            <button
                              key={tab.value}
                              type="button"
                              className={`btn btn-xs gap-1.5 rounded-lg normal-case font-medium transition-all ${
                                active
                                  ? 'btn-primary text-white shadow-xs'
                                  : 'btn-ghost bg-base-100 hover:bg-base-200 border border-base-200 text-base-content/70'
                              }`}
                              onClick={() => {
                                const opts = getUnitOptions(tab.value, null);
                                handlePrescriptionChange(idx, 'medicationType', tab.value);
                                handlePrescriptionChange(idx, 'frequency', '');
                                handlePrescriptionChange(idx, 'drugName', '');
                                handlePrescriptionChange(idx, '_selectedDrug', null);
                                handlePrescriptionChange(idx, 'inventoryId', null);
                                handlePrescriptionChange(idx, 'availability', undefined);
                                handlePrescriptionChange(idx, 'dosageAmount', '');
                                handlePrescriptionChange(idx, 'durationAmount', '');
                                handlePrescriptionChange(idx, 'durationUnit', 'day');
                                handlePrescriptionChange(idx, 'dosageUnit', opts[0]?.value || '');
                              }}
                            >
                              <Icon className="w-3 h-3" />
                              <span className="text-xs">{tab.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Fields Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {/* Drug Name Autocomplete */}
                        <div className="sm:col-span-2 relative" ref={drugDropdownIndex === idx ? drugWrapperRef : null}>
                          <label className="text-xs font-semibold text-base-content/70 mb-1 block">Drug Name</label>
                          <input
                            type="text"
                            placeholder="Search or enter drug name..."
                            className="input input-bordered input-sm w-full"
                            value={drugDropdownIndex === idx ? drugSearch : p.drugName || ""}
                            onFocus={(e) => {
                              setDrugDropdownIndex(idx);
                              setDrugSearch(p.drugName || "");
                              e.target.select();
                            }}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDrugSearch(val);
                              setDrugDropdownIndex(idx);
                              handlePrescriptionChange(idx, 'drugName', val);
                              handlePrescriptionChange(idx, 'inventoryId', null);
                              handlePrescriptionChange(idx, 'availability', undefined);
                              handlePrescriptionChange(idx, '_selectedDrug', null);
                            }}
                            autoComplete="off"
                          />

                          {drugDropdownIndex === idx && (
                            <div className="absolute z-50 w-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-xl max-h-56 overflow-auto">
                              <ul className="py-1">
                                {drugList
                                  .filter((drug) => matchesMedicationType(drug, medicationType))
                                  .filter((drug) => (drugSearch ? drug.name?.toLowerCase().includes(drugSearch.toLowerCase()) : true))
                                  .map((drug) => (
                                    <li
                                      key={drug._id || drug.id}
                                      onClick={() => handleSelectDrug(idx, drug)}
                                      className="px-3 py-2 text-xs hover:bg-base-200 cursor-pointer flex justify-between items-center"
                                    >
                                      <div>
                                        <span className="font-semibold text-base-content">{drug.name}</span>
                                        {(drug.form || drug.strength) && (
                                          <span className="text-base-content/50 ml-2">
                                            {[drug.form, drug.strength].filter(Boolean).join(' - ')}
                                          </span>
                                        )}
                                      </div>
                                      {drug.stock !== undefined && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                          drug.stock > 0 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                                        }`}>
                                          Stock: {drug.stock}
                                        </span>
                                      )}
                                    </li>
                                  ))}

                                {(() => {
                                  const matching = drugList
                                    .filter((drug) => matchesMedicationType(drug, medicationType))
                                    .filter((drug) => (drugSearch ? drug.name?.toLowerCase().includes(drugSearch.toLowerCase()) : true));
                                  if (matching.length === 0 && drugSearch.trim()) {
                                    return (
                                      <li
                                        onClick={() => handleSelectUnavailableDrug(idx, drugSearch.trim())}
                                        className="px-3 py-2 text-xs hover:bg-warning/10 cursor-pointer border-t border-base-200 text-warning font-medium"
                                      >
                                        + Prescribe "{drugSearch.trim()}" (not in inventory)
                                      </li>
                                    );
                                  }
                                  return null;
                                })()}
                              </ul>
                            </div>
                          )}

                          {p.drugName && p._selectedDrug && (
                            <div className="mt-1 flex items-center gap-2 text-[11px] text-base-content/70">
                              <span>Available: {p._selectedDrug.form || 'N/A'} {p._selectedDrug.strength ? `- ${p._selectedDrug.strength}` : ''}</span>
                              {p._selectedDrug.stock !== undefined && (
                                <span className={p._selectedDrug.stock > 0 ? 'text-success font-semibold' : 'text-warning font-semibold'}>
                                  (Stock: {p._selectedDrug.stock})
                                </span>
                              )}
                            </div>
                          )}
                          {p.availability === 'unavailable' && (
                            <span className="badge badge-warning badge-xs mt-1">Not in stock — patient to source externally</span>
                          )}
                        </div>

                        {/* Dose: Amount + Unit */}
                        <div>
                          <label className="text-xs font-semibold text-base-content/70 mb-1 block">Dose</label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              step="any"
                              placeholder="e.g. 1"
                              className="input input-bordered input-sm flex-1 min-w-0"
                              value={p.dosageAmount || ""}
                              onChange={(e) => handlePrescriptionChange(idx, 'dosageAmount', e.target.value)}
                            />
                            <select
                              className="select select-bordered select-sm w-28 text-xs"
                              value={p.dosageUnit || unitOptions[0]?.value || ""}
                              onChange={(e) => handlePrescriptionChange(idx, 'dosageUnit', e.target.value)}
                            >
                              {unitOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Frequency */}
                        <div>
                          <label className="text-xs font-semibold text-base-content/70 mb-1 block">Frequency</label>
                          <select
                            className="select select-bordered select-sm w-full text-xs"
                            value={p.frequency || ""}
                            onChange={(e) => handlePrescriptionChange(idx, 'frequency', e.target.value)}
                          >
                            <option value="">Select frequency</option>
                            {freqList.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>

                        {/* Duration */}
                        <div>
                          <label className="text-xs font-semibold text-base-content/70 mb-1 block">Duration</label>
                          <div className="flex gap-1.5">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              placeholder="e.g. 5"
                              className="input input-bordered input-sm flex-1 min-w-0"
                              value={p.durationAmount || ""}
                              onChange={(e) => handlePrescriptionChange(idx, 'durationAmount', e.target.value)}
                            />
                            <select
                              className="select select-bordered select-sm w-24 text-xs"
                              value={p.durationUnit || "day"}
                              onChange={(e) => handlePrescriptionChange(idx, 'durationUnit', e.target.value)}
                            >
                              <option value="day">Day(s)</option>
                              <option value="week">Week(s)</option>
                              <option value="month">Month(s)</option>
                            </select>
                          </div>
                        </div>

                        {/* Instructions */}
                        <div className="sm:col-span-2 lg:col-span-3">
                          <label className="text-xs font-semibold text-base-content/70 mb-1 block">Instructions / Special Notes</label>
                          <input
                            type="text"
                            placeholder="e.g. Take after meals, with plenty of water..."
                            className="input input-bordered input-sm w-full"
                            value={p.instructions || ""}
                            onChange={(e) => handlePrescriptionChange(idx, 'instructions', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3">
                <AddRowButton label="Add Prescription / Medication" onClick={addPrescriptionRow} />
              </div>
            </SectionCard>

            {/* NOTES */}
            <SectionCard icon={FaStickyNote} title="Notes" subtitle="Any additional operative notes">
              <textarea name="notes" value={form.notes} onChange={handleChange} className="textarea textarea-bordered w-full" rows={3} />
            </SectionCard>

            {/* BABY ASSESSMENT */}
            <SectionCard
              icon={FaBaby}
              title="Baby Assessment"
              subtitle="Only applicable for delivery-related procedures"
              tone="warning"
              right={
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-medium text-base-content/60">Include</span>
                  <input
                    type="checkbox"
                    checked={form.showBaby}
                    onChange={e => setForm(f => ({ ...f, showBaby: e.target.checked }))}
                    className="toggle toggle-primary toggle-sm"
                  />
                </label>
              }
            >
              {!form.showBaby ? (
                <p className="text-xs text-base-content/50 py-2">
                  Turn this on to record Apgar scores and newborn measurements.
                </p>
              ) : (
                <>
                  {form.babyAssessment.map((b, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-base-200/40 border border-base-200 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-base-content/60 uppercase tracking-wide">
                          Baby {idx + 1}
                        </span>
                        {form.babyAssessment.length > 1 && (
                          <RemoveRowButton onClick={() => removeFromList('babyAssessment', idx)} label="Remove Baby" />
                        )}
                      </div>

                      <Field label="Apgar Score (0–2 each)">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          <input name="appearance" placeholder="Appearance" value={b.apgarScore.appearance} onChange={e => handleApgarChange(idx, e)} className="input input-bordered input-sm" />
                          <input name="pulse" placeholder="Pulse" value={b.apgarScore.pulse} onChange={e => handleApgarChange(idx, e)} className="input input-bordered input-sm" />
                          <input name="grimace" placeholder="Grimace" value={b.apgarScore.grimace} onChange={e => handleApgarChange(idx, e)} className="input input-bordered input-sm" />
                          <input name="activity" placeholder="Activity" value={b.apgarScore.activity} onChange={e => handleApgarChange(idx, e)} className="input input-bordered input-sm" />
                          <input name="respiration" placeholder="Respiration" value={b.apgarScore.respiration} onChange={e => handleApgarChange(idx, e)} className="input input-bordered input-sm" />
                        </div>
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Field label="Weight">
                          <input name="weight" value={b.weight} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Length">
                          <input name="length" value={b.length} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Time of Delivery">
                          <input type="datetime-local" name="deliveryTime" value={b.deliveryTime} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Head Circumference">
                          <input name="headCircumference" value={b.headCircumference} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Abdominal Circumference">
                          <input name="abdominalCircumference" value={b.abdominalCircumference} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Random Blood Sugar">
                          <input name="randomBloodSugar" value={b.randomBloodSugar} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Vital Signs">
                          <input name="vitalSign" value={b.vitalSign} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                        <Field label="Deformity" className="sm:col-span-2">
                          <input name="deformity" value={b.deformity} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                        </Field>
                      </div>
                    </div>
                  ))}
                  <AddRowButton
                    label="Add Baby"
                    onClick={() => addToList('babyAssessment', { ...initialBabyAssessment, apgarScore: { ...initialApgarScore } })}
                  />
                </>
              )}
            </SectionCard>

            {/* ACTIONS */}
            <div className="sticky bottom-0  sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-base-200/80 backdrop-blur-sm border-t border-base-300 flex justify-center gap-3">
              <button
                type="submit"
                className="btn btn-primary text-white px-10 font-semibold normal-case shadow-sm"
                disabled={saving || !canSubmit}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Saving...
                  </>
                ) : isEditMode ? "Update Note" : "Save Note"}
              </button>
              {form.status !== "completed" && (
                <button
                  type="button"
                  className="btn btn-success text-white font-semibold normal-case"
                  onClick={() => setForm((previous) => ({ ...previous, status: "completed" }))}
                  disabled={saving || !canSubmit}
                >
                  Mark Completed
                </button>
              )}
              <button
                type="button"
                className="btn btn-outline px-10 font-semibold normal-case"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
            </div>
          </form>
          </>
          )}

          {/* Record Vitals Modal (Surgery / Theatre room) */}
          {isRecordVitalsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="card w-full max-w-xl bg-base-100 shadow-2xl border border-base-200">
                <div className="p-5 border-b border-base-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-error/10 text-error rounded-xl">
                      <FaHeartbeat className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-base-content">
                        Record Patient Vitals (Theatre)
                      </h3>
                      <p className="text-xs text-base-content/60">
                        {summarySubject?.fullName || "Patient"} • Record surgery room vital readings
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-ghost btn-circle"
                    onClick={() => {
                      setIsRecordVitalsOpen(false);
                      setRecordVitalsError("");
                    }}
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleRecordVitalsSubmit} className="p-5 space-y-4">
                  {recordVitalsError && (
                    <div className="alert alert-error text-xs py-2 shadow-xs">
                      {recordVitalsError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Blood Pressure (mmHg)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 120/80"
                        className="input input-bordered input-sm w-full font-mono"
                        value={recordVitalsForm.bp}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, bp: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Heart Rate / Pulse (bpm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 75"
                        className="input input-bordered input-sm w-full font-mono"
                        value={recordVitalsForm.pulse}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, pulse: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Respiratory Rate (bpm)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 18"
                        className="input input-bordered input-sm w-full font-mono"
                        value={recordVitalsForm.respiratoryRate}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, respiratoryRate: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Temperature (°C)
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 36.8"
                        className="input input-bordered input-sm w-full font-mono"
                        value={recordVitalsForm.temperature}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, temperature: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Oxygen Saturation (SpO2 %)
                      </label>
                      <input
                        type="number"
                        placeholder="e.g. 98"
                        className="input input-bordered input-sm w-full font-mono"
                        value={recordVitalsForm.spo2}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, spo2: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Weight (kg) <span className="text-base-content/40 font-normal">(optional)</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder="e.g. 70"
                        className="input input-bordered input-sm w-full font-mono"
                        value={recordVitalsForm.weight}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, weight: e.target.value }))}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                        Theatre Notes / Remarks
                      </label>
                      <textarea
                        placeholder="Additional vitals notes taken in surgery room..."
                        className="textarea textarea-bordered textarea-sm w-full"
                        rows={2}
                        value={recordVitalsForm.notes}
                        onChange={(e) => setRecordVitalsForm((f) => ({ ...f, notes: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-base-200">
                    <button
                      type="button"
                      className="btn btn-sm btn-ghost"
                      onClick={() => {
                        setIsRecordVitalsOpen(false);
                        setRecordVitalsError("");
                      }}
                      disabled={recordVitalsLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm btn-primary text-white"
                      disabled={recordVitalsLoading}
                    >
                      {recordVitalsLoading ? (
                        <>
                          <span className="loading loading-spinner loading-xs" />
                          Saving...
                        </>
                      ) : (
                        "Save & Sync Vitals"
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateSurgicalNote;