/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { NurseLayout } from '@/layouts/nurse';
import { DataTable } from '@/components/common';
import { FaEye, FaDownload, FaPrint } from 'react-icons/fa';
import { getAllReceipts } from '@/services/api/billingAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import KolakLoader from '@/components/common/KolakLoader';

const NursePaymentRecords = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setIsModalOpen(false);
  };

  useEffect(() => {
    const fetchReceipt = async () => {
      try {
        setIsLoading(true);
        const res = await getAllReceipts({ paymentDestination: '' });
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw.receipts ?? []);

        const nurseDestinations = ['medication', 'treatment', 'nursing'];
        const filteredList = list.filter(a => nurseDestinations.includes(String(a.paymentDestination || '').toLowerCase()));

        // Get start of today (midnight local time)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Get end of today (23:59:59)
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Filter only receipts updated/paid today
        const todayReceipts = filteredList.filter(a => {
          const paidDate = new Date(a.paidAt || a.updatedAt);
          return paidDate >= startOfToday && paidDate <= endOfToday;
        });

        const mapped = todayReceipts.map((a, idx) => {
          const person = a?.billing?.dependant || a?.billing?.patient || a?.patient || a?.dependant;
          const patientName = person ? `${person.firstName || ''} ${person.lastName || ''}`.trim() : 'N/A';
          const cashierPerson = a?.cashier;
          const cashierName = cashierPerson ? `${cashierPerson.firstName || ''} ${cashierPerson.lastName || ''}`.trim() : 'N/A';

          return {
            receiptId: a.id || a._id,
            transactionId: a.reference || `Kolak-${idx + 1}`,
            name: patientName || 'N/A',
            paymentMethod: a.paymentMethod || 'N/A',
            paymentDestination: a.paymentDestination || 'N/A',
            paidBy: a.paidBy || 'N/A',
            status: a.status || 'pending',
            amount: `₦ ${Number(a.amountPaid || 0).toLocaleString()}`,
            dateTime: a.paidAt ? formatNigeriaDateTime(a.paidAt) : 'N/A',
            cashierName: cashierName || 'N/A',
          };
        });
        setPaymentRecords(mapped);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReceipt();
  }, []);

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
      key: 'paymentDestination',
      title: 'Payment Destination',
      sortable: true,
      className: 'text-base-content font-medium'
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
    <NurseLayout>
      {isLoading && <KolakLoader fullscreen />}

      <div className="flex flex-col min-w-0">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary sm:text-3xl 2xl:text-4xl">Payment Receipt Records</h1>
          <p className="mt-1 text-sm text-base-content/70 2xl:text-base">View and manage all payment receipt transactions</p>
        </div>

        <div className="flex min-h-0 w-full flex-1 min-w-0">
          <div className="card w-full bg-base-100 shadow-sm border border-base-200 min-w-0">
            <div className="card-body p-3 sm:p-4 2xl:p-6 min-w-0">
              {isLoading ? (
                <div className="p-8">
                  <KolakLoader />
                </div>
              ) : (
                <DataTable
                  data={paymentRecords}
                  columns={columns}
                  searchable={true}
                  sortable={true}
                  paginated={true}
                  initialEntriesPerPage={7}
                  maxHeight="max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]"
                  showEntries={true}
                  searchPlaceholder="Search payment records..."
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-opacity-50" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
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
                  <label className="text-sm font-medium text-base-content/70">Transaction ID</label>
                  <p className="text-base-content">{selectedPayment.transactionId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-base-content/70">Payment Destination</label>
                  <p className="text-base-content">{selectedPayment.paymentDestination}</p>
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedPayment.status)}`}>
                    {selectedPayment.status}
                  </span>


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

              </div>
            </div>
          </div>
        </div>
      )}
    </NurseLayout>
  );
};

export default NursePaymentRecords;