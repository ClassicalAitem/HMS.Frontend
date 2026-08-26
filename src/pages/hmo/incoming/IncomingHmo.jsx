import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { RiSuitcaseLine, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { getPatients, updatePatientStatus } from "@/services/api/patientsAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { normalizeStatus, getStatusBadgeClass, getStatusDisplayText } from "@/utils/statusUtils";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { getDependants, updateDependantStatus } from "@/services/api/dependantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import ClearItemButton from "@/components/common/ClearIncomingButton";
import { useNotifications } from "@/contexts/NotificationContext";

const IncomingHmo = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const loadPatients = async () => {
      try {
        setLoading(true);

        const hmoStatuses = [
          PATIENT_STATUS.AWAITING_HMO,
          PATIENT_STATUS.LAB_COMPLETED,
          PATIENT_STATUS.SONOGRAPHY,
        ];

        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients(),
          getDependants(),
        ]);

        const allPatients = patientsRes.status === 'fulfilled'
          ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
          : [];

        const allDependants = dependantsRes.status === 'fulfilled'
          ? (() => {
              const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
              return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
            })()
          : [];

        const mappedPatients = allPatients
          .filter((p) => hmoStatuses.includes(normalizeStatus(p?.status)))
          .map((p) => ({
            type: 'patient',
            id: p?.id || p?._id,
            patientId: p?.id || p?._id,
            dependantId: null,
            name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
            displayId: p?.hospitalId || p?.id || "—",
            status: normalizeStatus(p?.status),
            insurance: p?.hmos?.provider || "—",
            updatedAt: p?.updatedAt ? formatNigeriaDateTime(p.updatedAt) : "—",
            snapshot: p,
          }));

        const patientMap = new Map(allPatients.map(p => [p.id || p._id, p]));

        const mappedDependants = allDependants
          .filter((d) => hmoStatuses.includes(normalizeStatus(d?.status)))
          .map((d) => {
            const parentPatient = patientMap.get(d?.patientId);
            return {
              type: 'dependant',
              id: d?.id,
              patientId: d?.patientId,
              dependantId: d?.id,
              name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
              displayId: parentPatient?.hospitalId || d?.patientId || "—",
              badge: d?.relationshipType || 'Dependant',
              status: normalizeStatus(d?.status),
              insurance: d?.hmos?.provider || "—",
              updatedAt: d?.updatedAt ? formatNigeriaDateTime(d.updatedAt) : "—",
              snapshot: d,
            };
          });

        if (mounted) setItems([...mappedPatients, ...mappedDependants]);
      } catch (err) {
        console.error("IncomingHmo: failed to load patients", err);
        if (mounted) setItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadPatients();
    return () => { mounted = false; };
  }, [refreshKey]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  useEffect(() => {
    setPage(0);
  }, [query, items]);

  const viewPatient = (item) => {
    if (!item?.patientId) return;
    navigate(`/dashboard/hmo/incoming/${item.patientId}`, {
      state: {
        patientSnapshot: item.type === 'dependant' ? null : item.snapshot,
        dependantId: item.dependantId,
        dependantSnapshot: item.type === 'dependant' ? item.snapshot : null,
      },
    });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((d) => {
      const hay = [d?.name, d?.displayId, d?.status, d?.insurance]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = page * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  

    const { refreshQueueCount } = useNotifications();



    const handleClear = async (patient) => {
    if (patient.type === 'dependant') {
      await updateDependantStatus(patient.dependantId, { status: PATIENT_STATUS.CANCELLED });
    } else {
      await updatePatientStatus(patient.patientId, { status: PATIENT_STATUS.CANCELLED });
    }
    localStorage.setItem('refreshIncoming', Date.now().toString());
    refreshQueueCount();
  };

  return (
    <div className="flex h-screen w-full">
      {loading && <KolakLoader fullscreen />}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-3 sm:p-5 lg:p-6">
          <section className="space-y-4 sm:space-y-5">
            <div>
              <div className="flex items-center gap-3 sm:gap-5">
                <RiSuitcaseLine size={24} className="text-primary sm:w-[25px]" />
                <h1 className="text-2xl font-bold text-primary sm:text-[32px]">Incoming HMO Requests</h1>
              </div>
              <p className="mt-1 text-xs text-base-content/70 sm:text-sm">
                Review patients sent to HMO for approval.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative w-full max-w-sm">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search patients"
                  className="input input-bordered input-sm w-full pl-9"
                />
              </div>
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn btn-ghost btn-sm"
                >
                  Clear
                </button>
              )}
              <button onClick={onRefresh} className="btn btn-outline btn-sm sm:ml-auto" disabled={loading}>
                Refresh
              </button>
            </div>

            <div className="card overflow-hidden border border-base-200 bg-base-100 shadow-sm">
              {!loading && items.length > 0 && (
                <div className="hidden grid-cols-12 gap-2 border-b border-base-200 bg-base-200/60 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-base-content/50 md:grid">
                  <div className="col-span-3">Patient</div>
                  <div className="col-span-2">Patient ID</div>
                  <div className="col-span-2">Type</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Updated</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>
              )}

              <div className="divide-y divide-base-200">
                {loading ? (
                  Array.from({ length: 8 }).map((_, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 px-5 py-4 items-center">
                      <div className="col-span-3 space-y-2">
                        <div className="skeleton h-4 w-36 rounded" />
                        <div className="skeleton h-3 w-20 rounded" />
                      </div>
                      <div className="col-span-2"><div className="skeleton h-4 w-24 rounded" /></div>
                      <div className="col-span-2"><div className="skeleton h-5 w-24 rounded-full" /></div>
                      <div className="col-span-2"><div className="skeleton h-5 w-28 rounded-full" /></div>
                      <div className="col-span-2"><div className="skeleton h-4 w-20 rounded" /></div>
                      <div className="col-span-1 flex justify-end"><div className="skeleton h-8 w-16 rounded" /></div>
                    </div>
                  ))
                ) : filtered.length === 0 ? (
                  <div className="py-16">
                    <EmptyState
                      title="No HMO requests found"
                      description={
                        query ? "No matches for your search." : "No incoming HMO requests right now."
                      }
                      actionLabel={query ? "Clear search" : "Refresh"}
                      onAction={query ? () => setQuery("") : onRefresh}
                    />
                  </div>
                ) : (
                  visible.map((item) => {
                    const badgeClass = getStatusBadgeClass(item.status);
                    const displayStatus = getStatusDisplayText(item.status);

                    return (
                      <div
                        key={item.id}
                        className="grid gap-2.5 px-4 py-3.5 transition-colors hover:bg-base-200/40 md:grid-cols-12 md:items-center md:gap-2 md:px-5 md:py-4 cursor-pointer"
                        onClick={() => viewPatient(item)}
                      >
                        {/* Name + ID — paired row on mobile, separate grid cols on desktop */}
                        <div className="flex items-baseline justify-between gap-3 md:contents">
                          <div className="min-w-0 md:col-span-3">
                            <p className="text-sm font-bold text-base-content truncate md:text-base">
                              {item.name}
                            </p>
                          </div>
                          <div className="shrink-0 md:col-span-2">
                            <span className="text-xs font-mono text-base-content/70 md:text-sm">
                              {item.displayId}
                            </span>
                          </div>
                        </div>

                        {/* Type badge + Status badge — paired row on mobile, separate grid cols on desktop */}
                        <div className="flex items-center justify-between gap-2 md:contents">
                          <div className="md:col-span-2">
                            {item.type === 'dependant' ? (
                              <span className="badge badge-sm badge-secondary">{item.badge}</span>
                            ) : (
                              <span className="badge badge-sm badge-primary">Patient</span>
                            )}
                          </div>
                          <div className="md:col-span-2">
                            <span className={`badge badge-sm ${badgeClass}`}>{displayStatus}</span>
                          </div>
                        </div>

                        <div className="md:col-span-2">
                          <span className="text-xs text-base-content/60 md:text-sm">
                            {item.updatedAt}
                          </span>
                        </div>

                        <div className="md:col-span-1 md:flex md:justify-end">
                        <div className="md:col-span-1 md:flex md:flex-col md:items-end md:gap-2">
                        <button
                          className="btn btn-sm btn-primary w-full md:w-auto"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewPatient(item);
                          }}
                        >
                          View
                        </button>
                        <div
                          className="flex justify-end w-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ClearItemButton item={item} onClear={handleClear} onCleared={onRefresh} />
                        </div>
                      </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {!loading && filtered.length > pageSize && (
                <div className="mt-6 mb-4 flex items-center justify-center gap-3">
                  <button
                    className="btn btn-ghost btn-xs"
                    aria-label="Previous"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <RiArrowLeftSLine />
                  </button>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        aria-label={`Go to page ${i + 1}`}
                        className={`w-3 h-3 rounded-full ${
                          i === page ? 'bg-success' : 'border border-base-300 bg-transparent'
                        }`}
                      />
                    ))}
                  </div>
                  <button
                    className="btn btn-ghost btn-xs"
                    aria-label="Next"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  >
                    <RiArrowRightSLine />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IncomingHmo;