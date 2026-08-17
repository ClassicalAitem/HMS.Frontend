import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaFileInvoice } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { createReceipt, getAllBillings, getAllReceiptByPatientId } from '@/services/api/billingAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { ReceiptModal } from '@/components/modals';
import SendPatientModal from '@/components/modals/SendPatientModal';
import { formatNigeriaDate, formatNigeriaTime } from '@/utils/formatDateTimeUtils';
import PatientDetailsCard from '@/components/common/PatientDetailsCard';
import KolakLoader from '@/components/common/KolakLoader';
import { useNotifications } from '@/contexts/NotificationContext';


const CashierPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const [openRow, setOpenRow] = useState(null);
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [showAllReceipts, setShowAllReceipts] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [selectedPatientId] = useState(patientId || (currentPatient ? currentPatient.id : null));
  const { refreshQueueCount } = useNotifications();

  const toggleRow = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  const dependantId = location?.state?.dependantId || null;
  const dependantSnapshot = location?.state?.dependantSnapshot || null;
  const isViewingDependant = !!dependantId;

  // Prefer snapshot passed from Incoming; fallback to store
  const snapshot = location?.state?.patientSnapshot || null;
  const patient = currentPatient || snapshot || null;

   const filterSubjectRecords = (items) => {
    if (!Array.isArray(items)) return [];
    return items.filter((item) => (
      isViewingDependant && dependantId ? item?.dependantId === dependantId : !item?.dependantId
    ));
  };

  const [subject, setSubject] = useState(null);
  const [subjectLoading, setSubjectLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const loadSubject = async () => {
      try {
        setSubjectLoading(true);
        if (isViewingDependant && dependantId) {
          try {
            const res = await getDependantById(dependantId);
            const dep = res?.data?.data?.dependant || res?.data?.dependant || dependantSnapshot;
            if (mounted) setSubject(dep || dependantSnapshot);
          } catch {
            if (mounted) setSubject(dependantSnapshot);
          }
        } else {
          if (mounted) setSubject(patient);
        }
      } finally {
        if (mounted) setSubjectLoading(false);
      }
    };
    loadSubject();
    return () => { mounted = false; };
  }, [isViewingDependant, dependantId, dependantSnapshot, patient]);

   const summarySubject = useMemo(() => {
    const guardian = patient || {};

    if (!isViewingDependant) {
      return {
        id: guardian.id,
        fullName: `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || guardian.name || 'Unknown',
        gender: guardian.gender,
        phone: guardian.phone || guardian.phoneNumber,
        hospitalId: guardian.hospitalId,
        status: guardian.status,
        hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
        relationshipType: null,
      };
    }

    const dep = subject || dependantSnapshot || {};

    // Dependants don't carry their own hmos — pull them out of the guardian's list
    const ownHmos = Array.isArray(guardian.hmos)
      ? guardian.hmos.filter(h => h.dependantId === (dep.id || dependantId))
      : [];

    return {
      id: dep.id || dependantId,
      fullName: `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || 'Dependant',
      gender: dep.gender || '—',
      // Dependants don't carry their own phone in this schema — fall back to guardian's
      phone: dep.phone || guardian.phone || guardian.phoneNumber,
      // Hospital ID always belongs to the parent/guardian patient record
      hospitalId: guardian.hospitalId,
      status: dep.status || dependantSnapshot?.status || 'Unknown',
      hmos: ownHmos,
      relationshipType: dep.relationshipType || dependantSnapshot?.relationshipType,
    };
  }, [isViewingDependant, subject, dependantSnapshot, patient, dependantId]);

  const fullName = summarySubject.fullName;

  const hmoList = summarySubject.hmos;

  useEffect(() => {
    if (patientId && !location?.state?.patientSnapshot) {
      dispatch(fetchPatientById(patientId));
    }
  }, [dispatch, patientId, location?.state?.patientSnapshot]);

  useEffect(() => {
    if (error && !snapshot && !currentPatient) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch, snapshot, currentPatient]);

  const getHmoCoveredAmount = (bill) => {
    return (bill.itemDetails || []).reduce(
      (sum, item) => sum + Number(item.hmoCovered || 0),
      0
    );
  };

  useEffect(() => {
    const fetchBillings = async () => {
      try {
        setIsReceiptModalOpen(false);
        const res = await getAllBillings({ patientId });
        const billingsData = res?.data?.data || res?.data || [];
        const list = Array.isArray(billingsData) ? billingsData : [];
        setBillings(filterSubjectRecords(list));
      } catch (error) {
        console.error('Error fetching billings:', error);
        setBillings([]);
      }
    }
    fetchBillings();
  }, [patientId, isViewingDependant, dependantId])

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        const res = await getAllReceiptByPatientId(patientId);
        const receiptsData = res?.data?.data || res?.data || [];
        const list = Array.isArray(receiptsData) ? receiptsData : [];
        setReceipts(filterSubjectRecords(list));
      } catch (error) {
        console.error('Error fetching receipts:', error);
        setReceipts([]);
      }
    }
    fetchReceipts();
  }, [patientId, isViewingDependant, dependantId]);

  const handleReceiptSubmit = async (receiptData) => {
    try {
      const receiptPayload = {
        ...receiptData,
        dependantId: isViewingDependant ? dependantId : null,
      };

      await toast.promise(
        createReceipt(selectedBillingId, receiptPayload),
        {
          loading: 'Submitting receipt...',
          success: 'Receipt submitted successfully!',
          error: (e) => e?.response?.data?.message || 'Error submitting receipt. Please try again.',
        }
      );

      setIsReceiptModalOpen(false);
      try {
        const receiptsRes = await getAllReceiptByPatientId(patientId);
        const receiptsData = receiptsRes?.data?.data || receiptsRes?.data || [];
        setReceipts(filterSubjectRecords(Array.isArray(receiptsData) ? receiptsData : []));

        const billingsRes = await getAllBillings({ patientId });
        const billingsData = billingsRes?.data?.data || billingsRes?.data || [];
        setBillings(filterSubjectRecords(Array.isArray(billingsData) ? billingsData : []));
      } catch (refreshError) {
        console.error('Error refreshing data:', refreshError);
      }
    } catch (error) {
      console.error('Error submitting receipt:', error);
    }
  };

  const totalOutstanding = billings.reduce((sum, bill) => {
    if (bill.isCleared) return sum;
    const outstanding = Number(bill.outstandingBill) || 0;
    return sum + (outstanding > 0 ? outstanding : Number(bill.totalAmount || 0));
  }, 0);

  if (isLoading && !snapshot) {
    return (
      <CashierLayout>
         {isLoading && <KolakLoader fullscreen />}
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </CashierLayout>
    );
  }

  if (error && !snapshot && !currentPatient) {
    return (
      <CashierLayout>
        {isLoading && <KolakLoader fullscreen />}
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-error text-lg font-semibold mb-2">Error Loading Patient</div>
          <div className="text-base-content/70 mb-4">{error}</div>
          <div className="flex gap-2">
            <button onClick={() => dispatch(fetchPatientById(patientId))} className="btn btn-primary btn-sm">
              Try Again
            </button>
            <button onClick={() => navigate('/cashier/patients')} className="btn btn-outline btn-sm">
              Back to Patients
            </button>
          </div>
        </div>
      </CashierLayout>
    );
  }

  if (!patient) {
    return (
      <CashierLayout>
         {isLoading && <KolakLoader fullscreen />}
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-base-content text-lg font-semibold mb-2">Patient Not Found</div>
          <div className="text-base-content/70 mb-4">The patient you're looking for doesn't exist.</div>
          <button onClick={() => navigate('/cashier/incoming')} className="btn btn-primary btn-sm">
            Back to Incoming
          </button>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      {isLoading && <KolakLoader fullscreen />}
      <div className="mb-8">


        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-regular text-base-content mb-6">
          
          </h2>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/cashier/incoming')}>
            ← Back to Incoming
          </button>
        </div>

      <PatientDetailsCard
        patient={patient}
        summarySubject={summarySubject}
        isViewingDependant={isViewingDependant}
      />


<SendPatientModal
                patientId={patient?.id || patientId}
                patient={patient}
                defaultDependantId={dependantId}
                defaultDependantLabel={fullName}
                lockSubject
                onUpdated={() => {
                  refreshQueueCount();
                  navigate('/cashier/incoming');
                }}
                allowedRoles={['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'hmo', 'sonographer']}
              />
            

        {/* Outstanding Bills */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-primary mb-4">
            {isViewingDependant ? `${fullName}'s Billings` : 'Patient Billings'}
          </h3>
          <div className="overflow-x-auto">

            <table className="table w-full">
              <thead>
                <tr>
                  <th></th>
                  <th>Billing ID</th>
                  <th>Total amount</th>
                  <th>Outstanding Bills</th>
                  <th>Raised By</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {billings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-base-content/50">
                      No billing records found{isViewingDependant ? ' for this dependant' : ''}.
                    </td>
                  </tr>
                ) : billings.map((bill) => (

                  <React.Fragment key={bill.id}>

                    <tr className="text-sm">
                      <td
                        onClick={() => toggleRow(bill.id)}
                        className="cursor-pointer select-none"
                        title={openRow === bill.id ? "Collapse" : "Expand"}
                      >
                        {openRow === bill.id ? "▼" : "▶"}
                      </td>


                      <td className="font-medium">{bill.id}</td>
                      <td> ₦ {bill.totalAmount.toLocaleString()}</td>
                      <td> ₦ {bill.outstandingBill.toLocaleString()}</td>
                      <td className="text-success">{bill.raisedBy.firstName}{" "}{bill.raisedBy.lastName}</td>
                      <td className="text-success">{bill.raisedBy.accountType}</td>
                      <td>
                        {bill.isCleared ? (
                          <button
                            className="btn btn-sm btn-ghost"
                            disabled
                          >
                            Completed
                          </button>
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
                            <div className="mb-3 text-sm space-y-1">
                              <p>Total:  ₦{Number(bill.totalAmount).toLocaleString()}</p>
                              <p className="text-success">
                                HMO:  ₦{getHmoCoveredAmount(bill).toLocaleString()}
                              </p>

                            </div>
                            <h4 className="font-semibold mb-2">Item Details</h4>
                            <table className="table w-full">
                              <thead>
                                <tr>
                                  <th>Description</th>
                                  <th>Code</th>
                                  <th>Price</th>
                                  <th>Qty</th>
                                  <th>Total</th>
                                  <th>HMO Covers</th>
                                  <th>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {bill.itemDetails.map((item, idx) => (
                                  <tr key={idx}>
                                    <td>{item.description}</td>
                                    <td>{item.code}</td>
                                    <td> ₦ {Number(item.price).toLocaleString()}</td>
                                    <td>{item.quantity}</td>
                                    <td>₦ {Number(item.total).toLocaleString()}</td>

                                    <td className="text-success">
                                      ₦ {Number(item.hmoCovered || 0).toLocaleString()}
                                    </td>



                                    <td>
                                      <span className={`badge badge-sm ${
                                        item.hmoStatus === 'approved' ? 'badge-success' :
                                        item.hmoStatus === 'partial' ? 'badge-warning' :
                                        item.hmoStatus === 'rejected' ? 'badge-error' :
                                        'badge-neutral'
                                      }`}>
                                        {item.hmoStatus || 'self-pay'}
                                      </span>
                                    </td>
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

            <button
              onClick={() => navigate(`/cashier/generate-bill/${patientId}`)}
              className="btn btn-sm btn-primary hidden"
            >
              <FaFileInvoice className="w-4 h-4 mr-1" />
              Generate Bill
            </button>
          </div>
        </div>


        {/* Payment History */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-primary">Payment Receipt History</h3>
            <button className="btn btn-ghost btn-circle btn-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
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
                      <td>{time}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {receipts.length > 2 && !showAllReceipts && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => navigate(`/cashier/payment-receipt-history/${patientId}`, {
                  state: { dependantId, dependantSnapshot, patientSnapshot: patient },
                })}
                className="btn btn-outline btn-primary btn-sm"
              >
                View All ({receipts.length} receipts)
              </button>
            </div>
          )}

          {showAllReceipts && receipts.length > 3 && (
            <div className="mt-4 flex justify-center">
              <button
                onClick={() => setShowAllReceipts(false)}
                className="btn btn-outline btn-sm"
              >
                Show Less
              </button>
            </div>
          )}
        </div>

        {/* Post-Payment Actions */}
        {receipts.length > 0 && (
          <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-primary mb-4">Post-Payment Actions</h3>
            <p className="text-sm text-base-content/70 mb-4">Payment received. Send patient to:</p>
            <div className="flex flex-wrap gap-3">
              <SendPatientModal
                patientId={patient?.id || patientId}
                patient={patient}
                defaultDependantId={dependantId}
                defaultDependantLabel={fullName}
                lockSubject
                onUpdated={() => {
                  refreshQueueCount();
                  navigate('/cashier/dashboard');
                }}
                allowedRoles={['nurse', 'doctor', 'medical-director', 'pharmacist', 'labtechnician', 'hmo', 'sonographer']}
              />
            </div>
          </div>
        )}

        {/* Receipt Modal */}
        <ReceiptModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          billingId={selectedBillingId}
          patientId={selectedPatientId}
          onSubmit={handleReceiptSubmit}
        />
      </div>
    </CashierLayout>
  );
};

export default CashierPatientDetails;