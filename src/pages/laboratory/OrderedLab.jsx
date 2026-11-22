import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import LaboratoryLayout from "@/layouts/laboratory";
import KolakLoader from "@/components/common/KolakLoader";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import AcceptTestRequestModal from "@/pages/laboratory/incoming/modals/AcceptTestRequestModal";
import TestRequestModal from "@/pages/laboratory/incoming/modals/TestRequestModal";
import toast from "react-hot-toast";
import { updatePatientStatus } from "@/services/api/patientsAPI";
import { updateOpdPatient } from "@/services/api/opdPatientAPI";
import { FiSearch, FiSend, FiEye, FiPlay, FiRefreshCw } from "react-icons/fi";
import { FaFlask } from "react-icons/fa";

const extractPatientInfo = (inv) => {
  if (inv.dependant) {
    const name = `${inv.dependant.firstName || ""} ${inv.dependant.lastName || ""}`.trim() || inv.dependant.fullName || inv.dependant.name || "Dependant";
    return { name, type: "Dependant", hmoStatus: inv.hmoStatus };
  }
  if (inv.opdPatient) {
    const name = inv.opdPatient.fullName || `${inv.opdPatient.firstName || ""} ${inv.opdPatient.lastName || ""}`.trim() || "OPD Patient";
    return { name, type: "OPD Patient", hmoStatus: inv.hmoStatus };
  }
  if (inv.patient) {
    const name = `${inv.patient.firstName || ""} ${inv.patient.lastName || ""}`.trim() || inv.patient.name || "Patient";
    return { name, type: "Patient", hmoStatus: inv.hmoStatus };
  }
  return { name: "Unknown Patient", type: "Patient", hmoStatus: inv.hmoStatus };
};

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString();
};

const getTestNames = (inv) => {
  if (!inv.tests || !Array.isArray(inv.tests)) return inv.investigationType || "No tests specified";
  return inv.tests.map(test => test.name || test.code || test).join(", ") || inv.investigationType || "Lab Test";
};

const getDisplayPatientId = (inv) => {
  const patientSource = inv?.patient || inv?.dependant?.patient || inv?.opdPatient || {};
  const hospitalId = patientSource.hospitalId || inv?.hospitalId || inv?.patientId || inv?.id || inv?._id;
  return hospitalId || "N/A";
};

const getStatusBadge = (status) => {
  switch (status?.toLowerCase()) {
    case "completed":
      return "badge-success";
    case "in_progress":
    case "processing":
      return "badge-info";
    case "awaiting_lab":
      return "badge-warning";
    default:
      return "badge-ghost";
  }
};

const isDateInPeriod = (dateVal, period, customStart, customEnd) => {
  if (period === "all") return true;
  if (!dateVal) return false;

  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  if (period === "today") {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === "week") {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (period === "month") {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === "custom") {
    if (!customStart && !customEnd) return true;
    const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date(8640000000000000);
    return d >= start && d <= end;
  }

  return true;
};

const OrderedLab = () => {
  const navigate = useNavigate();
  const [allInvestigations, setAllInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [activeStatusFilter, setActiveStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;
  const [existingLabResults, setExistingLabResults] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [showModal2, setShowModal2] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [sendingToDoctor, setSendingToDoctor] = useState(null);

  const [hasLoaded, setHasLoaded] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent && !hasLoaded) setLoading(true);
      const [invRes, labRes] = await Promise.all([
        getInvestigations({ type: 'lab', limit: 100 }).catch(() => getInvestigations({ limit: 100 }).catch(() => [])),
        getLabResults({ limit: 100 }).catch(() => []),
      ]);

      const investigationsData = Array.isArray(invRes)
        ? invRes
        : invRes?.data || invRes?.data?.data || invRes?.results || [];

      // Filter tests for payment/HMO visibility
      const paidInvestigations = investigationsData.map(inv => {
        if (!inv.tests) return inv;
        const validTests = inv.tests.filter(test => test.paymentStatus === 'paid' || test.hmoStatus === 'approved' || inv.hmoStatus === 'approved');
        return { ...inv, tests: validTests };
      }).filter(inv => inv.tests && inv.tests.length > 0);

      setAllInvestigations(paidInvestigations);

      const labList = Array.isArray(labRes?.data) ? labRes.data
        : Array.isArray(labRes) ? labRes : [];

      const labMap = {};
      labList.forEach(lr => {
        const invId = lr.investigationRequestId || lr.investigationId;
        if (invId) labMap[invId] = lr._id || lr.id;
      });
      setExistingLabResults(labMap);
      setError(null);
      setHasLoaded(true);
    } catch (err) {
      console.error("Error loading ordered lab data:", err);
      if (!silent) setError("Failed to load ordered lab requests");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [hasLoaded]);

  const fetchInvestigations = loadData;

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const handleFocus = () => {
      if (document.visibilityState === 'visible') loadData(true);
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [loadData]);

  const handleSendToDoctor = async (inv) => {
    const invId = inv._id || inv.id;
    try {
      setSendingToDoctor(invId);
      if (inv.opdPatientId) {
        await updateOpdPatient(inv.opdPatientId, { status: "lab_completed" });
      } else if (inv.patientId) {
        await updatePatientStatus(inv.patientId, "lab_completed");
      }
      toast.success("Patient status updated to lab completed!");
      await fetchInvestigations(true);
    } catch (err) {
      console.error("Error sending to doctor:", err);
      toast.error(err?.response?.data?.message || "Failed to update patient status");
    } finally {
      setSendingToDoctor(null);
    }
  };

  const handleAcceptFromDetails = (cardData) => {
    setSelectedCard(cardData);
    setShowModal(true);
  };

  const handleProcess = (inv) => {
    if (inv.dependantId) {
      navigate(`/dashboard/laboratory/results/add/${inv._id}?dependantId=${inv.dependantId}&patientId=${inv.patientId}`);
    } else if (inv.opdPatientId) {
      navigate(`/dashboard/laboratory/results/add-opd?opdPatientId=${inv.opdPatientId}&investigationId=${inv._id}`);
    } else {
      navigate(`/dashboard/laboratory/results/add/${inv._id}?patientId=${inv.patientId}`);
    }
  };

  // Filtered investigations in memory
  const filteredInvestigations = useMemo(() => {
    const query = search.trim().toLowerCase();
    const baseList = Array.isArray(allInvestigations) ? allInvestigations : [];

    return baseList.filter((inv) => {
      // Period filter
      if (!isDateInPeriod(inv.createdAt, periodFilter, customStartDate, customEndDate)) {
        return false;
      }

      // Status filter
      if (activeStatusFilter === "pending" && (inv.status === "completed" || inv.status === "processing")) return false;
      if (activeStatusFilter === "processing" && inv.status !== "processing" && inv.status !== "in_progress") return false;
      if (activeStatusFilter === "completed" && inv.status !== "completed") return false;
      if (activeStatusFilter === "hmo" && inv.hmoStatus !== "approved" && inv.hmoStatus !== "partial") return false;

      // Text search
      if (query) {
        const info = extractPatientInfo(inv);
        const patientName = info.name.toLowerCase();
        const testNames = getTestNames(inv).toLowerCase();
        const status = String(inv.status || "").toLowerCase();
        const hospitalId = String(getDisplayPatientId(inv)).toLowerCase();
        return patientName.includes(query) || testNames.includes(query) || status.includes(query) || hospitalId.includes(query);
      }

      return true;
    });
  }, [allInvestigations, search, activeStatusFilter, periodFilter, customStartDate, customEndDate]);

  const paginatedInvestigations = useMemo(() => {
    const start = (currentPage - 1) * resultsPerPage;
    return filteredInvestigations.slice(start, start + resultsPerPage);
  }, [currentPage, filteredInvestigations]);

  const totalResults = filteredInvestigations.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / resultsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  if (loading && !allInvestigations.length) {
    return (
      <LaboratoryLayout>
        <KolakLoader fullscreen text="Loading ordered lab investigations..." />
      </LaboratoryLayout>
    );
  }

  return (
    <LaboratoryLayout>
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
              <FaFlask className="w-7 h-7 text-emerald-600" />
              Ordered Lab Investigations
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              View, process, and track all doctor-ordered laboratory tests
            </p>
          </div>
          <button
            onClick={() => fetchInvestigations()}
            className="btn btn-sm btn-ghost gap-2 border border-base-300 self-start sm:self-auto"
          >
            <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {error && (
          <div className="alert alert-error shadow-sm">
            <span>{error}</span>
          </div>
        )}

          {/* Filters and Search */}
          <div className="bg-base-100 p-4 rounded-xl border border-base-300/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: `All (${allInvestigations.length})` },
                  { id: "pending", label: "Pending" },
                  { id: "processing", label: "In Progress" },
                  { id: "completed", label: "Completed" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveStatusFilter(tab.id);
                      setCurrentPage(1);
                    }}
                    className={`btn btn-xs sm:btn-sm rounded-lg transition-all ${
                      activeStatusFilter === tab.id
                        ? "btn-primary text-white"
                        : "btn-ghost text-base-content/70 hover:bg-base-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-80">
                <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search patient, test, or ID..."
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
            </div>

            {/* Period Filter Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-base-200 text-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-semibold text-base-content/60 mr-1">Period:</span>
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "week", label: "This Week" },
                  { id: "month", label: "This Month" },
                  { id: "custom", label: "Custom Range" },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setPeriodFilter(p.id);
                      setCurrentPage(1);
                    }}
                    className={`btn btn-xs rounded-full px-3 ${
                      periodFilter === p.id
                        ? "btn-neutral text-white font-bold"
                        : "btn-ghost text-base-content/70"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="text-base-content/60 font-medium">
                Showing <strong className="text-primary">{filteredInvestigations.length}</strong> of {allInvestigations.length} requests
              </div>
            </div>

            {/* Custom Range Date Pickers */}
            {periodFilter === "custom" && (
              <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => {
                      setCustomStartDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input input-bordered input-xs rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-base-content/60">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => {
                      setCustomEndDate(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="input input-bordered input-xs rounded-lg"
                  />
                </div>
                {(customStartDate || customEndDate) && (
                  <button
                    onClick={() => {
                      setCustomStartDate("");
                      setCustomEndDate("");
                    }}
                    className="btn btn-ghost btn-xs text-error"
                  >
                    Clear Dates
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Table / Cards */}
          {loading ? (
            <div className="py-12 flex justify-center">
              <KolakLoader text="Loading investigations..." />
            </div>
          ) : (
            <>
              {/* Desktop View: Table */}
              <div className="hidden lg:block bg-base-100 rounded-xl border border-base-300/80 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
                  <table className="table table-zebra w-full">
                    <thead className="bg-emerald-800 text-white font-semibold sticky top-0 z-10">
                      <tr>
                        <th>Patient Name</th>
                        <th>Type</th>
                        <th>Test Names</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedInvestigations.map((inv) => {
                        const invId = inv._id || inv.id;
                        const patientInfo = extractPatientInfo(inv);
                        const hasExistingLabResult = existingLabResults[invId];
                        const isSending = sendingToDoctor === invId;

                        return (
                          <tr key={invId} className="hover:bg-base-200/50">
                            <td>
                              <div className="font-semibold text-sm text-base-content">
                                {patientInfo.name}
                              </div>
                              <div className="text-xs text-base-content/50 font-mono">
                                ID: {getDisplayPatientId(inv)}
                              </div>
                            </td>
                            <td>
                              <span className={`badge badge-sm font-medium ${
                                patientInfo.type === "Dependant" ? "badge-secondary" :
                                patientInfo.type === "OPD Patient" ? "badge-info" :
                                "badge-ghost"
                              }`}>
                                {patientInfo.type}
                              </span>
                            </td>
                            <td className="text-sm max-w-xs truncate">
                              {getTestNames(inv)}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(inv.status)} badge-sm font-medium`}>
                                {inv.status?.replace("_", " ") || "Pending"}
                              </span>
                            </td>
                            <td className="text-xs text-base-content/70">
                              {formatDate(inv.createdAt)}
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-2">
                                {inv.status?.toLowerCase() === "completed" ? (
                                  <>
                                    {hasExistingLabResult && (
                                      <button
                                        onClick={() => window.open(`/dashboard/laboratory/results/${hasExistingLabResult}`, '_blank')}
                                        className="btn btn-xs btn-success text-white gap-1"
                                      >
                                        <FiEye className="w-3.5 h-3.5" />
                                        View
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleSendToDoctor(inv)}
                                      disabled={isSending}
                                      className="btn btn-xs btn-outline btn-primary gap-1"
                                    >
                                      <FiSend className="w-3.5 h-3.5" />
                                      {isSending ? "Sending..." : "Doctor"}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    
                                    <button
                                      onClick={() => handleSendToDoctor(inv)}
                                      disabled={isSending}
                                      className="btn btn-xs btn-outline btn-ghost gap-1"
                                    >
                                      <FiSend className="w-3.5 h-3.5" />
                                      {isSending ? "..." : "Doctor"}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile / Tablet View: Cards */}
              <div className="flex flex-col gap-3 lg:hidden">
                {paginatedInvestigations.map((inv) => {
                  const invId = inv._id || inv.id;
                  const patientInfo = extractPatientInfo(inv);
                  const hasExistingLabResult = existingLabResults[invId];
                  const isSending = sendingToDoctor === invId;

                  return (
                    <div key={invId} className="bg-base-100 rounded-xl border border-base-300 p-4 shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-base text-base-content">{patientInfo.name}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="badge badge-xs badge-outline">{patientInfo.type}</span>
                          </div>
                        </div>
                        <span className={`badge ${getStatusBadge(inv.status)} badge-sm shrink-0`}>
                          {inv.status?.replace("_", " ") || "Pending"}
                        </span>
                      </div>

                      <div className="text-xs text-base-content/70 space-y-1 bg-base-200/50 p-2.5 rounded-lg">
                        <div><span className="font-semibold">Tests:</span> {getTestNames(inv)}</div>
                        <div><span className="font-semibold">Date:</span> {formatDate(inv.createdAt)}</div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {inv.status?.toLowerCase() === "completed" ? (
                          <>
                            {hasExistingLabResult && (
                              <button
                                onClick={() => window.open(`/dashboard/laboratory/results/${hasExistingLabResult}`, '_blank')}
                                className="btn btn-xs btn-success text-white flex-1"
                              >
                                View Result
                              </button>
                            )}
                            {!inv.opdPatientId && !inv.opdPatient && (
                              <button
                                onClick={() => handleSendToDoctor(inv)}
                                disabled={isSending}
                                className="btn btn-xs btn-outline flex-1"
                              >
                                {isSending ? "Sending..." : "Send to Doctor"}
                              </button>
                            )}
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleProcess(inv)}
                              className="btn btn-xs btn-primary text-white flex-1"
                            >
                              Process Test
                            </button>
                            {!inv.opdPatientId && !inv.opdPatient && (
                              <button
                                onClick={() => handleSendToDoctor(inv)}
                                disabled={isSending}
                                className="btn btn-xs btn-outline flex-1"
                              >
                                {isSending ? "Sending..." : "Send to Doctor"}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-base-content/60">
                    Showing {(currentPage - 1) * resultsPerPage + 1} to {Math.min(currentPage * resultsPerPage, totalResults)} of {totalResults} requests
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

              {paginatedInvestigations.length === 0 && (
                <div className="text-center py-16 bg-base-100 rounded-xl border border-dashed border-base-300">
                  <FaFlask className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <h3 className="font-bold text-lg text-base-content">No ordered lab requests found</h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    {search ? "No requests match your current search query." : "No laboratory requests are currently recorded."}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Modals outside loop */}
          {showModal && selectedCard && (
            <AcceptTestRequestModal
              data={selectedCard}
              setShowModal={setShowModal}
              onAcceptSuccess={() => fetchInvestigations(true)}
            />
          )}
          {showModal2 && selectedCard && (
            <TestRequestModal
              data={selectedCard}
              setShowModal2={setShowModal2}
              onAcceptFromDetails={handleAcceptFromDetails}
              existingLabResultId={selectedCard ? existingLabResults[selectedCard._id || selectedCard.id] : null}
            />
          )}
        </div>
    </LaboratoryLayout>
  );
};

export default OrderedLab;