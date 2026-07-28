import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/medical-director/dashboard/Sidebar';
import {
  getConsultationById,
  getConsultationFile,
  updateConsultation,
} from '@/services/api/consultationAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { usersAPI } from '@/services/api/usersAPI';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import {
  FaUserMd,
  FaNotesMedical,
  FaSyringe,
  FaAllergies,
  FaHistory,
  FaUsers,
  FaCalendarAlt,
  FaFileMedical,
  FaPlus,
  FaPrescriptionBottleAlt,
  FaFlask,
  FaFileImage,
  FaStickyNote,
  FaTimes,
  FaHospital,
} from 'react-icons/fa';
import AddDiagnosisModal from './modals/AddDiagnosisModal';
import OrderInvestigationModal from './modals/OrderInvestigationModal';
import SendToNurseModal from './modals/SendToNurseModal';
import AttachmentViewerModal from '@/components/modals/AttachmentViewerModal';
import { getPrescriptionsForConsultation } from '@/services/api/prescriptionsAPI';
import { getInvestigationByConsultationId } from '@/services/api/investigationAPI';
import {
  updateInvestigation,
  deleteInvestigation,
} from '@/services/api/investigationAPI';
import {
  updatePrescription,
  deletePrescription,
} from '@/services/api/prescriptionsAPI';
import AddComplaintModal from './modals/AddComplaintModal';
import AddFamilyHistoryModal from './modals/AddFamilyHistoryModal';
import AddHistoryModal from './modals/AddHistoryModal';
import { getAllComplaint } from '@/services/api/medicalRecordAPI';
import { getInventories } from '@/services/api/inventoryAPI';
import { IoCloseCircleOutline } from 'react-icons/io5';
import { FaTrash, FaEdit } from 'react-icons/fa';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import AdmissionModal from '@/components/modals/admissionModal';

import { deleteAdmission, getAdmissionsForConsultation } from '@/services/api/admissionApi';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { deleteSurgery, getSurgeryByInvestigationRequestId } from '@/services/api/surgeryAPI';

const ViewConsultation = () => {
  const { patientId, consultationId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const fromIncoming = location?.state?.from === 'incoming';

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [consultationDoctorName, setConsultationDoctorName] = useState('');
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState(() => {
    const saved = localStorage.getItem('currentPrescriptions');
    return saved ? JSON.parse(saved) : [];
  });
  const [labRequests, setLabRequests] = useState([]);
  const [isDiagnosisModalOpen, setIsDiagnosisModalOpen] = useState(false);
  const [isInvestigationModalOpen, setIsInvestigationModalOpen] =
    useState(false);
  const [isSendToNurseModalOpen, setIsSendToNurseModalOpen] = useState(false);
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [editingLab, setEditingLab] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [procedures, setProcedures] = useState([]);
  const [selectedProcedure, setSelectedProcedure] = useState(null);
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
    symptoms: [],
    surgical: [],
    family: [],
    social: [],
    allergic: [],
  });

  const [isAdmissionModalOpen, setIsAdmissionModalOpen] = useState(false);
  const [activeAdmissions, setActiveAdmissions] = useState([]);

  // Picker for choosing which investigation the surgical note attaches to,
  // shown only when the consultation has more than one lab request
  const [isProcedurePickerOpen, setIsProcedurePickerOpen] = useState(false);

  const canEdit = useMemo(() => {
    if (!consultation?.createdAt) return false;
    return (
      Date.now() - new Date(consultation.createdAt).getTime() <
      24 * 60 * 60 * 1000
    );
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
          const resolvedName =
            user?.name ||
            `${user?.firstName || ''} ${user?.lastName || ''}`.trim();
          if (resolvedName) {
            setConsultationDoctorName(resolvedName);
          }
        } catch (err) {
          toast.error('Failed to resolve consultation doctor name:', err);
        }
      } else {
        setConsultationDoctorName('');
      }

      const pid = patientId || data?.patientId;
      if (pid) {
        const promises = [
          getPatientById(pid),
          getPrescriptionsForConsultation(consultationId),
          getInvestigationByConsultationId(consultationId),
          getAdmissionsForConsultation(consultationId),
          getServiceCharges(),
        ];

        const results = await Promise.allSettled(promises);

        // 1. Patient Details
        if (results[0].status === 'fulfilled') {
          const pRes = results[0].value;
          setPatient(pRes?.data ?? pRes);
        } else {
          console.error('Error loading patient:', results[0].reason);
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
          console.error('Error loading prescriptions:', results[1].reason);
        }

        // 3. Lab Investigations
        if (results[2].status === 'fulfilled') {
          const labRes = results[2].value;
          const rawLabData = labRes?.data ?? labRes ?? [];
          const labList = Array.isArray(rawLabData) ? rawLabData : [];
          setLabRequests(labList);
        } else {
          console.error('Error loading lab investigations:', results[2].reason);
        }

        // 4. Admissions
        if (results[3].status === 'fulfilled') {
          const admRes = results[3].value;
          const rawAdmData = admRes?.data ?? admRes ?? [];
          const admList = Array.isArray(rawAdmData) ? rawAdmData : [];

          // Build serviceChargeId -> admissionCovered[] lookup
          let coveredById = {};
          if (results[4]?.status === 'fulfilled') {
            const chargesRes = results[4].value;
            const rawCharges = chargesRes?.data ?? chargesRes ?? [];
            const chargesList = Array.isArray(rawCharges) ? rawCharges : (rawCharges?.data ?? []);
            chargesList.forEach((c) => {
              const id = c?._id || c?.id;
              if (id) coveredById[id] = Array.isArray(c?.admissionCovered) ? c.admissionCovered : [];
            });
          }

          const admListWithCovered = admList.map((a) => ({
            ...a,
            admissions: (a?.admissions || []).map((item) => ({
              ...item,
              admissionCovered: coveredById[item?.serviceChargeId] || [],
            })),
          }));

          setActiveAdmissions(admListWithCovered);
        } else {
          console.error('Error loading admissions:', results[3].reason);
        }
      } else if (data?.patient) {
        setPatient(data.patient);
      }
    } catch (error) {
      console.error('Error loading consultation details:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  if (labRequests.length === 0) {
    setProcedures([]);
    return;
  }
  const loadProcedures = async () => {
   const results = await Promise.allSettled(
    labRequests.map((lab) => getSurgeryByInvestigationRequestId(lab._id))
  );
    const list = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value?.data)
      .filter(Boolean);
    setProcedures(list);
  }
  loadProcedures();
}, [labRequests]);


const handleEditProcedure = (surgery) => {
  navigate(
    `/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}/surgical-note/${surgery.investigationRequestId}`,
    {
      state: {
        dependantId: consultation?.dependantId || null,
        dependantSnapshot: consultation?.dependant || null,
        patientSnapshot: patient,
        investigationRequestId: surgery.investigationRequestId,
        editSurgery: surgery,
      },
    },
  );
};

const handleDeleteProcedure = async (id) => {
  if (!window.confirm('Delete this surgical note?')) return;
  try {
    await deleteSurgery(id);
    setProcedures((prev) => prev.filter((p) => p._id !== id));
  } catch (error) {
    console.error('Error deleting surgery:', error);
    toast.error(error?.response?.data?.message || 'Failed to delete procedure');
  }
};

  useEffect(() => {
    if (!consultation) return;
    setEditForm({
      visitReason: consultation.visitReason || '',
      notes: consultation.notes || '',
      complaints: (consultation.complaint || []).map((c) => ({
        name: c.symptom,
        duration: (c.durationInDays || 0).toString(),
        unit: 'Day(s)',
      })),
      medicalHistory: (consultation.medicalHistory || []).map((m) =>
        typeof m === 'object' ? m.title || m.name || '' : m,
      ),
      surgicalHistory: (consultation.surgicalHistory || []).map((s) =>
        typeof s === 'object' ? s.procedureName || s.procedure || '' : s,
      ),
      familyHistory: (consultation.familyHistory || []).map((f) => ({
        title: f.relation || f.title || '',
        value: f.condition || f.value || '',
      })),
      socialHistory: (consultation.socialHistory || []).map((s) =>
        typeof s === 'object' ? s.title || s.habit || '' : s,
      ),
      allergyHistory: (consultation.allergicHistory || []).map((a) =>
        typeof a === 'object' ? a.allergen || a.title || '' : a,
      ),
    });
  }, [consultation]);

  useEffect(() => {
    if (!isEditMode) return;
    const loadRecords = async () => {
      try {
        const [recordsRes, inventoryRes] = await Promise.allSettled([
          getAllComplaint(),
          getInventories(),
        ]);
        if (
          recordsRes.status === 'fulfilled' &&
          Array.isArray(recordsRes.value)
        ) {
          const r = recordsRes.value;
          setMedicalRecords({
            symptoms: r.filter((x) => x.category === 'symptoms'),
            surgical: r.filter((x) => x.category === 'surgical'),
            family: r.filter((x) => x.category === 'family'),
            social: r.filter((x) => x.category === 'social'),
            allergic: r.filter((x) => x.category === 'allergic'),
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
        complaint: editForm.complaints.map((c) => {
          let days = parseInt(c.duration) || 1;
          if (c.unit === 'Week(s)') days *= 7;
          else if (c.unit === 'Month(s)') days *= 30;
          else if (c.unit === 'Year(s)') days *= 365;
          return { symptom: c.name, durationInDays: days };
        }),
        surgicalHistory: editForm.surgicalHistory.map((s) => ({
          procedureName: s,
          dateOfSurgery: new Date().toISOString().split('T')[0],
        })),
        familyHistory: editForm.familyHistory.map((f) => ({
          relation: f.title,
          condition: f.value,
          value: '1',
        })),
        medicalHistory: editForm.medicalHistory.map((m) => ({
          title: m,
          value: '1',
        })),
        allergicHistory: editForm.allergyHistory.map((a) => ({ allergen: a })),
        socialHistory: editForm.socialHistory.map((s) => ({
          title: s,
          value: '1',
        })),
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
    if (
      !window.confirm('Are you sure you want to delete this lab investigation?')
    )
      return;

    try {
      await deleteInvestigation(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting investigation', error);
    }
  };

  const handleEditLab = async (lab, e) => {
    e?.preventDefault();
    try {
      const updatedData = {
        status: lab.status === 'pending' ? 'in_progress' : 'pending',
      };

      await updateInvestigation(lab._id, updatedData);
      await loadData();
    } catch (error) {
      console.error('Error updating investigation', error);
    }
  };

  // ================= PRESCRIPTION =================

  const handleDeletePrescription = async (id) => {
    if (!window.confirm('Delete this prescription?')) return;

    try {
      await deletePrescription(id);
      await loadData();
    } catch (error) {
      console.error('Error deleting prescription', error);
    }
  };

  const handleEditPrescription = async (pres, e) => {
    e?.preventDefault();
    try {
      const updatedData = {
        status: pres.status === 'pending' ? 'active' : 'pending',
      };

      await updatePrescription(pres._id, updatedData);
      await loadData();
    } catch (error) {
      console.error('Error updating prescription', error);
    }
  };

  const handleOpenAttachmentViewer = async (fileIndex = 0) => {
    if (
      !consultation?.attachedFileIds ||
      consultation.attachedFileIds.length === 0
    ) {
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
            const mimeType =
              response.headers['content-type'] || 'application/octet-stream';
            const filename =
              response.headers['content-disposition']?.match(
                /filename="(.+?)"/,
              )?.[1] || `file-${fileId}`;

            return {
              _id: fileId,
              id: fileId,
              name: filename,
              filename: filename,
              mimetype: mimeType,
              data: new Uint8Array(response.data),
            };
          } catch (error) {
            console.error(`Error loading file ${fileId}:`, error);
            return null;
          }
        }),
      );

      const validFiles = files.filter((f) => f !== null);
      setAttachedFiles(validFiles);
      setCurrentFileIndex(Math.min(fileIndex, validFiles.length - 1));
      setIsAttachmentViewerOpen(true);
    } catch (error) {
      console.error('Error loading attachments:', error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [patientId, consultationId]);

  const patientName = useMemo(
    () =>
      patient?.fullName ||
      `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim(),
    [patient],
  );

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleSaveAdditionalNotes = async () => {
    try {
      await updateConsultation(consultationId, { additionalNotes });
      await loadData();
      setIsSendToNurseModalOpen(false);
    } catch (error) {
      console.error('Error saving additional notes:', error);
    }
  };

  const handleEditAdditionalNote = async (noteId, currentNote) => {
    const newNote = window.prompt('Edit additional note:', currentNote);
    if (newNote === null) return;
    try {
      let updatedNotes;
      if (Array.isArray(consultation.additionalNotes)) {
        updatedNotes = consultation.additionalNotes.map((n) =>
          n.id === noteId ? { ...n, note: newNote } : n,
        );
      } else {
        updatedNotes = newNote; // If it's a string, update to new string
      }
      await updateConsultation(consultationId, {
        additionalNotes: updatedNotes,
      });
      await loadData(); // Reload page data
      setAdditionalNotes('');
    } catch (error) {
      console.error('Error editing additional note:', error);
    }
  };

  const handleDeleteAdditionalNote = async (noteId) => {
    if (!window.confirm('Delete this additional note?')) return;
    try {
      const updatedNotes = consultation.additionalNotes.filter(
        (n) => n.id !== noteId,
      );
      await updateConsultation(consultationId, {
        additionalNotes: updatedNotes,
      });
      // await loadData();
      setAdditionalNotes('');
    } catch (error) {
      console.error('Error deleting additional note:', error);
    }
  };

  const handleRemoveDiagnosisItem = async (itemToRemove) => {
    if (!window.confirm(`Remove "${itemToRemove}" from diagnosis?`)) return;
    try {
      const remaining = (consultation?.diagnosis || '')
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d && d.toLowerCase() !== itemToRemove.toLowerCase());

      const payload =
        remaining.length > 0 ? remaining.join(', ') : 'Pending diagnosis'; // backend rejects empty string

      await updateConsultation(consultationId, { diagnosis: payload });
      await loadData();
    } catch (error) {
      console.error('Error removing diagnosis:', error);
      toast.error(
        error?.response?.data?.message || 'Failed to remove diagnosis',
      );
    }
  };

  // ================= ADD PROCEDURE (SURGICAL NOTE) =================
  // CreateSurgicalNote needs an investigationRequestId to attach the surgical
  // note to. If none exist, block with a toast; if exactly one, go straight
  // there; if more than one, let the doctor pick which one.
  const navigateToCreateProcedure = (investigationRequestId) => {
    navigate(
      `/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}/surgical-note/${investigationRequestId}`,
      {
        state: {
          dependantId: consultation?.dependantId || null,
          dependantSnapshot: consultation?.dependant || null,
          patientSnapshot: patient,
          investigationRequestId,
        },
      },
    );
  };

  const handleAddProcedureClick = () => {
    if (labRequests.length === 0) {
      toast('Please order a lab investigation before adding a procedure.');
      return;
    }
    if (labRequests.length === 1) {
      navigateToCreateProcedure(labRequests[0]._id);
      return;
    }
    setIsProcedurePickerOpen(true);
  };

  // Mapped Data
  const complaints = consultation?.complaint || [];
  const medicalHistory = consultation?.medicalHistory || [];
  const surgicalHistory = consultation?.surgicalHistory || [];
  const familyHistory = consultation?.familyHistory || [];
  const socialHistory = consultation?.socialHistory || [];
  const allergyHistory = consultation?.allergicHistory || [];
  const notes = consultation?.notes || '';
  const visitReason = consultation?.visitReason || 'Not specified';
  const diagnosis = consultation?.diagnosis || 'Pending diagnosis';
  const doctorName =
    consultation?.doctorName ||
    (consultation?.doctor
      ? `${consultation.doctor.firstName} ${consultation.doctor.lastName}`
      : null) ||
    consultationDoctorName ||
    (consultation?.doctorId
      ? `Dr. ${consultation.doctorId}`
      : 'Unknown Doctor');
  const consultationDate = consultation?.createdAt
    ? formatNigeriaDate(consultation.createdAt)
    : '';
  const recentPrescriptions = prescriptions.slice(0, 3);

  const isForDependant = !!consultation?.dependantId;
  const consultationSubject = isForDependant
    ? consultation?.dependant
      ? `${consultation.dependant.firstName || ''} ${consultation.dependant.lastName || ''}`.trim()
      : 'Dependant'
    : patientName;
  const subjectRelation = isForDependant
    ? consultation?.dependant?.relationshipType || 'Dependant'
    : 'Main Patient';

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
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
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
        existingDiagnosis={consultation?.diagnosis || ''}
        onDiagnosisAdded={(newDiagnosis) => {
          setConsultation((prev) => ({ ...prev, diagnosis: newDiagnosis }));
        }}
      />
      <AddComplaintModal
        isOpen={activeModal === 'complaint'}
        onClose={() => setActiveModal(null)}
        onAdd={(item) =>
          setEditForm((prev) => ({
            ...prev,
            complaints: [...prev.complaints, item],
          }))
        }
        data={medicalRecords.symptoms}
      />
      <AddFamilyHistoryModal
        isOpen={activeModal === 'family'}
        onClose={() => setActiveModal(null)}
        onAdd={(item) =>
          setEditForm((prev) => ({
            ...prev,
            familyHistory: [...prev.familyHistory, item],
          }))
        }
        data={medicalRecords.family}
      />
      <AddHistoryModal
        isOpen={activeModal === 'medical'}
        onClose={() => setActiveModal(null)}
        onAdd={(item) =>
          setEditForm((prev) => ({
            ...prev,
            medicalHistory: [...prev.medicalHistory, item],
          }))
        }
        type="Medical"
        data={medicalRecords.symptoms}
      />
      <AddHistoryModal
        isOpen={activeModal === 'surgical'}
        onClose={() => setActiveModal(null)}
        onAdd={(item) =>
          setEditForm((prev) => ({
            ...prev,
            surgicalHistory: [...prev.surgicalHistory, item],
          }))
        }
        type="Surgical"
        data={medicalRecords.surgical}
      />
      <AddHistoryModal
        isOpen={activeModal === 'social'}
        onClose={() => setActiveModal(null)}
        onAdd={(item) =>
          setEditForm((prev) => ({
            ...prev,
            socialHistory: [...prev.socialHistory, item],
          }))
        }
        type="Social"
        data={medicalRecords.social}
      />
      <AddHistoryModal
        isOpen={activeModal === 'allergy'}
        onClose={() => setActiveModal(null)}
        onAdd={(item) =>
          setEditForm((prev) => ({
            ...prev,
            allergyHistory: [...prev.allergyHistory, item],
          }))
        }
        type="Allergy"
        data={medicalRecords.allergic}
      />
      <OrderInvestigationModal
        isOpen={isInvestigationModalOpen}
        onClose={() => {
          setIsInvestigationModalOpen(false);
          setEditingLab(null);
        }}
        patientId={patientId}
        consultationId={consultationId}
        dependantId={
          consultation?.dependantId ||
          consultation?.dependant?._id ||
          consultation?.dependant?.id
        }
        investigation={editingLab}
        onOrderCreated={loadData}
      />

      <AdmissionModal
        isOpen={isAdmissionModalOpen}
        onClose={() => setIsAdmissionModalOpen(false)}
        patientId={patientId}
        consultationId={consultationId}
        dependantId={
          consultation?.dependantId ||
          consultation?.dependant?._id ||
          consultation?.dependant?.id
        }
        onAdmissionCreated={(admission) => {
          setActiveAdmissions((prev) => [...prev, admission]);
        }}
      />

      {isProcedurePickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-base-100 shadow-xl">
            <div className="flex items-center justify-between border-b border-base-200 p-5">
              <h2 className="text-lg font-bold">Select Investigation</h2>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setIsProcedurePickerOpen(false)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-5 space-y-2 max-h-[60vh] overflow-y-auto">
              <p className="text-sm text-base-content/60 mb-3">
                This consultation has more than one lab investigation. Choose which one this procedure belongs to.
              </p>
              {labRequests.map((lab) => (
                <button
                  key={lab._id}
                  type="button"
                  className="w-full text-left rounded-lg border border-base-200 p-3 hover:border-primary hover:bg-primary/5 transition-all"
                  onClick={() => {
                    setIsProcedurePickerOpen(false);
                    navigateToCreateProcedure(lab._id);
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`badge badge-sm ${lab.status === 'in_progress' ? 'badge-info' : lab.status === 'completed' ? 'badge-success' : 'badge-ghost'}`}
                    >
                      {lab.status?.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-base-content/50">
                      Requested {formatNigeriaDate(lab.createdAt)}
                    </span>
                  </div>
                  <div className="text-sm text-base-content/80">
                    {lab.tests?.map((test) => test.name).join(', ') || 'No tests listed'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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
        onSentSuccessfully={() =>
          navigate(
            fromIncoming
              ? '/dashboard/medical-director/incoming'
              : `/dashboard/medical-director/medical-history/${patientId}`,
          )
        }
      />

      <AttachmentViewerModal
        isOpen={isAttachmentViewerOpen}
        onClose={() => setIsAttachmentViewerOpen(false)}
        attachments={attachedFiles}
        initialIndex={currentFileIndex}
        title="Consultation Attachments"
      />

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
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
                <h1 className="text-2xl font-bold text-base-content">
                  Consultation Details
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-base-content/70 mt-1">
                  <span className="flex items-center gap-1">
                    <FaUserMd className="w-3 h-3" /> Dr. {doctorName}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <span className="flex items-center gap-1">
                    <FaCalendarAlt className="w-3 h-3" /> {consultationDate}
                  </span>
                  <span className="hidden sm:inline">•</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary">
                      {consultationSubject}
                    </span>
                    <span
                      className={`badge badge-sm ${isForDependant ? 'badge-secondary' : 'badge-primary'}`}
                    >
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
                        {isSavingEdit ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : (
                          'Save Changes'
                        )}
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
                onClick={() =>
                  navigate(
                    `/dashboard/medical-director/medical-history/${consultation?.patientId || patientId}`,
                    {
                      state: {
                        from: 'incoming',
                        patientSnapshot: consultation?.snapshot || patient,
                        // key prop — PatientMedicalHistory reads this to scope to dependant
                        dependantId: consultation?.dependantId,
                        dependantSnapshot:
                          consultation?.type === 'dependant'
                            ? consultation?.snapshot
                            : null,
                      },
                    },
                  )
                }
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
                      <h3 className="font-bold text-lg text-base-content">
                        Consultation Overview
                      </h3>
                    </div>
                    <button
                      className="btn btn-sm btn-outline btn-success gap-2"
                      onClick={() => setIsDiagnosisModalOpen(true)}
                    >
                      <FaPlus className="w-3 h-3" />
                      {!diagnosis || diagnosis.toLowerCase().includes('pending')
                        ? 'Add Diagnosis'
                        : 'Edit Diagnoses'}
                    </button>
                  </div>

                  <div className="p-6 grid gap-6">
                    {/* Reason & Diagnosis Row */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">
                          Visit Reason
                        </h4>
                        <div className="p-3 bg-base-200/50 rounded-lg">
                          {isEditMode ? (
                            <textarea
                              className="textarea textarea-bordered w-full"
                              rows={3}
                              value={editForm.visitReason}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  visitReason: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            <p className="font-medium text-base-content">
                              {visitReason}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">
                          Diagnosis
                        </h4>
                        {diagnosis.includes('Pending') ? (
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
                                  onClick={() =>
                                    handleRemoveDiagnosisItem(item.trim())
                                  }
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
                        <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60">
                          Patient Complaints
                        </h4>
                        {isEditMode && (
                          <button
                            className="btn btn-xs btn-primary gap-1"
                            onClick={() => setActiveModal('complaint')}
                          >
                            <FaPlus className="w-2 h-2" /> Add
                          </button>
                        )}
                      </div>
                      {isEditMode ? (
                        <div className="flex flex-wrap gap-2">
                          {editForm.complaints.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm"
                            >
                              <span className="font-medium">{item.name}</span>
                              <span className="text-xs text-base-content/50">
                                {item.duration}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    complaints: prev.complaints.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  }))
                                }
                                className="text-error"
                              >
                                <FaTimes className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                          {editForm.complaints.length === 0 && (
                            <span className="text-sm text-base-content/40 italic">
                              No complaints added
                            </span>
                          )}
                        </div>
                      ) : // existing view chips
                      complaints.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {complaints.map((item, idx) => (
                            <div
                              key={idx}
                              className="badge badge-lg badge-outline gap-2 p-3 bg-base-100"
                            >
                              <span className="font-semibold">
                                {item.symptom}
                              </span>
                              {item.durationInDays && (
                                <span className="text-xs opacity-70 border-l pl-2">
                                  {item.durationInDays} days
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-base-content/50 italic">
                          No complaints recorded
                        </p>
                      )}
                    </div>

                    {/* Clinical Notes */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">
                        Clinical Notes
                      </h4>
                      <div className="p-4 bg-base-200/30 rounded-xl border border-base-200 min-h-[100px]">
                        {isEditMode ? (
                          <textarea
                            className="textarea textarea-bordered w-full min-h-[100px]"
                            value={editForm.notes}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                notes: e.target.value,
                              }))
                            }
                          />
                        ) : (
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-base-content/80">
                            {notes || 'No additional clinical notes.'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Attachments */}
                    {consultation?.attachedFileIds &&
                      consultation.attachedFileIds.length > 0 && (
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-3 flex items-center gap-2">
                            <FaFileImage className="w-4 h-4" /> Attachments (
                            {consultation.attachedFileIds.length})
                          </h4>
                          {!attachedFiles.length && !isLoadingFiles ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {consultation.attachedFileIds.map(
                                (fileId, idx) => (
                                  <button
                                    key={idx}
                                    onClick={() =>
                                      handleOpenAttachmentViewer(idx)
                                    }
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
                                ),
                              )}
                            </div>
                          ) : isLoadingFiles ? (
                            <div className="flex justify-center p-8">
                              <span className="loading loading-spinner loading-lg text-primary"></span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                              {attachedFiles.map((file, idx) => {
                                const isImage =
                                  /\.(jpg|jpeg|png|gif|webp)$/i.test(
                                    file.name || file.filename,
                                  );
                                const getImageUrl = () => {
                                  if (!file.data) return '';
                                  if (typeof file.data === 'string') {
                                    return file.data.startsWith('data:') ||
                                      file.data.startsWith('http')
                                      ? file.data
                                      : `data:${file.mimetype};base64,${file.data}`;
                                  }
                                  if (file.data instanceof Uint8Array) {
                                    const blob = new Blob([file.data], {
                                      type: file.mimetype,
                                    });
                                    return URL.createObjectURL(blob);
                                  }
                                  return '';
                                };
                                return (
                                  <div
                                    key={idx}
                                    className="relative group rounded-lg overflow-hidden border border-base-300 hover:border-primary transition-all cursor-pointer"
                                    onClick={() =>
                                      setCurrentFileIndex(idx) ||
                                      setIsAttachmentViewerOpen(true)
                                    }
                                  >
                                    {isImage && getImageUrl() ? (
                                      <>
                                        <img
                                          src={getImageUrl()}
                                          alt={file.name}
                                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                          <span className="text-white text-sm font-semibold">
                                            View
                                          </span>
                                        </div>
                                      </>
                                    ) : (
                                      <div className="w-full h-32 bg-base-200 flex items-center justify-center group-hover:bg-base-300 transition-all">
                                        <FaFileImage className="w-10 h-10 text-base-content/40" />
                                      </div>
                                    )}
                                    <div className="p-2 bg-base-100 border-t border-base-300">
                                      <p
                                        className="text-xs font-medium text-base-content truncate"
                                        title={file.name}
                                      >
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
                  <div className="p-4 border-b border-base-200 bg-base-50/50  items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FaPrescriptionBottleAlt className="text-success w-5 h-5" />
                      <h3 className="font-bold text-lg text-base-content p-2 m-2">
                        Treatment Plan & Orders
                      </h3>
                      
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
                        onClick={() =>
                          navigate(
                            `/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}/prescription`,
                            {
                              state: {
                                dependantId: consultation?.dependantId || null,
                                dependantSnapshot:
                                  consultation?.dependant || null,
                                patientSnapshot: patient,
                              },
                            },
                          )
                        }
                      >
                        <FaPrescriptionBottleAlt /> Prescribe
                      </button>
                      <button
                        className="btn btn-sm btn-info gap-2"
                        onClick={() => setIsSendToNurseModalOpen(true)}
                      >
                        <FaUserMd /> Send to Nurse
                      </button>
                      <button
                        className="btn btn-sm btn-ghost text-base-content/70 hover:bg-base-200"
                        onClick={() => setIsAdmissionModalOpen(true)}
                      >
                        <FaHospital /> Admit Patient
                      </button>
                      <button
                        className="btn btn-sm btn-ghost text-base-content/70 hover:bg-base-200"
                        onClick={handleAddProcedureClick}
                      >
                        <FaHospital /> Add Procedure
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
                            <div
                              key={idx}
                              className="flex justify-between items-start mb-2"
                            >
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`badge ${lab.status === 'in_progress' ? 'badge-info' : lab.status === 'completed' ? 'badge-success' : 'badge-ghost'} badge-sm`}
                                  >
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
                                  {lab.tests
                                    ?.map((test) => test.name)
                                    .join(', ')}
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
                          <p className="text-sm text-base-content/50">
                            No lab investigations ordered yet
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="divider my-0"></div>

                  <div>
                    <h4>Procedures / Surgical Notes</h4>
                  </div>
                   {procedures.map((proc) => (
                      <div
                        key={proc._id}
                        className="border border-base-200 rounded-lg p-3 hover:shadow-sm hover:border-primary transition-all cursor-pointer"
                        onClick={() => setSelectedProcedure(proc)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className={`badge badge-sm ${proc.status === 'completed' ? 'badge-success' : proc.status === 'in_progress' ? 'badge-info' : proc.status === 'cancelled' ? 'badge-error' : 'badge-ghost'}`}>
                                {proc.status?.replace('_', ' ')}
                              </span>
                              <span className="text-xs text-base-content/50">
                                {formatNigeriaDate(proc.scheduledDate)}
                              </span>
                            </div>
                            <span className="text-sm font-medium text-base-content">
                              {proc.procedureName} {proc.procedureCode && `(${proc.procedureCode})`}
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost text-warning"
                              onClick={(e) => { e.stopPropagation(); handleEditProcedure(proc); }}
                            >
                              <FaEdit />
                            </button>
                            <button
                              type="button"
                              className="btn btn-xs btn-ghost text-error"
                              onClick={(e) => { e.stopPropagation(); handleDeleteProcedure(proc._id); }}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    

      {selectedProcedure && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-base-100 shadow-xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 p-5 sticky top-0 bg-base-100 z-10">
              <h2 className="text-lg font-bold">Surgical Note Details</h2>
              <button
                type="button"
                className="btn btn-sm btn-circle btn-ghost"
                onClick={() => setSelectedProcedure(null)}
              >
                <FaTimes />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-2">
                <span className={`badge ${selectedProcedure.status === 'completed' ? 'badge-success' : selectedProcedure.status === 'in_progress' ? 'badge-info' : selectedProcedure.status === 'cancelled' ? 'badge-error' : 'badge-ghost'}`}>
                  {selectedProcedure.status?.replace('_', ' ')}
                </span>
                <span className="text-sm text-base-content/60">
                  {formatNigeriaDate(selectedProcedure.scheduledDate)}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Procedure</h4>
                  <p className="font-medium">{selectedProcedure.procedureName} {selectedProcedure.procedureCode && `(${selectedProcedure.procedureCode})`}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Operation Room</h4>
                  <p className="font-medium">{selectedProcedure.operationRoom || '—'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Time</h4>
                  <p className="font-medium">{selectedProcedure.startTime || '—'} - {selectedProcedure.endTime || '—'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Estimated Blood Loss</h4>
                  <p className="font-medium">{selectedProcedure.estimatedBloodLoss ?? '—'}</p>
                </div>
              </div>

              {selectedProcedure.surgeonTeam?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Surgeon Team</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProcedure.surgeonTeam.map((s, i) => (
                      <span key={s._id || i} className="badge badge-outline">{s.surgeonName}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProcedure.surgeonAssistants?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Surgeon Assistants</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProcedure.surgeonAssistants.map((a, i) => (
                      <span key={a._id || i} className="badge badge-outline">{a.assistantName}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProcedure.anesthesiaDosages?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Anesthesia</h4>
                  <div className="space-y-1">
                    {selectedProcedure.anesthesiaDosages.map((a, i) => (
                      <p key={a._id || i} className="text-sm">{a.anesthesiaType} — Dosage :  {a.dosage}</p>
                    ))}
                  </div>
                </div>
              )}

              {selectedProcedure.vitalSigns?.length > 0 && selectedProcedure.vitalSigns.some(v => v.bloodPressure || v.heartRate || v.respiratoryRate || v.temperature || v.oxygenSaturation) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Vital Signs (Theatre)</h4>
                  {selectedProcedure.vitalSigns.map((v, i) => (
                    <div key={v._id || i} className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm bg-base-200/40 rounded-lg p-3 mb-2">
                      <p><span className="text-base-content/50">BP:</span> {v.bloodPressure || '—'}</p>
                      <p><span className="text-base-content/50">HR:</span> {v.heartRate ?? '—'}</p>
                      <p><span className="text-base-content/50">RR:</span> {v.respiratoryRate ?? '—'}</p>
                      <p><span className="text-base-content/50">Temp:</span> {v.temperature ?? '—'}</p>
                      <p><span className="text-base-content/50">O2 Sat:</span> {v.oxygenSaturation ?? '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Surgical Findings</h4>
                <p className="text-sm bg-base-200/40 rounded-lg p-3">{selectedProcedure.surgicalFindings || 'None recorded'}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Complications</h4>
                  <p className="text-sm bg-base-200/40 rounded-lg p-3">{selectedProcedure.complications || 'None'}</p>
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Outcomes</h4>
                  <p className="text-sm bg-base-200/40 rounded-lg p-3">{selectedProcedure.outcomes || '—'}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Specimens for Histology</h4>
                <p className="text-sm">{selectedProcedure.specimensForHistology === 'sent' ? 'Sent' : 'Not Sent'}</p>
              </div>

              {selectedProcedure.postOperativeAssessment?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Post-Op Medications</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProcedure.postOperativeAssessment.map((m, i) => (
                      <span key={m._id || i} className="badge badge-outline">{m.medication}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedProcedure.babyAssessment?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-2">Baby Assessment</h4>
                  {selectedProcedure.babyAssessment.map((b, i) => (
                    <div key={b._id || i} className="text-sm bg-base-200/40 rounded-lg p-3 mb-2 grid grid-cols-2 gap-2">
                      <p><span className="text-base-content/50">Weight:</span> {b.weight ?? '—'}</p>
                      <p><span className="text-base-content/50">Length:</span> {b.length ?? '—'}</p>
                      <p><span className="text-base-content/50">Head Circ.:</span> {b.headCircumference ?? '—'}</p>
                      <p><span className="text-base-content/50">Delivery:</span> {b.deliveryTime ? formatNigeriaDate(b.deliveryTime) : '—'}</p>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-1">Notes</h4>
                <p className="text-sm bg-base-200/40 rounded-lg p-3">{selectedProcedure.notes || 'No additional notes'}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-base-200 sticky bottom-0 bg-base-100">
              <button
                type="button"
                className="btn btn-sm btn-outline btn-warning gap-2"
                onClick={() => { setSelectedProcedure(null); handleEditProcedure(selectedProcedure); }}
              >
                <FaEdit /> Edit
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                onClick={() => setSelectedProcedure(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


                    {/* Prescriptions */}
                    <div>
                      <h4 className="text-sm font-bold text-base-content mb-3 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success"></span>
                        Active Prescriptions
                      </h4>
                      {recentPrescriptions.length > 0 ? (
                        <div className="grid gap-3">
                          {recentPrescriptions.map((pres, idx) => (
                            <div
                              key={idx}
                              className="border border-base-200 rounded-lg p-3 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`badge ${pres.status === 'pending' ? 'badge-warning' : 'badge-success'} badge-sm`}
                                  >
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
                                    onClick={() =>
                                      navigate(
                                        `/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}/prescription`,
                                        { state: { prescription: pres } },
                                      )
                                    }
                                  >
                                    <FaEdit />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost text-error"
                                    onClick={() =>
                                      handleDeletePrescription(pres._id)
                                    }
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                              <div className="space-y-1">
                                {pres.medications?.map((med, mIdx) => (
                                  <div
                                    key={mIdx}
                                    className="flex items-center gap-2 text-sm"
                                  >
                                    <span className="font-medium text-base-content">
                                      {med.drugName}
                                    </span>
                                    <span className="text-base-content/40">
                                      •
                                    </span>
                                    <span className="text-base-content/70">
                                      {med.dosage}
                                    </span>
                                    <span className="text-base-content/40">
                                      •
                                    </span>
                                    <span className="text-base-content/70">
                                      {med.frequency}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                          <p className="text-sm text-base-content/50">
                            No prescriptions ordered yet
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Admission section */}
                    {/* Active Admissions */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-bold text-base-content flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary"></span>
                          Active Admissions
                        </h4>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() =>
                            navigate(`/dashboard/medical-director/view-admissions/${patientId}`, {
                              state: {
                                dependantId: consultation?.dependantId,
                                dependantSnapshot:
                                  consultation?.type === 'dependant'
                                    ? consultation?.snapshot
                                    : null,
                              },
                            })
                          }
                        >
                          View All
                        </button>
                      </div>

                      {activeAdmissions.length > 0 ? (
                        <div className="grid gap-3">
                          {activeAdmissions.map((admission, idx) => (
                            <div
                              key={admission._id || idx}
                              className="border border-base-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="badge badge-success badge-sm">
                                    Active
                                  </span>

                                  <span className="text-xs text-base-content/50">
                                    Admission
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  className="btn btn-xs btn-ghost text-error"
                                  onClick={async () => {
                                    if (admission._id) {
                                      try {
                                        await deleteAdmission(admission._id);
                                      } catch (err) {
                                        console.error('Failed to delete admission:', err);
                                        toast.error('Failed to delete admission');
                                        return;
                                      }
                                    }
                                    setActiveAdmissions((prev) =>
                                      prev.filter((a) =>
                                        a._id ? a._id !== admission._id : a !== admission,
                                      ),
                                    );
                                  }}
                                >
                                  <FaTrash />
                                </button>
                              </div>

                              <div className="mt-3 space-y-3">
                                {admission.admissions?.map(
                                  (item, itemIndex) => (
                                    <div key={item._id || itemIndex}>
                                      <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">
                                          {item.name}
                                        </span>

                                        <span className="text-base-content/70">
                                          ₦
                                          {Number(
                                            item.amount || 0,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                      {Array.isArray(item.admissionCovered) &&
                                        item.admissionCovered.length > 0 && (
                                          <ul className="list-disc list-inside mt-1 ml-1 text-xs text-base-content/60">
                                            {item.admissionCovered.map((cond, ci) => (
                                              <li key={ci}>{cond}</li>
                                            ))}
                                          </ul>
                                        )}
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-base-200/20 rounded-lg border border-dashed border-base-300">
                          <p className="text-sm text-base-content/50">
                            No active admissions yet
                          </p>
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
                        <button
                          type="submit"
                          className="btn btn-sm btn-primary"
                          onClick={handleSaveAdditionalNotes}
                        >
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
                            ? [
                                {
                                  note: rawNotes,
                                  date:
                                    consultation?.updatedAt ||
                                    consultation?.createdAt,
                                  doctorName: doctorName,
                                },
                              ]
                            : [];

                        return notes.length > 0 ? (
                          <ul className="space-y-2 mt-2">
                            {notes.map((note, idx) => (
                              <li
                                key={idx}
                                className="p-3 bg-base-200/50 rounded-lg border border-base-200"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <FaStickyNote className="w-4 h-4 text-warning" />
                                  <span className="text-xs text-base-content/50">
                                    {formatNigeriaDate(note.date)} by Dr.{' '}
                                    {note.doctorName || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex gap-2">
                                  <p className="text-sm text-base-content flex">
                                    {note.note}{' '}
                                  </p>

                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost text-warning"
                                    onClick={() =>
                                      handleEditAdditionalNote(
                                        note.id,
                                        note.note,
                                      )
                                    }
                                  >
                                    <FaEdit />
                                  </button>

                                  <button
                                    type="button"
                                    className="btn btn-xs btn-ghost text-error"
                                    onClick={() =>
                                      handleDeleteAdditionalNote(note.id)
                                    }
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-base-content/50 italic mt-2">
                            No previous notes history.
                          </p>
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
                      <h3 className="font-bold uppercase text-sm tracking-wider">
                        Medical History
                      </h3>
                    </div>
                    {isEditMode && (
                      <button
                        className="btn btn-xs btn-primary"
                        onClick={() => setActiveModal('medical')}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isEditMode ? (
                    <div className="flex flex-wrap gap-2">
                      {editForm.medicalHistory.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                medicalHistory: prev.medicalHistory.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="text-error"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      {editForm.medicalHistory.length === 0 && (
                        <span className="text-sm text-base-content/40 italic">
                          None added
                        </span>
                      )}
                    </div>
                  ) : medicalHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {medicalHistory.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2"
                        >
                          <span className="font-medium">
                            {typeof item === 'object'
                              ? item.title || item.name
                              : item}
                          </span>
                          <span className="text-base-content/60 bg-base-200 px-2 py-0.5 rounded text-xs">
                            {idx + 1}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">
                      None recorded
                    </p>
                  )}
                </div>
              </div>

              {/* Surgical History */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-secondary">
                      <FaSyringe />
                      <h3 className="font-bold uppercase text-sm tracking-wider">
                        Surgical History
                      </h3>
                    </div>
                    {isEditMode && (
                      <button
                        className="btn btn-xs btn-secondary"
                        onClick={() => setActiveModal('surgical')}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isEditMode ? (
                    <div className="flex flex-wrap gap-2">
                      {editForm.surgicalHistory.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                surgicalHistory: prev.surgicalHistory.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="text-error"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      {editForm.surgicalHistory.length === 0 && (
                        <span className="text-sm text-base-content/40 italic">
                          None added
                        </span>
                      )}
                    </div>
                  ) : surgicalHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {surgicalHistory.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="font-medium">
                            {typeof item === 'object'
                              ? item.procedureName ||
                                item.procedure ||
                                item.title ||
                                item.name
                              : item}
                          </span>
                          {typeof item === 'object' && item.dateOfSurgery && (
                            <span className="text-base-content/60 text-xs">
                              {formatNigeriaDate(item.dateOfSurgery)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">
                      None recorded
                    </p>
                  )}
                </div>
              </div>

              {/* Allergies */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-error">
                      <FaAllergies />
                      <h3 className="font-bold uppercase text-sm tracking-wider">
                        Allergies
                      </h3>
                    </div>
                    {isEditMode && (
                      <button
                        className="btn btn-xs btn-error"
                        onClick={() => setActiveModal('allergy')}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isEditMode ? (
                    <div className="flex flex-wrap gap-2">
                      {editForm.allergyHistory.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-error/10 border border-error/30 rounded-full text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                allergyHistory: prev.allergyHistory.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="text-error"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      {editForm.allergyHistory.length === 0 && (
                        <span className="text-sm text-base-content/40 italic">
                          None added
                        </span>
                      )}
                    </div>
                  ) : allergyHistory.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {allergyHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="badge badge-error badge-outline gap-1 h-auto py-1"
                        >
                          <span className="font-medium">
                            {typeof item === 'object'
                              ? item.allergen ||
                                item.title ||
                                item.name ||
                                JSON.stringify(item)
                              : item}
                          </span>
                          {typeof item === 'object' && item.reaction && (
                            <span className="text-xs opacity-75">
                              ({item.reaction})
                            </span>
                          )}
                          {!item.reaction && (
                            <span className="text-xs opacity-75">
                              (reaction)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">
                      None recorded
                    </p>
                  )}
                  {consultation?.dependantName && (
                    <div className="mt-2">
                      <span className="badge badge-info badge-sm">
                        Dependant: {consultation.dependantName}
                      </span>
                      {consultation.dependantRelation && (
                        <span className="badge badge-outline badge-sm ml-2">
                          {consultation.dependantRelation}
                        </span>
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
                      <h3 className="font-bold uppercase text-sm tracking-wider">
                        Family History
                      </h3>
                    </div>
                    {isEditMode && (
                      <button
                        className="btn btn-xs btn-info"
                        onClick={() => setActiveModal('family')}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isEditMode ? (
                    <div className="space-y-2">
                      {editForm.familyHistory.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 bg-base-200 border border-base-300 rounded-lg text-sm"
                        >
                          <div className="flex gap-4">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-base-content/60">
                              {item.value}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                familyHistory: prev.familyHistory.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="text-error"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {editForm.familyHistory.length === 0 && (
                        <span className="text-sm text-base-content/40 italic">
                          None added
                        </span>
                      )}
                    </div>
                  ) : familyHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {familyHistory.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="font-medium">
                            {typeof item === 'object'
                              ? item.relation || item.title
                              : item}
                          </span>
                          <span className="text-base-content/70">
                            {typeof item === 'object'
                              ? item.condition || item.value
                              : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">
                      None recorded
                    </p>
                  )}
                </div>
              </div>

              {/* Social History */}
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-success">
                      <FaUsers />
                      <h3 className="font-bold uppercase text-sm tracking-wider">
                        Social History
                      </h3>
                    </div>
                    {isEditMode && (
                      <button
                        className="btn btn-xs btn-success"
                        onClick={() => setActiveModal('social')}
                      >
                        <FaPlus className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {isEditMode ? (
                    <div className="flex flex-wrap gap-2">
                      {editForm.socialHistory.map((item, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-2 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm"
                        >
                          {item}
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm((prev) => ({
                                ...prev,
                                socialHistory: prev.socialHistory.filter(
                                  (_, i) => i !== idx,
                                ),
                              }))
                            }
                            className="text-error"
                          >
                            <IoCloseCircleOutline className="w-4 h-4" />
                          </button>
                        </span>
                      ))}
                      {editForm.socialHistory.length === 0 && (
                        <span className="text-sm text-base-content/40 italic">
                          None added
                        </span>
                      )}
                    </div>
                  ) : socialHistory.length > 0 ? (
                    <ul className="space-y-3">
                      {socialHistory.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex justify-between items-start text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0"
                        >
                          <span className="font-medium">
                            {typeof item === 'object'
                              ? item.title || item.habit || item.name
                              : item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-base-content/50 italic">
                      None recorded
                    </p>
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