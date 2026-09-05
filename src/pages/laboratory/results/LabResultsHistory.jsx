import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, HmoStatusBadge } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import toast from "react-hot-toast";
import { FiSearch, FiEye, FiRefreshCw } from "react-icons/fi";
import { FaFlask } from "react-icons/fa";

const extractPatientInfo = (result) => {
  if (result.dependant) {
    const name = `${result.dependant.firstName || ""} ${result.dependant.lastName || ""}`.trim() || result.dependant.fullName || result.dependant.name || "Dependant";
    return { name, type: "Dependant" };
  }
  if (result.opdPatient) {
    const name = result.opdPatient.fullName || `${result.opdPatient.firstName || ""} ${result.opdPatient.lastName || ""}`.trim() || "OPD Patient";
    return { name, type: "OPD Patient" };
  }
  if (result.patient) {
    const name = `${result.patient.firstName || ""} ${result.patient.lastName || ""}`.trim() || result.patient.name || "Patient";
    return { name, type: "Patient" };
  }
  return { name: "Unknown Patient", type: "Patient" };
};

const extractTechnicianName = (result) => {
  if (result.labTechnicianName) return result.labTechnicianName;
  if (result.technician) {
    if (typeof result.technician === "string") return result.technician;
    if (result.technician.fullName) return result.technician.fullName;
    const combined = `${result.technician.firstName || ""} ${result.technician.lastName || ""}`.trim();
    if (combined) return combined;
  }
  return "Technician";
};

const getTestName = (result) => {
  if (Array.isArray(result.tests) && result.tests.length > 0) {
    return result.tests.map((t) => t.name || t.code || t).join(", ");
  }
  if (Array.isArray(result.result) && result.result.length > 0) {
    return result.result[0]?.code || result.result[0]?.value || "Lab Test";
  }
  return result.form?.clinicalDiagnosis || "Lab Test";
};

const getDisplayPatientId = (result) => {
  const patientSource = result?.patient || result?.dependant?.patient || result?.opdPatient || {};
  const hospitalId = patientSource.hospitalId || result?.hospitalId || result?.patientId || result?.opdPatientId || result?._id || result?.id;
  return hospitalId || "N/A";
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const LabResultsHistory = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allLabResults, setAllLabResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  const fetchLabResults = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getLabResults();
      const results = Array.isArray(response)
        ? response
        : response?.data || response?.data?.data || response?.results || [];
      setAllLabResults(results);
      setError(null);
    } catch (err) {
      console.error("Error fetching lab results:", err);
      setError("Failed to load lab results history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLabResults();
  }, [fetchLabResults]);

  // Synchronous filter in memory (no N+1 network requests)
  const filteredLabResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    const baseList = Array.isArray(allLabResults) ? allLabResults : [];

    return !query
      ? baseList
      : baseList.filter((result) => {
          const patientInfo = extractPatientInfo(result);
          const patientName = patientInfo.name.toLowerCase();
          const testName = getTestName(result).toLowerCase();
          const techName = extractTechnicianName(result).toLowerCase();
          const hospitalId = String(getDisplayPatientId(result)).toLowerCase();

          return (
            patientName.includes(query) ||
            testName.includes(query) ||
            techName.includes(query) ||
            hospitalId.includes(query)
          );
        });
  }, [allLabResults, search]);

  const totalResults = filteredLabResults.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));
  const paginatedLabResults = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredLabResults.slice(start, start + resultsPerPage);
  }, [currentPage, filteredLabResults]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const SidebarDrawer = () => (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 lg:z-auto ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <LaboratorySidebar onCloseSidebar={() => setSidebarOpen(false)} />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-base-200">
      <SidebarDrawer />

      <div className="flex overflow-hidden flex-col flex-1 min-w-0">
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <FaFlask className="w-7 h-7 text-emerald-600" />
                Lab Results History
              </h1>
              <p className="text-sm text-base-content/70 mt-1">
                View, search, and verify all recorded laboratory test reports
              </p>
            </div>
            <button
              onClick={fetchLabResults}
              className="btn btn-sm btn-ghost gap-2 border border-base-300 self-start sm:self-auto"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm">
              <span>{error}</span>
            </div>
          )}

          {/* Search bar */}
          <div className="bg-base-100 p-4 rounded-xl border border-base-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:w-96">
              <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search by patient name, ID, test type, or technician..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-sm input-bordered w-full pl-9 bg-base-200/50 focus:bg-base-100"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
                >
                  ✕
                </button>
              )}
            </div>
            <span className="text-xs text-base-content/60 self-end sm:self-auto">
              Total Reports: <strong className="text-base-content">{allLabResults.length}</strong>
            </span>
          </div>

          {/* Table / Cards */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-base-100 p-5 rounded-xl border border-base-300 animate-pulse h-16"></div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden lg:block bg-base-100 rounded-xl border border-base-300/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead className="bg-emerald-800 text-white font-semibold">
                      <tr>
                        <th>Patient Name</th>
                        <th>Type</th>
                        <th>HMO Status</th>
                        <th>Test Type</th>
                        <th>Technician</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedLabResults.map((result) => {
                        const resId = result._id || result.id;
                        const patientInfo = extractPatientInfo(result);
                        const techName = extractTechnicianName(result);
                        const testName = getTestName(result);

                        return (
                          <tr key={resId} className="hover:bg-base-200/50">
                            <td>
                              <div className="font-semibold text-sm text-base-content">
                                {patientInfo.name}
                              </div>
                              <div className="text-xs text-base-content/50 font-mono">
                                ID: {getDisplayPatientId(result)}
                              </div>
                            </td>
                            <td>
                              <span
                                className={`badge badge-sm font-medium ${
                                  patientInfo.type === "Dependant"
                                    ? "badge-secondary"
                                    : patientInfo.type === "OPD Patient"
                                    ? "badge-info"
                                    : "badge-ghost"
                                }`}
                              >
                                {patientInfo.type}
                              </span>
                            </td>
                            <td>
                              <HmoStatusBadge status={result.hmoStatus} size="sm" />
                            </td>
                            <td className="text-sm font-medium max-w-xs truncate">
                              {testName}
                            </td>
                            <td className="text-sm text-base-content/70">
                              {techName}
                            </td>
                            <td>
                              <span className="badge badge-success badge-sm font-medium">
                                {result.status || "Completed"}
                              </span>
                            </td>
                            <td className="text-xs text-base-content/70">
                              {formatDate(result.completedAt || result.createdAt)}
                            </td>
                            <td className="text-right">
                              <button
                                onClick={() => navigate(`/dashboard/laboratory/results/${resId}`)}
                                className="btn btn-xs btn-outline btn-primary gap-1"
                              >
                                <FiEye className="w-3.5 h-3.5" />
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile / Tablet Cards */}
              <div className="flex flex-col gap-3 lg:hidden">
                {paginatedLabResults.map((result) => {
                  const resId = result._id || result.id;
                  const patientInfo = extractPatientInfo(result);
                  const techName = extractTechnicianName(result);
                  const testName = getTestName(result);

                  return (
                    <div
                      key={resId}
                      className="bg-base-100 rounded-xl border border-base-300 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-base text-base-content">{patientInfo.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge badge-xs badge-outline">{patientInfo.type}</span>
                            <HmoStatusBadge status={result.hmoStatus} size="sm" />
                          </div>
                        </div>
                        <span className="badge badge-success badge-sm shrink-0">
                          {result.status || "Completed"}
                        </span>
                      </div>

                      <div className="text-xs text-base-content/70 space-y-1 bg-base-200/50 p-2.5 rounded-lg">
                        <div><span className="font-semibold">Test:</span> {testName}</div>
                        <div><span className="font-semibold">Technician:</span> {techName}</div>
                        <div><span className="font-semibold">Date:</span> {formatDate(result.completedAt || result.createdAt)}</div>
                      </div>

                      <button
                        onClick={() => navigate(`/dashboard/laboratory/results/${resId}`)}
                        className="btn btn-sm btn-primary text-white w-full gap-1.5"
                      >
                        <FiEye className="w-4 h-4" />
                        View Full Result
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-base-content/60">
                    Showing {(currentPage - 1) * resultsPerPage + 1} to{" "}
                    {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="btn btn-sm btn-ghost border border-base-300 disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <span className="text-xs px-2 font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="btn btn-sm btn-ghost border border-base-300 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {paginatedLabResults.length === 0 && (
                <div className="text-center py-16 bg-base-100 rounded-xl border border-dashed border-base-300">
                  <FaFlask className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <h3 className="font-bold text-lg text-base-content">No lab results found</h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    {search ? "No reports match your current search query." : "No laboratory results have been recorded yet."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabResultsHistory;