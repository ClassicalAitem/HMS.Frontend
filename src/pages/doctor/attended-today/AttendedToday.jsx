import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { FaUserCheck } from "react-icons/fa";
import { RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { getConsultations } from "@/services/api/consultationAPI";
import { getAllAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { getPatientById } from "@/services/api/patientsAPI";
import { getDependantById } from "@/services/api/dependantAPI";
import { useAppSelector } from "@/store/hooks";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";

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

// Works for both consultation and antenatal record shapes
const getRecordDoctorId = (r) =>
  r?.doctorId && typeof r.doctorId === "object"
    ? r.doctorId.id || r.doctorId._id
    : r?.doctorId || r?.doctor?.id || r?.doctor?._id || r?.createdBy?.id || r?.createdBy?._id;

const AttendedToday = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const doctorId = user?.id || user?._id;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]); // normalized, deduped
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [resolved, setResolved] = useState({});
  const pageSize = 10;

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    if (!doctorId) return;
    let mounted = true;

    const load = async () => {
      try {
        setLoading(true);

        const [consultRes, antenatalRes] = await Promise.allSettled([
          getConsultations(),
          getAllAnteNatalRecords(),
        ]);

        const consultations = consultRes.status === "fulfilled"
          ? (() => {
              const raw = consultRes.value?.data ?? consultRes.value ?? [];
              return Array.isArray(raw) ? raw : raw?.data ?? [];
            })()
          : [];

        const antenatalRecords = antenatalRes.status === "fulfilled"
          ? (() => {
              const raw = antenatalRes.value?.data ?? antenatalRes.value ?? [];
              if (Array.isArray(raw)) return raw;
              if (Array.isArray(raw?.anteNatalRecords)) return raw.anteNatalRecords;
              if (Array.isArray(raw?.data)) return raw.data;
              return [];
            })()
          : [];

        // Normalize both into a common event shape
        const consultEvents = consultations
          .filter((c) => String(getRecordDoctorId(c)) === String(doctorId) && isToday(c?.createdAt))
          .map((c) => ({
            source: "Consultation",
            patientId: c.patientId,
            dependantId: c.dependantId || null,
            createdAt: c.createdAt,
            diagnosis: c?.diagnosis || "—",
          }));

        const antenatalEvents = antenatalRecords
          .filter((r) => String(getRecordDoctorId(r)) === String(doctorId) && isToday(r?.createdAt))
          .map((r) => ({
            source: "Antenatal",
            patientId: r.patientId,
            dependantId: r.dependantId || null,
            createdAt: r.createdAt,
            diagnosis: "Antenatal visit",
          }));

        const allEvents = [...consultEvents, ...antenatalEvents];

        // Dedupe per patient/dependant, keep the most recent event, note if both happened
        const byKey = new Map();
        allEvents.forEach((e) => {
          const key = e.dependantId ? `dep-${e.dependantId}` : `pat-${e.patientId}`;
          const existing = byKey.get(key);
          if (!existing || new Date(e.createdAt) > new Date(existing.createdAt)) {
            byKey.set(key, { ...e, sources: existing ? [...existing.sources, e.source] : [e.source] });
          } else {
            existing.sources = [...new Set([...existing.sources, e.source])];
          }
        });

        const merged = Array.from(byKey.values()).sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
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
  }, [refreshKey, doctorId]);

  // Resolve display names
  useEffect(() => {
    if (!events.length) return;
    let mounted = true;

    const resolveNames = async () => {
      const updates = {};
      for (const e of events) {
        const key = e.dependantId ? `dep-${e.dependantId}` : `pat-${e.patientId}`;
        if (resolved[key]) continue;

        try {
          if (e.dependantId) {
            const res = await getDependantById(e.dependantId);
            const dep = res?.data?.data?.dependant || res?.data?.dependant || res?.data || {};
            updates[key] = {
              name: `${dep?.firstName || ""} ${dep?.lastName || ""}`.trim() || "Unknown",
              type: "Dependant",
              displayId: dep?.hospitalId || e.patientId,
            };
          } else {
            const res = await getPatientById(e.patientId);
            const p = res?.data ?? res;
            updates[key] = {
              name: p?.fullName || `${p?.firstName || ""} ${p?.lastName || ""}`.trim() || "Unknown",
              type: "Patient",
              displayId: p?.hospitalId || e.patientId,
            };
          }
        } catch {
          updates[key] = { name: "Unknown", type: e.dependantId ? "Dependant" : "Patient", displayId: e.patientId };
        }
      }
      if (mounted && Object.keys(updates).length) {
        setResolved((prev) => ({ ...prev, ...updates }));
      }
    };

    resolveNames();
    return () => { mounted = false; };
  }, [events]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const enriched = useMemo(
    () =>
      events.map((e) => {
        const key = e.dependantId ? `dep-${e.dependantId}` : `pat-${e.patientId}`;
        const info = resolved[key] || {};
        return {
          id: key,
          patientId: e.patientId,
          dependantId: e.dependantId,
          name: info.name || "Loading…",
          type: info.type || (e.dependantId ? "Dependant" : "Patient"),
          displayId: info.displayId || e.patientId,
          diagnosis: e.diagnosis,
          sources: e.sources,
          time: e.createdAt ? formatNigeriaTime(e.createdAt) : "—",
        };
      }),
    [events, resolved]
  );

  useEffect(() => { setPage(0); }, [query, enriched.length]);

  const q = query.trim().toLowerCase();
  const filteredItems = q
    ? enriched.filter((d) =>
        [d?.name, d?.displayId, d?.diagnosis].filter(Boolean).join(" ").toLowerCase().includes(q)
      )
    : enriched;

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const visible = filteredItems.slice(page * pageSize, (page + 1) * pageSize);

  const handleView = (row) => {
    navigate(`/dashboard/doctor/medical-history/${row.patientId}`, {
      state: { from: "attended-today", dependantId: row.dependantId },
    });
  };

  return (
    <div className="flex h-screen">
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
              <FaUserCheck size={22} className="text-primary" />
              <h1 className="text-2xl font-bold text-primary">Attended Today</h1>
            </div>
            <p className="text-sm text-base-content/60 mt-1">
              Patients and dependants you've seen today (consultations & antenatal).
            </p>
          </div>

          <div className="flex items-center gap-3 mb-5">
            <div className="relative w-full max-w-sm">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, ID, diagnosis..."
                className="input input-bordered input-sm pl-9 w-full"
              />
            </div>
            {query && <button onClick={() => setQuery("")} className="btn btn-ghost btn-sm">Clear</button>}
            <button onClick={onRefresh} className="btn btn-outline btn-sm ml-auto">Refresh</button>
          </div>

          <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
            {!loading && filteredItems.length > 0 && (
              <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 border-b border-base-200 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                <div className="col-span-3">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-2">Visit</div>
                <div className="col-span-2">Diagnosis</div>
                <div className="col-span-1">Time</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
            )}

            <div className="divide-y divide-base-200">
              {loading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 px-5 py-4 items-center">
                    <div className="col-span-3"><div className="skeleton h-4 w-36 rounded" /></div>
                    <div className="col-span-2"><div className="skeleton h-4 w-20 rounded" /></div>
                    <div className="col-span-2"><div className="skeleton h-4 w-20 rounded" /></div>
                    <div className="col-span-2"><div className="skeleton h-4 w-28 rounded" /></div>
                    <div className="col-span-1"><div className="skeleton h-4 w-16 rounded" /></div>
                    <div className="col-span-2 flex justify-end"><div className="skeleton h-8 w-16 rounded" /></div>
                  </div>
                ))
              ) : filteredItems.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    title="No patients attended yet"
                    description={query ? "No matches for your search." : "You haven't seen any patients today."}
                    actionLabel={query ? "Clear search" : "Refresh"}
                    onAction={query ? () => setQuery("") : onRefresh}
                  />
                </div>
              ) : (
                visible.map((row) => (
                  <div key={row.id} className="grid grid-cols-12 gap-2 px-5 py-4 items-center hover:bg-base-200/40 transition-colors">
                    <div className="col-span-3 min-w-0">
                      <p className="font-bold text-base-content truncate">{row.name}</p>
                      <span className="text-xs text-base-content/40 font-mono">{row.displayId}</span>
                    </div>
                    <div className="col-span-2">
                      <span className={`badge badge-sm ${row.type === "Dependant" ? "badge-secondary" : "badge-primary"}`}>
                        {row.type}
                      </span>
                    </div>
                    <div className="col-span-2 flex flex-wrap gap-1">
                      {row.sources.map((s) => (
                        <span key={s} className={`badge badge-xs ${s === "Antenatal" ? "badge-accent" : "badge-info"}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                    <div className="col-span-2">
                      <span className="text-sm text-base-content/70 truncate">{row.diagnosis}</span>
                    </div>
                    <div className="col-span-1">
                      <span className="text-sm text-base-content/60">{row.time}</span>
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button className="btn btn-sm btn-primary" onClick={() => handleView(row)}>View</button>
                    </div>
                  </div>
                ))
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

export default AttendedToday;