import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import KolakLoader from "@/components/common/KolakLoader";
import { getLabResultById, getLabResultFile } from "@/services/api/labResultsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import SendLabResultsModal from "@/components/modals/SendLabResultsModal";
import AttachmentViewerModal from "@/components/modals/AttachmentViewerModal";
import { FaFileImage, FaFileWord } from "react-icons/fa";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import { usersAPI } from "@/services/api/usersAPI";

const HMOLabResultDetails = () => {
  const { labResultId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [labResult, setLabResult] = useState(null);
  const [patient, setPatient] = useState(null);
  const [dependant, setDependant] = useState(null);
  const [investigationIdState, setInvestigationIdState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [isAttachmentViewerOpen, setIsAttachmentViewerOpen] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [labTechnician, setLabTechnician] = useState(null);

  const effectiveInvestigationId = labResult?.investigationRequestId;
  const toggleSidebar = () => setIsSidebarOpen((value) => !value);
  const closeSidebar = () => setIsSidebarOpen(false);

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

        // Fetch dependant if this lab result is for a dependant
        if (labData?.dependantId) {
          try {
            const depRes = await getDependantById(labData.dependantId);
            const depData = depRes?.data?.data?.dependant ?? depRes?.dependant ?? depRes;
            setDependant(depData);
          } catch (err) {
            console.error("Error fetching dependant:", err);
            setDependant(null);
          }
        }

                // Fetch lab technician if present
        if (labData?.labTechnicianId) {
          try {
            const techRes = await usersAPI.getUserById(labData.labTechnicianId);
            const techData = techRes?.data?.data ?? techRes?.data ?? techRes;
            setLabTechnician(techData);
          } catch (err) {
            console.error("Error fetching lab technician:", err);
            setLabTechnician(null);
          }
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

  const handleDownload = (file) => {
    if (!file.data) return;

    let blob;
    if (file.data instanceof Uint8Array) {
      blob = new Blob([file.data], { type: file.mimetype });
    } else if (file.data.type === 'Buffer' && Array.isArray(file.data.data)) {
      // Handle Buffer object from backend
      const uint8Array = new Uint8Array(file.data.data);
      blob = new Blob([uint8Array], { type: file.mimetype });
    } else if (typeof file.data === "string" && file.data.startsWith("data:")) {
      // If already a data URL
      const a = document.createElement("a");
      a.href = file.data;
      a.download = file.filename || "file";
      document.body.appendChild(a);
      a.click();
      a.remove();
      return;
    } else {
      console.warn("Unsupported file format for download", file);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.filename || "file";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-200">
        <div className="font-semibold text-[#00943C]">{label}</div>
        <div className="sm:col-span-2 text-gray-700 whitespace-normal break-words">{value}</div>
      </div>
    );
  };

  const displaySection = (title, data) => {
    if (!data || Object.values(data).every((v) => !v)) return null;

    return (
      <div className="mb-6">
        <h3 className="text-base sm:text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
          {title}
        </h3>
        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
          {Object.entries(data).map(([key, value]) => {
            if (!value) return null;
            if (typeof value === "object") return null;
            return (
              <div key={key} className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-4 py-2 border-b border-gray-200 last:border-b-0">
                <div className="font-semibold text-gray-700 break-words">{key}</div>
                <div className="sm:col-span-2 text-gray-600 break-words">
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
        <h3 className="text-base sm:text-lg font-bold text-[#00943C] mb-4 pb-2 border-b-2 border-[#00943C] flex items-center gap-2">
          <FaFileImage className="w-5 h-5 shrink-0" /> Attachments ({atts.length})
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

              const getImageUrl = (file) => {
                if (!file?.data) return '';

                if (typeof file.data === 'string') {
                  return file.data.startsWith('data:') || file.data.startsWith('http')
                    ? file.data
                    : `data:${file.mimetype};base64,${file.data}`;
                }

                if (file.data instanceof Uint8Array) {
                  const binary = Array.from(file.data).map(b => String.fromCharCode(b)).join('');
                  return `data:${file.mimetype};base64,${btoa(binary)}`;
                }

                if (file.data?.type === 'Buffer' && Array.isArray(file.data.data)) {
                  const binary = file.data.data.map(b => String.fromCharCode(b)).join('');
                  return `data:${file.mimetype};base64,${btoa(binary)}`;
                }

                return '';
              };

              const handleFileDownload = (file) => {
                const url = getImageUrl(file);
                if (!url) return;
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name || file.filename || 'file';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
              };

              return (
                <div
                  key={idx}
                  onClick={() => {
                    setCurrentFileIndex(idx);
                    setIsAttachmentViewerOpen(true);
                  }}
                  className="relative group rounded-lg overflow-hidden border border-gray-300 hover:border-[#00943C] transition-all cursor-pointer"
                >
                  {isImage && getImageUrl(file) ? (
                    <>
                      <img
                        src={getImageUrl(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                          className="px-2 py-1 bg-white text-gray-700 text-xs font-semibold rounded"
                        >
                          Download
                        </button>
                        <span className="text-white text-sm font-semibold">View</span>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-32 bg-gray-200 flex items-center justify-center group-hover:bg-gray-300 transition-all">
                      <FaFileImage className="w-10 h-10 text-gray-400" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="text-white text-sm font-semibold">View</span>
                      </div>
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

  const SidebarDrawer = () => (
    <>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden no-print"
          onClick={closeSidebar}
        />
      )}
      <div
        className={`lab-sidebar no-print fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
    </>
  );

  if (loading) {
    return (
      <div className="flex h-screen">
        <SidebarDrawer />
        <div className="flex overflow-hidden flex-col flex-1 min-w-0">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex items-center justify-center flex-1 px-4">
            <p className="text-base lg:text-lg text-gray-600 text-center">Loading lab result...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen">
        {loading && <KolakLoader fullscreen />}
        <SidebarDrawer />
        <div className="flex overflow-hidden flex-col flex-1 min-w-0">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex flex-1 items-center justify-center px-4">
            <div className="text-center">
              <p className="text-base sm:text-lg text-red-600 mb-4">{error}</p>
              <button
                onClick={() => navigate("/dashboard/hmo")}
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

  const isDependant = !!labResult?.dependantId && !!dependant;
  const displayName = isDependant
    ? `${dependant?.firstName || ''} ${dependant?.lastName || ''}`.trim() || 'Unknown Dependant'
    : patient?.firstName && patient?.lastName
      ? `${patient.firstName} ${patient.lastName}`
      : patient?.name || "Unknown Patient";
  const personType = isDependant ? 'Dependant' : 'Patient';

  const handlePrint = () => {
    document.body.classList.add('printable-lab');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printable-lab');
    }, 250);
  };

  return (
    <div className="lab-container flex h-screen bg-base-200">
      <SidebarDrawer />

      <div className="lab-main flex overflow-hidden flex-col flex-1 min-w-0">
        <div className="no-print">
          <Header onToggleSidebar={toggleSidebar} />
        </div>

        <div className="overflow-y-auto flex-1 min-w-0">
          <section className="p-3 sm:p-4 lg:p-7 overflow-x-hidden">
                        <div className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center no-print">
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl lg:text-[32px] text-[#00943C] font-bold break-words">
                  Lab Result Details
                </h1>
                <p className="text-xs lg:text-[12px] text-[#605D66] break-words">
                  Complete laboratory test results for{' '}
                  <span className="font-semibold">{displayName}</span>
                  <span className="badge badge-sm badge-outline ml-2">{personType}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(-1)}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back
                </button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-3 sm:p-6 lg:p-8 mb-6 min-w-0">
              {/* Patient Information Header */}
              <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-4 mb-6 lg:mb-8 pb-6 lg:pb-8 border-b-2 border-gray-200">
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 uppercase font-semibold">{personType} Name</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-base sm:text-lg font-bold text-[#00943C] break-words">{displayName}</p>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Hospital ID</p>
                  <p className="text-base sm:text-lg font-bold break-words">{patient?.hospitalId || "N/A"}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Lab Technician</p>
                  <p className="text-base sm:text-lg font-bold break-words">
                    {labTechnician
                      ? `${labTechnician.firstName || ''} ${labTechnician.lastName || ''}`.trim() || labTechnician.name || "N/A"
                      : "N/A"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-600 uppercase font-semibold">Date</p>
                  <p className="text-base sm:text-lg font-bold break-words">
                    {formatNigeriaDate(labResult?.form?.createdAt || labResult?.updatedAt || "__")}
                  </p>
                </div>
              </div>

              {/* Test Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-4">
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
              {displaySection("PT  Test || Malaria Parasite", labResult?.form?.ptTest)}
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
                    <h3 className="text-base sm:text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                      Widal Report
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[480px] border-collapse">
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
                  <h3 className="text-base sm:text-lg font-bold text-[#00943C] mb-3 pb-2 border-b-2 border-[#00943C]">
                    Overall Remarks
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg text-gray-700 whitespace-pre-wrap break-words">
                    {labResult.form.remarks}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-8 pt-8 border-t-2 border-gray-200 no-print">
                <button
                  onClick={handlePrint}
                  className="w-full sm:flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-all"
                >
                  Print Results
                </button>
                <button
                  onClick={() => navigate(-1)}
                  className="w-full sm:flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all"
                >
                  Close
                </button>
              </div>
              <style>{`
                @media print {
                  body {
                    background: white !important;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }
                  .lab-container {
                    display: flex !important;
                    height: auto !important;
                  }
                  .lab-sidebar {
                    display: none !important;
                    width: 0 !important;
                  }
                  .lab-main {
                    width: 100% !important;
                    display: flex;
                    flex-direction: column;
                  }
                  .lab-main > *:first-child {
                    display: none !important;
                  }
                  .no-print {
                    display: none !important;
                  }
                  .overflow-y-auto {
                    overflow: visible !important;
                    height: auto !important;
                  }
                  section {
                    padding: 0 !important;
                    margin: 0 !important;
                  }
                  .rounded-lg {
                    border-radius: 0 !important;
                  }
                  * {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                  }

                  /* Prevent sections/rows from being split across a page break */
                  .mb-6,
                  table,
                  tr,
                  .grid {
                    break-inside: avoid;
                    page-break-inside: avoid;
                  }

                  @page {
                    margin: 12mm;
                    size: A4;
                  }
                }
              `}</style>
            </div>
          </section>
        </div>
      </div>

      {/* <SendLabResultsModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        labResultId={labResultId}
        investigationRequestId={effectiveInvestigationId}
        patientId={labResult?.patientId}
        patientName={displayName}
        onSuccess={() => navigate("/dashboard/hmo")}
      /> */}

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

export default HMOLabResultDetails;