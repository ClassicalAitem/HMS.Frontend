import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getPatientById } from "@/services/api/patientsAPI";
import { useAppSelector } from "@/store/hooks";
import toast, { Toaster } from "react-hot-toast";
import {
  createAnteNatalRecord,
  getAnteNatalRecord,
  updateAnteNatalRecord
} from "@/services/api/anteNatalAPI";

const emptyForm = (doctorName = "") => ({
  previousMedicalHistory: {
    heartDisease: '', yawsOrSyphilis: '', previousOperation: '',
    kidney: '', hypertension: '', others: ''
  },
  familyHistory: { twins: '', malformation: '', tuberculosis: '' },
  previousObstetricHistory: [],
  presentPregnancy: {
    dateOfBooking: '', lmp: '', edd: '', bleeding: '',
    durationInWeeks: '', fmf: '', headache: '', vomiting: '',
    oedema: '', constipation: '', urinarySymptoms: '', jaundice: '',
    otherSymptoms: '', vaginalDischarge: '', takenBy: doctorName
  },
  antenatalExaminations: []
});

const AntenatalRecords = () => {
  const { patientId, recordIndex } = useParams();
  const isEditing = recordIndex !== undefined;
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const doctorName = useMemo(() => user ? `${user.firstName} ${user.lastName}` : "", [user]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [patient, setPatient] = useState(null);
  const [formData, setFormData] = useState(emptyForm(doctorName));

  // Load patient
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingPatient(true);
        const res = await getPatientById(patientId);
        if (mounted) setPatient(res?.data ?? res);
      } catch {
        toast.error("Failed to load patient data");
      } finally {
        if (mounted) setLoadingPatient(false);
      }
    };
    if (patientId) load();
    return () => { mounted = false; };
  }, [patientId]);

  // Load existing record when editing
  useEffect(() => {
    if (!isEditing || !patientId) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoadingData(true);
        const record = await getAnteNatalRecord(patientId, recordIndex);
        if (mounted && record) {
          setFormData(transformBackendToFrontend(record, doctorName));
        }
      } catch (err) {
        toast.error("Failed to load record data");
      } finally {
        if (mounted) setLoadingData(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId, recordIndex, isEditing, doctorName]);

  useEffect(() => {
    if (doctorName && !isEditing) {
      setFormData(prev => ({
        ...prev,
        presentPregnancy: { ...prev.presentPregnancy, takenBy: doctorName }
      }));
    }
  }, [doctorName, isEditing]);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const transformBackendToFrontend = (backendData, docName = "") => {
    if (!backendData) return emptyForm(docName);
    return {
      previousMedicalHistory: {
        heartDisease: backendData.medicalHistories?.[0]?.heartDisease || '',
        yawsOrSyphilis: backendData.medicalHistories?.[0]?.yawnOrSyphilis || '',
        previousOperation: backendData.medicalHistories?.[0]?.previousOperation || '',
        kidney: backendData.medicalHistories?.[0]?.kidney || '',
        hypertension: backendData.medicalHistories?.[0]?.hypertension || '',
        others: backendData.medicalHistories?.[0]?.other || ''
      },
      familyHistory: {
        twins: backendData.familyHistories?.[0]?.twins || '',
        malformation: backendData.familyHistories?.[0]?.malformation || '',
        tuberculosis: backendData.familyHistories?.[0]?.tuberculosis || ''
      },
      previousObstetricHistory: (backendData.obstetricHistories || []).map(item => ({
        date: item.Date ? new Date(item.Date).toISOString().split('T')[0] : '',
        durationOfPregnancy: item.durationOfPregnancy || '',
        birthWeight: item.birthWeight || '',
        complication: item.complicationInPregnancy || '',
        aliveOrDead: item.aliveOrDead || '',
        ageOfDeath: item.ageAtDeath || '',
        causeOfDeath: item.causeOfDeath || ''
      })),
      presentPregnancy: {
        dateOfBooking: backendData.presentPregnancyHistories?.[0]?.dateOfBooking || '',
        lmp: backendData.presentPregnancyHistories?.[0]?.LMP || '',
        edd: backendData.presentPregnancyHistories?.[0]?.EDD || '',
        bleeding: backendData.presentPregnancyHistories?.[0]?.bleeding || '',
        durationInWeeks: backendData.presentPregnancyHistories?.[0]?.durationOfPregnancyInWeek || '',
        fmf: backendData.presentPregnancyHistories?.[0]?.FMF || '',
        headache: backendData.presentPregnancyHistories?.[0]?.headache || '',
        vomiting: backendData.presentPregnancyHistories?.[0]?.vomiting || '',
        oedema: backendData.presentPregnancyHistories?.[0]?.oedema || '',
        constipation: backendData.presentPregnancyHistories?.[0]?.constipation || '',
        urinarySymptoms: backendData.presentPregnancyHistories?.[0]?.urinarySymptoms || '',
        jaundice: backendData.presentPregnancyHistories?.[0]?.jaundice || '',
        otherSymptoms: backendData.presentPregnancyHistories?.[0]?.otherSymptoms || '',
        vaginalDischarge: backendData.presentPregnancyHistories?.[0]?.vaginalDischarge || '',
        takenBy: backendData.presentPregnancyHistories?.[0]?.takenBy || docName
      },
      antenatalExaminations: (backendData.anteNatalExamination || []).map(item => ({
        date: item.Date ? new Date(item.Date).toISOString().split('T')[0] : '',
        heightOfFundus: item.heightOfFundus || '',
        ega: item.EGA || '',
        presentationAndLie: item.presentationAndLife || '',
        relationsOfPpToBirth: item.relationOfPPToBrim || '',
        foetalHeart: item.foetalHeart || '',
        urine: item.urine || '',
        weight: item.weight || '',
        bp: item.bloodPressure || '',
        nextVisit: item.nextVisit || '',
        remarks: item.remarks || '',
        signature: item.signature || docName
      }))
    };
  };

  const transformFrontendToBackend = (fd) => {
    const out = { patientId, doctorId: user?.id || user?._id };

    const med = {};
    if (fd.previousMedicalHistory.heartDisease?.trim()) med.heartDisease = fd.previousMedicalHistory.heartDisease.trim();
    if (fd.previousMedicalHistory.yawsOrSyphilis?.trim()) med.yawnOrSyphilis = fd.previousMedicalHistory.yawsOrSyphilis.trim();
    if (fd.previousMedicalHistory.previousOperation?.trim()) med.previousOperation = fd.previousMedicalHistory.previousOperation.trim();
    if (fd.previousMedicalHistory.kidney?.trim()) med.kidney = fd.previousMedicalHistory.kidney.trim();
    if (fd.previousMedicalHistory.hypertension?.trim()) med.hypertension = fd.previousMedicalHistory.hypertension.trim();
    if (fd.previousMedicalHistory.others?.trim()) med.other = fd.previousMedicalHistory.others.trim();
    if (Object.keys(med).length > 0) out.medicalHistories = [med];

    const fam = {};
    if (fd.familyHistory.twins?.trim()) fam.twins = fd.familyHistory.twins.trim();
    if (fd.familyHistory.malformation?.trim()) fam.malformation = fd.familyHistory.malformation.trim();
    if (fd.familyHistory.tuberculosis?.trim()) fam.tuberculosis = fd.familyHistory.tuberculosis.trim();
    if (Object.keys(fam).length > 0) out.familyHistories = [fam];

    const obs = fd.previousObstetricHistory
      .filter(i => i.date?.trim() || i.durationOfPregnancy?.trim() || i.birthWeight?.trim() || i.complication?.trim() || i.aliveOrDead?.trim())
      .map(i => ({
        ...(i.date?.trim() && { Date: new Date(i.date) }),
        ...(i.durationOfPregnancy?.trim() && { durationOfPregnancy: i.durationOfPregnancy.trim() }),
        ...(i.birthWeight?.trim() && { birthWeight: i.birthWeight.trim() }),
        ...(i.complication?.trim() && { complicationInPregnancy: i.complication.trim() }),
        ...(i.aliveOrDead?.trim() && { aliveOrDead: i.aliveOrDead.trim() }),
        ...(i.ageOfDeath?.trim() && { ageAtDeath: i.ageOfDeath.trim() }),
        ...(i.causeOfDeath?.trim() && { causeOfDeath: i.causeOfDeath.trim() }),
      }));
    if (obs.length > 0) out.obstetricHistories = obs;

    const preg = {};
    if (fd.presentPregnancy.dateOfBooking?.trim()) preg.dateOfBooking = fd.presentPregnancy.dateOfBooking.trim();
    if (fd.presentPregnancy.lmp?.trim()) preg.LMP = fd.presentPregnancy.lmp.trim();
    if (fd.presentPregnancy.edd?.trim()) preg.EDD = fd.presentPregnancy.edd.trim();
    if (fd.presentPregnancy.bleeding?.trim()) preg.bleeding = fd.presentPregnancy.bleeding.trim();
    if (fd.presentPregnancy.durationInWeeks?.trim()) preg.durationOfPregnancyInWeek = fd.presentPregnancy.durationInWeeks.trim();
    if (fd.presentPregnancy.fmf?.trim()) preg.FMF = fd.presentPregnancy.fmf.trim();
    if (fd.presentPregnancy.headache?.trim()) preg.headache = fd.presentPregnancy.headache.trim();
    if (fd.presentPregnancy.vomiting?.trim()) preg.vomiting = fd.presentPregnancy.vomiting.trim();
    if (fd.presentPregnancy.oedema?.trim()) preg.oedema = fd.presentPregnancy.oedema.trim();
    if (fd.presentPregnancy.constipation?.trim()) preg.constipation = fd.presentPregnancy.constipation.trim();
    if (fd.presentPregnancy.urinarySymptoms?.trim()) preg.urinarySymptoms = fd.presentPregnancy.urinarySymptoms.trim();
    if (fd.presentPregnancy.jaundice?.trim()) preg.jaundice = fd.presentPregnancy.jaundice.trim();
    if (fd.presentPregnancy.otherSymptoms?.trim()) preg.otherSymptoms = fd.presentPregnancy.otherSymptoms.trim();
    if (fd.presentPregnancy.vaginalDischarge?.trim()) preg.vaginalDischarge = fd.presentPregnancy.vaginalDischarge.trim();
    if (Object.keys(preg).length > 0) out.presentPregnancyHistories = [preg];

    const exams = fd.antenatalExaminations
      .filter(i => i.date?.trim() || i.heightOfFundus?.trim() || i.bp?.trim() || i.weight?.trim())
      .map(i => ({
        ...(i.date?.trim() && { Date: new Date(i.date) }),
        ...(i.heightOfFundus?.trim() && { heightOfFundus: i.heightOfFundus.trim() }),
        ...(i.ega?.trim() && { EGA: i.ega.trim() }),
        ...(i.presentationAndLie?.trim() && { presentationAndLife: i.presentationAndLie.trim() }),
        ...(i.relationsOfPpToBirth?.trim() && { relationOfPPToBrim: i.relationsOfPpToBirth.trim() }),
        ...(i.foetalHeart?.trim() && { foetalHeart: i.foetalHeart.trim() }),
        ...(i.urine?.trim() && { urine: i.urine.trim() }),
        ...(i.weight?.trim() && { weight: i.weight.trim() }),
        ...(i.bp?.trim() && { bloodPressure: i.bp.trim() }),
        ...(i.nextVisit?.trim() && { nextVisit: i.nextVisit.trim() }),
        ...(i.remarks?.trim() && { remarks: i.remarks.trim() }),
      }));
    if (exams.length > 0) out.anteNatalExamination = exams;

    return out;
  };

  const handleSave = async () => {
    setSaving(true);
    const backendData = transformFrontendToBackend(formData);
    toast.promise(
      isEditing
        ? updateAnteNatalRecord(patientId, recordIndex, backendData)
        : createAnteNatalRecord(backendData),
      {
        loading: isEditing ? 'Updating record...' : 'Saving record...',
        success: () => {
          navigate(`/dashboard/doctor/medical-history/${patientId}`);
          return isEditing ? 'Record updated successfully!' : 'Record created successfully!';
        },
        error: (err) => err?.message || 'Failed to save record',
      }
    ).finally(() => setSaving(false));
  };

  // --- Form field updaters ---
  const updateMedical = (field, value) => setFormData(p => ({ ...p, previousMedicalHistory: { ...p.previousMedicalHistory, [field]: value } }));
  const updateFamily = (field, value) => setFormData(p => ({ ...p, familyHistory: { ...p.familyHistory, [field]: value } }));
  const updatePregnancy = (field, value) => { if (field === 'takenBy') return; setFormData(p => ({ ...p, presentPregnancy: { ...p.presentPregnancy, [field]: value } })); };
  const addObstetric = () => setFormData(p => ({ ...p, previousObstetricHistory: [...p.previousObstetricHistory, { date: '', durationOfPregnancy: '', birthWeight: '', complication: '', aliveOrDead: '', ageOfDeath: '', causeOfDeath: '' }] }));
  const updateObstetric = (idx, field, value) => setFormData(p => ({ ...p, previousObstetricHistory: p.previousObstetricHistory.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  const removeObstetric = (idx) => setFormData(p => ({ ...p, previousObstetricHistory: p.previousObstetricHistory.filter((_, i) => i !== idx) }));
  const addExamination = () => setFormData(p => ({ ...p, antenatalExaminations: [...p.antenatalExaminations, { date: '', heightOfFundus: '', ega: '', presentationAndLie: '', relationsOfPpToBirth: '', foetalHeart: '', urine: '', weight: '', bp: '', nextVisit: '', remarks: '', signature: doctorName }] }));
  const updateExamination = (idx, field, value) => setFormData(p => ({ ...p, antenatalExaminations: p.antenatalExaminations.map((item, i) => i === idx ? { ...item, [field]: value } : item) }));
  const removeExamination = (idx) => setFormData(p => ({ ...p, antenatalExaminations: p.antenatalExaminations.filter((_, i) => i !== idx) }));

  if (loadingPatient || loadingData) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className="flex-1 flex items-center justify-center flex-col gap-3">
          <div className="loading loading-spinner loading-lg"></div>
          <p className="text-base-content/60 text-sm">
            {loadingData ? "Loading record data..." : "Loading patient..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200/50">
      <Toaster position="top-right" />

      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={() => setIsSidebarOpen(false)} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-semibold text-base-content">
                    {isEditing ? "Edit Ante-Natal Record" : "New Ante-Natal Record"}
                  </h1>
                </div>
                <div className="flex items-center gap-1 flex-col">
                  <p className="text-sm text-base-content/70">{patientName || "Unknown"}</p>
                  <p className="text-sm text-base-content/70">{patient?.hospitalId || patientId || "—"}</p>
                </div>
              </div>
              <button
                className="btn btn-ghost text-error btn-md btn-circle"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}
              >✕</button>
            </div>
          </div>

          {/* Previous Medical History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold mb-4">PREVIOUS MEDICAL HISTORY</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ['heartDisease', 'Heart Disease'],
                  ['yawsOrSyphilis', 'Yaws or Syphilis'],
                  ['previousOperation', 'Previous Operation'],
                  ['kidney', 'Kidney'],
                  ['hypertension', 'Hypertension'],
                  ['others', 'Others'],
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className="label"><span className="label-text">{label}</span></label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Details"
                      value={formData.previousMedicalHistory[field]}
                      onChange={(e) => updateMedical(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Family History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold mb-4">FAMILY HISTORY</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[['twins', 'Twins'], ['malformation', 'Malformation'], ['tuberculosis', 'Tuberculosis']].map(([field, label]) => (
                  <div key={field}>
                    <label className="label"><span className="label-text">{label}</span></label>
                    <input
                      type="text"
                      className="input input-bordered w-full"
                      placeholder="Details"
                      value={formData.familyHistory[field]}
                      onChange={(e) => updateFamily(field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Previous Obstetric History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold mb-4">PREVIOUS OBSTETRIC HISTORY</h3>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200">
                      {['Date', 'Duration Of Pregnancy', 'Birth Weight', 'Complication', 'Alive or Dead', 'Age of Death', 'Cause Of Death', ''].map(h => (
                        <th key={h} className="font-medium text-base-content/70 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.previousObstetricHistory.map((item, idx) => (
                      <tr key={idx} className="border-b border-base-200 last:border-0">
                        <td className="py-2"><input type="date" className="input input-bordered input-sm w-full" value={item.date} onChange={(e) => updateObstetric(idx, 'date', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="e.g. 9 months" value={item.durationOfPregnancy} onChange={(e) => updateObstetric(idx, 'durationOfPregnancy', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="e.g. 3.5 kg" value={item.birthWeight} onChange={(e) => updateObstetric(idx, 'birthWeight', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="Complications" value={item.complication} onChange={(e) => updateObstetric(idx, 'complication', e.target.value)} /></td>
                        <td className="py-2">
                          <select className="select select-bordered select-sm w-full" value={item.aliveOrDead} onChange={(e) => updateObstetric(idx, 'aliveOrDead', e.target.value)}>
                            <option value="">Select</option>
                            <option value="Alive">Alive</option>
                            <option value="Dead">Dead</option>
                          </select>
                        </td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="Age" value={item.ageOfDeath} onChange={(e) => updateObstetric(idx, 'ageOfDeath', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="Cause" value={item.causeOfDeath} onChange={(e) => updateObstetric(idx, 'causeOfDeath', e.target.value)} /></td>
                        <td className="py-2 text-right"><button onClick={() => removeObstetric(idx)} className="btn btn-ghost btn-xs text-error"><span className="text-lg font-bold">−</span></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-sm btn-outline mt-4" onClick={addObstetric}>+ Add Previous Obstetric History</button>
              </div>
            </div>
          </div>

          {/* Present Pregnancy */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold mb-4">HISTORY OF PRESENT PREGNANCY</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { field: 'dateOfBooking', label: 'Date of Booking', type: 'date' },
                  { field: 'lmp', label: 'LMP', type: 'date' },
                  { field: 'edd', label: 'EDD', type: 'date' },
                  { field: 'bleeding', label: 'Bleeding', type: 'text', placeholder: 'Yes/No/Details' },
                  { field: 'durationInWeeks', label: 'Duration of Pregnancy in Weeks', type: 'number' },
                  { field: 'fmf', label: 'FMF', type: 'text', placeholder: 'Fetal Movement Felt' },
                  { field: 'headache', label: 'Headache', type: 'text', placeholder: 'Yes/No/Details' },
                  { field: 'vomiting', label: 'Vomiting', type: 'text', placeholder: 'Yes/No/Details' },
                  { field: 'oedema', label: 'Oedema', type: 'text', placeholder: 'Yes/No/Details' },
                  { field: 'constipation', label: 'Constipation', type: 'text', placeholder: 'Yes/No/Details' },
                  { field: 'urinarySymptoms', label: 'Urinary Symptoms', type: 'text', placeholder: 'Details' },
                  { field: 'jaundice', label: 'Jaundice', type: 'text', placeholder: 'Yes/No/Details' },
                  { field: 'otherSymptoms', label: 'Other Symptoms', type: 'text', placeholder: 'Details' },
                  { field: 'vaginalDischarge', label: 'Vaginal Discharge', type: 'text', placeholder: 'Details' },
                ].map(({ field, label, type, placeholder }) => (
                  <div key={field}>
                    <label className="label"><span className="label-text">{label}</span></label>
                    <input
                      type={type}
                      className="input input-bordered w-full"
                      placeholder={placeholder}
                      value={formData.presentPregnancy[field]}
                      onChange={(e) => updatePregnancy(field, e.target.value)}
                    />
                  </div>
                ))}
                <div>
                  <label className="label"><span className="label-text">Taken By</span></label>
                  <input type="text" className="input input-bordered w-full" value={formData.presentPregnancy.takenBy || doctorName} disabled />
                </div>
              </div>
            </div>
          </div>

          {/* Antenatal Examinations */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold mb-4">ANTE-NATAL EXAMINATIONS</h3>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200">
                      {['Date', 'Height Of Fundus', 'E.G.A', 'Presentation And Lie', 'Relations of P.P to Birth', 'Foetal Heart', 'Urine', 'Weight(kg)', 'B.P(MnHg)', 'Next Visit (week)', 'Remarks', 'Signature', ''].map(h => (
                        <th key={h} className="font-medium text-base-content/70 py-2">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {formData.antenatalExaminations.map((item, idx) => (
                      <tr key={idx} className="border-b border-base-200 last:border-0">
                        <td className="py-2"><input type="date" className="input input-bordered input-sm w-full" value={item.date} onChange={(e) => updateExamination(idx, 'date', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="cm" value={item.heightOfFundus} onChange={(e) => updateExamination(idx, 'heightOfFundus', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="weeks" value={item.ega} onChange={(e) => updateExamination(idx, 'ega', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="e.g. Cephalic" value={item.presentationAndLie} onChange={(e) => updateExamination(idx, 'presentationAndLie', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="Relations" value={item.relationsOfPpToBirth} onChange={(e) => updateExamination(idx, 'relationsOfPpToBirth', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="bpm" value={item.foetalHeart} onChange={(e) => updateExamination(idx, 'foetalHeart', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="Results" value={item.urine} onChange={(e) => updateExamination(idx, 'urine', e.target.value)} /></td>
                        <td className="py-2"><input type="number" step="0.1" className="input input-bordered input-sm w-full" placeholder="kg" value={item.weight} onChange={(e) => updateExamination(idx, 'weight', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="120/80" value={item.bp} onChange={(e) => updateExamination(idx, 'bp', e.target.value)} /></td>
                        <td className="py-2"><input type="number" className="input input-bordered input-sm w-full" placeholder="week" value={item.nextVisit} onChange={(e) => updateExamination(idx, 'nextVisit', e.target.value)} /></td>
                        <td className="py-2"><textarea className="textarea textarea-bordered textarea-sm w-full" placeholder="remarks" value={item.remarks} onChange={(e) => updateExamination(idx, 'remarks', e.target.value)} /></td>
                        <td className="py-2"><input type="text" className="input input-bordered input-sm w-full" placeholder="Signature" value={item.signature || doctorName} onChange={(e) => updateExamination(idx, 'signature', e.target.value)} /></td>
                        <td className="py-2 text-right"><button onClick={() => removeExamination(idx)} className="btn btn-ghost btn-xs text-error"><span className="text-lg font-bold">−</span></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="btn btn-sm btn-outline mt-4" onClick={addExamination}>+ Add Ante-Natal Examination</button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4 pb-12">
            <button
              className={`btn btn-primary text-white px-12 h-12 text-lg font-normal normal-case rounded-md ${saving ? "loading" : ""}`}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (isEditing ? "Updating..." : "Saving...") : (isEditing ? "Update" : "Save Now")}
            </button>
            <button
              className="btn btn-outline px-12 h-12 text-lg font-normal normal-case rounded-md"
              onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`)}
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AntenatalRecords;