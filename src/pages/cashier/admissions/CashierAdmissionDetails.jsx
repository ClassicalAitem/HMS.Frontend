import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaCheckCircle, FaFileAlt, FaFileInvoice } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearCurrentPatient } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import apiClient from '@/services/api/apiClient';
import admissionApi from '@/services/api/admissionApi';
import { getBillingsByAdmissionId, getAllReceipts, createReceipt } from '@/services/api/billingAPI';
import { getInvestigationByPatientId } from '@/services/api/investigationRequestAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { ReceiptModal } from '@/components/modals';
import { formatNigeriaDate, formatNigeriaTime, formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import PatientDetailsCard from '@/components/common/PatientDetailsCard';
import KolakLoader from '@/components/common/KolakLoader';

const CashierAdmissionDetails = () => {
  const { admissionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading: patientLoading } = useAppSelector((state) => state.patients);

  const [loading, setLoading] = useState(true);
  const [admission, setAdmission] = useState(null);
  const [ledgerItems, setLedgerItems] = useState([]);
  const [unbilledGroups, setUnbilledGroups] = useState({ labs: [], ivs: [], treatments: [] });
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  
  const [openRow, setOpenRow] = useState(null);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [billDraft, setBillDraft] = useState(null);

  const toggleRow = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const admRes = await admissionApi.getAdmissionById(admissionId);
      const admData = admRes?.data || admRes;
      setAdmission(admData);

      if (admData.patientId) {
        dispatch(fetchPatientById(admData.patientId));
        
        // Fetch Bills for Admission
        const billsRes = await getBillingsByAdmissionId(admissionId);
        let allBillings = Array.isArray(billsRes.data?.data || billsRes.data) ? (billsRes.data?.data || billsRes.data) : [];
        
        let masterBillItems = [];
        const billsWithPayments = await Promise.all(allBillings.map(async (bill) => {
          const billId = bill.id || bill._id;
          if (!billId) return { ...bill, paidAmount: 0 };
          const receiptsRes = await getAllReceipts({ billingId: billId });
          const billReceipts = receiptsRes.data?.data || receiptsRes.data || [];
          const paidAmount = (Array.isArray(billReceipts) ? billReceipts : [])
            .reduce((sum, r) => sum + Number(r.amountPaid || 0), 0);
          return { ...bill, paidAmount };
        }));
        
        allBillings = billsWithPayments;
        setBillings(billsWithPayments);

        allBillings.forEach(bill => {
          (bill.itemDetails || []).forEach(item => {
            if (String(item.admissionId || '') === String(admissionId) || String(bill.id || bill._id) === String(admData.billId || '')) {
              masterBillItems.push({
                ...item,
                billId: bill.id || bill._id,
                isBilled: true,
                paymentStatus: bill.isCleared ? 'paid' : (item.paymentStatus || 'pending')
              });
            }
          });
        });

        // Fetch Unbilled items (labs, IVs, treatments)
        let unbilledLabs = [];
        let unbilledIvs = [];
        let unbilledTreatments = [];

        try {
          const [labsResult, chargesResult] = await Promise.allSettled([
            getInvestigationByPatientId(admData.patientId),
            getServiceCharges(),
          ]);
          if (labsResult.status === 'rejected') throw labsResult.reason;
          const labsRes = labsResult.value;
          const chargesRes = chargesResult.status === 'fulfilled' ? chargesResult.value : [];
          const rawLabs = Array.isArray(labsRes?.data ?? labsRes) ? (labsRes?.data ?? labsRes) : [];
          const rawCharges = chargesRes?.data?.data ?? chargesRes?.data ?? chargesRes;
          const serviceCharges = Array.isArray(rawCharges) ? rawCharges : rawCharges?.data || [];
          const findCharge = (name, chargeId) => {
            if (chargeId) {
              const matchingCharge = serviceCharges.find(charge => String(charge.id || charge._id) === String(chargeId));
              if (matchingCharge) return matchingCharge;
            }
            const normalizedName = String(name || '').trim().toLowerCase();
            if (!normalizedName) return null;
            return serviceCharges.find(charge => {
              const chargeName = String(charge.service || charge.name || '').trim().toLowerCase();
              return chargeName && (chargeName === normalizedName || chargeName.includes(normalizedName) || normalizedName.includes(chargeName));
            });
          };

          rawLabs
            .filter(l => !l.isBilled && String(l.admissionId || '') === String(admissionId))
            .forEach(l => {
              const tests = Array.isArray(l.tests) && l.tests.length > 0 ? l.tests : [{ name: l.testName || l.type || 'Investigation' }];
              tests.forEach(test => {
                const testName = typeof test === 'string' ? test : test?.name || test?.code || l.type || 'Investigation';
                const charge = findCharge(testName, test?.serviceChargeId || l.serviceChargeId);
                const configuredPrice = test?.price ?? l.price ?? charge?.amount ?? charge?.price;
                const hasConfiguredPrice = configuredPrice !== undefined && configuredPrice !== null &&
                  !(typeof configuredPrice === 'string' && !configuredPrice.trim()) &&
                  Number.isFinite(Number(configuredPrice));
                const price = hasConfiguredPrice ? Number(configuredPrice) : 0;
                unbilledLabs.push({
                  code: 'LAB',
                  description: `${testName} (Lab Test)`,
                  quantity: 1,
                  unitPrice: price,
                  price,
                  total: price,
                  isBilled: false,
                  category: 'Investigation',
                  serviceChargeId: test?.serviceChargeId || l.serviceChargeId || charge?.id || charge?._id || null,
                  investigationId: l._id || l.id,
                  hasConfiguredPrice,
                });
              });
          });
        } catch (err) {}

        try {
          const ivRes = await apiClient.get(`/iv-fluid/patient/${admData.patientId}`);
          const ivs = Array.isArray(ivRes.data?.data || ivRes.data) ? (ivRes.data?.data || ivRes.data) : [];
          ivs.filter(i => !i.isBilled && String(i.admissionId || '') === String(admissionId)).forEach(i => {
            unbilledIvs.push({
              description: `${i.fluidType} (IV Fluid)`,
              quantity: i.volume || 1, unitPrice: i.price || 0, price: i.price || 0, total: (i.price || 0) * (i.volume || 1),
              isBilled: false, category: 'IV Fluid', ivFluidOrderId: i._id || i.id
            });
          });
        } catch (err) {}

        try {
          const tRes = await apiClient.get(`/dispense/treatment-bill/preview/${admissionId}`);
          const treats = tRes.data?.data?.itemDetails || [];
          treats.forEach(t => {
            unbilledTreatments.push({
              ...t,
              isBilled: false,
              isTreatment: true
            });
          });
        } catch (err) {}

        setLedgerItems([...masterBillItems]);
        setUnbilledGroups({
          labs: unbilledLabs,
          ivs: unbilledIvs,
          treatments: unbilledTreatments
        });

        // Fetch receipts for this admission's bills
        let admissionReceipts = [];
        for (const bill of billsWithPayments) {
          try {
            const rRes = await getAllReceipts({ billingId: bill.id || bill._id });
            const rData = rRes.data?.data || rRes.data || [];
            admissionReceipts = [...admissionReceipts, ...(Array.isArray(rData) ? rData : [])];
          } catch(err) {}
        }
        
        // Sort receipts by date
        admissionReceipts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReceipts(admissionReceipts);
      }
    } catch (error) {
      toast.error("Failed to load admission details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      dispatch(clearCurrentPatient());
    };
  }, [admissionId, dispatch]);

  const handleReceiptSubmit = async (receiptData) => {
    try {
      const receiptPayload = {
        ...receiptData,
        dependantId: admission?.dependantId || null,
      };

      await toast.promise(
        createReceipt(selectedBillingId, receiptPayload),
        {
          loading: 'Submitting receipt...',
          success: 'Receipt submitted successfully!',
          error: (e) => e?.response?.data?.message || 'Error submitting receipt.',
        }
      );

      setIsReceiptModalOpen(false);
      fetchData(); // refresh data
    } catch (error) {
      console.error(error);
    }
  };

  const generateBillForUnbilledItems = async (unbilledList, type, discountAmount = 0, discountReason = '') => {
    try {
      const subtotal = unbilledList.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
      if (discountAmount < 0 || discountAmount > subtotal) {
        toast.error('Discount cannot exceed the bill subtotal.');
        return;
      }
      if (discountAmount > 0 && !discountReason.trim()) {
        toast.error('Enter a reason for the admission discount.');
        return;
      }

      if (type === 'unbilled_labs') {
        const missingPrice = unbilledList.find(item => !item.hasConfiguredPrice);
        if (missingPrice) {
          toast.error(`No service charge price is configured for ${missingPrice.description}.`);
          return;
        }
      }

      const toastId = toast.loading('Generating bill...');
      
      if (type === 'unbilled_treatments') {
        await apiClient.post(`/dispense/treatment-bill/${admissionId}`, {
          discountAmount,
          ...(discountAmount > 0 ? { discountReason: discountReason.trim() } : {}),
        });
        toast.success('Treatment bill generated successfully!', { id: toastId });
        fetchData();
        setBillDraft(null);
        return;
      }

      const billData = {
        patientId: admission.patientId,
        dependantId: admission.dependantId,
        itemDetail: unbilledList.map(item => ({
          code: item.code || item.category || 'MISC',
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.price,
          total: item.total,
          category: item.category,
          serviceChargeId: item.serviceChargeId || undefined,
          admissionId: admissionId,
          investigationId: item.investigationId || undefined,
          ivFluidOrderId: item.ivFluidOrderId,
          bloodTransfusionOrderId: item.bloodTransfusionOrderId,
          paymentStatus: 'pending'
        })),
        subtotalAmount: subtotal,
        discountAmount,
        ...(discountAmount > 0 ? { discountReason: discountReason.trim() } : {}),
        totalAmount: subtotal - discountAmount
      };

      await apiClient.post(`/billing/create/${admission.patientId}`, billData);
      toast.success('Bill generated successfully!', { id: toastId });
      setBillDraft(null);
      fetchData(); // refresh
    } catch (error) {
      toast.error('Failed to generate bill.');
    }
  };

  const groupedBillings = useMemo(() => {
    const groups = {};
    const unbilled = [];

    ledgerItems.forEach(item => {
      if (item.billId) {
        if (!groups[item.billId]) {
          const parentBill = billings.find(b => String(b.id || b._id) === String(item.billId));
          groups[item.billId] = {
            id: item.billId,
            createdAt: parentBill?.createdAt,
            totalAmount: parentBill?.totalAmount || 0,
            outstandingBill: parentBill?.isCleared ? 0 : (parentBill?.outstandingBill || parentBill?.totalAmount || 0),
            raisedBy: parentBill?.raisedBy || { firstName: 'Unknown', lastName: '', accountType: '' },
            isCleared: parentBill?.isCleared || false,
            itemDetails: []
          };
        }
        groups[item.billId].itemDetails.push(item);
      } else {
        unbilled.push(item);
      }
    });

    const result = Object.values(groups).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    if (unbilledGroups.treatments.length > 0) {
      result.unshift({
        id: 'unbilled_treatments', pseudo: true, createdAt: null,
        totalAmount: unbilledGroups.treatments.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        outstandingBill: unbilledGroups.treatments.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        raisedBy: { firstName: 'System', lastName: '(Treatments)', accountType: 'Auto' },
        isCleared: false, itemDetails: unbilledGroups.treatments
      });
    }
    
    if (unbilledGroups.ivs.length > 0) {
      result.unshift({
        id: 'unbilled_ivs', pseudo: true, createdAt: null,
        totalAmount: unbilledGroups.ivs.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        outstandingBill: unbilledGroups.ivs.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        raisedBy: { firstName: 'System', lastName: '(IV Fluids)', accountType: 'Auto' },
        isCleared: false, itemDetails: unbilledGroups.ivs
      });
    }

    if (unbilledGroups.labs.length > 0) {
      result.unshift({
        id: 'unbilled_labs', pseudo: true, createdAt: null,
        totalAmount: unbilledGroups.labs.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        outstandingBill: unbilledGroups.labs.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        raisedBy: { firstName: 'System', lastName: '(Labs)', accountType: 'Auto' },
        isCleared: false, itemDetails: unbilledGroups.labs
      });
    }

    return result;
  }, [ledgerItems, billings, unbilledGroups]);

  const summarySubject = useMemo(() => {
    const p = currentPatient || admission?.patient || {};
    return {
      id: p.id || p._id,
      fullName: `${p.firstName || ''} ${p.lastName || ''}`.trim() || p.name || 'Unknown',
      gender: p.gender,
      phone: p.phone || p.phoneNumber,
      hospitalId: p.hospitalId,
      status: p.status || 'Admitted',
      statusSenderName: p.statusSenderName,
      statusUser: p.statusUser,
      updatedAt: p.updatedAt,
      hmos: Array.isArray(p.hmos) ? p.hmos.filter((h) => !h.dependantId) : [],
      relationshipType: null,
    };
  }, [currentPatient, admission]);

  const totalOutstanding = billings.reduce((sum, bill) => {
    if (bill.isCleared) return sum;
    const outstanding = Number(bill.outstandingBill) || 0;
    return sum + (outstanding > 0 ? outstanding : Number(bill.totalAmount || 0));
  }, 0);

  if (loading || patientLoading) {
    return (
      <CashierLayout>
         <KolakLoader fullscreen />
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-regular text-base-content mb-6">
            Admission Ledger
          </h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/cashier/admissions')}>
            ← Back to Admissions
          </button>
        </div>

        <PatientDetailsCard
          patient={currentPatient || admission?.patient}
          summarySubject={summarySubject}
          isViewingDependant={false}
        />

        {/* Outstanding Bills */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6 mt-6">
          <h3 className="text-xl font-bold text-primary mb-4">
            Admission Billings
          </h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th></th>
                  <th>Date & Time</th>
                  <th>Total amount</th>
                  <th>Outstanding Bills</th>
                  <th>Raised By</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groupedBillings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-base-content/50">
                      No billing records found.
                    </td>
                  </tr>
                ) : groupedBillings.map((bill) => (
                  <React.Fragment key={bill.id}>
                    <tr className="text-sm hover:bg-base-50 transition-colors">
                      <td
                        onClick={() => toggleRow(bill.id)}
                        className="cursor-pointer select-none"
                        title={openRow === bill.id ? "Collapse" : "Expand"}
                      >
                        {openRow === bill.id ? "▼" : "▶"}
                      </td>
                      <td className="font-medium">
                        {bill.pseudo ? <span className="badge badge-ghost">Unbilled</span> : formatNigeriaDateTime(bill.createdAt)}
                      </td>
                      <td> ₦ {Number(bill.totalAmount).toLocaleString()}</td>
                      <td className={bill.outstandingBill > 0 ? "text-error font-medium" : "text-success"}> 
                        ₦ {Number(bill.outstandingBill).toLocaleString()}
                      </td>
                      <td className="text-success">{bill.raisedBy?.firstName} {bill.raisedBy?.lastName}</td>
                      <td className="text-success">{bill.raisedBy?.accountType || 'Auto'}</td>
                      <td>
                        {bill.pseudo ? (
                          <button
                            onClick={() => setBillDraft({
                              items: bill.itemDetails,
                              type: bill.id,
                              discountAmount: '',
                              discountReason: '',
                            })}
                            className="btn btn-sm btn-outline btn-primary"
                          >
                            Generate Bill
                          </button>
                        ) : bill.isCleared ? (
                          <button className="btn btn-sm btn-ghost" disabled>Completed</button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsReceiptModalOpen(true);
                              setSelectedBillingId(bill.id);
                            }}
                            className="btn btn-sm btn-ghost"
                          >
                            Pay now
                          </button>
                        )}
                      </td>
                    </tr>

                    {openRow === bill.id && (
                      <tr>
                        <td colSpan={7} className="bg-base-200">
                          <div className="p-3">
                            <div className="mb-3 text-sm flex items-center justify-between">
                              <p>Total: ₦{Number(bill.totalAmount).toLocaleString()}</p>
                              {!bill.pseudo && (
                                <span className="badge badge-primary font-semibold text-xs ml-4">
                                  🏥 Inpatient / Admission Bill
                                </span>
                              )}
                            </div>
                            <h4 className="font-semibold mb-2">Item Details</h4>
                            <table className="table w-full bg-base-100 rounded-lg shadow-sm">
                              <thead>
                                <tr className="bg-base-200">
                                  <th>Description</th>
                                  <th>Category</th>
                                  <th>Date</th>
                                  <th>Price</th>
                                  <th>Qty</th>
                                  <th>Total</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.itemDetails.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.description}</td>
                                    <td><span className="badge badge-xs badge-outline">{item.category || 'N/A'}</span></td>
                                    <td className="text-xs text-base-content/70">
                                      {item.createdAt ? formatNigeriaDateTime(item.createdAt) : (bill.pseudo ? 'Unbilled' : formatNigeriaDateTime(bill.createdAt))}
                                    </td>
                                    <td>₦ {Number(item.price || item.unitPrice || 0).toLocaleString()}</td>
                                    <td>{item.quantity}</td>
                                    <td>₦ {Number(item.total || item.price || 0).toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 pt-4 border-t border-base-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-error"></span>
              <span className="text-error font-semibold">Outstanding Balance: ₦{totalOutstanding.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Payment History */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary">Admission Receipt History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200">
                <tr className="text-xs text-base-content/60 uppercase tracking-wide">
                  <th>Receipt Reference</th>
                  <th>Date</th>
                  <th>Amount Paid</th>
                  <th>Method</th>
                  <th>Destination</th>
                  <th>Status</th>
                  <th>Paid By</th>
                  <th>Cashier</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {(showAllReceipts ? receipts : receipts.slice(0, 3)).map((payment, index) => {
                  const date = formatNigeriaDate(payment.createdAt);
                  const time = formatNigeriaTime(payment.createdAt);

                  return (
                    <tr key={index} className="text-sm">
                      <td className="font-medium">
                        <button
                          onClick={() => navigate(`/cashier/receipt-details/${payment.id}`, { state: { receiptData: payment } })}
                          className="text-primary hover:underline cursor-pointer"
                        >
                          {payment.reference}
                        </button>
                      </td>
                      <td>{date}</td>
                      <td>₦ {Number(payment.amountPaid).toLocaleString()}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>{payment.paymentDestination}</td>
                      <td>
                        <span className={`badge badge-sm ${
                          payment.status === "paid" ? "badge-success" :
                          payment.status === "pending" ? "badge-info" :
                          "badge-neutral"
                        }`}>
                          {payment.status}
                        </span>
                      </td>
                      <td>{payment.paidBy}</td>
                      <td>{payment.cashier?.firstName} {payment.cashier?.lastName}</td>
                      <td>{time}</td>
                    </tr>
                  );
                })}
                {receipts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-8 text-base-content/50">
                      No receipt records found for this admission.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {receipts.length > 3 && !showAllReceipts && (
            <div className="mt-4 flex justify-center">
              <button onClick={() => setShowAllReceipts(true)} className="btn btn-outline btn-primary btn-sm">
                View All ({receipts.length} receipts)
              </button>
            </div>
          )}

          {showAllReceipts && receipts.length > 3 && (
            <div className="mt-4 flex justify-center">
              <button onClick={() => setShowAllReceipts(false)} className="btn btn-outline btn-sm">
                Show Less
              </button>
            </div>
          )}
        </div>

        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          billingId={selectedBillingId}
          patientId={admission?.patientId}
          onSubmit={handleReceiptSubmit}
        />

        {billDraft && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
            <form
              className="w-full max-w-md space-y-4 rounded-lg bg-base-100 p-5 shadow-xl"
              onSubmit={(event) => {
                event.preventDefault();
                generateBillForUnbilledItems(
                  billDraft.items,
                  billDraft.type,
                  Number(billDraft.discountAmount) || 0,
                  billDraft.discountReason || ''
                );
              }}
            >
              <div>
                <h3 className="text-lg font-semibold">Generate Admission Bill</h3>
                <p className="text-sm text-base-content/60">
                  Subtotal: ₦{billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0).toLocaleString()}
                </p>
              </div>
              <label className="form-control">
                <span className="label-text">Fixed discount amount</span>
                <input
                  type="number"
                  min="0"
                  max={billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)}
                  step="1"
                  value={billDraft.discountAmount}
                  onChange={(event) => setBillDraft((current) => ({ ...current, discountAmount: event.target.value }))}
                  className="input input-bordered"
                  placeholder="₦0"
                />
              </label>
              {Number(billDraft.discountAmount) > 0 && (
                <label className="form-control">
                  <span className="label-text">Reason for discount *</span>
                  <input
                    value={billDraft.discountReason}
                    onChange={(event) => setBillDraft((current) => ({ ...current, discountReason: event.target.value }))}
                    className="input input-bordered"
                    required
                  />
                </label>
              )}
              <p className="text-sm font-semibold">
                Amount due: ₦{Math.max(0, billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) - (Number(billDraft.discountAmount) || 0)).toLocaleString()}
              </p>
              <div className="flex justify-end gap-2">
                <button type="button" className="btn btn-ghost" onClick={() => setBillDraft(null)}>Cancel</button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={Number(billDraft.discountAmount) < 0 || Number(billDraft.discountAmount) > billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || (Number(billDraft.discountAmount) > 0 && !billDraft.discountReason.trim())}
                >
                  Generate Bill
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </CashierLayout>
  );
};

export default CashierAdmissionDetails;
