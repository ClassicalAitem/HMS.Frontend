import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { Header } from "@/components/common";
import Sidebar from "@/components/hmo/dashboard/Sidebar";
import { getPatientById, updatePatientStatus } from "@/services/api/patientsAPI";
import { getAllBillings, updateBilling } from "@/services/api/billingAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { getStatusBadgeClass, getStatusDisplayText } from "@/utils/statusUtils";
import toast from "react-hot-toast";
import { getAllHmos } from "@/services/api/hmoAPI";
import apiClient from "@/services/api/apiClient";
import { LabActionModal, PharmacyActionModal2 } from "@/components/modals";

const IncomingHmoDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const snapshot = location.state?.patientSnapshot;

  const [patient, setPatient] = useState(snapshot || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [billings, setBillings] = useState([]);
  const [hmos, setHmos] = useState([]);
  const [isSendToLabOpen, setIsSendToLabOpen] = useState(false);
const [isSendToPharmacyOpen, setIsSendToPharmacyOpen] = useState(false);

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
const setDecision = (billingId, itemIdx, decision) => {
  setItemDecisions(prev => ({
    ...prev,
    [billingId]: { ...prev[billingId], [itemIdx]: decision }
  }));
};

// ✅ Bulk just iterates and calls setDecision logic directly
const setAllDecisions = (decision) => {
  setItemDecisions(() => {
    const next = {};
    billings.forEach(bill => {
      next[bill.id] = {};
      (bill.itemDetails || []).forEach((_, idx) => {
        next[bill.id][idx] = decision;
      });
    });
    return next;
  });
};


//✅ Approved total
  const approvedTotal = useMemo(() => {
    let total = 0;
    billings.forEach(bill => {
      (bill.itemDetails || []).forEach((item, idx) => {
        if (itemDecisions[bill.id]?.[idx] === 'approved') {
          total += Number(item.total || 0);
        }
      });
    });
    return total;
  }, [billings, itemDecisions]);

  const handleSubmit = async () => {
   
    setSubmitting(true);
    try {
      // ✅ Step 1 — Update each billing's itemDetails with hmoStatus
      await Promise.all(
        billings.map(async (bill) => {
          const updatedItems = (bill.itemDetails || []).map((item, idx) => ({
            ...item,
            hmoStatus: itemDecisions[bill.id]?.[idx] || 'pending',
          }));

          // ✅ Recalculate outstanding — only rejected items need to be paid by patient
          const rejectedTotal = updatedItems
            .filter(item => item.hmoStatus === 'rejected')
            .reduce((sum, item) => sum + Number(item.total || 0), 0);

          await updateBilling(bill.id, {
            itemDetails: updatedItems,
            outstandingBill: rejectedTotal, // ✅ only rejected items are outstanding
          });
        })
      );

      // ✅ Step 2 — Send patient to cashier regardless
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
                      ? new Date(hmo.expiresAt).toLocaleDateString()
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
                                {decision === 'approved' && (
                                  <span className="text-xs text-success">HMO Covered</span>
                                )}
                                {decision === 'rejected' && (
                                  <span className="text-xs text-error">Patient Self-Pay</span>
                                )}
                              </td>
                              <td className="text-xs text-base-content/60">{item.code}</td>
                              <td className="text-right">₦{Number(item.price || 0).toLocaleString()}</td>
                              <td className="text-right">{item.quantity}</td>
                              <td className="text-right font-medium">₦{Number(item.total || 0).toLocaleString()}</td>
                            <td className="text-center">
                            <div className="flex items-center justify-center gap-2">
                                <button
                                className={`btn btn-xs ${decision === 'approved' ? 'btn-success' : 'btn-outline btn-success'}`}
                                onClick={() => setDecision(bill.id, idx, decision === 'approved' ? 'pending' : 'approved')}
                                disabled={submitting}
                                >
                                ✓ Approve
                                </button>
                                <button
                                className={`btn btn-xs ${decision === 'rejected' ? 'btn-error' : 'btn-outline btn-error'}`}
                                onClick={() => setDecision(bill.id, idx, decision === 'rejected' ? 'pending' : 'rejected')}
                                disabled={submitting}
                                >
                                ✕ Reject
                                </button>
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
{!loading && billings.length > 0 && (
  <div className="card bg-base-100 border border-base-200 mt-6">
    <div className="card-body p-5">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="space-y-1">
          {approvedTotal > 0 && (
            <p className="text-sm text-success font-medium">
              ✓ ₦{approvedTotal.toLocaleString()} covered by HMO
            </p>
          )}
          
        </div>
        <div className="flex flex-wrap gap-3">
          {/* ✅ Send to Lab */}
          <button
            className="btn  btn-sm"
            onClick={() => setIsSendToLabOpen(true)}
            disabled={submitting}
          >
            Send to Lab
          </button>

          {/* ✅ Send to Pharmacy */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsSendToPharmacyOpen(true)}
            disabled={submitting}
          >
            Send to Pharmacy
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

{/* Modals — outside the card */}
<LabActionModal
  isOpen={isSendToLabOpen}
  onClose={() => setIsSendToLabOpen(false)}
  patientId={patientId}
  currentStatus={patient?.status || ''}
  defaultAction={PATIENT_STATUS.AWAITING_LAB}
  onUpdated={() => {}}
/>

<PharmacyActionModal2
  isOpen={isSendToPharmacyOpen}
  onClose={() => setIsSendToPharmacyOpen(false)}
  patientId={patientId}
  currentStatus={patient?.status || ''}
  defaultAction={PATIENT_STATUS.AWAITING_PHARMACY}
  onUpdated={() => {}}
/>

        </div>
      </div>
    </div>
  );
};

export default IncomingHmoDetails;