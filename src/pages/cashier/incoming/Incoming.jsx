import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { Md6FtApart } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { getPatients, updatePatientStatus } from '@/services/api/patientsAPI';
import { getDependants, updateDependantStatus } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import KolakLoader from '@/components/common/KolakLoader';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { useNotifications } from '@/contexts/NotificationContext';
import ClearItemButton from '@/components/common/ClearIncomingButton';

const Incoming = () => {
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const patientsPerPage = 9;
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { refreshQueueCount } = useNotifications();

  const fetchIncoming = useCallback(async () => {
    try {
      setLoading(true);

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

      const statuses = new Set(['awaiting_cashier']);
      const matchesStatus = (p) => {
        const s = typeof p?.status === 'string' ? p.status.toLowerCase() : '';
        return statuses.has(s);
      };

      const patientMap = new Map(patients.map((p) => [p?.id, p]));

      const mappedPatients = patients
        .filter(matchesStatus)
        .map((p) => ({
          type: 'patient',
          id: p?.id,
          patientId: p?.id,
          dependantId: null,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          displayId: p?.hospitalId || p?.id || '—',
          photo: p?.profilePicture || p?.photo || 'https://randomuser.me/api/portraits/lego/1.jpg',
          gender: p?.gender || '—',
          phone: p?.phone || p?.phoneNumber || '—',
          insurance: Array.isArray(p?.hmos) && p.hmos.length > 0
            ? p.hmos.map(h => h.provider).filter(Boolean).join(', ')
            : 'Self-pay',
          registeredTime: p?.createdAt ? formatNigeriaTime(p.createdAt) : '—',
          updatedAt: p?.updatedAt || p?.createdAt,
          updatedAtDisplay: (p?.updatedAt || p?.createdAt)
            ? formatNigeriaDateTime(p?.updatedAt || p?.createdAt)
            : '—',
        }));

      const mappedDependants = dependants
        .filter(matchesStatus)
        .map((d) => {
          const parentPatient = patientMap.get(d?.patientId);
          return {
            type: 'dependant',
            id: d?.id,
            patientId: d?.patientId,
            dependantId: d?.id,
            snapshot: d,
            name: `${d?.firstName || ''} ${d?.lastName || ''}`.trim() || 'Unknown',
            badge: d?.relationshipType || 'Dependant',
            displayId: parentPatient?.hospitalId || d?.patientId || '—',
            photo: d?.profilePicture || d?.photo || 'https://randomuser.me/api/portraits/lego/1.jpg',
            gender: d?.gender || '—',
            phone: parentPatient?.phone || parentPatient?.phoneNumber || '—',
            insurance: Array.isArray(parentPatient?.hmos) && parentPatient.hmos.length > 0
              ? parentPatient.hmos.map(h => h.provider).filter(Boolean).join(', ')
              : 'Self-pay',
            registeredTime: d?.createdAt ? formatNigeriaTime(d.createdAt) : '—',
            updatedAt: d?.updatedAt || d?.createdAt,
            updatedAtDisplay: (d?.updatedAt || d?.createdAt)
              ? formatNigeriaDateTime(d?.updatedAt || d?.createdAt)
              : '—',
          };
        });

      setIncomingPatients([...mappedPatients, ...mappedDependants]);
    } catch (err) {
      setIncomingPatients([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIncoming();
  }, [fetchIncoming]);

  const processedPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();
    const start = (() => {
      if (dateFilter === 'today') {
        const nowNigeria = new Date(now.getTime() + 60 * 60 * 1000);
        nowNigeria.setUTCHours(0, 0, 0, 0);
        return nowNigeria.getTime() - 60 * 60 * 1000;
      }
      if (dateFilter === 'week') {
        return now.getTime() - 7 * 24 * 60 * 60 * 1000;
      }
      if (dateFilter === 'month') {
        return now.getTime() - 30 * 24 * 60 * 60 * 1000;
      }
      return 0;
    })();

    const filtered = incomingPatients.filter((p) => {
      const matches = !q || p.name.toLowerCase().includes(q) || String(p.displayId).toLowerCase().includes(q) || String(p.phone || '').toLowerCase().includes(q);
      const ts = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
      const inRange = dateFilter === 'all' ? true : ts >= start;
      return matches && inRange;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'desc' ? -cmp : cmp;
      }
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return sortOrder === 'desc' ? bt - at : at - bt;
    });

    return sorted;
  }, [incomingPatients, searchQuery, dateFilter, sortField, sortOrder]);

  const totalPages = Math.ceil(processedPatients.length / patientsPerPage);
  const startIndex = (currentPage - 1) * patientsPerPage;
  const endIndex = startIndex + patientsPerPage;
  const currentPatients = processedPatients.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleViewDetails = (patient) => {
    const id = patient?.patientId || patient?.id;
    if (!id) return;
    navigate(`/cashier/patient-details/${id}`, {
      state: {
        from: 'incoming',
        patientSnapshot: patient.type === 'dependant' ? null : patient?.snapshot,
        dependantId: patient.dependantId,
        dependantSnapshot: patient.type === 'dependant' ? patient?.snapshot : null,
      },
    });
  };

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
    <CashierLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="mb-8">
        <div className="flex items-center mb-4 space-x-3">
          <Md6FtApart className="w-5 h-5 text-primary" />
          <h1 className="text-3xl font-normal text-primary 2xl:text-4xl">Incoming</h1>
        </div>
        <p className="text-sm text-base-content/70 2xl:text-base">Check out the patient sent to you.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => { setCurrentPage(1); setSearchQuery(e.target.value); }}
          placeholder="Search by name or ID"
          className="input input-bordered w-full max-w-xs"
        />
        <select
          className="select select-bordered"
          value={dateFilter}
          onChange={(e) => { setCurrentPage(1); setDateFilter(e.target.value); }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <select
          className="select select-bordered"
          value={sortField}
          onChange={(e) => { setCurrentPage(1); setSortField(e.target.value); }}
        >
          <option value="date">Sort by Date</option>
          <option value="name">Sort by Name</option>
        </select>
        <select
          className="select select-bordered"
          value={sortOrder}
          onChange={(e) => { setCurrentPage(1); setSortOrder(e.target.value); }}
        >
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 2xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, idx) => (
            <div key={idx} className="p-2 2xl:p-6 rounded-xl border shadow-lg border-text-content bg-base-100">
              <div className="mb-4">
                <div className="animate-pulse h-4 w-24 rounded bg-base-300" />
              </div>
              <div className="flex items-center mb-4 space-x-4">
                <div className="w-16 h-16 rounded-full border-2 border-primary bg-base-300 animate-pulse" />
                <div className="grid grid-cols-2 gap-4 w-full">
                  <div className="animate-pulse h-3 w-32 rounded bg-base-300" />
                  <div className="animate-pulse h-3 w-28 rounded bg-base-300" />
                  <div className="animate-pulse h-3 w-24 rounded bg-base-300" />
                  <div className="animate-pulse h-3 w-20 rounded bg-base-300" />
                </div>
              </div>
              <div className="flex justify-center items-center mt-6 border-t border-primary/20">
                <div className="animate-pulse h-4 w-44 rounded bg-base-300" />
              </div>
            </div>
          ))
        ) : currentPatients.map((patient) => (
          <div key={`${patient.type}-${patient.id}`} className="p-4 2xl:p-6 rounded-xl border shadow-lg border-text-content bg-base-100">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-base-content/70">Updated {patient.updatedAtDisplay}</p>
              {patient.type === 'dependant' && (
                <span className="badge badge-sm badge-secondary">{patient.badge}</span>
              )}
            </div>

            <div className="flex items-center mb-2 2xl:mb-4 space-x-4">
              <div className="w-18 h-16 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
                {patient.name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]?.toUpperCase()).join('.')}
              </div>
              <div className="grid grid-cols-2 gap-2 2xl:gap-4 w-full">
                <p className="text-sm text-base-content/70">Name: {patient.name}</p>
                <p className="text-sm text-base-content/70">Patient ID: {patient.displayId}</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 items-center border-t border-primary/20 pt-3">
              <button className="text-sm font-medium text-primary/80 hover:underline hover:text-primary" onClick={() => handleViewDetails(patient)}>
                View Patient Payment Details
              </button>
              <div className="flex justify-end w-full">
                <ClearItemButton item={patient} onClear={handleClear} onCleared={fetchIncoming} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-8">
          <div className="flex space-x-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`w-3 h-3 rounded-full transition-colors ${
                  page === currentPage
                    ? 'bg-primary'
                    : 'bg-base-300 hover:bg-base-400'
                }`}
              />
            ))}
          </div>
        </div>
      )}
    </CashierLayout>
  );
};

export default Incoming;