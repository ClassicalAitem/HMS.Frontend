import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { RiArrowLeftRightFill, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { hasAnyStatus } from "@/utils/statusUtils";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { getDependants, updateDependantStatus } from "@/services/api/dependantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import { useNotifications } from "@/contexts/NotificationContext";

const Incoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const normalizeStatus = (status) => {
    if (!status) return "";
    if (Array.isArray(status)) status = status[status.length - 1];
    return status.replace(/\s+/g, "_").toLowerCase();
  };

  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);

        const nurseStatuses = [
          PATIENT_STATUS.AWAITING_INJECTION,
          PATIENT_STATUS.AWAITING_SAMPLING,
          PATIENT_STATUS.AWAITING_VITALS,
          PATIENT_STATUS.AWAITING_NURSE,
        ];

        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients(),
          getDependants(),
        ]);

        const patients =
          patientsRes.status === "fulfilled"
            ? Array.isArray(patientsRes.value?.data)
              ? patientsRes.value.data
              : []
            : [];

        const dependants =
          dependantsRes.status === "fulfilled"
            ? (() => {
                const raw =
                  dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
                return Array.isArray(raw) ? raw : raw?.dependants ?? [];
              })()
            : [];

        const prettifyStatus = (s) => {
          const status = normalizeStatus(s);
          switch ((status || "").toLowerCase()) {
            case "awaiting_vitals":
              return "Awaiting Vitals";
            case "awaiting_sampling":
              return "Awaiting Sampling";
            case "awaiting_injection":
              return "Awaiting Injection";
            case "awaiting_nurse":
              return "Awaiting Nurse";
            default:
              return status || "—";
          }
        };

        const mappedPatients = patients
          .filter((p) => hasAnyStatus(p?.status, nurseStatuses))
          .map((p) => {
            const latestStatus = normalizeStatus(p?.status);
            return {
              type: "patient",
              id: p?.id || p?._id,
              patientId: p?.id || p?._id,
              dependantId: null,
              hospitalId: p?.hospitalId,
              snapshot: p,
              name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
              displayId: p?.hospitalId || p?.id || "—",
              illness: prettifyStatus(latestStatus),
              updatedAt: p?.updatedAt ? formatNigeriaDateTime(p.updatedAt) : "—",
              status: latestStatus.toLowerCase(),
            };
          });

        const patientMap = new Map(patients.map((p) => [p.id || p._id, p]));

        const mappedDependants = dependants
          .filter((d) => hasAnyStatus(d?.status, nurseStatuses))
          .map((d) => {
            const latestStatus = normalizeStatus(d?.status);
            const parentPatient = patientMap.get(d?.patientId);
            return {
              type: "dependant",
              id: d?.id || d?._id,
              patientId: d?.patientId,
              dependantId: d?.id || d?._id,
              hospitalId: parentPatient?.hospitalId || null,
              snapshot: d,
              name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
              displayId: parentPatient?.hospitalId || d?.patientId || "—",
              badge: d?.relationshipType || "Dependant",
              illness: prettifyStatus(latestStatus),
              updatedAt: d?.updatedAt ? formatNigeriaDateTime(d.updatedAt) : "—",
              status: latestStatus.toLowerCase(),
            };
          });

        const merged = [...mappedPatients, ...mappedDependants].sort((a, b) => {
          const aTime = new Date(a.snapshot?.updatedAt || a.snapshot?.createdAt || 0).getTime();
          const bTime = new Date(b.snapshot?.updatedAt || b.snapshot?.createdAt || 0).getTime();
          return bTime - aTime;
        });

        if (mounted) setItems(merged);
      } catch (err) {
        console.error("Incoming page: fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncoming();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  const { refreshQueueCount } = useNotifications();

  const handleClear = async (data) => {
    if (data.type === "dependant") {
      await updateDependantStatus(data.dependantId, { status: PATIENT_STATUS.CANCELLED });
    } else {
      await updatePatientStatus(data.patientId, { status: PATIENT_STATUS.CANCELLED });
    }
    localStorage.setItem("refreshIncoming", Date.now().toString());
    refreshQueueCount();
  };

  const onRefresh = () => setRefreshKey((k) => k + 1);

  // Filter counts calculation
  const filterCounts = useMemo(() => {
    const counts = {
      all: items.length,
      awaiting_vitals: 0,
      awaiting_sampling: 0,
      awaiting_injection: 0,
      awaiting_nurse: 0,
    };
    items.forEach((item) => {
      const s = (item.status || "").toLowerCase();
      if (s.includes("vitals")) counts.awaiting_vitals++;
      else if (s.includes("sampling")) counts.awaiting_sampling++;
      else if (s.includes("injection")) counts.awaiting_injection++;
      else if (s.includes("nurse")) counts.awaiting_nurse++;
    });
    return counts;
  }, [items]);

  // Combined filtered items (active filter + search query)
  const filteredItems = useMemo(() => {
    let list = items;
    if (activeFilter !== "all") {
      list = list.filter((item) => {
        const s = (item.status || "").toLowerCase();
        if (activeFilter === "awaiting_vitals") return s.includes("vitals");
        if (activeFilter === "awaiting_sampling") return s.includes("sampling");
        if (activeFilter === "awaiting_injection") return s.includes("injection");
        if (activeFilter === "awaiting_nurse") return s.includes("nurse");
        return true;
      });
    }

    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter((d) => {
        const hay = [d?.name, d?.patientId, d?.hospitalId, d?.illness]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }

    return list;
  }, [items, activeFilter, query]);

  // Reset to first page when search query, filter, or items change
  useEffect(() => {
    setPage(0);
  }, [query, activeFilter, items]);

  const statusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s.includes("vitals")) {
      return "bg-primary/10 text-primary border border-primary/20 font-medium";
    }
    if (s.includes("sampling")) {
      return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium";
    }
    if (s.includes("injection")) {
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium";
    }
    if (s.includes("nurse")) {
      return "bg-base-200 text-base-content/80 border border-base-300 font-medium";
    }
    return "badge-ghost";
  };

  const filterTabs = [
    { key: "all", label: "All Incoming", count: filterCounts.all },
    { key: "awaiting_vitals", label: "Awaiting Vitals", count: filterCounts.awaiting_vitals },
    { key: "awaiting_sampling", label: "Awaiting Sampling", count: filterCounts.awaiting_sampling },
    { key: "awaiting_injection", label: "Awaiting Injection", count: filterCounts.awaiting_injection },
    { key: "awaiting_nurse", label: "Awaiting Nurse", count: filterCounts.awaiting_nurse },
  ];

  return (
    <div className="flex h-screen max-h-screen w-full overflow-hidden bg-base-100">
      {loading && <KolakLoader fullscreen />}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col h-full overflow-hidden bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />

        {/* Dedicated Page-Level Smooth Scroll Container */}
        <main className="flex-1 h-full min-h-0 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4 sm:space-y-5">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                  <RiArrowLeftRightFill size={24} />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                    Nurse Incoming Queue
                  </h1>
                  <p className="text-xs text-base-content/60">
                    Patients routed to the nursing station awaiting vitals, sampling, injections, or nursing care.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={onRefresh}
              className="btn btn-outline btn-primary btn-sm rounded-xl self-end sm:self-center font-medium shadow-2xs"
            >
              Refresh Queue
            </button>
          </div>

          {/* Filter Tabs Bar */}
          <div className="bg-base-200/40 p-1.5 rounded-2xl border border-base-200 overflow-x-auto">
            <div className="flex items-center gap-1.5 min-w-max">
              {filterTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 ${
                    activeFilter === tab.key
                      ? "bg-primary text-primary-content shadow-xs"
                      : "text-base-content/70 hover:bg-base-200"
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`badge badge-xs font-bold ${
                      activeFilter === tab.key
                        ? "badge-neutral text-white"
                        : "badge-ghost bg-base-300/60"
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Search Controls */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full max-w-sm">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by patient name, ID, or care task..."
                className="input input-bordered input-sm w-full pl-9 rounded-xl text-xs"
              />
            </div>
            {query && (
              <button
                onClick={() => setQuery("")}
                className="btn btn-ghost btn-sm rounded-xl text-xs"
              >
                Clear Search
              </button>
            )}
          </div>

          {/* Patient Cards / Table Container */}
          <div className="card overflow-x-auto border border-base-200 bg-base-100 shadow-sm rounded-2xl">
            {!loading && filteredItems.length > 0 && (
              <div className="hidden min-w-[700px] grid-cols-12 gap-2 border-b border-base-200 bg-base-200/40 px-5 py-3 text-xs font-bold uppercase tracking-wider text-base-content/60 md:grid">
                <div className="col-span-3">Patient</div>
                <div className="col-span-2">Patient ID</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Care Task</div>
                <div className="col-span-2">Routed Time</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
            )}

            <div className="divide-y divide-base-200">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-2 px-5 py-4 items-center"
                  >
                    <div className="col-span-3 space-y-2">
                      <div className="skeleton h-4 w-36 rounded" />
                      <div className="skeleton h-3 w-20 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-4 w-24 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-5 w-24 rounded-full" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-4 w-20 rounded" />
                    </div>
                    <div className="col-span-2">
                      <div className="skeleton h-4 w-28 rounded" />
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <div className="skeleton h-8 w-16 rounded" />
                    </div>
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No patients in this queue"
                    description={
                      query
                        ? "No matching patients found for your search query."
                        : activeFilter !== "all"
                        ? "No patients currently waiting under this specific task category."
                        : "No incoming patients waiting right now."
                    }
                    actionLabel={query ? "Clear search" : "Refresh Queue"}
                    onAction={query ? () => setQuery("") : onRefresh}
                  />
                </div>
              ) : (
                (() => {
                  const start = page * pageSize;
                  const end = start + pageSize;
                  const visible = filteredItems.slice(start, end);

                  return visible.map((data, index) => (
                    <div
                      key={data.id || index}
                      className="grid gap-2.5 px-4 py-3.5 transition-colors hover:bg-base-200/40 md:grid-cols-12 md:items-center md:gap-2 md:px-5 md:py-4"
                    >
                      {/* Name + ID */}
                      <div className="flex items-baseline justify-between gap-3 md:contents">
                        <div className="min-w-0 md:col-span-3">
                          <p className="text-sm font-bold text-base-content truncate md:text-base">
                            {data.name}
                          </p>
                        </div>
                        <div className="shrink-0 md:col-span-2">
                          <span className="text-xs font-mono text-base-content/70 md:text-sm">
                            {data.hospitalId || data.patientId || "—"}
                          </span>
                        </div>
                      </div>

                      {/* Type badge + Care Task status badge */}
                      <div className="flex items-center justify-between gap-2 md:contents">
                        <div className="md:col-span-2">
                          {data.type === "dependant" ? (
                            <span className="badge badge-sm badge-outline badge-primary font-medium">
                              {data.badge}
                            </span>
                          ) : (
                            <span className="badge badge-sm badge-ghost font-medium">
                              Patient
                            </span>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <span
                            className={`badge badge-sm ${statusBadgeClass(
                              data.illness
                            )}`}
                          >
                            {data.illness}
                          </span>
                        </div>
                      </div>

                      <div className="md:col-span-2">
                        <span className="text-xs text-base-content/60 md:text-sm">
                          {data.updatedAt}
                        </span>
                      </div>

                      <div className="md:col-span-1 flex items-center justify-end gap-2">
                        <button
                          className="btn btn-xs sm:btn-sm btn-primary rounded-xl font-medium shadow-2xs"
                          onClick={() =>
                            data.id &&
                            navigate(`/dashboard/nurse/patient/${data.patientId}`, {
                              state: {
                                from: "incoming",
                                patientSnapshot:
                                  data.type === "dependant"
                                    ? items.find(
                                        (p) => p.id === data.patientId && p.type === "patient"
                                      )
                                    : data.snapshot,
                                dependantId: data.dependantId,
                                dependantSnapshot:
                                  data.type === "dependant" ? data.snapshot : null,
                              },
                            })
                          }
                        >
                          View
                        </button>
                        <ClearItemButton
                          item={data}
                          onClear={handleClear}
                          onCleared={onRefresh}
                        />
                      </div>
                    </div>
                  ));
                })()
              )}
            </div>

            {/* Pagination */}
            {!loading && filteredItems.length > pageSize && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-base-200">
                <span className="text-xs sm:text-sm text-base-content/60">
                  Showing {page * pageSize + 1}–
                  {Math.min((page + 1) * pageSize, filteredItems.length)} of{" "}
                  {filteredItems.length} patients
                </span>
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-ghost btn-sm rounded-lg"
                    aria-label="Previous Page"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <RiArrowLeftSLine size={18} />
                  </button>
                  <span className="text-xs sm:text-sm font-medium px-3 py-1 bg-base-200 rounded-lg">
                    {page + 1} / {Math.max(1, Math.ceil(filteredItems.length / pageSize))}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm rounded-lg"
                    aria-label="Next Page"
                    onClick={() =>
                      setPage((p) =>
                        Math.min(
                          Math.ceil(filteredItems.length / pageSize) - 1,
                          p + 1
                        )
                      )
                    }
                    disabled={
                      page >= Math.ceil(filteredItems.length / pageSize) - 1
                    }
                  >
                    <RiArrowRightSLine size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Incoming;
