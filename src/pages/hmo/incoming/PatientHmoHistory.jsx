import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBillings, updateBilling } from "@/services/api/billingAPI";
import { formatNigeriaDate,formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import { FaPen } from 'react-icons/fa';
import EditHmoDecisionModal from "@/components/modals/EditHmoDecisionModal";

const PatientHmoHistory = ({ patientId, dependantId = null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [rawBillings, setRawBillings] = useState([]);
  const [updatingId, setUpdatingId] = useState(null);
  const [editingRow, setEditingRow] = useState(null);
  const previewLimit = 2;

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

      const scoped = list.filter(bill =>
        dependantId ? bill.dependantId === dependantId : !bill.dependantId
      );

      const flattened = [];
      scoped.forEach(bill => {
        (bill.itemDetails || []).forEach((item, idx) => {
          const status = item.hmoStatus;
          if (!status || status === 'pending') return;
          flattened.push({
            key: `${bill.id}-${idx}`,
            billId: bill.id,
            itemIdx: idx,
            description: item.description,
            code: item.code,
            total: Number(item.total || 0),
            hmoCovered: Number(item.hmoCovered || 0),
            patientOwes: Number(item.patientOwes ?? (Number(item.total || 0) - Number(item.hmoCovered || 0))),
            status,
            isClaimed: !!item.isClaimed,
            approvedBy: bill.hmoReviewedBy || `${bill.raisedBy?.firstName || ''} ${bill.raisedBy?.lastName || ''}`.trim() || '—',
            approvedAt: bill.hmoReviewedAt || bill.updatedAt || null,
          });
        });
      });

      flattened.sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());

      if (mounted) {
        setRows(flattened);
        setRawBillings(scoped);
      }
    } catch (err) {
      console.error("PatientHmoHistory: failed to load", err);
      if (mounted) setRows([]);
    } finally {
      if (mounted) setLoading(false);
    }
  };
  load(); // ← call directly, no need for the outer `if (patientId)` guard anymore
  return () => { mounted = false; };
}, [patientId, dependantId]);

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

  const toggleClaimed = async (row) => {
    if (updatingId) return;
    const bill = rawBillings.find(b => b.id === row.billId);
    if (!bill) return;

    const newItems = [...(bill.itemDetails || [])];
    const targetItem = newItems[row.itemIdx];
    if (!targetItem) return;

    newItems[row.itemIdx] = {
      ...targetItem,
      isClaimed: !targetItem.isClaimed,
    };

    setUpdatingId(row.key);
    try {
      await updateBilling(bill.id, { itemDetails: newItems });
      
      // Update local state directly so we don't need a full refetch
      setRawBillings(prev => prev.map(b => b.id === bill.id ? { ...b, itemDetails: newItems } : b));
      setRows(prev => prev.map(r => r.key === row.key ? { ...r, isClaimed: !r.isClaimed } : r));
      toast.success("Claim status updated");
    } catch (err) {
      toast.error("Failed to update claim status");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleEditSave = async (status, hmoCovered) => {
    if (!editingRow) return;
    const bill = rawBillings.find(b => b.id === editingRow.billId);
    if (!bill) return;

    const newItems = [...(bill.itemDetails || [])];
    const targetItem = newItems[editingRow.itemIdx];
    if (!targetItem) return;

    newItems[editingRow.itemIdx] = {
      ...targetItem,
      hmoStatus: status,
      hmoCovered: Number(hmoCovered),
      patientOwes: Number(targetItem.total || 0) - Number(hmoCovered)
    };

    const outstandingBill = newItems.reduce((sum, item) => sum + Number(item.patientOwes || 0), 0);
    const hmoCoveredAmount = newItems.reduce((sum, item) => sum + Number(item.hmoCovered || 0), 0);

    setUpdatingId(editingRow.key);
    try {
      await updateBilling(bill.id, { 
        itemDetails: newItems,
        outstandingBill,
        hmoCoveredAmount,
        hmoApprovedAt: new Date().toISOString()
      });
      
      setRawBillings(prev => prev.map(b => b.id === bill.id ? { ...b, itemDetails: newItems } : b));
      setRows(prev => prev.map(r => r.key === editingRow.key ? {
        ...r, 
        status,
        hmoCovered: Number(hmoCovered),
        patientOwes: Number(r.total || 0) - Number(hmoCovered)
      } : r));
      toast.success("Decision updated");
      setEditingRow(null);
    } catch (err) {
      toast.error("Failed to update decision");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="card bg-base-100 border border-base-200 mb-6">
        <div className="card-body p-5 space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="skeleton h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  const previewRows = rows.slice(0, previewLimit);

  return (
    <div className="card bg-base-100 border border-base-200 mb-6">
      <div className="card-body p-0">
        <div className="px-5 py-3 bg-base-200/40 border-b border-base-200">
          <p className="text-sm font-semibold text-base-content">
            Past HMO Decisions
            <span className="ml-2 badge badge-info badge-sm">{rows.length}</span>
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="border-b border-base-200">
                <th>Item</th>
                <th className="text-right">Total</th>
                <th className="text-right">HMO Covered</th>
                <th className="text-right">Patient Owes</th>
                <th>Decision</th>
                <th className="text-center">Claimed</th>
                <th>By</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {previewRows.map(row => (
                <tr key={row.key} className="border-b border-base-200 last:border-0">
                  <td>
                    <p className="text-sm">{row.description}</p>
                    <p className="text-xs text-base-content/50">{row.code}</p>
                  </td>
                  <td className="text-right text-sm">₦{row.total.toLocaleString()}</td>
                  <td className="text-right text-sm text-success">₦{row.hmoCovered.toLocaleString()}</td>
                  <td className="text-right text-sm text-error">₦{row.patientOwes.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className={`badge badge-sm ${statusBadgeClass(row.status)}`}>{row.status}</span>
                      <button 
                        onClick={() => setEditingRow(row)}
                        className="btn btn-ghost btn-xs btn-square text-base-content/50 hover:text-primary"
                        title="Edit Decision"
                      >
                        <FaPen className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                  <td className="text-center">
                    <input 
                      type="checkbox" 
                      className="checkbox checkbox-sm checkbox-primary" 
                      checked={row.isClaimed}
                      onChange={() => toggleClaimed(row)}
                      disabled={updatingId === row.key}
                    />
                  </td>
                  <td className="text-sm">{row.approvedBy}</td>
                  <td className="text-sm text-base-content/60">
                   {safeFormat(row.approvedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length > previewLimit && (
          <div className="px-5 py-3 border-t border-base-200 flex justify-center">
            <button
              className="btn btn-outline btn-primary"
              onClick={() => navigate(`/dashboard/hmo/patient-history/${patientId}`, {
                state: { dependantId },
              })}
            >
              View All 
            </button>
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
    </div>
  );
};

export default PatientHmoHistory;