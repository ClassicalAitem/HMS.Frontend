/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaTimes, FaFileInvoice } from 'react-icons/fa';

const CashierPatientDetails = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Sample patient data - in real app this would come from props or API
  const patient = {
    id: "P-2025-002",
    name: "Leslie Alexander",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gender: "Female",
    phone: "09127911395",
    insurance: "MedCare HMO",
    status: "Active"
  };

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

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-base-content 2xl:text-4xl">Patient Details</h1>
            <button className="btn btn-ghost btn-circle">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Patient Identification Card */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100 mb-6">
            <div className="flex items-center space-x-6">
              <img
                src={patient.photo}
                alt={patient.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-base-content">{patient.name}</h2>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-base-content/70">Gender: {patient.gender}</p>
                    <p className="text-sm text-base-content/70">Phone: {patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Patient ID: {patient.id}</p>
                    <p className="text-sm text-base-content/70">Insurance: {patient.insurance}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="badge badge-info">Active</span>
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
        </div>
      </div>
    </div>
  );
};

export default CashierPatientDetails;
