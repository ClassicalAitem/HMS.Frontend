import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaTimes, FaFileInvoice } from 'react-icons/fa';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { fetchPatientById, clearPatientsError } from '../../../store/slices/patientsSlice';
import toast from 'react-hot-toast';

const CashierPatientDetails = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { selectedPatient, isLoading, error } = useAppSelector((state) => state.patients);

  // Fetch patient details from backend
  useEffect(() => {
    if (patientId) {
      console.log('🔄 CashierPatientDetails: Fetching patient details for ID:', patientId);
      dispatch(fetchPatientById(patientId));
    }
  }, [dispatch, patientId]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearPatientsError());
    }
  }, [error, dispatch]);

  // Use patient data from Redux store
  const patient = selectedPatient;

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

  // Show loading state
  if (isLoading) {
    return (
      <CashierLayout>
        <div className="flex justify-center items-center h-64">
          <div className="loading loading-spinner loading-lg text-primary"></div>
        </div>
      </CashierLayout>
    );
  }

  // Show error state
  if (error) {
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
            onClick={() => navigate('/cashier/patients')}
            className="btn btn-primary btn-sm"
          >
            Back to Patients
          </button>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-base-content 2xl:text-4xl">Patient Details</h1>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(`/cashier/generate-bill/${patientId}`)}
                className="btn btn-primary btn-sm"
              >
                <FaFileInvoice className="w-4 h-4 mr-2" />
                Generate Bill
              </button>
              <button 
                onClick={() => navigate('/cashier/patients')}
                className="btn btn-ghost btn-circle"
              >
                <FaTimes className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Patient Identification Card */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100 mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {patient?.firstName?.charAt(0)}{patient?.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-base-content">
                  {patient?.firstName} {patient?.lastName}
                </h2>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-base-content/70">Email: {patient?.email}</p>
                    <p className="text-sm text-base-content/70">Phone: {patient?.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Patient ID: {patient?.patientId}</p>
                    <p className="text-sm text-base-content/70">Status: {patient?.status}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className={`badge ${patient?.status?.toLowerCase() === 'active' ? 'badge-success' : 'badge-neutral'}`}>
                  {patient?.status || 'Unknown'}
                </span>
              </div>
            </div>
          </div>

          {/* Outstanding Bills Section */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100 mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-primary">Patient Outstanding Bills</h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
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
                    <tr key={index}>
                      <td className="font-medium">{bill.invoiceNo}</td>
                      <td>{bill.date}</td>
                      <td>{bill.service}</td>
                      <td>{bill.amount}</td>
                      <td className="text-green-600">{bill.deposited}</td>
                      <td className="text-red-600">{bill.balance}</td>
                      <td>
                        <span className="badge badge-outline">{bill.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-base-300">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-red-600 font-semibold">
                  Outstanding Balance: ₦{totalOutstanding.toLocaleString()}
                </span>
              </div>
              <button className="text-primary hover:underline">Make Payments Now</button>
            </div>
          </div>

          {/* Generate Bill Button */}
          <div className="mb-6">
            <button className="btn btn-primary btn-lg">
              <FaFileInvoice className="w-5 h-5 mr-2" />
              Generate Bill
            </button>
          </div>

          {/* Payment History Section */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100">
            <h3 className="text-xl font-bold text-primary mb-6">Payment History</h3>
            
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
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
                    <tr key={index}>
                      <td className="font-medium">{payment.receiptNo}</td>
                      <td>{payment.date}</td>
                      <td>{payment.service}</td>
                      <td>{payment.amount}</td>
                      <td>{payment.method}</td>
                      <td>
                        <span className="badge badge-success">{payment.status}</span>
                      </td>
                      <td>{payment.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
    </CashierLayout>
  );
};

export default CashierPatientDetails;
