import React, { useEffect, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import { getOpdPatientById } from "@/services/api/opdPatientAPI";
import { usersAPI } from "@/services/api/usersAPI";
import toast from "react-hot-toast";
import { FaSearch, FaEye, FaDownload, FaTimes } from "react-icons/fa";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

// ✅ Convert any file.data format → base64 data URL (safe for img src + print)
const toDataUrl = (file) => {
  if (!file?.data) return null;

  if (typeof file.data === "string") {
    return file.data.startsWith("data:") || file.data.startsWith("http")
      ? file.data
      : `data:${file.mimetype};base64,${file.data}`;
  }

  if (file.data instanceof Uint8Array || file.data instanceof ArrayBuffer) {
    const arr = file.data instanceof ArrayBuffer ? new Uint8Array(file.data) : file.data;
    const binary = Array.from(arr).map((b) => String.fromCharCode(b)).join("");
    return `data:${file.mimetype};base64,${btoa(binary)}`;
  }

  // ✅ Backend Buffer object: { type: 'Buffer', data: [...] }
  if (file.data?.type === "Buffer" && Array.isArray(file.data.data)) {
    const binary = file.data.data.map((b) => String.fromCharCode(b)).join("");
    return `data:${file.mimetype};base64,${btoa(binary)}`;
  }

  return null;
};

// ✅ Trigger browser download from a data URL
const downloadFile = (file, index) => {
  const url = toDataUrl(file);
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name || file.filename || `scan-${index + 1}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

const SonographerScanHistory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  // previewFiles = array of file objects (with .data, .mimetype, .name)
  const [previewFiles, setPreviewFiles] = useState([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [sonographerNameById, setSonographerNameById] = useState({});

  // Helper: Normalize API response
  const normalizeUserResponse = (response) => {
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;
    return response;
  };

  // Helper: Get sonographer display name
  const getSonographerDisplayName = (sonographer) => {
    if (!sonographer) return '';
    if (typeof sonographer === 'string') return sonographer;
    if (sonographer.fullName) return sonographer.fullName;
    if (sonographer.firstName || sonographer.lastName) {
      return `${sonographer.firstName || ''} ${sonographer.lastName || ''}`.trim();
    }
    return '';
  };

  // Helper: Get sonographer ID from result
  const getSonographerId = (result) => {
    if (!result) return null;
    if (result.sonographerId) return result.sonographerId;
    if (result.sonographer?.id) return result.sonographer.id;
    if (result.sonographer?._id) return result.sonographer._id;
    return null;
  };

  // Helper: Get sonographer name from result
  const getSonographerName = (result) => {
    if (!result) return 'Unknown Sonographer';
    if (result.sonographerName) return result.sonographerName;
    if (result.sonographer && typeof result.sonographer === 'object') {
      return getSonographerDisplayName(result.sonographer) || 'Unknown Sonographer';
    }
    const sonoId = getSonographerId(result);
    if (sonoId && sonographerNameById[sonoId]) {
      return sonographerNameById[sonoId];
    }
    return 'Unknown Sonographer';
  };

  useEffect(() => {
    let mounted = true;

    const fetchScanHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLabResults();
        const allResults = Array.isArray(res?.data) ? res.data : [];

        // Only results with real file objects (not empty attachments)
        const scanOnly = allResults.filter(
          (r) => r.attachedFiles && r.attachedFiles.some((f) => f?.data || f?.name)
        );

        const enriched = await Promise.all(
          scanOnly.map(async (result) => {
            let patientData = null;
            let patientType = "regular";
            let displayId = null;
            let hospitalId = null;

            try {
              if (result.dependantId) {
                patientType = "dependant";
                displayId = result.dependantId;

                try {
                  const depRes = await getDependantById(result.dependantId);
                  const dep =
                    depRes?.data?.data?.dependant ||
                    depRes?.data?.dependant ||
                    depRes?.dependant;

                  if (dep) {
                    const fullName =
                      `${dep.firstName || ""} ${dep.lastName || ""}`.trim() ||
                      dep.fullName ||
                      dep.name;

                    // ✅ For dependants, fetch parent patient to get hospitalId
                    const parentPatientId = dep.patientId || result.patientId;
                    if (parentPatientId) {
                      try {
                        const parentRes = await getPatientById(parentPatientId);
                        const parent = parentRes?.data || parentRes;
                        hospitalId = parent?.hospitalId || null;
                      } catch { /* silent */ }
                    }

                    patientData = { fullName, id: dep.id || dep._id, hospitalId };
                  }
                } catch (err) {
                  console.warn("Failed to load dependant:", err);
                }
              } else if (result.opdPatientId) {
                patientType = "opd";
                displayId = result.opdPatientId;

                try {
                  const opdRes = await getOpdPatientById(result.opdPatientId);
                  const opd = opdRes?.data || opdRes;
                  if (opd) {
                    patientData = {
                      fullName:
                        opd.fullName ||
                        `${opd.firstName || ""} ${opd.lastName || ""}`.trim(),
                      id: opd.id || opd._id,
                      hospitalId: null, // OPD patients have no hospitalId
                    };
                  }
                } catch (err) {
                  console.warn("Failed to load OPD patient:", err);
                }
              } else if (result.patientId) {
                patientType = "regular";
                displayId = result.patientId;

                try {
                  const patRes = await getPatientById(result.patientId);
                  const pat = Array.isArray(patRes) ? patRes[0] : patRes?.data || patRes;
                  if (pat) {
                    hospitalId = pat.hospitalId || null;
                    patientData = {
                      fullName:
                        pat.fullName ||
                        `${pat.firstName || ""} ${pat.lastName || ""}`.trim(),
                      id: pat.id || pat._id,
                      hospitalId,
                    };
                  }
                } catch (err) {
                  console.warn("Failed to load patient:", err);
                }
              }

              return {
                ...result,
                patientData: patientData || { fullName: "Unknown Patient", id: displayId, hospitalId: null },
                patientType,
                displayId: displayId || "—",
              };
            } catch (err) {
              console.warn("Error enriching scan result:", err);
              return {
                ...result,
                patientData: { fullName: "Unknown Patient", id: displayId, hospitalId: null },
                patientType: "unknown",
                displayId: displayId || "—",
              };
            }
          })
        );

        if (mounted) setScanResults(enriched);
      } catch (err) {
        console.error("SonographerScanHistory: fetch error", err);
        if (mounted) {
          setError(err);
          toast.error("Failed to load scan history.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchScanHistory();
    return () => { mounted = false; };
  }, []);

  const filteredResults = scanResults.filter((result) => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return true;
    const name = result.patientData?.fullName?.toLowerCase() || "";
    const id = String(result.displayId || "").toLowerCase();
    const hid = String(result.patientData?.hospitalId || "").toLowerCase();
    return name.includes(query) || id.includes(query) || hid.includes(query);
  });

  // Load sonographer names when scan results change
  useEffect(() => {
    const loadSonographerNames = async () => {
      if (!Array.isArray(scanResults) || scanResults.length === 0) return;

      const sonoIds = new Set();
      scanResults.forEach((result) => {
        const sonoId = getSonographerId(result);
        if (sonoId && !sonographerNameById[sonoId]) {
          sonoIds.add(sonoId);
        }
      });

      if (sonoIds.size === 0) return;

      try {
        const responses = await Promise.allSettled(
          Array.from(sonoIds).map((id) => usersAPI.getUserById(id))
        );

        const newSonoNames = {};
        responses.forEach((result, index) => {
          const sonoId = Array.from(sonoIds)[index];
          if (result.status === 'fulfilled') {
            const userData = normalizeUserResponse(result.value);
            newSonoNames[sonoId] = getSonographerDisplayName(userData) || 'Unknown Sonographer';
          } else {
            newSonoNames[sonoId] = 'Unknown Sonographer';
          }
        });

        setSonographerNameById((prev) => ({ ...prev, ...newSonoNames }));
      } catch (e) {
        console.error('Error loading sonographer names:', e);
      }
    };

    loadSonographerNames();
  }, [scanResults, sonographerNameById]);

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleViewScan = (result) => {
    const files = (result.attachedFiles || []).filter((f) => f?.data || f?.name);
    setPreviewFiles(files);
    setPreviewIndex(0);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewFiles([]);
    setPreviewIndex(0);
  };

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
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
                  <FaEye className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-base-content">Scan History</h1>
                  <p className="text-base-content/70">View previously uploaded ultrasound scans.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-4">
                <div>
                  <h2 className="card-title">Uploaded Scans</h2>
                  <p className="text-sm text-base-content/70">Review and download previous scan uploads.</p>
                </div>
                <div className="w-full md:w-auto">
                  <div className="flex items-center gap-2 w-full">
                    <span className="bg-base-200 px-3 py-2 rounded-l-lg">
                      <FaSearch className="w-4 h-4 text-base-content/60" />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by patient name or ID"
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="input input-bordered w-full rounded-r-lg"
                    />
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="grid gap-4">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-32 rounded-3xl bg-base-200 animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-error">Unable to load scan history. Please refresh the page.</div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-10 text-base-content/70">
                  <p>No scan history found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredResults.map((result) => {
                    const patientName = result.patientData?.fullName || "Unknown Patient";
                    // ✅ Show hospitalId for regular/dependant, raw id for OPD
                    const displayPatientId =
                      result.patientType === "opd"
                        ? result.displayId
                        : result.patientData?.hospitalId || result.displayId || "—";
                    const uploadDate = result.createdAt
                      ? formatNigeriaDateTime(result.createdAt)
                      : "—";
                    const files = (result.attachedFiles || []).filter(
                      (f) => f?.data || f?.name
                    );
                    const fileCount = files.length;

                    return (
                      <div
                        key={result._id}
                        className="rounded-3xl border border-base-200 bg-base-100 p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-base-content truncate">
                                {patientName}
                              </p>
                              {result.patientType === "dependant" && (
                                <span className="badge badge-secondary badge-xs">Dependant</span>
                              )}
                              {result.patientType === "opd" && (
                                <span className="badge badge-info badge-xs">OPD</span>
                              )}
                            </div>
                            <p className="text-sm text-base-content/70">{displayPatientId}</p>
                            <p className="text-sm text-base-content/70">Uploaded: {uploadDate}</p>
                            <p className="text-sm text-base-content/70">Sonographer: {getSonographerName(result)}</p>
                            <p className="text-sm text-base-content/70">{fileCount} file(s)</p>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleViewScan(result)}
                              className="btn btn-outline btn-sm gap-2"
                            >
                              <FaEye className="w-4 h-4" />
                              View
                            </button>

                            {fileCount === 1 && (
                              <button
                                type="button"
                                onClick={() => downloadFile(files[0], 0)}
                                className="btn btn-primary btn-sm gap-2"
                              >
                                <FaDownload className="w-4 h-4" />
                                Download
                              </button>
                            )}

                            {fileCount > 1 && (
                              <div className="dropdown dropdown-end">
                                <button className="btn btn-primary btn-sm gap-2">
                                  <FaDownload className="w-4 h-4" />
                                  Download ({fileCount})
                                </button>
                                <ul className="dropdown-content menu bg-base-100 rounded-box w-52 p-2 shadow border border-base-200">
                                  {files.map((file, idx) => (
                                    <li key={idx}>
                                      <a onClick={() => downloadFile(file, idx)}>
                                        {file.name || file.filename || `File ${idx + 1}`}
                                      </a>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Image Preview Modal — uses base64 data URLs, no API calls */}
      {showPreview && previewFiles.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="bg-base-100 rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="p-4 border-b border-base-200 flex items-center justify-between sticky top-0 bg-base-100">
              <h3 className="text-lg font-semibold">
                {previewFiles[previewIndex]?.name ||
                  previewFiles[previewIndex]?.filename ||
                  `File ${previewIndex + 1}`}{" "}
                <span className="text-sm font-normal text-base-content/60">
                  ({previewIndex + 1} of {previewFiles.length})
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadFile(previewFiles[previewIndex], previewIndex)}
                  className="btn btn-ghost btn-sm gap-1"
                  title="Download current file"
                >
                  <FaDownload className="w-4 h-4" />
                </button>
                <button onClick={closePreview} className="btn btn-ghost btn-sm btn-circle">
                  <FaTimes className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 flex justify-center items-center min-h-[300px]">
              {(() => {
                const file = previewFiles[previewIndex];
                const isImage =
                  /^image\//i.test(file?.mimetype || "") ||
                  /\.(jpg|jpeg|png|gif|webp)$/i.test(file?.name || file?.filename || "");
                const url = toDataUrl(file);

                if (isImage && url) {
                  return (
                    <img
                      src={url}
                      alt={file.name || `Scan ${previewIndex + 1}`}
                      className="max-w-full h-auto rounded"
                    />
                  );
                }

                // Non-image file fallback
                return (
                  <div className="flex flex-col items-center gap-4 text-base-content/60">
                    <FaDownload className="w-12 h-12" />
                    <p className="text-lg font-medium">
                      {file?.name || file?.filename || "File"}
                    </p>
                    <p className="text-sm">{file?.mimetype || "Unknown type"}</p>
                    <button
                      onClick={() => downloadFile(file, previewIndex)}
                      className="btn btn-primary btn-sm gap-2"
                    >
                      <FaDownload className="w-4 h-4" /> Download to view
                    </button>
                  </div>
                );
              })()}
            </div>

            {previewFiles.length > 1 && (
              <div className="p-4 border-t border-base-200 flex gap-2 justify-center">
                <button
                  onClick={() => setPreviewIndex((i) => Math.max(0, i - 1))}
                  disabled={previewIndex === 0}
                  className="btn btn-sm btn-outline"
                >
                  Previous
                </button>
                <button
                  onClick={() =>
                    setPreviewIndex((i) => Math.min(previewFiles.length - 1, i + 1))
                  }
                  disabled={previewIndex === previewFiles.length - 1}
                  className="btn btn-sm btn-outline"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SonographerScanHistory;