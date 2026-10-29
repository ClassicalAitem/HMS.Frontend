/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaMoneyBillWave,
  FaSearch,
  FaFileExport,
  FaReceipt,
  FaCheckCircle,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaInfoCircle,
} from "react-icons/fa";
import { getAllBillings } from "@/services/api/billingAPI";
import { getAllReceipts } from "@/services/api/receiptAPI";
import { exportRowsToCsv, formatCurrency } from "../reports/adminReportUtils";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const Invoice = () => {
  const [billings, setBillings] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchFinanceData = async () => {
      setLoading(true);
      try {
        const [billRes, recRes] = await Promise.allSettled([
          getAllBillings(),
          getAllReceipts(),
        ]);

        if (!mounted) return;

        const billList = billRes.status === "fulfilled"
          ? (Array.isArray(billRes.value?.data) ? billRes.value.data : Array.isArray(billRes.value) ? billRes.value : [])
          : [];

        const recList = recRes.status === "fulfilled"
          ? (Array.isArray(recRes.value?.data) ? recRes.value.data : Array.isArray(recRes.value) ? recRes.value : [])
          : [];

        setBillings(billList);
        setReceipts(recList);
      } catch (err) {
        console.error("Error fetching billing records:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchFinanceData();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedInvoices = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return billings
      .map((bill, idx) => {
        const patient = bill.patient || bill.opdPatient || {};
        const total = Number(bill.totalAmount || bill.amount || 0);
        const paid = Number(bill.amountPaid || (bill.status === "paid" ? total : 0));
        const balance = Math.max(0, total - paid);
        const billStatus = bill.status || (balance === 0 ? "Paid" : paid > 0 ? "Partial" : "Pending");

        return {
          id: bill._id || bill.id || `bill-${idx}`,
          invoiceNo: bill.invoiceNumber || bill.billId || `INV-${idx + 1001}`,
          patientName:
            [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
            patient.fullName ||
            bill.patientName ||
            "Hospital Client",
          hospitalId: patient.hospitalId || "—",
          totalAmount: total,
          amountPaid: paid,
          balance,
          paymentMethod: bill.paymentMethod || "POS / Cash",
          date: bill.createdAt || bill.date || "",
          status: billStatus,
        };
      })
      .filter((row) => {
        const matchSearch =
          !term ||
          row.invoiceNo.toLowerCase().includes(term) ||
          row.patientName.toLowerCase().includes(term) ||
          row.hospitalId.toLowerCase().includes(term);

        if (!matchSearch) return false;

        if (statusFilter !== "all" && row.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        return true;
      });
  }, [billings, searchTerm, statusFilter]);

  const totalInvoicedSum = formattedInvoices.reduce((acc, b) => acc + b.totalAmount, 0);
  const totalCollectedSum = formattedInvoices.reduce((acc, b) => acc + b.amountPaid, 0);
  const totalOutstandingSum = formattedInvoices.reduce((acc, b) => acc + b.balance, 0);

  const totalRows = formattedInvoices.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return formattedInvoices.slice(start, start + itemsPerPage);
  }, [formattedInvoices, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "invoiceNo", label: "Invoice Number" },
      { key: "patientName", label: "Patient / Client" },
      { key: "hospitalId", label: "Hospital ID" },
      { key: "totalAmount", label: "Total Amount" },
      { key: "amountPaid", label: "Amount Paid" },
      { key: "balance", label: "Balance Outstanding" },
      { key: "paymentMethod", label: "Payment Channel" },
      { key: "date", label: "Invoice Date" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(formattedInvoices, columns, `invoices_expenses_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-success/10 text-success">
                Revenue & Invoices
              </span>
              <span className="text-xs text-base-content/60">Service Billings Ledger</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Expenses & Generated Invoices
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Live hospital financial records across patient admissions, pharmacy dispensations, procedures, and service charges.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!formattedInvoices.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Invoices</span>
          </button>
        </div>

        {/* Note on Salary Exclusion */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-base-100 border border-base-200 text-xs text-base-content/70">
          <FaInfoCircle className="w-4 h-4 text-primary shrink-0" />
          <span>
            <strong>Note on Payroll:</strong> As requested, staff salaries and payroll figures are excluded from this operational expense and billing overview.
          </span>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm">
            <span className="text-xs font-bold text-base-content/60 uppercase">Total Generated Invoices</span>
            <h3 className="text-3xl font-extrabold text-base-content mt-2">{billings.length}</h3>
            <p className="text-xs text-base-content/60 mt-1">Clinical & consultation invoices</p>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm">
            <span className="text-xs font-bold text-base-content/60 uppercase">Total Invoiced Amount</span>
            <h3 className="text-2xl font-extrabold text-primary mt-2 truncate">
              {formatCurrency(totalInvoicedSum)}
            </h3>
            <p className="text-xs text-base-content/60 mt-1">Gross hospital billings</p>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm">
            <span className="text-xs font-bold text-base-content/60 uppercase">Revenue Collected</span>
            <h3 className="text-2xl font-extrabold text-success mt-2 truncate">
              {formatCurrency(totalCollectedSum)}
            </h3>
            <p className="text-xs text-base-content/60 mt-1">Confirmed payments & receipts</p>
          </div>

          <div className="p-5 rounded-2xl bg-base-100 border border-base-200 shadow-sm">
            <span className="text-xs font-bold text-base-content/60 uppercase">Outstanding Balance</span>
            <h3 className="text-2xl font-extrabold text-error mt-2 truncate">
              {formatCurrency(totalOutstandingSum)}
            </h3>
            <p className="text-xs text-base-content/60 mt-1">Pending patient receivables</p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by invoice number, patient name, or hospital ID..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            {["all", "paid", "partial", "pending"].map((st) => (
              <button
                key={st}
                onClick={() => {
                  setStatusFilter(st);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  statusFilter === st
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading financial invoices...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Invoice No</th>
                    <th className="px-4">Patient Name</th>
                    <th className="px-4">Hospital ID</th>
                    <th className="px-4">Total Amount</th>
                    <th className="px-4">Amount Paid</th>
                    <th className="px-4">Balance</th>
                    <th className="px-4">Payment Method</th>
                    <th className="px-4">Date</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-base-content/50">
                        No invoices match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((inv, idx) => (
                      <tr key={inv.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-primary">{inv.invoiceNo}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{inv.patientName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-base-content/70">{inv.hospitalId}</td>
                        <td className="px-4 py-3 font-bold text-base-content">
                          {formatCurrency(inv.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-success font-semibold">
                          {formatCurrency(inv.amountPaid)}
                        </td>
                        <td className="px-4 py-3 text-error font-semibold">
                          {formatCurrency(inv.balance)}
                        </td>
                        <td className="px-4 py-3 text-xs text-base-content/80">{inv.paymentMethod}</td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {inv.date ? formatNigeriaDate(inv.date) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              inv.status.toLowerCase() === "paid"
                                ? "bg-success/10 text-success"
                                : inv.status.toLowerCase() === "partial"
                                ? "bg-warning/10 text-warning"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-base-200 bg-base-100">
              <span className="text-xs text-base-content/60">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalRows)} of {totalRows}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-40 transition-colors"
                >
                  <FaChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold px-3 py-1.5 bg-base-200 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-40 transition-colors"
                >
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Invoice;
