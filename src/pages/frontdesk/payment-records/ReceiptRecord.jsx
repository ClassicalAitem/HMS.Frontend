/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FrontdeskLayout } from '@/layouts/frontdesk';
import KolakLoader from '@/components/common/KolakLoader';
import {
  FaReceipt,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaCalendarAlt,
  FaFilter,
  FaUndo,
  FaDownload,
  FaEye,
  FaPrint,
  FaSearch,
  FaTimes,
  FaUserAlt,
} from 'react-icons/fa';
import { RiRefreshLine } from 'react-icons/ri';
import { getAllReceipts } from '@/services/api/billingAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import toast from 'react-hot-toast';

const isDateInPeriod = (dateVal, period, customStart, customEnd) => {
  if (period === 'all') return true;
  if (!dateVal) return false;

  const d = new Date(dateVal);
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

  return true;
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

const FrontDeskPaymentRecords = () => {
  const [paymentRecords, setPaymentRecords] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [search, setSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 10;

  const fetchReceipts = useCallback(async (isSilent = false) => {
    try {
      if (isSilent) setRefreshing(true);
      else setIsLoading(true);

      const res = await getAllReceipts();
      const raw = res?.data?.data ?? res?.data ?? [];
      const list = Array.isArray(raw) ? raw : (raw.receipts ?? []);

      const frontdeskDestinations = ['form', 'consultation', 'laboratory', 'pharmacy', 'admission'];
      const filteredList = list.filter((a) =>
        !a.paymentDestination || frontdeskDestinations.includes(a.paymentDestination)
      );

      // Check missing dependants
      const missingDependantIds = [
        ...new Set(
          filteredList
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

      const mapped = filteredList.map((a, idx) => {
        const isForDependant = !!a.dependantId;
        const dependant = isForDependant ? a.dependant || extraDependantMap[a.dependantId] : null;
        const guardian = a.billing?.patient;
        const opdPatient = a.billing?.opdPatient;

        const name = isForDependant
          ? (dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() || 'Dependant' : 'Dependant')
          : (guardian ? `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() : (opdPatient ? `${opdPatient.firstName || ''} ${opdPatient.lastName || ''}`.trim() : 'N/A'));

        const guardianName = isForDependant && guardian
          ? `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim()
          : null;

        const amountNum = Number(a.amountPaid || 0);
        const statusLower = String(a.status || 'pending').toLowerCase();
        const methodLower = String(a.paymentMethod || 'cash').toLowerCase();
        const destLower = String(a.paymentDestination || 'general').toLowerCase();
        const rawDate = a.paidAt || a.updatedAt || a.createdAt;

        return {
          receiptId: a.id || a._id,
          transactionId: a.reference || `Kolak-${idx + 1}`,
          name: name || 'Unknown Patient',
          isForDependant,
          guardianName,
          paymentMethod: a.paymentMethod || 'N/A',
          methodLower,
          paymentDestination: a.paymentDestination || 'General',
          destLower,
          paidBy: a.paidBy || 'N/A',
          status: a.status || 'pending',
          statusLower,
          amountNum,
          amount: `₦ ${amountNum.toLocaleString()}`,
          dateTime: formatNigeriaDateTime(rawDate),
          rawDate,
          cashierName: a.cashier ? `${a.cashier.firstName || ''} ${a.cashier.lastName || ''}`.trim() : 'N/A',
          raw: a,
        };
      });

      setPaymentRecords(mapped);
    } catch (error) {
      console.error('Failed to load payment records:', error);
      toast.error('Failed to load payment records');
      setPaymentRecords([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReceipts();
  }, [fetchReceipts]);

  // Status Badge Class
  const getStatusBadge = (status) => {
    switch (String(status).toLowerCase()) {
      case 'paid':
      case 'completed':
        return 'badge-success text-white';
      case 'pending':
        return 'badge-warning';
      case 'declined':
      case 'failed':
        return 'badge-error text-white';
      case 'reversed':
      case 'refunded':
        return 'badge-info text-white';
      default:
        return 'badge-ghost';
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((item) => {
      // Period filter
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
      // Destination filter
      if (destinationFilter !== 'all' && !item.destLower.includes(destinationFilter.toLowerCase())) {
        return false;
      }
      // Search
      if (search) {
        const q = search.trim().toLowerCase();
        const matches =
          item.name.toLowerCase().includes(q) ||
          String(item.transactionId).toLowerCase().includes(q) ||
          String(item.cashierName).toLowerCase().includes(q) ||
          String(item.paidBy).toLowerCase().includes(q) ||
          String(item.paymentDestination).toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [paymentRecords, periodFilter, customStartDate, customEndDate, statusFilter, methodFilter, destinationFilter, search]);

  // 4 Top KPI Metrics
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

    return { totalReceipts, totalCollected, paidCount, pendingCount };
  }, [paymentRecords]);

  const handleResetFilters = () => {
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('all');
    setMethodFilter('all');
    setDestinationFilter('all');
    setSearch('');
    setCurrentPage(1);
  };

  const isFilterActive =
    periodFilter !== 'all' ||
    statusFilter !== 'all' ||
    methodFilter !== 'all' ||
    destinationFilter !== 'all' ||
    customStartDate ||
    customEndDate ||
    search;

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = [
      'Transaction Ref',
      'Patient Name',
      'Patient Type',
      'Guardian Name',
      'Payment Method',
      'Payment Destination',
      'Amount (NGN)',
      'Status',
      'Paid By',
      'Cashier',
      'Date & Time',
    ];

    const rows = filteredRecords.map((r) => [
      r.transactionId,
      r.name,
      r.isForDependant ? 'Dependant' : 'Patient',
      r.guardianName || 'N/A',
      r.paymentMethod,
      r.paymentDestination,
      r.amountNum,
      r.status,
      r.paidBy,
      r.cashierName,
      r.dateTime,
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Frontdesk_Receipt_Records_${dateStr}.csv`, headers, rows);
    toast.success(`Exported ${filteredRecords.length} payment records!`);
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
body {
  font-family: 'Courier New', monospace;
  background: #fff;
  display: flex;
  justify-content: center;
  padding: 20px;
  color: #111;
}
.receipt {
  width: 300px;
  border: 1px dashed #777;
  padding: 20px;
}
h2 {
  text-align: center;
  font-size: 16px;
  margin: 4px 0 2px 0;
  text-transform: uppercase;
}
p.sub {
  text-align: center;
  font-size: 11px;
  margin: 0 0 10px 0;
  color: #555;
}
.row {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  margin: 4px 0;
}
.label {
  font-weight: bold;
}
.divider {
  border-top: 1px dashed #777;
  margin: 10px 0;
}
.footer {
  text-align: center;
  font-size: 11px;
  margin-top: 14px;
  color: #444;
}
@media print {
  body { padding: 0; }
}
</style>
</head>
<body>
<div class="receipt">
  <h2>Kolak Hospital</h2>
  <p class="sub">Official Payment Receipt</p>
  <div class="divider"></div>
  <div class="row"><span class="label">Txn Ref:</span> <span>${payment.transactionId}</span></div>
  <div class="row"><span class="label">Patient:</span> <span>${payment.name}</span></div>
  ${payment.guardianName ? `<div class="row"><span class="label">Guardian:</span> <span>${payment.guardianName}</span></div>` : ''}
  <div class="row"><span class="label">Amount:</span> <span><strong>${payment.amount}</strong></span></div>
  <div class="row"><span class="label">Method:</span> <span>${payment.paymentMethod}</span></div>
  <div class="row"><span class="label">Destination:</span> <span>${payment.paymentDestination}</span></div>
  <div class="row"><span class="label">Paid By:</span> <span>${payment.paidBy}</span></div>
  <div class="row"><span class="label">Cashier:</span> <span>${payment.cashierName}</span></div>
  <div class="row"><span class="label">Date:</span> <span>${payment.dateTime}</span></div>
  <div class="row"><span class="label">Status:</span> <span>${payment.status?.toUpperCase()}</span></div>
  <div class="divider"></div>
  <div class="footer">Thank you for choosing Kolak Hospital.</div>
</div>
</body>
</html>
`;
  };

  const handlePrintReceipt = (payment) => {
    const receiptWindow = window.open('', '_blank');
    if (!receiptWindow) {
      toast.error('Pop-up blocked. Please allow pop-ups to print receipts.');
      return;
    }
    receiptWindow.document.write(generateReceiptHTML(payment));
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / resultsPerPage));
  const startIndex = (currentPage - 1) * resultsPerPage;
  const currentRecords = filteredRecords.slice(startIndex, startIndex + resultsPerPage);

  return (
    <FrontdeskLayout>
      {isLoading && <KolakLoader fullscreen text="Loading payment records..." />}

      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-[#00943C]/10 text-[#00943C] shadow-xs">
              <FaReceipt size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                Payment Receipt Records
              </h1>
              <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                View, filter, track, and print patient payment receipt transactions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
              title="Export filtered records to CSV"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold">Export CSV</span>
            </button>
            <button
              onClick={() => fetchReceipts(true)}
              disabled={refreshing}
              className="btn btn-ghost btn-sm btn-circle"
              title="Refresh records"
            >
              <RiRefreshLine className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 Top KPI Stat Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Receipts */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Total Receipts
              </span>
              <h3 className="text-2xl font-black text-base-content mt-1">
                {summaryMetrics.totalReceipts.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">All transactions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FaReceipt className="w-6 h-6" />
            </div>
          </div>

          {/* Total Revenue */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Revenue Collected
              </span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">
                ₦{summaryMetrics.totalCollected.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Settled income</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
          </div>

          {/* Paid / Successful */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Successful Payments
              </span>
              <h3 className="text-2xl font-black text-success mt-1">
                {summaryMetrics.paidCount.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Paid transactions</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success/10 text-success flex items-center justify-center shrink-0">
              <FaCheckCircle className="w-6 h-6" />
            </div>
          </div>

          {/* Pending / Other */}
          <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50">
                Pending / Other
              </span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {summaryMetrics.pendingCount.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Action / review</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <FaClock className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter Toolbar Card */}
        <div className="card bg-base-100 border border-base-300 shadow-sm p-4 sm:p-5 space-y-4">
          {/* Top Filter Controls: Period pills & Search */}
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
                  onClick={() => {
                    setPeriodFilter(p.id);
                    setCurrentPage(1);
                  }}
                  className={`btn btn-xs rounded-full px-3 transition-all ${
                    periodFilter === p.id
                      ? 'btn-primary font-bold shadow-xs'
                      : 'btn-ghost text-base-content/70 hover:bg-base-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-80">
              <FaSearch className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search patient, txn ID, cashier..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-sm input-bordered w-full pl-9 pr-8 text-xs rounded-xl"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Secondary Dropdown Filters Row */}
          <div className="pt-3 border-t border-base-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-base-content/60 flex items-center gap-1 mr-1">
                <FaFilter className="w-3 h-3 text-primary" /> Filter by:
              </span>

              {/* Status Select */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-bordered select-xs rounded-lg text-xs"
              >
                <option value="all">All Status</option>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="declined">Declined</option>
                <option value="reversed">Reversed</option>
                <option value="refunded">Refunded</option>
              </select>

              {/* Method Select */}
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-bordered select-xs rounded-lg text-xs"
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="pos">POS</option>
                <option value="hmo">HMO</option>
              </select>

              {/* Destination Select */}
              <select
                value={destinationFilter}
                onChange={(e) => {
                  setDestinationFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="select select-bordered select-xs rounded-lg text-xs"
              >
                <option value="all">All Destinations</option>
                <option value="form">Registration Form</option>
                <option value="consultation">Consultation</option>
                <option value="pharmacy">Pharmacy</option>
                <option value="laboratory">Laboratory</option>
                <option value="admission">Admission</option>
              </select>

              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-ghost btn-xs text-error font-medium gap-1"
                  title="Reset all active filters"
                >
                  <FaUndo className="w-2.5 h-2.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            <div className="badge badge-lg bg-primary/10 border-none text-primary font-bold text-xs px-3 py-2 gap-1 self-end sm:self-auto">
              <span>Showing:</span>
              <span className="font-extrabold">{filteredRecords.length}</span>
              <span className="font-normal text-primary/80">records</span>
            </div>
          </div>

          {/* Custom Date Pickers */}
          {periodFilter === 'custom' && (
            <div className="pt-3 border-t border-base-200 flex flex-wrap items-center gap-3 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-base-content/60 font-semibold">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => {
                    setCustomStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-bordered input-xs rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base-content/60 font-semibold">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => {
                    setCustomEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="input input-bordered input-xs rounded-lg"
                />
              </div>
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="btn btn-ghost btn-xs text-error"
                >
                  Clear Dates
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table Card */}
        <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
            <table className="table table-zebra w-full text-xs">
              <thead className="bg-base-200/80 backdrop-blur-xs sticky top-0 z-10 uppercase text-base-content/70">
                <tr>
                  <th className="w-12">#</th>
                  <th>Transaction ID</th>
                  <th>Patient Profile</th>
                  <th>Method</th>
                  <th>Amount Paid</th>
                  <th>Destination</th>
                  <th>Cashier</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentRecords.map((record, idx) => {
                  const initial = (record.name || 'P')[0]?.toUpperCase() || 'P';
                  const serialNumber = startIndex + idx + 1;

                  return (
                    <tr key={record.receiptId} className="hover:bg-base-200/40">
                      <td className="font-bold text-base-content/50">{serialNumber}</td>
                      <td>
                        <span className="font-mono text-xs font-bold text-primary px-2 py-0.5 rounded-md bg-primary/5">
                          {record.transactionId}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                            {initial}
                          </div>
                          <div>
                            <p className="font-bold text-base-content">{record.name}</p>
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                record.isForDependant
                                  ? 'bg-secondary/10 text-secondary'
                                  : 'bg-base-200 text-base-content/60'
                              }`}
                            >
                              {record.isForDependant ? 'Dependant' : 'Patient'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-sm badge-outline font-semibold uppercase tracking-wider text-[11px]">
                          {record.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span className="font-bold text-sm text-base-content">
                          {record.amount}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-sm bg-base-200 text-base-content/80 font-medium capitalize">
                          {record.paymentDestination}
                        </span>
                      </td>
                      <td className="text-base-content/70">
                        {record.cashierName}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadge(record.status)} badge-sm font-bold shadow-2xs`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="text-base-content/60 whitespace-nowrap">
                        {record.dateTime}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleViewDetails(record)}
                            className="btn btn-ghost btn-xs text-primary"
                            title="View receipt details"
                          >
                            <FaEye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handlePrintReceipt(record)}
                            className="btn btn-ghost btn-xs text-base-content/70 hover:text-base-content"
                            title="Print payment receipt"
                          >
                            <FaPrint className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {currentRecords.length === 0 && (
            <div className="py-16 text-center">
              <FaReceipt className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
              <h3 className="font-bold text-base text-base-content">No payment records found</h3>
              <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
                {isFilterActive
                  ? 'No payment receipt transactions matched your active filters. Try resetting the filters.'
                  : 'There are currently no recorded payment transactions.'}
              </p>
              {isFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="btn btn-outline btn-sm btn-primary mt-4"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="p-4 bg-base-100 border-t border-base-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-base-content/60">
                Showing <strong>{startIndex + 1}</strong> to{' '}
                <strong>{Math.min(startIndex + resultsPerPage, filteredRecords.length)}</strong> of{' '}
                <strong>{filteredRecords.length}</strong> transactions
              </span>

              <div className="join">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="join-item btn btn-xs btn-outline"
                >
                  «
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`join-item btn btn-xs ${
                      currentPage === i + 1 ? 'btn-primary font-bold' : 'btn-ghost'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="join-item btn btn-xs btn-outline"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Details Modal */}
        {isModalOpen && selectedPayment && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsModalOpen(false);
            }}
          >
            <div className="w-full max-w-lg shadow-xl card bg-base-100 border border-base-300">
              <div className="p-6 card-body space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-base-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                      <FaReceipt className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-base-content">
                        Receipt Details
                      </h2>
                      <p className="text-xs font-mono font-bold text-primary">
                        {selectedPayment.transactionId}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost btn-sm btn-circle"
                  >
                    <FaTimes className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Patient Name</span>
                    <span className="text-sm font-bold text-base-content mt-0.5 block">
                      {selectedPayment.name}
                    </span>
                    {selectedPayment.guardianName && (
                      <span className="text-[11px] text-base-content/50 block mt-0.5">
                        Guardian: {selectedPayment.guardianName}
                      </span>
                    )}
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Amount Paid</span>
                    <span className="text-base font-black text-emerald-600 mt-0.5 block">
                      {selectedPayment.amount}
                    </span>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Payment Method</span>
                    <span className="badge badge-sm badge-outline font-semibold uppercase mt-1">
                      {selectedPayment.paymentMethod}
                    </span>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Destination</span>
                    <span className="badge badge-sm bg-base-300 font-medium capitalize mt-1">
                      {selectedPayment.paymentDestination}
                    </span>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Paid By</span>
                    <span className="text-base-content font-medium mt-0.5 block">
                      {selectedPayment.paidBy}
                    </span>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Cashier</span>
                    <span className="text-base-content font-medium mt-0.5 block">
                      {selectedPayment.cashierName}
                    </span>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Status</span>
                    <span className={`badge ${getStatusBadge(selectedPayment.status)} badge-sm font-bold mt-1`}>
                      {selectedPayment.status}
                    </span>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl">
                    <span className="text-base-content/60 font-semibold block">Transaction Date</span>
                    <span className="text-base-content font-medium mt-0.5 block">
                      {selectedPayment.dateTime}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-base-200">
                  <button
                    onClick={() => handlePrintReceipt(selectedPayment)}
                    className="btn btn-outline btn-primary btn-sm gap-2 font-bold"
                  >
                    <FaPrint className="w-3.5 h-3.5" />
                    <span>Print Receipt Slip</span>
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="btn btn-ghost btn-sm"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </FrontdeskLayout>
  );
};

export default FrontDeskPaymentRecords;
