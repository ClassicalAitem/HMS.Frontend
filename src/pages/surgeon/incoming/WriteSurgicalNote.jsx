import React, { useMemo, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { IoIosCloseCircleOutline } from "react-icons/io";

const initialBabyAssessment = {
  apgar: { appearance: '', pulse: '', grimace: '', activity: '', respiration: '' },
  weight: '',
  timeOfDelivery: '',
  headCircumference: '',
  length: '',
  abdominalCircumference: '',
  randomBloodSugar: '',
  vitalSigns: '',
  deformity: '',
};

const WriteSurgicalNote = () => {
      const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";
  const snapshot = location?.state?.patientSnapshot;
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(!!patientId && !snapshot);
  const [patient, setPatient] = useState(snapshot || null);
  const [saving, setSaving] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);


    const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const [form, setForm] = useState({
    surgeryName: "",
    dateOfSurgery: "",
    surgeons: [""],
    assistants: [""],
    anesthesia: [{ name: "", dosage: "" }],
    surgeryStart: "",
    surgeryEnd: "",
    notes: "",
    vitals: [{ time: "", value: "" }],
    procedures: "",
    findings: "",
    ebl: "",
    swabs: "",
    histology: "not_sent",
    postOp: "",
    medication: [""],
    babyAssessment: { ...initialBabyAssessment },
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
  const handleBabyChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      babyAssessment: { ...prev.babyAssessment, [name]: value },
    }));
  };

  const handleApgarChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      babyAssessment: {
        ...prev.babyAssessment,
        apgar: { ...prev.babyAssessment.apgar, [name]: value },
      },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Submit logic
    alert("Surgical note submitted! (implement API call)");
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
                          <h1 className="text-2xl font-semibold text-base-content">Write Surgical Note</h1>
                        </div>
        
                        <div className="flex items-center gap-1 flex-col">
                          <p className="text-sm text-base-content/70">
                            {patient ? `${patientName || "Unknown"}` : ""}
                          </p>
                          <p className="text-sm text-base-content/70">
                            {patient ? `${patient?.hospitalId || patientId || "—"}` : ""}
                          </p>
                        </div>
                      </div>
        
                      <div>
                        <IoIosCloseCircleOutline 
                          className="btn btn-ghost text-error btn-md btn-circle" 
                          onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } })} />
                      </div>
                    </div>
                  </div>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Surgery Name *</label>
                <input name="surgeryName" value={form.surgeryName} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label">Date of Surgery *</label>
                <input type="date" name="dateOfSurgery" value={form.dateOfSurgery} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label">Surgery Start Time *</label>
                <input type="time" name="surgeryStart" value={form.surgeryStart} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label">Surgery End Time *</label>
                <input type="time" name="surgeryEnd" value={form.surgeryEnd} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
            </div>

            {/* Surgeons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="label">List of Surgeon Name *</label>
              {form.surgeons.map((s, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={s} onChange={e => handleListChange('surgeons', i, e.target.value)} className="input input-bordered flex-1" required />
                  {form.surgeons.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('surgeons', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('surgeons', "")}>Add Surgeon</button>
            </div>

            {/* Assistants */}
            <div>
              <label className="label">List of Surgeon Assistants</label>
              {form.assistants.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input value={a} onChange={e => handleListChange('assistants', i, e.target.value)} className="input input-bordered flex-1" />
                  {form.assistants.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('assistants', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('assistants', "")}>Add Assistant</button>
            </div>
 </div>
            {/* Anesthesia */}
            <div>
              <label className="label">List of Anesthesia with Dosage</label>
              {form.anesthesia.map((a, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input placeholder="Name" value={a.name} onChange={e => handleListChange('anesthesia', i, e.target.value, 'name')} className="input input-bordered flex-1" />
                  <input placeholder="Dosage" value={a.dosage} onChange={e => handleListChange('anesthesia', i, e.target.value, 'dosage')} className="input input-bordered flex-1" />
                  {form.anesthesia.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('anesthesia', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('anesthesia', { name: "", dosage: "" })}>Add Anesthesia</button>
            </div>

            {/* Vitals */}
            <div>
              <label className="label">List of Vitals Signs from Theatre</label>
              {form.vitals.map((v, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input type="time" placeholder="Time" value={v.time} onChange={e => handleListChange('vitals', i, e.target.value, 'time')} className="input input-bordered" />
                  <input placeholder="Value" value={v.value} onChange={e => handleListChange('vitals', i, e.target.value, 'value')} className="input input-bordered flex-1" />
                  {form.vitals.length > 1 && (
                    <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('vitals', i)}>Remove</button>
                  )}
                </div>
              ))}
              <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('vitals', { time: "", value: "" })}>Add Vitals</button>
            </div>

            {/* Procedures, Findings, EBL, Swabs, Histology */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Surgical Procedures *</label>
                <textarea name="procedures" value={form.procedures} onChange={handleChange} className="textarea textarea-bordered w-full" required />
              </div>
              <div>
                <label className="label">Surgical Findings *</label>
                <textarea name="findings" value={form.findings} onChange={handleChange} className="textarea textarea-bordered w-full" required />
              </div>
              <div>
                <label className="label">Estimated Blood Loss (EBL)</label>
                <input name="ebl" value={form.ebl} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">No of Swabs Used</label>
                <input name="swabs" value={form.swabs} onChange={handleChange} className="input input-bordered w-full" />
              </div>
              <div>
                <label className="label">Specimens removed for histology</label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-1">
                    <input type="radio" name="histology" value="sent" checked={form.histology === "sent"} onChange={handleChange} /> Sent
                  </label>
                  <label className="flex items-center gap-1">
                    <input type="radio" name="histology" value="not_sent" checked={form.histology === "not_sent"} onChange={handleChange} /> Not Sent
                  </label>
                </div>
              </div>
            </div>

            {/* Post Op, Medication */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="label">Post Operative Assessment</label>
                <textarea name="postOp" value={form.postOp} onChange={handleChange} className="textarea textarea-bordered w-full" />
              </div>
              <div>
                <label className="label">Medication</label>
                {form.medication.map((m, i) => (
                  <div key={i} className="flex gap-2 mb-2">
                    <input value={m} onChange={e => handleListChange('medication', i, e.target.value)} className="input input-bordered flex-1" />
                    {form.medication.length > 1 && (
                      <button type="button" className="btn btn-error btn-xs" onClick={() => removeFromList('medication', i)}>Remove</button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-sm bg-[#00943C] hover:bg-[#007a31] text-white border-none gap-2 font-normal normal-case" onClick={() => addToList('medication', "")}>Add Medication</button>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <label className="label">Additional Notes</label>
              <textarea name="notes" value={form.notes} onChange={handleChange} className="textarea textarea-bordered w-full" />
            </div>

            {/* Baby Assessment (collapsible) */}
            <div className="border rounded p-4">
              <div className="flex items-center gap-2 mb-2">
                <input type="checkbox" checked={form.showBaby} onChange={e => setForm(f => ({ ...f, showBaby: e.target.checked }))} />
                <span className="font-semibold">Include Baby Assessment</span>
              </div>
              {form.showBaby && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">Apgar Score (0-2)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input name="appearance" placeholder="Appearance" value={form.babyAssessment.apgar.appearance} onChange={handleApgarChange} className="input input-bordered" />
                      <input name="pulse" placeholder="Pulse" value={form.babyAssessment.apgar.pulse} onChange={handleApgarChange} className="input input-bordered" />
                      <input name="grimace" placeholder="Grimace" value={form.babyAssessment.apgar.grimace} onChange={handleApgarChange} className="input input-bordered" />
                      <input name="activity" placeholder="Activity" value={form.babyAssessment.apgar.activity} onChange={handleApgarChange} className="input input-bordered" />
                      <input name="respiration" placeholder="Respiration" value={form.babyAssessment.apgar.respiration} onChange={handleApgarChange} className="input input-bordered" />
                    </div>
                  </div>
                  <div>
                    <label className="label">Baby Weight</label>
                    <input name="weight" value={form.babyAssessment.weight} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Time of Delivery</label>
                    <input type="datetime-local" name="timeOfDelivery" value={form.babyAssessment.timeOfDelivery} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Head Circumference</label>
                    <input name="headCircumference" value={form.babyAssessment.headCircumference} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Baby Length</label>
                    <input name="length" value={form.babyAssessment.length} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Abdominal Circumference</label>
                    <input name="abdominalCircumference" value={form.babyAssessment.abdominalCircumference} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Baby Random Blood Sugar</label>
                    <input name="randomBloodSugar" value={form.babyAssessment.randomBloodSugar} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Vital Signs of the Baby</label>
                    <input name="vitalSigns" value={form.babyAssessment.vitalSigns} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                  <div>
                    <label className="label">Deformity of Baby</label>
                    <input name="deformity" value={form.babyAssessment.deformity} onChange={handleBabyChange} className="input input-bordered w-full" />
                  </div>
                </div>
              )}
            </div>

                {               /* Save and Cancel button */}

            <div className="flex justify-center gap-4 pt-4 pb-12">
              <button type="submit" className="btn bg-[#00943C] hover:bg-[#007a31] text-white px-12 h-12 text-lg font-normal normal-case rounded-md">Save</button>
              <button type="button" className="btn btn-outline border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 px-12 h-12 text-lg font-normal normal-case rounded-md" onClick={() => window.history.back()}>Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default WriteSurgicalNote;
