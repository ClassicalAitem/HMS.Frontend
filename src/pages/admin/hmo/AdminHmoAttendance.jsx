import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import KolakLoader from "@/components/common/KolakLoader";
import {
  FaSearch,
  FaFileExport,
  FaIdCard,
  FaChevronLeft,
  FaChevronRight,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaSync,
  FaEye,
  FaTimes,
  FaFilter,
  FaMoneyBillWave,
  FaShieldAlt,
} from "react-icons/fa";
import { RiFilterLine, RiCloseLine } from "react-icons/ri";
import { getAllBillings } from "@/services/api/billingAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { getAllHmos } from "@/services/api/hmoAPI";
import { exportRowsToCsv, formatCurrency } from "../reports/adminReportUtils";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const DecisionBadge = ({ decision }) => {
  const map = {
    approved: "badge-success text-white",
    partial: "badge-warning",
    rejected: "badge-error text-white",
    mixed: "badge-info text-white",
  };
  return (
    <span className={`badge badge-sm uppercase font-semibold text-[11px] ${map[decision] || "badge-ghost"}`}>
      {decision}
    </span>
  );
};

const TypeBadge = ({ type, relationshipType }) =>
  type === "dependant" ? (
    <span className="badge badge-secondary badge-sm text-[11px] font-medium">
      {relationshipType || "Dependant"}
    </span>
  ) : (
    <span className="badge badge-outline badge-sm text-[11px] font-medium">Patient</span>
  );

const AdminHmoAttendance = () => {
  const [activeTab, setActiveTab] = useState("reviewed"); // 'reviewed' | 'enrollees'
  const [loading, setLoading] = useState(true);

  // Data states
  const [reviewedRecords, setReviewedRecords] = useState([]);
  const [enrolleeRecords, setEnrolleeRecords] = useState([]);
  const [hmoProviders, setHmoProviders] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [decisionFilter, setDecisionFilter] = useState("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [showFilters, setShowFilters] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal state for viewing details
  const [selectedRecord, setSelectedRecord] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [billingsRes, patientsRes, dependantsRes, hmosRes] = await Promise.allSettled([
        getAllBillings(),
        getPatients({ limit: 1000 }),
        getDependants(),
        getAllHmos(),
      ]);

      const bills = billingsRes.status === "fulfilled"
        ? (billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [])
        : [];

      const patients = patientsRes.status === "fulfilled"
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : Array.isArray(patientsRes.value) ? patientsRes.value : [])
        : [];

      const dependantsRaw = dependantsRes.status === "fulfilled"
        ? (dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [])
        : [];
      const dependants = Array.isArray(dependantsRaw) ? dependantsRaw : (dependantsRaw?.dependants ?? []);

      const hmosList = hmosRes.status === "fulfilled"
        ? (Array.isArray(hmosRes.value?.data) ? hmosRes.value.data : Array.isArray(hmosRes.value) ? hmosRes.value : [])
        : [];
      setHmoProviders(hmosList);

      const patientMap = new Map(patients.map((p) => [String(p.id || p._id), p]));
      const dependantMap = new Map(dependants.map((d) => [String(d.id || d._id), d]));

      // 1. Process Reviewed HMO Bills (where at least one item has an HMO decision)
      const decidedBills = (Array.isArray(bills) ? bills : []).filter((bill) =>
        (bill.itemDetails || []).some((item) => item.hmoStatus && item.hmoStatus !== "pending")
      );

      const mappedReviewed = decidedBills.map((bill) => {
        const isDependantBill = !!bill.dependantId;
        const patient = patientMap.get(String(bill.patientId));
        const dependant = isDependantBill ? dependantMap.get(String(bill.dependantId)) : null;

        const name = isDependantBill
          ? (`${dependant?.firstName || ""} ${dependant?.lastName || ""}`.trim() || "Dependant")
          : (`${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Unknown Patient");

        const items = bill.itemDetails || [];
        const hasApproved = items.some((i) => i.hmoStatus === "approved");
        const hasPartial = items.some((i) => i.hmoStatus === "partial");
        const hasRejected = items.some((i) => i.hmoStatus === "rejected");

        let overallDecision = "approved";
        const flags = [hasApproved, hasPartial, hasRejected].filter(Boolean).length;
        if (flags > 1) overallDecision = "mixed";
        else if (hasPartial) overallDecision = "partial";
        else if (hasRejected) overallDecision = "rejected";
        else if (hasApproved) overallDecision = "approved";

        const approvedItems = items.filter((i) => i.hmoStatus === "approved" || i.hmoStatus === "partial");
        const claimedItems = approvedItems.filter((i) => i.isClaimed);
        let claimStatus = "N/A";
        if (approvedItems.length > 0) {
          if (claimedItems.length === approvedItems.length) claimStatus = "Fully Claimed";
          else if (claimedItems.length > 0) claimStatus = "Partially Claimed";
          else claimStatus = "Pending Claim";
        }

        const hmoCoveredTotal = items.reduce((s, i) => s + Number(i.hmoCovered || 0), 0);
        const patientOwesTotal = items.reduce(
          (s, i) => s + Number(i.patientOwes ?? (Number(i.total || 0) - Number(i.hmoCovered || 0))),
          0
        );

        const hmoProvider =
          Array.isArray(patient?.hmos) && patient.hmos.length > 0
            ? [...new Set(patient.hmos.map((h) => h.provider).filter(Boolean))].join(", ")
            : (patient?.hmo?.provider || patient?.hmoProvider || bill.hmoProvider || "Standard HMO");

        return {
          id: bill.id || bill._id,
          billId: bill.id || bill._id,
          patientId: bill.patientId,
          dependantId: bill.dependantId || null,
          type: isDependantBill ? "dependant" : "patient",
          relationshipType: dependant?.relationshipType || dependant?.relationship || null,
          name,
          firstName: isDependantBill ? dependant?.firstName : patient?.firstName,
          lastName: isDependantBill ? dependant?.lastName : patient?.lastName,
          hospitalId: patient?.hospitalId || "—",
          displayId: patient?.hospitalId || "—",
          phone: patient?.phone || patient?.phoneNumber || "—",
          decision: overallDecision,
          claimStatus,
          totalAmount: Number(bill.totalAmount || 0),
          hmoCovered: hmoCoveredTotal,
          patientOwes: patientOwesTotal,
          hmoProvider,
          approvedAt: bill.hmoReviewedAt || bill.updatedAt || bill.createdAt || null,
          items,
          rawBill: bill,
          patient,
          dependant,
        };
      });

      mappedReviewed.sort((a, b) => new Date(b.approvedAt || 0).getTime() - new Date(a.approvedAt || 0).getTime());
      setReviewedRecords(mappedReviewed);

      // 2. Process Enrollees Directory
      const hmoPatients = patients.filter(
        (p) => p.hmo?.provider || p.hmoProvider || p.cardType?.toLowerCase().includes("hmo") || (Array.isArray(p.hmos) && p.hmos.length > 0)
      );

      const mappedEnrollees = hmoPatients.map((p, idx) => {
        const provider =
          (Array.isArray(p.hmos) && p.hmos.length > 0 ? p.hmos[0]?.provider : null) ||
          p.hmo?.provider ||
          p.hmoProvider ||
          "Standard HMO";
        const memberId =
          (Array.isArray(p.hmos) && p.hmos.length > 0 ? p.hmos[0]?.policyId : null) ||
          p.hmo?.memberId ||
          p.hmo?.enrolleeId ||
          `ENR-${idx + 301}`;
        const plan =
          (Array.isArray(p.hmos) && p.hmos.length > 0 ? p.hmos[0]?.package : null) ||
          p.hmo?.plan ||
          "Comprehensive Plan";

        return {
          id: p._id || p.id || `hmo-${idx}`,
          hospitalId: p.hospitalId || "—",
          patientName: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.fullName || "—",
          phone: p.phone || p.phoneNumber || "—",
          provider,
          memberId,
          plan,
          attendanceDate: p.updatedAt || p.createdAt || "",
          status: "Eligible / Authorized",
        };
      });

      setEnrolleeRecords(mappedEnrollees);
    } catch (err) {
      console.error("Error fetching admin HMO records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Filtered Reviewed Records
  const filteredReviewed = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    const now = new Date();

    let list = reviewedRecords;

    // Date range filter
    if (dateFilter === "custom" && (customFrom || customTo)) {
      const fromTs = customFrom ? new Date(customFrom).setUTCHours(0, 0, 0, 0) : 0;
      const toTs = customTo ? new Date(customTo).setUTCHours(23, 59, 59, 999) : Infinity;

      list = list.filter((r) => {
        const ts = r.approvedAt ? new Date(r.approvedAt).getTime() : 0;
        return ts >= fromTs && ts <= toTs;
      });
    } else if (dateFilter !== "all") {
      const start = (() => {
        if (dateFilter === "today") {
          const nowNigeria = new Date(now.getTime() + 60 * 60 * 1000);
          nowNigeria.setUTCHours(0, 0, 0, 0);
          return nowNigeria.getTime() - 60 * 60 * 1000;
        }
        if (dateFilter === "week") return now.getTime() - 7 * 24 * 60 * 60 * 1000;
        if (dateFilter === "two_weeks") return now.getTime() - 14 * 24 * 60 * 60 * 1000;
        if (dateFilter === "month") return now.getTime() - 30 * 24 * 60 * 60 * 1000;
        if (dateFilter === "three_months") return now.getTime() - 90 * 24 * 60 * 60 * 1000;
        if (dateFilter === "six_months") return now.getTime() - 180 * 24 * 60 * 60 * 1000;
        return 0;
      })();

      list = list.filter((r) => {
        const ts = r.approvedAt ? new Date(r.approvedAt).getTime() : 0;
        return ts >= start;
      });
    }

    // Decision filter
    if (decisionFilter !== "all") {
      list = list.filter((r) => r.decision === decisionFilter);
    }

    // Provider filter
    if (providerFilter !== "all") {
      list = list.filter((r) => r.hmoProvider.toLowerCase().includes(providerFilter.toLowerCase()));
    }

    // Search query
    if (term) {
      list = list.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.displayId.toLowerCase().includes(term) ||
          r.hmoProvider.toLowerCase().includes(term) ||
          r.phone.toLowerCase().includes(term)
      );
    }

    return list;
  }, [reviewedRecords, searchTerm, dateFilter, decisionFilter, customFrom, customTo, providerFilter]);

  // Filtered Enrollee Records
  const filteredEnrollees = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    let list = enrolleeRecords;

    if (providerFilter !== "all") {
      list = list.filter((r) => r.provider.toLowerCase().includes(providerFilter.toLowerCase()));
    }

    if (term) {
      list = list.filter(
        (r) =>
          r.patientName.toLowerCase().includes(term) ||
          r.hospitalId.toLowerCase().includes(term) ||
          r.provider.toLowerCase().includes(term) ||
          r.memberId.toLowerCase().includes(term)
      );
    }

    return list;
  }, [enrolleeRecords, searchTerm, providerFilter]);

  // Aggregate stats
  const totalReviewedCovered = useMemo(
    () => filteredReviewed.reduce((sum, r) => sum + Number(r.hmoCovered || 0), 0),
    [filteredReviewed]
  );
  const totalPatientCopay = useMemo(
    () => filteredReviewed.reduce((sum, r) => sum + Number(r.patientOwes || 0), 0),
    [filteredReviewed]
  );

  const uniqueProvidersList = useMemo(() => {
    const providers = new Set();
    reviewedRecords.forEach((r) => r.hmoProvider && providers.add(r.hmoProvider));
    enrolleeRecords.forEach((r) => r.provider && providers.add(r.provider));
    return Array.from(providers);
  }, [reviewedRecords, enrolleeRecords]);

  // Pagination calculations
  const activeList = activeTab === "reviewed" ? filteredReviewed : filteredEnrollees;
  const totalRows = activeList.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return activeList.slice(start, start + itemsPerPage);
  }, [activeList, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, dateFilter, decisionFilter, providerFilter]);

  const activeFilterCount =
    (dateFilter !== "all" ? 1 : 0) +
    (decisionFilter !== "all" ? 1 : 0) +
    (providerFilter !== "all" ? 1 : 0) +
    (customFrom || customTo ? 1 : 0);

  const handleExport = () => {
    if (activeTab === "reviewed") {
      const exportCols = [
        { key: "displayId", label: "Patient ID" },
        { key: "name", label: "Patient / Enrollee Name" },
        { key: "type", label: "Type" },
        { key: "decision", label: "Decision" },
        { key: "claimStatus", label: "Claims Status" },
        { key: "hmoProvider", label: "HMO Provider" },
        { key: "totalAmount", label: "Total Bill (₦)" },
        { key: "hmoCovered", label: "HMO Covered (₦)" },
        { key: "patientOwes", label: "Patient Copay (₦)" },
        { key: "approvedAt", label: "Reviewed Date" },
      ];
      exportRowsToCsv(
        filteredReviewed.map((r) => ({
          ...r,
          approvedAt: r.approvedAt ? formatNigeriaDateTime(r.approvedAt) : "—",
        })),
        exportCols,
        `hmo_reviewed_patients_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } else {
      const exportCols = [
        { key: "hospitalId", label: "Hospital ID" },
        { key: "patientName", label: "Enrollee Name" },
        { key: "phone", label: "Phone" },
        { key: "provider", label: "HMO Provider" },
        { key: "memberId", label: "Enrollee / Member ID" },
        { key: "plan", label: "Insurance Plan" },
        { key: "attendanceDate", label: "Attendance Date" },
        { key: "status", label: "Status" },
      ];
      exportRowsToCsv(
        filteredEnrollees.map((r) => ({
          ...r,
          attendanceDate: r.attendanceDate ? formatNigeriaDate(r.attendanceDate) : "—",
        })),
        exportCols,
        `hmo_enrollee_records_${new Date().toISOString().slice(0, 10)}.csv`
      );
    }
  };

  return (
    <AdminLayout>
      {loading && reviewedRecords.length === 0 && enrolleeRecords.length === 0 && (
        <KolakLoader fullscreen text="Loading HMO patients and review data..." />
      )}

      <div className="space-y-6">
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary flex items-center gap-1.5">
                <FaShieldAlt className="w-3.5 h-3.5" />
                Health Insurance Oversight
              </span>
              <span className="text-xs text-base-content/60">HMO Review & Claims Tracking</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              HMO Patients & Review History
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Comprehensive oversight of patients reviewed by HMO officers, approvals, preauthorization codes, coverage amounts, and patient copays.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={fetchAllData}
              disabled={loading}
              className="btn btn-sm btn-ghost border border-base-300 gap-1.5"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              onClick={handleExport}
              disabled={!activeList.length}
              className="btn btn-sm btn-primary gap-2 shadow-sm"
            >
              <FaFileExport className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Counter KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Reviewed Patients</p>
            <p className="text-2xl font-extrabold text-primary mt-1">{reviewedRecords.length}</p>
            <p className="text-[11px] text-base-content/50 mt-0.5">Bills evaluated by HMO</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">HMO Covered Amount</p>
            <p className="text-xl sm:text-2xl font-extrabold text-success mt-1">
              {formatCurrency(totalReviewedCovered)}
            </p>
            <p className="text-[11px] text-success/70 mt-0.5">Total approved claims</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Patient Copay (Owed)</p>
            <p className="text-xl sm:text-2xl font-extrabold text-warning mt-1">
              {formatCurrency(totalPatientCopay)}
            </p>
            <p className="text-[11px] text-warning/70 mt-0.5">Out-of-pocket balance</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Active HMO Providers</p>
            <p className="text-2xl font-extrabold text-secondary mt-1">{uniqueProvidersList.length}</p>
            <p className="text-[11px] text-base-content/50 mt-0.5">In-network insurers</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 border-b border-base-200 pb-2">
          <button
            onClick={() => setActiveTab("reviewed")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "reviewed"
                ? "bg-primary text-primary-content shadow-sm"
                : "bg-base-100 text-base-content/70 hover:bg-base-200 border border-base-200"
            }`}
          >
            <FaCheckCircle className="w-4 h-4" />
            Reviewed by HMO ({reviewedRecords.length})
          </button>
          <button
            onClick={() => setActiveTab("enrollees")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
              activeTab === "enrollees"
                ? "bg-primary text-primary-content shadow-sm"
                : "bg-base-100 text-base-content/70 hover:bg-base-200 border border-base-200"
            }`}
          >
            <FaIdCard className="w-4 h-4" />
            All HMO Enrollees ({enrolleeRecords.length})
          </button>
        </div>

        {/* Filters Bar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
            <div className="flex-1 relative">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
              <input
                type="text"
                placeholder={
                  activeTab === "reviewed"
                    ? "Search reviewed patients by name, hospital ID, HMO provider, or phone..."
                    : "Search enrollees by name, hospital ID, member ID, or provider..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg text-xs"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-base-content/40 hover:text-base-content"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="select select-sm bg-base-200/50 border-base-300 rounded-lg text-xs"
              >
                <option value="all">All HMO Providers</option>
                {uniqueProvidersList.map((prov) => (
                  <option key={prov} value={prov}>
                    {prov}
                  </option>
                ))}
              </select>

              {activeTab === "reviewed" && (
                <>
                  <select
                    value={decisionFilter}
                    onChange={(e) => setDecisionFilter(e.target.value)}
                    className="select select-sm bg-base-200/50 border-base-300 rounded-lg text-xs"
                  >
                    <option value="all">All Decisions</option>
                    <option value="approved">Approved</option>
                    <option value="partial">Partial</option>
                    <option value="rejected">Rejected</option>
                    <option value="mixed">Mixed</option>
                  </select>

                  <select
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      if (e.target.value !== "custom") {
                        setCustomFrom("");
                        setCustomTo("");
                      }
                    }}
                    className="select select-sm bg-base-200/50 border-base-300 rounded-lg text-xs"
                  >
                    <option value="all">All Dates</option>
                    <option value="today">Today</option>
                    <option value="week">Past 1 Week</option>
                    <option value="two_weeks">Past 2 Weeks</option>
                    <option value="month">Past 1 Month</option>
                    <option value="three_months">Past 3 Months</option>
                    <option value="six_months">Past 6 Months</option>
                    <option value="custom">Custom Date Range</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {activeTab === "reviewed" && dateFilter === "custom" && (
            <div className="flex items-center gap-3 bg-base-100 p-3 rounded-xl border border-base-200 text-xs">
              <span className="font-semibold text-base-content/70">Custom Dates:</span>
              <div className="flex items-center gap-2">
                <span>From</span>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="input input-xs input-bordered"
                />
              </div>
              <div className="flex items-center gap-2">
                <span>To</span>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="input input-xs input-bordered"
                />
              </div>
              {(customFrom || customTo) && (
                <button
                  onClick={() => {
                    setCustomFrom("");
                    setCustomTo("");
                  }}
                  className="btn btn-ghost btn-xs text-error gap-1"
                >
                  <RiCloseLine /> Clear
                </button>
              )}
            </div>
          )}
        </div>

        {/* Table View with constrained scroll boundary */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading && activeList.length === 0 ? (
            <div className="py-16">
              <KolakLoader text="Loading HMO records..." />
            </div>
          ) : activeTab === "reviewed" ? (
            /* EXACT HMO REVIEWED TABLE */
            <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
              <table className="table table-zebra w-full text-left text-xs">
                <thead className="sticky top-0 bg-base-200/90 backdrop-blur-xs z-10 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3 px-4">Patient ID</th>
                    <th className="px-4">Patient / Enrollee Name</th>
                    <th className="px-4">Type</th>
                    <th className="px-4">HMO Status</th>
                    <th className="px-4">Claims Status</th>
                    <th className="px-4">HMO Provider</th>
                    <th className="px-4 text-right">Total Bill</th>
                    <th className="px-4 text-right">HMO Covered</th>
                    <th className="px-4 text-right">Patient Owes</th>
                    <th className="px-4">Reviewed Date</th>
                    <th className="px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-12 text-center text-base-content/50">
                        No HMO reviewed patient records found matching your filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((row) => (
                      <tr key={row.id} className="hover:bg-base-200/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary font-mono">{row.displayId}</td>
                        <td className="px-4 py-3 font-medium text-base-content">
                          <div>
                            <span className="font-semibold">{row.name}</span>
                            {row.phone && row.phone !== "—" && (
                              <p className="text-[11px] text-base-content/50 font-normal">{row.phone}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={row.type} relationshipType={row.relationshipType} />
                        </td>
                        <td className="px-4 py-3">
                          <DecisionBadge decision={row.decision} />
                        </td>
                        <td className="px-4 py-3">
                          {row.claimStatus === "Fully Claimed" ? (
                            <span className="badge badge-success badge-sm text-[11px] font-semibold text-white">
                              {row.claimStatus}
                            </span>
                          ) : row.claimStatus === "Partially Claimed" ? (
                            <span className="badge badge-warning badge-sm text-[11px] font-semibold">
                              {row.claimStatus}
                            </span>
                          ) : row.claimStatus === "Pending Claim" ? (
                            <span className="badge badge-error badge-sm text-[11px] font-semibold text-white">
                              {row.claimStatus}
                            </span>
                          ) : (
                            <span className="text-base-content/40">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-base-content/80 max-w-[150px] truncate">
                          {row.hmoProvider}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-base-content">
                          {formatCurrency(row.totalAmount)}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-success">
                          {formatCurrency(row.hmoCovered)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-warning">
                          {formatCurrency(row.patientOwes)}
                        </td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {row.approvedAt ? formatNigeriaDateTime(row.approvedAt) : "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => setSelectedRecord(row)}
                            className="btn btn-xs btn-outline btn-primary gap-1 font-medium hover:scale-[1.02] active:scale-[0.98] transition-all"
                          >
                            <FaEye className="w-3 h-3" />
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : (
            /* ALL HMO ENROLLEES TABLE */
            <div className="overflow-x-auto max-h-[60vh] sm:max-h-[65vh] 2xl:max-h-[70vh]">
              <table className="table table-zebra w-full text-left text-xs">
                <thead className="sticky top-0 bg-base-200/90 backdrop-blur-xs z-10 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3 px-4">Hospital ID</th>
                    <th className="px-4">Enrollee Full Name</th>
                    <th className="px-4">Phone Number</th>
                    <th className="px-4">HMO Provider</th>
                    <th className="px-4">Enrollee / Policy ID</th>
                    <th className="px-4">Coverage Plan</th>
                    <th className="px-4">Attendance Date</th>
                    <th className="px-4">Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-base-content/50">
                        No HMO enrollee records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((hmo, idx) => (
                      <tr key={hmo.id || idx} className="hover:bg-base-200/40 transition-colors">
                        <td className="px-4 py-3 font-semibold text-primary font-mono">{hmo.hospitalId}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{hmo.patientName}</td>
                        <td className="px-4 py-3 text-base-content/80">{hmo.phone}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{hmo.provider}</td>
                        <td className="px-4 py-3 font-mono text-xs text-base-content/80">{hmo.memberId}</td>
                        <td className="px-4 py-3 text-base-content/80">{hmo.plan}</td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {hmo.attendanceDate ? formatNigeriaDate(hmo.attendanceDate) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                            {hmo.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-base-200 bg-base-100">
              <span className="text-xs text-base-content/60">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalRows)} of {totalRows} entries
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

      {/* Itemized HMO Review Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-base-100 rounded-2xl border border-base-300 shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-base-200 flex items-center justify-between bg-base-200/40">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-primary uppercase">HMO Evaluation Breakdown</span>
                  <DecisionBadge decision={selectedRecord.decision} />
                </div>
                <h3 className="text-lg font-bold text-base-content mt-1">
                  {selectedRecord.name}
                  <span className="ml-2 text-xs font-normal text-base-content/60 font-mono">
                    ({selectedRecord.displayId})
                  </span>
                </h3>
                <p className="text-xs text-base-content/70">
                  Provider: <strong>{selectedRecord.hmoProvider}</strong> · Reviewed on:{" "}
                  {selectedRecord.approvedAt ? formatNigeriaDateTime(selectedRecord.approvedAt) : "—"}
                </p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-3 bg-base-200/50 p-3.5 rounded-xl border border-base-200 text-xs">
                <div>
                  <span className="text-base-content/60">Total Bill:</span>
                  <p className="text-base font-bold text-base-content">{formatCurrency(selectedRecord.totalAmount)}</p>
                </div>
                <div>
                  <span className="text-base-content/60">HMO Approved Coverage:</span>
                  <p className="text-base font-bold text-success">{formatCurrency(selectedRecord.hmoCovered)}</p>
                </div>
                <div>
                  <span className="text-base-content/60">Patient Copay Owed:</span>
                  <p className="text-base font-bold text-warning">{formatCurrency(selectedRecord.patientOwes)}</p>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-base-200 rounded-xl overflow-hidden">
                <table className="table table-zebra w-full text-xs">
                  <thead className="bg-base-200 text-xs uppercase font-bold text-base-content/80">
                    <tr>
                      <th className="py-2.5 px-3">Service / Item</th>
                      <th className="px-3 text-right">Price</th>
                      <th className="px-3">HMO Decision</th>
                      <th className="px-3 text-right">HMO Covered</th>
                      <th className="px-3 text-right">Patient Owes</th>
                      <th className="px-3">Pre-Auth / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-base-200">
                    {(selectedRecord.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="px-3 py-2 font-medium">
                          {item.name || item.serviceName || item.description || item.code || "Medical Item"}
                          {item.code && <span className="block text-[10px] text-base-content/50 font-mono">{item.code}</span>}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {formatCurrency(item.total || item.price || item.unitPrice || 0)}
                        </td>
                        <td className="px-3 py-2">
                          <DecisionBadge decision={item.hmoStatus || "pending"} />
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-success">
                          {formatCurrency(item.hmoCovered || 0)}
                        </td>
                        <td className="px-3 py-2 text-right font-semibold text-warning">
                          {formatCurrency(item.patientOwes || 0)}
                        </td>
                        <td className="px-3 py-2">
                          {item.preAuthCode || item.preauthCode ? (
                            <span className="badge badge-outline badge-xs font-mono font-bold text-primary">
                              {item.preAuthCode || item.preauthCode}
                            </span>
                          ) : item.rejectionReason ? (
                            <span className="text-[11px] text-error italic">{item.rejectionReason}</span>
                          ) : (
                            <span className="text-base-content/40">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-base-200 flex justify-end bg-base-200/30">
              <button
                onClick={() => setSelectedRecord(null)}
                className="btn btn-sm btn-ghost border border-base-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminHmoAttendance;
