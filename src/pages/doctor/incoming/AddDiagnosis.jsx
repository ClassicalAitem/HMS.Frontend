import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import PatientHeaderActions from "@/components/doctor/patient/PatientHeaderActions";
import { getPatientById } from "@/services/api/patientsAPI";
import { getAllComplaint } from "@/services/api/medicalRecordAPI";
import { createConsultation } from "@/services/api/consultationAPI";
import toast from "react-hot-toast";
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoIosCloseCircleOutline } from "react-icons/io";

// Modals
import AddComplaintModal from "./modals/AddComplaintModal";
import AddFamilyHistoryModal from "./modals/AddFamilyHistoryModal";
import AddHistoryModal from "./modals/AddHistoryModal";
import { ConfirmationModal } from "@/components/modals";

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

  // Form State
  const [complaints, setComplaints] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [surgicalHistory, setSurgicalHistory] = useState([]);
  const [familyHistory, setFamilyHistory] = useState([]);
  const [socialHistory, setSocialHistory] = useState([]);
  const [allergyHistory, setAllergyHistory] = useState([]);
  const [notes, setNotes] = useState("");
  const [visitReason, setVisitReason] = useState("");
  const [diagnosis, setDiagnosis] = useState("");

  // Modals State
  const [activeModal, setActiveModal] = useState(null); // 'complaint', 'medical', 'surgical', 'family', 'social', 'allergy'
  const [medicalRecords, setMedicalRecords] = useState({
    symptoms: [],
    surgical: [],
    family: [],
    social: [],
    allergic: []
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        // Fetch Medical Records
        try {
          const records = await getAllComplaint();
          if (mounted && Array.isArray(records)) {
            const categorized = {
              symptoms: records.filter(r => r.category === 'symptoms'),
              surgical: records.filter(r => r.category === 'surgical'),
              family: records.filter(r => r.category === 'family'),
              social: records.filter(r => r.category === 'social'),
              allergic: records.filter(r => r.category === 'allergic')
            };
            setMedicalRecords(categorized);
          }
        } catch (err) {
          console.error("Failed to load medical records", err);
        }

        if (snapshot) {
          setPatient(snapshot);
          setLoadingPatient(false);
          return;
        }
        if (!patientId) return;
        setLoadingPatient(true);
        const res = await getPatientById(patientId);
        const data = res?.data ?? res;
        if (mounted) setPatient(data);
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
  const handleAddComplaint = (item) => setComplaints([...complaints, item]);
  const handleAddMedical = (item) => setMedicalHistory([...medicalHistory, item]);
  const handleAddSurgical = (item) => setSurgicalHistory([...surgicalHistory, item]);
  const handleAddFamily = (item) => setFamilyHistory([...familyHistory, item]);
  const handleAddSocial = (item) => setSocialHistory([...socialHistory, item]);
  const handleAddAllergy = (item) => setAllergyHistory([...allergyHistory, item]);

  const removeComplaint = (idx) => setComplaints(complaints.filter((_, i) => i !== idx));
  const removeMedical = (idx) => setMedicalHistory(medicalHistory.filter((_, i) => i !== idx));
  const removeSurgical = (idx) => setSurgicalHistory(surgicalHistory.filter((_, i) => i !== idx));
  const removeFamily = (idx) => setFamilyHistory(familyHistory.filter((_, i) => i !== idx));
  const removeSocial = (idx) => setSocialHistory(socialHistory.filter((_, i) => i !== idx));
  const removeAllergy = (idx) => setAllergyHistory(allergyHistory.filter((_, i) => i !== idx));

  const onSave = async () => {
    setIsConfirmOpen(true);
  };

  const handleConfirmSave = async () => {
    setIsConfirmOpen(false);
    if (!patientId) return;
    
    // Construct payload matching the new API documentation
    const payload = {
      patientId,
      visitReason: "Consultation", // This could be a form field if needed, defaulting for now
      diagnosis: "Pending Assessment", // Or derived from a new input if required
      notes: notes,
      complaint: complaints.map(c => {
        // Calculate total days based on unit
        let days = c.value || parseInt(c.duration) || 1;
        const unit = c.unit || "";
        
        if (unit === "Week(s)") days *= 7;
        else if (unit === "Month(s)") days *= 30;
        else if (unit === "Year(s)") days *= 365;
        
        return {
          symptom: c.name,
          durationInDays: days // Send as number
        };
      }),
      surgicalHistory: surgicalHistory.map(s => ({
        procedureName: s,
        dateOfSurgery: new Date().toISOString().split('T')[0] // Placeholder date as the current UI only captures name. Consider adding date input in modal.
      })),
      familyHistory: familyHistory.map(f => ({
        relation: f.title,
        condition: f.value,
        value: "1" // Default value if not captured, or derive from UI if meaningful
      })),
      medicalHistory: medicalHistory.map(m => ({
        title: m,
        value: "1" // Default value or duration if applicable
      })),
      allergicHistory: allergyHistory.map(a => ({
        allergen: a,
        severity: "medium", // Default, could be added to UI
        reaction: "reaction" // Default, could be added to UI
      })),
      socialHistory: (socialHistory || []).map(s => ({
        title: s,
        value: "1" // Default value or duration if applicable
      }))
    };

    console.log("Submitting Consultation Payload:", payload);

    setSaving(true);
    
    toast.promise(
      createConsultation(payload),
      {
        loading: 'Saving consultation...',
        success: (res) => {
          navigate(`/dashboard/doctor/medical-history/${patientId}`, { 
            replace: true, 
            state: { from: fromIncoming ? "incoming" : "patients", patientSnapshot: patient } 
          });
          return "Consultation saved successfully";
        },
        error: (err) => {
          console.error("Consultation Save Error:", err);
          return err?.response?.data?.message || "Failed to save consultation";
        }
      }
    ).finally(() => {
      setSaving(false);
    });
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
                <div>
                  <h1 className="text-2xl font-semibold text-base-content">Add New Consultation</h1>
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

          {/* Visit Reason & Diagnosis Section */}
          <div className="grid grid-cols-1 gap-4">
            <div className="card bg-base-100 shadow-sm">
              <div className="card-body p-4">
                <h3 className="card-title text-lg font-semibold text-base-content mb-2">Visit Reason</h3>
                <textarea 
                  className="textarea textarea-bordered w-full text-base min-h-[150px] focus:outline-none focus:border-primary resize-y rounded-md bg-base-100 text-base-content" 
                  placeholder="e.g. for wellness"
                  value={visitReason}
                  onChange={(e) => setVisitReason(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Complaint Section */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center border-b border-base-200">
                <h3 className="card-title text-lg font-semibold text-base-content">Complaint</h3>
                <button 
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case" 
                  onClick={() => setActiveModal('complaint')}
                >
                  <span className="text-lg">+</span> Add Complaint
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr className="border-b border-base-200">
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
                          <td className="py-4 text-base-content/80">{item.duration}</td>
                          <td className="py-4 pr-6 text-right">
                            <button onClick={() => removeComplaint(idx)} className="btn btn-ghost btn-xs text-error hover:bg-error/10">
                              <span className="text-lg font-bold">−</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-8 text-base-content/40">No complaints added</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Past Medical History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Past Medical History</h3>
                <button 
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case" 
                  onClick={() => setActiveModal('medical')}
                >
                  <span className="text-lg">+</span> Add Medical History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {medicalHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm text-base-content shadow-sm hover:border-base-content/30 transition-colors">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeMedical(idx)} className="text-error hover:text-red-700 ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                      <IoCloseCircleOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {medicalHistory.length === 0 && <span className="text-sm text-base-content/40 italic">No medical history recorded</span>}
              </div>
            </div>
          </div>

          {/* Past Surgical History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Past Surgical History</h3>
                <button 
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case" 
                  onClick={() => setActiveModal('surgical')}
                >
                  <span className="text-lg">+</span> Add Surgical History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {surgicalHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm text-base-content shadow-sm hover:border-base-content/30 transition-colors">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeSurgical(idx)} className="text-error hover:text-red-700 ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
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
                  onClick={() => setActiveModal('family')}
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
                            <button onClick={() => removeFamily(idx)} className="btn btn-ghost btn-xs text-error hover:bg-error/10">
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
                  onClick={() => setActiveModal('social')}
                >
                  <span className="text-lg">+</span> Add Social History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {socialHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm text-base-content shadow-sm hover:border-base-content/30 transition-colors">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeSocial(idx)} className="text-error hover:text-red-700 ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
                      <IoCloseCircleOutline className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {socialHistory.length === 0 && <span className="text-sm text-base-content/40 italic">No social history recorded</span>}
              </div>
            </div>
          </div>

          {/* Past Allergy History */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-0">
              <div className="p-4 flex justify-between items-center mb-2">
                <h3 className="card-title text-lg font-semibold text-base-content">Past Allergy History</h3>
                <button 
                  className="btn btn-sm btn-primary text-white border-none gap-2 font-normal normal-case" 
                  onClick={() => setActiveModal('allergy')}
                >
                  <span className="text-lg">+</span> Add Allergy History
                </button>
              </div>
              <div className="px-6 pb-6 flex flex-wrap gap-3">
                {allergyHistory.map((item, idx) => (
                  <div key={idx} className="inline-flex items-center gap-2 px-4 py-2 bg-base-100 border border-base-300 rounded-full text-sm text-base-content shadow-sm hover:border-base-content/30 transition-colors">
                    <span className="font-medium">{item}</span>
                    <button onClick={() => removeAllergy(idx)} className="text-error hover:text-red-700 ml-1 flex items-center justify-center bg-red-50 rounded-full w-5 h-5">
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
                className="textarea textarea-bordered w-full text-base min-h-[150px] focus:outline-none focus:border-primary resize-y rounded-md bg-base-100 text-base-content" 
                placeholder="Enter Additional Notes" 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
              />
            </div>
          </div>

          {/* Diagnosis */}
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title text-lg font-semibold text-base-content mb-3">Diagnosis</h3>
              <textarea 
                className="textarea textarea-bordered w-full text-base min-h-[150px] focus:outline-none focus:border-primary resize-y rounded-md bg-base-100 text-base-content" 
                placeholder="e.g. malaria parasite"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
              />
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
            <button 
              className="btn btn-outline border-base-300 hover:border-base-content hover:bg-base-200 text-base-content px-12 h-12 text-lg font-normal normal-case rounded-md"
              onClick={() => toast.success("Next step not implemented yet")}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddComplaintModal 
        isOpen={activeModal === 'complaint'} 
        onClose={() => setActiveModal(null)} 
        onAdd={handleAddComplaint} 
        data={medicalRecords.symptoms}
      />
      <AddFamilyHistoryModal 
        isOpen={activeModal === 'family'} 
        onClose={() => setActiveModal(null)} 
        onAdd={handleAddFamily} 
        data={medicalRecords.family}
      />
      <AddHistoryModal 
        isOpen={activeModal === 'medical'} 
        onClose={() => setActiveModal(null)} 
        onAdd={handleAddMedical} 
        type="Medical"
        data={medicalRecords.symptoms}
      />
      <AddHistoryModal 
        isOpen={activeModal === 'surgical'} 
        onClose={() => setActiveModal(null)} 
        onAdd={handleAddSurgical} 
        type="Surgical"
        data={medicalRecords.surgical}
      />
      <AddHistoryModal 
        isOpen={activeModal === 'social'} 
        onClose={() => setActiveModal(null)} 
        onAdd={handleAddSocial} 
        type="Social"
        data={medicalRecords.social}
      />
      <AddHistoryModal 
        isOpen={activeModal === 'allergy'} 
        onClose={() => setActiveModal(null)} 
        onAdd={handleAddAllergy} 
        type="Allergy"
        data={medicalRecords.allergic}
      />
      
      {/* Confirmation Modal */}
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
