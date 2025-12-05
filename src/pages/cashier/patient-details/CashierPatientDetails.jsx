import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaFileInvoice } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';
import { createReceipt, getAllBillings, getAllReceiptByPatientId } from '@/services/api/billingAPI';
import ActionButtons from '../patients/ActionButtons';
import { NurseActionModal, PharmacyActionModal2, ReceiptModal} from '@/components/modals';
import { set } from 'react-hook-form';


const CashierPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);
  const [openRow, setOpenRow] = useState(null);
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [isSendToNurseOpen, setIsSendToNurseOpen] = useState(false);
  const [isSendToPharmacyOpen, setIsSendToPharmacyOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedBillingId, setSelectedBillingId] = useState(null);
  const [selectedPatientId] = useState(patientId || (currentPatient ? currentPatient.id : null));

  const toggleRow = (id) => {
    setOpenRow(openRow === id ? null : id);
  };

  // Prefer snapshot passed from Incoming; fallback to store
  const snapshot = location?.state?.patientSnapshot || null;
  const patient = currentPatient || snapshot || null;

  const fullName = `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || (patient?.name || 'Unknown');
  const gender = patient?.gender || snapshot?.gender || '—';
  const phone = patient?.phone || patient?.phoneNumber || snapshot?.phone || '—';
  const patientIdDisplay = patient?.id || patient?.patientId || patient?.hospitalId || '—';
  const insuranceProvider = patient?.hmos?.length
    ? patient.hmos.map(h => `${h.provider} (${h.plan})`).join(', ')
    : snapshot?.insurance || '—';
  const insuranceStatus = patient?.hmos?.length
    ? patient.hmos.map(h => {
        const expiresAt = h.expiresAt || h.expiryDate;
        if (expiresAt) {
          const expiryDate = new Date(expiresAt);
          const today = new Date();
          return expiryDate < today ? 'Expired' : (h.status || 'Active');
        }
        return h.status || 'Active';
      }).join(', ')
    : 'Inactive';
  const statusDisplay = (patient?.status || snapshot?.status || 'Unknown');

  // Fetch patient details from backend
  useEffect(() => {
    if (patientId && !location?.state?.patientSnapshot) {
      console.log('🔄 CashierPatientDetails: Fetching patient details for ID:', patientId);
      dispatch(fetchPatientById(patientId));
    }
  }, [dispatch, patientId, location?.state?.patientSnapshot]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error && !snapshot && !currentPatient) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch, snapshot, currentPatient]);


  useEffect(() => {
    const fetchBillings = async () => {
      setIsReceiptModalOpen(false);
      const res = await getAllBillings({ patientId });

      console.log('Fetched Billings', res.data.data);

      setBillings(res.data.data);

    }

    fetchBillings();
  }, [])

  useEffect(() => {
    const fetchReceipts = async () => {
      const res = await getAllReceiptByPatientId(patientId);

      console.log('Fetched Receipts', res.data);

      setReceipts(res.data.data);
    }

    fetchReceipts();
  }, []);


  const handleReceiptSubmit = async(receiptData) => {
    try {
      await toast.promise(
        createReceipt(selectedBillingId, receiptData),
        {
          loading: 'Submitting receipt...',
          success: 'Receipt submitted successfully!',
          error: (e) => e?.message || "Error submitting receipt."
        }
      );

      setIsReceiptModalOpen(false);
      // Refresh receipts and billings after successful submission
      const receiptsRes = await getAllReceiptByPatientId(patientId);
      setReceipts(receiptsRes.data.data);

      const billingsRes = await getAllBillings({ patientId });
      setBillings(billingsRes.data.data);


    } catch (error) {
      console.error('Error submitting receipt:', error);
    }
  };

  // const outstandingBills = [
  //   [{
  //     invoiceNo: "INV-10021",
  //     date: "2025-09-15",
  //     service: "Chest X-Ray",
  //     amount: "₦300,000",
  //     deposited: "₦30,000",
  //     balance: "₦270,000",
  //     status: "Partially Paid"
  //   }, {
  //     invoiceNo: "INV-10021",
  //     date: "2025-09-15",
  //     service: "Chest X-Ray",
  //     amount: "₦300,000",
  //     deposited: "₦30,000",
  //     balance: "₦270,000",
  //     status: "Partially Paid"
  //   } ],
  //   {
  //     invoiceNo: "INV-10021",
  //     date: "2025-09-15",
  //     service: "Cardiology",
  //     amount: "₦300,000",
  //     deposited: "₦30,000",
  //     balance: "₦270,000",
  //     status: "Covered by HMO"
  //   },
  //   {
  //     invoiceNo: "INV-10021",
  //     date: "2025-09-15",
  //     service: "Cardiology",
  //     amount: "₦300,000",
  //     deposited: "₦30,000",
  //     balance: "₦270,000",
  //     status: "Not Paid"
  //   }
  // ];

  const outstandingBills = [
  {
    id: "f14c914e-f08b-4c96-89be-78cea3a4d881",
    invoiceNo: "INV-00123",
    date: "2025-11-03",
    totalAmount: 15000,
    deposited: 15000,
    balance: 0,
    status: "Paid",
    itemDetails: [
      {
        code: "CONSULT",
        price: 15000,
        quantity: 1,
        total: 15000,
        description: "Consultation fee"
      }
    ]
  },

  {
    id: "1f1aa4d0-f77c-442c-b37f-8d5fd086071d",
    invoiceNo: "INV-00124",
    date: "2025-11-04",
    totalAmount: 42000,
    deposited: 20000,
    balance: 22000,
    status: "Partially Paid",
    itemDetails: [
      {
        code: "LAB-001",
        price: 10000,
        quantity: 1,
        total: 10000,
        description: "Blood test"
      },
      {
        code: "DRUG-043",
        price: 8000,
        quantity: 2,
        total: 16000,
        description: "Antibiotics (Ciprofloxacin)"
      },
      {
        code: "XRAY-12",
        price: 16000,
        quantity: 1,
        total: 16000,
        description: "Chest X-Ray"
      }
    ]
  },

  {
    id: "6cbf0473-9d85-4dd8-b7de-1c1985772cc0",
    invoiceNo: "INV-00125",
    date: "2025-11-05",
    totalAmount: 10000,
    deposited: 0,
    balance: 10000,
    status: "Pending",
    itemDetails: [
      {
        code: "CARD-TEST",
        price: 5000,
        quantity: 1,
        total: 5000,
        description: "Cardiology test"
      },
      {
        code: "BP-CHK",
        price: 2500,
        quantity: 1,
        total: 2500,
        description: "Blood pressure check"
      },
      {
        code: "TEMP-CHK",
        price: 2500,
        quantity: 1,
        total: 2500,
        description: "Temperature check"
      }
    ]
  }
];


  const paymentHistory = [
    {
      receiptNo: "RCPT-5601",
      date: "2025-09-15",
      service: "Chest X-Ray",
      amount: "₦300,000",
      method: "Cash",
      status: "Successful",
      time: "9:00AM"
    },
    {
      receiptNo: "RCPT-5601",
      date: "2025-09-15",
      service: "Cardiology",
      amount: "₦300,000",
      method: "Transfer",
      status: "Successful",
      time: "11:00AM"
    },
    {
      receiptNo: "RCPT-5601",
      date: "2025-09-15",
      service: "Cardiology",
      amount: "₦300,000",
      method: "Transfer",
      status: "Successful",
      time: "11:00AM"
    }
  ];

  const totalOutstanding = billings.reduce((sum, bill) => {
    return sum + parseInt(bill.outstandingBill || 0);
  }, 0);

  // Show loading state only if no snapshot is available
  if (isLoading && !snapshot) {
    return (
      <CashierLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </CashierLayout>
    );
  }

  // Show error state only if no snapshot/currentPatient is available
  if (error && !snapshot && !currentPatient) {
    return (
      <CashierLayout>
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-error text-lg font-semibold mb-2">Error Loading Patient</div>
          <div className="text-base-content/70 mb-4">{error}</div>
          <div className="flex gap-2">
            <button
              onClick={() => dispatch(fetchPatientById(patientId))}
              className="btn btn-primary btn-sm"
            >
              Try Again
            </button>
            <button
              onClick={() => navigate('/cashier/patients')}
              className="btn btn-outline btn-sm"
            >
              Back to Patients
            </button>
          </div>
        </div>
      </CashierLayout>
    );
  }

  // Show not found state
  if (!patient) {
    return (
      <CashierLayout>
        <div className="flex flex-col justify-center items-center h-64 text-center">
          <div className="text-base-content text-lg font-semibold mb-2">Patient Not Found</div>
          <div className="text-base-content/70 mb-4">The patient you're looking for doesn't exist.</div>
          <button
            onClick={() => navigate('/cashier/incoming')}
            className="btn btn-primary btn-sm"
          >
            Back to Incoming
          </button>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="mb-8">
        <h2 className="text-2xl font-regular text-base-content mb-6">Patient Details</h2>

        {/* Patient Details Card */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-6">
            <div className="w-15 h-15 2xl:w-20 2xl:h-20 rounded-full border-2 border-primary overflow-hidden">
              {patient?.photo || patient?.profilePicture ? (
                <img src={patient?.photo || patient?.profilePicture} alt={fullName} className="object-cover w-20 h-20" />
              ) : (
                <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">{fullName?.charAt(0)}</span>
                </div>
              )}
            </div>
            <div className="flex-1 grid grid-cols-5 gap-6">
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Patient Name</p>
                <p className="text-md 2xl:text-lg font-semibold text-base-content">{fullName}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Gender</p>
                <p className="text-md 2xl:text-lg font-semibold text-base-content">{gender}</p>
              </div>
              <div>
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Phone Number</p>
                <p className="text-md 2xl:text-lg font-semibold text-base-content">{phone}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-base-content/50 uppercase tracking-wide">Patient ID</p>
                <p className="text-md 2xl:text-lg font-semibold text-base-content">{patientIdDisplay}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs text-base-content/50">Status</span>
                <span className={`badge ${String(statusDisplay).toLowerCase() === 'active' ? 'badge-info' : 'badge-neutral'}`}>{statusDisplay}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-base-300 flex items-center justify-between">
            <p className="text-sm text-base-content/70">• Insurance: <span className="font-medium text-base-content">{insuranceProvider}</span></p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-base-content/50">Status</span>
              <span className={`badge ${
                String(insuranceStatus).toLowerCase().includes('expired') ? 'badge-error' :
                String(insuranceStatus).toLowerCase().includes('active') ? 'badge-info' :
                'badge-neutral'
              }`}>{insuranceStatus}</span>
            </div>
            {/* <button className=" hidden text-sm text-primary font-semibold hover:underline">Make Payments Now</button> */}
          </div>
        </div>

        {/* Outstanding Bills */}
        <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold text-primary mb-4">Patient Billings</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
      <thead>
        <tr>
          <th></th>
          <th>Billing ID</th>
          <th>Total amount</th>
          <th>Outstanding Bills</th>
          <th>Cashier Name</th>
          <th>Actions</th>
        </tr>
      </thead>

      <tbody>
        {billings.map((bill) => (
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
              <td className="text-success">{bill.cashier.firstName}{" "}{bill.cashier.lastName}</td>
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
                    <h4 className="font-semibold mb-2">Item Details</h4>
                    <table className="table w-full">
                      <thead>
                        <tr>
                          <th>Description</th>
                          <th>Code</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bill.itemDetails.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.description}</td>
                            <td>{item.code}</td>
                            <td> ₦ {Number(item.price).toLocaleString()}</td>
                            <td>{item.quantity}</td>
                            <td> ₦ {Number(item.total).toLocaleString()}</td>
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
              className="btn btn-sm btn-primary"
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
                  <th>Status</th>
                  <th>Paid By</th>
                  <th>Time</th>
                  {receipts.some(r => r.paidBy === "hmo") && <th>Provider</th>}
                  {receipts.some(r => r.paidBy === "hmo") && <th>Plan</th>}

                </tr>
              </thead>
              <tbody>
                {receipts.map((payment, index) => {
                  const createdAt = new Date(payment.createdAt);
                  const date = createdAt.toLocaleDateString();
                  const time = createdAt.toLocaleTimeString();

                  return (
                    <tr key={index} className="text-sm">
                      <td className="font-medium">{payment.reference}</td>
                      <td>{date}</td>
                      <td>₦ {Number(payment.amountPaid).toLocaleString()}</td>
                      <td>{payment.paymentMethod}</td>
                      <td>
                        <span className="badge badge-success">{payment.status}</span>
                      </td>
                      <td>{payment.paidBy}</td>
                      <td>{time}</td>
                      <td>{payment.paidBy === "hmo" ? payment.hmo?.provider || "-" : ""}</td>
                      <td>{payment.paidBy === "hmo" ? payment.hmo?.plan || "-" : ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
          <ActionButtons onSendToNurse={() => setIsSendToNurseOpen(true)} onSendToPharmacy={() => setIsSendToPharmacyOpen(true)} />
        <NurseActionModal isOpen={isSendToNurseOpen}
                onClose={() => setIsSendToNurseOpen(false)}
                patientId={patient?.id || patientId}
                defaultAction={'awaiting_vitals'}
                onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
              />
          <PharmacyActionModal2 isOpen={isSendToPharmacyOpen}
                onClose={() => setIsSendToPharmacyOpen(false)}
                patientId={patient?.id || patientId}
                defaultAction={'awaiting_pharmacy'}
                onUpdated={() => patientId && dispatch(fetchPatientById(patientId))}
              />
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