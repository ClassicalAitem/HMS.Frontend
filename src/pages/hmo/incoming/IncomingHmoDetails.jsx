import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { createReceipt, getAllBillings, getAllReceiptByPatientId, updateBilling } from "@/services/api/billingAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { getStatusBadgeClass, getStatusDisplayText } from "@/utils/statusUtils";
import { formatNigeriaDateShort } from "@/utils/formatDateTimeUtils";
import toast from "react-hot-toast";
import { getAllHmos } from "@/services/api/hmoAPI";
import apiClient from "@/services/api/apiClient";

const IncomingHmoDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = location.state?.patientSnapshot;

  const [patient, setPatient] = useState(snapshot || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sendingStatuses, setSendingStatuses] = useState({
    Lab: false,
    Pharmacy: false,
  });
  const [billings, setBillings] = useState([]);
  const [hmos, setHmos] = useState([]);
  const [itemDecisions, setItemDecisions] = useState({});

  useEffect(() => {
    let mounted = true;
    const loadAll = async () => {
      setLoading(true);
      try {
        const [patientRes, billingsRes] = await Promise.allSettled([
          snapshot ? Promise.resolve({ data: snapshot }) : getPatientById(patientId),
          getAllBillings({ patientId }),
        ]);
        const hmosRes = await apiClient.get(`/hmo`, { params: { patientId } })
  .catch(() => ({ data: [] }));
const hmoRaw = hmosRes?.data?.data ?? hmosRes?.data ?? [];
if (mounted) setHmos(Array.isArray(hmoRaw) ? hmoRaw : []);


        if (!mounted) return;

        if (patientRes.status === 'fulfilled') {
          setPatient(patientRes.value?.data ?? patientRes.value);
        }

        if (billingsRes.status === 'fulfilled') {
          const raw = billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [];
          const list = Array.isArray(raw) ? raw : [];
          setBillings(list);


          // ✅ Initialize decisions from existing hmoStatus or default to 'pending'
          const initial = {};
          list.forEach(bill => {
            initial[bill.id] = {};
            (bill.itemDetails || []).forEach((item, idx) => {
              initial[bill.id][idx] = item.hmoStatus || 'pending';
            });
          });
          setItemDecisions(initial);

          const unreviewedBills = list.filter(bill => {
  // Show bill if ANY item has no hmoStatus yet (never reviewed)
  const hasUnreviewedItems = (bill.itemDetails || []).some(
    item => !item.hmoStatus || item.hmoStatus === 'pending'
  );
  // Also show if bill is not cleared (outstanding balance exists)
  return hasUnreviewedItems && !bill.isCleared;
});
setBillings(unreviewedBills);
        }
      } catch (err) {
        console.error("IncomingHmoDetails: load error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadAll();
    return () => { mounted = false; };
  }, [patientId]);

// ✅ One function handles both single and bulk
const setDecision = (billingId, itemIdx, status, hmoCovered = 0) => {
  setItemDecisions(prev => ({
    ...prev,
    [billingId]: {
      ...prev[billingId],
      [itemIdx]: { status, hmoCovered: Number(hmoCovered) || 0 }
    }
  }));
};

const setAllDecisions = (status) => {
  setItemDecisions(() => {
    const next = {};
    billings.forEach(bill => {
      next[bill.id] = {};
      (bill.itemDetails || []).forEach((item, idx) => {
        next[bill.id][idx] = {
          status,
          hmoCovered: status === 'approved' ? Number(item.total || 0) : 0
        };
      });
    });
    return next;
  });
};


const approvedTotal = useMemo(() => {
  let total = 0;
  billings.forEach(bill => {
    (bill.itemDetails || []).forEach((item, idx) => {
      const decision = itemDecisions[bill.id]?.[idx];
      if (decision?.status === 'approved') {
        total += Number(item.total || 0);
      } else if (decision?.status === 'partial') {
        total += Number(decision.hmoCovered || 0);
      }
    });
  });
  return total;
}, [billings, itemDecisions]);

const handleSendToStatus = async (status) => {
  try {
    setSendingStatuses(prev => ({ ...prev, [status]: true }));
    const statusMap = {
      'Lab': PATIENT_STATUS.AWAITING_LAB,
      'Pharmacy': PATIENT_STATUS.AWAITING_PHARMACY,
    };

    const newStatus = statusMap[status];
    if (!newStatus) return;

    await updatePatientStatus(patientId, newStatus);
    toast.success(`Patient sent to ${status} successfully`);
    navigate(-1);
  } catch (err) {
    toast.error(err?.response?.data?.message || `Failed to send to ${status}`);
  } finally {
    setSendingStatuses(prev => ({ ...prev, [status]: false }));
  }
};

const handleSubmit = async () => {
  setSubmitting(true);
  try {
    await Promise.all(
      billings.map(async (bill) => {
        const updatedItems = (bill.itemDetails || []).map((item, idx) => {
          const decision = itemDecisions[bill.id]?.[idx] || { status: 'pending', hmoCovered: 0 };
          const itemTotal = Number(item.total || 0);

          let hmoCovered = 0;
          if (decision.status === 'approved') hmoCovered = itemTotal;
          else if (decision.status === 'partial') hmoCovered = Number(decision.hmoCovered || 0);
          else hmoCovered = 0;

          const patientPays = itemTotal - hmoCovered;

          return {
            ...item,
            hmoStatus: decision.status,
            hmoCovered,          // ✅ how much HMO covers for this item
            patientOwes: patientPays, // ✅ how much patient pays for this item
          };
        });

        // ✅ Outstanding = sum of what patient owes per item
        const outstandingBill = updatedItems.reduce(
          (sum, item) => sum + Number(item.patientOwes || 0), 0
        );

        // ✅ HMO covered = sum of what HMO covers per item
        const hmoCoveredAmount = updatedItems.reduce(
          (sum, item) => sum + Number(item.hmoCovered || 0), 0
        );

        await updateBilling(bill.id, {
          itemDetails: updatedItems,
          outstandingBill,
          hmoCoveredAmount,
        });
      })
    );

    await toast.promise(
      updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_CASHIER }),
      {
        loading: 'Sending to cashier...',
        success: 'Patient sent to cashier',
        error: (err) => err?.response?.data?.message || 'Failed to update status',
      }
    );

    navigate('/dashboard/hmo/incoming');
  } catch (err) {
    console.error('HMO submit error', err);
    toast.error('Failed to submit HMO decisions');
  } finally {
    setSubmitting(false);
  }
};

  const handleSendBackToDoctor = async () => {
    setSubmitting(true);
    try {
      await toast.promise(
        updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_DOCTOR }),
        {
          loading: 'Sending back to doctor...',
          success: 'Patient sent back to doctor',
          error: (err) => err?.response?.data?.message || 'Failed',
        }
      );
      navigate('/dashboard/hmo/incoming');
    } catch {
        toast.error('Failed to send back to doctor');
    } finally {
      setSubmitting(false);
    }
  };

  

  const fullName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Unknown';
  const displayStatus = getStatusDisplayText(patient?.status);
  const badgeClass = getStatusBadgeClass(patient?.status);

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex overflow-hidden flex-col flex-1">
        <Header />
        <div className="overflow-y-auto flex-1 p-6">

          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold">HMO Review</h1>
              <p className="text-base-content/60 text-sm mt-1">
                Approve or reject each item. All items go to cashier —
                approved items are HMO-covered, rejected items are patient self-pay.
              </p>
            </div>
            <button className="btn btn-sm btn-outline" onClick={() => navigate('/dashboard/hmo/incoming')}>
              ← Back
            </button>
          </div>

          {/* Patient Info */}
          <div className="card bg-base-100 border border-base-200 mb-6">
            <div className="card-body p-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold">
                    {fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-base-content">{fullName}</p>
                    <p className="text-sm text-base-content/60">
                      {patient?.hospitalId || patientId} 
                    </p>
                  </div>
                </div>
                <span className={`badge ${badgeClass}`}>{displayStatus}</span>
              </div>
            </div>
          </div>

          {hmos.length > 0 && (
  <div className="card bg-base-100 border border-base-200 mb-6">
    <div className="card-body p-0">
      <div className="px-5 py-3 bg-base-200/40 border-b border-base-200">
        <p className="text-sm font-semibold text-base-content">
          Insurance / HMO Records
          <span className="ml-2 badge badge-info badge-sm">{hmos.length}</span>
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="table table-sm w-full">
          <thead>
            <tr className="border-b border-base-200">
              <th>Provider</th>
              <th>Plan</th>
              <th>Member ID</th>
              <th>Expires</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {hmos.map((hmo, idx) => {
              const isExpired = hmo.expiresAt
                ? new Date(hmo.expiresAt) < new Date()
                : false;
              return (
                <tr key={hmo.id || idx} className="border-b border-base-200 last:border-0">
                  <td className="font-medium capitalize">{hmo.provider || '—'}</td>
                  <td className="capitalize">{hmo.plan || '—'}</td>
                  <td className="font-mono text-sm">{hmo.memberId || '—'}</td>
                  <td className="text-sm">
                    {hmo.expiresAt
                      ? formatNigeriaDateShort(hmo.expiresAt)
                      : '—'}
                  </td>
                  <td>
                    <span className={`badge badge-sm ${isExpired ? 'badge-error' : 'badge-success'}`}>
                      {isExpired ? 'Expired' : 'Active'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  </div>
)}

     

          {/* Bulk actions */}
          {!loading && billings.length > 0 && (
            <div className="flex gap-2 mb-4">
              <button className="btn btn-success btn-sm" onClick={() => setAllDecisions('approved')} disabled={submitting}>
                Approve All
              </button>
              <button className="btn btn-error btn-sm" onClick={() => setAllDecisions('rejected')} disabled={submitting}>
                Reject All
              </button>
                  {/* ✅ Reset all back to pending */}
    <button className="btn btn-ghost btn-sm" onClick={() => setAllDecisions('pending')} disabled={submitting}>
      ↺ Reset All
    </button>
            </div>
          )}

          {/* Billing Items */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="loading loading-spinner loading-lg" />
            </div>
          ) : billings.length === 0 ? (
            <div className="card bg-base-100 border border-base-200">
              <div className="card-body py-12 text-center text-base-content/50">
                No billing items found for this patient.
              </div>
            </div>
          ) : (
            billings.map(bill => (
              <div key={bill.id} className="card bg-base-100 border border-base-200 mb-4">
                <div className="card-body p-0">
                  {/* Bill Header */}
                  <div className="px-5 py-3 bg-base-200/40 border-b border-base-200 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">Bill #{bill.id?.slice(-8)}</p>
                      <p className="text-xs text-base-content/50">
                        By {bill.raisedBy?.firstName} {bill.raisedBy?.lastName} · {bill.raisedBy?.accountType}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">₦{Number(bill.totalAmount || 0).toLocaleString()}</p>
                      <p className="text-xs text-base-content/50">Total</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr className="border-b border-base-200">
                          <th>Description</th>
                          <th>Code</th>
                          <th className="text-right">Price</th>
                          <th className="text-right">Qty</th>
                          <th className="text-right">Total</th>
                          <th className="text-center w-48">HMO Decision</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(bill.itemDetails || []).map((item, idx) => {
                          const decision = itemDecisions[bill.id]?.[idx] || 'pending';
                          return (
                            <tr
                              key={idx}
                              className={`border-b border-base-200 last:border-0 transition-colors ${
                                decision === 'approved' ? 'bg-success/5' :
                                decision === 'rejected' ? 'bg-error/5' :
                                'hover:bg-base-200/30'
                              }`}
                            >
                       <td>
  <p className="font-medium">{item.description}</p>
  {(() => {
    const d = itemDecisions[bill.id]?.[idx];
    if (d?.status === 'approved') return <span className="text-xs text-success">HMO Covers Full ₦{Number(item.total).toLocaleString()}</span>;
    if (d?.status === 'rejected') return <span className="text-xs text-error">Patient Self-Pay ₦{Number(item.total).toLocaleString()}</span>;
    if (d?.status === 'partial') return (
      <span className="text-xs text-warning">
        Partial — HMO: ₦{Number(d.hmoCovered || 0).toLocaleString()} · Patient: ₦{(Number(item.total) - Number(d.hmoCovered || 0)).toLocaleString()}
      </span>
    );
    return null;
  })()}
</td>
                              <td className="text-xs text-base-content/60">{item.code}</td>
                              <td className="text-right">₦{Number(item.price || 0).toLocaleString()}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right font-medium">₦{Number(item.total || 0).toLocaleString()}</td>
                       <td className="text-center">
  <div className="flex flex-col items-center gap-2">
    {/* Approve / Reject / Partial toggle buttons */}
    <div className="flex items-center gap-1">
      <button
        className={`btn btn-xs ${
          itemDecisions[bill.id]?.[idx]?.status === 'approved'
            ? 'btn-success' : 'btn-outline btn-success'
        }`}
        onClick={() => setDecision(bill.id, idx, 
          itemDecisions[bill.id]?.[idx]?.status === 'approved' ? 'pending' : 'approved',
          item.total  // HMO covers full amount
        )}
        disabled={submitting}
      >
        ✓ Full
      </button>
      <button
        className={`btn btn-xs ${
          itemDecisions[bill.id]?.[idx]?.status === 'partial'
            ? 'btn-warning' : 'btn-outline btn-warning'
        }`}
        onClick={() => setDecision(bill.id, idx, 
          itemDecisions[bill.id]?.[idx]?.status === 'partial' ? 'pending' : 'partial',
          0  // user will enter amount
        )}
        disabled={submitting}
      >
        ½ Partial
      </button>
      <button
        className={`btn btn-xs ${
          itemDecisions[bill.id]?.[idx]?.status === 'rejected'
            ? 'btn-error' : 'btn-outline btn-error'
        }`}
        onClick={() => setDecision(bill.id, idx,
          itemDecisions[bill.id]?.[idx]?.status === 'rejected' ? 'pending' : 'rejected',
          0
        )}
        disabled={submitting}
      >
        ✕ None
      </button>
    </div>

    {/* ✅ Show amount input only when partial is selected */}
    {itemDecisions[bill.id]?.[idx]?.status === 'partial' && (
      <div className="flex items-center gap-1 mt-1">
        <span className="text-xs text-base-content/60">₦</span>
        <input
          type="number"
          className="input input-bordered input-xs w-24 text-right"
          placeholder="HMO amount"
          min={0}
          max={Number(item.total || 0)}
          value={itemDecisions[bill.id]?.[idx]?.hmoCovered || ''}
          onChange={(e) => {
            const val = Math.min(
              Number(e.target.value) || 0,
              Number(item.total || 0)
            );
            setDecision(bill.id, idx, 'partial', val);
          }}
          disabled={submitting}
        />
        <span className="text-xs text-base-content/40">
          / ₦{Number(item.total || 0).toLocaleString()}
        </span>
      </div>
    )}

    {/* Show per-item breakdown */}
    {itemDecisions[bill.id]?.[idx]?.status === 'partial' && (
      <div className="text-xs mt-0.5">
        <span className="text-success">
          HMO: ₦{Number(itemDecisions[bill.id]?.[idx]?.hmoCovered || 0).toLocaleString()}
        </span>
        <span className="text-base-content/40 mx-1">·</span>
        <span className="text-error">
          Patient: ₦{(Number(item.total || 0) - Number(itemDecisions[bill.id]?.[idx]?.hmoCovered || 0)).toLocaleString()}
        </span>
      </div>
    )}
  </div>
</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}

     {/* Submit Footer */}
{/* Submit Footer */}
{!loading && billings.length > 0 && (
  <div className="card bg-base-100 border border-base-200 mt-6">
    <div className="card-body p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        
        {/* ✅ Breakdown summary */}
        <div className="space-y-1">
          {/* Total bill */}
          <p className="text-sm text-base-content/60">
            Total Bill: <span className="font-medium text-base-content">
              ₦{billings.reduce((s, b) => s + Number(b.totalAmount || 0), 0).toLocaleString()}
            </span>
          </p>

          {/* HMO covers */}
          {approvedTotal > 0 && (
            <p className="text-sm text-success font-medium">
              ✓ HMO Covers: ₦{approvedTotal.toLocaleString()}
            </p>
          )}

          {/* Patient pays */}
          {(() => {
            const rejectedTotal = billings.reduce((sum, bill) => {
              return sum + (bill.itemDetails || []).reduce((s, item, idx) => {
                if (itemDecisions[bill.id]?.[idx] === 'rejected') {
                  return s + Number(item.total || 0);
                }
                return s;
              }, 0);
            }, 0);
            return rejectedTotal > 0 ? (
              <p className="text-sm text-error font-medium">
                ✕ Patient Pays: ₦{rejectedTotal.toLocaleString()}
              </p>
            ) : null;
          })()}

          {/* Pending items warning */}
          {(() => {
            const hasPending = billings.some(bill =>
              (bill.itemDetails || []).some((_, idx) =>
                !itemDecisions[bill.id]?.[idx] || itemDecisions[bill.id]?.[idx] === 'pending'
              )
            );
            return hasPending ? (
              <p className="text-xs text-warning">⚠ Some items still need a decision</p>
            ) : null;
          })()}
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="btn btn-sm"
            onClick={() => handleSendToStatus('Lab')}
          >
            {sendingStatuses.Lab ? 'Processing...' : 'Send to Lab'}
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => handleSendToStatus('Pharmacy')}
          >
            {sendingStatuses.Pharmacy ? 'Processing...' : 'Send to Pharmacy'}
          </button>
          <button
            className="btn btn-outline btn-warning btn-sm"
            onClick={handleSendBackToDoctor}
            disabled={submitting}
          >
            Send Back to Doctor
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <span className="loading loading-spinner loading-sm" />
              : 'Submit & Send to Cashier'
            }
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* Modals removed - sending directly */}

        </div>
      </div>
    </div>
  );
};

export default IncomingHmoDetails;