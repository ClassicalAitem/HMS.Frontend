/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from 'react';
import { Header, DataTable } from '@/components/common';
import { Sidebar } from '@/components/pharmacist/dashboard';
import { FaEye, FaDownload, FaPrint } from 'react-icons/fa';
import { getAllReceipts } from '@/services/api/billingAPI';

const PharmacistPaymentRecords = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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
        const res = await getAllReceipts();
        console.log({res})
        const raw = res?.data?.data ?? res?.data ?? [];
        const list = Array.isArray(raw) ? raw : (raw.receipts ?? []);

        const pharmacistDestinations = ['pharmacy'];
        const filteredList = list.filter(a => pharmacistDestinations.includes(a.paymentDestination));

        // Get start of today (midnight local time)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Get end of today (23:59:59)
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Filter only receipts updated/paid today
       const mapped = filteredList.map((a, idx) => ({
          receiptId: a.id,
          transactionId: a.reference || `Kolak-${idx + 1}`,
          name: a.billing.patient ? `${a.billing.patient.firstName} ${a.billing.patient.lastName}` : 'N/A',
          paymentMethod: a.paymentMethod,
          paymentDestination: a.paymentDestination || 'N/A',
          paidBy: a.paidBy || 'N/A',
          status: a.status || 'pending',
          amount: `₦ ${Number(a.amountPaid).toLocaleString()}`,
          dateTime: new Date(a.paidAt).toLocaleString(),
          cashierName: a.cashier ? `${a.cashier.firstName} ${a.cashier.lastName}` : 'N/A',
        }));
        setPaymentRecords(mapped);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReceipt();
  }, [])

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

    const generateReceiptHTML = (payment) => {
  return `
<html>
<head>
<title>Receipt - ${payment.transactionId}</title>

<style>

body{
  font-family: monospace;
  background:#fff;
  display:flex;
  justify-content:center;
  padding:20px;
}

.receipt{
  width:280px;
  border:1px dashed #ccc;
  padding:15px;
}

h2{
  text-align:center;
  font-size:16px;
  margin-bottom:10px;
}

.row{
  display:flex;
  justify-content:space-between;
  font-size:12px;
  margin:4px 0;
}

.label{
  font-weight:bold;
}

.divider{
  border-top:1px dashed #999;
  margin:10px 0;
}

.footer{
  text-align:center;
  font-size:11px;
  margin-top:10px;
}

@media print {
  body{
    padding:0;
  }
}

</style>
</head>

<body>

<div class="receipt">



 <img src="/src/assets/images/logo.png" 
       alt="Kolak Hospital" 
       style="width:80px; height:auto;" />
<div class="divider"></div>

<div class="row"><span class="label">Txn:</span> <span>${payment.transactionId}</span></div>
<div class="row"><span class="label">Patient:</span> <span>${payment.name}</span></div>
<div class="row"><span class="label">Amount:</span> <span>${payment.amount}</span></div>
<div class="row"><span class="label">Method:</span> <span>${payment.paymentMethod}</span></div>
<div class="row"><span class="label">Dept:</span> <span>${payment.paymentDestination}</span></div>
<div class="row"><span class="label">Paid By:</span> <span>${payment.paidBy}</span></div>
<div class="row"><span class="label">Cashier:</span> <span>${payment.cashierName}</span></div>
<div class="row"><span class="label">Date:</span> <span>${payment.dateTime}</span></div>
<div class="row"><span class="label">Status:</span> <span>${payment.status}</span></div>

<div class="divider"></div>

<div class="footer">
Thank you for your payment
</div>

</div>

</body>
</html>
`;
};



const handlePrintReceipt = (payment) => {
  const receiptWindow = window.open("", "_blank");

  receiptWindow.document.write(generateReceiptHTML(payment));
  receiptWindow.document.close();

  receiptWindow.focus();

  setTimeout(() => {
    receiptWindow.print();
  }, 500);
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
                  onClick={()=> handlePrintReceipt(row)}
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
      {isModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="w-full max-w-md mx-4 shadow-xl card bg-base-100 max-h-[90vh] flex flex-col">
          <div className="p-6 card-body overflow-y-auto">
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
                      <button
                        onClick={() => handlePrintReceipt(selectedPayment)}
                        className="btn btn-primary  flex-1"
                        title="Print"
                      >
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
    </div>
  );
};

export default PharmacistPaymentRecords;