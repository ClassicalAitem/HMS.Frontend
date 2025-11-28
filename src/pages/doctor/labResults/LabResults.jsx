import React, { useEffect, useMemo, useState } from 'react';
import { Header, EmptyState, DataTable } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { FaDownload } from 'react-icons/fa';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getPatients } from '@/services/api/patientsAPI';
import { LabResultDetailsModal } from '@/components/modals';

const LabResults = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(true);
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientsById, setPatientsById] = useState({});
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getLabResults();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const mapped = list.map((r) => ({
          id: r?._id || r?.id,
          labId: r?._id || r?.id,
          patientId: r?.patientId,
          testType: (Array.isArray(r?.result) && r.result[0]?.code) || (Array.isArray(r?.result) && r.result[0]?.value) || '—',
          date: r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
          time: r?.createdAt ? new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          doctor: '—',
          status: 'Completed',
        }));
        setLabResults(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await getPatients();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const map = {};
        list.forEach((p) => {
          const name = `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || p?.fullName || 'Unknown';
          const idKeys = [p?.id, p?.patientId, p?.hospitalId, p?._id].filter(Boolean);
          idKeys.forEach((k) => { map[k] = name; });
        });
        setPatientsById(map);
      } catch {
        setPatientsById({});
      }
    };
    fetchPatients();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const columns = useMemo(() => [
    { key: 'labId', title: 'Lab ID', sortable: true, className: 'text-base-content font-medium' },
    { key: 'patientName', title: 'Patient Name', sortable: true, className: 'text-base-content font-medium' },
    { key: 'patientId', title: 'Patient ID', sortable: true, className: 'text-base-content/70' },
    { key: 'testType', title: 'Test Type', sortable: true, className: 'text-base-content/70' },
    { key: 'date', title: 'Date', sortable: true, className: 'text-base-content/70' },
    { key: 'time', title: 'Time', sortable: true, className: 'text-base-content/70' },
    { key: 'doctor', title: 'Doctor', sortable: true, className: 'text-base-content/70' },
    { key: 'status', title: 'Status', sortable: true, className: 'text-base-content/70' },
  ], []);

  const resolvedData = useMemo(() => labResults.map(r => ({
    ...r,
    patientName: patientsById[r.patientId] || r.patientName || 'Unknown',
  })), [labResults, patientsById]);

  const handleExport = () => {
    const header = ['Lab ID','Patient Name','Patient ID','Test Type','Date','Time','Doctor','Status'];
    const rows = labResults.map(r => [r.labId, r.patientName, r.patientId, r.testType, r.date, r.time, r.doctor, r.status]);
    const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lab_results_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          <div className="flex flex-col gap-4 mb-6 sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-base-content 2xl:text-3xl">Lab Results</h1>
              <p className="text-sm text-base-content/60 2xl:text-base">View and manage lab results</p>
            </div>
            <button className="btn btn-outline btn-sm 2xl:btn-md" onClick={handleExport}>
              <FaDownload className="w-4 h-4 mr-2" />
              Export
            </button>
          </div>

          <div className="flex gap-3 items-center mb-4">
            <input className="input input-bordered w-full sm:w-96" placeholder="Search by Patient or Test" onChange={(e) => {
              const q = e.target.value.toLowerCase();
              setLabResults((prev) => prev.map(r => ({ ...r, __hidden: !( (patientsById[r.patientId]?.toLowerCase?.() || r.patientName?.toLowerCase?.() || '').includes(q) || (r.testType || '').toLowerCase().includes(q)) })));
            }} />
          </div>

          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {loading ? (
                  <div>
                    <div className="skeleton h-6 w-40 mb-3" />
                    <div className="space-y-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-8 gap-3">
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                          <div className="skeleton h-4 w-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={resolvedData.filter(r => !r.__hidden)}
                    columns={columns}
                    searchable={false}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={10}
                    maxHeight="max-h-64 sm:max-h-84 2xl:max-h-110"
                    showEntries={true}
                    onRowClick={(row) => { const id = row?.id || row?.labId; if (id) { window.location.href = `/dashboard/doctor/labResults/${id}`; } }}
                  />
                )}
              </div>
            </div>
          </div>
          {false && (<LabResultDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} labResultId={selectedLabId} />)}
        </div>
      </div>
    </div>
  );
};

export default LabResults;
