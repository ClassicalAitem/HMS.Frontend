import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/common";
import { FaUserCheck } from "react-icons/fa";
import { RiSearchLine } from "react-icons/ri";
import dispensesAPI from "@/services/api/dispensesAPI";
import { useAppSelector } from "@/store/hooks";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import { PharmacistLayout } from "@/layouts/pharmacist";

const isToday = (dateValue) => {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const AttendedToday = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);
        const res = await dispensesAPI.getDispenses();
        const data = res?.data ?? res;
        const dispenseList = Array.isArray(data) ? data : [];

        // Filter only those dispensed today
        const todaysDispenses = dispenseList.filter(d => isToday(d.dispensedAt || d.createdAt));

        // Group by patient/dependant so we just show each person once
        const byKey = new Map();
        
        todaysDispenses.forEach((d) => {
          const patientId =
            d?.prescriptionId?.patientId ||
            d?.patientId ||
            d?.patient?.id ||
            d?.patient?._id ||
            d?.patientId?._id ||
            null;

          const dependantId =
            d?.prescriptionId?.dependantId ||
            d?.dependantId ||
            d?.dependant?.id ||
            d?.dependant?._id ||
            null;

          const key = dependantId ? `dep-${dependantId}` : `pat-${patientId}`;
          
          if (!byKey.has(key)) {
            // resolve names
            let name = "Unknown";
            let type = dependantId ? "Dependant" : "Patient";
            let displayId = "N/A";
            
            if (dependantId && d.dependant) {
              name = `${d.dependant.firstName || ""} ${d.dependant.lastName || ""}`.trim() || "Dependant";
              displayId = d.dependant.hospitalId || (d.patient ? d.patient.hospitalId : null) || patientId;
            } else if (d.patient) {
              name = `${d.patient.firstName || ""} ${d.patient.lastName || ""}`.trim() || "Patient";
              displayId = d.patient.hospitalId || patientId;
            }

            byKey.set(key, {
              id: key,
              patientId,
              dependantId,
              name,
              type,
              displayId,
              medications: (d.items || []).map(item => item.drugName || 'Drug').join(', '),
              time: d.dispensedAt || d.createdAt
            });
          } else {
             // Append medications
             const existing = byKey.get(key);
             const newMeds = (d.items || []).map(item => item.drugName || 'Drug').join(', ');
             if (newMeds) {
               existing.medications += existing.medications ? `, ${newMeds}` : newMeds;
             }
             if (new Date(d.dispensedAt || d.createdAt) > new Date(existing.time)) {
                existing.time = d.dispensedAt || d.createdAt;
             }
          }
        });

        const merged = Array.from(byKey.values()).sort(
          (a, b) => new Date(b.time) - new Date(a.time)
        );

        if (mounted) setEvents(merged);
      } catch (err) {
        console.error("AttendedToday: fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [refreshKey]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const enriched = useMemo(
    () =>
      events.map((e) => ({
        ...e,
        timeFormatted: e.time ? formatNigeriaTime(e.time) : "—",
      })),
    [events]
  );

  useEffect(() => { setPage(0); }, [query, enriched.length]);

  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? enriched.filter((d) =>
        [d?.name, d?.displayId, d?.medications].filter(Boolean).join(" ").toLowerCase().includes(q)
      )
    : enriched;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visible = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const handleView = (row) => {
    // Navigate to a view, e.g. receipt or drug dispensation. For now, we can just send them to the Drug Dispensation page to see the list of drugs.
    navigate(`/dashboard/pharmacist/drug-dispensation`);
  };

  return (
    <PharmacistLayout>
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <FaUserCheck size={22} className="text-[#00943C] flex-shrink-0" />
              <h1 className="text-xl sm:text-2xl font-bold text-[#00943C]">Attended Today</h1>
            </div>
            <p className="text-xs sm:text-sm text-base-content/60 mt-1">
              Patients and dependants dispensed drugs today by the pharmacy.
            </p>
          </div>

          {/* Search and Action Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-5">
            <div className="relative w-full sm:max-w-sm">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, ID, drug..."
                className="input input-bordered input-sm pl-9 w-full"
              />
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-start">
              {query && (
                <button onClick={() => setQuery("")} className="btn btn-ghost btn-sm flex-1 sm:flex-none">
                  Clear
                </button>
              )}
              <button onClick={onRefresh} className="btn btn-outline border-[#00943C] text-[#00943C] hover:bg-[#00943C] hover:text-white btn-sm sm:ml-auto w-full sm:w-auto">
                Refresh
              </button>
            </div>
          </div>

          {/* Card Container for Data */}
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            {/* Desktop Table Header */}
            {!loading && filteredItems.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-4">Drugs Dispensed</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-1 text-right">Action</div>
              </div>
            )}

            <div className="divide-y divide-base-200">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="p-4 md:px-5 md:py-4">
                    <div className="skeleton h-8 w-full rounded" />
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No patients attended yet"
                    description={query ? "No matches for your search." : "No drugs dispensed today."}
                    actionLabel={query ? "Clear search" : "Refresh"}
                    onAction={query ? () => setQuery("") : onRefresh}
                  />
                </div>
              ) : (
                visible.map((row) => (
                  <div key={row.id} className="p-4 md:px-5 md:py-4 hover:bg-base-200/40 transition-colors">
                    {/* Mobile View */}
                    <div className="block md:hidden space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-base-content truncate">{row.name}</p>
                          <span className="text-xs text-base-content/40 font-mono">{row.displayId}</span>
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-base-200 text-base-content/70 whitespace-nowrap">
                            {row.type}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm line-clamp-2">
                         <span className="font-semibold">Drugs: </span> {row.medications}
                      </div>
                      <div className="flex items-center justify-between gap-2 border-t border-base-200 pt-3">
                        <span className="text-xs font-medium text-base-content/60">{row.timeFormatted}</span>
                        <button
                          onClick={() => handleView(row)}
                          className="btn btn-sm btn-ghost text-primary px-3 h-8 min-h-0"
                        >
                          View
                        </button>
                      </div>
                    </div>

                    {/* Desktop View */}
                    <div className="hidden md:grid grid-cols-12 gap-2 items-center text-sm">
                      <div className="col-span-3 min-w-0 pr-2">
                        <p className="font-semibold text-base-content truncate">{row.name}</p>
                        <p className="text-xs text-base-content/50 font-mono mt-0.5 truncate">{row.displayId}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-base-200 text-base-content/70">
                          {row.type}
                        </span>
                      </div>
                      <div className="col-span-4 min-w-0 pr-2">
                         <p className="text-base-content/80 truncate" title={row.medications}>
                           {row.medications}
                         </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-base-content/70 font-medium">{row.timeFormatted}</span>
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          onClick={() => handleView(row)}
                          className="btn btn-sm btn-ghost hover:bg-[#00943C]/10 text-[#00943C]"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="p-4 border-t border-base-200 flex items-center justify-between">
                <span className="text-xs text-base-content/60">
                  Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, filteredItems.length)} of {filteredItems.length}
                </span>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={page === 0}
                    onClick={() => setPage(p => p - 1)}
                  >
                    «
                  </button>
                  <button className="join-item btn btn-sm bg-base-100">Page {page + 1}</button>
                  <button
                    className="join-item btn btn-sm"
                    disabled={page === totalPages - 1}
                    onClick={() => setPage(p => p + 1)}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PharmacistLayout>
  );
};

export default AttendedToday;
