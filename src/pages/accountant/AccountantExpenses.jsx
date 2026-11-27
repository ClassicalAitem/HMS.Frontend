import React, { useState, useEffect, useCallback, useMemo } from "react";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import { useAppSelector } from "@/store/hooks";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { PeriodFilterBar, formatNaira, exportToCsv, usePagination, PaginationBar } from "./accountantUtils";
import { FaPlus, FaEye, FaSearch, FaTimes } from "react-icons/fa";
import toast from "react-hot-toast";

const EXPENSE_CATEGORIES = [
  { value: "drugs_consumables", label: "Drugs & Consumables" },
  { value: "laboratory", label: "Laboratory Supplies" },
  { value: "salaries_wages", label: "Salaries & Wages" },
  { value: "utilities", label: "Utilities & Power" },
  { value: "equipment_maintenance", label: "Equipment Maintenance" },
  { value: "ambulance_fuel", label: "Ambulance & Fuel" },
  { value: "administrative", label: "Administrative" },
  { value: "other", label: "Other Expenses" },
];

const AccountantExpenses = () => {
  const { user } = useAppSelector((state) => state.auth);
  const accountantName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Accountant"
    : "Accountant";

  const [period, setPeriod] = useState("month");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "drugs_consumables",
    amount: "",
    paymentMethod: "cash",
    vendor: "",
    description: "",
    expenseDate: new Date().toISOString().slice(0, 10),
  });

  const loadExpenses = useCallback(
    async (isManual = false) => {
      if (isManual || hasLoadedOnce) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await accountantAPI.getExpenses({
          period,
          ...(period === "custom" && startDate ? { startDate } : {}),
          ...(period === "custom" && endDate ? { endDate } : {}),
        });
        setExpenses(Array.isArray(res?.data) ? res.data : []);
        setHasLoadedOnce(true);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load expenses");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period, startDate, endDate, hasLoadedOnce]
  );

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          String(e.title || "").toLowerCase().includes(q) ||
          String(e.reference || "").toLowerCase().includes(q) ||
          String(e.vendor || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [expenses, categoryFilter, searchQuery]);

  const expensesPagination = usePagination(filteredExpenses, 15);

  const totalAmount = useMemo(
    () =>
      filteredExpenses
        .filter((e) => e.status !== "voided")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0),
    [filteredExpenses]
  );

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.title || Number(form.amount) <= 0) {
      toast.error("Please provide a valid title and amount");
      return;
    }
    setSubmitting(true);
    try {
      await accountantAPI.createExpense({
        ...form,
        amount: Number(form.amount),
      });
      toast.success("Expense recorded");
      setShowModal(false);
      setForm({
        title: "",
        category: "drugs_consumables",
        amount: "",
        paymentMethod: "cash",
        vendor: "",
        description: "",
        expenseDate: new Date().toISOString().slice(0, 10),
      });
      loadExpenses(true);
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to record expense");
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      `hospital-expenses-${period}.csv`,
      ["Reference", "Title", "Category", "Vendor", "Channel", "Date", "Recorded By", "Amount (NGN)"],
      filteredExpenses.map((e) => [
        e.reference,
        e.title,
        e.category,
        e.vendor || "",
        e.paymentMethod?.toUpperCase(),
        formatNigeriaDateTime(e.expenseDate || e.createdAt),
        e.recordedByName || "",
        e.amount,
      ])
    );
    toast.success("Expenses exported to CSV");
  };

  return (
    <AccountantLayout>
      {loading && !hasLoadedOnce && <KolakLoader fullscreen text="Loading hospital expenses..." />}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Hospital Expenses
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Record and audit all hospital expenditure — Total in view:{" "}
              <span className="font-bold text-error">{formatNaira(totalAmount)}</span>
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary btn-sm rounded-xl gap-2"
          >
            <FaPlus className="w-3.5 h-3.5" />
            Record Expense
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
          exportLabel="Export Expenses CSV"
          onRefresh={() => loadExpenses(true)}
          refreshing={refreshing}
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="select select-bordered select-sm rounded-xl bg-base-100 w-full sm:w-64"
          >
            <option value="all">All Expense Categories</option>
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="relative w-full sm:w-72">
            <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search expense, ref, vendor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-xs uppercase text-base-content/60">
                <th>Reference</th>
                <th>Title</th>
                <th>Category</th>
                <th>Vendor</th>
                <th>Channel</th>
                <th>Date</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {expensesPagination.paginatedItems.map((e) => (
                <tr key={e.id} className="hover">
                  <td className="font-mono text-xs">{e.reference}</td>
                  <td>
                    <p className="font-semibold">{e.title}</p>
                    {e.description && (
                      <p className="text-xs text-base-content/60 truncate max-w-xs">
                        {e.description}
                      </p>
                    )}
                  </td>
                  <td className="text-xs">
                    {EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category}
                  </td>
                  <td className="text-xs">{e.vendor || "—"}</td>
                  <td>
                    <span className="badge badge-outline badge-sm uppercase font-semibold">
                      {e.paymentMethod}
                    </span>
                  </td>
                  <td className="text-xs text-base-content/70">
                    {formatNigeriaDateTime(e.expenseDate || e.createdAt)}
                  </td>
                  <td className="text-right font-bold text-error">{formatNaira(e.amount)}</td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedExpense(e)}
                      className="btn btn-ghost btn-xs text-primary gap-1"
                      title="View full expense details"
                    >
                      <FaEye className="w-3.5 h-3.5" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-sm text-base-content/50">
                    No expenses recorded for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            currentPage={expensesPagination.currentPage}
            totalPages={expensesPagination.totalPages}
            totalItems={expensesPagination.totalItems}
            pageSize={expensesPagination.pageSize}
            onPageChange={expensesPagination.setCurrentPage}
            onPageSizeChange={expensesPagination.setPageSize}
          />
        </div>
      </div>

      {/* Expense Details Modal */}
      {selectedExpense && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-lg">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-base-200">
              <div>
                <h3 className="text-lg font-bold">Expense Details</h3>
                <p className="font-mono text-xs text-base-content/60">
                  {selectedExpense.reference}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="bg-error/10 border border-error/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase text-base-content/60">Title</p>
                  <p className="font-bold text-base text-base-content mt-0.5">
                    {selectedExpense.title}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold uppercase text-base-content/60">Amount</p>
                  <p className="text-xl font-extrabold text-error mt-0.5">
                    {formatNaira(selectedExpense.amount)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-base-200/50">
                  <p className="text-xs text-base-content/60">Category</p>
                  <p className="font-semibold mt-0.5">
                    {EXPENSE_CATEGORIES.find((c) => c.value === selectedExpense.category)?.label ||
                      selectedExpense.category}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-base-200/50">
                  <p className="text-xs text-base-content/60">Payment Channel</p>
                  <p className="font-semibold uppercase mt-0.5">
                    {selectedExpense.paymentMethod || "—"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-base-200/50">
                  <p className="text-xs text-base-content/60">Payee / Recorded By</p>
                  <p className="font-semibold mt-0.5">
                    {selectedExpense.vendor || selectedExpense.recordedByName || "Accountant"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-base-200/50">
                  <p className="text-xs text-base-content/60">Status</p>
                  <p className="font-semibold capitalize mt-0.5">
                    {selectedExpense.status || "approved"}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-base-200/50">
                  <p className="text-xs text-base-content/60">Expense Date</p>
                  <p className="font-semibold mt-0.5">
                    {formatNigeriaDateTime(selectedExpense.expenseDate || selectedExpense.createdAt)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-base-200/50">
                  <p className="text-xs text-base-content/60">Recorded At</p>
                  <p className="font-semibold mt-0.5">
                    {formatNigeriaDateTime(selectedExpense.createdAt)}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-base-200/50">
                <p className="text-xs text-base-content/60 mb-1">Notes / Description</p>
                <p className="text-sm text-base-content whitespace-pre-wrap">
                  {selectedExpense.description || "No additional notes provided."}
                </p>
              </div>
            </div>

            <div className="modal-action">
              <button
                type="button"
                onClick={() => setSelectedExpense(null)}
                className="btn btn-primary btn-sm rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showModal && (
        <div className="modal modal-open">
          <div className="modal-box rounded-2xl max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Record New Expense</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="label text-xs font-semibold">Expense Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Generator Diesel 500L"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="input input-bordered input-sm w-full rounded-xl"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="select select-bordered select-sm w-full rounded-xl"
                  >
                    {EXPENSE_CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label text-xs font-semibold">Payment Channel</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="select select-bordered select-sm w-full rounded-xl"
                  >
                    <option value="cash">Cash</option>
                    <option value="pos">POS</option>
                    <option value="transfer">Bank Transfer</option>
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
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold">Expense Date</label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="label text-xs font-semibold">Payee (Accountant)</label>
                <input
                  type="text"
                  value={accountantName}
                  readOnly
                  disabled
                  className="input input-bordered input-sm w-full rounded-xl bg-base-200 text-base-content/80 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="label text-xs font-semibold">Notes</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="textarea textarea-bordered textarea-sm w-full rounded-xl"
                />
              </div>
              <div className="modal-action">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-sm rounded-xl"
                >
                  {submitting ? "Saving..." : "Save Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AccountantLayout>
  );
};

export default AccountantExpenses;
