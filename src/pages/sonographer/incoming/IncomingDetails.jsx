import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getInvestigationByPatientId } from "@/services/api/investigationAPI";
import { createLabResult, getLabResults, updateLabResult } from "@/services/api/labResultsAPI";
import { updateInvestigation } from "@/services/api/investigationRequestAPI";
import toast from "react-hot-toast";
import { FaUpload, FaCheckCircle, FaArrowLeft, FaTimes } from "react-icons/fa";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const SonographerIncomingDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [investigation, setInvestigation] = useState(null);
  const [files, setFiles] = useState([]);
  const [remarks, setRemarks] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [existingLabResult, setExistingLabResult] = useState(null);
  const [patientType, setPatientType] = useState("regular");
  const [dependantId, setDependantId] = useState(null);
  const [opdPatientId, setOpdPatientId] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchPatient = async () => {
      try {
        setLoading(true);
        const res = await getPatientById(patientId);
        const patientData = Array.isArray(res)
          ? res[0]
          : res?.data || res;

        if (mounted) {
          setPatient(patientData);
        }

        if (patientData) {
          const investigationsResponse = await getInvestigationByPatientId(patientId);
          const investigationData = Array.isArray(investigationsResponse)
            ? investigationsResponse[0]
            : investigationsResponse?.data || investigationsResponse;

          if (mounted) {
            setInvestigation(investigationData);

            // Determine patient type from investigation
            if (investigationData?.dependantId) {
              setPatientType("dependant");
              setDependantId(investigationData.dependantId);
            } else if (investigationData?.opdPatientId) {
              setPatientType("opd");
              setOpdPatientId(investigationData.opdPatientId);
            } else {
              setPatientType("regular");
            }
          }

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
                // Pre-populate remarks if available
                if (existingResult.remarks) {
                  setRemarks(existingResult.remarks);
                }
              }
            } catch (error) {
              console.warn("Could not check for existing lab results:", error);
            }
          }
        }
      } catch (error) {
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
  }, [patientId]);

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
      const targetId = investigation?._id || investigation?.id || patient?.id || patient?._id;
      
      if (existingLabResult) {
        // Update existing lab result with new attachments
        const updatePayload = {
          form: {
            ...existingLabResult.form,
            attachments: [...(existingLabResult.form?.attachments || []), ...files],
          },
          remarks: remarks || existingLabResult.remarks,
        };
        
        await updateLabResult(existingLabResult._id || existingLabResult.id, updatePayload);
        toast.success("Scan files added to existing lab result successfully.");
      } else {
        // Create new lab result with proper patient info
        const payload = {
          form: {
            attachments: files,
          },
          remarks: remarks || "Ultrasound scan uploaded by sonographer",
        };

        // Add patient identification based on type
        if (patientType === "dependant") {
          payload.patientId = patient?.id || patient?._id;
          payload.dependantId = dependantId;
        } else if (patientType === "opd") {
          payload.opdPatientId = opdPatientId;
        } else {
          payload.patientId = patient?.id || patient?._id;
          if (patient?.dependantId) {
            payload.dependantId = patient.dependantId;
          }
        }

        await createLabResult(targetId, payload);
        toast.success("Scan uploaded successfully.");
      }

      // Update investigation status to sonography_completed
      if (investigation?._id) {
        await updateInvestigation(investigation._id, { status: 'sonography_completed' });
      }

      navigate("/dashboard/sonographer/incoming");
    } catch (error) {
      console.error("SonographerIncomingDetails: submit error", error);
      toast.error(error?.response?.data?.message || "Failed to submit scan.");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
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
                  <FaUpload className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-base-content">
                    {existingLabResult ? "Add Scan Files" : "Upload Sonography Scan"}
                  </h1>
                  <p className="text-base-content/70">
                    {existingLabResult ? "Add additional scan files to existing lab result." : "Attach scan files for the selected patient."}
                  </p>
                </div>
              </div>
              <button className="btn btn-ghost" onClick={() => navigate('/dashboard/sonographer/incoming')}>
                <FaArrowLeft className="w-4 h-4 mr-2" /> Back to Incoming
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
                  <h2 className="card-title">Patient Information</h2>
                  {loading ? (
                    <div className="py-10 flex justify-center">
                      <div className="loading loading-spinner" />
                    </div>
                  ) : !patient ? (
                    <p className="text-base-content/70">Patient information could not be loaded.</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-xs uppercase text-base-content/50">Name</p>
                          {patientType === "dependant" && (
                            <span className="badge badge-secondary badge-xs">Dependant</span>
                          )}
                          {patientType === "opd" && (
                            <span className="badge badge-info badge-xs">OPD</span>
                          )}
                        </div>
                        <p className="font-semibold text-base-content">{patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-base-content/50">Patient ID</p>
                        <p className="text-base-content">{patient?.hospitalId || patient?.patientId || patient?.id || patient?._id || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase text-base-content/50">Current Status</p>
                        <p className="text-base-content">{Array.isArray(patient?.status) ? patient.status.join(', ') : patient?.status || '—'}</p>
                      </div>
                      {patient?.updatedAt && (
                        <div>
                          <p className="text-xs uppercase text-base-content/50">Last Updated</p>
                          <p className="text-base-content">{formatNigeriaDateTime(patient.updatedAt)}</p>
                        </div>
                      )}
                      {investigation && (
                        <div className="p-4 bg-base-200 rounded-lg">
                          <p className="text-xs uppercase text-base-content/50">Investigation</p>
                          <p className="font-medium text-base-content">{investigation?.testName || investigation?.title || 'Investigation request found'}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body">
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
                          accept=".jpg,.jpeg,.png,.dcm"
                          onChange={handleFileChange}
                          className="file-input file-input-bordered w-full"
                        />
                        <p className="text-xs text-base-content/60 mt-2">Supported: JPG, PNG, DICOM.</p>
                      </div>

                      {files.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">Uploaded Files</p>
                            <p className="text-sm text-base-content/60">{files.length} selected</p>
                          </div>
                          <div className="max-h-56 overflow-y-auto rounded-lg border border-base-200 bg-base-200 p-3 space-y-2">
                            {files.map((file, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-3 p-3 bg-base-100 rounded-lg">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium truncate">{file.name}</p>
                                  <p className="text-xs text-base-content/60">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeFile(idx)}
                                  className="btn btn-ghost btn-xs text-error"
                                >
                                  <FaTimes className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="form-control">
                        <label className="label">
                          <span className="label-text">Remarks (optional)</span>
                        </label>
                        <textarea
                          className="textarea textarea-bordered h-28"
                          placeholder="Add any information about the scan"
                          value={remarks}
                          onChange={(event) => setRemarks(event.target.value)}
                        />
                      </div>

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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SonographerIncomingDetails;
