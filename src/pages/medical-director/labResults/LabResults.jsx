import React, { useEffect, useMemo, useState } from 'react';
import { Header, EmptyState, DataTable } from "@/components/common";
import Sidebar from "@/components/doctor/dashboard/Sidebar";
import { FaDownload } from 'react-icons/fa';
import { getLabResults } from '@/services/api/labResultsAPI';
import { getPatients } from '@/services/api/patientsAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { LabResultDetailsModal } from '@/components/modals';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';

const LabResults = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [labResults, setLabResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patientsById, setPatientsById] = useState({});
  const [dependantCache, setDependantCache] = useState({});
  const [hospitalIdsById, setHospitalIdsById] = useState({});
  const [patientsStatusById, setPatientsStatusById] = useState({});
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedLabId, setSelectedLabId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getLabResults();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const mapped = list.map((r) => ({
          id: r?._id || r?.id,
          labId: r?.form?.labNo || r?._id || r?.id,
          patientId: r?.patientId,
          dependantId: r?.dependantId || null,
          raw: r,
          testType:
            (Array.isArray(r?.result) && r.result[0]?.code) ||
            (Array.isArray(r?.result) && r.result[0]?.value) ||
            '—',
          date: r?.createdAt ? formatNigeriaDate(r.createdAt) : '—',
          time: r?.createdAt ? formatNigeriaTime(r.createdAt) : '—',
          doctor: r?.form?.referral || '—',
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
        const patientMap = {};
        const hospMap = {};
        const statusMap = {};
        list.forEach((p) => {
          const idKeys = [p?.id, p?.patientId, p?.hospitalId, p?._id].filter(Boolean);
          idKeys.forEach((k) => {
            patientMap[k] = p;
            if (p?.hospitalId) hospMap[k] = p.hospitalId;
            statusMap[k] = p?.status || p?.patientStatus || '';
          });
        });
        setPatientsById(patientMap);
        setHospitalIdsById(hospMap);
        setPatientsStatusById(statusMap);
      } catch {
        setPatientsById({});
      }
    };
    fetchPatients();
  }, []);

  // Fetch dependants on-demand
  useEffect(() => {
    const dependantIdsNeeded = labResults
      .filter((r) => r?.dependantId && dependantCache[r.dependantId] === undefined)
      .map((r) => r.dependantId)
      .filter((id, index, arr) => arr.indexOf(id) === index);

    if (dependantIdsNeeded.length === 0) return;

    const fetchMissing = async () => {
      for (const dependantId of dependantIdsNeeded) {
        try {
          const res = await getDependantById(dependantId);
           const dep =
           res?.data?.data?.dependant ??
           res?.data?.dependant ??
            res?.dependant ??
            res;
          setDependantCache((prev) => ({ ...prev, [dependantId]: dep }));
        } catch (err) {
          console.error(`Failed to load dependant ${dependantId}:`, err);
          setDependantCache((prev) => ({ ...prev, [dependantId]: null }));
        }
      }
    };
    fetchMissing();
  }, [labResults], dependantCache);

  const toggleSidebar = () => setIsSidebarOpen((p) => !p);
  const closeSidebar = () => setIsSidebarOpen(false);

  const columns = useMemo(() => [
    {
      key: 'patientName',
      title: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span
            className={`badge badge-sm ${
              row.patientType === 'Dependant'
                ? 'badge-warning badge-outline'
                : 'badge-outline'
            }`}
          >
            {row.patientType}
          </span>
          <span className="font-medium">{row.patientName}</span>
        </div>
      ),
    },
    { key: 'hospitalId', title: 'Hospital ID', sortable: true, className: 'text-base-content/70' },
    { key: 'date', title: 'Date', sortable: true, className: 'text-base-content/70' },
    { key: 'time', title: 'Time', sortable: true, className: 'text-base-content/70' },
    { key: 'status', title: 'Status', sortable: true, className: 'text-base-content/70' },
  ], []);

const resolvedData = useMemo(() => {
  return labResults.map((r) => {
    const isDependant = !!r.dependantId;
    const dependant = dependantCache[r.dependantId];

    // DEFAULTS
    let patientName = 'Unknown';
    let hospitalId = r.patientId;
    let patientType = isDependant ? 'Dependant' : 'Patient';

   if (isDependant) {
  const dependant = dependantCache[r.dependantId];

  if (dependant === undefined) {
    patientName = 'Loading...';
  } else if (dependant === null) {
    patientName = 'Unknown Dependant';
  } else {
    patientName =
      `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() ||
      'Unknown Dependant';

    hospitalId =
      dependant?.patient?.hospitalId ||
      patientsById[dependant?.patientId]?.hospitalId ||
      hospitalIdsById[r.patientId] ||
      r.patientId;
  }
} else {
      const patient = patientsById[r.patientId];

      if (patient) {
        patientName =
          `${patient.firstName || ''} ${patient.lastName || ''}`.trim() ||
          patient.fullName ||
          'Unknown';

        hospitalId =
          patient.hospitalId ||
          hospitalIdsById[r.patientId] ||
          r.patientId;
      }
    }

    return {
      ...r,
      patientName,
      patientType,
      hospitalId,
    };
  });
}, [labResults, patientsById, dependantCache, hospitalIdsById]);
  const filteredData = useMemo(() => {
    const excluded = new Set(['awaiting_cashier', 'awaiting_pharmacy']);

    return resolvedData.filter((r) => {
      // For status filtering: always check the parent patient's status
      // For dependants, r.patientId is still the parent patient's ID
      const status = patientsStatusById[r.patientId] || '';
      if (excluded.has(status)) return false;

      // Search filter
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (r.patientName || '').toLowerCase().includes(q) ||
        (r.testType || '').toLowerCase().includes(q) ||
        (r.hospitalId || '').toLowerCase().includes(q)
      );
    });
  }, [resolvedData, patientsStatusById, searchQuery]);

  const handleExport = () => {
    const header = ['Patient Name', 'Patient Type', 'Hospital ID', 'Date', 'Time', 'Status'];
    const rows = filteredData.map((r) => [
      r.patientName, r.patientType, r.hospitalId,
      r.testType, r.date, r.time, r.doctor, r.status,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
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

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
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
            <input
              className="input input-bordered w-full sm:w-96"
              placeholder="Search by Patient, Hospital ID or Test"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {loading ? (
                  <div>
                    <div className="skeleton h-6 w-40 mb-3" />
                    <div className="space-y-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="grid grid-cols-7 gap-3">
                          {Array.from({ length: 7 }).map((__, j) => (
                            <div key={j} className="skeleton h-4 w-full" />
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={filteredData}
                    columns={columns}
                    searchable={false}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={10}
                    maxHeight="max-h-64 sm:max-h-84 2xl:max-h-110"
                    showEntries={true}
                    onRowClick={(row) => {
                      const id = row?.id || row?.labId;
                      if (id) window.location.href = `/dashboard/medical-director/labResults/${id}`;
                    }}
                  />
                )}
              </div>
            </div>
          </div>
         
        </div>
      </div>
    </div>
  );
};

export default LabResults;