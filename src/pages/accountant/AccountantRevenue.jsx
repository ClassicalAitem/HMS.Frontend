import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { PeriodFilterBar, formatNaira, exportToCsv, usePagination, PaginationBar } from "./accountantUtils";
import { FaPlus, FaSearch, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const AccountantRevenue = () => {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState("streams"); // 'streams' | 'channels' | 'bills'
  const [channelFilter, setChannelFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    revenueStreams: [],
    paymentChannels: [],
    ledger: [],
  });
  const [individualBills, setIndividualBills] = useState([]);

  // Direct Income Modal
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [incomeForm, setIncomeForm] = useState({
    title: "",
    stream: "hmo",
    amount: "",
    paymentMethod: "transfer",
    payerName: "",
    notes: "",
    receivedAt: new Date().toISOString().slice(0, 10),
  });

  const loadData = useCallback(
    async (isManual = false) => {
      if (isManual || hasLoadedOnce) setRefreshing(true);
      else setLoading(true);
      try {
        const params = {
          period,
          ...(period === "custom" && startDate ? { startDate } : {}),
          ...(period === "custom" && endDate ? { endDate } : {}),
        };
        const [dashRes, billsRes] = await Promise.all([
          accountantAPI.getDashboard(params),
          accountantAPI.getIndividualBills(params),
        ]);
        if (dashRes?.data) setDashboardData(dashRes.data);
        if (Array.isArray(billsRes?.data)) setIndividualBills(billsRes.data);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load revenue & channel records");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, startDate, endDate, hasLoadedOnce]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const incomeTransactions = useMemo(() => {
    return (dashboardData.ledger || []).filter((item) => {
      if (item.type !== "income") return false;
      if (channelFilter !== "all" && item.paymentMethod !== channelFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(item.title || "").toLowerCase().includes(q) ||
          String(item.reference || "").toLowerCase().includes(q) ||
          String(item.category || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [dashboardData.ledger, channelFilter, searchQuery]);

  const filteredBills = useMemo(() => {
    if (!searchQuery.trim()) return individualBills;
    const q = searchQuery.toLowerCase();
    return individualBills.filter(
      (b) =>
        String(b.patientName || "").toLowerCase().includes(q) ||
        String(b.hospitalId || "").toLowerCase().includes(q) ||
        String(b.itemsSummary || "").toLowerCase().includes(q)
    );
  }, [individualBills, searchQuery]);

  const channelsPagination = usePagination(incomeTransactions, 15);
  const billsPagination = usePagination(filteredBills, 15);

  const handleExportCsv = () => {
    if (activeTab === "streams") {
      exportToCsv(
        `revenue-streams-${period}.csv`,
        ["Revenue Stream", "Transactions", "Amount (NGN)"],
        dashboardData.revenueStreams.map((s) => [s.label, s.count, s.amount])
      );
    } else if (activeTab === "channels") {
      exportToCsv(
        `payment-channels-${period}.csv`,
        ["Reference", "Title", "Category", "Channel", "Date", "Recorded By", "Amount (NGN)"],
        incomeTransactions.map((t) => [
          t.reference,
          t.title,
          t.category,
          t.paymentMethod?.toUpperCase(),
          formatNigeriaDateTime(t.date),
          t.recordedBy,
          t.amount,
        ])
      );
    } else {
      exportToCsv(
        `individual-patient-bills-${period}.csv`,
        ["Patient", "Hospital ID", "Items", "Total Bill", "Discount", "Amount Paid", "Outstanding", "Status", "Date"],
        filteredBills.map((b) => [
          b.patientName,
          b.hospitalId,
          b.itemsSummary,
          b.totalAmount,
          b.discountAmount,
          b.amountPaid,
          b.outstandingBill,
          b.isCleared ? "Cleared" : "Outstanding",
          formatNigeriaDateTime(b.createdAt),
        ])
      );
    }
    toast.success("Exported CSV successfully");
  };

  const handleCreateIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.title || Number(incomeForm.amount) <= 0) {
      toast.error("Please enter a valid title and amount");
      return;
    }
    setSubmitting(true);
    try {
      await accountantAPI.createDirectIncome({
        ...incomeForm,
        amount: Number(incomeForm.amount),
      });
      toast.success("Money-in entry recorded in account");
      setShowIncomeModal(false);
      setIncomeForm({
        title: "",
        stream: "hmo",
        amount: "",
        paymentMethod: "transfer",
        payerName: "",
        notes: "",
        receivedAt: new Date().toISOString().slice(0, 10),
      });
      loadData(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to record income");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AccountantLayout>
      {loading && !hasLoadedOnce && <KolakLoader fullscreen text="Loading revenue streams..." />}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Revenue Streams & Payment Channels
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Track all 11 hospital revenue streams, Cash / POS / Transfer / HMO channels, and individual patient bills.
            </p>
          </div>
          <button
            onClick={() => setShowIncomeModal(true)}
            className="btn btn-primary btn-sm rounded-xl gap-2"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Record Direct Income
          </button>
        </div>

        <PeriodFilterBar
          period={period}
          setPeriod={setPeriod}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onExportCsv={handleExportCsv}
          exportLabel="Export CSV"
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
        />

        {/* Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="tabs tabs-boxed bg-base-100 border border-base-200 p-1 rounded-xl">
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                activeTab === "streams" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setActiveTab("streams")}
            >
              11 Revenue Streams
            </button>
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                activeTab === "channels" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setActiveTab("channels")}
            >
              Payment Channels (Cash / POS / Transfer)
            </button>
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                activeTab === "bills" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setActiveTab("bills")}
            >
              Individual Patient Bills ({individualBills.length})
            </button>
          </div>

          {activeTab !== "streams" && (
            <div className="relative w-full sm:w-72">
              <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search patient, ref, or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
              />
            </div>
          )}
        </div>

        {/* Tab 1: 11 Revenue Streams */}
        {activeTab === "streams" && (
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
            <table className="table w-full">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>#</th>
                  <th>Revenue Stream</th>
                  <th className="text-center">Transactions</th>
                  <th className="text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.revenueStreams.map((stream, idx) => (
                  <tr key={stream.key} className="hover">
                    <td className="font-mono text-xs text-base-content/60">{idx + 1}</td>
                    <td className="font-semibold text-base-content">{stream.label}</td>
                    <td className="text-center">
                      <span className="badge badge-ghost badge-sm">{stream.count}</span>
                    </td>
                    <td className="text-right font-extrabold text-base-content">
                      {formatNaira(stream.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Payment Channels */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashboardData.paymentChannels.map((ch) => (
                <button
                  key={ch.method}
                  type="button"
                  onClick={() =>
                    setChannelFilter(channelFilter === ch.method ? "all" : ch.method)
                  }
                  className={`text-left p-4 rounded-2xl border transition-all ${
                    channelFilter === ch.method
                      ? "bg-primary/10 border-primary shadow-sm"
                      : "bg-base-100 border-base-200 hover:border-primary/40"
                  }`}
                >
                  <p className="text-xs font-semibold uppercase text-base-content/60">
                    {ch.label}
                  </p>
                  <p className="text-xl font-extrabold text-base-content mt-1">
                    {formatNaira(ch.amount)}
                  </p>
                  <p className="text-xs text-base-content/60 mt-1">
                    {ch.count} transactions {channelFilter === ch.method ? "(Filtered)" : ""}
                  </p>
                </button>
              ))}
            </div>

            <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
              <table className="table table-sm w-full">
                <thead>
                  <tr className="text-xs uppercase text-base-content/60">
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Stream / Category</th>
                    <th>Channel</th>
                    <th>Recorded By</th>
                    <th>Date</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {channelsPagination.paginatedItems.map((t) => (
                    <tr key={`${t.source}-${t.id}`} className="hover">
                      <td className="font-mono text-xs">{t.reference}</td>
                      <td className="font-medium">
                        {t.patientId || t.dependantId ? (
                          <Link
                            to={
                              t.dependantId
                                ? `/accountant/patients/${t.dependantId}?type=dependant`
                                : `/accountant/patients/${t.patientId}`
                            }
                            className="text-primary hover:underline font-semibold"
                          >
                            {t.title}
                          </Link>
                        ) : (
                          t.title
                        )}
                      </td>
                      <td className="text-xs capitalize">{t.category}</td>
                      <td>
                        <span className="badge badge-outline badge-sm uppercase font-semibold">
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td className="text-xs text-base-content/70">{t.recordedBy}</td>
                      <td className="text-xs text-base-content/70">
                        {formatNigeriaDateTime(t.date)}
                      </td>
                      <td className="text-right font-bold text-success">
                        {formatNaira(t.amount)}
                      </td>
                    </tr>
                  ))}
                  {incomeTransactions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-sm text-base-content/50">
                        No incoming payments match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <PaginationBar
                currentPage={channelsPagination.currentPage}
                totalPages={channelsPagination.totalPages}
                totalItems={channelsPagination.totalItems}
                pageSize={channelsPagination.pageSize}
                onPageChange={channelsPagination.setCurrentPage}
                onPageSizeChange={channelsPagination.setPageSize}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Individual Patient Bills */}
        {activeTab === "bills" && (
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>Patient</th>
                  <th>Hospital ID</th>
                  <th>Billed Items</th>
                  <th className="text-right">Total Bill</th>
                  <th className="text-right">Paid</th>
                  <th className="text-right">Outstanding</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {billsPagination.paginatedItems.map((b) => (
                  <tr key={b.id} className="hover">
                    <td className="font-semibold">
                      {b.patientId || b.dependantId ? (
                        <Link
                          to={
                            b.dependantId
                              ? `/accountant/patients/${b.dependantId}?type=dependant`
                              : `/accountant/patients/${b.patientId}`
                          }
                          className="text-primary hover:underline"
                        >
                          {b.patientName}
                        </Link>
                      ) : (
                        b.patientName
                      )}
                    </td>
                    <td className="font-mono text-xs">{b.hospitalId}</td>
                    <td className="text-xs max-w-xs truncate" title={b.itemsSummary}>
                      {b.itemsSummary || `${b.itemsCount} item(s)`}
                    </td>
                    <td className="text-right font-medium">{formatNaira(b.totalAmount)}</td>
                    <td className="text-right font-bold text-success">
                      {formatNaira(b.amountPaid)}
                    </td>
                    <td className="text-right font-bold text-error">
                      {formatNaira(b.outstandingBill)}
                    </td>
                    <td>
                      <span
                        className={`badge badge-sm ${
                          b.isCleared ? "badge-success text-white" : "badge-warning"
                        }`}
                      >
                        {b.isCleared ? "Cleared" : "Pending"}
                      </span>
                    </td>
                    <td className="text-xs text-base-content/70">
                      {formatNigeriaDateTime(b.createdAt)}
                    </td>
                  </tr>
                ))}
                {filteredBills.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-sm text-base-content/50">
                      No patient bills found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationBar
              currentPage={billsPagination.currentPage}
              totalPages={billsPagination.totalPages}
              totalItems={billsPagination.totalItems}
              pageSize={billsPagination.pageSize}
              onPageChange={billsPagination.setCurrentPage}
              onPageSizeChange={billsPagination.setPageSize}
            />
          </div>
        )}
      </div>

      {/* Record Direct Income Modal */}
      {showIncomeModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Record Direct Account Income</h3>
              <button
                type="button"
                onClick={() => setShowIncomeModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreateIncome} className="space-y-3">
              <div>
                <label className="label text-xs font-semibold">Title / Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HMO Monthly Retainership Settlement"
                  value={incomeForm.title}
                  onChange={(e) => setIncomeForm({ ...incomeForm, title: e.target.value })}
                  className="input input-bordered input-sm w-full rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold">Revenue Stream</label>
                  <select
                    value={incomeForm.stream}
                    onChange={(e) => setIncomeForm({ ...incomeForm, stream: e.target.value })}
                    className="select select-bordered select-sm w-full rounded-xl"
                  >
                    {dashboardData.revenueStreams.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-semibold">Payment Channel</label>
                  <select
                    value={incomeForm.paymentMethod}
                    onChange={(e) =>
                      setIncomeForm({ ...incomeForm, paymentMethod: e.target.value })
                    }
                    className="select select-bordered select-sm w-full rounded-xl"
                  >
                    <option value="cash">Cash</option>
                    <option value="pos">POS</option>
                    <option value="transfer">Bank Transfer</option>
                    <option value="hmo">HMO</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold">Amount (NGN) *</label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    required
                    value={incomeForm.amount}
                    onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Date Received</label>
                  <input
                    type="date"
                    value={incomeForm.receivedAt}
                    onChange={(e) => setIncomeForm({ ...incomeForm, receivedAt: e.target.value })}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs font-semibold">Payer / Organization</label>
                <input
                  type="text"
                  placeholder="Optional payer or HMO name"
                  value={incomeForm.payerName}
                  onChange={(e) => setIncomeForm({ ...incomeForm, payerName: e.target.value })}
                  className="input input-bordered input-sm w-full rounded-xl"
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowIncomeModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm rounded-xl"
                >
                  {submitting ? "Saving..." : "Save Income"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AccountantLayout>
  );
};

export default AccountantRevenue;
