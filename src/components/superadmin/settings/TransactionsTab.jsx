import React, { useEffect, useState, useMemo } from 'react';
import {
  FaDownload,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaUndo,
  FaFileInvoiceDollar,
} from 'react-icons/fa';
import { getAllReceipts, getAllBillings } from '@/services/api/billingAPI';
import { exportRowsToCsv, isDateInPeriod } from '@/pages/superadmin/reports/reportUtils';
import { formatNigeriaDateTime, formatNigeriaDate } from '@/utils/formatDateTimeUtils';
import { showErrorToast } from '@/utils/errorHandler';
import toast from 'react-hot-toast';

const TransactionsTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rcptRes, billRes] = await Promise.all([
          getAllReceipts({ sort: 'createdAt:desc', limit: 'all' }),
          getAllBillings({ limit: 'all' }),
        ]);

        const rawRcpt = rcptRes?.data?.data ?? rcptRes?.data ?? [];
        const rcptList = Array.isArray(rawRcpt) ? rawRcpt : (rawRcpt.receipts ?? []);

        const rawBill = billRes?.data?.data ?? billRes?.data ?? [];
        const billList = Array.isArray(rawBill) ? rawBill : (rawBill.billings ?? []);
        setBillings(billList);

        const mapped = rcptList.map((a, idx) => {
          const rawDate = a.paidAt || a.createdAt || a.updatedAt;
          const patientName = a.billing?.patient
            ? `${a.billing.patient.firstName || ''} ${a.billing.patient.lastName || ''}`.trim()
            : a.dependant
            ? `${a.dependant.firstName || ''} ${a.dependant.lastName || ''}`.trim()
            : a.senderName || a.patientName || 'Medical Patient';

          const serviceName =
            a.paymentDestination ||
            (a.billing?.itemDetails && a.billing.itemDetails.length > 0
              ? `${a.billing.itemDetails[0].description || a.billing.itemDetails[0].code || 'Item'} (${a.billing.itemDetails.length} items)`
              : 'Clinical Services');

          const refNum = a.reference || a.id || `RCPT-${String(idx + 1).padStart(5, '0')}`;
          const cashierName = a.cashier
            ? `${a.cashier.firstName || ''} ${a.cashier.lastName || ''}`.trim()
            : 'Cashier Desk';

          return {
            id: a.id || a._id || `txn-${idx}`,
            reference: refNum,
            patient: patientName,
            service: serviceName,
            amount: Number(a.amountPaid || 0),
            rawDate: rawDate,
            paymentMethod: a.paymentMethod || 'Cash',
            status: a.status || 'paid',
            cashier: cashierName,
            raw: a,
          };
        });

        setTransactions(mapped);
      } catch (error) {
        showErrorToast(error, 'Failed to load transaction records');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount || 0);
  };

  // Real KPI Figures
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let todayRev = 0;
    let monthRev = 0;
    let totalRev = 0;

    transactions.forEach((t) => {
      const amt = Number(t.amount || 0);
      totalRev += amt;

      if (t.rawDate) {
        const d = new Date(t.rawDate);
        if (!isNaN(d.getTime())) {
          // Check today in local time
          if (
            d.getDate() === now.getDate() &&
            d.getMonth() === currentMonth &&
            d.getFullYear() === currentYear
          ) {
            todayRev += amt;
          }

          // Check this month
          if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
            monthRev += amt;
          }
        }
      }
    });

    // Real Pending Bills from active hospital billings
    const pendingTotal = billings.reduce((sum, b) => {
      if (b.isCleared) return sum;
      const due = Number(b.outstandingBill !== undefined ? b.outstandingBill : b.totalAmount || 0);
      return sum + (due > 0 ? due : 0);
    }, 0);

    return {
      todayRevenue: todayRev,
      monthlyRevenue: monthRev,
      totalCollected: totalRev,
      pendingBills: pendingTotal,
    };
  }, [transactions, billings]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return transactions.filter((txn) => {
      // 1. Method filter
      if (methodFilter !== 'all') {
        const m = String(txn.paymentMethod || '').toLowerCase();
        if (!m.includes(methodFilter.toLowerCase())) return false;
      }

      // 2. Date period filter
      if (period !== 'all') {
        if (!isDateInPeriod(txn.rawDate, period, customStartDate, customEndDate)) {
          return false;
        }
      }

      // 3. Search query
      if (q) {
        const match =
          txn.patient.toLowerCase().includes(q) ||
          txn.reference.toLowerCase().includes(q) ||
          txn.service.toLowerCase().includes(q) ||
          txn.paymentMethod.toLowerCase().includes(q) ||
          txn.cashier.toLowerCase().includes(q) ||
          String(txn.amount).includes(q);

        if (!match) return false;
      }

      return true;
    });
  }, [transactions, searchTerm, methodFilter, period, customStartDate, customEndDate]);

  // Export to CSV
  const handleExport = () => {
    if (!filteredTransactions.length) {
      toast.error('No transactions available to export');
      return;
    }

    const columns = [
      { key: 'reference', label: 'Transaction / Receipt ID' },
      { key: 'patient', label: 'Patient Name' },
      { key: 'service', label: 'Service / Department' },
      { key: 'amount', label: 'Amount Paid (₦)' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'date', label: 'Transaction Date' },
      { key: 'cashier', label: 'Cashier / Officer' },
      { key: 'status', label: 'Status' },
    ];

    const rows = filteredTransactions.map((t) => ({
      reference: t.reference,
      patient: t.patient,
      service: t.service,
      amount: t.amount,
      paymentMethod: t.paymentMethod,
      date: t.rawDate ? formatNigeriaDate(t.rawDate) : '—',
      cashier: t.cashier,
      status: t.status,
    }));

    const filename = `hospital_transactions_${period}_${new Date().toISOString().slice(0, 10)}.csv`;
    exportRowsToCsv(rows, columns, filename);
    toast.success(`Exported ${rows.length} transactions to ${filename}`);
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setPeriod('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMethodFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    period !== 'all' ||
    customStartDate !== '' ||
    customEndDate !== '' ||
    methodFilter !== 'all';

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(start, start + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Real Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Today's Collections
            </span>
            <span className="text-2xl font-bold text-primary">
              {formatCurrency(stats.todayRevenue)}
            </span>
            <span className="text-[11px] text-base-content/50 block mt-1">Live payments today</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xl font-bold">
            <FaMoneyBillWave />
          </div>
        </div>

        {/* This Month's Revenue */}
        <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              This Month's Revenue
            </span>
            <span className="text-2xl font-bold text-success">
              {formatCurrency(stats.monthlyRevenue)}
            </span>
            <span className="text-[11px] text-base-content/50 block mt-1">Current calendar month</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center text-xl font-bold">
            <FaCheckCircle />
          </div>
        </div>

        {/* Pending / Outstanding Bills */}
        <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Pending Bills Due
            </span>
            <span className="text-2xl font-bold text-warning">
              {formatCurrency(stats.pendingBills)}
            </span>
            <span className="text-[11px] text-warning/80 font-medium block mt-1">
              Active ledger outstandings
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center text-xl font-bold">
            <FaClock />
          </div>
        </div>

        {/* Total Ledger Revenue */}
        <div className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider block mb-0.5">
              Total Receipts Recorded
            </span>
            <span className="text-2xl font-bold text-base-content">
              {formatCurrency(stats.totalCollected)}
            </span>
            <span className="text-[11px] text-base-content/50 block mt-1">
              {transactions.length} issued receipts
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-base-200 text-base-content flex items-center justify-center text-xl font-bold">
            <FaFileInvoiceDollar />
          </div>
        </div>
      </div>

      {/* Main Filter & Action Bar */}
      <div className="bg-base-100 rounded-2xl border border-base-200 p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative w-full lg:w-96">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search by receipt ID, patient, service, cashier..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-bordered input-sm w-full pl-10 rounded-xl bg-base-200/50 focus:bg-base-100"
            />
          </div>

          {/* Filters & Export */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Filter */}
            <div className="flex items-center gap-1.5 text-xs text-base-content/70">
              <FaCalendarAlt className="w-3 h-3 text-primary" />
              <span>Period:</span>
              <select
                className="select select-bordered select-xs rounded-lg"
                value={period}
                onChange={(e) => {
                  setPeriod(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="1_month">Last 1 Month</option>
                <option value="3_months">Last 3 Months</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div className="flex items-center gap-1.5 text-xs text-base-content/70">
              <FaFilter className="w-3 h-3" />
              <span>Method:</span>
              <select
                className="select select-bordered select-xs rounded-lg"
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Methods</option>
                <option value="cash">Cash</option>
                <option value="pos">POS</option>
                <option value="transfer">Transfer</option>
                <option value="hmo">HMO</option>
              </select>
            </div>

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="btn btn-ghost btn-xs text-xs gap-1 text-error hover:bg-error/10 rounded-lg"
                title="Reset all filters"
              >
                <FaUndo className="w-2.5 h-2.5" />
                <span>Reset</span>
              </button>
            )}

            {/* Export CSV Button */}
            <button
              type="button"
              onClick={handleExport}
              className="btn btn-primary btn-sm rounded-xl gap-1.5 shadow-sm text-white"
            >
              <FaDownload className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {period === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-base-200 text-xs">
            <span className="text-base-content/70 font-medium">Custom Range:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => {
                setCustomStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-bordered input-xs rounded-lg"
            />
            <span className="text-base-content/50">to</span>
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
        )}
      </div>

      {/* Transactions Table */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-base-content flex items-center gap-2">
            <span>Payment Receipt Ledger</span>
            <span className="badge badge-sm badge-neutral font-semibold">
              {filteredTransactions.length} records
            </span>
          </h3>
        </div>

        {loading ? (
          <div className="space-y-3 py-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-base-200/70 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-base-200">
            <table className="table table-zebra w-full text-xs sm:text-sm">
              <thead className="bg-base-200/60 text-base-content/70">
                <tr>
                  <th className="font-semibold py-3">Receipt / Ref</th>
                  <th className="font-semibold py-3">Patient Name</th>
                  <th className="font-semibold py-3">Destination / Service</th>
                  <th className="font-semibold py-3">Amount Paid</th>
                  <th className="font-semibold py-3">Date Paid</th>
                  <th className="font-semibold py-3">Method</th>
                  <th className="font-semibold py-3">Cashier</th>
                </tr>
              </thead>
              <tbody>
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((txn) => (
                    <tr key={txn.id} className="hover:bg-base-200/40 transition-colors">
                      <td className="py-3 font-mono font-bold text-xs text-primary">
                        {txn.reference}
                      </td>
                      <td className="py-3 font-semibold text-base-content">
                        {txn.patient}
                      </td>
                      <td className="py-3 text-base-content/80 text-xs">
                        {txn.service}
                      </td>
                      <td className="py-3 font-bold text-base-content">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="py-3 text-xs text-base-content/70">
                        {txn.rawDate ? formatNigeriaDateTime(txn.rawDate) : '—'}
                      </td>
                      <td className="py-3">
                        <span className="badge badge-sm badge-outline font-medium uppercase text-[10px]">
                          {txn.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 text-xs text-base-content/70">
                        {txn.cashier}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center text-base-content/50 py-12">
                      No transaction records match the specified filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {filteredTransactions.length > itemsPerPage && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-base-content/70">
            <div>
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
              {filteredTransactions.length} entries
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-xs btn-outline rounded-lg"
              >
                Previous
              </button>
              <span className="px-2 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-xs btn-outline rounded-lg"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTab;
