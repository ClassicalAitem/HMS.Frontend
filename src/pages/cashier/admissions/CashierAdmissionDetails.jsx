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
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  
  const [openRow, setOpenRow] = useState(null);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);

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

        // Fetch Unbilled items (labs, IVs, blood)
        let unbilledItems = [];
        try {
          const labsRes = await getInvestigationByPatientId(admData.patientId);
          const rawLabs = Array.isArray(labsRes?.data ?? labsRes) ? (labsRes?.data ?? labsRes) : [];
          rawLabs.filter(l => !l.isBilled && String(l.admissionId || '') === String(admissionId)).forEach(l => {
            unbilledItems.push({
              description: `${l.testName || l.type || 'Investigation'} (Lab Test)`,
              quantity: 1, unitPrice: l.price || 0, price: l.price || 0, total: l.price || 0,
              isBilled: false, category: 'Investigation', investigationRequestId: l._id || l.id,
            });
          });
        } catch (err) {}

        try {
          const ivRes = await apiClient.get(`/iv-fluid/patient/${admData.patientId}`);
          const ivs = Array.isArray(ivRes.data?.data || ivRes.data) ? (ivRes.data?.data || ivRes.data) : [];
          ivs.filter(i => !i.isBilled && String(i.admissionId || '') === String(admissionId)).forEach(i => {
            unbilledItems.push({
              description: `${i.fluidType} (IV Fluid)`,
              quantity: i.volume || 1, unitPrice: i.price || 0, price: i.price || 0, total: (i.price || 0) * (i.volume || 1),
              isBilled: false, category: 'IV Fluid', ivFluidOrderId: i._id || i.id
            });
          });
        } catch (err) {}

        try {
          const btRes = await apiClient.get(`/blood-transfusion/patient/${admData.patientId}`);
          const bts = Array.isArray(btRes.data?.data || btRes.data) ? (btRes.data?.data || btRes.data) : [];
          bts.filter(i => !i.isBilled && String(i.admissionId || '') === String(admissionId)).forEach(i => {
            unbilledItems.push({
              description: `${i.bloodGroup} (Blood Transfusion)`,
              quantity: i.unitsRequested || 1, unitPrice: i.price || 0, price: i.price || 0, total: (i.price || 0) * (i.unitsRequested || 1),
              isBilled: false, category: 'Blood Transfusion', bloodTransfusionOrderId: i._id || i.id
            });
          });
        } catch (err) {}

        setLedgerItems([...masterBillItems, ...unbilledItems]);

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

  const generateBillForUnbilledItems = async (unbilledList) => {
    try {
      const toastId = toast.loading('Generating bill...');
      const billData = {
        patientId: admission.patientId,
        dependantId: admission.dependantId,
        itemDetail: unbilledList.map(item => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.price,
          total: item.total,
          category: item.category,
          admissionId: admissionId,
          investigationRequestId: item.investigationRequestId,
          ivFluidOrderId: item.ivFluidOrderId,
          bloodTransfusionOrderId: item.bloodTransfusionOrderId,
          paymentStatus: 'pending'
        })),
        totalAmount: unbilledList.reduce((acc, curr) => acc + (curr.total || 0), 0)
      };

      await apiClient.post(`/billing/create/${admission.patientId}`, billData);
      toast.success('Bill generated successfully!', { id: toastId });
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

    if (unbilled.length > 0) {
      result.unshift({
        id: 'unbilled',
        pseudo: true,
        createdAt: null,
        totalAmount: unbilled.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        outstandingBill: unbilled.reduce((acc, curr) => acc + (curr.total || curr.price || 0), 0),
        raisedBy: { firstName: 'System', lastName: '(Unbilled items)', accountType: 'Auto' },
        isCleared: false,
        itemDetails: unbilled
      });
    }

    return result;
  }, [ledgerItems, billings]);

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
                            onClick={() => generateBillForUnbilledItems(bill.itemDetails)}
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
      </div>
    </CashierLayout>
  );
};

export default CashierAdmissionDetails;
