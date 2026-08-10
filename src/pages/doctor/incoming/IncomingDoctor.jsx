import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { RiArrowLeftRightFill, RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { getPatients, getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getDependants, updateDependantStatus } from "@/services/api/dependantAPI";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";

const DOCTOR_STATUSES = new Set([
  "awaiting_consultation",
  "awaiting_doctor",
  "in_consultation",
  "consultation_completed",
  "awaiting_surgery",
  "lab_completed",
]);

const prettifyStatus = (status) =>
  (Array.isArray(status) ? status : [status])
    .filter((s) => DOCTOR_STATUSES.has(String(s).toLowerCase()))
    .map((s) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()))
    .join(", ");

const statusBadgeClass = (reason = "") => {
  const r = reason.toLowerCase();
  if (r.includes("completed")) return "badge-success";
  if (r.includes("in consultation")) return "badge-info";
  if (r.includes("awaiting")) return "badge-warning";
  if (r.includes("surgery")) return "badge-secondary";
  return "badge-neutral";
};

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

        // Fetch both in parallel
        const [patientsRes, dependantsRes] = await Promise.allSettled([
          getPatients(),
          getDependants(),
        ]);

        const patients = patientsRes.status === 'fulfilled'
          ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
          : [];

        const dependants = dependantsRes.status === 'fulfilled'
          ? (() => {
              const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
              return Array.isArray(raw) ? raw : (raw?.dependants ?? []);
            })()
          : [];

        // Map patients
        const mappedPatients = patients
          .filter((p) => {
            if (!p?.status) return false;
            const statuses = Array.isArray(p.status) ? p.status : [p.status];
            return statuses.some((s) => DOCTOR_STATUSES.has(String(s).toLowerCase()));
          })
          .map((p) => ({
            type: 'patient',
            id: p?.id || p?._id,
            subjectId: p?.id || p?._id,      // ID to use for status updates
            patientId: p?.id || p?._id,       // parent patient ID (for navigation)
            dependantId: null,
            hospitalId: p?.hospitalId,
            snapshot: p,
            name: `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
            displayId: p?.hospitalId || p?.id || "—",
            reason: prettifyStatus(p?.status) || "Consultation",
            rawStatus: (typeof p?.status === "string" ? p.status : "").toLowerCase(),
            updatedAt: p?.updatedAt ? formatNigeriaDateTime(p.updatedAt) : "—",
            gender: p?.gender || null,
            age: p?.dob || p?.dateOfBirth
              ? Math.floor((Date.now() - new Date(p.dob || p.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null,
            badge: null,
          }));

        // Map dependants
        const patientMap = new Map(patients.map(p => [p.id || p._id, p]));
        
        const mappedDependants = dependants
          .filter((d) => {
            if (!d?.status) return false;
            return DOCTOR_STATUSES.has(String(d.status).toLowerCase());
          })
          
          .map((d) => {
            const parentPatient = patientMap.get(d?.patientId);

            return {
            type: 'dependant',
            id: d?.id,
            subjectId: d?.id,
            patientId: d?.patientId,          // parent patient ID (for navigation)
            dependantId: d?.id,
            hospitalId: parentPatient?.hospitalId || null,
            snapshot: d,
            name: `${d?.firstName || ""} ${d?.lastName || ""}`.trim() || "Unknown",
            displayId: parentPatient?.hospitalId || d?.patientId || "—",
            reason: prettifyStatus(d?.status) || "Consultation",
            rawStatus: (typeof d?.status === "string" ? d.status : "").toLowerCase(),
            updatedAt: d?.updatedAt ? formatNigeriaDateTime(d.updatedAt) : "—",
            gender: d?.gender || null,
            age: d?.dob
              ? Math.floor((Date.now() - new Date(d.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
              : null,
            badge: d?.relationshipType || 'Dependant',
          }
        });

        const merged = [...mappedPatients, ...mappedDependants].sort(
          (a, b) =>
            new Date(a.snapshot?.updatedAt || a.snapshot?.createdAt || 0).getTime() -
            new Date(b.snapshot?.updatedAt || b.snapshot?.createdAt || 0).getTime()
        );

        if (mounted) setItems(merged);
      } catch (err) {
        console.error("IncomingDoctor: fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchIncoming();
    return () => { mounted = false; };
  }, [refreshKey]);

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'refreshIncoming') setRefreshKey((k) => k + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => { setPage(0); }, [query, items]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? items.filter((d) =>
        [d?.name, d?.displayId, d?.reason, d?.badge]
          .filter(Boolean).join(" ").toLowerCase().includes(q)
      )
    : items;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visible = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const handleView = async (data) => {
    if (!data.id || navigatingId === data.id) return;
    setNavigatingId(data.id);

    try {
      const isDependent = data.type === 'dependant';

      // Check if already in consultation
      if (!isDependent) {
        const latest = await getPatientById(data.patientId);
        const latestStatus = (latest?.data?.status ?? latest?.status ?? "").toString().toLowerCase();
        if (['in_consultation', 'in consultation'].some((v) => latestStatus.includes(v))) {
          alert("This patient is currently in consultation. Please pick another patient.");
          setNavigatingId(null);
          return;
        }
        await updatePatientStatus(data.patientId, { status: 'in_consultation' });
      } else {
        await updateDependantStatus(data.dependantId, { status: 'in_consultation' });
      }

      localStorage.setItem('refreshIncoming', Date.now().toString());

      navigate(`/dashboard/doctor/medical-history/${data.patientId}`, {
        state: {
          from: "incoming",
          patientSnapshot: data.snapshot,
          // key prop — PatientMedicalHistory reads this to scope to dependant
          dependantId: data.dependantId,
          dependantSnapshot: data.type === 'dependant' ? data.snapshot : null,
        },
      });
    } catch (err) {
      console.error("Failed to set status to in_consultation", err);
      setNavigatingId(null);
    }
  };

  const handleReset = async (data) => {
    try {
      if (data.type === 'dependant') {
        await updateDependantStatus(data.dependantId, { status: 'awaiting_consultation' });
      } else {
        await updatePatientStatus(data.patientId, { status: 'awaiting_consultation' });
      }
      localStorage.setItem('refreshIncoming', Date.now().toString());
      onRefresh();
    } catch (err) {
      console.error('Failed to reset status', err);
    }
  };

  return (
    <div className="flex h-screen">
       {loading && <KolakLoader fullscreen />}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex-1 p-4 sm:p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <RiArrowLeftRightFill size={24} className="text-primary" />
              <h1 className="text-2xl font-bold text-primary">Incoming</h1>
            </div>
            <p className="text-sm text-base-content/60 mt-1">
              Patients and dependants assigned and waiting for consultation.
            </p>
          </div>

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
              <button onClick={() => setQuery("")} className="btn btn-ghost btn-sm">Clear</button>
            )}
            <button onClick={onRefresh} className="btn btn-outline btn-sm ml-auto">Refresh</button>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            {!loading && filteredItems.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Updated At</div>
                <div className="col-span-2 text-right">Action</div>
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
                    <div className="col-span-2"><div className="skeleton h-4 w-20 rounded" /></div>
                    <div className="col-span-2"><div className="skeleton h-5 w-28 rounded-full" /></div>
                    <div className="col-span-2"><div className="skeleton h-4 w-20 rounded" /></div>
                    <div className="col-span-2 flex justify-end"><div className="skeleton h-8 w-16 rounded" /></div>
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No incoming patients"
                    description={query ? "No matches for your search." : "No incoming patients or dependants right now."}
                    actionLabel={query ? "Clear search" : "Refresh"}
                    onAction={query ? () => setQuery("") : onRefresh}
                  />
                </div>
              ) : (
                visible.map((data) => {
                  const isInConsultation = ['in_consultation', 'in consultation'].some((v) => data.rawStatus?.includes(v));
                  return (
                    <div key={`${data.type}-${data.id}`} className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-base-200/40 transition-colors">
                      
                      {/* Name */}
                      <div className="col-span-3 min-w-0">
                        <p className="font-bold text-base-content truncate">{data.name}</p>
                        {(data.age !== null || data.gender) && (
                          <p className="text-xs text-base-content/50 mt-0.5">
                            {[data.age !== null ? `Age: ${data.age}y` : null, data.gender ? `Gender: ${data.gender}` : null]
                              .filter(Boolean).join(" · ")}
                          </p>
                        )}
                      </div>

                      {/* Type badge */}
                      <div className="col-span-2">
                        {data.type === 'dependant' ? (
                          <div className="flex flex-col gap-1">
                            <span className="badge badge-sm badge-secondary capitalize">{data.badge || 'Dependant'}</span>
                            <span className="text-xs text-base-content/40 font-mono truncate">{data.displayId}</span>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className="badge badge-sm badge-primary">Patient</span>
                            <span className="text-xs text-base-content/40 font-mono">{data.displayId}</span>
                          </div>
                        )}
                      </div>

                      {/* Status */}
                      <div className="col-span-2">
                        <span className={`badge badge-sm ${statusBadgeClass(data.reason)}`}>{data.reason}</span>
                      </div>

                      {/* Updated at */}
                      <div className="col-span-2">
                        <span className="text-sm text-base-content/60">{data.updatedAt}</span>
                      </div>

                      {/* Action */}
                      <div className="col-span-2 flex justify-end">
                        {isInConsultation ? (
                          <div className="flex flex-col items-end gap-2">
                            <button
                              className="btn btn-xs btn-outline btn-warning w-full"
                              onClick={() => handleReset(data)}
                            >
                              ↺ Reset
                            </button>
                            <button className="btn btn-xs btn-disabled w-full" disabled>View</button>
                          </div>
                        ) : (
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={navigatingId === data.id}
                            onClick={() => handleView(data)}
                          >
                            {navigatingId === data.id
                              ? <span className="loading loading-spinner loading-xs" />
                              : 'View'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {!loading && filteredItems.length > pageSize && (
            <div className="mt-5 flex items-center justify-between">
              <span className="text-sm text-base-content/50">
                Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredItems.length)} of {filteredItems.length}
              </span>
              <div className="flex items-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                  <RiArrowLeftSLine size={18} />
                </button>
                <span className="text-sm font-medium">{page + 1} / {totalPages}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
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