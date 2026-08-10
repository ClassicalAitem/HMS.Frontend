import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from '@/components/common';
import Sidebar from '@/components/hmo/dashboard/Sidebar';
import { getAllBillings } from '@/services/api/billingAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import KolakLoader from '@/components/common/KolakLoader';

const PatientHmoHistoryFull = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [patient, setPatient] = useState(null);
  const [subject, setSubject] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all'); // all | approved | partial | rejected

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Load the guardian patient (for hospitalId / name context)
  useEffect(() => {
    let mounted = true;
    const loadPatient = async () => {
      try {
        const res = await getPatientById(patientId);
        const data = res?.data ?? res;
        if (mounted) setPatient(data);
      } catch (err) {
        console.error('Failed to load patient', err);
      }
    };
    if (patientId) loadPatient();
    return () => { mounted = false; };
  }, [patientId]);

  // If viewing a dependant, resolve their own record too
  useEffect(() => {
    let mounted = true;
    const loadDependant = async () => {
      if (!isViewingDependant) return;
      try {
        const res = await getDependantById(dependantId);
        const dep = res?.data?.data?.dependant || res?.data?.dependant || dependantSnapshot;
        if (mounted) setSubject(dep || dependantSnapshot);
      } catch {
        if (mounted) setSubject(dependantSnapshot);
      }
    };
    loadDependant();
    return () => { mounted = false; };
  }, [isViewingDependant, dependantId, dependantSnapshot]);

  // Load and flatten all reviewed billing items — same logic as the preview card, just unpaginated
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!patientId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const res = await getAllBillings({ patientId });
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : [];

        const scoped = list.filter((bill) =>
          isViewingDependant ? bill.dependantId === dependantId : !bill.dependantId,
        );

        const flattened = [];
        scoped.forEach((bill) => {
          (bill.itemDetails || []).forEach((item, idx) => {
            const status = item.hmoStatus;
            if (!status || status === 'pending') return;
            flattened.push({
              key: `${bill.id}-${idx}`,
              billId: bill.id,
              description: item.description,
              code: item.code,
              total: Number(item.total || 0),
              hmoCovered: Number(item.hmoCovered || 0),
              patientOwes: Number(
                item.patientOwes ?? Number(item.total || 0) - Number(item.hmoCovered || 0),
              ),
              status,
              approvedBy:
                bill.hmoReviewedBy ||
                `${bill.raisedBy?.firstName || ''} ${bill.raisedBy?.lastName || ''}`.trim() ||
                '—',
              approvedAt: bill.hmoReviewedAt || bill.updatedAt || null,
            });
          });
        });

        flattened.sort(
          (a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime(),
        );

        if (mounted) setRows(flattened);
      } catch (err) {
        console.error('PatientHmoHistoryFull: failed to load', err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId]);

  const filteredRows = useMemo(() => {
    if (statusFilter === 'all') return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (acc, r) => {
        acc.total += r.total;
        acc.hmoCovered += r.hmoCovered;
        acc.patientOwes += r.patientOwes;
        return acc;
      },
      { total: 0, hmoCovered: 0, patientOwes: 0 },
    );
  }, [filteredRows]);

  const safeFormat = (dateVal) => {
    try {
      if (!dateVal) return '—';
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return '—';
      return `${formatNigeriaDate(dateVal)} · ${formatNigeriaTime(dateVal)}`;
    } catch {
      return '—';
    }
  };

  const statusBadgeClass = (status) => {
    if (status === 'approved') return 'badge-success';
    if (status === 'partial') return 'badge-warning';
    if (status === 'rejected') return 'badge-error';
    return 'badge-neutral';
  };

  const subjectName = isViewingDependant
    ? subject?.fullName ||
      `${subject?.firstName || ''} ${subject?.lastName || ''}`.trim() ||
      dependantSnapshot?.fullName ||
      'Dependant'
    : patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {loading && <KolakLoader fullscreen />}
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
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex flex-1 overflow-y-auto flex-col p-3 sm:p-6 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-base-content sm:text-2xl">HMO Approval History</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-sm text-base-content/70 truncate">{subjectName}</p>
                {isViewingDependant && (
                  <span className="badge badge-secondary badge-sm">
                    {subject?.relationshipType || dependantSnapshot?.relationshipType || 'Dependant'}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/50">{patient?.hospitalId || patientId}</p>
            </div>
            <button className="btn btn-sm btn-outline self-start" onClick={() => navigate(-1)}>
              ← Back
            </button>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap">
            {['all', 'approved', 'partial', 'rejected'].map((s) => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="card bg-base-100 border border-base-200">
              <div className="card-body py-12 text-center text-base-content/50">
                No HMO history found{statusFilter !== 'all' ? ` for "${statusFilter}"` : ''}.
              </div>
            </div>
          ) : (
            <>
              {/* Totals summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="card bg-base-100 border border-base-200">
                  <div className="card-body p-4">
                    <p className="text-xs text-base-content/50">Total Billed</p>
                    <p className="text-lg font-semibold">₦{totals.total.toLocaleString()}</p>
                  </div>
                </div>
                <div className="card bg-base-100 border border-base-200">
                  <div className="card-body p-4">
                    <p className="text-xs text-base-content/50">HMO Covered</p>
                    <p className="text-lg font-semibold text-success">
                      ₦{totals.hmoCovered.toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="card bg-base-100 border border-base-200">
                  <div className="card-body p-4">
                    <p className="text-xs text-base-content/50">Patient Owes</p>
                    <p className="text-lg font-semibold text-error">
                      ₦{totals.patientOwes.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              <div className="card bg-base-100 border border-base-200">
                <div className="card-body p-0">
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr className="border-b border-base-200">
                          <th>Item</th>
                          <th className="text-right">Total</th>
                          <th className="text-right">HMO Covered</th>
                          <th className="text-right">Patient Owes</th>
                          <th>Decision</th>
                          <th>By</th>
                          <th>When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRows.map((row) => (
                          <tr key={row.key} className="border-b border-base-200 last:border-0">
                            <td>
                              <p className="text-sm">{row.description}</p>
                              <p className="text-xs text-base-content/50">{row.code}</p>
                            </td>
                            <td className="text-right text-sm">₦{row.total.toLocaleString()}</td>
                            <td className="text-right text-sm text-success">
                              ₦{row.hmoCovered.toLocaleString()}
                            </td>
                            <td className="text-right text-sm text-error">
                              ₦{row.patientOwes.toLocaleString()}
                            </td>
                            <td>
                              <span className={`badge badge-sm ${statusBadgeClass(row.status)}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="text-sm">{row.approvedBy}</td>
                            <td className="text-sm text-base-content/60">{safeFormat(row.approvedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientHmoHistoryFull;