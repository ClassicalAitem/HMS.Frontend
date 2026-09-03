import React, { useMemo, useState, useEffect } from "react";

import { Header } from "@/components/common";
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
import {
  getInvestigationById,
  createInvestigationRequestByConsultation,
  createInvestigationRequestForCashier,
} from "@/services/api/investigationRequestAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import avatarImg from "@/assets/images/incomingLogo.jpg";
import toast from "react-hot-toast";


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
  const { investigationRequestId: paramInvestigationRequestId , consultationId} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const appointmentSnapshot = location?.state?.appointmentSnapshot;
  const stateInvestigationRequestId = location?.state?.investigationRequestId;
  const editSurgery = location?.state?.editSurgery || null;
  const isEditMode = !!editSurgery;
  const [investigationRequestId, setInvestigationRequestId] = useState(
    paramInvestigationRequestId || stateInvestigationRequestId
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    setInvestigationRequestId(paramInvestigationRequestId || stateInvestigationRequestId);
  }, [paramInvestigationRequestId, stateInvestigationRequestId]);
  const [investigations, setInvestigations] = useState([]);
  const [investigationsLoading, setInvestigationsLoading] = useState(false);
  // Optionally, fetch investigation details if needed (not all for a patient)
  // If you want to fetch the investigation request details for this ID:
  const [patientId, setPatientId] = useState(undefined);
  useEffect(() => {
    if (!investigationRequestId) return;
    setInvestigationsLoading(true);
    getInvestigationById(investigationRequestId)
      .then(async (data) => {
        // If the API returns a single object, wrap in array for selector compatibility
        const list = Array.isArray(data) ? data : (data?.data ? [data.data] : [data]);
        setInvestigations(list);
        if (list.length > 0) {
          const inv = list[0];
          let pid = inv.patientId || (inv.patient && (inv.patient._id || inv.patient.id));
          setPatientId(pid);
          if (inv.patient) {
            setPatient(inv.patient);
          } else if (pid) {
            try {
              const patientRes = await getPatientById(pid);
              const p = patientRes?.data || patientRes;
              setPatient(p);
            } catch (e) {
              setPatient(null);
            }
          } else {
            setPatient(null);
          }
        }
      })
      .catch((err) => {
        console.error('[SurgicalNote] Error fetching investigation request:', err);
        setInvestigations([]);
        setPatientId(undefined);
        setPatient(null);
      })
      .finally(() => setInvestigationsLoading(false));
  }, [investigationRequestId]);


  const [patient, setPatient] = useState(snapshot || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!editSurgery?.patientId || patient || investigationRequestId) return;
    setPatientId(editSurgery.patientId);
    getPatientById(editSurgery.patientId)
      .then((response) => setPatient(response?.data || response))
      .catch(() => setPatient(null));
  }, [editSurgery, investigationRequestId, patient]);

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
    if (investigationRequestId || !appointmentSnapshot) return;
    const appointmentPatientId = appointmentSnapshot.patientId || appointmentSnapshot.patient?.id || appointmentSnapshot.patient?._id;
    setPatientId(appointmentPatientId);
    if (appointmentSnapshot.patient) {
      setPatient(appointmentSnapshot.patient);
    } else if (appointmentPatientId) {
      getPatientById(appointmentPatientId)
        .then((res) => setPatient(res?.data || res))
        .catch(() => setPatient(null));
    }
  }, [appointmentSnapshot, investigationRequestId]);

  useEffect(() => {
    if (!appointmentSnapshot || investigationRequestId) return;
    setForm((prev) => ({
      ...prev,
      procedureName: appointmentSnapshot.procedureName || prev.procedureName,
      procedureCode: appointmentSnapshot.procedureCode || prev.procedureCode,
      scheduledDate: appointmentSnapshot.appointmentDate
        ? new Date(appointmentSnapshot.appointmentDate).toISOString().split('T')[0]
        : prev.scheduledDate,
      startTime: appointmentSnapshot.appointmentTime || prev.startTime,
    }));
    setProcedureSearch(appointmentSnapshot.procedureName || '');
  }, [appointmentSnapshot, investigationRequestId]);

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
    if (!form.procedureName.trim()) {
      toast("Procedure name is required.");
      return false;
    }

    if (!form.scheduledDate) {
      toast("Schedule date is required.");
      return false;
    }

    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      toast("End time must be after start time.");
      return false;
    }

    const hasValidSurgeon = form.surgeonTeam.some((s) => s.surgeonName.trim());
    if (!hasValidSurgeon) {
      toast("At least one surgeon is required.");
      return false;
    }

    // Reject rows where only one of the two anesthesia fields was filled
    const badAnesthesia = form.anesthesiaDosages.some(
      (a) => (a.anesthesiaType.trim() && !a.dosage.trim()) ||
             (!a.anesthesiaType.trim() && a.dosage.trim())
    );
    if (badAnesthesia) {
      toast("Each anesthesia entry needs both a type and a dosage.");
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
    if (!investigationRequestId && !appointmentSnapshot?.id && !appointmentSnapshot?._id && !appointmentSnapshot?.appointmentId) {
      toast("No investigation request or appointment selected. Please go back to Incoming.");
      setSaving(false);
      return;
    }
    // Prepare payload to match ISurgery
   // Prepare payload to match ISurgery
    const payload = {
      ...form,
      surgeonTeam: form.surgeonTeam.filter((s) => s.surgeonName.trim()),
      surgeonAssistants: form.surgeonAssistants.filter((a) => a.assistantName.trim()),
      anesthesiaDosages: form.anesthesiaDosages.filter((a) => a.anesthesiaType.trim() && a.dosage.trim()),
      estimatedBloodLoss: form.estimatedBloodLoss ? Number(form.estimatedBloodLoss) : undefined,
      swabsUsed: form.swabUsed ? Number(form.swabUsed) : undefined,
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
      // , dependantId, surgeonId, investigationRequestId are set by backend
    };
    try {
      if (isEditMode) {
        await updateSurgery(editSurgery._id, payload);
        toast.success("Surgical note updated successfully!");
      } else {
        let targetInvId = investigationRequestId;
        if (!targetInvId && appointmentSnapshot) {
          const invPayload = {
            patientId:
              patientId ||
              appointmentSnapshot.patientId ||
              (appointmentSnapshot.patient && appointmentSnapshot.patient.id),
            dependantId: appointmentSnapshot.dependantId || undefined,
            type: 'surgical',
            tests: [
              {
                name:
                  form.procedureName ||
                  appointmentSnapshot.procedureName ||
                  'Surgical Procedure',
              },
            ],
          };
          try {
            let invRes;
            if (appointmentSnapshot.consultationId) {
              invRes = await createInvestigationRequestByConsultation(
                appointmentSnapshot.consultationId,
                invPayload,
              );
            } else {
              invRes = await createInvestigationRequestForCashier(invPayload);
            }
            const createdInv = invRes?.data?.data ?? invRes?.data ?? invRes;
            targetInvId = createdInv?.id || createdInv?._id;
          } catch (e) {
            console.error('Failed to auto-provision surgical investigation request', e);
          }
        }

        if (!targetInvId) {
          throw new Error(
            "Unable to link surgical note: investigation request could not be established.",
          );
        }

        await createSurgery(targetInvId, payload);
        toast.success("Surgical note submitted successfully!");
      }

      navigate(
        appointmentSnapshot && !investigationRequestId
          ? '/dashboard/surgeon/incoming'
          : `/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}`,
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

  const canSubmit = !(
    !investigationRequestId &&
    !appointmentSnapshot?.id &&
    !appointmentSnapshot?._id &&
    !appointmentSnapshot?.appointmentId
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

        <div className="overflow-y-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8 h-full">
          {/* PAGE HEADER */}
          <div className="card bg-base-100 border border-base-200 shadow-sm">
            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <FaProcedures className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-base-content tracking-tight">
                    {isEditMode ? "Edit Surgical Note" : "Write Surgical Note"}
                  </h1>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    {investigationsLoading
                      ? "Loading patient details..."
                      : "Operative record for theatre and post-operative care"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 pl-4 sm:border-l border-base-200">
                  <img
                    src={avatarImg}
                    alt="avatar"
                    className="w-10 h-10 object-cover rounded-full border border-base-300"
                  />
                  <div className="flex flex-col">
                    <span
                      className="text-sm font-semibold text-base-content whitespace-nowrap overflow-hidden text-ellipsis"
                      style={{ maxWidth: "180px" }}
                    >
                      {patientName || patientId || "—"}
                    </span>
                    <span className="text-xs text-base-content/50 font-mono">
                      ID: {displayPatientId}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="btn btn-ghost btn-circle btn-sm text-error"
                  title="Close"
                >
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div className="alert alert-error text-sm shadow-sm whitespace-pre-line">
              {error}
            </div>
          )}

          <SectionCard
            icon={FaUserMd}
            title="Patient Details"
            subtitle="Patient linked to this surgical record"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-[11px] uppercase font-semibold text-base-content/50">Name</p>
                <p className="text-sm font-semibold text-base-content">{patientName || "Unknown Patient"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-base-content/50">Hospital ID</p>
                <p className="text-sm font-mono text-base-content">{displayPatientId}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-base-content/50">Gender</p>
                <p className="text-sm text-base-content">{patient?.gender || "—"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase font-semibold text-base-content/50">Date of Birth</p>
                <p className="text-sm text-base-content">{patient?.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : "—"}</p>
              </div>
            </div>
          </SectionCard>

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
            <div className="sticky bottom-0 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4 bg-base-200/80 backdrop-blur-sm border-t border-base-300 flex justify-center gap-3">
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