import React, { useMemo, useState, useEffect } from "react";

import { Header } from "@/components/common";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";
import CurrentVitalsCard from "@/components/medical-director/patient/CurrentVitalsCard";
import SendPatientModal from "@/components/modals/SendPatientModal";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
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
} from "react-icons/fa";
import { createSurgery, updateSurgery } from "@/services/api/surgeryAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getVitalsByPatient, normalizeVitalsResponse, getLatestVital } from "@/services/api/vitalsAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import avatarImg from "@/assets/images/incomingLogo.jpg";
import toast from "react-hot-toast";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";


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
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const appointmentSnapshot = location?.state?.appointmentSnapshot;
  const editSurgery = location?.state?.editSurgery || null;
  const isEditMode = !!editSurgery;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const initialPatientId =
    paramPatientId ||
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

  const dependantId = location?.state?.dependantId || appointmentSnapshot?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || appointmentSnapshot?.dependant || null;
  const isViewingDependant = Boolean(dependantId);

  useEffect(() => {
    if (!patientId || patient) return;
    setPatientLoading(true);
    getPatientById(patientId)
      .then((res) => {
        setPatient(res?.data || res);
      })
      .catch((err) => {
        console.error('[SurgicalNote] Error fetching patient:', err);
      })
      .finally(() => setPatientLoading(false));
  }, [patientId, patient]);

  useEffect(() => {
    if (!patientId) return;
    let mounted = true;
    setVitalsLoading(true);
    getVitalsByPatient(patientId)
      .then((response) => {
        const vitals = normalizeVitalsResponse(response)
          .filter((vital) => (isViewingDependant ? vital.dependantId === dependantId : !vital.dependantId));
        if (mounted) setLatestVital(getLatestVital(vitals));
      })
      .catch(() => {
        if (mounted) setLatestVital(null);
      })
      .finally(() => {
        if (mounted) setVitalsLoading(false);
      });
    return () => { mounted = false; };
  }, [patientId, dependantId, isViewingDependant]);

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
      anesthesiaDosages: editSurgery.anesthesiaDosages?.length ? editSurgery.anesthesiaDosages : [{ anesthesiaType: "", dosage: "" }],
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
      showBaby: !!editSurgery.babyAssessment?.length,
    }));
    setProcedureSearch(editSurgery.procedureName || "");
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
    anesthesiaDosages: [{ anesthesiaType: "", dosage: "" }],
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
    showBaby: false,
  });

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

    // Prepare payload to match ISurgery
    const payload = {
      ...form,
      patientId: effectivePatientId,
      dependantId: dependantId || undefined,
      surgeonTeam: form.surgeonTeam.filter((s) => s.surgeonName.trim()),
      surgeonAssistants: form.surgeonAssistants.filter((a) => a.assistantName.trim()),
      anesthesiaDosages: form.anesthesiaDosages.filter((a) => a.anesthesiaType.trim() && a.dosage.trim()),
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
     vitalSigns: form.vitalSigns.map((v) => ({
        bloodPressure: v.bloodPressure || undefined,
        heartRate: v.heartRate ? Number(v.heartRate) : undefined,
        respiratoryRate: v.respiratoryRate ? Number(v.respiratoryRate) : undefined,
        temperature: v.temperature ? Number(v.temperature) : undefined,
        oxygenSaturation: v.oxygenSaturation ? Number(v.oxygenSaturation) : undefined,
      })),
      postOperativeAssessment: form.postOperativeAssessments
        .filter((m) => m.medication?.trim())
        .map((m) => ({ medication: m.medication.trim() })),
    };

    try {
      if (isEditMode) {
        await updateSurgery(editSurgery._id || editSurgery.id, payload);
        toast.success("Surgical note updated successfully!");
      } else {
        await createSurgery(payload);
        toast.success("Surgical note submitted successfully!");
      }

      navigate(
        fromIncoming
          ? '/dashboard/surgeon/incoming'
          : consultationId
          ? `/dashboard/medical-director/medical-history/${effectivePatientId}/consultation/${consultationId}`
          : '/dashboard/surgeon/incoming',
        { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } },
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
                      onBack={() => navigate(fromIncoming ? "/dashboard/surgeon/incoming" : "/dashboard/surgeon/appointments")}
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

{/*           
            <SendPatientModal
              patientId={patientId}
              patient={patient}
              defaultDependantId={dependantId}
              defaultDependantLabel={summarySubject?.fullName}
              lockSubject
              allowedRoles={["nurse", "doctor", "cashier", "hmo"]}
              onUpdated={() => toast.success("Patient status updated")}
            />
      */}

          <CurrentVitalsCard
            patient={summarySubject}
            latest={latestVital}
            loading={vitalsLoading}
            buttonHidden
          />

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
              <div className="space-y-2">
                {form.anesthesiaDosages.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <input required placeholder="Anesthesia type" value={a.anesthesiaType} onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'anesthesiaType')} className="input input-bordered flex-1" />
                    <input required placeholder="Dosage" value={a.dosage} onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'dosage')} className="input input-bordered flex-1" />
                    {form.anesthesiaDosages.length > 1 && (
                      <RemoveRowButton onClick={() => removeFromList('anesthesiaDosages', i)} />
                    )}
                  </div>
                ))}
              </div>
              <AddRowButton label="Add Anesthesia" onClick={() => addToList('anesthesiaDosages', { anesthesiaType: "", dosage: "" })} />
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
                  <div key={i} className="p-3 rounded-xl bg-base-200/40 border border-base-200">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                      <input name="bloodPressure" placeholder="Blood pressure" value={v.bloodPressure} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'bloodPressure')} className="input input-bordered input-sm" />
                      <input name="heartRate" placeholder="Heart rate" value={v.heartRate} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'heartRate')} className="input input-bordered input-sm" />
                      <input name="respiratoryRate" placeholder="Resp. rate" value={v.respiratoryRate} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'respiratoryRate')} className="input input-bordered input-sm" />
                      <input name="temperature" placeholder="Temperature" value={v.temperature} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'temperature')} className="input input-bordered input-sm" />
                      <input name="oxygenSaturation" placeholder="O2 saturation" value={v.oxygenSaturation} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'oxygenSaturation')} className="input input-bordered input-sm" />
                    </div>
                    {form.vitalSigns.length > 1 && (
                      <div className="flex justify-end mt-2">
                        <RemoveRowButton onClick={() => removeFromList('vitalSigns', i)} />
                      </div>
                    )}
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
              subtitle="Prescribed for recovery"
              tone="accent"
            >
              <div className="space-y-2">
                {form.postOperativeAssessments.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder="Medication" value={m.medication} onChange={e => handleListChange('postOperativeAssessments', i, e.target.value, 'medication')} className="input input-bordered flex-1" />
                    {form.postOperativeAssessments.length > 1 && (
                      <RemoveRowButton onClick={() => removeFromList('postOperativeAssessments', i)} />
                    )}
                  </div>
                ))}
              </div>
              <AddRowButton label="Add Medication" onClick={() => addToList('postOperativeAssessments', { medication: "" })} />
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
        </div>
      </div>
    </div>
  );
};

export default CreateSurgicalNote;