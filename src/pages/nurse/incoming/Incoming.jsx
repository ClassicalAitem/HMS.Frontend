import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/nurse/dashboard/Sidebar";
import { RiArrowLeftRightFill, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import womanLogo from "../../../assets/images/incomingLogo.jpg";
import { getPatients } from "@/services/api/patientsAPI";
import { hasAnyStatus, hasStatus } from "@/utils/statusUtils";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { formatNigeriaDateTime, formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const Incoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
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
  // Handle arrays
  if (Array.isArray(status)) status = status[status.length - 1];

  // Replace spaces with underscores and lowercase
  return status.replace(/\s+/g, "_").toLowerCase();
};
  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const nurseStatuses = [
          PATIENT_STATUS.AWAITING_INJECTION,
          PATIENT_STATUS.AWAITING_SAMPLING,
          PATIENT_STATUS.AWAITING_VITALS,
          PATIENT_STATUS.AWAITING_NURSE,
        ];

        const filtered = patients.filter((p) =>
          hasAnyStatus(p?.status, nurseStatuses)
          );  
        const sorted = filtered.sort((a, b) => {
          const aTime = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bTime = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bTime - aTime;
        });

       const prettifyStatus = (s) => {
          const status = normalizeStatus(s); 
          switch ((status || '').toLowerCase()) {
            case 'awaiting_vitals': return 'Awaiting Vitals';
            case 'awaiting_sampling': return 'Awaiting Sampling';
            case 'awaiting_injection': return 'Awaiting Injection';
            case 'awaiting_nurse': return 'Awaiting Nurse';
            default: return status || '—';
            }
          };

       const mapped = sorted.map((p) => {
        const latestStatus = normalizeStatus(p?.status); // <-- ensures string
        const prettyStatus = prettifyStatus(latestStatus);

        return {
          id: p?.id,
          hospitalId: p?.hospitalId,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          patientId: p?.hospitalId || p?.id || '—',
          illness: prettyStatus,
          insurance: p?.hmos?.provider || '—',
          updatedAt: p?.updatedAt ? formatNigeriaDateTime(p.updatedAt) : "—",
          alert: prettyStatus,
          status: latestStatus.toLowerCase(), // <-- safe string now
        };
      });

        if (mounted) setItems(mapped);
      } catch (err) {
        console.error('Incoming page: patients fetch error', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchIncoming();
    return () => { mounted = false; };
  }, [refreshKey]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  // Reset to first page when search query or items change
  useEffect(() => {
    setPage(0);
  }, [query, items]);

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <section>
            <div>
              <div>
                <div className="flex items-center gap-5 ">
                  <RiArrowLeftRightFill size={25} className="text-primary" />
                  <h1 className="text-[32px] text-primary ">Incoming</h1>
                </div>
                <p className="text-[12px] text-base-content/70">
                  Check out the patient sent to you.
                </p>
              </div>
            </div>
            {/* Minimal search */}
            <div className="flex items-center gap-3 mb-5">
              <div className="relative w-full max-w-sm">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search patients"
                  className="input input-bordered input-sm pl-9 w-full"
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
              <button onClick={onRefresh} className="btn btn-outline btn-sm ml-auto">
                Refresh
              </button>
            </div>
            <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
              
              {/* Column Headers */}
              {!loading && items.length > 0 && (
                <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                  <div className="col-span-3">Patient</div>
                  <div className="col-span-2">Patient ID</div>
                  <div className="col-span-2">Status</div>
                  <div className="col-span-2">Updated</div>
                  <div className="col-span-1 text-right">Action</div>
                </div>
              )}
                
              {/* Rows */}
              <div className="divide-y divide-base-200">
              {loading ? (
                Array.from({ length: 8 }).map((_, idx) => (
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
                      <div className="skeleton h-5 w-28 rounded-full" />
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
              ) : (
                (() => {
                  const q = query.trim().toLowerCase();
                  const filtered = q
                    ? items.filter((d) => {
                        const hay = [
                          d?.name,
                          d?.patientId,
                          d?.illness,
                        ]
                          .filter(Boolean)
                          .join(" ")
                          .toLowerCase();
                        return hay.includes(q);
                      })
                    : items;

                  if (filtered.length === 0) {
                    return (
                      <div className="py-16">
                        <EmptyState
                          title="No patients found"
                          description={
                            query
                              ? "No matches for your search."
                              : "No incoming patients right now."
                          }
                          actionLabel={query ? "Clear search" : "Refresh"}
                          onAction={query ? () => setQuery("") : onRefresh}
                        />
                      </div>
                    );
                  }

                  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
                  const start = page * pageSize;
                  const end = start + pageSize;
                  const visible = filtered.slice(start, end);

                  return visible.map((data, index) => {
                    const statusBadgeClass = (status) => {
                      const s = status?.toLowerCase() || '';
                      if (s.includes('vitals')) return 'badge-info';
                      if (s.includes('sampling')) return 'badge-warning';
                      if (s.includes('injection')) return 'badge-error';
                      if (s.includes('nurse')) return 'badge-warning';
                      return 'badge-neutral';
                    };

                    return (
                      <div
                        key={index}
                        className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-base-200/40 transition-colors"
                      >
                        {/* Patient Name */}
                        <div className="col-span-3 min-w-0">
                          <p className="font-bold text-base-content truncate">
                            {data.name}
                          </p>
                        </div>

                        {/* Patient ID */}
                        <div className="col-span-2">
                          <span className="text-sm font-mono text-base-content/70">
                            {data.patientId}
                          </span>
                        </div>

                        {/* Status */}
                        <div className="col-span-2">
                          <span className={`badge badge-sm ${statusBadgeClass(data.illness)}`}>
                            {data.illness}
                          </span>
                        </div>

                        {/* Registered */}
                        <div className="col-span-2">
                          <span className="text-sm text-base-content/60">
                            {data.updatedAt}
                          </span>
                        </div>

                     

                        {/* Action */}
                        <div className="col-span-1 flex justify-end">
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => data.id && navigate(`/dashboard/nurse/patient/${data.id}`, { state: { from: 'incoming', patientSnapshot: data.snapshot } })}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()
              )}
            </div>
            {/* Carousel-style pagination dots and controls */}
            {(() => {
              const q = query.trim().toLowerCase();
              const filtered = q
                ? items.filter((d) => {
                    const hay = [d?.name, d?.patientId, d?.illness, d?.insurance]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase();
                    return hay.includes(q);
                  })
                : items;
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              if (!loading && filtered.length > pageSize) {
                return (
                  <div className="mt-6 flex items-center justify-center gap-3">
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
                );
              }
              return null;
            })()}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};


export default Incoming;
