import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, EmptyState, DataTable } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { RiSearchLine } from 'react-icons/ri';
import { getPatients } from '@/services/api/patientsAPI';

const AllPatients = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchAll = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const filtered = patients.filter((p) => (p?.status || '').toLowerCase() === 'awaiting_consultation');
        const sorted = filtered.sort((a, b) => {
          const at = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
          const bt = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
          return bt - at;
        });
        const mapped = sorted.map((p, idx) => ({
          sn: String(idx + 1).padStart(2, '0'),
          id: p?.id,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.fullName || 'Unknown',
          patientId: p?.hospitalId || p?.id || '—',
          insurance: p?.hmos?.provider || '—',
          gender: p?.gender || '—',
          phone: p?.phone || p?.phoneNumber || '—',
          status: (p?.status || '').replace(/_/g, ' '),
          registered: p?.createdAt ? new Date(p.createdAt).toLocaleDateString('en-US') : '—',
        }));
        if (mounted) setItems(mapped);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchAll();
    return () => { mounted = false; };
  }, []);

  useEffect(() => { setPage(0); }, [query, items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = items; // already filtered to awaiting_consultation
    if (!q) return base;
    return base.filter((d) => [d.name, d.patientId, d.insurance, d.gender, d.phone, d.status].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [items, query]);

  const start = page * pageSize;
  const end = start + pageSize;
  const visible = filtered.slice(start, end);

  const columns = useMemo(() => ([
    { key: 'sn', title: 'S/n', className: 'text-base-content/70' },
    { key: 'name', title: 'Patient Name', className: 'font-medium text-base-content', render: (value, row) => (
      <button className="text-primary hover:underline text-sm" onClick={(e) => { e.preventDefault(); e.stopPropagation(); row.id && navigate(`/dashboard/doctor/medical-history/${row.id}`, { state: { from: 'patients', patientSnapshot: row.snapshot } }); }}>{value}</button>
    ) },
    { key: 'patientId', title: 'Patient ID', className: 'text-base-content/70' },
    { key: 'gender', title: 'Gender', className: 'text-base-content/70' },
    { key: 'phone', title: 'Phone', className: 'text-base-content/70' },
    { key: 'insurance', title: 'Insurance', className: 'text-base-content/70' },
    { key: 'registered', title: 'Registered', className: 'text-base-content/70' },
    { key: 'status', title: 'Status', className: 'text-base-content/70' },
    { key: '__action', title: '', className: 'text-right', render: (_, row) => (
      <button className="btn btn-ghost btn-xs text-primary" onClick={() => row.id && navigate(`/dashboard/doctor/medical-history/${row.id}`, { state: { from: 'patients', patientSnapshot: row.snapshot } })}>View Details</button>
    ) },
  ]), [navigate]);

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-100">
        <Header onToggleSidebar={toggleSidebar} />
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <section>
            <div>
              <div>
                <div className="flex items-center gap-5 ">
                  <h1 className="text-[32px] text-primary ">All Patients</h1>
                </div>
                <p className="text-[12px] text-base-content/70">View the list of all Patients.</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2">
              <div className="relative w-full max-w-xs">
                <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patients" className="input input-bordered input-sm pl-9 w-full" />
              </div>
              {query && (
                <button onClick={() => setQuery('')} className="btn btn-ghost btn-xs">Clear</button>
              )}
            </div>

            <div className="mt-6">
              {loading ? (
                <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                  <div className="overflow-auto max-h-64 p-4 space-y-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton h-8 w-full" />
                    ))}
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <EmptyState title="No patients found" description="Try a different search or refresh." actionLabel="Refresh" onAction={() => setQuery('')} />
              ) : (
                <DataTable
                  data={visible}
                  columns={columns}
                  searchable={false}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={pageSize}
                  maxHeight="max-h-64 sm:max-h-94 md:max-h-84 2xl:max-h-110"
                  showEntries={true}
                />
              )}
            </div>

            {(() => {
              const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
              if (!loading && filtered.length > pageSize) {
                return (
                  <div className="mt-6 flex items-center justify-center gap-3">
                    <button className="btn btn-ghost btn-xs" aria-label="Prev" onClick={() => setPage((p) => Math.max(0, p - 1))}>Prev</button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button key={i} onClick={() => setPage(i)} aria-label={`Go to page ${i + 1}`} className={`w-3 h-3 rounded-full ${i === page ? 'bg-success' : 'border border-base-300 bg-transparent'}`} />
                      ))}
                    </div>
                    <button className="btn btn-ghost btn-xs" aria-label="Next" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}>Next</button>
                  </div>
                );
              }
              return null;
            })()}
          </section>
        </div>
      </div>
    </div>
  );
};

export default AllPatients;
