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
import toast from "react-hot-toast";
import { FaUpload, FaCheckCircle, FaArrowLeft, FaTimes, FaEye, FaXRay, FaHistory, FaTrash } from "react-icons/fa";
import { formatNigeriaDateTime, formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import PatientCardTypeInfo from "@/components/common/PatientCardTypeInfo";
import PatientDetailsCard from "@/components/common/PatientDetailsCard";
import { useAppSelector } from "@/store/hooks";
import SendPatientModal from "@/components/modals/SendPatientModal";
import mammoth from "mammoth";
import { FaFileWord } from "react-icons/fa";
import HmoStatusBadge from "@/components/common/HmoStatusBadge";

const investigationStatusBadge = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'completed') return 'badge-success';
  if (s === 'sonography_completed') return 'badge-info';
  if (s === 'awaiting_sonographer') return 'badge-warning';
  if (s === 'cancelled') return 'badge-error';
  return 'badge-ghost';
};

const SonographerIncomingDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const passedDependantId = location.state?.dependantId;
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
  const [showPendingModal, setShowPendingModal] = useState(false);
  const [pendingInvestigationsList, setPendingInvestigationsList] = useState([]);
  const [pendingLabCount, setPendingLabCount] = useState(0);


useEffect(() => {
  let mounted = true;

  const fetchPatient = async () => {
    try {
      setLoading(true);

      // OPD requests must be loaded by OPD patient ID; regular and dependant requests use the patient endpoint.
      const investigationsResponse = location.state?.patientType === 'opd'
        ? await getInvestigationRequestByOpdPatientId(patientId)
        : await getInvestigations({ type: 'radiology' });
      const allInvestigations = Array.isArray(investigationsResponse)
        ? investigationsResponse
        : (investigationsResponse?.data || []);

      // Sonographer only ever deals with radiology-type investigations —
      // check for both 'radiology' and 'imaging' to support old and new enums.
      const radiologyInvestigations = allInvestigations.filter(
        (inv) => {
          const type = String(inv.type || '').toLowerCase();
          return type === 'radiology' || type === 'imaging';
        }
      );

      // Determine patient type from investigation — search radiology-only list
      let investigationData = null;
      if (passedDependantId) {
        investigationData = radiologyInvestigations.find(inv => 
          String(inv.dependantId) === String(passedDependantId) && 
          String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId) && 
          inv.status !== 'completed'
        );
        if (!investigationData) {
          investigationData = radiologyInvestigations.find(inv => 
            String(inv.dependantId) === String(passedDependantId) && 
            String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId)
          );
        }
      } else {
        investigationData = radiologyInvestigations.find(inv =>
          (String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId) && !inv.dependantId && inv.status !== 'completed') ||
          (String(inv.opdPatientId) === String(patientId) && inv.status !== 'completed')
        );
        if (!investigationData) {
          investigationData = radiologyInvestigations.find(inv =>
            (String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId) && !inv.dependantId) ||
            String(inv.opdPatientId) === String(patientId)
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
        detectedOpdPatientId = location.state?.patientType === 'opd' ? patientId : investigationData.opdPatientId;
        try {
          const opdRes = await getOpdPatientById(detectedOpdPatientId);
          patientData = opdRes?.data || opdRes;
        } catch (err) {
          console.warn("Failed to load OPD patient:", err);
          patientData = { id: detectedOpdPatientId, fullName: "OPD Patient" };
        }
      } else if (passedDependantId || investigationData?.dependantId) {
        // This is a dependant
        detectedPatientType = "dependant";
        detectedDependantId = passedDependantId || investigationData.dependantId;
        try {
          const res = await getPatientById(patientId);
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
          const res = await getPatientById(patientId);
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
            return String(inv.opdPatientId) === String(detectedOpdPatientId || patientId);
          }
          if (detectedPatientType === 'dependant') {
            return String(inv.dependantId) === String(detectedDependantId);
          }
          return (
            String(inv.patientId || inv.patient?._id || inv.patient?.id) === String(patientId) &&
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
        try {
          let invs = [];
          if (detectedPatientType === 'opd') {
            const res = await getInvestigationRequestByOpdPatientId(detectedOpdPatientId);
            invs = Array.isArray(res) ? res : (res?.data || []);
          } else {
            const res = await getInvestigationByPatientId(patientId);
            invs = Array.isArray(res) ? res : (res?.data || []);
          }
          
          const pendingLab = invs.filter(inv => {
            const isMatch = detectedPatientType === 'dependant'
              ? String(inv.dependantId) === String(detectedDependantId)
              : !inv.dependantId;
            const invType = String(inv.type || '').toLowerCase();
            const isLab = invType === 'laboratory' || invType === 'lab';
            const isPending = inv.status !== 'completed' && inv.status !== 'cancelled';
            return isMatch && isLab && isPending;
          });
          if (mounted) setPendingLabCount(pendingLab.length);
        } catch (error) {
          console.warn("Could not check for pending lab tests:", error);
        }
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

      // Update investigation status to completed
      if (investigation?._id) {
        await updateInvestigation(investigation._id, { status: 'completed' });
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

  // Marks this specific radiology investigation as completed — does not
  // move the patient anywhere, just closes out this particular order.
  const handleComplete = async () => {
    if (actionLoading) return;
    try {
      setActionLoading(true);

      if (investigation?._id) {
        await updateInvestigation(investigation._id, { status: 'completed' });
        
        if (patientType === 'opd' && opdPatientId) {
          try {
            await updateOpdPatient(opdPatientId, { status: 'completed' });
          } catch (e) {
            console.warn("Failed to update OPD patient status:", e);
          }
        }

        toast.success("Investigation marked as completed!");
        setRadiologyHistory((prev) =>
          prev.map((inv) => (inv._id === investigation._id ? { ...inv, status: 'completed' } : inv))
        );

        if (patientType === 'opd') {
          navigate('/dashboard/sonographer/incoming');
          return;
        }
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

  const proceedSendPatient = async (targetStatus) => {
    try {
      setActionLoading(true);
      setShowPendingModal(false);

      if (patientType === "opd" && opdPatientId) {
        await updateOpdPatient(opdPatientId, { status: targetStatus });
      } else if (patientType === "dependant" && dependantId) {
        await updateDependantStatus(dependantId, { status: targetStatus });
      } else if (patient?.id) {
        await updatePatientStatus(patient.id || patient._id, { status: targetStatus });
      }

      toast.success("Patient routed successfully!");
      navigate('/dashboard/sonographer/incoming');
    } catch (error) {
      console.error("Send patient error:", error);
      toast.error("Failed to route patient");
    } finally {
      setActionLoading(false);
    }
  };

  // Routes the patient/dependant/OPD patient to the doctor's queue
  const handleSendToDoctor = async () => {
    try {
      setActionLoading(true);

      const effectiveInvestigationId = investigation?._id || investigation?.id;

      let pendingInvestigations = [];
      try {
        if (patientType === "opd" && opdPatientId) {
          const res = await getInvestigationRequestByOpdPatientId(opdPatientId);
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          pendingInvestigations = list.filter(inv => inv.status !== 'completed' && String(inv._id || inv.id) !== String(effectiveInvestigationId));
        } else if (patient?.id || patientId) {
          const res = await getInvestigationByPatientId(patient?.id || patientId);
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          pendingInvestigations = list.filter(inv => {
            const isMatch = patientType === "dependant"
              ? String(inv.dependantId) === String(dependantId)
              : !inv.dependantId;
            return isMatch && inv.status !== 'completed' && String(inv._id || inv.id) !== String(effectiveInvestigationId);
          });
        }

        const today = new Date();
        const pendingToday = pendingInvestigations.filter(inv => {
          if (!inv.createdAt) return false;
          const invDate = new Date(inv.createdAt);
          return invDate.getDate() === today.getDate() && 
                 invDate.getMonth() === today.getMonth() && 
                 invDate.getFullYear() === today.getFullYear();
        });

        if (pendingToday.length > 0) {
          setPendingInvestigationsList(pendingToday);
          setShowPendingModal(true);
          setActionLoading(false);
          return;
        }
      } catch (err) {
        console.warn("Failed to check pending investigations:", err);
      }

      await proceedSendPatient(PATIENT_STATUS.SONOGRAPHY);
    } catch (error) {
      console.error("Send to doctor error:", error);
      toast.error("Failed to process request");
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
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/dashboard/sonographer/incoming')}>
                  <FaArrowLeft className="w-4 h-4 mr-1" /> Back
                </button>
                <SendPatientModal
                  patientId={patient?.id || patientId}
                  patient={patient}
                  defaultDependantId={dependantId}
                  lockSubject
                  isOpdPatient={patientType === 'opd'}
                  onUpdated={() => navigate('/dashboard/sonographer/incoming')}
                  allowedRoles={
                    patientType === 'opd'
                      ? ['labtechnician']
                      : ['doctor', 'medical-director', 'labtechnician']
                  }
                />
              </div>
            </div>

            {pendingLabCount > 0 && (
              <div className="alert alert-warning shadow-sm rounded-xl py-3 px-4 mb-4 flex items-center gap-3">
                <span className="text-2xl">⚠️</span>
                <span className="text-sm text-warning-content font-medium">This patient has <strong>{pendingLabCount}</strong> pending laboratory test request(s).</span>
              </div>
            )}
          </div>
           <PatientDetailsCard
                patient={patient}
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
                        return (
                          <div
                            key={inv._id}
                            className={`p-3 rounded-lg border ${isCurrent ? 'border-primary bg-primary/5' : 'border-base-200 bg-base-100'}`}
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
                                return (
                                  <div key={i} className="flex items-center justify-between bg-base-100 px-2 py-1 rounded border border-base-200">
                                    <span className="text-xs text-base-content/80 capitalize">{testName}</span>
                                    {hmoStatus && (
                                      <HmoStatusBadge hmoStatus={hmoStatus} size="xs" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                            <p className="text-xs text-base-content/50">
                              Ordered {inv.createdAt ? formatNigeriaDate(inv.createdAt) : '—'}
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
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <button
                          className="btn btn-outline w-full sm:w-auto"
                          onClick={() => navigate('/dashboard/sonographer/incoming')}
                        >
                          Back to Incoming
                        </button>
                        {patientType !== 'opd' && (
                          <button
                            onClick={handleSendToDoctor}
                            disabled={actionLoading}
                            className="btn btn-info w-full sm:w-auto gap-2"
                          >
                            {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : <>Send to Doctor</>}
                          </button>
                        )}
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
                              onClick={() => navigate('/dashboard/sonographer/incoming')}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
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
              {previewFile.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(previewFile)}
                  alt={previewFile.name}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : docPreviewLoading ? (
                <div className="py-10 flex flex-col items-center gap-2">
                  <span className="loading loading-spinner loading-md" />
                  <p className="text-sm text-base-content/60">Rendering document…</p>
                </div>
              ) : docPreviewHtml ? (
                <div
                  className="prose prose-sm max-w-full w-full max-h-[60vh] overflow-y-auto text-left px-2"
                  dangerouslySetInnerHTML={{ __html: docPreviewHtml }}
                />
              ) : (
                <div className="text-center py-10">
                  <FaFileWord className="w-10 h-10 text-primary/50 mx-auto mb-3" />
                  <p className="text-base-content/70 font-medium">{previewFile.name}</p>
                  <p className="text-sm text-base-content/50 mt-1">
                    {(previewFile.size / 1024 / 1024).toFixed(2)} MB · Preview not available
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    {/* Pending Investigations Modal */}
    {showPendingModal && (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60">
        <div className="bg-base-100 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
          <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-100">
            <h3 className="font-bold text-lg text-warning flex items-center gap-2">
              <span className="text-xl">⚠️</span> Pending Investigations Found
            </h3>
            <button onClick={() => setShowPendingModal(false)} className="btn btn-ghost btn-sm btn-circle">
              <FaTimes />
            </button>
          </div>
          
          <div className="p-5 overflow-y-auto">
            <p className="text-sm text-base-content/80 mb-4">
              This patient still has the following pending or in-progress investigations requested today. Are you sure you want to send them back to the doctor now?
            </p>
            
            <div className="space-y-3 mb-2">
              {pendingInvestigationsList.map(inv => (
                <div key={inv._id || inv.id} className="p-3 bg-base-200/50 rounded-lg border border-base-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-primary badge-sm uppercase text-[10px] font-bold">
                      {inv.type || 'Unknown Type'}
                    </span>
                    <span className="text-xs text-base-content/50">
                      {inv.createdAt ? formatNigeriaDateTime(inv.createdAt) : ''}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(inv.tests || []).map((t, idx) => (
                      <span key={idx} className="badge badge-ghost badge-sm bg-base-100">
                        {typeof t === 'object' ? (t.name || t.code) : t}
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between items-center">
                     <span className="text-xs font-medium text-base-content/70">
                       Status: <span className="uppercase text-[10px] font-bold text-warning">{String(inv.status || '').replace(/_/g, ' ')}</span>
                     </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 border-t border-base-200 bg-base-50 flex flex-wrap justify-end gap-3">
            <button 
              onClick={() => setShowPendingModal(false)} 
              className="btn btn-ghost"
            >
              Cancel
            </button>
            <button 
              onClick={() => proceedSendPatient(PATIENT_STATUS.AWAITING_LAB)} 
              className="btn btn-primary"
            >
              Send to Lab
            </button>
            <button 
              onClick={() => proceedSendPatient(PATIENT_STATUS.SONOGRAPHY)} 
              className="btn btn-info"
            >
              Send to Doctor
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};

export default SonographerIncomingDetails;