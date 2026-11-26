import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { HmoLayout } from '@/layouts/hmo';
import { getAllBillings, updateBilling } from '@/services/api/billingAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import KolakLoader from '@/components/common/KolakLoader';
import toast from 'react-hot-toast';
import { FaPen } from 'react-icons/fa';
import EditHmoDecisionModal from '@/components/modals/EditHmoDecisionModal';

const PatientHmoHistoryFull = () => {
  const { patientId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [rawBillings, setRawBillings] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const [patient, setPatient] = useState(null);
  const [subject, setSubject] = useState(dependantSnapshot || null);
  const [statusFilter, setStatusFilter] = useState('all'); // all | approved | partial | rejected

  useEffect(() => {
    let mounted = true;
    const loadAllData = async () => {
      if (!patientId) {
        if (mounted) setLoading(false);
        return;
      }
      try {
        setLoading(true);

        const fetchPromises = [
          getPatientById(patientId),
          getAllBillings({ patientId }),
        ];

        if (isViewingDependant && dependantId) {
          fetchPromises.push(getDependantById(dependantId));
        }

        const results = await Promise.allSettled(fetchPromises);
        const patientRes = results[0];
        const billingsRes = results[1];
        const dependantRes = isViewingDependant ? results[2] : null;

        if (patientRes.status === 'fulfilled') {
          const pData = patientRes.value?.data ?? patientRes.value;
          if (mounted) setPatient(pData);
        }

        if (dependantRes && dependantRes.status === 'fulfilled') {
          const dData = dependantRes.value?.data?.data?.dependant || dependantRes.value?.data?.dependant || dependantSnapshot;
          if (mounted && dData) setSubject(dData);
        } else if (isViewingDependant && dependantSnapshot && mounted) {
          setSubject(dependantSnapshot);
        }

        const raw = billingsRes.status === 'fulfilled'
          ? (billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [])
          : [];
        const list = Array.isArray(raw) ? raw : [];

        const scoped = list.filter((bill) =>
          isViewingDependant ? bill.dependantId === dependantId : !bill.dependantId,
        );

        const flattened = [];
        scoped.forEach((bill) => {
          (bill.itemDetails || []).forEach((item, idx) => {
            const rawStatus = String(item.hmoStatus || bill.hmoStatus || '').toLowerCase();
            const isItemPaid = Boolean(
              item.paymentStatus === 'paid' ||
              item.paymentStatus === 'approved' ||
              bill.isCleared ||
              item.isCleared ||
              rawStatus === 'approved'
            );
            const status =
              rawStatus && rawStatus !== 'pending'
                ? rawStatus
                : item.isClaimed || isItemPaid
                  ? 'approved'
                  : 'pending';
            const paymentStatus = isItemPaid ? 'paid' : (item.paymentStatus || 'unpaid');

            flattened.push({
              key: `${bill.id}-${idx}`,
              billId: bill.id,
              itemIdx: idx,
              description: item.description,
              regimenSummary: item.regimenSummary || '',
              code: item.code,
              total: Number(item.total || 0),
              hmoCovered: Number(item.hmoCovered || 0),
              patientOwes: Number(
                item.patientOwes ?? Number(item.total || 0) - Number(item.hmoCovered || 0),
              ),
              status,
              paymentStatus,
              isPaid: isItemPaid,
              isClaimed: !!item.isClaimed,
              approvedBy:
                item.hmoApprovedBy ||
                bill.hmoApprovedBy ||
                bill.hmoReviewedBy ||
                `${bill.raisedBy?.firstName || ''} ${bill.raisedBy?.lastName || ''}`.trim() ||
                '—',
              approvedAt: item.hmoApprovedAt || bill.hmoReviewedAt || bill.updatedAt || null,
            });
          });
        });

        flattened.sort(
          (a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime(),
        );

        if (mounted) {
          setRows(flattened);
          setRawBillings(scoped);
        }
      } catch (err) {
        console.error('PatientHmoHistoryFull: failed to load', err);
        if (mounted) setRows([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadAllData();
    return () => { mounted = false; };
  }, [patientId, isViewingDependant, dependantId, dependantSnapshot]);

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
    if (status === 'approved') return 'badge-success text-white';
    if (status === 'partial') return 'badge-warning';
    if (status === 'rejected') return 'badge-error text-white';
    if (status === 'pending') return 'bg-warning/20 text-warning-content border-warning/50 font-medium';
    return 'badge-neutral';
  };

  const groupedBills = useMemo(() => {
    const groupsMap = new Map();
    filteredRows.forEach((row) => {
      if (!groupsMap.has(row.billId)) {
        const billObj = rawBillings.find((b) => b.id === row.billId);
        groupsMap.set(row.billId, {
          billId: row.billId,
          billDate: billObj?.createdAt || row.approvedAt || null,
          rows: [],
        });
      }
      groupsMap.get(row.billId).rows.push(row);
    });
    return Array.from(groupsMap.values()).sort(
      (a, b) => new Date(b.billDate || 0).getTime() - new Date(a.billDate || 0).getTime()
    );
  }, [filteredRows, rawBillings]);

  const handleClaimBill = async (billId) => {
    if (updatingId) return;
    const bill = rawBillings.find((b) => b.id === billId);
    if (!bill) return;

    let changed = false;
    const newItems = (bill.itemDetails || []).map((item) => {
      if (!item.isClaimed) {
        changed = true;
        return { ...item, isClaimed: true };
      }
      return item;
    });

    if (!changed) {
      toast('All items in this bill are already claimed');
      return;
    }

    setUpdatingId(`bill-${billId}`);
    try {
      await updateBilling(billId, { itemDetails: newItems });

      setRawBillings((prev) =>
        prev.map((b) => (b.id === billId ? { ...b, itemDetails: newItems } : b))
      );
      setRows((prev) =>
        prev.map((r) => (r.billId === billId ? { ...r, isClaimed: true } : r))
      );
      toast.success(`Bill #${billId.slice(-8)} marked as claimed`);
    } catch (err) {
      console.error('Failed to update bill claim statuses', err);
      toast.error('Failed to update claim status');
    } finally {
      setUpdatingId(null);
    }
  };

  const toggleClaimed = async (row) => {
    if (updatingId || row.isClaimed) return;
    const bill = rawBillings.find(b => b.id === row.billId);
    if (!bill) return;

    const newItems = [...(bill.itemDetails || [])];
    const targetItem = newItems[row.itemIdx];
    if (!targetItem || targetItem.isClaimed) return;

    newItems[row.itemIdx] = {
      ...targetItem,
      isClaimed: true,
    };

    setUpdatingId(row.key);
    try {
      await updateBilling(bill.id, { itemDetails: newItems });
      
      setRawBillings(prev => prev.map(b => b.id === bill.id ? { ...b, itemDetails: newItems } : b));
      setRows(prev => prev.map(r => r.key === row.key ? { ...r, isClaimed: true } : r));
      toast.success("Item marked as claimed");
    } catch (err) {
      console.error("Failed to update claim status", err);
      toast.error("Failed to update claim status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditSave = async ({ status, hmoCovered }) => {
    if (!editingRow) return;
    const bill = rawBillings.find(b => b.id === editingRow.billId);
    if (!bill) return;

    const newItems = [...(bill.itemDetails || [])];
    const targetItem = newItems[editingRow.itemIdx];
    if (!targetItem) return;

    const coveredNum = Number(hmoCovered);
    const itemTotal = Number(targetItem.total || 0);
    const patientPays = status === 'approved' ? 0 : status === 'partial' ? itemTotal - coveredNum : itemTotal;

    newItems[editingRow.itemIdx] = {
      ...targetItem,
      hmoStatus: status,
      hmoCovered: coveredNum,
      patientOwes: patientPays,
      hmoApprovedAt: new Date().toISOString()
    };

    setUpdatingId(editingRow.key);
    try {
      await updateBilling(bill.id, {
        itemDetails: newItems,
        hmoReviewedAt: new Date().toISOString()
      });

      setRawBillings(prev => prev.map(b => b.id === bill.id ? { ...b, itemDetails: newItems } : b));
      setRows(prev => prev.map(r => r.key === editingRow.key ? {
        ...r,
        status,
        hmoCovered: coveredNum,
        patientOwes: patientPays
      } : r));
      toast.success("Decision updated");
      setEditingRow(null);
    } catch (err) {
      console.error("Failed to update decision", err);
      toast.error("Failed to update decision");
    } finally {
      setUpdatingId(null);
    }
  };

  const subjectName = isViewingDependant
    ? subject?.fullName ||
      `${subject?.firstName || ''} ${subject?.lastName || ''}`.trim() ||
      dependantSnapshot?.fullName ||
      'Dependant'
    : patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient';

  return (
    <HmoLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="space-y-6 min-w-0">
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
          {['all', 'approved', 'pending', 'rejected'].map((s) => (
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
            <KolakLoader />
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="card bg-base-100 border border-base-200">
            <div className="card-body py-12 text-center text-base-content/50">
              No HMO history found{statusFilter !== 'all' ? ` for "${statusFilter}"` : ''}.
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {groupedBills.map((group) => {
              const billAllClaimed = group.rows.length > 0 && group.rows.every((r) => r.isClaimed);
              const isUpdatingThisBill = updatingId === `bill-${group.billId}`;
              return (
                <div key={group.billId} className="card bg-base-100 border border-base-200">
                  <div className="card-body p-0">
                    <div className="px-5 py-3 bg-base-200/40 border-b border-base-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-semibold text-base-content">
                          Bill #{group.billId?.slice(-8)}
                        </p>
                        <span className="badge badge-info badge-sm">{group.rows.length}</span>
                        <span className="text-xs text-base-content/50">
                          {safeFormat(group.billDate)}
                        </span>
                      </div>
                      <button
                        type="button"
                        className={`btn btn-xs ${billAllClaimed ? 'btn-success text-white' : 'btn-primary'} gap-1 font-medium`}
                        onClick={() => handleClaimBill(group.billId)}
                        disabled={!!updatingId || billAllClaimed}
                      >
                        {isUpdatingThisBill ? (
                          <span className="loading loading-spinner loading-xs" />
                        ) : billAllClaimed ? (
                          '✓ Claimed'
                        ) : (
                          '✓ Claim All'
                        )}
                      </button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="table table-sm w-full">
                        <thead>
                          <tr className="border-b border-base-200">
                            <th>Item</th>
                            <th>Decision</th>
                            <th className="text-center w-28">
                              <div className="flex items-center justify-center gap-1.5">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs checkbox-primary"
                                  checked={billAllClaimed}
                                  onChange={() => handleClaimBill(group.billId)}
                                  disabled={!!updatingId || billAllClaimed}
                                  title={billAllClaimed ? 'All items claimed' : 'Claim all in this bill'}
                                />
                                <span>Claimed</span>
                              </div>
                            </th>
                            <th>By</th>
                            <th>When</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.rows.map((row) => (
                            <tr key={row.key} className="border-b border-base-200 last:border-0">
                              <td>
                                <p className="text-sm">{row.description}</p>
                                {row.regimenSummary && (
                                  <p className="text-xs text-base-content/60">{row.regimenSummary}</p>
                                )}
                                <p className="text-xs text-base-content/50">{row.code}</p>
                              </td>
                              <td>
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`badge badge-sm font-semibold uppercase ${statusBadgeClass(row.status)}`}
                                  >
                                    {row.status}
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
                                    onClick={() => setEditingRow(row)}
                                    title="Edit Decision"
                                  >
                                    <FaPen className="w-3 h-3" />
                                  </button>
                                </div>
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="checkbox checkbox-xs checkbox-primary"
                                  checked={row.isClaimed}
                                  onChange={() => toggleClaimed(row)}
                                  disabled={row.isClaimed || updatingId === row.key || !!updatingId}
                                  title={row.isClaimed ? 'Claimed (locked)' : 'Mark as claimed'}
                                />
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
              );
            })}
          </div>
        )}
      </div>

      <EditHmoDecisionModal
        isOpen={!!editingRow}
        onClose={() => setEditingRow(null)}
        item={editingRow}
        onSave={handleEditSave}
        submitting={!!updatingId}
      />
    </HmoLayout>
  );
};

export default PatientHmoHistoryFull;
