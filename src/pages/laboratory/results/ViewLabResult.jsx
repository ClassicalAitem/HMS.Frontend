import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResultById, getLabResultFile } from "@/services/api/labResultsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import SendLabResultsModal from "@/components/modals/SendLabResultsModal";
import AttachmentViewerModal from "@/components/modals/AttachmentViewerModal";
import { FaFileImage } from "react-icons/fa";

const ViewLabResult = () => {
  const { labResultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [labResult, setLabResult] = useState(null);
  const [patient, setPatient] = useState(null);
  const [investigationIdState, setInvestigationIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);

  const effectiveInvestigationId =  labResult?.investigationRequestId;

  useEffect(() => {
    if (location?.state?.investigationId) {
      setInvestigationIdState(location.state.investigationId);
    }
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

      
        const labRes = await getLabResultById(labResultId);
        const labData = labRes?.data || labRes;
        setLabResult(labData);

         if (!investigationIdState && labData?.investigationId) {
          setInvestigationIdState(labData.investigationId);
        }

      if (labData?.patientId) {
          const patientRes = await getPatientById(labData.patientId);
          const patientData = patientRes?.data || patientRes;
          setPatient(patientData);
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching lab result:", err);
        setError("Failed to load lab result details");
      } finally {
        setLoading(false);
      }
    };

    if (labResultId) {
      fetchData();
    }
  }, [labResultId, investigationIdState]);

  const handleOpenAttachmentViewer = async (fileIndex = 0) => {
    const atts = labResult?.attachedFiles || labResult?.form?.attachments;
    if (!atts || atts.length === 0) {
      setAttachedFiles([]);
      setCurrentFileIndex(0);
      setIsAttachmentViewerOpen(true);
      return;
    }

    setIsLoadingFiles(true);
    try {
      const files = await Promise.all(
        atts.map(async (file) => {
          try {
            // If it's already a file object with data, use it directly
            if (file.data || file._id) {
              return file;
            }
            // Otherwise, fetch it by ID assuming it's a string ID
            const fileId = typeof file === 'string' ? file : file.id || file._id;
            if (!fileId) {
              console.warn("No file ID found for file:", file);
              return null;
            }
            const response = await getLabResultFile(fileId);
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
            console.error(`Error loading file:`, error);
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

  const displayField = (label, value) => {
    if (!value) return null;
    return (
      <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200">
        <div className="font-semibold text-[#00943C]">{label}</div>
        <div className="col-span-2 text-gray-700 whitespace-normal break-words">{value}</div>
      </div>
    );
  };

  const displaySection = (title, data) => {
    if (!data || Object.values(data).every((v) => !v)) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
          {title}
        </h3>
        <div className="bg-gray-50 p-4 rounded-lg">
          {Object.entries(data).map(([key, value]) => {
            if (!value) return null;
            if (typeof value === "object") return null;
            return (
              <div key={key} className="grid grid-cols-3 gap-4 py-2 border-b border-gray-200 last:border-b-0">
                <div className="font-semibold text-gray-700">{key}</div>
                <div className="col-span-2 text-gray-600">
                  {typeof value === "string" || typeof value === "number"
                    ? value
                    : JSON.stringify(value)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const displayAttachments = () => {
    const atts = labResult?.attachedFiles || labResult?.form?.attachments;
    if (!atts || !atts.length) return null;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-bold text-[#00943C] mb-4 pb-2 border-b-2 border-[#00943C] flex items-center gap-2">
          <FaFileImage className="w-5 h-5" /> Attachments ({atts.length})
        </h3>
        
        {attachedFiles.length === 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {atts.map((file, idx) => (
              <button
                key={idx}
                onClick={() => handleOpenAttachmentViewer(idx)}
                disabled={isLoadingFiles}
                className="flex items-center justify-center p-3 bg-base-200/50 rounded-lg border border-base-200 hover:border-[#00943C] hover:bg-[#00943C]/5 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
                title="Click to load and view"
              >
                <div className="flex flex-col items-center gap-1 w-full">
                  <FaFileImage className="w-6 h-6 text-[#00943C] group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-medium text-gray-600 group-hover:text-[#00943C] text-center truncate w-full px-1">
                    Load File {idx + 1}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : isLoadingFiles ? (
          <div className="flex justify-center p-8">
            <span className="loading loading-spinner loading-lg text-[#00943C]"></span>
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
                  className="relative group rounded-lg overflow-hidden border border-gray-300 hover:border-[#00943C] transition-all cursor-pointer"
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
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-all">
                      <FaFileImage className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                  <div className="p-2 bg-white border-t border-gray-300">
                    <p className="text-xs font-medium text-gray-600 truncate" title={file.name}>
                      {file.name || `File ${idx + 1}`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading lab result...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <div className="text-center">
              <p className="text-lg text-red-600 mb-4">{error}</p>
              <button
                onClick={() => navigate("/dashboard/laboratory")}
                className="px-6 py-2 bg-[#00943C] text-white font-semibold rounded-lg"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const patientName =
    patient?.firstName && patient?.lastName
      ? `${patient.firstName} ${patient.lastName}`
      : patient?.name || "Unknown Patient";

  const handlePrint = () => {
    document.body.classList.add('printable-lab');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printable-lab');
    }, 250);
  };

  return (
    <div className="lab-container flex h-screen bg-base-200">
      <div className="lab-sidebar">
        <LaboratorySidebar />
      </div>

      <div className="lab-main flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h1 className="text-[32px] text-[#00943C] font-bold">Lab Result Details</h1>
                <p className="text-[12px] text-[#605D66]">
                  Complete laboratory test results for {patientName}
                </p>
              </div>
              <div className="flex gap-2 no-print">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  ← Back
                </button>
                <button
                  onClick={() => navigate(`/dashboard/laboratory/results/edit/${labResultId}`)}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
              {/* Patient Information Header */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 pb-8 border-b-2 border-gray-200">
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Patient Name</p>
                  <p className="text-lg font-bold text-[#00943C]">{patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Hospital ID</p>
                  <p className="text-lg font-bold">{patient?.hospitalId || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Lab Technician</p>
                  <p className="text-lg font-bold">{labResult?.form?.labNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 uppercase font-semibold">Date</p>
                  <p className="text-lg font-bold">{labResult?.form?.date || "N/A"}</p>
                </div>
              </div>

              {/* Test Information */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-4">
                {displayField("Age", labResult?.form?.age)}
                {displayField("Sex", labResult?.form?.sex)}
                {displayField("Clinical Diagnosis", labResult?.form?.clinicalDiagnosis)}
                {displayField("Nature of Specimen", labResult?.form?.natureOfSpecimen)}
              </div>
              {displayField("Referral/Doctor", labResult?.form?.referral)}

              {/* Test Results Sections */}
              {displaySection("Haematology", labResult?.form?.haematology)}
              {displaySection("WBC Differential", labResult?.form?.wbcDifferential)}
              {displaySection("Serology", labResult?.form?.serology)}
              {displaySection("Blood Cross-Matching", labResult?.form?.bloodCrossmaching)}
              {displaySection("Hormone Profile", labResult?.form?.hormoneProfile)}
              {displaySection("Oestrogen", labResult?.form?.oestrogen)}
              {displaySection("Urinalysis", labResult?.form?.urinalysis)}
              {displaySection("Kidney Function Test", labResult?.form?.kidneyFunctionTest)}
              {displaySection("Liver Function Test", labResult?.form?.liverFunctionTest)}
              {displaySection("Diabetes Screening", labResult?.form?.diabetesScreening)}
              {displaySection("Lipid Profile", labResult?.form?.lipidProfile)}
              {displaySection("Others", labResult?.form?.others)}

              {displayAttachments()}

              {/* Widal Report Table */}
              {labResult?.form?.widalReport &&
                Object.values(labResult.form.widalReport).some(
                  (v) => v.O || v.H
                ) && (
                  <div className="mb-6">
                    <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                      Widal Report
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-[#00943C]/20 to-[#00943C]/10">
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              Organism
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              O 
                            </th>
                            <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                              H 
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(labResult.form.widalReport).map(
                            ([key, values]) => (
                              <tr key={key} className="hover:bg-gray-50">
                                <td className="border border-gray-300 px-4 py-2">
                                  {key === "SalmTyphi" && "Salmonella Typhi"}
                                  {key === "SalmParatyphiA" &&
                                    "Salmonella Paratyphi A"}
                                  {key === "SalmParatyphiB" &&
                                    "Salmonella Paratyphi B"}
                                  {key === "SalmParatyphiC" &&
                                    "Salmonella Paratyphi C"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {values.O || "—"}
                                </td>
                                <td className="border border-gray-300 px-4 py-2">
                                  {values.H || "—"}
                                </td>
                              </tr>
                            )
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              {displaySection("Microbiology", labResult?.form?.microbiology)}
              {displaySection("Wet Preparation", labResult?.form?.wetPreparation)}
              {displaySection("Antibiotic Sensitivity", labResult?.form?.sensitiveProfile?.Drugs)}

              {/* Remarks */}
              {labResult?.form?.remarks && (
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                    Overall Remarks
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap">
                    {labResult.form.remarks}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-8 border-t-2 border-gray-200 no-print">
                <button
                  onClick={() => setShowSendModal(true)}
                  disabled={!effectiveInvestigationId}
                  className={`flex-1 px-6 py-3 ${effectiveInvestigationId ? "bg-[#00943C] text-white hover:bg-[#007a31]" : "bg-gray-200 text-gray-500 cursor-not-allowed"} font-semibold rounded-lg transition-all`}
                >
                  Send to Doctor
                </button>
                <button
                  onClick={handlePrint}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Print Results
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
              <style>{`
                @media print {
                  body { background: white !important; margin: 0; padding: 0; }
                  body.printable-lab { background: white !important; }
                  .lab-container { display: flex !important; }
                  .lab-sidebar { display: none !important; width: 0 !important; }
                  .lab-main { width: 100% !important; }
                  .no-print { display: none !important; }
                  .rounded-lg { border-radius: 0 !important; }
                  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                }
              `}</style>
            </div>
          </section>
        </div>
      </div>

      <SendLabResultsModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        labResultId={labResultId}
        investigationRequestId={effectiveInvestigationId}
        patientId={labResult?.patientId}
        currentStatus={patient?.status || []}
        patientName={patientName}
        onSuccess={() => navigate("/dashboard/laboratory")}
      />

      <AttachmentViewerModal
        isOpen={isAttachmentViewerOpen}
        onClose={() => setIsAttachmentViewerOpen(false)}
        attachments={attachedFiles}
        initialIndex={currentFileIndex}
        title="Lab Result Attachments"
      />
    </div>
  );
};

export default ViewLabResult;
