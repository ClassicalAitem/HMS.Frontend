import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/common';
import { CashierLayout } from '@/layouts/cashier';
import { FaEye, FaPrint } from 'react-icons/fa';
import { getAllBillings } from '@/services/api/billingAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import KolakLoader from '@/components/common/KolakLoader';

const PaymentRecords = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchBilling = async () => {
      try {
        setIsLoading(true);
        const res = await getAllBillings();
        const list = res?.data?.data ?? res?.data ?? [];
        const billingList = Array.isArray(list) ? list : [];

        // Check if any dependant is missing from joined relation
        const missingDependantIds = [
          ...new Set(
            billingList
              .filter(a => a.dependantId && !a.dependant)
              .map(a => a.dependantId)
          )
        ];

        let extraDependantMap = {};
        if (missingDependantIds.length > 0) {
          const dependantEntries = await Promise.all(
            missingDependantIds.map(id =>
              getDependantById(id)
                .then(r => [id, r?.data?.data?.dependant || r?.data?.dependant || r?.data])
                .catch(() => [id, null])
            )
          );
          extraDependantMap = Object.fromEntries(dependantEntries);
        }

        const mapped = billingList.map((a) => {
          const isForDependant = !!a.dependantId;
          const dependant = isForDependant ? (a.dependant || extraDependantMap[a.dependantId]) : null;
          const guardian = a.patient;

          const name = isForDependant
            ? (dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() || 'Dependant' : 'Dependant')
            : (guardian ? `${guardian.firstName} ${guardian.lastName}` : (a.opdPatient ? `${a.opdPatient.firstName} ${a.opdPatient.lastName}` : 'N/A'));

          const guardianName = isForDependant && guardian
            ? `${guardian.firstName} ${guardian.lastName}`
            : null;

          return {
            billingId: a.id,
            name,
            isForDependant,
            guardianName,
            outstandingBill: `₦ ${Number(a.outstandingBill || 0).toLocaleString()}`,
            totalAmount: `₦ ${Number(a.totalAmount || 0).toLocaleString()}`,
            itemDetails: a.itemDetails,
            amount: `₦ ${Number(a.amountPaid || 0).toLocaleString()}`,
            dateTime: formatNigeriaDateTime(a.createdAt),
            raisedBy: a.raisedBy ? `${a.raisedBy.firstName} ${a.raisedBy.lastName}` : 'N/A',
            cashierName: a.raisedBy ? `${a.raisedBy.firstName} ${a.raisedBy.lastName}` : 'N/A',
          };
        });
        setPaymentRecords(mapped);
      } catch (err) {
        console.error('Failed to fetch billings:', err);
        setPaymentRecords([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBilling();
  }, []);

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
  const generateReceiptHTML = (billing) => {

  const items = billing.itemDetails?.map(item => `
    <tr>
      <td>${item.code}</td>
      <td>${item.description}</td>
      <td>${item.quantity}</td>
      <td>₦ ${Number(item.price).toLocaleString()}</td>
      <td>₦ ${Number(item.total).toLocaleString()}</td>
    </tr>
  `).join("");

  return `
  <html>
  <head>
    <title>Receipt - ${billing.billingId}</title>

    <style>
      body{
        font-family: monospace;
        display:flex;
        justify-content:center;
        padding:20px;
      }

      .receipt{
        width:300px;
        border:1px dashed #ccc;
        padding:15px;
      }

      h2{
        text-align:center;
        font-size:16px;
        margin-bottom:10px;
      }

      .divider{
        border-top:1px dashed #999;
        margin:10px 0;
      }

      table{
        width:100%;
        font-size:11px;
        border-collapse:collapse;
      }

      td{
        padding:2px 0;
      }

      .footer{
        text-align:center;
        font-size:11px;
        margin-top:10px;
      }

      @media print{
        body{margin:0;padding:0;}
      }
    </style>

  </head>

  <body>

  <div class="receipt">

    <h2>KOLAK HOSPITAL</h2>

    <div class="divider"></div>

    <div>Billing ID: ${billing.billingId}</div>
    <div>Patient: ${billing.name}</div>
    <div>Cashier: ${billing.cashierName}</div>
    <div>Date: ${billing.dateTime}</div>

    <div class="divider"></div>

    <table>
      <thead>
        <tr>
          <td><b>Item</b></td>
          <td></td>
          <td><b>Qty</b></td>
          <td><b>Price</b></td>
          <td><b>Total</b></td>
        </tr>
      </thead>

      <tbody>
        ${items}
      </tbody>
    </table>

    <div class="divider"></div>

    <div>Total: ${billing.totalAmount}</div>
    <div>Outstanding: ${billing.outstandingBill}</div>

    <div class="divider"></div>

    <div class="footer">
      Thank you for your payment
    </div>

  </div>

  </body>
  </html>
  `;
};




const handlePrintReceipt = (billing) => {

  const receiptWindow = window.open("", "_blank");

  receiptWindow.document.write(generateReceiptHTML(billing));

  receiptWindow.document.close();

  receiptWindow.focus();

  setTimeout(() => {
    receiptWindow.print();
  }, 500);
};

  const columns = useMemo(() => [
    {
      key: 'name',
      title: 'Name',
      sortable: true,
      className: 'text-base-content font-medium',
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <span>{value}</span>
          {row.isForDependant && (
            <span className="badge badge-sm badge-outline">Dependant</span>
          )}
        </div>
      )
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
      key: 'raisedBy',
      title: 'Raised By',
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
      onClick={() => handlePrintReceipt(row)}
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
    <CashierLayout>
      {isLoading && <KolakLoader fullscreen />}
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-base-content">Billing Records</h1>
        <p className="text-sm text-base-content/70">View and manage all billing transactions</p>
      </div>

      <div className="mb-4 flex flex-col gap-3">
        <div className="flex gap-2 flex-col sm:flex-row">
          <select className="select select-bordered w-full sm:w-auto">
            <option>All Status</option>
            <option>Completed</option>
            <option>Pending</option>
            <option>Failed</option>
          </select>
          <select className="select select-bordered w-full sm:w-auto">
            <option>All Methods</option>
            <option>Bank Transfer</option>
            <option>Cash</option>
            <option>Debit Card</option>
          </select>
          <select className="select select-bordered w-full sm:w-auto">
            <option>All Time</option>
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl w-full min-w-0">
        <div className="card-body p-2 sm:p-4 min-w-0">
          {isLoading ? (
            <div className="py-20 flex justify-center items-center">
              <KolakLoader size="lg" />
            </div>
          ) : (
            <DataTable
              data={paymentRecords}
              columns={columns}
              searchable={true}
              sortable={true}
              paginated={true}
              initialEntriesPerPage={7}
              showEntries={true}
              searchPlaceholder="Search payment records..."
            />
          )}
        </div>
      </div>

      {/* Payment Details Modal */}
      {isModalOpen && selectedBilling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
          <div className="w-full max-w-lg mx-auto shadow-xl card bg-base-100 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-4 card-body overflow-y-auto">
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
                    {selectedBilling.isForDependant && <span className="badge badge-sm badge-outline ml-2">Dependant</span>}
                  </p>
                  {selectedBilling.isForDependant && selectedBilling.guardianName && (
                    <p className="text-xs text-base-content/50">Guardian: {selectedBilling.guardianName}</p>
                  )}
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
                  <div className="overflow-x-auto mt-2">
                    <table className="table w-full">
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
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handlePrintReceipt(selectedBilling)}
                  className="btn btn-primary flex-1"
                >
                  <FaPrint className="w-4 h-4 mr-2" />
                  Print Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CashierLayout>
  );
};

export default PaymentRecords;