import React, { useEffect, useState } from "react";
import { Header } from "@/components/common";
import Sidebar from "@/components/sonographer/dashboard/Sidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import toast from "react-hot-toast";
import { FaSearch, FaEye, FaDownload } from "react-icons/fa";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const SonographerScanHistory = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanResults, setScanResults] = useState([]);
  const [error, setError] = useState(null);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchScanHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getLabResults();
        const allResults = Array.isArray(res?.data) ? res.data : [];

        // Filter for results with attachments (scans uploaded by sonographers)
        const scanResults = allResults.filter(result => 
          result.attachedFiles && result.attachedFiles.length > 0
        );

        if (mounted) setScanResults(scanResults);
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
    return () => {
      mounted = false;
    };
  }, []);

  const filteredResults = scanResults.filter(result => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return true;
    const patientName = result.patientName || result.patient?.fullName || 
                       `${result.patient?.firstName || ""} ${result.patient?.lastName || ""}`.trim().toLowerCase();
    const id = String(result.patientId || result.patient?._id || "").toLowerCase();
    return patientName.includes(query) || id.includes(query);
  });

  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);

  const handleViewScan = (result) => {
    // Navigate to view lab result or attachment viewer
    console.log("View scan for result:", result);
    // For now, just log; can implement navigation to ViewLabResult
  };

  const handleDownloadScan = (fileId) => {
    // Download the file
    window.open(`/api/v1/labResult/file/${fileId}`, '_blank');
  };

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
                    const patientName = result.patientName || result.patient?.fullName || 
                                       `${result.patient?.firstName || ""} ${result.patient?.lastName || ""}`.trim() || "Unknown Patient";
                    const patientId = result.patientId || result.patient?._id || "—";
                    const uploadDate = result.createdAt ? formatNigeriaDateTime(result.createdAt) : "—";
                    const fileCount = result.attachedFiles?.length || 0;

                    return (
                      <div key={result._id} className="rounded-3xl border border-base-200 bg-base-100 p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="font-semibold text-base-content truncate">{patientName}</p>
                            <p className="text-sm text-base-content/70">{patientId}</p>
                            <p className="text-sm text-base-content/70">Uploaded: {uploadDate}</p>
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
                            {result.attachedFiles?.map((fileId, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleDownloadScan(fileId)}
                                className="btn btn-primary btn-sm gap-2"
                              >
                                <FaDownload className="w-4 h-4" />
                                Download
                              </button>
                            ))}
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
    </div>
  );
};

export default SonographerScanHistory;
