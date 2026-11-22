import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/common';
import { CashierLayout } from '@/layouts/cashier';
import {
  FaEye,
  FaPrint,
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaUndo,
  FaReceipt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
} from 'react-icons/fa';
import { getAllReceipts, updateReceipt } from '@/services/api/billingAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';
import KolakLoader from '@/components/common/KolakLoader';

const isDateInPeriod = (dateStr, period, customStart, customEnd) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const now = new Date();

  if (period === 'today') {
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === 'week') {
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return d >= startOfWeek && d <= endOfWeek;
  }

  if (period === 'month') {
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }

  if (period === 'custom') {
    if (!customStart && !customEnd) return true;
    const start = customStart ? new Date(`${customStart}T00:00:00`) : new Date(0);
    const end = customEnd ? new Date(`${customEnd}T23:59:59.999`) : new Date(8640000000000000);
    return d >= start && d <= end;
  }

  return true; // 'all'
};

const exportToCsv = (filename, headers, rows) => {
  const escapeCsv = (val) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const ReceiptRecord = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'pending' | 'declined' | 'reversed' | 'refunded'
  const [methodFilter, setMethodFilter] = useState('all'); // 'all' | 'cash' | 'transfer' | 'pos' | 'hmo'

  const handleClose = () => {
    setIsModalOpen(false);
    setIsEditing(false);
    setEditStatus('');
  };

  const fetchReceipt = async () => {
    try {
      setIsLoading(true);
      const res = await getAllReceipts();
      const list = res?.data?.data ?? res?.data ?? [];
      const receiptList = Array.isArray(list) ? list : [];

      // Check for any missing dependants
      const missingDependantIds = [
        ...new Set(
          receiptList
            .filter((a) => a.dependantId && !a.dependant)
            .map((a) => a.dependantId)
        ),
      ];

      let extraDependantMap = {};
      if (missingDependantIds.length > 0) {
        const dependantEntries = await Promise.all(
          missingDependantIds.map((id) =>
            getDependantById(id)
              .then((r) => [id, r?.data?.data?.dependant || r?.data?.dependant || r?.data])
              .catch(() => [id, null])
          )
        );
        extraDependantMap = Object.fromEntries(dependantEntries);
      }

      const mapped = receiptList.map((a, idx) => {
        const isForDependant = !!a.dependantId;
        const dependant = isForDependant ? a.dependant || extraDependantMap[a.dependantId] : null;
        const guardian = a.billing?.patient;
        const opdPatient = a.billing?.opdPatient;

        const name = isForDependant
          ? (dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() || 'Dependant' : 'Dependant')
          : (guardian ? `${guardian.firstName} ${guardian.lastName}` : (opdPatient ? `${opdPatient.firstName} ${opdPatient.lastName}` : 'N/A'));

        const guardianName = isForDependant && guardian
          ? `${guardian.firstName} ${guardian.lastName}`
          : null;

        const amountNum = Number(a.amountPaid || 0);
        const statusLower = String(a.status || 'pending').toLowerCase();
        const methodLower = String(a.paymentMethod || '').toLowerCase();
        const rawDate = a.paidAt || a.createdAt;

        return {
          receiptId: a.id,
          transactionId: a.reference || `Kolak-${idx + 1}`,
          name,
          isForDependant,
          guardianName,
          paymentMethod: a.paymentMethod || 'N/A',
          methodLower,
          paymentDestination: a.paymentDestination || 'N/A',
          paidBy: a.paidBy || 'N/A',
          status: a.status || 'pending',
          statusLower,
          amountNum,
          amount: `₦ ${amountNum.toLocaleString()}`,
          dateTime: formatNigeriaDateTime(rawDate),
          rawDate,
          cashierName: a.cashier ? `${a.cashier.firstName || ''} ${a.cashier.lastName || ''}`.trim() : 'N/A',
          bankName: a.bankName || 'N/A',
          senderName: a.senderName || 'N/A',
          raw: a,
        };
      });
      setPaymentRecords(mapped);
    } catch (err) {
      console.error('Failed to fetch receipts:', err);
      setPaymentRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReceipt();
  }, []);

  const handleSave = async () => {
    try {
      setUpdating(true);
      await toast.promise(
        updateReceipt(selectedPayment.receiptId, { status: editStatus || selectedPayment.status }),
        {
          loading: 'Updating payment...',
          success: 'Payment updated successfully',
          error: 'Failed to update payment',
        }
      );
      setIsEditing(false);
      setUpdating(false);
      handleClose();
      fetchReceipt();
    } catch (err) {
      setUpdating(false);
      console.error('Update payment failed', err);
    }
  };

  // Filtered records
  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((item) => {
      // Date filter
      if (!isDateInPeriod(item.rawDate, periodFilter, customStartDate, customEndDate)) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all' && item.statusLower !== statusFilter.toLowerCase()) {
        return false;
      }
      // Method filter
      if (methodFilter !== 'all' && !item.methodLower.includes(methodFilter.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [paymentRecords, periodFilter, customStartDate, customEndDate, statusFilter, methodFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalReceipts = paymentRecords.length;
    let totalCollected = 0;
    let paidCount = 0;
    let pendingCount = 0;

    paymentRecords.forEach((r) => {
      if (r.statusLower === 'paid' || r.statusLower === 'completed') {
        totalCollected += r.amountNum || 0;
        paidCount += 1;
      } else {
        pendingCount += 1;
      }
    });

    return {
      totalReceipts,
      totalCollected,
      paidCount,
      pendingCount,
    };
  }, [paymentRecords]);

  const handleResetFilters = () => {
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('all');
    setMethodFilter('all');
  };

  const isFilterActive =
    periodFilter !== 'all' ||
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    customStartDate ||
    customEndDate;

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = [
      'Receipt ID',
      'Transaction Ref',
      'Patient Name',
      'Patient Type',
      'Guardian Name',
      'Payment Method',
      'Destination',
      'Amount Paid (NGN)',
      'Status',
      'Bank Name',
      'Cashier Name',
      'Date & Time',
    ];

    const rows = filteredRecords.map((r) => [
      r.receiptId,
      r.transactionId,
      r.name,
      r.isForDependant ? 'Dependant' : 'Patient',
      r.guardianName || 'N/A',
      r.paymentMethod,
      r.paymentDestination,
      r.amountNum,
      r.status,
      r.bankName,
      r.cashierName,
      r.dateTime,
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Kolak_Payment_Receipts_${dateStr}.csv`, headers, rows);
    toast.success(`Exported ${filteredRecords.length} payment receipts!`);
  };

  const getStatusBadgeClass = (status) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'declined':
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'reversed':
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleViewDetails = (payment) => {
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
      <h2>KOLAK HOSPITAL</h2>
      <div class="divider"></div>
      <div class="row"><span class="label">Txn:</span> <span>${payment.transactionId}</span></div>
      <div class="row"><span class="label">Patient:</span> <span>${payment.name}</span></div>
      <div class="row"><span class="label">Amount:</span> <span>${payment.amount}</span></div>
      <div class="row"><span class="label">Method:</span> <span>${payment.paymentMethod}</span></div>
      <div class="row"><span class="label">Bank:</span> <span>${payment.bankName}</span></div>
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
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(generateReceiptHTML(payment));
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  const columns = useMemo(
    () => [
      {
        key: 'transactionId',
        title: 'Transaction / ID',
        sortable: true,
        className: 'font-mono text-xs font-semibold text-primary',
      },
      {
        key: 'name',
        title: 'Patient Name',
        sortable: true,
        className: 'text-base-content font-medium',
        render: (value, row) => (
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base-content">{value}</span>
              {row.isForDependant && (
                <span className="badge badge-xs badge-outline badge-primary">Dependant</span>
              )}
            </div>
            {row.isForDependant && row.guardianName && (
              <span className="text-xs text-base-content/50 block">Guardian: {row.guardianName}</span>
            )}
          </div>
        ),
      },
      {
        key: 'paymentMethod',
        title: 'Method',
        sortable: true,
        className: 'capitalize text-sm font-medium',
        render: (value) => (
          <span className="badge badge-sm badge-ghost font-medium uppercase tracking-wide text-xs">
            {value}
          </span>
        ),
      },
      {
        key: 'amount',
        title: 'Amount Paid',
        sortable: true,
        className: 'text-base-content font-black text-sm',
      },
      {
        key: 'paymentDestination',
        title: 'Destination',
        sortable: true,
        className: 'capitalize text-base-content/70 text-xs',
      },
      {
        key: 'dateTime',
        title: 'Date & Time',
        sortable: true,
        className: 'text-base-content/70 text-xs sm:text-sm',
      },
      {
        key: 'cashierName',
        title: 'Cashier',
        sortable: true,
        className: 'text-base-content/70 text-xs',
      },
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        render: (value) => (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
              value
            )}`}
          >
            {String(value).toLowerCase() === 'paid' ? (
              <FaCheckCircle className="w-2.5 h-2.5" />
            ) : (
              <FaClock className="w-2.5 h-2.5" />
            )}
            <span className="capitalize">{value}</span>
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'Actions',
        className: 'text-base-content/70',
        render: (value, row) => (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleViewDetails(row)}
              className="btn btn-ghost btn-xs text-primary"
              title="View Details"
            >
              <FaEye className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handlePrintReceipt(row)}
              className="btn btn-ghost btn-xs text-base-content/70"
              title="Print Receipt"
            >
              <FaPrint className="w-3.5 h-3.5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  return (
    <CashierLayout>
      {isLoading && <KolakLoader fullscreen />}

      <div className="p-3 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
              Payment Receipts
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              Verify cashier transactions, audit payment receipts, and download financial reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="btn btn-outline btn-primary gap-2 shadow-sm"
              title="Export receipts to CSV"
            >
              <FaDownload className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchReceipt}
              className="btn btn-ghost btn-square"
              title="Refresh Data"
            >
              <FaUndo className="w-4 h-4 text-base-content/70" />
            </button>
          </div>
        </div>

        {/* KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Total Receipts
              </p>
              <h3 className="text-2xl font-black text-base-content mt-1">
                {summaryMetrics.totalReceipts}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Recorded transactions</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FaReceipt className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Total Collected
              </p>
              <h3 className="text-2xl font-black text-primary mt-1">
                ₦{summaryMetrics.totalCollected.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Confirmed revenue</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Paid Receipts
              </p>
              <h3 className="text-2xl font-black text-success mt-1">
                {summaryMetrics.paidCount}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Cleared payments</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Pending / Other
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {summaryMetrics.pendingCount}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Requires audit</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FaClock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="bg-base-100 rounded-2xl p-4 border border-base-200 shadow-sm space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Period Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider mr-1 flex items-center gap-1">
                <FaCalendarAlt className="w-3 h-3 text-primary" /> Period:
              </span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'week', label: 'This Week' },
                { id: 'month', label: 'This Month' },
                { id: 'custom', label: 'Custom Range' },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriodFilter(p.id)}
                  className={`btn btn-xs rounded-full px-3 transition-all ${
                    periodFilter === p.id
                      ? 'btn-primary font-bold shadow-sm'
                      : 'btn-ghost text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Dropdown Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                  <FaFilter className="w-3 h-3 text-primary" /> Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered select-xs rounded-lg text-xs capitalize"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="declined">Declined</option>
                  <option value="reversed">Reversed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              {/* Method Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider">
                  Method:
                </span>
                <select
                  value={methodFilter}
                  onChange={(e) => setMethodFilter(e.target.value)}
                  className="select select-bordered select-xs rounded-lg text-xs capitalize"
                >
                  <option value="all">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="transfer">Bank Transfer</option>
                  <option value="pos">POS Terminal</option>
                  <option value="hmo">HMO Insurance</option>
                </select>
              </div>

              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-ghost btn-xs text-error gap-1"
                  title="Reset all filters"
                >
                  <FaUndo className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Pickers */}
          {periodFilter === 'custom' && (
            <div className="pt-3 border-t border-base-200 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-base-content/70">From:</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="input input-bordered input-xs rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-base-content/70">To:</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="input input-bordered input-xs rounded-lg text-xs"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="btn btn-ghost btn-xs text-xs"
                >
                  Clear Dates
                </button>
              )}
            </div>
          )}

          {/* Record Count Badge */}
          <div className="pt-2 border-t border-base-200/60 flex items-center justify-between text-xs text-base-content/60">
            <span>
              Showing <strong className="text-primary font-bold">{filteredRecords.length}</strong> of{' '}
              {paymentRecords.length} payment receipts
            </span>
            {isFilterActive && (
              <span className="badge badge-sm badge-ghost text-xs">Filtered view</span>
            )}
          </div>
        </div>

        {/* Data Table Card */}
        <div className="card bg-base-100 shadow-xl border border-base-200 w-full min-w-0">
          <div className="card-body p-2 sm:p-5 min-w-0">
            {isLoading ? (
              <div className="py-20 flex justify-center items-center">
                <KolakLoader size="lg" />
              </div>
            ) : (
              <DataTable
                data={filteredRecords}
                columns={columns}
                searchable={true}
                sortable={true}
                paginated={true}
                initialEntriesPerPage={10}
                showEntries={true}
                searchPlaceholder="Search by patient, reference ID, cashier..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {isModalOpen && selectedPayment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleClose();
          }}
        >
          <div className="w-full max-w-lg mx-auto shadow-2xl card bg-base-100 max-h-[90vh] flex flex-col overflow-hidden rounded-2xl">
            <div className="p-5 card-body overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-base-200">
                <div>
                  <h2 className="text-xl font-black text-base-content">
                    Payment Details
                  </h2>
                  <p className="text-xs text-base-content/60 font-mono">
                    Ref: {selectedPayment.transactionId}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 bg-base-200/50 p-4 rounded-xl text-sm">
                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Patient:</span>
                  <div className="text-right">
                    <span className="font-bold text-base-content">{selectedPayment.name}</span>
                    {selectedPayment.isForDependant && (
                      <span className="badge badge-xs badge-outline badge-primary ml-1.5">
                        Dependant
                      </span>
                    )}
                    {selectedPayment.isForDependant && selectedPayment.guardianName && (
                      <p className="text-xs text-base-content/50">
                        Guardian: {selectedPayment.guardianName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Amount:</span>
                  <span className="text-lg font-black text-primary">{selectedPayment.amount}</span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Payment Method:</span>
                  <span className="font-semibold uppercase tracking-wide text-xs badge badge-ghost">
                    {selectedPayment.paymentMethod}
                  </span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Payment Destination:</span>
                  <span className="font-semibold capitalize text-base-content">
                    {selectedPayment.paymentDestination}
                  </span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Bank Name:</span>
                  <span className="font-semibold text-base-content">{selectedPayment.bankName}</span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Sender:</span>
                  <span className="font-semibold text-base-content">{selectedPayment.senderName}</span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Paid By:</span>
                  <span className="font-semibold text-base-content">{selectedPayment.paidBy}</span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Cashier:</span>
                  <span className="font-semibold text-base-content">{selectedPayment.cashierName}</span>
                </div>

                <div className="flex justify-between border-b border-base-200 pb-2">
                  <span className="text-base-content/60 font-medium">Date & Time:</span>
                  <span className="font-semibold text-base-content">{selectedPayment.dateTime}</span>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-base-content/60 font-medium">Status:</span>
                  {isEditing ? (
                    <select
                      value={editStatus || selectedPayment.status || ''}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="select select-bordered select-xs"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="declined">Declined</option>
                      <option value="reversed">Reversed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  ) : (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadgeClass(
                        selectedPayment.status
                      )}`}
                    >
                      <span className="capitalize">{selectedPayment.status}</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-base-200">
                <button
                  onClick={() => handlePrintReceipt(selectedPayment)}
                  className="btn btn-primary flex-1 gap-2"
                >
                  <FaPrint className="w-4 h-4" />
                  Print Receipt
                </button>

                {selectedPayment.status !== 'paid' && !isEditing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditStatus(selectedPayment.status || 'pending');
                      setIsEditing(true);
                    }}
                    className="btn btn-outline btn-warning"
                  >
                    Edit Status
                  </button>
                )}

                {selectedPayment.status !== 'paid' && isEditing && (
                  <button
                    type="button"
                    onClick={handleSave}
                    className="btn btn-success text-white"
                    disabled={updating}
                  >
                    {updating ? 'Saving...' : 'Save'}
                  </button>
                )}

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
    </CashierLayout>
  );
};

export default ReceiptRecord;
