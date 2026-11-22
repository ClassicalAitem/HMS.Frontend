import React, { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HmoLayout } from "@/layouts/hmo";
import { getAllHmos } from "@/services/api/hmoAPI";
import { getAllBillings } from "@/services/api/billingAPI";
import { getPatients } from "@/services/api/patientsAPI";
import { getDependants } from "@/services/api/dependantAPI";
import { PATIENT_STATUS } from "@/constants/patientStatus";
import { normalizeStatus } from "@/utils/statusUtils";
import { useAppSelector } from "@/store/hooks";
import { formatNigeriaDate, formatNigeriaDateTime, formatNigeriaTime } from "@/utils/formatDateTimeUtils";
import KolakLoader from "@/components/common/KolakLoader";
import { EmptyState } from "@/components/common";
import {
  FaShieldAlt,
  FaFileInvoiceDollar,
  FaUserClock,
  FaBuilding,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaArrowRight,
  FaSearch,
  FaTimes,
  FaUsers,
  FaExternalLinkAlt,
  FaClock,
  FaBan
} from "react-icons/fa";
import { RiRefreshLine, RiSuitcaseLine } from "react-icons/ri";
import { MdHealthAndSafety } from "react-icons/md";

const HmoDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [hmos, setHmos] = useState([]);
  const [patientsList, setPatientsList] = useState([]);
  const [awaitingQueue, setAwaitingQueue] = useState([]);
  const [claimsList, setClaimsList] = useState([]);
  const [activeTab, setActiveTab] = useState("queue"); // "queue" | "recent_claims"
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);

    try {
      const [hmosRes, patientsRes, dependantsRes, billingsRes] = await Promise.allSettled([
        getAllHmos(),
        getPatients({ limit: 300 }),
        getDependants({ limit: 300 }),
        getAllBillings({ limit: 300 }),
      ]);

      // 1. Process HMO Plans
      if (hmosRes.status === "fulfilled") {
        const rawH = hmosRes.value?.data ?? hmosRes.value ?? [];
        const list = Array.isArray(rawH) ? rawH : rawH?.data ?? [];
        setHmos(list);
      }

      // 2. Process Patients List & Map for quick ID/Name resolution
      const allPatients = patientsRes.status === "fulfilled"
        ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : patientsRes.value?.data?.data ?? [])
        : [];
      setPatientsList(allPatients);
      const patientMap = new Map(allPatients.map((p) => [p.id || p._id, p]));

      // 3. Process Dependants
      const allDependants = dependantsRes.status === "fulfilled"
        ? (() => {
            const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? [];
            return Array.isArray(raw) ? raw : raw?.dependants ?? [];
          })()
        : [];
      const dependantMap = new Map(allDependants.map((d) => [d.id || d._id, d]));

      // 4. Construct Live Awaiting HMO Queue
      const queuePatients = allPatients
        .filter((p) => normalizeStatus(p?.status) === PATIENT_STATUS.AWAITING_HMO)
        .map((p) => ({
          id: p.id || p._id,
          patientId: p.id || p._id,
          dependantId: null,
          type: "patient",
          name: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown",
          displayId: p.hospitalId || p.id || "—",
          gender: p.gender || "",
          age: p.age || null,
          hmoProvider: p?.hmos?.provider || (Array.isArray(p?.hmos) && p.hmos[0]?.provider) || "HMO Insurance",
          hmoPolicy: p?.hmos?.memberId || (Array.isArray(p?.hmos) && p.hmos[0]?.memberId) || "—",
          updatedAt: p.updatedAt || p.createdAt,
          snapshot: p,
        }));

      const queueDependants = allDependants
        .filter((d) => normalizeStatus(d?.status) === PATIENT_STATUS.AWAITING_HMO)
        .map((d) => {
          const parent = patientMap.get(d.patientId) || d.patient;
          return {
            id: d.id || d._id,
            patientId: d.patientId || parent?.id || parent?._id,
            dependantId: d.id || d._id,
            type: "dependant",
            relationshipType: d.relationshipType || "Dependant",
            name: `${d.firstName || ""} ${d.lastName || ""}`.trim() || "Dependant",
            displayId: parent?.hospitalId || d.patient?.hospitalId || "—",
            gender: d.gender || "",
            age: d.age || null,
            hmoProvider: parent?.hmos?.provider || (Array.isArray(parent?.hmos) && parent.hmos[0]?.provider) || "HMO Insurance",
            hmoPolicy: d.hmoMemberId || parent?.hmos?.memberId || "—",
            updatedAt: d.updatedAt || d.createdAt,
            snapshot: d,
          };
        });

      const combinedQueue = [...queuePatients, ...queueDependants].sort(
        (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      setAwaitingQueue(combinedQueue);

      // 5. Construct Decided HMO Claims / Billings
      const allBills = billingsRes.status === "fulfilled"
        ? (billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [])
        : [];

      const decidedBills = (Array.isArray(allBills) ? allBills : [])
        .filter((bill) =>
          (bill.itemDetails || []).some((item) => item.hmoStatus && item.hmoStatus !== "pending")
        )
        .map((bill) => {
          const isDependant = !!bill.dependantId;
          const patient = patientMap.get(bill.patientId);
          const dependant = isDependant ? dependantMap.get(bill.dependantId) : null;

          const name = isDependant
            ? `${dependant?.firstName || ""} ${dependant?.lastName || ""}`.trim() || "Dependant"
            : `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient";

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

          const hmoCoveredTotal = items.reduce((s, i) => s + Number(i.hmoCovered || 0), 0);
          const patientOwesTotal = items.reduce(
            (s, i) => s + Number(i.patientOwes ?? (Number(i.total || 0) - Number(i.hmoCovered || 0))),
            0
          );

          const hmoProvider = Array.isArray(patient?.hmos) && patient.hmos.length > 0
            ? [...new Set(patient.hmos.map((h) => h.provider).filter(Boolean))].join(", ")
            : "HMO Insurance";

          return {
            id: bill.id || bill._id,
            patientId: bill.patientId,
            dependantId: bill.dependantId || null,
            name,
            hospitalId: patient?.hospitalId || "—",
            type: isDependant ? "Dependant" : "Patient",
            decision: overallDecision,
            totalAmount: Number(bill.totalAmount || 0),
            hmoCovered: hmoCoveredTotal,
            patientOwes: patientOwesTotal,
            hmoProvider,
            reviewedAt: bill.hmoReviewedAt || bill.updatedAt || bill.createdAt,
          };
        })
        .sort((a, b) => new Date(b.reviewedAt || 0) - new Date(a.reviewedAt || 0));

      setClaimsList(decidedBills);
    } catch (err) {
      console.error("HmoDashboard: fetch error", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Real Hospital Patient HMO Policies (filters out mock lorem ipsum seed data)
  const realPatientPolicies = useMemo(() => {
    const list = [];
    const seen = new Set();
    const patientMap = new Map(patientsList.map((p) => [p.id || p._id, p]));

    // 1. From real patients list
    patientsList.forEach((p) => {
      const pHmos = Array.isArray(p.hmos) ? p.hmos : p.hmos ? [p.hmos] : [];
      pHmos.forEach((h) => {
        if (!h) return;
        const providerName = (h.provider || "").trim();
        // Skip dummy latin lorem ipsum text
        if (!providerName || /lorem|commodi|dolor|amet|et esse|assumenda|voluptates|sequi|numquam/i.test(providerName)) {
          return;
        }

        const key = `${p.id || p._id}-${h.memberId || h.id || providerName}`;
        if (seen.has(key)) return;
        seen.add(key);

        list.push({
          id: h.id || h._id || key,
          patientId: p.id || p._id,
          patientName: `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Patient",
          hospitalId: p.hospitalId || "—",
          provider: providerName,
          memberId: h.memberId || h.policyNumber || "—",
          plan: h.plan || "Standard",
          expiresAt: h.expiresAt || null,
        });
      });
    });

    // 2. From HMOs collection matched to real hospital patients
    hmos.forEach((h) => {
      const providerName = (h.provider || "").trim();
      if (!providerName || /lorem|commodi|dolor|amet|et esse|assumenda|voluptates|sequi|numquam/i.test(providerName)) {
        return;
      }

      const p = patientMap.get(h.patientId);
      if (!p && !h.patientId) return;

      const pName = p ? `${p.firstName || ""} ${p.lastName || ""}`.trim() : null;
      const hId = p?.hospitalId || null;

      const key = `${h.patientId || "h"}-${h.memberId || h.id || providerName}`;
      if (seen.has(key)) return;
      seen.add(key);

      list.push({
        id: h.id || h._id || key,
        patientId: h.patientId || p?.id,
        patientName: pName || "Hospital Patient",
        hospitalId: hId || "KOLAK-Patient",
        provider: providerName,
        memberId: h.memberId || "—",
        plan: h.plan || "Standard",
        expiresAt: h.expiresAt || null,
      });
    });

    return list;
  }, [patientsList, hmos]);

  // Real Policy Expirations: urgent, real expired or soon-expiring patient policies
  const policyExpirations = useMemo(() => {
    const now = Date.now();

    return realPatientPolicies
      .filter((p) => p.expiresAt)
      .map((p) => {
        const expTime = new Date(p.expiresAt).getTime();
        const diffDays = Math.ceil((expTime - now) / (1000 * 60 * 60 * 24));
        return {
          ...p,
          expTime,
          diffDays,
          isExpired: diffDays < 0,
        };
      })
      .sort((a, b) => {
        // Expired policies first (most recent expired first), then policies expiring soonest
        if (a.isExpired && !b.isExpired) return -1;
        if (!a.isExpired && b.isExpired) return 1;
        if (a.isExpired && b.isExpired) return b.expTime - a.expTime;
        return a.expTime - b.expTime;
      })
      .slice(0, 5);
  }, [realPatientPolicies]);

  // KPI Analytics Calculations
  const stats = useMemo(() => {
    const totalPlans = realPatientPolicies.length || hmos.length;
    const now = Date.now();
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;

    let expiringCount = 0;
    let expiredCount = 0;
    let activePlans = 0;

    const sourcePolicies = realPatientPolicies.length > 0 ? realPatientPolicies : hmos;

    sourcePolicies.forEach((h) => {
      const exp = h.expiresAt ? new Date(h.expiresAt).getTime() : 0;
      if (exp > 0) {
        const diff = exp - now;
        if (diff < 0) expiredCount += 1;
        else if (diff <= thirtyDays) expiringCount += 1;
        else activePlans += 1;
      } else {
        activePlans += 1;
      }
    });

    const totalCoveredNaira = claimsList.reduce((acc, c) => acc + (c.hmoCovered || 0), 0);
    const approvedClaims = claimsList.filter((c) => c.decision === "approved").length;
    const partialClaims = claimsList.filter((c) => c.decision === "partial" || c.decision === "mixed").length;
    const rejectedClaims = claimsList.filter((c) => c.decision === "rejected").length;

    return {
      queueCount: awaitingQueue.length,
      totalClaims: claimsList.length,
      approvedClaims,
      partialClaims,
      rejectedClaims,
      totalCoveredNaira,
      totalPlans,
      activePlans,
      expiringCount,
      expiredCount,
    };
  }, [realPatientPolicies, hmos, awaitingQueue, claimsList]);

  // Top Real HMO Providers Distribution
  const providerStats = useMemo(() => {
    const counts = {};
    const source = realPatientPolicies.length > 0 ? realPatientPolicies : hmos;

    source.forEach((h) => {
      const p = (h.provider || "").trim();
      if (!p || /lorem|commodi|dolor|amet|et esse|assumenda|voluptates|sequi|numquam/i.test(p)) return;
      counts[p] = (counts[p] || 0) + 1;
    });

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    return {
      total,
      list: Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    };
  }, [realPatientPolicies, hmos]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return awaitingQueue;
    return awaitingQueue.filter((item) =>
      [item.name, item.displayId, item.hmoProvider, item.hmoPolicy]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [awaitingQueue, searchQuery]);

  // Filtered Claims
  const filteredClaims = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return claimsList.slice(0, 10);
    return claimsList
      .filter((c) =>
        [c.name, c.hospitalId, c.hmoProvider, c.decision]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
      .slice(0, 10);
  }, [claimsList, searchQuery]);

  const handleReviewPatient = (item) => {
    if (!item?.patientId) return;
    navigate(`/dashboard/hmo/incoming/${item.patientId}`, {
      state: {
        patientSnapshot: item.type === "dependant" ? null : item.snapshot,
        dependantId: item.dependantId,
      },
    });
  };

  const getDecisionBadge = (decision) => {
    switch (decision) {
      case "approved":
        return <span className="badge badge-success badge-sm text-white font-bold">Approved</span>;
      case "partial":
      case "mixed":
        return <span className="badge badge-warning badge-sm font-bold">Partial</span>;
      case "rejected":
        return <span className="badge badge-error badge-sm text-white font-bold">Rejected</span>;
      default:
        return <span className="badge badge-ghost badge-sm capitalize">{decision}</span>;
    }
  };

  return (
    <HmoLayout>
      {loading && <KolakLoader fullscreen />}
      <div className="flex flex-col flex-1 bg-base-100 min-w-0">
        <div className="overflow-y-auto flex-1 p-4 sm:p-6 space-y-6">

          {/* WELCOME HEADER SECTION */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-[#00943C]/10 text-[#00943C] shadow-xs">
                <MdHealthAndSafety size={28} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold text-base-content">
                    Welcome, <span className="text-primary">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "HMO Officer"}</span>
                  </h1>
                  <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">HMO Officer</span>
                </div>
                <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
                  Manage patient insurance authorizations, verify medical claims, and track provider policies
                </p>
              </div>
            </div>

            {/* QUICK ACTIONS */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => fetchData(true)}
                disabled={refreshing}
                className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/5 hover:text-primary btn-sm gap-2"
                title="Refresh dashboard metrics"
              >
                <RiRefreshLine className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span className="text-xs font-semibold">{refreshing ? "Refreshing..." : "Refresh"}</span>
              </button>

              <Link
                to="/dashboard/hmo/incoming"
                className="btn btn-primary btn-sm gap-2 font-bold shadow-xs relative"
              >
                <RiSuitcaseLine className="w-4 h-4" />
                <span className="text-xs">Incoming Queue</span>
                {stats.queueCount > 0 && (
                  <span className="badge badge-error badge-xs text-white font-extrabold px-1.5 py-0.5">
                    {stats.queueCount}
                  </span>
                )}
              </Link>

              <Link
                to="/dashboard/hmo/patients"
                className="btn btn-outline border-base-300 hover:border-base-content hover:bg-base-200 btn-sm gap-1.5"
              >
                <FaUsers className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Claims History</span>
              </Link>
            </div>
          </div>

          {/* TOP 4 VIBRANT KPI CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

            {/* Card 1: Awaiting Authorization Queue */}
            <div 
              onClick={() => { setActiveTab("queue"); }}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === "queue"
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Awaiting Authorization</span>
                  <div className="text-3xl font-black text-primary mt-1">
                    {stats.queueCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FaUserClock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Patients in queue</span>
                {stats.queueCount > 0 ? (
                  <span className="badge badge-warning badge-xs font-bold">Action Needed</span>
                ) : (
                  <span className="badge badge-success badge-xs text-white font-bold">Cleared</span>
                )}
              </div>
            </div>

            {/* Card 2: Decided Claims */}
            <div 
              onClick={() => { setActiveTab("recent_claims"); }}
              className={`p-5 rounded-2xl bg-base-100 border transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
                activeTab === "recent_claims"
                  ? "border-success ring-2 ring-success/20 bg-success/5"
                  : "border-base-300 hover:border-base-content/30"
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Reviewed Claims</span>
                  <div className="text-3xl font-black text-success mt-1">
                    {stats.totalClaims}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-success/10 text-success">
                  <FaFileInvoiceDollar className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span className="text-success font-medium">✓ {stats.approvedClaims} Approved</span>
                <span className="text-error font-medium">✕ {stats.rejectedClaims} Rejected</span>
              </div>
            </div>

            {/* Card 3: Registered Plans */}
            <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">HMO Plans</span>
                  <div className="text-3xl font-black text-base-content mt-1">
                    {stats.totalPlans}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-base-200 text-base-content">
                  <FaBuilding className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>{stats.activePlans} active plans</span>
                {stats.expiringCount > 0 && (
                  <span className="badge badge-warning badge-xs font-bold">{stats.expiringCount} Expiring</span>
                )}
              </div>
            </div>

            {/* Card 4: Expired HMO Plans */}
            <div className="p-5 rounded-2xl bg-base-100 border border-base-300 shadow-xs flex flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">Expired HMO</span>
                  <div className="text-3xl font-black text-error mt-1">
                    {stats.expiredCount}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-error/10 text-error">
                  <FaBan className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-base-200/60 text-xs text-base-content/60 flex items-center justify-between">
                <span>Past validity date</span>
                {stats.expiredCount > 0 ? (
                  <span className="badge badge-error badge-xs text-white font-bold">Needs Renewal</span>
                ) : (
                  <span className="badge badge-ghost badge-xs text-base-content/60">0 Expired</span>
                )}
              </div>
            </div>
          </div>

          {/* MAIN SECTION: 2-COLUMN GRID (8 COLS / 4 COLS) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* LEFT COLUMN: LIVE QUEUE & CLAIMS ACTIVITY (8 COLS) */}
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
                      <FaUserClock className="w-3.5 h-3.5" />
                      <span>Authorization Queue</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        activeTab === "queue" ? "bg-primary-content/20 text-primary-content" : "bg-base-300 text-base-content/70"
                      }`}>
                        {awaitingQueue.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("recent_claims")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeTab === "recent_claims"
                          ? "bg-primary text-primary-content shadow-xs"
                          : "bg-base-200 text-base-content/70 hover:text-base-content hover:bg-base-300"
                      }`}
                    >
                      <FaFileInvoiceDollar className="w-3.5 h-3.5" />
                      <span>Recent Decisions</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        activeTab === "recent_claims" ? "bg-primary-content/20 text-primary-content" : "bg-base-300 text-base-content/70"
                      }`}>
                        {claimsList.length}
                      </span>
                    </button>
                  </div>

                  {/* Quick Search inside active tab */}
                  <div className="relative w-full sm:w-64">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3 h-3" />
                    <input
                      type="text"
                      placeholder="Search patient, ID, HMO..."
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

                {/* TAB 1 CONTENT: AWAITING AUTHORIZATION QUEUE */}
                {activeTab === "queue" && (
                  <div>
                    {filteredQueue.length === 0 ? (
                      <div className="py-14">
                        <EmptyState
                          title="Queue is empty"
                          description={
                            searchQuery
                              ? `No patients match "${searchQuery}" in the authorization queue.`
                              : "All HMO clearance requests have been processed! No patients are currently waiting."
                          }
                          actionLabel={searchQuery ? "Clear Search" : "Refresh"}
                          onAction={searchQuery ? () => setSearchQuery("") : () => fetchData(true)}
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-base-200">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                          <div className="col-span-1">#</div>
                          <div className="col-span-4">Patient Profile</div>
                          <div className="col-span-2">Hospital ID</div>
                          <div className="col-span-3">Insurance Policy</div>
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

                                <div className="col-span-2">
                                  <span className="font-mono font-bold text-xs px-2 py-1 rounded bg-base-200 text-base-content/80">
                                    {item.displayId}
                                  </span>
                                </div>

                                <div className="col-span-3 min-w-0 pr-2">
                                  <div className="font-bold text-base-content truncate text-xs">
                                    {item.hmoProvider}
                                  </div>
                                  <div className="text-[11px] text-base-content/50 font-mono truncate">
                                    ID: {item.hmoPolicy}
                                  </div>
                                </div>

                                <div className="col-span-2 flex justify-end">
                                  <button
                                    onClick={() => handleReviewPatient(item)}
                                    className="btn btn-xs btn-primary gap-1 font-bold shadow-2xs"
                                  >
                                    <span>Review</span>
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
                                <div className="flex items-center justify-between text-xs bg-base-200/50 p-2 rounded-lg">
                                  <span className="font-semibold text-base-content/70">{item.hmoProvider}</span>
                                  <span className="font-mono text-base-content/60">Policy: {item.hmoPolicy}</span>
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                  <span className="text-[11px] text-base-content/50">
                                    {item.updatedAt ? formatNigeriaTime(item.updatedAt) : "—"}
                                  </span>
                                  <button
                                    onClick={() => handleReviewPatient(item)}
                                    className="btn btn-xs btn-primary gap-1 font-bold"
                                  >
                                    <span>Review Claims</span>
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

                {/* TAB 2 CONTENT: RECENT CLAIMS DECISIONS */}
                {activeTab === "recent_claims" && (
                  <div>
                    {filteredClaims.length === 0 ? (
                      <div className="py-14">
                        <EmptyState
                          title="No reviewed claims found"
                          description={
                            searchQuery
                              ? `No claims matched "${searchQuery}".`
                              : "No HMO claims have been reviewed yet."
                          }
                          actionLabel="Clear Filter"
                          onAction={() => setSearchQuery("")}
                        />
                      </div>
                    ) : (
                      <div className="divide-y divide-base-200">
                        {/* Table Header */}
                        <div className="hidden md:grid grid-cols-12 gap-2 px-5 py-3 bg-base-200/60 text-xs font-semibold text-base-content/50 uppercase tracking-wider">
                          <div className="col-span-3">Patient</div>
                          <div className="col-span-2">Hospital ID</div>
                          <div className="col-span-2">Decision</div>
                          <div className="col-span-2">HMO Covered</div>
                          <div className="col-span-2">Patient Owes</div>
                          <div className="col-span-1 text-right">Date</div>
                        </div>

                        {filteredClaims.map((claim) => (
                          <div
                            key={claim.id}
                            className="p-4 md:px-5 md:py-3.5 hover:bg-base-200/40 transition-colors"
                          >
                            {/* Desktop Row */}
                            <div className="hidden md:grid grid-cols-12 gap-2 items-center text-xs">
                              <div className="col-span-3 min-w-0 pr-2">
                                <p className="font-bold text-base-content truncate">{claim.name}</p>
                                <p className="text-[11px] text-base-content/50 truncate">{claim.hmoProvider}</p>
                              </div>

                              <div className="col-span-2">
                                <span className="font-mono text-xs font-bold text-base-content/80">
                                  {claim.hospitalId}
                                </span>
                              </div>

                              <div className="col-span-2">
                                {getDecisionBadge(claim.decision)}
                              </div>

                              <div className="col-span-2 font-bold text-success">
                                ₦{claim.hmoCovered.toLocaleString()}
                              </div>

                              <div className="col-span-2 font-semibold text-base-content/70">
                                ₦{claim.patientOwes.toLocaleString()}
                              </div>

                              <div className="col-span-1 text-right text-[11px] text-base-content/50">
                                {claim.reviewedAt ? formatNigeriaDate(claim.reviewedAt) : "—"}
                              </div>
                            </div>

                            {/* Mobile Row */}
                            <div className="block md:hidden space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="font-bold text-sm text-base-content">{claim.name}</p>
                                {getDecisionBadge(claim.decision)}
                              </div>
                              <div className="flex items-center justify-between text-xs text-base-content/60">
                                <span>{claim.hospitalId}</span>
                                <span>Covered: <strong className="text-success font-bold">₦{claim.hmoCovered.toLocaleString()}</strong></span>
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
                    to={activeTab === "queue" ? "/dashboard/hmo/incoming" : "/dashboard/hmo/patients"}
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1.5"
                  >
                    <span>View all in {activeTab === "queue" ? "Incoming Queue" : "HMO Patients"}</span>
                    <FaArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: REAL PROVIDER BREAKDOWN & EXPIRY HEALTH (4 COLS) */}
            <div className="lg:col-span-4 space-y-5">
              
              {/* Card 1: Top HMO Providers Distribution */}
              <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <FaShieldAlt className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm text-base-content">Top Providers</h3>
                  </div>
                  <span className="text-xs text-base-content/50 font-medium">{providerStats.total} policies</span>
                </div>

                {providerStats.list.length === 0 ? (
                  <p className="text-xs text-base-content/50 italic py-3 text-center">No provider records yet</p>
                ) : (
                  <div className="space-y-3">
                    {providerStats.list.map((prov, i) => {
                      const percent = providerStats.total > 0 ? Math.round((prov.count / providerStats.total) * 100) : 0;
                      return (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="font-bold text-base-content/80 truncate max-w-[160px]">{prov.name}</span>
                            <span className="text-base-content/60 font-semibold">{prov.count} ({percent}%)</span>
                          </div>
                          <div className="w-full bg-base-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-primary h-full rounded-full transition-all duration-500"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Card 2: Real Patient Policy Expirations Alert */}
              <div className="card bg-base-100 border border-base-300 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-warning/10 text-warning">
                      <FaClock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-base-content">Policy Expirations</h3>
                      <p className="text-[11px] text-base-content/50">Patient policy renewal tracking</p>
                    </div>
                  </div>
                  {stats.expiredCount > 0 && (
                    <span className="badge badge-error badge-xs font-bold text-white">
                      {stats.expiredCount} Expired
                    </span>
                  )}
                </div>

                {policyExpirations.length === 0 ? (
                  <div className="py-4 text-center text-xs text-base-content/60">
                    <FaCheckCircle className="w-5 h-5 text-success mx-auto mb-1.5 opacity-80" />
                    <p className="font-semibold text-base-content">All Policies Up to Date</p>
                    <p className="text-[11px] text-base-content/50 mt-0.5">No expired or expiring patient policies found.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-base-200">
                    {policyExpirations.map((item) => {
                      return (
                        <div key={item.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-bold text-base-content truncate">{item.patientName}</p>
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-base-200 text-primary">
                                {item.hospitalId}
                              </span>
                            </div>
                            <p className="text-[11px] text-base-content/60 truncate mt-0.5">
                              <span className="font-semibold text-base-content/80">{item.provider}</span> • ID: {item.memberId}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className={`badge badge-xs font-bold ${
                              item.isExpired 
                                ? "badge-error text-white" 
                                : item.diffDays <= 30 
                                  ? "badge-warning" 
                                  : "badge-ghost"
                            }`}>
                              {item.isExpired ? "Expired" : `${item.diffDays}d left`}
                            </span>
                            <div className="text-[10px] text-base-content/40 mt-0.5">
                              {formatNigeriaDate(item.expiresAt)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="pt-2 border-t border-base-200 text-center">
                  <Link
                    to="/dashboard/hmo/patients"
                    className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <span>Manage all patient plans</span>
                    <FaExternalLinkAlt className="w-2.5 h-2.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </HmoLayout>
  );
};

export default HmoDashboard;
