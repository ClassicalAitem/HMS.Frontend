import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header, HmoStatusBadge } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { FiSearch, FiCheckCircle, FiEye, FiRefreshCw } from "react-icons/fi";
import { FaFlask } from "react-icons/fa";

const getPersonName = (item) => {
  if (item.dependant) {
    const depName = `${item.dependant.firstName || ""} ${item.dependant.lastName || ""}`.trim() || item.dependant.fullName || item.dependant.name;
    if (depName) return depName;
  }
  if (item.opdPatient) {
    const opdName = item.opdPatient.fullName || `${item.opdPatient.firstName || ""} ${item.opdPatient.lastName || ""}`.trim();
    if (opdName) return opdName;
  }
  if (item.patient) {
    const patName = `${item.patient.firstName || ""} ${item.patient.lastName || ""}`.trim() || item.patient.name;
    if (patName) return patName;
  }
  return "Unknown Patient";
};

const getPersonType = (item) => {
  if (item?.dependant || item?.dependantId) return 'Dependant';
  if (item?.opdPatient || item?.opdPatientId) return 'OPD';
  return 'Patient';
};

const CompletedTests = () => {
  const navigate = useNavigate();
  const [completedTests, setCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const itemsPerPage = 10;

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  const fetchCompletedTests = async () => {
    try {
      setLoading(true);
      const [labResults, investigations] = await Promise.all([
        getLabResults().catch(() => []),
        getInvestigations({ type: 'lab' }).catch(() => getInvestigations().catch(() => [])),
      ]);

      const resultsArray = Array.isArray(labResults) ? labResults : labResults?.data || [];
      const investigationsArray = Array.isArray(investigations) ? investigations : investigations?.data || [];

      // Process completed investigations synchronously in memory
      const completedInvestigationItems = investigationsArray
        .filter((inv) => inv.status === "completed")
        .map((inv) => ({
          key: `investigation-${inv._id || inv.id}`,
          id: inv._id || inv.id,
          name: getPersonName(inv),
          testType: inv.tests?.map((t) => t.name).join(", ") || inv.investigationType || "Lab Test",
          personType: getPersonType(inv),
          hmoStatus: inv.hmoStatus || null,
          patientId: inv.patientId || inv.opdPatientId,
          date: inv.completedAt
            ? formatNigeriaTime(inv.completedAt)
            : formatNigeriaTime(inv.updatedAt || inv.createdAt),
          completedAt: new Date(inv.completedAt || inv.updatedAt || inv.createdAt || 0),
          isLabResult: false,
        }));

      // Process completed lab results synchronously in memory
      const completedLabResultItems = resultsArray
        .filter((result) => result.status === "completed")
        .map((res) => {
          const testType =
            (Array.isArray(res.result) && (res.result[0]?.code || res.result[0]?.value)) ||
            res.tests?.map((t) => t.name).join(", ") ||
            res.form?.clinicalDiagnosis ||
            "Lab Test";

          return {
            key: `labresult-${res._id || res.id}`,
            id: res._id || res.id,
            name: getPersonName(res),
            testType,
            personType: getPersonType(res),
            hmoStatus: res.hmoStatus || null,
            patientId: res.patientId || res.opdPatientId,
            date: res.completedAt
              ? formatNigeriaTime(res.completedAt)
              : formatNigeriaTime(res.updatedAt || res.createdAt),
            completedAt: new Date(res.completedAt || res.updatedAt || res.createdAt || 0),
            isLabResult: true,
          };
        });

      // Combine and deduplicate
      const allCompleted = [
        ...completedInvestigationItems,
        ...completedLabResultItems,
      ]
        .filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (o) =>
                o.key === item.key ||
                (o.name === item.name && o.testType === item.testType && o.date === item.date)
            )
        )
        .sort((a, b) => b.completedAt - a.completedAt);

      setCompletedTests(allCompleted);
      setError(null);
    } catch (err) {
      console.error("Error fetching completed tests:", err);
      setError("Failed to load completed tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTests();
  }, []);

  const filteredTests = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return completedTests;

    return completedTests.filter((test) => {
      const name = test.name.toLowerCase();
      const type = test.testType.toLowerCase();
      const id = String(test.patientId || "").toLowerCase();
      return name.includes(query) || type.includes(query) || id.includes(query);
    });
  }, [completedTests, search]);

  const totalPages = Math.max(1, Math.ceil(filteredTests.length / itemsPerPage));
  const paginatedTests = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTests.slice(start, start + itemsPerPage);
  }, [currentPage, filteredTests]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  const sidebarWrapper = (
    <>
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <LaboratorySidebar onCloseSidebar={closeSidebar} />
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-base-200">
      {sidebarWrapper}

      <div className="flex overflow-hidden flex-col flex-1 min-w-0">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <FiCheckCircle className="w-7 h-7 text-emerald-600" />
                Completed Laboratory Tests
              </h1>
              <p className="text-sm text-base-content/70 mt-1">
                Overview of all finalized investigations and verified test results
              </p>
            </div>
            <button
              onClick={fetchCompletedTests}
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
            <div className="relative w-full sm:w-80">
              <FiSearch className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search patient, test name, or ID..."
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
              Total Completed: <strong className="text-base-content">{completedTests.length}</strong>
            </span>
          </div>

          {/* List Content */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="bg-base-100 p-4 rounded-xl border border-base-300 animate-pulse h-16"></div>
              ))}
            </div>
          ) : (
            <div className="bg-base-100 rounded-xl border border-base-300/80 p-5 shadow-sm space-y-4">
              {paginatedTests.length > 0 ? (
                <>
                  <div className="space-y-2.5">
                    {paginatedTests.map((test, index) => (
                      <div
                        key={test.key || index}
                        className="p-3.5 rounded-xl border border-base-200 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3 bg-base-200/30"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-sm text-base-content truncate">{test.name}</p>
                              <span className="badge badge-xs badge-outline text-[10px]">{test.personType}</span>
                              <HmoStatusBadge status={test.hmoStatus} size="sm" />
                            </div>
                            <p className="text-xs text-base-content/70 truncate mt-0.5">{test.testType}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-base-content/50">{test.date}</span>
                          {test.isLabResult ? (
                            <button
                              onClick={() => navigate(`/dashboard/laboratory/results/${test.id}`)}
                              className="btn btn-xs btn-outline btn-primary gap-1"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                              View
                            </button>
                          ) : (
                            <span className="badge badge-sm badge-success text-white">Completed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between pt-4 border-t border-base-200 text-xs">
                      <span className="text-base-content/60">
                        Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                        {Math.min(currentPage * itemsPerPage, filteredTests.length)} of {filteredTests.length}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="btn btn-xs btn-ghost border border-base-300 disabled:opacity-40"
                        >
                          Prev
                        </button>
                        <span className="px-2 font-medium">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="btn btn-xs btn-ghost border border-base-300 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16">
                  <FaFlask className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
                  <h3 className="font-bold text-lg text-base-content">No completed tests found</h3>
                  <p className="text-sm text-base-content/60 mt-1">
                    {search ? "No records match your search criteria." : "There are currently no completed tests recorded."}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CompletedTests;