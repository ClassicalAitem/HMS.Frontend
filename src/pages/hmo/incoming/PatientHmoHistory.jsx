import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAllBillings } from "@/services/api/billingAPI";
import { formatNigeriaDate,formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const PatientHmoHistory = ({ patientId, dependantId = null }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
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
            description: item.description,
            code: item.code,
            total: Number(item.total || 0),
            hmoCovered: Number(item.hmoCovered || 0),
            patientOwes: Number(item.patientOwes ?? (Number(item.total || 0) - Number(item.hmoCovered || 0))),
            status,
            approvedBy: bill.hmoReviewedBy || `${bill.raisedBy?.firstName || ''} ${bill.raisedBy?.lastName || ''}`.trim() || '—',
            approvedAt: bill.hmoReviewedAt || bill.updatedAt || null,
          });
        });
      });

      flattened.sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());

      if (mounted) setRows(flattened);
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
                  <td><span className={`badge badge-sm ${statusBadgeClass(row.status)}`}>{row.status}</span></td>
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
    </div>
  );
};

export default PatientHmoHistory;