import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { RiArrowLeftRightFill, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { getPatients, getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";

const IncomingDoctor = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [navigatingId, setNavigatingId] = useState(null);
  const pageSize = 10;

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];

        const doctorStatuses = new Set([
          "awaiting_consultation",
          "awaiting_doctor",
          "in_consultation",
          "consultation_completed",
          "awaiting_surgery",
          "lab_completed",
        ]);

        const filtered = patients.filter((p) => {
          if (!p?.status) return false;
          const statuses = Array.isArray(p.status) ? p.status : [p.status];
          return statuses.some((s) => doctorStatuses.has(String(s).toLowerCase()));
        });

        const sorted = filtered.sort(
          (a, b) =>
            new Date(b?.updatedAt || b?.createdAt || 0).getTime() -
            new Date(a?.updatedAt || a?.createdAt || 0).getTime()
        );

        const prettifyStatus = (arr) =>
          (Array.isArray(arr) ? arr : [arr])
            .filter((s) => doctorStatuses.has(String(s).toLowerCase()))
            .map((s) =>
              s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
            )
            .join(", ");

        const mapped = sorted.map((p) => ({
          id: p?.id || p?._id,
          hospitalId: p?.hospitalId,
          snapshot: p,
          name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
          patientId: p?.hospitalId || p?.id || "—",
          reason: prettifyStatus(p?.status) || "Consultation",
          insurance: p?.hmos?.provider || "—",
          rawStatus: (typeof p?.status === "string" ? p.status : "").toLowerCase(),
          registered: p?.createdAt
            ? new Date(p.createdAt).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })
            : "—",
          gender: p?.gender || null,
          age:
            p?.dateOfBirth || p?.dob
              ? Math.floor(
                  (Date.now() -
                    new Date(p.dateOfBirth || p.dob).getTime()) /
                    (365.25 * 24 * 60 * 60 * 1000)
                )
              : null,
        }));

        if (mounted) setItems(mapped);
      } catch (err) {
        console.error("Doctor Incoming: patients fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncoming();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  // Listen for refresh triggers from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'refreshIncoming') {
        setRefreshKey((k) => k + 1);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);


  useEffect(() => {
    setPage(0);
  }, [query, items]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const statusBadgeClass = (reason = "") => {
    const r = reason.toLowerCase();
    if (r.includes("completed")) return "badge-success";
    if (r.includes("in consultation")) return "badge-info";
    if (r.includes("awaiting")) return "badge-warning";
    if (r.includes("surgery")) return "badge-error";
    return "badge-neutral";
  };

  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? items.filter((d) =>
        [d?.name, d?.patientId, d?.reason, d?.insurance]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
    : items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visible = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

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
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 h-full">

          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <RiArrowLeftRightFill size={24} className="text-primary" />
              <h1 className="text-2xl font-bold text-primary">Incoming</h1>
            </div>
            <p className="text-sm text-base-content/60 mt-1">
              Patients assigned and waiting for consultation.
            </p>
          </div>

          {/* Search + Refresh */}
          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-full max-w-sm">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, ID, status..."
                className="input input-bordered input-sm pl-9 w-full"
              />
            </div>
            {query && (
              <button onClick={() => setQuery("")} className="btn btn-ghost btn-sm">
                Clear
              </button>
            )}
            <button
              onClick={onRefresh}
              className="btn btn-outline btn-sm ml-auto"
            >
              Refresh
            </button>
          </div>

          {/* Table */}
          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">

            {/* Column Headers */}
            {!loading && filteredItems.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-3">Patient</div>
                <div className="col-span-2">Patient ID</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Registered</div>
                  <div className="col-span-2 text-right">Action</div> 
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
              ) : filteredItems.length === 0 ? (
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
              ) : (
                visible.map((data) => (
                  <div
                    key={data.id}
                    className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-base-200/40 transition-colors"
                  >
                    {/* Name */}
                    <div className="col-span-3 min-w-0">
                      <p className="font-bold text-base-content truncate">
                        {data.name}
                      </p>
                      {(data.age !== null || data.gender) && (
                        <p className="text-xs text-base-content/50 mt-0.5">
                          {[data.age !== null ? `Age:  ${data.age}y` : null, `Gender: ${data.gender}`]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      )}
                    </div>

                    {/* Patient ID */}
                    <div className="col-span-2">
                      <span className="text-sm font-mono text-base-content/70">
                        {data.patientId}
                      </span>
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <span className={`badge badge-sm ${statusBadgeClass(data.reason)}`}>
                        {data.reason}
                      </span>
                    </div>

                 

                    {/* Registered */}
                    <div className="col-span-2">
                      <span className="text-sm text-base-content/60">
                        {data.registered}
                      </span>
                    </div>

                 
               
{/* Action — col-span-2 */}
<div className="col-span-2 flex justify-end">
  {['in_consultation', 'in consultation'].some((v) => data.rawStatus?.includes(v)) ? (
    // ✅ Stack vertically, no overflow
    <div className="flex flex-col items-end gap-5">
      <button
        className="btn btn-xs btn-outline btn-warning w-full"
        onClick={async () => {
          try {
            await updatePatientStatus(data.id, { status: 'awaiting_consultation' });
            localStorage.setItem('refreshIncoming', Date.now().toString());
            onRefresh();
          } catch (err) {
            console.error('Failed to reset patient status', err);
          }
        }}
      >
        ↺ Reset
      </button>
      <button className="btn btn-xs btn-disabled w-full" disabled>
        View
      </button>
    </div>
  ) : (
    <button
      className="btn btn-sm btn-primary"
      disabled={navigatingId === data.id}
      onClick={async () => {
        if (!data.id) return;
        setNavigatingId(data.id);
        try {
          const latest = await getPatientById(data.id);
          const latestStatus = (latest?.data?.status ?? latest?.status ?? "").toString().toLowerCase();
          const isAlreadyInConsultation = ['in_consultation', 'in consultation'].some((v) => latestStatus.includes(v));
          if (isAlreadyInConsultation) {
            alert("This patient is currently in consultation. Please pick another patient.");
            setNavigatingId(null);
            return;
          }
          await updatePatientStatus(data.id, { status: 'in_consultation' });
          localStorage.setItem('refreshIncoming', Date.now().toString());
        } catch (err) {
          console.error("Failed to set patient status to in_consultation", err);
          setNavigatingId(null);
          return;
        }
        navigate(`/dashboard/doctor/medical-history/${data.id}`, {
          state: { from: "incoming", patientSnapshot: data.snapshot },
        });
      }}
    >
      {navigatingId === data.id
        ? <span className="loading loading-spinner loading-xs" />
        : 'View'
      }
    </button>
  )}
</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Pagination */}
          {!loading && filteredItems.length > pageSize && (
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-base-content/50">
                Showing {page * pageSize + 1}–
                {Math.min((page + 1) * pageSize, filteredItems.length)} of{" "}
                {filteredItems.length} patients
              </span>
              <div className="flex items-center gap-2">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <RiArrowLeftSLine size={18} />
                </button>
                <span className="text-sm font-medium">
                  {page + 1} / {totalPages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  <RiArrowRightSLine size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncomingDoctor;