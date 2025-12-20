import React, { useState, useEffect, useMemo } from 'react';
import { CashierLayout } from '@/layouts/cashier';
import { Md6FtApart } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { getPatients } from '@/services/api/patientsAPI';

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

  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const res = await getPatients();
        const patients = Array.isArray(res?.data) ? res.data : [];
        const statuses = new Set([
          'awaiting_cashier',
          'awaiting_payment'
        ]);
        const filtered = patients.filter((p) => statuses.has(String(p?.status || '').toLowerCase()));
        const mapped = filtered.map((p) => ({
          id: p?.id,
          snapshot: p,
          name: `${p?.firstName || ''} ${p?.lastName || ''}`.trim() || 'Unknown',
          patientId: p?.hospitalId || p?.id || '—',
          photo: p?.profilePicture || p?.photo || 'https://randomuser.me/api/portraits/lego/1.jpg',
          gender: p?.gender || '—',
          phone: p?.phone || p?.phoneNumber || '—',
          insurance: p?.hmos?.provider || 'Self-pay',
          registeredTime: p?.createdAt ? new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—',
          updatedAt: p?.updatedAt || p?.createdAt,
          updatedAtDisplay: (p?.updatedAt || p?.createdAt) ? new Date(p?.updatedAt || p?.createdAt).toLocaleString() : '—'
        }));
        if (mounted) setIncomingPatients(mapped);
      } catch (err) {
        if (mounted) setIncomingPatients([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncoming();
    return () => { mounted = false; };
  }, []);

  const processedPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = new Date();
    const start = (() => {
      if (dateFilter === 'today') {
        const d = new Date(now);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
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
      const matches = !q || p.name.toLowerCase().includes(q) || String(p.patientId).toLowerCase().includes(q) || String(p.phone || '').toLowerCase().includes(q);
      const ts = p.updatedAt ? new Date(p.updatedAt).getTime() : 0;
      const inRange = dateFilter === 'all' ? true : ts >= start;
      return matches && inRange;
    });

    const sorted = filtered.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = a.name.localeCompare(b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      const at = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return sortOrder === 'asc' ? at - bt : bt - at;
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
    console.log('View Details Clicked:', patient);
    const id = patient?.id || patient?.patientId;
    if (!id) return;
    navigate(`/cashier/patient-details/${id}` , { state: { from: 'incoming', patientSnapshot: patient?.snapshot } });
  };

  return (
    <CashierLayout>
          {/* Page Header */}
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
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>

          {/* Patient Cards Grid */}
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
              <div key={patient.id} className="p-4 2xl:p-6 rounded-xl border shadow-lg border-text-content bg-base-100">
                {/* Sent By */}
                <div className="mb-4">
                  <p className="text-sm text-base-content/70">Updated {patient.updatedAtDisplay}</p>
                </div>

                {/* Patient Info */}
                <div className="flex items-center mb-2 2xl:mb-4 space-x-4">
                  <div className="w-18 h-16 rounded-full border-2 border-primary bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold">
                    {patient.name.split(' ').filter(Boolean).slice(0,2).map(n => n[0]?.toUpperCase()).join('.')}
                  </div>
                  <div className="grid grid-cols-2 gap-2 2xl:gap-4 w-full">
                    <p className="text-sm text-base-content/70">Name: {patient.name}</p>
                    <p className="text-sm text-base-content/70">Insurance: {patient.insurance}</p>
                    <p className="text-sm text-base-content/70">Patient ID: {patient.patientId}</p>
                    <p className="text-sm text-base-content/70">Registered: {patient.registeredTime}</p>
                  </div>
                </div>

                {/* Action Link */}
                <div className="flex justify-center items-center border-t border-primary/20">
                  <button className="text-sm font-medium text-primary/80 hover:underline hover:text-primary" onClick={() => handleViewDetails(patient)}>
                    View Patient Payment Details
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
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
