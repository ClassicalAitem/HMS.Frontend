import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { PeriodFilterBar, formatNaira, exportToCsv } from "./accountantUtils";
import {
  FaMoneyBillWave,
  FaReceipt,
  FaBalanceScale,
  FaFileInvoiceDollar,
  FaCreditCard,
  FaUniversity,
  FaShieldAlt,
  FaArrowRight,
  FaArrowDown,
  FaArrowUp,
} from "react-icons/fa";
import toast from "react-hot-toast";

const CHANNEL_ICON = {
  cash: FaMoneyBillWave,
  pos: FaCreditCard,
  transfer: FaUniversity,
  hmo: FaShieldAlt,
};

const AccountantDashboard = () => {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({
    summary: {
      totalMoneyIn: 0,
      patientReceiptsTotal: 0,
      directIncomeTotal: 0,
      totalExpenses: 0,
      netBalance: 0,
      pendingBillsAmount: 0,
      pendingBillsCount: 0,
      hmoPendingAmount: 0,
      totalReceiptsCount: 0,
      totalExpensesCount: 0,
    },
    revenueStreams: [],
    paymentChannels: [],
    ledger: [],
  });

  const loadDashboard = useCallback(
    async (isManual = false) => {
      if (isManual || hasLoadedOnce) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await accountantAPI.getDashboard({
          period,
          ...(period === "custom" && startDate ? { startDate } : {}),
          ...(period === "custom" && endDate ? { endDate } : {}),
        });
        if (res?.data) setData(res.data);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error("Failed to load accountant dashboard:", err);
        toast.error("Failed to load accountant overview");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, startDate, endDate, hasLoadedOnce]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleExportOverviewCsv = () => {
    const headers = ["Section", "Item / Stream", "Transactions", "Amount (NGN)"];
    const rows = [
      ["Summary", "Total Money In", data.summary.totalReceiptsCount, data.summary.totalMoneyIn],
      ["Summary", "Total Expenses", data.summary.totalExpensesCount, data.summary.totalExpenses],
      ["Summary", "Net Balance", "", data.summary.netBalance],
      ["Summary", "Outstanding Patient Bills", data.summary.pendingBillsCount, data.summary.pendingBillsAmount],
      ...data.revenueStreams.map((s) => ["Revenue Stream", s.label, s.count, s.amount]),
      ...data.paymentChannels.map((c) => ["Payment Channel", c.label, c.count, c.amount]),
    ];
    exportToCsv(`accountant-overview-${period}-${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    toast.success("Accountant overview exported to CSV");
  };

  const { summary, revenueStreams, paymentChannels, ledger } = data;
  const maxStreamAmount = Math.max(1, ...revenueStreams.map((s) => Number(s.amount || 0)));

  return (
    <AccountantLayout>
      {loading && !hasLoadedOnce && <KolakLoader fullscreen text="Loading accountant workspace..." />}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Accountant Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Central hospital financial control — every incoming payment, revenue stream, payment channel, and expense.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/accountant/expenses" className="btn btn-sm btn-outline btn-error rounded-xl">
              + Record Expense
            </Link>
            <Link to="/accountant/revenue" className="btn btn-sm btn-primary rounded-xl">
              View All Streams
            </Link>
          </div>
        </div>

        {/* Period Filter + CSV Export */}
        <PeriodFilterBar
          period={period}
          setPeriod={setPeriod}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onExportCsv={handleExportOverviewCsv}
          exportLabel="Export Summary CSV"
          onRefresh={() => loadDashboard(true)}
          refreshing={refreshing}
        />

        {/* Purposeful KPI Cards (4 key financial metrics only) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Total Money In
              </span>
              <span className="p-2.5 rounded-xl bg-success/10 text-success">
                <FaMoneyBillWave className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-base-content mt-3">
              {formatNaira(summary.totalMoneyIn)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {summary.totalReceiptsCount} patient receipts + direct entries
            </p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Total Expenses
              </span>
              <span className="p-2.5 rounded-xl bg-error/10 text-error">
                <FaReceipt className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-error mt-3">
              {formatNaira(summary.totalExpenses)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {summary.totalExpensesCount} recorded expense vouchers
            </p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Net Account Balance
              </span>
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FaBalanceScale className="w-4 h-4" />
              </span>
            </div>
            <p
              className={`text-2xl font-extrabold mt-3 ${
                summary.netBalance >= 0 ? "text-primary" : "text-error"
              }`}
            >
              {formatNaira(summary.netBalance)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Money In minus Expenses</p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Outstanding Bills
              </span>
              <span className="p-2.5 rounded-xl bg-warning/15 text-warning-content">
                <FaFileInvoiceDollar className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-base-content mt-3">
              {formatNaira(summary.pendingBillsAmount)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {summary.pendingBillsCount} unpaid / partial bills
            </p>
          </div>
        </div>

        {/* Payment Channels + Revenue Streams */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Revenue Streams (11 streams from screenshot) */}
          <div className="xl:col-span-2 bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-base-content">Revenue Streams</h2>
                <p className="text-xs text-base-content/60">
                  Breakdown across all 11 hospital service & billing streams
                </p>
              </div>
              <Link
                to="/accountant/revenue"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Full Breakdown <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {revenueStreams.map((stream) => {
                const pct = Math.min(100, Math.round((Number(stream.amount || 0) / maxStreamAmount) * 100));
                return (
                  <div key={stream.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-semibold text-base-content">
                        {stream.label}
                        <span className="ml-2 text-xs font-normal text-base-content/50">
                          ({stream.count} txns)
                        </span>
                      </span>
                      <span className="font-bold text-base-content">
                        {formatNaira(stream.amount)}
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-base-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all duration-300"
                        style={{ width: `${stream.amount > 0 ? Math.max(pct, 3) : 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Channels */}
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-base-content">Payment Channels</h2>
              <p className="text-xs text-base-content/60 mb-4">
                Cash, POS, Bank Transfer & HMO collections
              </p>

              <div className="space-y-3">
                {paymentChannels.map((ch) => {
                  const Icon = CHANNEL_ICON[ch.method] || FaMoneyBillWave;
                  return (
                    <div
                      key={ch.method}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-base-200/50 border border-base-200"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-base-content">{ch.label}</p>
                          <p className="text-xs text-base-content/60">{ch.count} transactions</p>
                        </div>
                      </div>
                      <p className="text-sm font-extrabold text-base-content">
                        {formatNaira(ch.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-base-200 flex items-center justify-between">
              <Link
                to="/accountant/inventory-balance"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                Balancing Drugs & Consumables <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Account Ledger (Money In & Expenses) */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-base-content">Recent Account Activity</h2>
              <p className="text-xs text-base-content/60">
                Latest incoming payments and hospital expenses
              </p>
            </div>
            <Link
              to="/accountant/ledger"
              className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
            >
              Open Full Cashbook <FaArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>Type</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Channel</th>
                  <th>Date</th>
                  <th className="text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledger.slice(0, 10).map((entry) => (
                  <tr key={`${entry.source}-${entry.id}`} className="hover">
                    <td>
                      {entry.type === "income" ? (
                        <span className="badge badge-success badge-sm gap-1 text-white">
                          <FaArrowDown className="w-2.5 h-2.5" /> In
                        </span>
                      ) : (
                        <span className="badge badge-error badge-sm gap-1 text-white">
                          <FaArrowUp className="w-2.5 h-2.5" /> Out
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-xs">{entry.reference}</td>
                    <td className="font-medium text-xs sm:text-sm">
                      {entry.patientId || entry.dependantId ? (
                        <Link
                          to={
                            entry.dependantId
                              ? `/accountant/patients/${entry.dependantId}?type=dependant`
                              : `/accountant/patients/${entry.patientId}`
                          }
                          className="text-primary hover:underline font-semibold"
                        >
                          {entry.title}
                        </Link>
                      ) : (
                        entry.title
                      )}
                    </td>
                    <td className="uppercase text-xs font-semibold">{entry.paymentMethod}</td>
                    <td className="text-xs text-base-content/70">
                      {formatNigeriaDateTime(entry.date)}
                    </td>
                    <td
                      className={`text-right font-bold ${
                        entry.type === "income" ? "text-success" : "text-error"
                      }`}
                    >
                      {entry.type === "income" ? "+" : "-"}
                      {formatNaira(entry.amount)}
                    </td>
                  </tr>
                ))}
                {ledger.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm text-base-content/50">
                      No account transactions found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AccountantLayout>
  );
};

export default AccountantDashboard;
