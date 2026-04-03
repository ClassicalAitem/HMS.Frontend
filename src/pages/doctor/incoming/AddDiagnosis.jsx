import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getAllComplaint } from "@/services/api/medicalRecordAPI";
import { createConsultation } from "@/services/api/consultationAPI";
import { getAllDependantsForPatient } from "@/services/api/dependantAPI";
import toast from "react-hot-toast";
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoIosCloseCircleOutline } from "react-icons/io";

// Modals
import AddComplaintModal from "./modals/AddComplaintModal";
import AddFamilyHistoryModal from "./modals/AddFamilyHistoryModal";
import AddHistoryModal from "./modals/AddHistoryModal";
import { ConfirmationModal } from "@/components/modals";
import { getInventories } from "@/services/api/inventoryAPI";

const AddDiagnosis = () => {
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
  const [dependants, setDependants] = useState([]);
  const [selectedDependantId, setSelectedDependantId] = useState("");
  const selectedDependant = useMemo(() => {
    if (!selectedDependantId) return null;
    return dependants.find(
      d => (d.id || d._id) === selectedDependantId
    ) || null;
  }, [selectedDependantId, dependants]);

  // Form State
  const [complaints, setComplaints] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [surgicalHistory, setSurgicalHistory] = useState([]);
  const [familyHistory, setFamilyHistory] = useState([]);
  const [socialHistory, setSocialHistory] = useState([]);
  const [allergyHistory, setAllergyHistory] = useState([]);
  const [notes, setNotes] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [historyOfPresentingComplaint, setHistoryOfPresentingComplaint] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [cid, setCid] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState({
    symptoms: [],
    surgical: [],
    family: [],
    social: [],
    allergic: [],
    diagnosis: [],
  });

  // ✅ Fix 1 — fetch dependants in its own separate useEffect (was nested before)
  useEffect(() => {
    let mounted = true;
    const fetchDependants = async () => {
      try {
        const res = await getAllDependantsForPatient(patientId);
        const raw =
          res?.data?.data?.dependants ??
          res?.data?.dependants ??
          res?.data ??
          [];
        // Normalize dependants to always have id and fullName
        const normalized = (Array.isArray(raw) ? raw : []).map(dep => ({
          ...dep,
          id: dep.id || dep._id,
          fullName: dep.fullName || `${dep.firstName || ""} ${dep.lastName || ""}`.trim(),
        }));
        if (mounted) setDependants(normalized);
      } catch (error) {
        console.error("Error fetching dependants:", error);
      }
    };
    if (patientId) fetchDependants();
    return () => { mounted = false; };
  }, [patientId]);

  // ✅ Fix 2 — inventory fetch in its own useEffect
  useEffect(() => {
    let mounted = true;
    const loadInventory = async () => {
      try {
        const res = await getInventories();
        const list = Array.isArray(res?.data) ? res.data : res?.data ?? [];
        if (mounted) setMedicalRecords(prev => ({ ...prev, allergic: list }));
      } catch (err) {
        console.error("InventoryStocks: fetch error", err);
      }
    };
    loadInventory();
    return () => { mounted = false; };
  }, []);

  // ✅ Fix 3 — medical records + patient in its own useEffect
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const records = await getAllComplaint();
        if (mounted && Array.isArray(records)) {
          setMedicalRecords(prev => ({
            ...prev,
            symptoms: records.filter(r => r.category === "symptoms"),
            surgical: records.filter(r => r.category === "surgical"),
            family: records.filter(r => r.category === "family"),
            social: records.filter(r => r.category === "social"),
            allergic: records.filter(r => r.category === "allergic"),
            diagnosis: records.filter(r => r.category === "diagnosis"),
          }));
        }
      } catch (err) {
        console.error("Failed to load medical records", err);
      }

      if (snapshot) {
        if (mounted) {
          setPatient(snapshot);
          setLoadingPatient(false);
        }
        return;
      }

      if (!patientId) return;

      try {
        setLoadingPatient(true);
        const res = await getPatientById(patientId);
        const data = res?.data ?? res;
        if (mounted) setPatient(data);
      } catch (err) {
        console.error("Failed to load patient", err);
      } finally {
        if (mounted) setLoadingPatient(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId, snapshot]);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Handlers
  const handleAddComplaint = (item) => setComplaints(prev => [...prev, item]);
  const handleAddMedical = (item) => setMedicalHistory(prev => [...prev, item]);
  const handleAddSurgical = (item) => setSurgicalHistory(prev => [...prev, item]);
  const handleAddFamily = (item) => setFamilyHistory(prev => [...prev, item]);
  const handleAddSocial = (item) => setSocialHistory(prev => [...prev, item]);
  const handleAddAllergy = (item) => setAllergyHistory(prev => [...prev, item]);

  const removeComplaint = (idx) => setComplaints(prev => prev.filter((_, i) => i !== idx));
  const removeMedical = (idx) => setMedicalHistory(prev => prev.filter((_, i) => i !== idx));
  const removeSurgical = (idx) => setSurgicalHistory(prev => prev.filter((_, i) => i !== idx));
  const removeFamily = (idx) => setFamilyHistory(prev => prev.filter((_, i) => i !== idx));
  const removeSocial = (idx) => setSocialHistory(prev => prev.filter((_, i) => i !== idx));
  const removeAllergy = (idx) => setAllergyHistory(prev => prev.filter((_, i) => i !== idx));

  const handleAttachmentsChange = (e) => {
    const newFiles = Array.from(e.target.files || []);
    setAttachments(prev => [...prev, ...newFiles]);
  };

  const removeAttachment = (idx) => {
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const onSave = () => setIsConfirmOpen(true);

  // ✅ Fix 4 — handleConfirmSave is now clean with dependantId included
const handleConfirmSave = async () => {
  setIsConfirmOpen(false);
  if (!patientId) return;

    const payload = {
      patientId,
      ...(selectedDependantId && { dependantId: selectedDependantId }),
      ...(selectedDependantId && selectedDependant && { dependant: selectedDependant }),
      visitReason,
      complaintHistory: historyOfPresentingComplaint,
      diagnosis: "Pending Diagnosis",
      notes,
      attachments,
      complaint: complaints.map(c => {
        let days = c.value || parseInt(c.duration) || 1;
        const unit = c.unit;
        if (unit === "Week(s)") days *= 7;
        else if (unit === "Month(s)") days *= 30;
        else if (unit === "Year(s)") days *= 365;
        return { symptom: c.name, durationInDays: days };
      }),
      surgicalHistory: surgicalHistory.map(s => ({
        procedureName: s,
        dateOfSurgery: new Date().toISOString().split("T")[0],
      })),
      familyHistory: familyHistory.map(f => ({
        relation: f.title,
        condition: f.value,
        value: "1",
      })),
      medicalHistory: medicalHistory.map(m => ({
        title: m,
        value: "1",
      })),
      allergicHistory: allergyHistory.map(a => ({ allergen: a })),
      socialHistory: socialHistory.map(s => ({
        habit: s,
        frequencyPerDay: "1",
      })),
    };


  setSaving(true);
  toast.promise(
    createConsultation(payload),
    {
      loading: "Saving consultation...",
      success: (res) => {
        const data = res?.data ?? res;
        setCid(data.id || data._id);


        return "Consultation saved successfully";
      },
      error: (err) =>
        err?.response?.data?.message || "Failed to save consultation",
    }
  ).finally(() => setSaving(false));
};
  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">

          {/* Header Section */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 w-full justify-between">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-base-content">Add New Consultation</h1>
                <div className="flex items-center gap-1 flex-col">
                  <p className="text-sm text-base-content/70">{patientName || ""}</p>
                  <p className="text-sm text-base-content/70">{patient?.hospitalId || patientId || "—"}</p>
                </div>
              </div>
              <IoIosCloseCircleOutline
                className="text-error text-3xl cursor-pointer"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}`, {
                  state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient }
                })}
              />
            </div>
          </div>

          {/* Dependant Selection */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold text-base-content mb-2">Record For</h3>
              <select
                className="select select-bordered w-full"
                value={selectedDependantId}
                onChange={e => setSelectedDependantId(e.target.value)}
              >
                <option value=""> Patient ({patientName})</option>
                {dependants.length > 0 ? (
                  dependants.map(dep => (
                    <option key={dep.id} value={dep.id}>
                      {dep.fullName || "Unknown"} — {dep.relationshipType || dep.relation || "Dependant"}
                    </option>
                  ))
                ) : (
                  <option disabled value="">No dependants found</option>
                )}
              </select>
              {selectedDependant && (
                <div className="mt-2 text-sm text-base-content/70">
                  <span className="badge badge-secondary mr-2">Dependant</span>
                  <span>{selectedDependant.fullName}</span>
                  {selectedDependant.relationshipType && (
                    <span className="ml-2 badge badge-outline badge-sm">{selectedDependant.relationshipType}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Visit Reason */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold text-base-content mb-2">Visit Reason</h3>
              <textarea
                className="textarea textarea-bordered w-full text-base min-h-[150px] focus:outline-none focus:border-primary resize-y rounded-md"
                placeholder="e.g. for wellness"
                value={visitReason}
                onChange={(e) => setVisitReason(e.target.value)}
              />
            </div>
          </div>

          {/* Complaint Section */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center border-b border-base-200">
                <h3 className="card-title text-lg font-semibold text-base-content">Complaint</h3>
                <button
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case"
                  onClick={() => setActiveModal("complaint")}
                >
                  <span className="text-lg">+</span> Add Complaint
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200">
                      {/* ✅ Fix 5 — no code inside <th>, just labels */}
                      <th className="font-medium text-base-content/70 py-4 pl-6">Complaint Name</th>
                      <th className="font-medium text-base-content/70 py-4">Duration</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length > 0 ? (
                      complaints.map((item, idx) => (
                        <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/50">
                          <td className="py-4 pl-6 font-medium text-base-content">{item.name}</td>
                          <td className="py-4 text-base-content/80">{item.duration} {item.unit}</td>
                          <td className="py-4 pr-6 text-right">
                            <button onClick={() => removeComplaint(idx)} className="btn btn-ghost btn-xs text-error">
                              <span className="text-lg font-bold">−</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-base-content/40">No complaints recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* History of Presenting Complaint */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold text-base-content mb-2">History of Presenting Complaint</h3>
              <textarea
                className="textarea textarea-bordered w-full text-base min-h-[120px] focus:outline-none focus:border-primary resize-y rounded-md"
                placeholder="Describe the history of presenting complaint..."
                value={historyOfPresentingComplaint}
                onChange={(e) => setHistoryOfPresentingComplaint(e.target.value)}
              />
            </div>
          </div>

          {/* Medical History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Medical History</h3>
                <button
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case"
                  onClick={() => setActiveModal("medical")}
                >
                  <span className="text-lg">+</span> Add Medical History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {medicalHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm text-base-content shadow-sm">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeMedical(idx)} className="text-error ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                      <IoCloseCircleOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {medicalHistory.length === 0 && <span className="text-sm text-base-content/40 italic">No medical history recorded</span>}
              </div>
            </div>
          </div>

          {/* Surgical History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Surgical History</h3>
                <button
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case"
                  onClick={() => setActiveModal("surgical")}
                >
                  <span className="text-lg">+</span> Add Surgical History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {surgicalHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm text-base-content shadow-sm">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeSurgical(idx)} className="text-error ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                      <IoCloseCircleOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {surgicalHistory.length === 0 && <span className="text-sm text-base-content/40 italic">No surgical history recorded</span>}
              </div>
            </div>
          </div>

          {/* Family History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center border-b border-base-200">
                <h3 className="card-title text-lg font-semibold text-base-content">Family History</h3>
                <button
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case"
                  onClick={() => setActiveModal("family")}
                >
                  <span className="text-lg">+</span> Add Family History
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200">
                      <th className="font-medium text-base-content/70 py-4 pl-6 w-1/2">Title</th>
                      <th className="font-medium text-base-content/70 py-4 w-1/2">Value</th>
                      <th className="w-16"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {familyHistory.length > 0 ? (
                      familyHistory.map((item, idx) => (
                        <tr key={idx} className="border-b border-base-200 last:border-0 hover:bg-base-200/50">
                          <td className="py-4 pl-6 font-medium text-base-content">{item.title}</td>
                          <td className="py-4 text-base-content/80">{item.value}</td>
                          <td className="py-4 pr-6 text-right">
                            <button onClick={() => removeFamily(idx)} className="btn btn-ghost btn-xs text-error">
                              <span className="text-lg font-bold">−</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-base-content/40">No family history recorded</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Social History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Social History</h3>
                <button
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case"
                  onClick={() => setActiveModal("social")}
                >
                  <span className="text-lg">+</span> Add Social History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {socialHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeSocial(idx)} className="text-error ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                      <IoCloseCircleOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {socialHistory.length === 0 && <span className="text-sm text-base-content/40 italic">No social history recorded</span>}
              </div>
            </div>
          </div>

          {/* Allergy History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Past Allergy History</h3>
                <button
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case"
                  onClick={() => setActiveModal("allergy")}
                >
                  <span className="text-lg">+</span> Add Allergy History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {allergyHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm shadow-sm">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeAllergy(idx)} className="text-error ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                      <IoCloseCircleOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {allergyHistory.length === 0 && <span className="text-sm text-base-content/40 italic">No allergy history recorded</span>}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold text-base-content mb-3">Notes</h3>
              <textarea
                className="textarea textarea-bordered w-full text-base min-h-[150px] focus:outline-none focus:border-primary resize-y rounded-md"
                placeholder="Enter Additional Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          {/* Attachments */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold text-base-content mb-3">
                Attachments <span className="text-sm font-normal text-base-content/60">(optional)</span>
              </h3>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={handleAttachmentsChange}
                className="file-input file-input-bordered w-full"
              />
              {attachments.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-sm font-medium text-base-content">Selected Files:</p>
                  <ul className="space-y-2">
                    {attachments.map((file, i) => (
                      <li key={i} className="flex items-center justify-between p-2 bg-base-200/50 rounded-lg">
                        <span className="text-sm text-base-content truncate">{file.name}</span>
                        <button type="button" onClick={() => removeAttachment(i)} className="btn btn-ghost btn-xs text-error">
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 pt-4 pb-12">
            <button
              className={`btn btn-primary text-white px-12 h-12 text-lg font-normal normal-case rounded-md ${saving ? "loading" : ""}`}
              onClick={onSave}
              disabled={saving}
            >
              Save Now
            </button>
            {cid && (
              <button
                className="btn btn-outline border-base-300 text-base-content px-12 h-12 text-lg font-normal normal-case rounded-md"
                onClick={() => navigate(`/dashboard/doctor/medical-history/${patientId}/consultation/${cid}`, {
                  state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient }
                })}
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddComplaintModal isOpen={activeModal === "complaint"} onClose={() => setActiveModal(null)} onAdd={handleAddComplaint} data={medicalRecords.symptoms} />
      <AddFamilyHistoryModal isOpen={activeModal === "family"} onClose={() => setActiveModal(null)} onAdd={handleAddFamily} data={medicalRecords.family} />
      <AddHistoryModal isOpen={activeModal === "medical"} onClose={() => setActiveModal(null)} onAdd={handleAddMedical} type="Medical" data={medicalRecords.symptoms} />
      <AddHistoryModal isOpen={activeModal === "surgical"} onClose={() => setActiveModal(null)} onAdd={handleAddSurgical} type="Surgical" data={medicalRecords.surgical} />
      <AddHistoryModal isOpen={activeModal === "social"} onClose={() => setActiveModal(null)} onAdd={handleAddSocial} type="Social" data={medicalRecords.social} />
      <AddHistoryModal isOpen={activeModal === "allergy"} onClose={() => setActiveModal(null)} onAdd={handleAddAllergy} type="Allergy" data={medicalRecords.allergic} />

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSave}
        title="Save Consultation"
        message="Are you sure you want to save this consultation? This action cannot be undone."
        confirmText="Save Consultation"
        cancelText="Cancel"
      />
    </div>
  );
};

export default AddDiagnosis;