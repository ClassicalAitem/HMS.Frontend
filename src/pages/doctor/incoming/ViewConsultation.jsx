import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/medical-director/dashboard/Sidebar";
import { getConsultationById, getConsultationFile, updateConsultation } from "@/services/api/consultationAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { usersAPI } from "@/services/api/usersAPI";
import { IoIosCloseCircleOutline } from "react-icons/io";import { FaUserMd, FaNotesMedical, FaSyringe, FaAllergies, FaHistory, FaUsers, FaCalendarAlt, FaFileMedical, FaPlus, FaPrescriptionBottleAlt, FaFlask, FaFileImage, FaStickyNote, FaTimes } from "react-icons/fa";
import AddDiagnosisModal from "./modals/AddDiagnosisModal";
import OrderInvestigationModal from "./modals/OrderInvestigationModal";
import SendToNurseModal from "./modals/SendToNurseModal";
import AttachmentViewerModal from "@/components/modals/AttachmentViewerModal";
import { getPrescriptionsForConsultation } from "@/services/api/prescriptionsAPI";
import { getInvestigationByConsultationId } from "@/services/api/investigationAPI";
import { updateInvestigation, deleteInvestigation } from "@/services/api/investigationAPI";
import { updatePrescription, deletePrescription } from "@/services/api/prescriptionsAPI";
import AddComplaintModal from "./modals/AddComplaintModal";
import AddFamilyHistoryModal from "./modals/AddFamilyHistoryModal";
import AddHistoryModal from "./modals/AddHistoryModal";
import { getAllComplaint } from "@/services/api/medicalRecordAPI";
import { getInventories } from "@/services/api/inventoryAPI";
import { IoCloseCircleOutline } from "react-icons/io5";
import { FaTrash, FaEdit } from "react-icons/fa";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";

const ViewConsultation = () => {
  const { patientId, consultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === "incoming";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [consultationDoctorName, setConsultationDoctorName] = useState("");
  const [patient, setPatient] = useState(null);const [prescriptions, setPrescriptions] = useState(() => {
  const saved = localStorage.getItem('currentPrescriptions');
  return saved ? JSON.parse(saved) : [];
});
  const [labRequests, setLabRequests] = useState([]); 
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] = useState(false);
  const [isSendToNurseModalOpen, setIsSendToNurseModalOpen] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [editingLab, setEditingLab] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    visitReason: '',
    notes: '',
    complaints: [],
    medicalHistory: [],
    surgicalHistory: [],
    familyHistory: [],
    socialHistory: [],
    allergyHistory: [],
  });
  const [activeModal, setActiveModal] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState({
    symptoms: [], surgical: [], family: [], social: [], allergic: []
  });



  const canEdit = useMemo(() => {
    if (!consultation?.createdAt) return false;
    return (Date.now() - new Date(consultation.createdAt).getTime()) < 24 * 60 * 60 * 1000;
  }, [consultation]);


  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getConsultationById(consultationId);
      const data = res?.data ?? res;
      setConsultation(data);
      if (data?.doctorId && !data?.doctorName && !data?.doctor) {
        try {
          const userRes = await usersAPI.getUserById(data.doctorId);
          const user = userRes?.data ?? userRes;
          const resolvedName = user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
          if (resolvedName) {
            setConsultationDoctorName(resolvedName);
          }
        } catch (err) {
          console.warn("Failed to resolve consultation doctor name:", err);
        }
      } else {
        setConsultationDoctorName("");
      }
      
      const pid = patientId || data?.patientId;
      if (pid) {
        const promises = [
           getPatientById(pid),
           getPrescriptionsForConsultation(consultationId),
           getInvestigationByConsultationId(consultationId)
        ];

        const results = await Promise.allSettled(promises);

        // 1. Patient Details
        if (results[0].status === 'fulfilled') {
          const pRes = results[0].value;
          setPatient(pRes?.data ?? pRes);
        } else {
          console.error("Error loading patient:", results[0].reason);
        }

        // 2. Prescriptions
        if (results[1].status === 'fulfilled') {
           const presRes = results[1].value;
           const rawData = presRes?.data ?? presRes;
           let list = [];
           if (Array.isArray(rawData)) {
             list = rawData;
           } else if (rawData && typeof rawData === 'object') {
             if (Object.keys(rawData).length > 0) list = [rawData];
           }
           setPrescriptions(list);
        } else {
           console.error("Error loading prescriptions:", results[1].reason);
        }

        // 3. Lab Investigations
        if (results[2].status === 'fulfilled') {
           const labRes = results[2].value;
           const rawLabData = labRes?.data ?? labRes ?? [];
           const labList = Array.isArray(rawLabData) ? rawLabData : [];
           setLabRequests(labList);
        } else {
           console.error("Error loading lab investigations:", results[2].reason);
        }

      } else if (data?.patient) {
        setPatient(data.patient);
      }
    } catch (error) {
      console.error("Error loading consultation details:", error);
    } finally {
      setLoading(false);
    }
  };

    useEffect(() => {
    if (!consultation) return;
    setEditForm({
      visitReason: consultation.visitReason || '',
      notes: consultation.notes || '',
      complaints: (consultation.complaint || []).map(c => ({
        name: c.symptom,
        duration: (c.durationInDays || 0).toString(),
        unit: 'Day(s)'
      })),
      medicalHistory: (consultation.medicalHistory || []).map(m =>
        typeof m === 'object' ? m.title || m.name || '' : m
      ),
      surgicalHistory: (consultation.surgicalHistory || []).map(s =>
        typeof s === 'object' ? s.procedureName || s.procedure || '' : s
      ),
      familyHistory: (consultation.familyHistory || []).map(f => ({
        title: f.relation || f.title || '',
        value: f.condition || f.value || ''
      })),
      socialHistory: (consultation.socialHistory || []).map(s =>
        typeof s === 'object' ? s.title || s.habit || '' : s
      ),
      allergyHistory: (consultation.allergicHistory || []).map(a =>
        typeof a === 'object' ? a.allergen || a.title || '' : a
      ),
    });
  }, [consultation]);



  useEffect(() => {
    if (!isEditMode) return;
    const loadRecords = async () => {
      try {
        const [recordsRes, inventoryRes] = await Promise.allSettled([
          getAllComplaint(),
          getInventories()
        ]);
        if (recordsRes.status === 'fulfilled' && Array.isArray(recordsRes.value)) {
          const r = recordsRes.value;
          setMedicalRecords({
            symptoms: r.filter(x => x.category === 'symptoms'),
            surgical: r.filter(x => x.category === 'surgical'),
            family:   r.filter(x => x.category === 'family'),
            social:   r.filter(x => x.category === 'social'),
            allergic: r.filter(x => x.category === 'allergic'),
          });
        }
      } catch (err) {
        console.error('Failed to load medical records', err);
      }
    };
    loadRecords();
  }, [isEditMode]);




  const handleSaveEdit = async () => {
    setIsSavingEdit(true);
    try {
      const payload = {
        visitReason: editForm.visitReason,
        notes: editForm.notes,
        complaint: editForm.complaints.map(c => {
          let days = parseInt(c.duration) || 1;
          if (c.unit === 'Week(s)') days *= 7;
          else if (c.unit === 'Month(s)') days *= 30;
          else if (c.unit === 'Year(s)') days *= 365;
          return { symptom: c.name, durationInDays: days };
        }),
        surgicalHistory: editForm.surgicalHistory.map(s => ({
          procedureName: s,
          dateOfSurgery: new Date().toISOString().split('T')[0]
        })),
        familyHistory: editForm.familyHistory.map(f => ({
          relation: f.title, condition: f.value, value: '1'
        })),
        medicalHistory: editForm.medicalHistory.map(m => ({ title: m, value: '1' })),
        allergicHistory: editForm.allergyHistory.map(a => ({ allergen: a })),
        socialHistory: editForm.socialHistory.map(s => ({ title: s, value: '1' })),
      };
      await toast.promise(updateConsultation(consultationId, payload), {
        loading: 'Saving changes...',
        success: 'Consultation updated!',
        error: (err) => err?.response?.data?.message || 'Failed to update',
      });
      setIsEditMode(false);
      await loadData();
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ================= LAB INVESTIGATION =================

const handleDeleteLab = async (id) => {
  if (!window.confirm("Are you sure you want to delete this lab investigation?")) return;

  try {
    await deleteInvestigation(id);
    await loadData();
  } catch (error) {
    console.error("Error deleting investigation", error);
  }
};

const handleEditLab = async (lab, e) => {
   e?.preventDefault();
  try {
    const updatedData = {
      status: lab.status === "pending" ? "in_progress" : "pending"
    };

    await updateInvestigation(lab._id, updatedData);
    await loadData();
  } catch (error) {
    console.error("Error updating investigation", error);
  }
};


// ================= PRESCRIPTION =================

const handleDeletePrescription = async (id) => {
  if (!window.confirm("Delete this prescription?")) return;

  try {
    await deletePrescription(id);
    await loadData();
  } catch (error) {
    console.error("Error deleting prescription", error);
  }
};

const handleEditPrescription = async (pres, e) => {
   e?.preventDefault();
  try {
    const updatedData = {
      status: pres.status === "pending" ? "active" : "pending"
    };

    await updatePrescription(pres._id, updatedData);
    await loadData();
  } catch (error) {
    console.error("Error updating prescription", error);
  }
};

  const handleOpenAttachmentViewer = async (fileIndex = 0) => {
    if (!consultation?.attachedFileIds || consultation.attachedFileIds.length === 0) {
      setAttachedFiles([]);
      setCurrentFileIndex(0);
      setIsAttachmentViewerOpen(true);
      return;
    }

    setIsLoadingFiles(true);
    try {
      const files = await Promise.all(
        consultation.attachedFileIds.map(async (fileId) => {
          try {
            const response = await getConsultationFile(fileId);
            const mimeType = response.headers['content-type'] || 'application/octet-stream';
            const filename = response.headers['content-disposition']?.match(/filename="(.+?)"/)?.[1] || `file-${fileId}`;
            
            return {
              _id: fileId,
              id: fileId,
              name: filename,
              filename: filename,
              mimetype: mimeType,
              data: new Uint8Array(response.data)
            };
          } catch (error) {
            console.error(`Error loading file ${fileId}:`, error);
            return null;
          }
        })
      );
      
      const validFiles = files.filter(f => f !== null);
      setAttachedFiles(validFiles);
      setCurrentFileIndex(Math.min(fileIndex, validFiles.length - 1));
      setIsAttachmentViewerOpen(true);
    } catch (error) {
      console.error("Error loading attachments:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId, consultationId]);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleSaveAdditionalNotes = async () => {
    try {
      await updateConsultation(consultationId, { additionalNotes });
      await loadData(); 
      setIsSendToNurseModalOpen(false);
     
    } catch (error) {
      console.error("Error saving additional notes:", error);
    }
  };

  const handleEditAdditionalNote = async (noteId, currentNote) => {
    const newNote = window.prompt("Edit additional note:", currentNote);
    if (newNote === null) return; 
    try {
      let updatedNotes;
      if (Array.isArray(consultation.additionalNotes)) {
        updatedNotes = consultation.additionalNotes.map(n => n.id === noteId ? { ...n, note: newNote } : n);
      } else {
        updatedNotes = newNote; // If it's a string, update to new string
      }
      await updateConsultation(consultationId, { additionalNotes: updatedNotes });
      await loadData(); // Reload page data
      setAdditionalNotes("");
       
    } catch (error) {
      console.error("Error editing additional note:", error);
    }
  };

  const handleDeleteAdditionalNote = async (noteId) => {
    if (!window.confirm("Delete this additional note?")) return;
    try {
      const updatedNotes = consultation.additionalNotes.filter(n => n.id !== noteId);
      await updateConsultation(consultationId, { additionalNotes: updatedNotes });
      // await loadData(); 
      setAdditionalNotes("");
      
    } catch (error) {
      console.error("Error deleting additional note:", error);
    }
  };

const handleRemoveDiagnosisItem = async (itemToRemove) => {
  if (!window.confirm(`Remove "${itemToRemove}" from diagnosis?`)) return;
  try {
    const remaining = (consultation?.diagnosis || "")
      .split(',')
      .map(d => d.trim())
      .filter(d => d && d.toLowerCase() !== itemToRemove.toLowerCase());

    const payload = remaining.length > 0
      ? remaining.join(', ')
      : "Pending diagnosis"; // backend rejects empty string

    await updateConsultation(consultationId, { diagnosis: payload });
    await loadData();
  } catch (error) {
    console.error("Error removing diagnosis:", error);
    toast.error(error?.response?.data?.message || "Failed to remove diagnosis");
  }
};

  // Mapped Data
  const complaints = consultation?.complaint || [];
  const medicalHistory = consultation?.medicalHistory || [];
  const surgicalHistory = consultation?.surgicalHistory || [];
  const familyHistory = consultation?.familyHistory || [];
  const socialHistory = consultation?.socialHistory || [];
  const allergyHistory = consultation?.allergicHistory || [];
  const notes = consultation?.notes || "";
  const visitReason = consultation?.visitReason || "Not specified";
  const diagnosis = consultation?.diagnosis || "Pending diagnosis";
  const doctorName = consultation?.doctorName
    || (consultation?.doctor ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}` : null)
    || consultationDoctorName
    || (consultation?.doctorId ? `Dr. ${consultation.doctorId}` : "Unknown Doctor");
  const consultationDate = consultation?.createdAt ? formatNigeriaDate(consultation.createdAt) : "";
  const recentPrescriptions = prescriptions.slice(0, 3);

  const isForDependant = !!consultation?.dependantId;
const consultationSubject = isForDependant
  ? consultation?.dependant
    ? `${consultation.dependant.firstName || ""} ${consultation.dependant.lastName || ""}`.trim()
    : "Dependant"
  : patientName;
const subjectRelation = isForDependant
  ? consultation?.dependant?.relationshipType || "Dependant"
  : "Main Patient";

  // Helper for Skeleton Loading
  const SkeletonCard = ({ title, icon }) => (
    <div className="card bg-base-100 shadow-sm border border-base-200">
      <div className="card-body p-6">
        <div className="flex items-center gap-2 mb-4 text-base-content/60">
          {icon}
          <div className="skeleton h-6 w-32"></div>
        </div>
        <div className="space-y-3">
          <div className="skeleton h-4 w-full"></div>
          <div className="skeleton h-4 w-3/4"></div>
          <div className="skeleton h-4 w-1/2"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar />
        </div>
        
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={toggleSidebar} />
          
          <div className="flex overflow-y-auto flex-col p-4 sm:p-6 space-y-6">
            {/* Header Skeleton */}
            <div className="flex justify-between items-start mb-6">
              <div className="space-y-2">
                <div className="skeleton h-8 w-64"></div>
                <div className="skeleton h-4 w-48"></div>
              </div>
              <div className="skeleton h-10 w-10 rounded-full"></div>
            </div>

            {/* Content Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <SkeletonCard icon={<FaUserMd />} />
              <SkeletonCard icon={<FaNotesMedical />} />
              <SkeletonCard icon={<FaFileMedical />} />
              <SkeletonCard icon={<FaHistory />} />
              <SkeletonCard icon={<FaSyringe />} />
              <SkeletonCard icon={<FaUsers />} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200/50">
    <AddDiagnosisModal 
  isOpen={isDiagnosisModalOpen}
  onClose={() => setIsDiagnosisModalOpen(false)}
  consultationId={consultationId}
  existingDiagnosis={consultation?.diagnosis || ""}
  onDiagnosisAdded={(newDiagnosis) => {
    setConsultation(prev => ({ ...prev, diagnosis: newDiagnosis }));
  }}
/>
    <AddComplaintModal
  isOpen={activeModal === 'complaint'}
  onClose={() => setActiveModal(null)}
  onAdd={item => setEditForm(prev => ({ ...prev, complaints: [...prev.complaints, item] }))}
  data={medicalRecords.symptoms}
/>
<AddFamilyHistoryModal
  isOpen={activeModal === 'family'}
  onClose={() => setActiveModal(null)}
  onAdd={item => setEditForm(prev => ({ ...prev, familyHistory: [...prev.familyHistory, item] }))}
  data={medicalRecords.family}
/>
<AddHistoryModal isOpen={activeModal === 'medical'} onClose={() => setActiveModal(null)}
  onAdd={item => setEditForm(prev => ({ ...prev, medicalHistory: [...prev.medicalHistory, item] }))}
  type="Medical" data={medicalRecords.symptoms} />
<AddHistoryModal isOpen={activeModal === 'surgical'} onClose={() => setActiveModal(null)}
  onAdd={item => setEditForm(prev => ({ ...prev, surgicalHistory: [...prev.surgicalHistory, item] }))}
  type="Surgical" data={medicalRecords.surgical} />
<AddHistoryModal isOpen={activeModal === 'social'} onClose={() => setActiveModal(null)}
  onAdd={item => setEditForm(prev => ({ ...prev, socialHistory: [...prev.socialHistory, item] }))}
  type="Social" data={medicalRecords.social} />
<AddHistoryModal isOpen={activeModal === 'allergy'} onClose={() => setActiveModal(null)}
  onAdd={item => setEditForm(prev => ({ ...prev, allergyHistory: [...prev.allergyHistory, item] }))}
  type="Allergy" data={medicalRecords.allergic} />
<OrderInvestigationModal
  isOpen={isInvestigationModalOpen}
  onClose={() => {
    setIsInvestigationModalOpen(false);
    setEditingLab(null);
  }}
  patientId={patientId}
  consultationId={consultationId}
   dependantId={consultation?.dependantId || consultation?.dependant?._id || consultation?.dependant?.id}
  investigation={editingLab}
  onOrderCreated={loadData}
/>

       <SendToNurseModal
        isOpen={isSendToNurseModalOpen}
        onClose={() => setIsSendToNurseModalOpen(false)}
        consultation={consultation}
        patient={patient}
        prescriptions={prescriptions}
        labRequests={labRequests}
        additionalNotes={additionalNotes}
        patientName={patientName}
        doctorName={doctorName}
        consultationDate={consultationDate}
        complaints={complaints}
        medicalHistory={medicalHistory}
        surgicalHistory={surgicalHistory}
        familyHistory={familyHistory}
        socialHistory={socialHistory}
        allergyHistory={allergyHistory}
        notes={notes}
        visitReason={visitReason}
        diagnosis={diagnosis}
        patientId={patientId}
        consultationId={consultationId}
        onSentSuccessfully={() => navigate(fromIncoming ? '/dashboard/medical-director/incoming' : `/dashboard/medical-director/medical-history/${patientId}`)}
       />

      <AttachmentViewerModal
        isOpen={isAttachmentViewerOpen}
        onClose={() => setIsAttachmentViewerOpen(false)}
        attachments={attachedFiles}
        initialIndex={currentFileIndex}
        title="Consultation Attachments"
      />
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-base-100 p-6 rounded-xl shadow-sm border border-base-200">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary hidden sm:flex">
                <FaUserMd className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-base-content">Consultation Details</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70 mt-1">
                  <span className="flex items-center gap-1"><FaUserMd className="w-3 h-3" /> Dr. {doctorName}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1"><FaCalendarAlt className="w-3 h-3" /> {consultationDate}</span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-2">
    <span className="font-medium text-primary">{consultationSubject}</span>
    <span className={`badge badge-sm ${isForDependant ? 'badge-secondary' : 'badge-primary'}`}>
      {subjectRelation}
    </span>
    {isForDependant && (
      <span className="text-xs text-base-content/50">
        (of {patientName})
      </span>
    )}
  </div>
                </div>
              </div>
            </div>
           <div className="flex items-center gap-2">
            {canEdit && (
              <>
                {isEditMode ? (
                  <>
                    <button
                      className="btn btn-sm btn-success gap-2"
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                    >
                      {isSavingEdit ? <span className="loading loading-spinner loading-xs" /> : 'Save Changes'}
                    </button>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => setIsEditMode(false)}
                      disabled={isSavingEdit}
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-sm btn-outline btn-primary gap-2"
                    onClick={() => setIsEditMode(true)}
                  >
                    <FaEdit className="w-3 h-3" /> Edit Consultation
                  </button>
                )}
              </>
            )}
            <button
              className="btn btn-ghost btn-circle text-base-content/70 hover:bg-base-200"
              onClick={() => navigate(-1)}
            >
              <IoIosCloseCircleOutline className="w-8 h-8" />
            </button>
          </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Left Column - Key Clinical Info */}
            <div className="xl:col-span-2 space-y-6">
              
              {/* Consultation Summary Section */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                  <div className="p-4 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaNotesMedical className="text-primary w-5 h-5" />
                      <h3 className="font-bold text-lg text-base-content">Consultation Overview</h3>
                      </div>
                      <button 
                        className="btn btn-sm btn-outline btn-success gap-2"
                        onClick={() => setIsDiagnosisModalOpen(true)}
                      >
                        <FaPlus className="w-3 h-3" />
                        {(!diagnosis || diagnosis.toLowerCase().includes("pending")) ? "Add Diagnosis" : "Edit Diagnoses"}
                      </button>
                
                  </div>
                  
                  <div className="p-6 grid gap-6">
                    {/* Reason & Diagnosis Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Visit Reason</h4>
                        <div className="p-3 bg-base-200/50 rounded-lg">
                          {isEditMode ? (
                            <textarea
                              className="textarea textarea-bordered w-full"
                              rows={3}
                              value={editForm.visitReason}
                              onChange={e => setEditForm(prev => ({ ...prev, visitReason: e.target.value }))}
                            />
                          ) : (
                            <p className="font-medium text-base-content">{visitReason}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Diagnosis</h4>
                       {diagnosis.includes("Pending") ? (
                          <div className="p-3 rounded-lg border bg-warning/10 border-warning/20 text-warning-content">
                            <p className="font-medium">{diagnosis}</p>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {diagnosis.split(',').map((item, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-2 px-3 py-1 bg-success/10 border border-success/30 rounded-full text-sm text-success-content font-medium"
                              >
                                {item.trim()}
                                <button
                                  type="button"
                                  className="text-error hover:text-red-700"
                                  onClick={() => handleRemoveDiagnosisItem(item.trim())}
                                  title="Remove this diagnosis"
                                >
                                  <FaTimes className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Complaints */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60">Patient Complaints</h4>
                      {isEditMode && (
                        <button className="btn btn-xs btn-primary gap-1" onClick={() => setActiveModal('complaint')}>
                          <FaPlus className="w-2 h-2" /> Add
                        </button>
                      )}
                    </div>
                    {isEditMode ? (
                      <div className="flex flex-wrap gap-2">
                        {editForm.complaints.map((item, idx) => (
                          <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-base-content/50">{item.duration}</span>
                            <button type="button" onClick={() => setEditForm(prev => ({
                              ...prev, complaints: prev.complaints.filter((_, i) => i !== idx)
                            }))} className="text-error">
                              <FaTimes className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {editForm.complaints.length === 0 && <span className="text-sm text-base-content/40 italic">No complaints added</span>}
                      </div>
                    ) : (
                      // existing view chips
                      complaints.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {complaints.map((item, idx) => (
                            <div key={idx} className="badge badge-lg badge-outline gap-2 p-3 bg-base-100">
                              <span className="font-semibold">{item.symptom}</span>
                              {item.durationInDays && (
                                <span className="text-xs opacity-70 border-l pl-2">{item.durationInDays} days</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : <p className="text-sm text-base-content/50 italic">No complaints recorded</p>
                    )}
                  </div>

                    {/* Clinical Notes */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Clinical Notes</h4>
                      <div className="p-4 bg-base-200/30 rounded-xl border border-base-200 min-h-[100px]">
                       {isEditMode ? (
                          <textarea
                            className="textarea textarea-bordered w-full min-h-[100px]"
                            value={editForm.notes}
                            onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-base-content/80">
                            {notes || "No additional clinical notes."}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    {consultation?.attachedFileIds && consultation.attachedFileIds.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-3 flex items-center gap-2">
                          <FaFileImage className="w-4 h-4" /> Attachments ({consultation.attachedFileIds.length})
                        </h4>
                        {!attachedFiles.length && !isLoadingFiles ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {consultation.attachedFileIds.map((fileId, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleOpenAttachmentViewer(idx)}
                                disabled={isLoadingFiles}
                                className="flex items-center justify-center p-3 bg-base-200/50 rounded-lg border border-base-200 hover:border-primary hover:bg-primary/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Click to load and view"
                              >
                                <div className="flex flex-col items-center gap-1 w-full">
                                  <FaFileImage className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                                  <span className="text-xs font-medium text-base-content/70 group-hover:text-primary text-center truncate w-full px-1">
                                    Load File {idx + 1}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : isLoadingFiles ? (
                          <div className="flex justify-center p-8">
                            <span className="loading loading-spinner loading-lg text-primary"></span>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                            {attachedFiles.map((file, idx) => {
                              const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name || file.filename);
                              const getImageUrl = () => {
                                if (!file.data) return '';
                                if (typeof file.data === 'string') {
                                  return file.data.startsWith('data:') || file.data.startsWith('http') 
                                    ? file.data 
                                    : `data:${file.mimetype};base64,${file.data}`;
                                }
                                if (file.data instanceof Uint8Array) {
                                  const blob = new Blob([file.data], { type: file.mimetype });
                                  return URL.createObjectURL(blob);
                                }
                                return '';
                              };
                              return (
                                <div
                                  key={idx}
                                  className="relative group rounded-lg overflow-hidden border border-base-300 hover:border-primary transition-all cursor-pointer"
                                  onClick={() => setCurrentFileIndex(idx) || setIsAttachmentViewerOpen(true)}
                                >
                                  {isImage && getImageUrl() ? (
                                    <>
                                      <img
                                        src={getImageUrl()}
                                        alt={file.name}
                                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                        <span className="text-white text-sm font-semibold">View</span>
                                      </div>
                                    </>
                                  ) : (
                                    <div className="w-full h-32 bg-base-200 flex items-center justify-center group-hover:bg-base-300 transition-all">
                                      <FaFileImage className="w-10 h-10 text-base-content/40" />
                                    </div>
                                  )}
                                  <div className="p-2 bg-base-100 border-t border-base-300">
                                    <p className="text-xs font-medium text-base-content truncate" title={file.name}>
                                      {file.name || `File ${idx + 1}`}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Treatment Plan Section */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                  <div className="p-4 border-b border-base-200 bg-base-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FaPrescriptionBottleAlt className="text-success w-5 h-5" />
                      <h3 className="font-bold text-lg text-base-content">Treatment Plan & Orders</h3>
                    </div>
                    <div className="flex gap-2">
                     <button   
                      className="btn btn-sm btn-ghost text-primary hover:bg-primary/10 gap-2"
                        onClick={() => setIsInvestigationModalOpen(true)}
                      > 
                        <FaFlask /> Order Labs
                      </button>
                      <button
                      className="btn btn-sm btn-primary gap-2"
                        onClick={() => navigate(
                          `/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}/prescription`
                        )}
                      >
                        <FaPrescriptionBottleAlt /> Prescribe
                      </button>
                      <button 
                        className="btn btn-sm btn-info gap-2"
                        onClick={() => setIsSendToNurseModalOpen(true)}
                      >
                        <FaUserMd /> Send to Nurse
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
                  
                  {/* Lab Requests (Placeholder) */}
                    <div>
                      <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-info"></span>
                        Lab Investigations
                      </h4>
                      {labRequests.length > 0 ? (
                        <div className="grid gap-3">
                     {labRequests.map((lab, idx) => (
                        <div key={idx} className="flex justify-between items-start mb-2">

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                        <span className={`badge ${lab.status === 'in_progress' ? 'badge-info' : lab.status === 'completed' ? 'badge-success' : 'badge-ghost'} badge-sm`}>
                          {lab.status.replace('_', ' ')}
                        </span>

                        <span className="text-xs text-base-content/50">
                          Requested {formatNigeriaDate(lab.createdAt)}
                        </span>

                        {lab.priority === 'urgent' && (
                          <span className="badge badge-error badge-outline badge-xs">
                            Urgent
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-base-content/70">
                        {lab.tests?.map(test => test.name).join(', ')}
                      </div>
                      </div>


                          {/* ACTION BUTTONS */}
                          <div className="flex gap-2">

                    <button
                      type="button"
                      className="btn btn-xs btn-ghost text-warning"
                      onClick={() => {
                        setEditingLab(lab);
                        setIsInvestigationModalOpen(true);
                      }}
                    >
                      <FaEdit />
                    </button>

                  <button
                    type="button"
                    className="btn btn-xs btn-ghost text-error"
                    onClick={() => handleDeleteLab(lab._id)}
                  >
                    <FaTrash />
                  </button>

                          </div>

                        </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                          <p className="text-sm text-base-content/50">No lab investigations ordered yet</p>
                        </div>
                      )}
                    </div>

                    <div className="divider my-0"></div>


                    {/* Prescriptions */}
                    <div>
                      <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        Active Prescriptions
                      </h4>
                      {recentPrescriptions.length > 0 ? (
                        <div className="grid gap-3">
                          {recentPrescriptions.map((pres, idx) => (
                            <div key={idx} className="border border-base-200 rounded-lg p-3 hover:shadow-sm transition-shadow">
                           <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">

                                  <span className={`badge ${pres.status === 'pending' ? 'badge-warning' : 'badge-success'} badge-sm`}>
                                    {pres.status}
                                  </span>

                                  <span className="text-xs text-base-content/50">
                                    Ordered {formatNigeriaDate(pres.createdAt)}
                                  </span>

                                </div>


                                {/* ACTION BUTTONS */}
                                <div className="flex gap-2">

                                <button
                                type="button"
                                className="btn btn-xs btn-ghost text-warning"
                                onClick={() => navigate(`/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}/prescription`, { state: { prescription: pres } })}
                              >
                                <FaEdit />
                              </button>

                              <button
                                type="button"
                                className="btn btn-xs btn-ghost text-error"
                                onClick={() => handleDeletePrescription(pres._id)}
                              >
                                <FaTrash />
                              </button>

                                </div>

                              </div>
                              <div className="space-y-1">
                                {pres.medications?.map((med, mIdx) => (
                                  <div key={mIdx} className="flex items-center gap-2 text-sm">
                                    <span className="font-medium text-base-content">{med.drugName}</span>
                                    <span className="text-base-content/40">•</span>
                                    <span className="text-base-content/70">{med.dosage}</span>
                                    <span className="text-base-content/40">•</span>
                                    <span className="text-base-content/70">{med.frequency}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                          <p className="text-sm text-base-content/50">No prescriptions ordered yet</p>
                        </div>
                      )}
                    </div>

                    {/* Additional Notes for Nurse */}
                    <div>
                      <div className="flex items-center justify-between mb-3">

                      <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-warning"></span>
                        Additional Note for Nurse
                      </h4>
                       <button type="submit" className="btn btn-sm btn-primary"
                       onClick={handleSaveAdditionalNotes}>
                        Save Note
                        </button>
                      </div>
                      <textarea
                        className="textarea textarea-bordered w-full"
                        required
                        placeholder="Enter any additional instructions or notes for the nurse..."
                        rows={3}
                        value={additionalNotes}
                        onChange={(e) => setAdditionalNotes(e.target.value)}
                      />
                    </div>
                    <div>
                      <h4>Additional Note History</h4>
                      {(() => {
                        const rawNotes = consultation?.additionalNotes;
                        const notes = Array.isArray(rawNotes) 
                          ? rawNotes 
                          : rawNotes 
                            ? [{ 
                                note: rawNotes, 
                                date: consultation?.updatedAt || consultation?.createdAt, 
                                doctorName: doctorName 
                              }] 
                            : [];
                        
                        return notes.length > 0 ? (
                          <ul className="space-y-2 mt-2">
                            {notes.map((note, idx) => (
                              <li key={idx} className="p-3 bg-base-200/50 rounded-lg border border-base-200">
                                <div className="flex items-center gap-2 mb-1">
                                  <FaStickyNote className="w-4 h-4 text-warning" />
                                  <span className="text-xs text-base-content/50">
                                    {formatNigeriaDate(note.date)} by Dr. {note.doctorName || "Unknown"}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                <p className="text-sm text-base-content flex">{note.note}  </p>

                                <button
                                type="button"
                                className="btn btn-xs btn-ghost text-warning"
                                onClick={() => handleEditAdditionalNote(note.id, note.note  )}
                              >
                                <FaEdit />
                              </button>

                              <button
                                type="button"
                                className="btn btn-xs btn-ghost text-error"
                                onClick={() => handleDeleteAdditionalNote(note.id) }
                                
                              >
                                <FaTrash />
                              </button>

                                </div>

                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-base-content/50 italic mt-2">No previous notes history.</p>
                        );
                      })()}
                    </div>

                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - History & Background */}
            <div className="space-y-6">

            {/* Medical History */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-primary">
                    <FaHistory />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Medical History</h3>
                  </div>
                  {isEditMode && (
                    <button className="btn btn-xs btn-primary" onClick={() => setActiveModal('medical')}>
                      <FaPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditMode ? (
                  <div className="flex flex-wrap gap-2">
                    {editForm.medicalHistory.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm">
                        {item}
                        <button type="button" onClick={() => setEditForm(prev => ({
                          ...prev, medicalHistory: prev.medicalHistory.filter((_, i) => i !== idx)
                        }))} className="text-error">
                          <IoCloseCircleOutline className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                    {editForm.medicalHistory.length === 0 && <span className="text-sm text-base-content/40 italic">None added</span>}
                  </div>
                ) : (
                  medicalHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {medicalHistory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2">
                          <span className="font-medium">{typeof item === 'object' ? item.title || item.name : item}</span>
                          <span className="text-base-content/60 bg-base-200 px-2 py-0.5 rounded text-xs">{idx + 1}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-base-content/50 italic">None recorded</p>
                )}
              </div>
            </div>

            {/* Surgical History */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-secondary">
                    <FaSyringe />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Surgical History</h3>
                  </div>
                  {isEditMode && (
                    <button className="btn btn-xs btn-secondary" onClick={() => setActiveModal('surgical')}>
                      <FaPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditMode ? (
                  <div className="flex flex-wrap gap-2">
                    {editForm.surgicalHistory.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm">
                        {item}
                        <button type="button" onClick={() => setEditForm(prev => ({
                          ...prev, surgicalHistory: prev.surgicalHistory.filter((_, i) => i !== idx)
                        }))} className="text-error">
                          <IoCloseCircleOutline className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                    {editForm.surgicalHistory.length === 0 && <span className="text-sm text-base-content/40 italic">None added</span>}
                  </div>
                ) : (
                  surgicalHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {surgicalHistory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{typeof item === 'object' ? item.procedureName || item.procedure || item.title || item.name : item}</span>
                          {typeof item === 'object' && item.dateOfSurgery && (
                            <span className="text-base-content/60 text-xs">{formatNigeriaDate(item.dateOfSurgery)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-base-content/50 italic">None recorded</p>
                )}
              </div>
            </div>

            {/* Allergies */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-error">
                    <FaAllergies />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Allergies</h3>
                  </div>
                  {isEditMode && (
                    <button className="btn btn-xs btn-error" onClick={() => setActiveModal('allergy')}>
                      <FaPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditMode ? (
                  <div className="flex flex-wrap gap-2">
                    {editForm.allergyHistory.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-error/10 border border-error/30 rounded-full text-sm">
                        {item}
                        <button type="button" onClick={() => setEditForm(prev => ({
                          ...prev, allergyHistory: prev.allergyHistory.filter((_, i) => i !== idx)
                        }))} className="text-error">
                          <IoCloseCircleOutline className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                    {editForm.allergyHistory.length === 0 && <span className="text-sm text-base-content/40 italic">None added</span>}
                  </div>
                ) : (
                  allergyHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergyHistory.map((item, idx) => (
                        <div key={idx} className="badge badge-error badge-outline gap-1 h-auto py-1">
                          <span className="font-medium">{typeof item === 'object' ? item.allergen || item.title || item.name || JSON.stringify(item) : item}</span>
                          {typeof item === 'object' && item.reaction && (
                            <span className="text-xs opacity-75">({item.reaction})</span>
                          )}
                          {!item.reaction && <span className="text-xs opacity-75">(reaction)</span>}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-sm text-base-content/50 italic">None recorded</p>
                )}
                {consultation?.dependantName && (
                  <div className="mt-2">
                    <span className="badge badge-info badge-sm">Dependant: {consultation.dependantName}</span>
                    {consultation.dependantRelation && (
                      <span className="badge badge-outline badge-sm ml-2">{consultation.dependantRelation}</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Family History */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-info">
                    <FaUsers />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Family History</h3>
                  </div>
                  {isEditMode && (
                    <button className="btn btn-xs btn-info" onClick={() => setActiveModal('family')}>
                      <FaPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditMode ? (
                  <div className="space-y-2">
                    {editForm.familyHistory.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-sm">
                        <div className="flex gap-4">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-base-content/60">{item.value}</span>
                        </div>
                        <button type="button" onClick={() => setEditForm(prev => ({
                          ...prev, familyHistory: prev.familyHistory.filter((_, i) => i !== idx)
                        }))} className="text-error">
                          <IoCloseCircleOutline className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {editForm.familyHistory.length === 0 && <span className="text-sm text-base-content/40 italic">None added</span>}
                  </div>
                ) : (
                  familyHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {familyHistory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{typeof item === 'object' ? item.relation || item.title : item}</span>
                          <span className="text-base-content/70">{typeof item === 'object' ? item.condition || item.value : ''}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-base-content/50 italic">None recorded</p>
                )}
              </div>
            </div>

            {/* Social History */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
              <div className="card-body p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-success">
                    <FaUsers />
                    <h3 className="font-bold uppercase text-sm tracking-wider">Social History</h3>
                  </div>
                  {isEditMode && (
                    <button className="btn btn-xs btn-success" onClick={() => setActiveModal('social')}>
                      <FaPlus className="w-3 h-3" />
                    </button>
                  )}
                </div>
                {isEditMode ? (
                  <div className="flex flex-wrap gap-2">
                    {editForm.socialHistory.map((item, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm">
                        {item}
                        <button type="button" onClick={() => setEditForm(prev => ({
                          ...prev, socialHistory: prev.socialHistory.filter((_, i) => i !== idx)
                        }))} className="text-error">
                          <IoCloseCircleOutline className="w-4 h-4" />
                        </button>
                      </span>
                    ))}
                    {editForm.socialHistory.length === 0 && <span className="text-sm text-base-content/40 italic">None added</span>}
                  </div>
                ) : (
                  socialHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {socialHistory.map((item, idx) => (
                        <li key={idx} className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                          <span className="font-medium">{typeof item === 'object' ? item.title || item.habit || item.name : item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-sm text-base-content/50 italic">None recorded</p>
                )}
              </div>
            </div>

          </div>
          </div>
          
          {/* Bottom Spacing */}
          <div className="h-12"></div>

        </div>
      </div>
    </div>
  );
};

export default ViewConsultation;
