import React, { useState, useEffect, useMemo } from 'react';
import { DataTable } from '@/components/common';
import { CashierLayout } from '@/layouts/cashier';
import {
  FaEye,
  FaPrint,
  FaTag,
  FaDownload,
  FaCalendarAlt,
  FaFilter,
  FaUndo,
  FaFileInvoiceDollar,
  FaCheckCircle,
  FaClock,
  FaMoneyBillWave,
} from 'react-icons/fa';
import { getAllBillings } from '@/services/api/billingAPI';
import { getDependantById } from '@/services/api/dependantAPI';
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils';
import KolakLoader from '@/components/common/KolakLoader';
import { useAppSelector } from '@/store/hooks';
import AdjustDiscountModal from '@/components/modals/AdjustDiscountModal';
import toast from 'react-hot-toast';

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

const BillingRecord = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = String(user?.role || user?.accountType || '').toLowerCase().trim().replace(/[_ ]/g, '-');
  const isMedicalDirector = ['medical-director', 'super-admin', 'superadmin', 'admin'].includes(userRole);
  const discountApproverLabel = ['super-admin', 'superadmin'].includes(userRole)
    ? 'Super Admin'
    : userRole === 'admin'
    ? 'Admin'
    : 'Medical Director';

  const [paymentRecords, setPaymentRecords] = useState([]);
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [discountBilling, setDiscountBilling] = useState(null);

  // Filter States
  const [periodFilter, setPeriodFilter] = useState('all'); // 'all' | 'today' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'cleared' | 'outstanding'

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

      const mapped = billingList.map((a) => {
        const isForDependant = !!a.dependantId;
        const dependant = isForDependant ? a.dependant || extraDependantMap[a.dependantId] : null;
        const guardian = a.patient;

        const name = isForDependant
          ? (dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() || 'Dependant' : 'Dependant')
          : (guardian ? `${guardian.firstName} ${guardian.lastName}` : (a.opdPatient ? `${a.opdPatient.firstName} ${a.opdPatient.lastName}` : 'N/A'));

        const guardianName = isForDependant && guardian
          ? `${guardian.firstName} ${guardian.lastName}`
          : null;

        const totalNum = Number(a.totalAmount || 0);
        const outstandingNum = Number(a.outstandingBill || 0);
        const isSettled = a.isCleared || outstandingNum <= 0;

        return {
          billingId: a.id,
          name,
          isForDependant,
          guardianName,
          totalAmountNum: totalNum,
          outstandingBillNum: outstandingNum,
          totalAmount: `₦ ${totalNum.toLocaleString()}`,
          outstandingBill: `₦ ${outstandingNum.toLocaleString()}`,
          isSettled,
          status: isSettled ? 'Cleared' : 'Pending',
          itemDetails: a.itemDetails,
          amount: `₦ ${Number(a.amountPaid || 0).toLocaleString()}`,
          dateTime: formatNigeriaDateTime(a.createdAt),
          rawDate: a.createdAt,
          raisedBy: a.raisedBy ? `${a.raisedBy.firstName} ${a.raisedBy.lastName}` : 'N/A',
          cashierName: a.raisedBy ? `${a.raisedBy.firstName} ${a.raisedBy.lastName}` : 'N/A',
          raw: a,
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

  useEffect(() => {
    fetchBilling();
  }, []);

  // Filtered records based on active filters
  const filteredRecords = useMemo(() => {
    return paymentRecords.filter((item) => {
      // Date filter
      if (!isDateInPeriod(item.rawDate, periodFilter, customStartDate, customEndDate)) {
        return false;
      }
      // Status filter
      if (statusFilter === 'cleared' && !item.isSettled) return false;
      if (statusFilter === 'outstanding' && item.isSettled) return false;

      return true;
    });
  }, [paymentRecords, periodFilter, customStartDate, customEndDate, statusFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalRecords = paymentRecords.length;
    let totalBilled = 0;
    let totalOutstanding = 0;
    let clearedCount = 0;

    paymentRecords.forEach((r) => {
      totalBilled += r.totalAmountNum || 0;
      totalOutstanding += r.outstandingBillNum || 0;
      if (r.isSettled) clearedCount += 1;
    });

    return {
      totalRecords,
      totalBilled,
      totalOutstanding,
      clearedCount,
      pendingCount: totalRecords - clearedCount,
    };
  }, [paymentRecords]);

  const handleResetFilters = () => {
    setPeriodFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setStatusFilter('all');
  };

  const isFilterActive = periodFilter !== 'all' || statusFilter !== 'all' || customStartDate || customEndDate;

  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      toast.error('No records to export');
      return;
    }

    const headers = [
      'Billing ID',
      'Patient Name',
      'Patient Type',
      'Guardian Name',
      'Total Amount (NGN)',
      'Outstanding (NGN)',
      'Status',
      'Date & Time',
      'Raised By',
    ];

    const rows = filteredRecords.map((r) => [
      r.billingId,
      r.name,
      r.isForDependant ? 'Dependant' : 'Patient',
      r.guardianName || 'N/A',
      r.totalAmountNum,
      r.outstandingBillNum,
      r.status,
      r.dateTime,
      r.raisedBy,
    ]);

    const dateStr = new Date().toISOString().split('T')[0];
    exportToCsv(`Kolak_Billing_Records_${dateStr}.csv`, headers, rows);
    toast.success(`Exported ${filteredRecords.length} billing records!`);
  };

  const handleViewDetails = (payment) => {
    setSelectedBilling(payment);
    setIsModalOpen(true);
  };

  const generateReceiptHTML = (billing) => {
    const items = billing.itemDetails
      ?.map(
        (item) => `
      <tr>
        <td>${item.code || '-'}</td>
        <td>${item.description || '-'}</td>
        <td>${item.quantity || 1}</td>
        <td>₦ ${Number(item.price || item.unitPrice || 0).toLocaleString()}</td>
        <td>₦ ${Number(item.total || 0).toLocaleString()}</td>
      </tr>
    `
      )
      .join('');

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
    const receiptWindow = window.open('', '_blank');
    receiptWindow.document.write(generateReceiptHTML(billing));
    receiptWindow.document.close();
    receiptWindow.focus();
    setTimeout(() => {
      receiptWindow.print();
    }, 500);
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        title: 'Patient / Client',
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
        key: 'totalAmount',
        title: 'Total Amount',
        sortable: true,
        className: 'text-base-content font-semibold',
      },
      {
        key: 'outstandingBill',
        title: 'Outstanding Bill',
        sortable: true,
        render: (value, row) => (
          <span
            className={
              row.outstandingBillNum > 0
                ? 'text-error font-semibold'
                : 'text-success font-medium'
            }
          >
            {value}
          </span>
        ),
      },
      {
        key: 'status',
        title: 'Status',
        sortable: true,
        render: (value, row) => (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              row.isSettled
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {row.isSettled ? (
              <>
                <FaCheckCircle className="w-2.5 h-2.5" /> Cleared
              </>
            ) : (
              <>
                <FaClock className="w-2.5 h-2.5" /> Pending
              </>
            )}
          </span>
        ),
      },
      {
        key: 'dateTime',
        title: 'Date & Time',
        sortable: true,
        className: 'text-base-content/70 text-xs sm:text-sm',
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
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleViewDetails(row)}
              className="btn btn-ghost btn-xs text-primary"
              title="View Details"
            >
              <FaEye className="w-3.5 h-3.5" />
            </button>

            {isMedicalDirector && !row.raw?.isCleared && (
              <button
                onClick={() => {
                  setDiscountBilling(row.raw);
                  setIsDiscountModalOpen(true);
                }}
                className="btn btn-ghost btn-xs text-warning"
                title="Grant / Adjust Medical Director Discount"
              >
                <FaTag className="w-3 h-3" />
              </button>
            )}

            <button
              onClick={() => handlePrintReceipt(row)}
              className="btn btn-ghost btn-xs"
              title="Print Receipt"
            >
              <FaPrint className="w-3 h-3" />
            </button>
          </div>
        ),
      },
    ],
    [isMedicalDirector]
  );

  return (
    <CashierLayout>
      {isLoading && <KolakLoader fullscreen />}

      <div className="p-3 sm:p-6 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-base-content tracking-tight">
              Billing Records
            </h1>
            <p className="text-sm text-base-content/70 mt-1">
              Comprehensive ledger of patient billings, generated invoices, and outstanding accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="btn btn-outline btn-primary gap-2 shadow-sm"
              title="Export records to CSV"
            >
              <FaDownload className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={fetchBilling}
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
                Total Billings
              </p>
              <h3 className="text-2xl font-black text-base-content mt-1">
                {summaryMetrics.totalRecords}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Recorded invoices</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FaFileInvoiceDollar className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Total Billed
              </p>
              <h3 className="text-2xl font-black text-primary mt-1">
                ₦{summaryMetrics.totalBilled.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">Gross billed value</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <FaMoneyBillWave className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Total Outstanding
              </p>
              <h3 className="text-2xl font-black text-error mt-1">
                ₦{summaryMetrics.totalOutstanding.toLocaleString()}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                {summaryMetrics.pendingCount} accounts pending
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
              <FaClock className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-base-100 rounded-2xl p-4 sm:p-5 border border-base-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-base-content/60">
                Settled / Cleared
              </p>
              <h3 className="text-2xl font-black text-success mt-1">
                {summaryMetrics.clearedCount}
              </h3>
              <p className="text-xs text-base-content/60 mt-0.5">
                {summaryMetrics.totalRecords > 0
                  ? Math.round((summaryMetrics.clearedCount / summaryMetrics.totalRecords) * 100)
                  : 0}
                % clearance rate
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <FaCheckCircle className="w-6 h-6" />
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

            {/* Status Dropdown */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-base-content/60 uppercase tracking-wider flex items-center gap-1">
                  <FaFilter className="w-3 h-3 text-primary" /> Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="select select-bordered select-xs rounded-lg text-xs"
                >
                  <option value="all">All Status</option>
                  <option value="cleared">Cleared / Settled</option>
                  <option value="outstanding">Pending / Outstanding</option>
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
              {paymentRecords.length} billing records
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
                searchPlaceholder="Search by patient, guardian, ID or cashier..."
              />
            )}
          </div>
        </div>
      </div>

      {/* Billing Details Modal */}
      {isModalOpen && selectedBilling && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="w-full max-w-xl mx-auto shadow-2xl card bg-base-100 max-h-[90vh] flex flex-col overflow-hidden rounded-2xl">
            <div className="p-5 card-body overflow-y-auto space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-base-200">
                <div>
                  <h2 className="text-xl font-black text-base-content">
                    Billing Details
                  </h2>
                  <p className="text-xs text-base-content/60 font-mono">
                    ID: {selectedBilling.billingId}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost btn-sm btn-circle"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-base-200/50 p-4 rounded-xl">
                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase">
                    Patient Name
                  </label>
                  <p className="font-bold text-base-content mt-0.5">
                    {selectedBilling.name}
                    {selectedBilling.isForDependant && (
                      <span className="badge badge-xs badge-outline badge-primary ml-2">
                        Dependant
                      </span>
                    )}
                  </p>
                  {selectedBilling.isForDependant && selectedBilling.guardianName && (
                    <p className="text-xs text-base-content/60 mt-0.5">
                      Guardian: {selectedBilling.guardianName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase">
                    Status
                  </label>
                  <div className="mt-0.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        selectedBilling.isSettled
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {selectedBilling.status}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase">
                    Total Amount
                  </label>
                  <p className="text-lg font-black text-base-content mt-0.5">
                    {selectedBilling.totalAmount}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase">
                    Outstanding Bill
                  </label>
                  <p
                    className={`text-lg font-black mt-0.5 ${
                      selectedBilling.outstandingBillNum > 0 ? 'text-error' : 'text-success'
                    }`}
                  >
                    {selectedBilling.outstandingBill}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase">
                    Raised By
                  </label>
                  <p className="text-sm font-medium text-base-content mt-0.5">
                    {selectedBilling.raisedBy}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/60 uppercase">
                    Date & Time
                  </label>
                  <p className="text-sm font-medium text-base-content mt-0.5">
                    {selectedBilling.dateTime}
                  </p>
                </div>
              </div>

              {/* Item Details */}
              <div>
                <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider block mb-2">
                  Line Items ({selectedBilling.itemDetails?.length || 0})
                </label>
                <div className="overflow-x-auto rounded-xl border border-base-200">
                  <table className="table table-sm w-full">
                    <thead className="bg-base-200 text-xs text-base-content/70 uppercase">
                      <tr>
                        <th>Code</th>
                        <th>Description</th>
                        <th className="text-center">Qty</th>
                        <th className="text-right">Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedBilling.itemDetails?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-base-200/40">
                          <td className="font-mono text-xs">{item.code || '-'}</td>
                          <td className="font-medium">{item.description || '-'}</td>
                          <td className="text-center">{item.quantity || 1}</td>
                          <td className="text-right">
                            ₦{Number(item.price || item.unitPrice || 0).toLocaleString()}
                          </td>
                          <td className="text-right font-semibold">
                            ₦{Number(item.total || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-3 pt-3 border-t border-base-200">
                <button
                  onClick={() => handlePrintReceipt(selectedBilling)}
                  className="btn btn-primary flex-1 gap-2"
                >
                  <FaPrint className="w-4 h-4" />
                  Print Receipt
                </button>
                {isMedicalDirector && !selectedBilling.raw?.isCleared && (
                  <button
                    onClick={() => {
                      setDiscountBilling(selectedBilling.raw);
                      setIsDiscountModalOpen(true);
                    }}
                    className="btn btn-outline btn-warning gap-1.5"
                  >
                    <FaTag className="w-3.5 h-3.5" />
                    <span>Adjust Discount</span>
                  </button>
                )}
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-outline"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Adjust Discount Modal */}
      <AdjustDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        billing={discountBilling}
        patientName={
          discountBilling?.patient
            ? `${discountBilling.patient.firstName} ${discountBilling.patient.lastName}`
            : discountBilling?.opdPatient
            ? `${discountBilling.opdPatient.firstName} ${discountBilling.opdPatient.lastName}`
            : 'Patient'
        }
        approverRole={discountApproverLabel}
        onSuccess={fetchBilling}
      />
    </CashierLayout>
  );
};

export default BillingRecord;
