// src/pages/hmo/history/HMOPatients.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header, DataTable } from '@/components/common';
import Sidebar from '@/components/hmo/dashboard/Sidebar';
import { getAllBillings } from '@/services/api/billingAPI';
import { getPatients } from '@/services/api/patientsAPI';
import { getDependants } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';

const HMOPatients = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [decisionFilter, setDecisionFilter] = useState('all');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  const loadHistory = async () => {
    try {
      setLoading(true);

      const [billingsRes, patientsRes, dependantsRes] = await Promise.allSettled([
        getAllBillings(),
        getPatients(),
        getDependants(),
      ]);

      const bills = billingsRes.status === 'fulfilled'
        ? (billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [])
        : [];

      const patients = patientsRes.status === 'fulfilled'
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
        : [];

      const dependantsRaw = dependantsRes.status === 'fulfilled'
        ? (dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [])
        : [];
      const dependants = Array.isArray(dependantsRaw) ? dependantsRaw : (dependantsRaw?.dependants ?? []);

      const patientMap = new Map(patients.map(p => [p.id || p._id, p]));
      const dependantMap = new Map(dependants.map(d => [d.id, d]));

      // Only bills where at least one item has been decided (not pending)
      const decidedBills = (Array.isArray(bills) ? bills : []).filter((bill) =>
        (bill.itemDetails || []).some(item => item.hmoStatus && item.hmoStatus !== 'pending')
      );

      const mapped = decidedBills.map((bill) => {
        const isDependantBill = !!bill.dependantId;
        const patient = patientMap.get(bill.patientId);
        const dependant = isDependantBill ? dependantMap.get(bill.dependantId) : null;

        const name = isDependantBill
          ? (`${dependant?.firstName || ''} ${dependant?.lastName || ''}`.trim() || 'Dependant')
          : (`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown');

        const items = bill.itemDetails || [];
        const hasApproved = items.some(i => i.hmoStatus === 'approved');
        const hasPartial = items.some(i => i.hmoStatus === 'partial');
        const hasRejected = items.some(i => i.hmoStatus === 'rejected');

        // Overall decision label for the row — mixed if more than one type present
        let overallDecision = 'approved';
        const flags = [hasApproved, hasPartial, hasRejected].filter(Boolean).length;
        if (flags > 1) overallDecision = 'mixed';
        else if (hasPartial) overallDecision = 'partial';
        else if (hasRejected) overallDecision = 'rejected';
        else if (hasApproved) overallDecision = 'approved';

        const hmoCoveredTotal = items.reduce((s, i) => s + Number(i.hmoCovered || 0), 0);
        const patientOwesTotal = items.reduce(
          (s, i) => s + Number(i.patientOwes ?? (Number(i.total || 0) - Number(i.hmoCovered || 0))),
          0
        );

        return {
          id: bill.id,
          patientId: bill.patientId,
          dependantId: bill.dependantId || null,
          type: isDependantBill ? 'dependant' : 'patient',
          relationshipType: dependant?.relationshipType || null,
          name,
          displayId: patient?.hospitalId || patientMap.get(bill.patientId)?.hospitalId || '—',
          decision: overallDecision,
          totalAmount: Number(bill.totalAmount || 0),
          hmoCovered: hmoCoveredTotal,
          patientOwes: patientOwesTotal,
          approvedBy: bill.hmoReviewedBy || `${bill.raisedBy?.firstName || ''} ${bill.raisedBy?.lastName || ''}`.trim() || '—',
          approvedAt: bill.hmoReviewedAt || bill.updatedAt || null,
        };
      });

      mapped.sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());

      setRecords(mapped);
    } catch (err) {
      console.error('HmoApprovalHistory: failed to load', err);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

const filteredRecords = useMemo(() => {
  const now = new Date();

  // Custom range takes priority if either date is set
  if (customFrom || customTo) {
    const fromTs = customFrom ? new Date(customFrom).setUTCHours(0, 0, 0, 0) : 0;
    const toTs = customTo ? new Date(customTo).setUTCHours(23, 59, 59, 999) : Infinity;

    return records.filter((r) => {
      const ts = r.approvedAt ? new Date(r.approvedAt).getTime() : 0;
      const inRange = ts >= fromTs && ts <= toTs;
      const matchesDecision = decisionFilter === 'all' ? true : r.decision === decisionFilter;
      return inRange && matchesDecision;
    });
  }

  const start = (() => {
    if (dateFilter === 'today') {
      const nowNigeria = new Date(now.getTime() + 60 * 60 * 1000);
      nowNigeria.setUTCHours(0, 0, 0, 0);
      return nowNigeria.getTime() - 60 * 60 * 1000;
    }
    if (dateFilter === 'week') return now.getTime() - 7 * 24 * 60 * 60 * 1000;
    if (dateFilter === 'month') return now.getTime() - 30 * 24 * 60 * 60 * 1000;
    return 0;
  })();

  return records.filter((r) => {
    const ts = r.approvedAt ? new Date(r.approvedAt).getTime() : 0;
    const inRange = dateFilter === 'all' ? true : ts >= start;
    const matchesDecision = decisionFilter === 'all' ? true : r.decision === decisionFilter;
    return inRange && matchesDecision;
  });
}, [records, dateFilter, decisionFilter, customFrom, customTo]);
  const DecisionBadge = ({ decision }) => {
    const map = {
      approved: 'badge-success',
      partial: 'badge-warning',
      rejected: 'badge-error',
      mixed: 'badge-info',
    };
    return <span className={`badge badge-sm ${map[decision] || 'badge-neutral'}`}>{decision}</span>;
  };

  const TypeBadge = ({ type, relationshipType }) =>
    type === 'dependant' ? (
      <span className="badge badge-secondary badge-sm">{relationshipType || 'Dependant'}</span>
    ) : (
      <span className="badge badge-outline badge-sm">Patient</span>
    );

  const handleViewDetails = (row) => {
    navigate(`/dashboard/hmo/incoming/${row.patientId}`, {
      state: {
        dependantId: row.dependantId,
      },
    });
  };

  const columns = useMemo(() => [
    {
      key: 'displayId',
      title: 'Patient ID',
      sortable: true,
      className: 'text-base-content font-medium',
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      className: 'text-base-content font-medium',
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value, row) => <TypeBadge type={row.type} relationshipType={row.relationshipType} />,
    },
    {
      key: 'decision',
      title: 'Decision',
      sortable: true,
      render: (value) => <DecisionBadge decision={value} />,
    },
    {
      key: 'hmoCovered',
      title: 'HMO Covered',
      sortable: true,
      className: 'text-success',
      render: (value) => `₦${Number(value).toLocaleString()}`,
    },
    {
      key: 'patientOwes',
      title: 'Patient Owes',
      sortable: true,
      className: 'text-error',
      render: (value) => `₦${Number(value).toLocaleString()}`,
    },
    {
      key: 'approvedBy',
      title: 'Decided By',
      sortable: true,
      className: 'text-base-content/70',
    },
    {
      key: 'approvedAt',
      title: 'Date',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => (value ? formatNigeriaDateTime(value) : '—'),
    },
    {
      key: 'actions',
      title: 'Actions',
      sortable: false,
      className: 'text-center',
      render: (value, row) => (
        <button
          onClick={() => handleViewDetails(row)}
          className="text-primary hover:text-primary/80 hover:underline text-sm font-medium"
        >
          View Details
        </button>
      ),
    },
  ], []);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header />
        <div className="overflow-y-auto flex-1 p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl font-semibold">Approval History</h1>
              <p className="text-base-content/70">Patients whose billing items have been reviewed.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn btn-sm" onClick={loadHistory} disabled={loading}>
                Refresh
              </button>
              <button className="btn btn-sm btn-outline" onClick={() => navigate('/dashboard/hmo/incoming')}>
                ← Back to Incoming
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6">
            <select
                className="select select-bordered select-sm"
                value={dateFilter}
                onChange={(e) => {
                setDateFilter(e.target.value);
                setCustomFrom('');
                setCustomTo('');
                }}
                disabled={!!(customFrom || customTo)}
            >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
            </select>

            <div className="flex items-center gap-2">
                <span className="text-sm text-base-content/60">From</span>
                <input
                type="date"
                className="input input-bordered input-sm"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                max={customTo || undefined}
                />
                <span className="text-sm text-base-content/60">To</span>
                <input
                type="date"
                className="input input-bordered input-sm"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom || undefined}
                />
                {(customFrom || customTo) && (
                <button
                    className="btn btn-ghost btn-xs"
                    onClick={() => { setCustomFrom(''); setCustomTo(''); }}
                >
                    Clear
                </button>
                )}
            </div>

            <select
                className="select select-bordered select-sm"
                value={decisionFilter}
                onChange={(e) => setDecisionFilter(e.target.value)}
            >
                <option value="all">All Decisions</option>
                <option value="approved">Approved</option>
                <option value="partial">Partial</option>
                <option value="rejected">Rejected</option>
                <option value="mixed">Mixed</option>
            </select>
            </div>
          <div className="w-full shadow-xl card bg-base-100">
            <div className="p-4 card-body 2xl:p-6">
              {loading ? (
                <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                  <div className="overflow-auto max-h-96 p-4 space-y-3">
                    <div className="skeleton h-6 w-40" />
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="skeleton h-8 w-full" />
                    ))}
                  </div>
                </div>
              ) : (
                <DataTable
                  data={filteredRecords}
                  columns={columns}
                  searchable={true}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={14}
                  maxHeight="max-h-96 sm:max-h-80 md:max-h-100dvh lg:min-h-[50vh] 2xl:min-h-[60vh]"
                  showEntries={true}
                  searchPlaceholder="Search by name or ID..."
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HMOPatients;