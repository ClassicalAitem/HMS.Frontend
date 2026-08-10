import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getConsultations } from "@/services/api/consultationAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { RiSearchLine, RiArrowLeftSLine, RiArrowRightSLine } from "react-icons/ri";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import { FaClipboardList } from "react-icons/fa";

const PAGE_SIZE = 12;

const HmoConsultations = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [hmoPatientIds, setHmoPatientIds] = useState(new Set());
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [filterType, setFilterType] = useState("all"); // all | patient | dependant

  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      try {
        setLoading(true);

        const [consultRes, patientsRes] = await Promise.allSettled([
          getConsultations(),
          getPatients(),
        ]);

        // Build set of patient IDs that have HMO coverage
        const patients = patientsRes.status === 'fulfilled'
          ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
          : [];

        const coveredIds = new Set(
          patients
            .filter(p => Array.isArray(p.hmos) && p.hmos.length > 0)
            .map(p => p.id || p._id)
        );

        if (mounted) setHmoPatientIds(coveredIds);

        // Get all consultations
        const raw = consultRes.status === 'fulfilled'
          ? (() => {
              const d = consultRes.value?.data?.data ?? consultRes.value?.data ?? consultRes.value ?? [];
              return Array.isArray(d) ? d : (d?.consultations ?? []);
            })()
          : [];

        // Filter to only HMO-covered patients
        // A consultation is HMO-covered if:
        // 1. It has a dependantId (dependant consultation — always include since dependants use patient's HMO)
        // 2. The patientId is in the covered set (patient has HMO records)
        const filtered = raw.filter(c =>
          c.dependantId || coveredIds.has(c.patientId)
        );

        if (mounted) setConsultations(filtered);
      } catch (err) {
        console.error("HmoConsultations fetch error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { setPage(0); }, [query, filterType]);

  const filtered = useMemo(() => {
    let list = consultations;

    // Type filter
    if (filterType === 'patient') list = list.filter(c => !c.dependantId);
    if (filterType === 'dependant') list = list.filter(c => !!c.dependantId);

    // Search
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(c => [
        c.patient?.firstName, c.patient?.lastName,
        c.dependant?.firstName, c.dependant?.lastName,
        c.visitReason, c.diagnosis,
      ].filter(Boolean).join(' ').toLowerCase().includes(q));
    }

    return list;
  }, [consultations, query, filterType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const getSubjectName = (c) => {
    if (c.dependantId && c.dependant) {
      return `${c.dependant.firstName || ''} ${c.dependant.lastName || ''}`.trim();
    }
    return `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.trim() || '—';
  };

  return (
    <div className="flex min-h-screen w-full">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeSidebar} />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[82vw] max-w-[280px] transform transition-transform duration-300 ease-in-out lg:static lg:w-64 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-base-100">
        <Header onToggleSidebar={() => setIsSidebarOpen(v => !v)} />

        <div className="flex-1 overflow-y-auto p-3 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <FaClipboardList size={22} className="text-primary shrink-0 sm:size-6" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-primary sm:text-2xl">Consultations</h1>
              <p className="text-xs text-base-content/60 sm:text-sm">HMO-covered patient and dependant consultations</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="relative w-full sm:flex-1 sm:min-w-[200px] sm:max-w-sm">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search name, diagnosis, reason..."
                className="input input-bordered input-sm pl-9 w-full"
              />
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-start">
              <div className="flex gap-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'patient', label: 'Patient' },
                  { key: 'dependant', label: 'Dependant' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setFilterType(key)}
                    className={`btn btn-sm ${filterType === key ? 'btn-primary' : 'btn-ghost'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-base-content/50 sm:ml-auto sm:text-sm">
                {filtered.length} consultation{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="skeleton h-40 rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-base-content/50">
              <FaClipboardList size={48} className="mb-3 opacity-30" />
              <p className="text-lg font-medium">No consultations found</p>
              <p className="text-sm mt-1">{query ? 'Try a different search.' : 'No HMO-covered consultations yet.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {visible.map(c => {
                const isDependant = !!c.dependantId;
                const subjectName = getSubjectName(c);
                const patientName = `${c.patient?.firstName || ''} ${c.patient?.lastName || ''}`.trim();

                return (
                  <div
                    key={c.id}
                    onClick={() => navigate(`/dashboard/hmo/consultations/${c.id}`, {
                      state: { consultation: c }
                    })}
                    className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer"
                  >
                    <div className="card-body p-4">
                      {/* Subject header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            isDependant ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'
                          }`}>
                            {subjectName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{subjectName}</p>
                            {isDependant && (
                              <p className="text-xs text-base-content/50 truncate">
                                of {patientName}
                              </p>
                            )}
                          </div>
                        </div>
                        <span className={`badge badge-sm shrink-0 ${isDependant ? 'badge-secondary' : 'badge-primary'}`}>
                          {isDependant ? (c.dependant?.relationshipType || 'Dependant') : 'Patient'}
                        </span>
                      </div>

                      <div className="divider my-1" />

                      {/* Diagnosis */}
                      <div>
                        <p className="text-xs text-base-content/50 mb-0.5">Diagnosis</p>
                        <p className="text-sm font-medium text-base-content line-clamp-1">
                          {c.diagnosis || 'Pending'}
                        </p>
                      </div>

                      {/* Complaint */}
                      {c.complaint?.length > 0 && (
                        <div>
                          <p className="text-xs text-base-content/50 mb-0.5">Complaint</p>
                          <p className="text-sm text-base-content/80 line-clamp-1">
                            {c.complaint.map(cp => cp.symptom).filter(Boolean).join(', ') || '—'}
                          </p>
                        </div>
                      )}

                      {/* Visit reason + date */}
                      <div className="flex items-center justify-between mt-1 gap-2">
                        <span className="badge badge-ghost badge-sm capitalize truncate">
                          {c.visitReason || '—'}
                        </span>
                        <span className="text-xs text-base-content/40 shrink-0">
                          {c.createdAt ? formatNigeriaDate(c.createdAt) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs text-base-content/50 sm:text-sm">
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center justify-center gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
                  <RiArrowLeftSLine size={18} />
                </button>
                <span className="text-sm font-medium">{page + 1} / {totalPages}</span>
                <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
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

export default HmoConsultations;