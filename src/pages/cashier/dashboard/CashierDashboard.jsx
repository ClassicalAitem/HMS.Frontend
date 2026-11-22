import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CashierLayout } from "@/layouts/cashier";
import {
  FaUsers,
  FaFileInvoiceDollar,
  FaArrowRight,
  FaSearch,
  FaTimes,
  FaCreditCard,
  FaMoneyBillWave,
  FaClock,
  FaCheckCircle,
  FaExternalLinkAlt,
  FaReceipt
} from "react-icons/fa";
import { RiRefreshLine, RiHandCoinLine } from "react-icons/ri";
import { MdOutlinePayments } from "react-icons/md";
import { useAppSelector } from "@/store/hooks";
import { getAllBillings, getAllReceipts } from "@/services/api/billingAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { normalizeStatus } from "@/utils/statusUtils";
import { formatNigeriaDateTime, formatNigeriaDate, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";
import { EmptyState } from "@/components/common";

const isToday = (dateValue) => {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const CashierDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [awaitingQueue, setAwaitingQueue] = useState([]);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [allBillings, setAllBillings] = useState([]);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "recent_receipts"
  const [searchQuery, setSearchQuery] = useState("");

  const fetchDashboardData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [patientsRes, dependantsRes, receiptsRes, billingsRes] = await Promise.allSettled([
        getPatients({ status: "awaiting_cashier", limit: 200 }),
        getDependants({ status: "awaiting_cashier", limit: 200 }),
        getAllReceipts({ limit: 150, sort: "createdAt:desc" }),
        getAllBillings({ limit: 150 }),
      ]);

      // 1. Queue Patients & Dependants
      const rawPatients = patientsRes.status === "fulfilled"
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : patientsRes.value?.data?.data ?? [])
        : [];
      const queuePatients = rawPatients
        .filter((p) => normalizeStatus(p?.status) === PATIENT_STATUS.AWAITING_CASHIER)
        .map((p) => ({
          id: p.id || p._id,
          patientId: p.id || p._id,
          dependantId: null,
          type: "patient",
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown",
          displayId: p.hospitalId || p.id || "—",
          gender: p.gender || "",
          phone: p.phone || p.phoneNumber || "—",
          updatedAt: p.updatedAt || p.createdAt,
          snapshot: p,
        }));

      const rawDependants = dependantsRes.status === "fulfilled"
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
            return Array.isArray(raw) ? raw : raw?.dependants ?? [];
          })()
        : [];
      const queueDependants = rawDependants
        .filter((d) => normalizeStatus(d?.status) === PATIENT_STATUS.AWAITING_CASHIER)
        .map((d) => ({
          id: d.id || d._id,
          patientId: d.patientId,
          dependantId: d.id || d._id,
          type: "dependant",
          relationshipType: d.relationshipType || "Dependant",
          name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Dependant",
          displayId: d.patient?.hospitalId || "—",
          gender: d.gender || "",
          phone: d.phone || d.phoneNumber || "—",
          updatedAt: d.updatedAt || d.createdAt,
          snapshot: d,
        }));

      const fullQueue = [...queuePatients, ...queueDependants].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      setAwaitingQueue(fullQueue);

      // 2. Receipts Data
      if (receiptsRes.status === "fulfilled") {
        const rawReceipts = receiptsRes.value?.data?.data ?? receiptsRes.value?.data ?? [];
        const rList = Array.isArray(rawReceipts) ? rawReceipts : [];
        setRecentReceipts(rList);
      }

      // 3. Billings Data
      if (billingsRes.status === "fulfilled") {
        const rawBills = billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [];
        const bList = Array.isArray(rawBills) ? rawBills : [];
        setAllBillings(bList);
      }
    } catch (err) {
      console.error("CashierDashboard: fetch error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let todayRevenue = 0;
    let todayReceiptsCount = 0;

    recentReceipts.forEach((r) => {
      const amount = Number(r.amountPaid || 0);
      const isPaid = !r.status || r.status.toLowerCase() === "paid" || r.status.toLowerCase() === "completed";
      if (isPaid) {
        totalRevenue += amount;
        if (isToday(r.paidAt || r.createdAt)) {
          todayRevenue += amount;
          todayReceiptsCount += 1;
        }
      }
    });

    let totalPendingBillsCount = 0;
    let totalOutstandingAmount = 0;
    allBillings.forEach((b) => {
      const outstanding = Number(b.outstandingBill || 0);
      if (outstanding > 0) {
        totalPendingBillsCount += 1;
        totalOutstandingAmount += outstanding;
      }
    });

    return {
      queueCount: awaitingQueue.length,
      totalRevenue,
      todayRevenue,
      todayReceiptsCount,
      totalPendingBillsCount,
      totalOutstandingAmount,
    };
  }, [awaitingQueue, recentReceipts, allBillings]);

  // Payment methods breakdown
  const paymentMethods = useMemo(() => {
    const counts = { cash: 0, pos: 0, transfer: 0, hmo: 0, other: 0 };
    recentReceipts.forEach((r) => {
      const method = String(r.paymentMethod || "").toLowerCase().trim();
      if (method.includes("cash")) counts.cash += 1;
      else if (method.includes("pos") || method.includes("card")) counts.pos += 1;
      else if (method.includes("transfer") || method.includes("bank")) counts.transfer += 1;
      else if (method.includes("hmo")) counts.hmo += 1;
      else counts.other += 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
    return [
      { name: "POS / Card", count: counts.pos, percent: Math.round((counts.pos / total) * 100), color: "bg-info" },
      { name: "Transfer", count: counts.transfer, percent: Math.round((counts.transfer / total) * 100), color: "bg-success" },
      { name: "Cash", count: counts.cash, percent: Math.round((counts.cash / total) * 100), color: "bg-primary" },
      { name: "HMO Covered", count: counts.hmo, percent: Math.round((counts.hmo / total) * 100), color: "bg-warning" },
    ];
  }, [recentReceipts]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return awaitingQueue;
    return awaitingQueue.filter((item) =>
      [item.name, item.displayId, item.phone].filter(Boolean).join(" ").toLowerCase().includes(q)
    );
  }, [awaitingQueue, searchQuery]);

  // Filtered Receipts for the tab
  const filteredReceipts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = recentReceipts.map((r) => {
      const patient = r.billing?.patient;
      const opd = r.billing?.opdPatient;
      const patientName = patient
        ? `${patient.firstName || ""} ${patient.lastName || ""}`.trim()
        : opd
          ? opd.fullName || `${opd.firstName || ""} ${opd.lastName || ""}`.trim()
          : r.paidBy || "Patient";

      const hospitalId = patient?.hospitalId || opd?.opdId || "—";

      return {
        id: r.id || r._id,
        reference: r.reference || r.receiptNumber || `RCP-${String(r.id || "").slice(-6)}`,
        patientName,
        hospitalId,
        paymentMethod: r.paymentMethod || "Cash",
        amountPaid: Number(r.amountPaid || 0),
        status: r.status || "paid",
        date: r.paidAt || r.createdAt,
      };
    });

    if (!q) return list.slice(0, 10);
    return list
      .filter((r) =>
        [r.patientName, r.hospitalId, r.reference, r.paymentMethod]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
  }, [recentReceipts, searchQuery]);

  const handleProcessPatient = (item) => {
    const id = item?.patientId || item?.id;
    if (!id) return;
    navigate(`/cashier/patient-details/${id}`, {
      state: {
        from: "incoming",
        patientSnapshot: item.type === "dependant" ? null : item?.snapshot,
        dependantId: item.dependantId,
        dependantSnapshot: item.type === "dependant" ? item?.snapshot : null,
      },
    });
  };

  return (
    <CashierLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">

          {/* WELCOME HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#00943C]/10 text-[#00943C] shadow-xs">
                <MdOutlinePayments size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                    Welcome, <span className="text-primary">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Cashier"}</span>
                  </h1>
                  <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">Hospital Cashier</span>
                </div>
                <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                  Process patient invoices, issue official receipts, and manage hospital accounts
                </p>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
                title="Refresh financial records"
              >
                <RiRefreshLine className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <Link
                to="/cashier/incoming"
                className="btn btn-primary btn-sm gap-2 font-bold shadow-xs relative"
              >
                <RiHandCoinLine className="w-4 h-4" />
                <span className="text-xs">Process Incoming</span>
                {stats.queueCount > 0 && (
                  <span className="badge badge-error badge-xs text-white font-extrabold px-1.5 py-0.5">
                    {stats.queueCount}
                  </span>
                )}
              </Link>

              <Link
                to="/cashier/billing-records"
                className="btn btn-outline border-base-300 hover:border-base-content hover:bg-base-200 btn-sm gap-1.5"
              >
                <FaFileInvoiceDollar className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Billing Records</span>
              </Link>

              <Link
                to="/cashier/receipt-records"
                className="btn btn-outline border-base-300 hover:border-base-content hover:bg-base-200 btn-sm gap-1.5"
              >
                <FaReceipt className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Receipts</span>
              </Link>
            </div>
          </div>

          {/* TOP 4 VIBRANT FINANCIAL KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Card 1: Awaiting Cashier Queue */}
            <div
              onClick={() => setActiveTab("queue")}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === "queue"
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Awaiting Cashier</span>
                  <div className="text-3xl font-black text-primary mt-1">
                    {stats.queueCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FaClock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Patients in payment queue</span>
                {stats.queueCount > 0 ? (
                  <span className="badge badge-warning badge-xs font-bold">Action Needed</span>
                ) : (
                  <span className="badge badge-success badge-xs text-white font-bold">Cleared</span>
                )}
              </div>
            </div>

            {/* Card 2: Today's Revenue Collected */}
            <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Today's Revenue</span>
                  <div className="text-2xl sm:text-3xl font-black text-success mt-1 truncate">
                    ₦{stats.todayRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-success/10 text-success flex-shrink-0">
                  <FaMoneyBillWave className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>{stats.todayReceiptsCount} receipts issued today</span>
                <span className="badge badge-success badge-xs text-white font-bold">Today</span>
              </div>
            </div>

            {/* Card 3: Pending Invoices / Outstanding */}
            <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Pending Invoices</span>
                  <div className="text-3xl font-black text-warning mt-1">
                    {stats.totalPendingBillsCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-warning/10 text-warning flex-shrink-0">
                  <FaCreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span className="truncate">₦{stats.totalOutstandingAmount.toLocaleString()} unpaid</span>
                <span className="badge badge-warning badge-xs font-bold">Unpaid</span>
              </div>
            </div>

            {/* Card 4: Total Revenue Recorded */}
            <div
              onClick={() => setActiveTab("recent_receipts")}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === "recent_receipts"
                  ? "border-info ring-2 ring-info/20 bg-info/5"
                  : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Total Revenue</span>
                  <div className="text-2xl sm:text-3xl font-black text-info mt-1 truncate">
                    ₦{stats.totalRevenue.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-info/10 text-info flex-shrink-0">
                  <FaFileInvoiceDollar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>{recentReceipts.length} total transactions</span>
                {activeTab === "recent_receipts" && (
                  <span className="badge badge-info badge-xs text-white font-bold">Active</span>
                )}
              </div>
            </div>
          </div>

          {/* MAIN SECTION: 2-COLUMN GRID (8 COLS / 4 COLS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT COLUMN: LIVE QUEUE & RECENT PAYMENTS (8 COLS) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden">
                
                {/* TOOLBAR & TAB SWITCHER */}
                <div className="p-4 sm:p-5 border-b border-base-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-base-100">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab("queue")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "queue"
                          ? "bg-primary text-primary-content shadow-xs"
                          : "bg-base-200 text-base-content/70 hover:text-base-content hover:bg-base-300"
                      }`}
                    >
                      <FaClock className="w-3.5 h-3.5" />
                      <span>Payment Queue</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        activeTab === "queue" ? "bg-primary-content/20 text-primary-content" : "bg-base-300 text-base-content/70"
                      }`}>
                        {awaitingQueue.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("recent_receipts")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "recent_receipts"
                          ? "bg-primary text-primary-content shadow-xs"
                          : "bg-base-200 text-base-content/70 hover:text-base-content hover:bg-base-300"
                      }`}
                    >
                      <FaReceipt className="w-3.5 h-3.5" />
                      <span>Recent Payments</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        activeTab === "recent_receipts" ? "bg-primary-content/20 text-primary-content" : "bg-base-300 text-base-content/70"
                      }`}>
                        {recentReceipts.length}
                      </span>
                    </button>
                  </div>

                  {/* Quick Search */}
                  <div className="relative w-full sm:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3 h-3" />
                    <input
                      type="text"
                      placeholder="Search patient, ID, receipt..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input input-xs input-bordered w-full pl-8 pr-7 text-xs rounded-xl"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                      >
                        <FaTimes className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* TAB 1: AWAITING PAYMENT QUEUE */}
                {activeTab === "queue" && (
                  <div>
                    {filteredQueue.length === 0 ? (
                      <div className="py-14">
                        <EmptyState
                          title="No patients waiting for payment"
                          description={
                            searchQuery
                              ? `No patients match "${searchQuery}" in the queue.`
                              : "All pending patient payments have been cleared! The cashier queue is empty."
                          }
                          actionLabel={searchQuery ? "Clear Search" : "Refresh"}
                          onAction={searchQuery ? () => setSearchQuery("") : () => fetchDashboardData(true)}
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-base-200">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                          <div className="col-span-1">#</div>
                          <div className="col-span-4">Patient Profile</div>
                          <div className="col-span-3">Hospital ID</div>
                          <div className="col-span-2">Queued At</div>
                          <div className="col-span-2 text-right">Action</div>
                        </div>

                        {filteredQueue.map((item, idx) => {
                          const initial = (item.name || "P")[0].toUpperCase();
                          return (
                            <div
                              key={item.id}
                              className="p-4 md:px-5 md:py-3.5 hover:bg-base-200/40 transition-colors"
                            >
                              {/* Desktop Row */}
                              <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                                <div className="col-span-1 font-bold text-base-content/40">
                                  {idx + 1}
                                </div>
                                <div className="col-span-4 min-w-0 pr-2">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center flex-shrink-0 text-xs">
                                      {initial}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="font-bold text-base-content truncate text-sm">{item.name}</p>
                                      <div className="flex items-center gap-1.5 text-[11px] text-base-content/50">
                                        <span className={`badge badge-xs ${item.type === "dependant" ? "badge-secondary" : "badge-ghost"}`}>
                                          {item.type === "dependant" ? item.relationshipType : "Patient"}
                                        </span>
                                        {item.gender && <span className="capitalize">• {item.gender}</span>}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                <div className="col-span-3">
                                  <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-base-200 text-base-content/80">
                                    {item.displayId}
                                  </span>
                                </div>

                                <div className="col-span-2 text-base-content/70 text-xs font-medium">
                                  {item.updatedAt ? formatNigeriaTime(item.updatedAt) : "—"}
                                </div>

                                <div className="col-span-2 flex justify-end">
                                  <button
                                    onClick={() => handleProcessPatient(item)}
                                    className="btn btn-xs btn-primary gap-1 font-bold shadow-2xs"
                                  >
                                    <span>Process</span>
                                    <FaArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Mobile Row */}
                              <div className="block md:hidden space-y-2.5">
                                <div className="flex items-start justify-between gap-2">
                                  <div>
                                    <p className="font-bold text-sm text-base-content">{item.name}</p>
                                    <span className="font-mono font-bold text-xs text-primary">{item.displayId}</span>
                                  </div>
                                  <span className={`badge badge-sm ${item.type === "dependant" ? "badge-secondary" : "badge-ghost"}`}>
                                    {item.type === "dependant" ? item.relationshipType : "Patient"}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[11px] text-base-content/50">
                                    {item.updatedAt ? formatNigeriaDateTime(item.updatedAt) : "—"}
                                  </span>
                                  <button
                                    onClick={() => handleProcessPatient(item)}
                                    className="btn btn-xs btn-primary gap-1 font-bold"
                                  >
                                    <span>Process Payment</span>
                                    <FaArrowRight className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: RECENT PAYMENTS */}
                {activeTab === "recent_receipts" && (
                  <div>
                    {filteredReceipts.length === 0 ? (
                      <div className="py-14">
                        <EmptyState
                          title="No receipts found"
                          description={
                            searchQuery
                              ? `No payments match "${searchQuery}".`
                              : "No payment receipts have been issued yet."
                          }
                          actionLabel="Clear Search"
                          onAction={() => setSearchQuery("")}
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-base-200">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                          <div className="col-span-3">Patient</div>
                          <div className="col-span-2">Hospital ID</div>
                          <div className="col-span-2">Receipt No.</div>
                          <div className="col-span-2">Method</div>
                          <div className="col-span-2">Amount Paid</div>
                          <div className="col-span-1 text-right">Date</div>
                        </div>

                        {filteredReceipts.map((rec) => (
                          <div
                            key={rec.id}
                            className="p-4 md:px-5 md:py-3.5 hover:bg-base-200/40 transition-colors"
                          >
                            {/* Desktop Row */}
                            <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                              <div className="col-span-3 min-w-0 pr-2">
                                <p className="font-bold text-base-content truncate">{rec.patientName}</p>
                              </div>

                              <div className="col-span-2">
                                <span className="font-mono text-xs font-bold text-base-content/80">
                                  {rec.hospitalId}
                                </span>
                              </div>

                              <div className="col-span-2 font-mono text-[11px] text-base-content/60 truncate">
                                {rec.reference}
                              </div>

                              <div className="col-span-2">
                                <span className="badge badge-sm badge-outline font-semibold capitalize">
                                  {rec.paymentMethod}
                                </span>
                              </div>

                              <div className="col-span-2 font-black text-sm text-success">
                                ₦{rec.amountPaid.toLocaleString()}
                              </div>

                              <div className="col-span-1 text-right text-[11px] text-base-content/50">
                                {rec.date ? formatNigeriaDate(rec.date) : "—"}
                              </div>
                            </div>

                            {/* Mobile Row */}
                            <div className="block md:hidden space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-sm text-base-content">{rec.patientName}</p>
                                <span className="font-black text-success">₦{rec.amountPaid.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs text-base-content/60">
                                <span>{rec.hospitalId} • {rec.paymentMethod}</span>
                                <span>{rec.date ? formatNigeriaDate(rec.date) : "—"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Card Footer Link */}
                <div className="p-3 bg-base-200/40 border-t border-base-200 text-center">
                  <Link
                    to={activeTab === "queue" ? "/cashier/incoming" : "/cashier/receipt-records"}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>View all in {activeTab === "queue" ? "Incoming Queue" : "Payment Receipts"}</span>
                    <FaArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REVENUE BREAKDOWN & QUICK LINKS (4 COLS) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Payment Methods Distribution */}
              <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <FaCreditCard className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-base-content">Payment Methods</h3>
                  </div>
                  <span className="text-xs text-base-content/50 font-medium">{recentReceipts.length} total</span>
                </div>

                <div className="space-y-3">
                  {paymentMethods.map((pm, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-base-content/80">{pm.name}</span>
                        <span className="text-base-content/60 font-semibold">{pm.count} ({pm.percent}%)</span>
                      </div>
                      <div className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`${pm.color} h-full rounded-full transition-all duration-500`}
                          style={{ width: `${pm.percent}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-3">
                <h3 className="font-bold text-sm text-base-content">Finance Shortcuts</h3>
                <div className="grid grid-cols-1 gap-2 text-xs">
                  <Link
                    to="/cashier/incoming"
                    className="p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <FaClock className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-base-content">Patient Payment Queue</span>
                    </div>
                    <FaArrowRight className="w-3 h-3 text-base-content/40" />
                  </Link>

                  <Link
                    to="/cashier/billing-records"
                    className="p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-warning/10 text-warning">
                        <FaFileInvoiceDollar className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-base-content">Billing Records & Invoices</span>
                    </div>
                    <FaArrowRight className="w-3 h-3 text-base-content/40" />
                  </Link>

                  <Link
                    to="/cashier/receipt-records"
                    className="p-3 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-success/10 text-success">
                        <FaReceipt className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-base-content">Payment Receipts History</span>
                    </div>
                    <FaArrowRight className="w-3 h-3 text-base-content/40" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default CashierDashboard;
