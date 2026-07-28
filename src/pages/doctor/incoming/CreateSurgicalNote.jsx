import React, { useMemo, useState, useEffect } from "react";

import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoIosCloseCircleOutline } from "react-icons/io";
import { createSurgery, updateSurgery } from "@/services/api/surgeryAPI";
import { getInvestigationById } from "@/services/api/investigationRequestAPI";
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

const CreateSurgicalNote = () => {
  const { investigationRequestId: paramInvestigationRequestId , consultationId} = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  const stateInvestigationRequestId = location?.state?.investigationRequestId;
  const editSurgery = location?.state?.editSurgery || null;
  const isEditMode = !!editSurgery;
  const [investigationRequestId, setInvestigationRequestId] = useState(
    paramInvestigationRequestId || stateInvestigationRequestId
  );
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
    setSaving(true);
    if (!investigationRequestId) {
      toast("No investigationRequestId selected. Please select an investigation request before submitting.");
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
      // , dependantId, surgeonId, investigationRequestId are set by backend
    };
    try {
      if (isEditMode) {
        await updateSurgery(editSurgery._id, payload);
        alert("Surgical note updated successfully!");
      } else {
        await createSurgery(investigationRequestId, payload);
        alert("Surgical note submitted successfully!");
      }
      navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${consultationId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } });
    } catch (err) {
      const message = err?.response?.data?.message || err.message;
      setError("Failed to submit surgical note.\n" + message);
      toast(message || "Failed to submit surgical note.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-base-100">
        <Header />
        <div className="p-6 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3 w-full justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <h1 className="text-2xl font-semibold text-base-content">{isEditMode ? "Edit Surgical Note" : "Write Surgical Note"}    |    </h1>
                        </div>
        
                       <div className="flex items-center gap-3">
                          <img src={avatarImg} alt="avatar" className="w-10 h-10 object-cover rounded-full border border-base-300" />
                          <div className="flex flex-col">
                            <span className="text-sm text-base-content font-semibold whitespace-nowrap overflow-hidden text-ellipsis max-w-xs" style={{maxWidth: '180px'}}>
                              {patientName || patientId || "—"}
                            </span>
                            <span className="text-xs text-base-content/70 whitespace-nowrap overflow-hidden text-ellipsis max-w-xs" style={{maxWidth: '180px'}}>
                              Patient ID: {displayPatientId}
                            </span>
                          </div>
                        </div>
        
                      </div>
        
                      <div>
                        <IoIosCloseCircleOutline 
                          className="btn btn-ghost text-error btn-md btn-circle" 
                          onClick={() => navigate(-1)} />
                      </div>
                    </div>
                  </div>
          {error && (
            <div className="alert alert-error mb-4 text-sm">{error}</div>
          )}
    
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Procedure Name *</label>
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
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredProcedureOptions.length > 0 ? (
                        <ul className="py-1">
                          {filteredProcedureOptions.map((option) => (
                            <li
                              key={option.name}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                selectProcedure(option);
                              }}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 flex justify-between items-center"
                            >
                              <span>{option.name}</span>
                              <span className="text-xs text-gray-400 ml-2">{option.code}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="py-2 px-4 text-gray-400 text-sm">
                          {procedureOptionsLoading ? "Loading..." : "No matching past procedures — you can type a new one"}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="label">Procedure Code</label>
                <input
                  name="procedureCode"
                  value={form.procedureCode}
                  onChange={handleChange}
                  className="input input-bordered w-full"
                  placeholder="Auto-filled from procedure name, or enter manually"
                />
              </div>
              <div>
                <label className="label">Schedule Date *</label>
                <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label">Start Time</label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">Operation Room</label>
                <input name="operationRoom" value={form.operationRoom} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="input input-bordered w-full">
                  <option value="scheduled">Scheduled</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            {/* Surgeon Team */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"> 
            <div>
              <label className="label">Surgeon Team *</label>
              {form.surgeonTeam.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Surgeon Name" value={s.surgeonName} onChange={e => handleListChange('surgeonTeam', i, e.target.value, 'surgeonName')} className="input input-bordered flex-1" required />
                  {form.surgeonTeam.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('surgeonTeam', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('surgeonTeam', { surgeonName: "" })}>Add Surgeon</button>
            </div>

            {/* Surgeon Assistants */}
            <div>
              <label className="label">Surgeon Assistants</label>
              {form.surgeonAssistants.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Assistant Name" value={a.assistantName} onChange={e => handleListChange('surgeonAssistants', i, e.target.value, 'assistantName')} className="input input-bordered flex-1" />
                  {form.surgeonAssistants.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('surgeonAssistants', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('surgeonAssistants', { assistantName: "" })}>Add Assistant</button>
            </div>
            </div>
          
            {/* Anesthesia Dosages */}
            <div>
              <label className="label">Anesthesia with Dosage</label>
              {form.anesthesiaDosages.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input required placeholder="Anesthesia Type" value={a.anesthesiaType} onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'anesthesiaType')} className="input input-bordered flex-1" />
                  <input required placeholder="Dosage" value={a.dosage} onChange={e => handleListChange('anesthesiaDosages', i, e.target.value, 'dosage')} className="input input-bordered flex-1" />
                  {form.anesthesiaDosages.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('anesthesiaDosages', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('anesthesiaDosages', { anesthesiaType: "", dosage: "" })}>Add Anesthesia</button>
            </div>

            {/* Vital Signs (multiple) */}
            <div>
              <label className="label">Vital Signs (Theatre)</label>
              {form.vitalSigns.map((v, i) => (
                <div key={i} className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
                  <input name="bloodPressure" placeholder="Blood Pressure" value={v.bloodPressure} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'bloodPressure')} className="input input-bordered" />
                  <input name="heartRate" placeholder="Heart Rate" value={v.heartRate} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'heartRate')} className="input input-bordered" />
                  <input name="respiratoryRate" placeholder="Respiratory Rate" value={v.respiratoryRate} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'respiratoryRate')} className="input input-bordered" />
                  <input name="temperature" placeholder="Temperature" value={v.temperature} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'temperature')} className="input input-bordered" />
                  <input name="oxygenSaturation" placeholder="Oxygen Saturation" value={v.oxygenSaturation} onChange={e => handleListChange('vitalSigns', i, e.target.value, 'oxygenSaturation')} className="input input-bordered" />
                  {form.vitalSigns.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs col-span-2 md:col-span-1" onClick={() => removeFromList('vitalSigns', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('vitalSigns', { bloodPressure: '', heartRate: '', respiratoryRate: '', temperature: '', oxygenSaturation: '' })}>Add Vital Sign</button>
            </div>

            {/* Surgical Findings, EBL, Swabs, Histology, Complications, Outcomes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Surgical Findings</label>
                <textarea name="surgicalFindings" value={form.surgicalFindings} onChange={handleChange} className="textarea textarea-bordered w-full" />
              </div>
              <div>
                <label className="label">Estimated Blood Loss (EBL)</label>
                <input name="estimatedBloodLoss" value={form.estimatedBloodLoss} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">No of Swabs Used</label>
                <input name="swabUsed" value={form.swabUsed} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">Specimens for Histology</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="specimensForHistology" value="sent" checked={form.specimensForHistology === "sent"} onChange={handleChange} /> Sent
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="specimensForHistology" value="not_sent" checked={form.specimensForHistology === "not_sent"} onChange={handleChange} /> Not Sent
                  </label>
                </div>
              </div>
              <div>
                <label className="label">Complications</label>
                <textarea name="complications" value={form.complications} onChange={handleChange} className="textarea textarea-bordered w-full" />
              </div>
              <div>
                <label className="label">Outcomes</label>
                <textarea name="outcomes" value={form.outcomes} onChange={handleChange} className="textarea textarea-bordered w-full" />
              </div>
            </div>

            {/* Post Operative Assessments */}
            <div>
              <label className="label">Post Operative Assessments (Medication)</label>
              {form.postOperativeAssessments.map((m, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Medication" value={m.medication} onChange={e => handleListChange('postOperativeAssessments', i, e.target.value, 'medication')} className="input input-bordered flex-1" />
                  {form.postOperativeAssessments.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('postOperativeAssessments', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('postOperativeAssessments', { medication: "" })}>Add Medication</button>
            </div>

            {/* Notes */}
            <div>
              <label className="label">Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="textarea textarea-bordered w-full" />
            </div>

            {/* Baby Assessment (collapsible, multiple) */}
            <div className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={form.showBaby} onChange={e => setForm(f => ({ ...f, showBaby: e.target.checked }))} />
                <span className="font-semibold">Include Baby Assessment</span>
              </div>
              {form.showBaby && form.babyAssessment.map((b, idx) => (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4 border-b pb-4">
                  <div>
                    <label className="label">Apgar Score (0-2)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input name="appearance" placeholder="Appearance" value={b.apgarScore.appearance} onChange={e => handleApgarChange(idx, e)} className="input input-bordered" />
                      <input name="pulse" placeholder="Pulse" value={b.apgarScore.pulse} onChange={e => handleApgarChange(idx, e)} className="input input-bordered" />
                      <input name="grimace" placeholder="Grimace" value={b.apgarScore.grimace} onChange={e => handleApgarChange(idx, e)} className="input input-bordered" />
                      <input name="activity" placeholder="Activity" value={b.apgarScore.activity} onChange={e => handleApgarChange(idx, e)} className="input input-bordered" />
                      <input name="respiration" placeholder="Respiration" value={b.apgarScore.respiration} onChange={e => handleApgarChange(idx, e)} className="input input-bordered" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Baby Weight</label>
                    <input name="weight" value={b.weight} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Time of Delivery</label>
                    <input type="datetime-local" name="deliveryTime" value={b.deliveryTime} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Head Circumference</label>
                    <input name="headCircumference" value={b.headCircumference} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Baby Length</label>
                    <input name="length" value={b.length} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Abdominal Circumference</label>
                    <input name="abdominalCircumference" value={b.abdominalCircumference} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Baby Random Blood Sugar</label>
                    <input name="randomBloodSugar" value={b.randomBloodSugar} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Vital Signs of the Baby</label>
                    <input name="vitalSign" value={b.vitalSign} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Deformity of Baby</label>
                    <input name="deformity" value={b.deformity} onChange={e => handleBabyChange(idx, e)} className="input input-bordered w-full" />
                  </div>
                  {form.babyAssessment.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs mt-2" onClick={() => removeFromList('babyAssessment', idx)}>Remove Baby</button>
                  )}
                </div>
              ))}
              {form.showBaby && (
                <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case mt-2" onClick={() => addToList('babyAssessment', { apgarScore: { appearance: '', pulse: '', grimace: '', activity: '', respiration: '' }, weight: '', length: '', headCircumference: '', deliveryTime: '', abdominalCircumference: '', randomBloodSugar: '', vitalSign: '', deformity: '' })}>Add Baby</button>
              )}
            </div>

            <div className="flex justify-center gap-4 pt-4 pb-12">
             <button type="submit" className="btn bg-[#00943C] hover:bg-[#007a31] text-white px-12 h-12 text-lg font-normal normal-case rounded-md" disabled={saving || !investigationRequestId}>{saving ? "Saving..." : isEditMode ? "Update" : "Save"}</button>
             <button type="button" className="btn btn-outline border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-12 h-12 text-lg font-normal normal-case rounded-md" onClick={() => window.history.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSurgicalNote;