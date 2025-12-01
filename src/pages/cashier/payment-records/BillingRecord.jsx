/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Header, DataTable } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaEye, FaDownload, FaPrint } from 'react-icons/fa';
import cashierData from '@/data/cashierData.json';
import { getAllBillings } from '@/services/api/billingAPI';

const PaymentRecords = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [billingRecords, setBillingRecords] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // useEffect(() => {
  //   setPaymentRecords(cashierData.paymentRecords);
  // }, []);

  useEffect(() => {
    const fetchBilling = async() => {
      try {
        setIsLoading(true);
        const res = await getAllBillings();
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw.receipts ?? []);
        const mapped = list.map((a, idx) => ({
          billingId: a.id,
          name: a.patient ? `${a.patient.firstName} ${a.patient.lastName}` : 'N/A',
          outstandingBill: `₦ ${Number(a.outstandingBill).toLocaleString()}`,
          totalAmount: `₦ ${Number(a.totalAmount).toLocaleString()}`,
          itemDetails: a.itemDetails,
          amount: `₦ ${Number(a.amountPaid).toLocaleString()}`,
          dateTime: new Date(a.createdAt).toLocaleString(),
          cashierName: a.cashier ? `${a.cashier.firstName} ${a.cashier.lastName}` : 'N/A',
        }));
        setPaymentRecords(mapped);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBilling();
  }, [])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-orange-100 text-orange-800';
      case 'Failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (payment) => {
    setSelectedBilling(payment);
    setIsModalOpen(true);
  };

  const columns = useMemo(() => [
    {
      key: 'billingId',
      title: 'Billing ID',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'totalAmount',
      title: 'Total Amount',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'outstandingBill',
      title: 'Outstanding Bill',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'dateTime',
      title: 'Date & Time',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'cashierName',
      title: 'Cashier Name',
      sortable: true,
      className: 'text-base-content/70',
    },
    {
      key: 'actions',
      title: 'Actions',
      className: 'text-base-content/70',
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewDetails(row)}
            className="btn btn-ghost btn-xs"
            title="View Details"
          >
            <FaEye className="w-3 h-3" />
          </button>
          <button
            className="btn btn-ghost btn-xs"
            title="Download"
          >
            <FaDownload className="w-3 h-3" />
          </button>
          <button
            className="btn btn-ghost btn-xs"
            title="Print"
          >
            <FaPrint className="w-3 h-3" />
          </button>
        </div>
      )
    }
  ], []);

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">Billing Records</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">View and manage all billing transactions</p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select className="select select-bordered">
              <option>All Status</option>
              <option>Completed</option>
              <option>Pending</option>
              <option>Failed</option>
            </select>
            <select className="select select-bordered">
              <option>All Methods</option>
              <option>Bank Transfer</option>
              <option>Cash</option>
              <option>Debit Card</option>
            </select>
            <select className="select select-bordered">
              <option>All Time</option>
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>

          {/* Payment Records Table */}
          <div className="flex flex-1 w-full min-h-0">
            <div className="w-full shadow-xl card bg-base-100">
              <div className="p-4 card-body 2xl:p-6">
                {isLoading ? (
                  <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
                    <div className="overflow-auto max-h-96 p-4 space-y-3">
                      <div className="skeleton h-6 w-52" />
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="skeleton h-8 w-full" />
                      ))}
                    </div>
                  </div>
                ) : (
                  <DataTable
                    data={paymentRecords}
                    columns={columns}
                    searchable={true}
                    sortable={true}
                    paginated={true}
                    initialEntriesPerPage={7}
                    maxHeight="max-h-96 sm:max-h-80 md:max-h-96 lg:max-h-80 2xl:max-h-96"
                    showEntries={true}
                    searchPlaceholder="Search payment records..."
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {isModalOpen && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md mx-4 shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-base-content">Billing Details - {selectedBilling.billingId}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Patient */}
                <div>
                  <label className="text-sm font-medium text-base-content/70">Patient</label>
                  <p className="text-base-content">
                    {selectedBilling.name}
                  </p>
                </div>

                {/* Cashier */}
                <div>
                  <label className="text-sm font-medium text-base-content/70">Cashier</label>
                  <p className="text-base-content">
                    {selectedBilling.cashierName}
                  </p>
                </div>

                {/* Amounts */}
                <div>
                  <label className="text-sm font-medium text-base-content/70">Total Amount</label>
                  <p className="text-base-content">{selectedBilling.totalAmount.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Outstanding Bill</label>
                  <p className="text-base-content">{selectedBilling.outstandingBill.toLocaleString()}</p>
                </div>

                {/* Date & Time */}
                <div>
                  <label className="text-sm font-medium text-base-content/70">Date & Time</label>
                  <p className="text-base-content">
                    {selectedBilling.dateTime}

                  </p>
                </div>

                {/* Item Details */}
                <div>
                  <label className="text-sm font-medium text-base-content/70">Item Details</label>
                  <table className="table w-full mt-2">
                    <thead>
                      <tr className="text-xs text-base-content/60 uppercase tracking-wide">
                        <th>Code</th>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBilling.itemDetails?.map((item, idx) => (
                        <tr key={idx} className="text-sm">
                          <td>{item.code}</td>
                          <td>{item.description}</td>
                          <td>{item.quantity}</td>
                          <td>₦ {Number(item.price).toLocaleString()}</td>
                          <td>₦ {Number(item.total).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button className="btn btn-outline flex-1">
                  <FaDownload className="w-4 h-4 mr-2" />
                  Download Receipt
                </button>
                <button className="btn btn-primary flex-1">
                  <FaPrint className="w-4 h-4 mr-2" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRecords;
