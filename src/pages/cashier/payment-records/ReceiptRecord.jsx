/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Header, DataTable } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaEye, FaDownload, FaPrint } from 'react-icons/fa';
import cashierData from '@/data/cashierData.json';
import { getAllReceipts, updateReceipt } from '@/services/api/billingAPI';
import toast from 'react-hot-toast';

const PaymentRecords = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);


  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditStatus('');
  };

  const handleSave = async () => {
    try {
      setUpdating(true);

      const res = await toast.promise(
        updateReceipt(selectedPayment.receiptId, { status: editStatus || selectedPayment.status }),
        {
          loading: 'Updating payment...',
          success: 'Payment updated',
          error: 'Failed to update payment',
        }
      );
      // const updated = res?.data?.data;
      // setPaymentRecords(updated)
      setIsEditing(false);
      setUpdating(false);
      handleClose();
    } catch (err) {
      setUpdating(false);
      console.error('Update payment failed', err);
    }
  };


  useEffect(() => {
    const fetchReceipt = async() => {
      const res = await getAllReceipts();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : (raw.receipts ?? []);
      const mapped = list.map((a, idx) => ({
        receiptId: a.id,
        transactionId: a.reference || `Kolak-${idx + 1}`,
        name: a.billing.patient ? `${a.billing.patient.firstName} ${a.billing.patient.lastName}` : 'N/A',
        paymentMethod: a.paymentMethod,
        paidBy: a.paidBy || 'N/A',
        status: a.status || 'pending',
        amount: `₦ ${Number(a.amountPaid).toLocaleString()}`,
        dateTime: new Date(a.paidAt).toLocaleString(),
        cashierName: a.cashier ? `${a.cashier.firstName} ${a.cashier.lastName}` : 'N/A',
      }));
      setPaymentRecords(mapped);
    }
    fetchReceipt();
  },[])

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (payment) => {
    console.log({payment})
    setSelectedPayment(payment);
    setIsModalOpen(true);
  };

  const columns = useMemo(() => [
    {
      key: 'receiptId'
    },
    {
      key: 'transactionId',
      title: 'Transaction ID',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'name',
      title: 'Patient Name',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'paymentMethod',
      title: 'Payment Method',
      sortable: true,
      className: 'text-base-content font-medium'
    },
    {
      key: 'amount',
      title: 'Amount Paid',
      sortable: true,
      className: 'text-base-content/70'
    },
    {
      key: 'paidBy',
      title: 'Paid By',
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
      key: 'status',
      title: 'Status',
      sortable: true,
      className: 'text-base-content/70',
      render: (value) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(value)}`}>
          {value}
        </span>
      )
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
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">Payment Receipt Records</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">View and manage all payment receipt transactions</p>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select className="select select-bordered">
              <option>All Status</option>
              <option>Pending</option>
              <option>Paid</option>
              <option>Active</option>
              <option>Reverse</option>
              <option>declined</option>
              <option>refunded</option>
            </select>
            <select className="select select-bordered">
              <option>All Methods</option>
              <option>Cash</option>
              <option>Transfer</option>
              <option>Hmo</option>
              <option>Pos</option>
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md mx-4 shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-base-content">Payment Details - {selectedPayment.transactionId}</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-base-content/70">Patient Details</label>
                  <p className="text-base-content">{selectedPayment.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Amount</label>
                  <p className="text-base-content">{selectedPayment.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Date & Time</label>
                  <p className="text-base-content">{selectedPayment.dateTime}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Payment Method</label>
                  <p className="text-base-content">{selectedPayment.paymentMethod}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Status</label>
                  {isEditing ? (
                    <select
                        value={editStatus || selectedPayment.status || ''}
                        onChange={(e) => setEditStatus(e.target.value)}
                        className="select select-bordered w-full"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="active">Active</option>
                        <option value="reversed">Reversed</option>
                        <option value="declined">Declined</option>
                      </select>
                  ):(
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>
                  )}

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

              {/* Edit Workflow */}
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-outline"
                >
                  Close
                </button>

                {selectedPayment.status !== 'paid' && !isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditStatus(selectedPayment.status || 'pending');
                      setIsEditing(true);
                    }}
                    className="btn btn-primary"
                  >
                    Edit Payment
                  </button>
                )}

                {selectedPayment.status !== 'paid' && isEditing && (
                  <>
                    <button
                      type="button"
                      onClick={handleSave}
                      className="btn btn-primary"
                      disabled={updating}
                    >
                      {updating ? (
                        <>
                          <span className="loading loading-spinner loading-sm"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditStatus(selectedPayment.status || 'pending');
                      }}
                      className="btn"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentRecords;
