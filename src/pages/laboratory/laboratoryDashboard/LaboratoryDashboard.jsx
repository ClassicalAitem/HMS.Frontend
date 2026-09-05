import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, HmoStatusBadge } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import { 
  FiClock, 
  FiCheckCircle, 
  FiActivity, 
  FiAlertTriangle, 
  FiArrowRight, 
  FiPlusCircle, 
  FiFileText, 
  FiBox 
} from "react-icons/fi";
import { FaFlask } from "react-icons/fa";

const LaboratoryDashboard = () => {
  const navigate = useNavigate();
  const [testStats, setTestStats] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedTests, setCompletedTests] = useState([]);
  const [allPendingRequests, setAllPendingRequests] = useState([]);
  const [allCompletedTests, setAllCompletedTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingPage, setPendingPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const itemsPerPage = 5;

  const getPersonType = (item) => {
    if (item?.dependant || item?.dependantId) return 'Dependant';
    if (item?.opdPatient || item?.opdPatientId) return 'OPD';
    return 'Patient';
  };

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Parallel fetch of enriched lab results & investigations (NO N+1 loops)
        const [labResultsRes, investigationsRes] = await Promise.all([
          getLabResults().catch((err) => {
            console.warn("Failed to fetch lab results:", err);
            return [];
          }),
          getInvestigations({ type: 'lab' }).catch(() => getInvestigations().catch(() => [])),
        ]);

        const resultsArray = Array.isArray(labResultsRes)
          ? labResultsRes
          : labResultsRes?.data || [];
        const investigationsArray = Array.isArray(investigationsRes)
          ? investigationsRes
          : investigationsRes?.data || [];

        // Count metrics
        const completedCount =
          resultsArray.filter((r) => r.status === "completed").length +
          investigationsArray.filter((i) => i.status === "completed").length;

        const pendingList = investigationsArray.filter(
          (inv) => inv.status === "pending" || inv.status === "requested" || !inv.status
        );

        const inProgressCount = investigationsArray.filter(
          (inv) => inv.status === "processing" || inv.status === "in_progress"
        ).length;

        setTestStats([
          {
            header: "Pending Tests",
            value: pendingList.length,
            status: "Awaiting Processing",
            icon: FiClock,
            color: "text-amber-600",
            badgeBg: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300",
          },
          {
            header: "Completed Tests",
            value: completedCount,
            status: "Results Ready",
            icon: FiCheckCircle,
            color: "text-emerald-600",
            badgeBg: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
          },
          {
            header: "In Progress",
            value: inProgressCount,
            status: "Currently Analyzing",
            icon: FiActivity,
            color: "text-blue-600",
            badgeBg: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
          },
          {
            header: "Low Stock Items",
            value: "7",
            status: "Reorder Required",
            icon: FiAlertTriangle,
            color: "text-rose-600",
            badgeBg: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300",
          },
        ]);

        // Process pending requests synchronously in memory
        const formattedPending = pendingList.map((inv) => {
          const patientName = getPersonName(inv);
          const personType = getPersonType(inv);
          const testName =
            inv.tests?.map((t) => t.name).join(", ") ||
            inv.investigationType ||
            "Lab Investigation";

          return {
            id: inv._id || inv.id,
            name: patientName,
            testName,
            personType,
            status: inv.priority === "urgent" ? "Urgent" : "Pending",
            isUrgent: inv.priority === "urgent",
            hmoStatus: inv.hmoStatus || null,
            time: inv.createdAt ? formatNigeriaTime(inv.createdAt) : "Recently",
          };
        });

        setAllPendingRequests(formattedPending);

        // Process completed items synchronously in memory
        const completedInvestigations = investigationsArray
          .filter((i) => i.status === "completed")
          .map((inv) => ({
            key: `inv-${inv._id || inv.id}`,
            id: inv._id || inv.id,
            name: getPersonName(inv),
            testType: inv.tests?.map((t) => t.name).join(", ") || "Lab Test",
            personType: getPersonType(inv),
            hmoStatus: inv.hmoStatus || null,
            date: inv.completedAt
              ? formatNigeriaTime(inv.completedAt)
              : formatNigeriaTime(inv.updatedAt || inv.createdAt),
          }));

        const completedLabResults = resultsArray
          .filter((r) => r.status === "completed")
          .map((res) => {
            const testType =
              (Array.isArray(res.result) && (res.result[0]?.code || res.result[0]?.value)) ||
              res.tests?.map((t) => t.name).join(", ") ||
              res.form?.clinicalDiagnosis ||
              "Lab Test";

            return {
              key: `lab-${res._id || res.id}`,
              id: res._id || res.id,
              name: getPersonName(res),
              testType,
              personType: getPersonType(res),
              hmoStatus: res.hmoStatus || null,
              date: res.completedAt
                ? formatNigeriaTime(res.completedAt)
                : formatNigeriaTime(res.updatedAt || res.createdAt),
            };
          });

        const dedupedCompleted = [
          ...completedInvestigations,
          ...completedLabResults,
        ].filter(
          (item, index, self) =>
            index ===
            self.findIndex(
              (o) =>
                o.key === item.key ||
                (o.name === item.name && o.testType === item.testType && o.date === item.date)
            )
        );

        setAllCompletedTests(dedupedCompleted);
        setError(null);
      } catch (err) {
        console.error("Error fetching laboratory data:", err);
        setError("Failed to load laboratory data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Pagination for pending requests
  useEffect(() => {
    const startIndex = (pendingPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setPendingRequests(allPendingRequests.slice(startIndex, endIndex));
  }, [allPendingRequests, pendingPage]);

  // Pagination for completed tests
  useEffect(() => {
    const startIndex = (completedPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setCompletedTests(allCompletedTests.slice(startIndex, endIndex));
  }, [allCompletedTests, completedPage]);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

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
    <div className="flex h-screen w-full overflow-hidden bg-base-200">
      {sidebarWrapper}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <FaFlask className="w-7 h-7 text-emerald-600" />
                Laboratory Dashboard
              </h1>
              <p className="text-sm text-base-content/70 mt-1">
                Real-time overview of incoming requests, analyses in progress, and completed laboratory tests
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/dashboard/laboratory/incoming')}
                className="btn btn-sm btn-primary text-white gap-2 shadow-sm"
              >
                <FiPlusCircle className="w-4 h-4" />
                View Incoming
              </button>
              <button
                onClick={() => navigate('/dashboard/laboratory/inventory')}
                className="btn btn-sm btn-outline border-base-300 gap-2"
              >
                <FiBox className="w-4 h-4" />
                Inventory
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-error shadow-sm">
              <FiAlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Incoming Requests", path: "/dashboard/laboratory/incoming", icon: FiClock, count: allPendingRequests.length },
              { label: "Ordered Tests", path: "/dashboard/laboratory/order", icon: FiFileText, count: null },
              { label: "Completed Tests", path: "/dashboard/laboratory/completed", icon: FiCheckCircle, count: allCompletedTests.length },
              { label: "Results History", path: "/dashboard/laboratory/results", icon: FiActivity, count: null },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <button
                  key={i}
                  onClick={() => navigate(action.path)}
                  className="flex items-center justify-between p-3.5 bg-base-100 border border-base-300/80 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all group text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-base-200 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/40 text-emerald-600">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-base-content/80 group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                        {action.label}
                      </span>
                      {action.count !== null && (
                        <p className="text-xs text-base-content/50">{action.count} active</p>
                      )}
                    </div>
                  </div>
                  <FiArrowRight className="w-3.5 h-3.5 text-base-content/30 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-transform" />
                </button>
              );
            })}
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {testStats.map((test, index) => {
              const Icon = test.icon || FaFlask;
              return (
                <div
                  key={index}
                  className="p-5 rounded-xl bg-base-100 border border-base-300/80 shadow-sm flex flex-col justify-between transition-all hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-base-content/60 uppercase tracking-wider">
                      {test.header}
                    </span>
                    <div className={`p-2 rounded-lg bg-base-200 ${test.color}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className={`text-3xl font-bold ${test.color}`}>
                      {loading ? "..." : test.value}
                    </p>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-medium ${test.badgeBg}`}>
                      {test.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Side-by-Side: Pending Requests & Completed Tests */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Pending Requests Column */}
            <div className="rounded-xl border border-base-300/80 bg-base-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <FiClock className="w-5 h-5 text-amber-500" />
                    Pending Test Requests
                  </h2>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Tests awaiting sample processing or technician review
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/laboratory/incoming')}
                  className="btn btn-xs btn-ghost text-emerald-600 hover:bg-emerald-50 font-medium"
                >
                  View All ({allPendingRequests.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-16 bg-base-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : pendingRequests.length > 0 ? (
                  pendingRequests.map((req, idx) => (
                    <div
                      key={req.id || idx}
                      className="p-3 rounded-lg border border-base-200 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3 bg-base-200/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${req.isUrgent ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`}></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-base-content truncate">{req.name}</p>
                            <span className="badge badge-xs badge-outline text-[10px]">{req.personType}</span>
                            <HmoStatusBadge status={req.hmoStatus} size="sm" />
                          </div>
                          <p className="text-xs text-base-content/70 truncate mt-0.5">{req.testName}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge badge-sm font-medium ${req.isUrgent ? 'badge-error text-white' : 'badge-warning badge-outline'}`}>
                          {req.status}
                        </span>
                        <button
                          onClick={() => navigate('/dashboard/laboratory/incoming')}
                          className="btn btn-xs btn-outline hover:btn-primary"
                        >
                          Process
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-base-content/50 text-xs">
                    No pending test requests
                  </div>
                )}
              </div>

              {allPendingRequests.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-2 text-xs text-base-content/60 border-t border-base-200">
                  <span>
                    Showing {(pendingPage - 1) * itemsPerPage + 1} - {Math.min(pendingPage * itemsPerPage, allPendingRequests.length)} of {allPendingRequests.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setPendingPage((p) => Math.max(1, p - 1))}
                      disabled={pendingPage === 1}
                      className="btn btn-xs btn-ghost border border-base-300 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setPendingPage((p) => Math.min(Math.ceil(allPendingRequests.length / itemsPerPage), p + 1))}
                      disabled={pendingPage >= Math.ceil(allPendingRequests.length / itemsPerPage)}
                      className="btn btn-xs btn-ghost border border-base-300 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Completed Tests Column */}
            <div className="rounded-xl border border-base-300/80 bg-base-100 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-base-content flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5 text-emerald-500" />
                    Completed Laboratory Tests
                  </h2>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    Recently finished analyses with verified results
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/laboratory/completed')}
                  className="btn btn-xs btn-ghost text-emerald-600 hover:bg-emerald-50 font-medium"
                >
                  View All ({allCompletedTests.length})
                </button>
              </div>

              <div className="space-y-2.5">
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-16 bg-base-200 rounded-lg animate-pulse"></div>
                    ))}
                  </div>
                ) : completedTests.length > 0 ? (
                  completedTests.map((res, idx) => (
                    <div
                      key={res.key || idx}
                      className="p-3 rounded-lg border border-base-200 hover:border-emerald-300 transition-colors flex items-center justify-between gap-3 bg-base-200/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-emerald-500"></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-base-content truncate">{res.name}</p>
                            <span className="badge badge-xs badge-outline text-[10px]">{res.personType}</span>
                            <HmoStatusBadge status={res.hmoStatus} size="sm" />
                          </div>
                          <p className="text-xs text-base-content/70 truncate mt-0.5">{res.testType}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-base-content/50">{res.date}</span>
                        <button
                          onClick={() => navigate('/dashboard/laboratory/results')}
                          className="btn btn-xs btn-ghost hover:bg-base-200"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center text-base-content/50 text-xs">
                    No completed tests recorded today
                  </div>
                )}
              </div>

              {allCompletedTests.length > itemsPerPage && (
                <div className="flex items-center justify-between pt-2 text-xs text-base-content/60 border-t border-base-200">
                  <span>
                    Showing {(completedPage - 1) * itemsPerPage + 1} - {Math.min(completedPage * itemsPerPage, allCompletedTests.length)} of {allCompletedTests.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCompletedPage((p) => Math.max(1, p - 1))}
                      disabled={completedPage === 1}
                      className="btn btn-xs btn-ghost border border-base-300 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      onClick={() => setCompletedPage((p) => Math.min(Math.ceil(allCompletedTests.length / itemsPerPage), p + 1))}
                      disabled={completedPage >= Math.ceil(allCompletedTests.length / itemsPerPage)}
                      className="btn btn-xs btn-ghost border border-base-300 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaboratoryDashboard;
