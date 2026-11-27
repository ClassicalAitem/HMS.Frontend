import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { PeriodFilterBar, formatNaira, exportToCsv, usePagination, PaginationBar } from "./accountantUtils";
import { FaArrowDown, FaArrowUp, FaSearch } from "react-icons/fa";
import toast from "react-hot-toast";

const AccountantLedger = () => {
  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'income' | 'expense'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ledger, setLedger] = useState([]);
  const [summary, setSummary] = useState({ totalMoneyIn: 0, totalExpenses: 0, netBalance: 0 });

  const loadLedger = useCallback(
    async (isManual = false) => {
      if (isManual || hasLoadedOnce) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await accountantAPI.getDashboard({
          period,
          ...(period === "custom" && startDate ? { startDate } : {}),
          ...(period === "custom" && endDate ? { endDate } : {}),
        });
        if (res?.data) {
          setLedger(res.data.ledger || []);
          setSummary(res.data.summary || { totalMoneyIn: 0, totalExpenses: 0, netBalance: 0 });
        }
        setHasLoadedOnce(true);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load account ledger");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, startDate, endDate, hasLoadedOnce]
  );

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  const filteredLedger = useMemo(() => {
    return ledger.filter((entry) => {
      if (typeFilter !== "all" && entry.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(entry.title || "").toLowerCase().includes(q) ||
          String(entry.reference || "").toLowerCase().includes(q) ||
          String(entry.category || "").toLowerCase().includes(q) ||
          String(entry.recordedBy || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [ledger, typeFilter, searchQuery]);

  const ledgerPagination = usePagination(filteredLedger, 15);

  const handleExportCsv = () => {
    exportToCsv(
      `account-cashbook-${period}.csv`,
      ["Type", "Reference", "Description", "Category", "Channel", "Recorded By", "Date", "Amount (NGN)"],
      filteredLedger.map((e) => [
        e.type === "income" ? "Money In" : "Expense",
        e.reference,
        e.title,
        e.category,
        e.paymentMethod?.toUpperCase(),
        e.recordedBy,
        formatNigeriaDateTime(e.date),
        e.type === "income" ? e.amount : -Math.abs(e.amount),
      ])
    );
    toast.success("Account cashbook exported to CSV");
  };

  return (
    <AccountantLayout>
      {loading && !hasLoadedOnce && <KolakLoader fullscreen text="Loading account cashbook..." />}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Account Cashbook & Ledger
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Unified ledger of every naira coming in and going out.
            </p>
          </div>
          <div className="flex flex-wrap gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-base-content/60 block">Money In</span>
              <span className="font-extrabold text-success">{formatNaira(summary.totalMoneyIn)}</span>
            </div>
            <div>
              <span className="text-base-content/60 block">Expenses</span>
              <span className="font-extrabold text-error">{formatNaira(summary.totalExpenses)}</span>
            </div>
            <div>
              <span className="text-base-content/60 block">Net Balance</span>
              <span className="font-extrabold text-primary">{formatNaira(summary.netBalance)}</span>
            </div>
          </div>
        </div>

        <PeriodFilterBar
          period={period}
          setPeriod={setPeriod}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onExportCsv={handleExportCsv}
          exportLabel="Export Cashbook CSV"
          onRefresh={() => loadLedger(true)}
          refreshing={refreshing}
        />

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <div className="flex gap-2">
            {["all", "income", "expense"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTypeFilter(t)}
                className={`btn btn-sm rounded-xl capitalize ${
                  typeFilter === t ? "btn-primary" : "btn-ghost bg-base-100 border border-base-200"
                }`}
              >
                {t === "all" ? "All Entries" : t === "income" ? "Money In" : "Expenses"}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search reference, title, staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
            />
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-xs uppercase text-base-content/60">
                <th>Flow</th>
                <th>Reference</th>
                <th>Description</th>
                <th>Category</th>
                <th>Channel</th>
                <th>Recorded By</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {ledgerPagination.paginatedItems.map((entry) => (
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
                  <td className="font-medium">
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
                  <td className="text-xs capitalize">{entry.category}</td>
                  <td>
                    <span className="badge badge-outline badge-sm uppercase font-semibold">
                      {entry.paymentMethod}
                    </span>
                  </td>
                  <td className="text-xs text-base-content/70">{entry.recordedBy}</td>
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
              {filteredLedger.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-sm text-base-content/50">
                    No ledger entries found for the selected filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            currentPage={ledgerPagination.currentPage}
            totalPages={ledgerPagination.totalPages}
            totalItems={ledgerPagination.totalItems}
            pageSize={ledgerPagination.pageSize}
            onPageChange={ledgerPagination.setCurrentPage}
            onPageSizeChange={ledgerPagination.setPageSize}
          />
        </div>
      </div>
    </AccountantLayout>
  );
};

export default AccountantLedger;
