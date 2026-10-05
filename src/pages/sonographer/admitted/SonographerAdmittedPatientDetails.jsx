import React, { useEffect, useState, useMemo } from "react";
import { getDependantById, updateDependantStatus } from "@/services/api/dependantAPI";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getInvestigations, updateInvestigation, getInvestigationRequestByOpdPatientId, getInvestigationByPatientId } from "@/services/api/investigationRequestAPI";
import { createLabResult, getLabResults, updateLabResult } from "@/services/api/labResultsAPI";
import { getOpdPatientById, updateOpdPatient } from "@/services/api/opdPatientAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { getAllBillings } from "@/services/api/billingAPI";
import toast from "react-hot-toast";
import { FaUpload, FaCheckCircle, FaArrowLeft, FaTimes, FaEye, FaXRay, FaHistory, FaTrash, FaDownload } from "react-icons/fa";
import { formatNigeriaDateTime, formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import PatientCardTypeInfo from "@/components/common/PatientCardTypeInfo";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";
import { useAppSelector } from "@/store/hooks";
import mammoth from "mammoth";
import { FaFileWord } from "react-icons/fa";
import HmoStatusBadge from "@/components/common/HmoStatusBadge";
import { filterVisibleInvestigation } from "@/utils/investigationVisibility";

const toDataUrl = (file) => {
  if (!file?.data) return null;
  if (typeof file.data === "string") {
    return file.data.startsWith("data:") || file.data.startsWith("http") ? file.data : `data:${file.mimetype};base64,${file.data}`;
  }
  if (file.data instanceof Uint8Array || file.data instanceof ArrayBuffer) {
    const arr = file.data instanceof ArrayBuffer ? new Uint8Array(file.data) : file.data;
    const binary = Array.from(arr).map((b) => String.fromCharCode(b)).join("");
    return `data:${file.mimetype};base64,${btoa(binary)}`;
  }
  if (file.data?.type === "Buffer" && Array.isArray(file.data.data)) {
    const binary = file.data.data.map((b) => String.fromCharCode(b)).join("");
    return `data:${file.mimetype};base64,${btoa(binary)}`;
  }
  return null;
};

const downloadFile = (file, fallbackName) => {
  const url = toDataUrl(file);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || file.filename || fallbackName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const investigationStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'badge-success';
  if (s === 'sonography_completed') return 'badge-info';
  if (s === 'awaiting_sonographer') return 'badge-warning';
  if (s === 'cancelled') return 'badge-error';
  return 'badge-ghost';
};

const SonographerAdmittedPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passedDependantId = location.state?.dependantId;
  const admission = location.state?.admission;
  const admissionConsultationId = admission?.consultationId || admission?.consultation?.id || admission?.consultation;
  const { user } = useAppSelector((state) => state.auth);
  const [patient, setPatient] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [radiologyHistory, setRadiologyHistory] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [existingLabResult, setExistingLabResult] = useState(null);
  const [patientType, setPatientType] = useState("regular");
  const [dependantId, setDependantId] = useState(null);
  const [dependantInfo, setDependantInfo] = useState(null);
  const [opdPatientId, setOpdPatientId] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [docPreviewHtml, setDocPreviewHtml] = useState(null);
  const [docPreviewLoading, setDocPreviewLoading] = useState(false);


useEffect(() => {
  let mounted = true;

  const fetchPatient = async () => {
    try {
      setLoading(true);

      // OPD requests must be loaded by OPD patient ID; regular and dependant requests use the patient endpoint.
      const investigationsPromise = location.state?.patientType === 'opd'
        ? getInvestigationRequestByOpdPatientId(patientId)
        : getInvestigations({ type: 'radiology' });
        
      const [investigationsResponse, billingsResponse] = await Promise.all([
        investigationsPromise,
        getAllBillings().catch(() => [])
      ]);
      const allBillings = Array.isArray(billingsResponse) ? billingsResponse : (billingsResponse?.data?.data || billingsResponse?.data || []);

      const allInvestigations = Array.isArray(investigationsResponse)
        ? investigationsResponse
        : (investigationsResponse?.data || []);

      const extractId = (val) => {
        if (!val) return "";
        if (typeof val === "string") return val;
        if (typeof val === "object") return val.id || val._id || "";
        return String(val);
      };

      const cleanAdmissionConsultId = extractId(admissionConsultationId);

      // Sonographer deals with radiology-type investigations
      // For admissions, we bypass the payment check and only filter by the admission's consultation ID
      const radiologyInvestigations = allInvestigations.filter(
        (inv) => {
          const type = String(inv.type || '').toLowerCase();
          const isRadiology = type === 'radiology' || type === 'imaging';
          const matchesConsultation = cleanAdmissionConsultId ? extractId(inv.consultationId || inv.consultation) === cleanAdmissionConsultId : false;
          return isRadiology && matchesConsultation;
        }
      );

      const cleanPatientId = extractId(patientId);
      const cleanDependantId = extractId(passedDependantId);

      const getInvPatientId = (inv) => extractId(inv.patientId) || extractId(inv.patient);
      const getInvDependantId = (inv) => extractId(inv.dependantId) || extractId(inv.dependant);
      const getInvOpdId = (inv) => extractId(inv.opdPatientId) || extractId(inv.opdPatient);

      // Determine patient type from investigation — search radiology-only list
      let investigationData = null;
      if (cleanDependantId) {
        investigationData = radiologyInvestigations.find(inv => 
          getInvDependantId(inv) === cleanDependantId && 
          getInvPatientId(inv) === cleanPatientId && 
          inv.status !== 'completed'
        );
        if (!investigationData) {
          investigationData = radiologyInvestigations.find(inv => 
            getInvDependantId(inv) === cleanDependantId && 
            getInvPatientId(inv) === cleanPatientId
          );
        }
      } else {
        investigationData = radiologyInvestigations.find(inv =>
          ((getInvPatientId(inv) === cleanPatientId && !inv.dependantId) || getInvOpdId(inv) === cleanPatientId) && inv.status !== 'completed'
        );
        if (!investigationData) {
          investigationData = radiologyInvestigations.find(inv =>
            (getInvPatientId(inv) === cleanPatientId && !inv.dependantId) || getInvOpdId(inv) === cleanPatientId
          );
        }
      }

      let patientData = null;
      let detectedPatientType = "regular";
      let detectedOpdPatientId = null;
      let detectedDependantId = null;

      // Step 2: Fetch the correct patient based on investigation data or navigation state
      if (location.state?.patientType === 'opd' || investigationData?.opdPatientId) {
        // This is an OPD patient
        detectedPatientType = "opd";
        detectedOpdPatientId = location.state?.patientType === 'opd' ? cleanPatientId : extractId(investigationData.opdPatientId);
        try {
          const opdRes = await getOpdPatientById(detectedOpdPatientId);
          patientData = opdRes?.data || opdRes;
        } catch (err) {
          console.warn("Failed to load OPD patient:", err);
          patientData = { id: detectedOpdPatientId, fullName: "OPD Patient" };
        }
      } else if (cleanDependantId || investigationData?.dependantId) {
        // This is a dependant
        detectedPatientType = "dependant";
        detectedDependantId = cleanDependantId || extractId(investigationData.dependantId);
        try {
          const res = await getPatientById(cleanPatientId);
          patientData = Array.isArray(res) ? res[0] : res?.data || res;
        } catch (err) {
          console.error("Failed to load patient:", err);
          patientData = null;
        }

        try {
            const depRes = await getDependantById(detectedDependantId);
            const dep = depRes?.data?.data?.dependant || depRes?.data?.dependant || depRes?.dependant || depRes?.data;
            if (mounted && dep) setDependantInfo(dep);
          } catch (err) {
            console.warn("Failed to load dependant details:", err);
          }
      } else {
        // Regular patient
        detectedPatientType = "regular";
        try {
          const res = await getPatientById(cleanPatientId);
          patientData = Array.isArray(res) ? res[0] : res?.data || res;
        } catch (err) {
          console.error("Failed to load patient:", err);
          patientData = null;
        }
      }

      // Build radiology history for this exact subject (patient, dependant, or OPD patient)
      const historyList = radiologyInvestigations
        .filter((inv) => {
          if (detectedPatientType === 'opd') {
            return getInvOpdId(inv) === (detectedOpdPatientId || cleanPatientId);
          }
          if (detectedPatientType === 'dependant') {
            return getInvDependantId(inv) === detectedDependantId;
          }
          return (
            getInvPatientId(inv) === cleanPatientId &&
            !inv.dependantId
          );
        })
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      if (mounted) {
        setPatient(patientData);
        setPatientType(detectedPatientType);
        setOpdPatientId(detectedOpdPatientId);
        setDependantId(detectedDependantId);
        setInvestigation(investigationData);
        setRadiologyHistory(historyList);

        // Check for existing lab result
        if (investigationData?._id) {
          try {
            const labResultsResponse = await getLabResults({ investigationRequestId: investigationData._id });
            const labResults = Array.isArray(labResultsResponse?.data)
              ? labResultsResponse.data
              : (labResultsResponse?.data ? [labResultsResponse.data] : []);

            const existingResult = labResults.find(lr =>
              lr.investigationRequestId === investigationData._id ||
              lr.investigationId === investigationData._id
            );

            if (mounted && existingResult) {
              setExistingLabResult(existingResult);
            }
          } catch (error) {
            console.warn("Could not check for existing lab results:", error);
          }
        }

        // Check for pending lab tests
        // (Removed for admissions as routing is not needed)
      }
    }  catch (error) {
      console.error("SonographerIncomingDetails: fetch error", error);
      toast.error("Failed to load patient details");
    } finally {
      if (mounted) setLoading(false);
    }
  };

  fetchPatient();

  return () => {
    mounted = false;
  };
}, [patientId, location.state?.patientType, passedDependantId]);


  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (!patient) {
      toast.error("Patient not found.");
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one scan file.");
      return;
    }

    setSubmitting(true);
    try {
      const targetId = investigation?._id || investigation?.id;

      if (!targetId) {
        toast.error("Investigation ID not found.");
        return;
      }

      if (existingLabResult) {
        // Update existing lab result with new attachments
        const updatePayload = {
          form: {
            ...existingLabResult.form,
            attachments: [...(existingLabResult.form?.attachments || []), ...files],
          },
        };

        await updateLabResult(existingLabResult._id || existingLabResult.id, updatePayload);
        toast.success("Scan files added to existing lab result successfully.");
      } else {
        // Create new lab result with proper patient info
        const payload = {
          form: {
            attachments: files,
          },
          sonographerId: user?.id,
        };

        // Add patient identification based on type
        if (patientType === "dependant") {
          payload.patientId = patient?.id || patient?._id;
          payload.dependantId = dependantId;
        } else if (patientType === "opd") {
          payload.patientId = opdPatientId || patientId;
          payload.opdPatientId = opdPatientId || patientId;
        } else {
          payload.patientId = patient?.id || patient?._id;
          if (patient?.dependantId) {
            payload.dependantId = patient.dependantId;
          }
        }

        await createLabResult(targetId, payload);
        toast.success("Scan uploaded successfully.");
      }

      // Show success state instead of navigating
      setUploadSuccess(true);
      setFiles([]);
    } catch (error) {
      console.error("SonographerIncomingDetails: submit error", error);
      toast.error(error?.response?.data?.message || "Failed to submit scan.");
    } finally {
      setSubmitting(false);
    }
  };

  // Marks this specific radiology investigation as completed
  const handleComplete = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);

      if (investigation?._id) {
        await updateInvestigation(investigation._id, { status: 'completed' });
        
        toast.success("Investigation marked as completed!");
        setRadiologyHistory((prev) =>
          prev.map((inv) => (inv._id === investigation._id ? { ...inv, status: 'completed' } : inv))
        );
        // Do not route anywhere since the patient is admitted
      } else {
        toast.error("Investigation ID not found");
      }
    } catch (error) {
      console.error("Complete investigation error:", error);
      toast.error("Failed to mark investigation as completed");
    } finally {
      setActionLoading(false);
    }
  };
    const isInvestigationCompleted = String(investigation?.status || '').toLowerCase() === 'completed';


  const openPreview = async (file) => {
    setPreviewFile(file);
    setShowPreview(true);
    setDocPreviewHtml(null);

    const isWord = file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc");
    if (isWord) {
      setDocPreviewLoading(true);
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setDocPreviewHtml(result.value);
      } catch (err) {
        console.error("Word preview failed:", err);
        setDocPreviewHtml(null);
      } finally {
        setDocPreviewLoading(false);
      }
    }
  };


  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const displaySubjectName = patientType === "dependant"
    ? (dependantInfo?.fullName || `${dependantInfo?.firstName || ''} ${dependantInfo?.lastName || ''}`.trim() || 'Unknown Dependant')
    : (patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown');

  const isViewingDependant = patientType === "dependant";
  const summarySubject = useMemo(() => {
    const subject = isViewingDependant ? (dependantInfo || {}) : (patient || {});
    const parent = isViewingDependant ? (patient || {}) : subject;

    return {
      fullName: displaySubjectName,
      gender: subject.gender || '—',
      phone: subject.phone || subject.phoneNumber || parent.phone || parent.phoneNumber || '—',
      hospitalId: parent.hospitalId || '—',
      status: subject.status || parent.status || 'Unknown',
      dob: subject.dob || subject.dateOfBirth || subject.birthDate,
      cardType: subject.cardType || parent.cardType || 'personal',
      familyName: subject.familyName || parent.familyName || subject.lastName || parent.lastName,
      companyName: subject.companyName || parent.companyName,
      hmos: Array.isArray(parent.hmos)
        ? parent.hmos.filter((h) => isViewingDependant ? h.dependantId === dependantId : !h.dependantId)
        : [],
      relationshipType: subject.relationshipType,
    };
  }, [dependantId, dependantInfo, displaySubjectName, isViewingDependant, patient]);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="mb-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <FaXRay className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                    {existingLabResult ? "Add Scan Files" : "Upload Sonography Scan"}
                  </h1>
                  <p className="text-sm sm:text-base text-base-content/70">
                    {existingLabResult ? "Add additional scan files to existing lab result." : "Upload scan file for the selected patient."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/sonographer/admitted')}>
                  <FaArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
              </div>
            </div>
          </div>
           <PatientDetailsCard
                patient={patient}
             subject={isViewingDependant ? dependantInfo : patient}
                summarySubject={summarySubject}
                isViewingDependant={isViewingDependant}
              />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              {/* Patient Info */}
             
              {/* Radiology History */}
              <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
                <div className="card-body">
                  <h2 className="card-title text-base flex items-center gap-2">
                    <FaHistory className="w-4 h-4 text-base-content/60" />
                    Radiology History
                  </h2>
                  {loading ? (
                    <div className="py-6 flex justify-center">
                      <div className="loading loading-spinner loading-sm" />
                    </div>
                  ) : radiologyHistory.length === 0 ? (
                    <p className="text-sm text-base-content/50 italic py-2">No prior radiology orders for {displaySubjectName}.</p>
                  ) : (
                    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                      {radiologyHistory.map((inv) => {
                        const isCurrent = inv._id === investigation?._id;
                        const isCompleted = String(inv.status || '').toLowerCase() === 'completed';
                        return (
                          <div
                            key={inv._id}
                            onClick={() => {
                              setInvestigation(inv);
                              setFiles([]);
                              setUploadSuccess(false);
                              setExistingLabResult(null);
                              // Also fetch existing lab result for the new selection
                              getLabResults({ investigationRequestId: inv._id }).then(res => {
                                const results = Array.isArray(res?.data) ? res.data : (res?.data ? [res.data] : []);
                                const existing = results.find(lr => lr.investigationRequestId === inv._id || lr.investigationId === inv._id);
                                if (existing) setExistingLabResult(existing);
                              }).catch(console.warn);
                            }}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${isCurrent ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-200 bg-base-100'} ${!isCurrent ? 'hover:border-primary/50 hover:bg-base-100/80' : ''} ${isCompleted ? 'opacity-70 hover:opacity-100' : ''}`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className={`badge badge-sm ${investigationStatusBadge(inv.status)}`}>
                                {String(inv.status || '').replace(/_/g, ' ')}
                              </span>
                              {isCurrent && (
                                <span className="badge badge-outline badge-primary badge-xs">Viewing</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-1.5 mb-1.5 mt-1">
                              {(inv.tests || []).map((t, i) => {
                                const testName = typeof t === 'object' ? (t.name || t.code) : t;
                                const hmoStatus = typeof t === 'object' ? t.hmoStatus : null;
                                const isPaid = typeof t === 'object' ? (t.isPaid || t.paymentStatus === 'paid' || t.isCleared) : false;
                                return (
                                  <div key={i} className="flex items-center justify-between bg-base-100 px-2 py-1 rounded border border-base-200">
                                    <span className="text-xs text-base-content/80 capitalize">{testName}</span>
                                    {isPaid ? (
                                      <span className="badge badge-success text-success-content badge-xs font-semibold px-1.5 py-0.5">✓ Paid</span>
                                    ) : hmoStatus ? (
                                      <HmoStatusBadge hmoStatus={hmoStatus} size="xs" />
                                    ) : (
                                      <span className="badge badge-success text-success-content badge-xs font-semibold px-1.5 py-0.5">✓ Paid</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-base-content/50">
                              Ordered {inv.createdAt ? formatNigeriaDateTime(inv.createdAt) : '—'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow-sm border border-base-200 rounded-2xl">
                <div className="card-body">
                  {uploadSuccess ? (
                    // Success state - show action buttons
                    <div className="space-y-5">
                      <div className="alert alert-success rounded-xl">
                        <FaCheckCircle className="w-5 h-5" />
                        <span>Scan uploaded successfully!</span>
                      </div>

                      <div className="divider">Next Steps</div>

                      <div className="space-y-3">
                        <p className="text-sm text-base-content/70">Choose an action:</p>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={handleComplete}
                            disabled={actionLoading}
                            className="btn btn-warning gap-2"
                          >
                            {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : <>Complete This Order</>}
                          </button>
                          {patientType !== 'opd' && (
                            <button
                              onClick={handleSendToDoctor}
                              disabled={actionLoading}
                              className="btn btn-info gap-2"
                            >
                              {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : <>Send to Doctor</>}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="divider">Actions</div>

                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => setUploadSuccess(false)}
                          className="btn btn-ghost"
                        >
                          Upload More Scans
                        </button>
                      </div>
                    </div>
                    ) : isInvestigationCompleted ? (
                    // This investigation is already completed — no more uploads allowed
                    <div className="space-y-4">
                      <div className="alert alert-info rounded-xl">
                        <FaCheckCircle className="w-5 h-5" />
                        <span>This radiology order has already been completed. No further uploads are needed.</span>
                      </div>
                      
                      {existingLabResult?.form?.attachments?.length > 0 && (
                        <div className="space-y-3 mt-4 bg-base-100 border border-base-200 p-4 rounded-xl">
                          <h3 className="font-semibold text-sm">Scan Results</h3>
                          <div className="grid gap-2">
                            {existingLabResult.form.attachments.map((file, idx) => (
                              <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-base-200 rounded-lg">
                                <div className="min-w-0 flex-1 flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    {/^image\//i.test(file?.mimetype || "") || /\.(jpg|jpeg|png|gif|webp)$/i.test(file?.name || file?.filename || "") ? (
                                      <FaEye className="w-3.5 h-3.5 text-primary" />
                                    ) : (
                                      <FaFileWord className="w-3.5 h-3.5 text-primary" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium truncate">{file.name || file.filename || `File ${idx + 1}`}</p>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewFile(file);
                                      setShowPreview(true);
                                    }}
                                    className="btn btn-outline btn-sm bg-base-100 gap-1.5"
                                  >
                                    <FaEye className="w-3 h-3" /> View
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => downloadFile(file, `scan-${idx + 1}`)}
                                    className="btn btn-primary btn-sm gap-1.5"
                                  >
                                    <FaDownload className="w-3 h-3" /> Download
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          className="btn btn-outline w-full sm:w-auto"
                          onClick={() => navigate('/dashboard/sonographer/admitted')}
                        >
                          Back to Admitted List
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Upload form state
                    <div className="space-y-5">
                      <h2 className="card-title">Upload Scan Files</h2>
                      {loading ? (
                        <div className="py-16 flex justify-center">
                          <div className="loading loading-spinner" />
                        </div>
                      ) : (
                        <div className="space-y-5">
                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Choose Scan Files</span>
                            </label>
                            <input
                              type="file"
                              multiple
                              accept=".doc,.docx"
                              onChange={handleFileChange}
                              className="file-input file-input-bordered w-full"
                            />
                          <p className="text-xs text-base-content/60 mt-2">Supported: DOC, DOCX.</p>
                          </div>

                          {files.length > 0 && (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-semibold">Selected Files</p>
                                <p className="text-sm text-base-content/60">{files.length} file(s)</p>
                              </div>
                              <div className="max-h-56 overflow-y-auto rounded-lg border border-base-200 bg-base-200 p-3 space-y-2">
                                {files.map((file, idx) => (
                                  <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-base-100 rounded-lg">
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-medium truncate">{file.name}</p>
                                      <p className="text-xs text-base-content/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => openPreview(file)}
                                        className="btn btn-ghost btn-xs"
                                      >
                                        <FaEye className="w-3 h-3" />
                                      </button>
                                     <button
                                        type="button"
                                        onClick={() => removeFile(idx)}
                                        className="btn btn-ghost btn-xs"
                                      >
                                        <FaTrash className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <button
                              className={`btn btn-primary w-full sm:w-auto gap-2 ${submitting ? "loading" : ""}`}
                              onClick={handleSubmit}
                              disabled={submitting || files.length === 0}
                            >
                              <FaCheckCircle className="w-4 h-4" />
                              {submitting ? "Submitting..." : "Submit Scan"}
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline w-full sm:w-auto"
                              onClick={() => navigate('/dashboard/sonographer/admitted')}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
          <div className="bg-base-100 rounded-2xl shadow-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-base-200 flex items-center justify-between sticky top-0 bg-base-100">
              <h3 className="text-lg font-semibold">{previewFile.name}</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 flex justify-center">
              {(() => {
                const isImage = previewFile instanceof File 
                  ? previewFile.type.startsWith('image/')
                  : (/^image\//i.test(previewFile?.mimetype || "") || /\.(jpg|jpeg|png|gif|webp)$/i.test(previewFile?.name || previewFile?.filename || ""));
                  
                const src = previewFile instanceof File ? URL.createObjectURL(previewFile) : toDataUrl(previewFile);
                
                if (isImage && src) {
                  return (
                    <img
                      src={src}
                      alt={previewFile.name || previewFile.filename}
                      className="max-w-full h-auto rounded-lg"
                    />
                  );
                }
                
                if (docPreviewLoading) {
                  return (
                    <div className="py-10 flex flex-col items-center gap-2">
                      <span className="loading loading-spinner loading-md" />
                      <p className="text-sm text-base-content/60">Rendering document…</p>
                    </div>
                  );
                }
                
                if (docPreviewHtml) {
                  return (
                    <div
                      className="prose prose-sm max-w-full w-full max-h-[60vh] overflow-y-auto text-left px-2"
                      dangerouslySetInnerHTML={{ __html: docPreviewHtml }}
                    />
                  );
                }
                
                return (
                  <div className="text-center py-10">
                    <FaFileWord className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                    <p className="text-base-content/70 font-medium">{previewFile.name || previewFile.filename}</p>
                    <p className="text-sm text-base-content/50 mt-1">
                      {previewFile instanceof File ? `${(previewFile.size / 1024 / 1024).toFixed(2)} MB · ` : ''}Preview not available
                    </p>
                    {!(previewFile instanceof File) && (
                      <button className="btn btn-primary btn-sm mt-3" onClick={() => downloadFile(previewFile, previewFile.name || previewFile.filename)}>
                         <FaDownload className="w-3 h-3 mr-1" /> Download Instead
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SonographerAdmittedPatientDetails;
