import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaFileInvoice } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';

const CashierPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { currentPatient, isLoading, error } = useAppSelector((state) => state.patients);

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

  const outstandingBills = [
    {
      invoiceNo: "INV-10021",
      date: "2025-09-15",
      service: "Chest X-Ray",
      amount: "₦300,000",
      deposited: "₦30,000",
      balance: "₦270,000",
      status: "Partially Paid"
    },
    {
      invoiceNo: "INV-10021",
      date: "2025-09-15",
      service: "Cardiology",
      amount: "₦300,000",
      deposited: "₦30,000",
      balance: "₦270,000",
      status: "Covered by HMO"
    },
    {
      invoiceNo: "INV-10021",
      date: "2025-09-15",
      service: "Cardiology",
      amount: "₦300,000",
      deposited: "₦30,000",
      balance: "₦270,000",
      status: "Not Paid"
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

  const totalOutstanding = outstandingBills.reduce((sum, bill) => {
    return sum + parseInt(bill.balance.replace(/[₦,]/g, ''));
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
          <h3 className="text-xl font-bold text-primary mb-4">Patient Outstanding Bills</h3>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200">
                <tr className="text-xs text-base-content/60 uppercase tracking-wide">
                  <th>Invoice No</th>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Deposited</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {outstandingBills.map((bill, index) => (
                  <tr key={index} className="text-sm">
                    <td className="font-medium">{bill.invoiceNo}</td>
                    <td>{bill.date}</td>
                    <td>{bill.service}</td>
                    <td>{bill.amount}</td>
                    <td className="text-success">{bill.deposited}</td>
                    <td className="text-error">{bill.balance}</td>
                    <td><span className="badge badge-outline">{bill.status}</span></td>
                  </tr>
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
            <h3 className="text-xl font-bold text-primary">Payment History</h3>
            <button className="btn btn-ghost btn-circle btn-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200">
                <tr className="text-xs text-base-content/60 uppercase tracking-wide">
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Service</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment, index) => (
                  <tr key={index} className="text-sm">
                    <td className="font-medium">{payment.receiptNo}</td>
                    <td>{payment.date}</td>
                    <td>{payment.service}</td>
                    <td>{payment.amount}</td>
                    <td>{payment.method}</td>
                    <td><span className="badge badge-success">{payment.status}</span></td>
                    <td>{payment.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierPatientDetails;