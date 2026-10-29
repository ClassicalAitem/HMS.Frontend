/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaUsers,
  FaUserInjured,
  FaBed,
  FaProcedures,
  FaVial,
  FaBabyCarriage,
  FaSun,
  FaBoxes,
  FaIdCard,
  FaUserMd,
  FaArrowRight,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSync,
  FaCalendarAlt,
  FaClock,
  FaSearch,
  FaNotesMedical,
  FaUserCheck,
} from "react-icons/fa";
import { MdPregnantWoman, MdAnalytics, MdOutlineDashboard } from "react-icons/md";
import { TbStethoscope, TbChartDots2 } from "react-icons/tb";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import { getPatients } from "@/services/api/patientsAPI";
import { getAllDependants } from "@/services/api/dependantAPI";
import { getAllOpdPatients } from "@/services/api/opdPatientAPI";
import { getAdmissions } from "@/services/api/admissionApi";
import { getAllSurgeries } from "@/services/api/surgeryAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getAllAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { getConsultations } from "@/services/api/consultationAPI";
import { getInventories } from "@/services/api/inventoryAPI";
import { getLaboratoryInventories } from "@/services/api/labInventoryApi";
import { usersAPI } from "@/services/api/usersAPI";
import { getCachedData, clearAdminCache } from "@/utils/adminDataCache";
import metricsAPI, {
  getMetrics,
  getOverallMetrics,
  getStaffMetrics,
  getOverallStaff,
} from "@/services/api/metricsAPI";

const safeGetMetrics = async () => {
  try {
    if (typeof metricsAPI?.getOverallMetrics === "function") return await metricsAPI.getOverallMetrics();
    if (typeof metricsAPI?.getMetrics === "function") return await metricsAPI.getMetrics();
    if (typeof getOverallMetrics === "function") return await getOverallMetrics();
    if (typeof getMetrics === "function") return await getMetrics();
    return null;
  } catch (e) {
    return null;
  }
};

const safeGetStaffMetrics = async () => {
  try {
    if (typeof metricsAPI?.getOverallStaff === "function") return await metricsAPI.getOverallStaff();
    if (typeof metricsAPI?.getStaffMetrics === "function") return await metricsAPI.getStaffMetrics();
    if (typeof getOverallStaff === "function") return await getOverallStaff();
    if (typeof getStaffMetrics === "function") return await getStaffMetrics();
    return null;
  } catch (e) {
    return null;
  }
};

import { formatNigeriaDate, formatNigeriaTime, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

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

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const formatPersonName = (subject) => {
  if (!subject) return "—";
  if (typeof subject === "string") return subject;
  const firstName = subject.firstName || subject.fname || subject.fullName?.split(" ")[0] || "";
  const lastName = subject.lastName || subject.lname || subject.fullName?.split(" ").slice(1).join(" ") || "";
  return [firstName, lastName].filter(Boolean).join(" ").trim() || subject.fullName || subject.name || "—";
};

const formatDoctorName = (rawName, docUser) => {
  if (rawName && typeof rawName === "string" && rawName.trim()) {
    const clean = rawName.trim();
    return clean.toLowerCase().startsWith("dr") ? clean : `Dr. ${clean}`;
  }
  if (docUser) {
    const name = `${docUser.firstName || ""} ${docUser.lastName || ""}`.trim() || docUser.fullName || docUser.name;
    if (name) {
      return name.toLowerCase().startsWith("dr") ? name : `Dr. ${name}`;
    }
  }
  return "Dr. Attending";
};

const CHART_COLORS = ["#0052CC", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [attendedSearch, setAttendedSearch] = useState("");
  const [attendedTab, setAttendedTab] = useState("all"); // 'all' | 'consultation' | 'antenatal'
  const [attendedPage, setAttendedPage] = useState(1);
  const attendedPerPage = 8;

  const [dashboardData, setDashboardData] = useState({
    patients: [],
    dependants: [],
    opdPatients: [],
    admissions: [],
    surgeries: [],
    labResults: [],
    antenatal: [],
    consultations: [],
    inventories: [],
    labInventories: [],
    users: [],
    metrics: null,
    staffCounts: null,
  });

  const fetchDashboardData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getCachedData(
        "admin_dashboard_metrics",
        async () => {
          const [
            patRes,
            depRes,
            opdRes,
            admRes,
            surgRes,
            labRes,
            ancRes,
            consultRes,
            invRes,
            labInvRes,
            usersRes,
            metricsRes,
            staffMetricsRes,
          ] = await Promise.allSettled([
            getPatients({ limit: 100 }),
            getAllDependants(),
            getAllOpdPatients({ limit: 50 }),
            getAdmissions(),
            getAllSurgeries(),
            getLabResults({ limit: 50 }),
            getAllAnteNatalRecords(),
            getConsultations(),
            getInventories(),
            getLaboratoryInventories(),
            usersAPI.getUsers(),
            safeGetMetrics(),
            safeGetStaffMetrics(),
          ]);

          return {
            patients: patRes.status === "fulfilled" ? extractArray(patRes.value) : [],
            dependants: depRes.status === "fulfilled" ? extractArray(depRes.value) : [],
            opdPatients: opdRes.status === "fulfilled" ? extractArray(opdRes.value) : [],
            admissions: admRes.status === "fulfilled" ? extractArray(admRes.value) : [],
            surgeries: surgRes.status === "fulfilled" ? extractArray(surgRes.value) : [],
            labResults: labRes.status === "fulfilled" ? extractArray(labRes.value) : [],
            antenatal: ancRes.status === "fulfilled" ? extractArray(ancRes.value) : [],
            consultations: consultRes.status === "fulfilled" ? extractArray(consultRes.value) : [],
            inventories: invRes.status === "fulfilled" ? extractArray(invRes.value) : [],
            labInventories: labInvRes.status === "fulfilled" ? extractArray(labInvRes.value) : [],
            users: usersRes.status === "fulfilled" ? extractArray(usersRes.value) : [],
            metrics: metricsRes.status === "fulfilled" ? metricsRes.value?.data || metricsRes.value : null,
            staffCounts: staffMetricsRes.status === "fulfilled" ? staffMetricsRes.value?.data || staffMetricsRes.value : null,
          };
        },
        60000,
        forceRefresh
      );

      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard synchronization error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  // Lookup maps for fast and accurate name/ID resolution
  const patientMap = useMemo(() => {
    const map = new Map();
    (dashboardData.patients || []).forEach((p) => {
      const id = String(p.id || p._id || "");
      if (id) map.set(id, p);
    });
    return map;
  }, [dashboardData.patients]);

  const dependantMap = useMemo(() => {
    const map = new Map();
    (dashboardData.dependants || []).forEach((d) => {
      const id = String(d.id || d._id || "");
      if (id) map.set(id, d);
    });
    return map;
  }, [dashboardData.dependants]);

  const userMap = useMemo(() => {
    const map = new Map();
    (dashboardData.users || []).forEach((u) => {
      const id = String(u.id || u._id || "");
      if (id) map.set(id, u);
    });
    return map;
  }, [dashboardData.users]);

  // Aggregate Metrics Calculations (Clinical & Operational, Zero Financial Info)
  const totalCardsOpened = dashboardData.patients.length + dashboardData.dependants.length;
  const totalInpatients = dashboardData.admissions.filter((a) => a.status?.toLowerCase() !== "discharged").length;
  const totalDischarged = dashboardData.admissions.filter((a) => a.status?.toLowerCase() === "discharged").length;
  const totalSurgeries = dashboardData.surgeries.length;
  const totalDiagnostics = dashboardData.labResults.length;
  const criticalFindings = dashboardData.labResults.filter((l) => {
    const f = l.result?.[0]?.flag;
    return f === "C" || f === "H";
  }).length;

  const totalAntenatal = dashboardData.antenatal.length;
  const totalSvdCases = dashboardData.antenatal.filter((a) => {
    const mode = (a.deliveryMode || a.modeOfDelivery || "").toLowerCase();
    return mode.includes("svd") || mode.includes("vaginal");
  }).length;

  const totalStockCount = dashboardData.inventories.length + dashboardData.labInventories.length;
  const lowStockCount =
    dashboardData.inventories.filter((i) => Number(i.stock || 0) <= Number(i.reorderLevel || 10)).length +
    dashboardData.labInventories.filter((i) => Number(i.stock || 0) <= Number(i.reorderLevel || 10)).length;

  const hmoAttendanceCount = dashboardData.patients.filter(
    (p) => p.hmo?.provider || p.cardType?.toLowerCase().includes("hmo")
  ).length;

  // Extract Attended Today by Doctors:
  // 1. Creation of consultation
  // 2. Creation of antenatal
  // 3. Editing of antenatal
  const attendedTodayList = useMemo(() => {
    const events = [];

    // 1. Consultations Created Today
    (dashboardData.consultations || []).forEach((c) => {
      if (!isToday(c?.createdAt)) return;

      const pId = typeof c.patientId === "object" ? (c.patientId?.id || c.patientId?._id) : c.patientId;
      const dId = typeof c.dependantId === "object" ? (c.dependantId?.id || c.dependantId?._id) : (c.dependantId || null);

      const patientObj = (typeof c.patientId === "object" && c.patientId) ? c.patientId : (c.patient || (pId ? patientMap.get(String(pId)) : null));
      const dependantObj = (typeof c.dependantId === "object" && c.dependantId) ? c.dependantId : (c.dependant || (dId ? dependantMap.get(String(dId)) : null));

      const isDependant = !!dId;
      const patientName = isDependant
        ? formatPersonName(dependantObj)
        : formatPersonName(patientObj);

      const hospitalId = isDependant
        ? (dependantObj?.hospitalId || patientObj?.hospitalId || dId || "—")
        : (patientObj?.hospitalId || pId || "—");

      const guardianName = isDependant ? formatPersonName(patientObj) : null;

      const docUser = c.doctor || (c.doctorId ? userMap.get(String(c.doctorId)) : null);
      const doctorName = formatDoctorName(c.doctorName, docUser);

      events.push({
        id: `consult-${c.id || c._id || Math.random()}`,
        category: "consultation",
        activity: "Consultation Created",
        activityBadgeClass: "badge-primary text-primary-content",
        doctorName,
        patientName: patientName || "Patient",
        hospitalId,
        isDependant,
        guardianName,
        timestamp: c.createdAt,
        timeFormatted: c.createdAt ? formatNigeriaTime(c.createdAt) : "—",
        dateFormatted: c.createdAt ? formatNigeriaDate(c.createdAt) : "—",
        notes: c.diagnosis || c.visitReason || c.complaint || "Clinical consultation recorded",
      });
    });

    // 2. Antenatal Records (Created or Edited Today)
    (dashboardData.antenatal || []).forEach((doc) => {
      const pId = typeof doc.patientId === "object" ? (doc.patientId?.id || doc.patientId?._id) : doc.patientId;
      const patientObj = (typeof doc.patientId === "object" && doc.patientId) ? doc.patientId : (doc.patient || (pId ? patientMap.get(String(pId)) : null));
      const baseHospitalId = patientObj?.hospitalId || pId || "—";

      (doc.anteNatalRecords || []).forEach((record, recIdx) => {
        const dId = record.dependantId;
        const dependantObj = record.dependant || (dId ? dependantMap.get(String(dId)) : null);
        const isDependant = !!dId;
        const patientName = isDependant
          ? formatPersonName(dependantObj)
          : formatPersonName(patientObj);
        const hospitalId = isDependant
          ? (dependantObj?.hospitalId || baseHospitalId)
          : baseHospitalId;
        const guardianName = isDependant ? formatPersonName(patientObj) : null;

        // A. Created Today
        if (isToday(record.createdAt)) {
          const creatorUser = record.creator || (record.createdById || record.doctorId ? userMap.get(String(record.createdById || record.doctorId)) : null);
          const doctorName = formatDoctorName(record.createdByName, creatorUser);

          events.push({
            id: `anc-create-${record._id || recIdx}-${record.createdAt}`,
            category: "antenatal",
            activity: "Antenatal Created",
            activityBadgeClass: "badge-accent text-accent-content",
            doctorName,
            patientName: patientName || "Antenatal Patient",
            hospitalId,
            isDependant,
            guardianName,
            timestamp: record.createdAt,
            timeFormatted: record.createdAt ? formatNigeriaTime(record.createdAt) : "—",
            dateFormatted: record.createdAt ? formatNigeriaDate(record.createdAt) : "—",
            notes: "New antenatal booking & medical history recorded",
          });
        }

        // B. Edited Today
        if (Array.isArray(record.editHistory) && record.editHistory.length > 0) {
          record.editHistory.forEach((edit, editIdx) => {
            if (edit.action === "Created Record" || !isToday(edit.editedAt)) return;

            const editorUser = edit.editedById ? userMap.get(String(edit.editedById)) : null;
            const doctorName = formatDoctorName(edit.editedByName, editorUser);

            events.push({
              id: `anc-edit-${record._id || recIdx}-${editIdx}-${edit.editedAt}`,
              category: "antenatal",
              activity: "Antenatal Updated",
              activityBadgeClass: "badge-warning text-warning-content",
              doctorName,
              patientName: patientName || "Antenatal Patient",
              hospitalId,
              isDependant,
              guardianName,
              timestamp: edit.editedAt,
              timeFormatted: edit.editedAt ? formatNigeriaTime(edit.editedAt) : "—",
              dateFormatted: edit.editedAt ? formatNigeriaDate(edit.editedAt) : "—",
              notes: edit.changesSummary || edit.action || "Antenatal routine examination/follow-up updated",
            });
          });
        } else if (
          record.updatedAt &&
          isToday(record.updatedAt) &&
          (!record.createdAt || new Date(record.updatedAt).getTime() - new Date(record.createdAt).getTime() > 60000)
        ) {
          // Fallback if editHistory array is empty but record was updated today
          const updaterUser = record.updater || (record.updatedById ? userMap.get(String(record.updatedById)) : null);
          const doctorName = formatDoctorName(record.updatedByName, updaterUser);

          events.push({
            id: `anc-update-${record._id || recIdx}-${record.updatedAt}`,
            category: "antenatal",
            activity: "Antenatal Updated",
            activityBadgeClass: "badge-warning text-warning-content",
            doctorName,
            patientName: patientName || "Antenatal Patient",
            hospitalId,
            isDependant,
            guardianName,
            timestamp: record.updatedAt,
            timeFormatted: record.updatedAt ? formatNigeriaTime(record.updatedAt) : "—",
            dateFormatted: record.updatedAt ? formatNigeriaDate(record.updatedAt) : "—",
            notes: "Antenatal record updated",
          });
        }
      });
    });

    // Sort all events newest first
    return events.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
  }, [dashboardData.consultations, dashboardData.antenatal, patientMap, dependantMap, userMap]);

  // Filtered attended-today records
  const filteredAttendedToday = useMemo(() => {
    const q = attendedSearch.trim().toLowerCase();
    return attendedTodayList.filter((item) => {
      if (attendedTab === "consultation" && item.category !== "consultation") return false;
      if (attendedTab === "antenatal" && item.category !== "antenatal") return false;
      if (!q) return true;
      return (
        item.doctorName.toLowerCase().includes(q) ||
        item.patientName.toLowerCase().includes(q) ||
        String(item.hospitalId).toLowerCase().includes(q) ||
        item.activity.toLowerCase().includes(q) ||
        item.notes.toLowerCase().includes(q)
      );
    });
  }, [attendedTodayList, attendedSearch, attendedTab]);

  const totalAttendedPages = Math.max(1, Math.ceil(filteredAttendedToday.length / attendedPerPage));
  const paginatedAttended = useMemo(() => {
    const start = (attendedPage - 1) * attendedPerPage;
    return filteredAttendedToday.slice(start, start + attendedPerPage);
  }, [filteredAttendedToday, attendedPage]);

  const consultEventsCount = attendedTodayList.filter((e) => e.category === "consultation").length;
  const antenatalEventsCount = attendedTodayList.filter((e) => e.category === "antenatal").length;

  // Departmental Staff Breakdown for Pie Chart
  const staffChartData = useMemo(() => {
    const staff = dashboardData.users;
    const counts = {
      Doctors: 0,
      Nurses: 0,
      Pharmacists: 0,
      "Lab Scientists": 0,
      Cashiers: 0,
      "Front Desk": 0,
      Administrators: 0,
    };

    staff.forEach((u) => {
      const type = (u.accountType || "").toLowerCase();
      if (type.includes("doctor") || type.includes("surgeon")) counts.Doctors++;
      else if (type.includes("nurse")) counts.Nurses++;
      else if (type.includes("pharm")) counts.Pharmacists++;
      else if (type.includes("lab") || type.includes("sono")) counts["Lab Scientists"]++;
      else if (type.includes("cashier")) counts.Cashiers++;
      else if (type.includes("front")) counts["Front Desk"]++;
      else counts.Administrators++;
    });

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .filter((d) => d.value > 0);
  }, [dashboardData.users]);

  // Activity Overview for Bar Chart
  const activityChartData = useMemo(() => {
    return [
      { name: "Registrations", count: totalCardsOpened },
      { name: "OPD Visits", count: dashboardData.opdPatients.length },
      { name: "Inpatients", count: dashboardData.admissions.length },
      { name: "Surgeries", count: totalSurgeries },
      { name: "Diagnostics", count: totalDiagnostics },
      { name: "Maternity", count: totalAntenatal },
      { name: "HMO Visits", count: hmoAttendanceCount },
    ];
  }, [
    totalCardsOpened,
    dashboardData.opdPatients.length,
    dashboardData.admissions.length,
    totalSurgeries,
    totalDiagnostics,
    totalAntenatal,
    hmoAttendanceCount,
  ]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Executive Banner */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary">
                Executive Command
              </span>
              <span className="text-xs text-base-content/60">
                Hospital Administration & Live Operations
              </span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Admin Overseeing Dashboard
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Comprehensive real-time reporting across patient cards, admissions, consultations, procedures, lab investigations, and inventory.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                clearAdminCache("admin_dashboard_metrics");
                setRefreshKey((k) => k + 1);
              }}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-base-200 hover:bg-base-300 text-base-content transition-colors"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Stats</span>
            </button>

            <Link
              to="/dashboard/admin/reports"
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm"
            >
              <MdAnalytics className="w-4 h-4" />
              <span>Full Reports Hub</span>
            </Link>
          </div>
        </div>

        {/* 11 Overseeing KPI Cards Grid (Financial Info Removed, Doctor Attendances Highlighted) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {/* 1. Card Opening / Patients */}
          <Link
            to="/dashboard/admin/patients"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Card Opening / Registry</span>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <FaUsers className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{totalCardsOpened}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>{dashboardData.patients.length} Principals · {dashboardData.dependants.length} Dependants</span>
              <FaArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 2. Inpatients & Admissions */}
          <Link
            to="/dashboard/admin/admissions"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-warning/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Inpatient Admissions</span>
              <div className="p-2.5 rounded-xl bg-warning/10 text-warning group-hover:scale-105 transition-transform">
                <FaBed className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{totalInpatients}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>{dashboardData.admissions.length} Total · {totalDischarged} Discharged</span>
              <FaArrowRight className="w-3 h-3 text-warning opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 3. OPD Patients */}
          <Link
            to="/dashboard/admin/opd"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-secondary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">OPD Patients</span>
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary group-hover:scale-105 transition-transform">
                <FaUserInjured className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{dashboardData.opdPatients.length}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>Ambulatory outpatient attendances</span>
              <FaArrowRight className="w-3 h-3 text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 4. Procedures & Surgeries */}
          <Link
            to="/dashboard/admin/surgeries"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-error/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Procedures & Surgeries</span>
              <div className="p-2.5 rounded-xl bg-error/10 text-error group-hover:scale-105 transition-transform">
                <FaProcedures className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{totalSurgeries}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>Operating theatre & appointments</span>
              <FaArrowRight className="w-3 h-3 text-error opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 5. Diagnostics (Lab & Sonography) */}
          <Link
            to="/dashboard/admin/diagnostics"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-info/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Lab & Sonography</span>
              <div className="p-2.5 rounded-xl bg-info/10 text-info group-hover:scale-105 transition-transform">
                <FaVial className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{totalDiagnostics}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span className="text-error font-medium">{criticalFindings} Critical findings</span>
              <FaArrowRight className="w-3 h-3 text-info opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 6. Antenatal & Maternity / SVD */}
          <Link
            to="/dashboard/admin/antenatal"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-accent/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Antenatal & SVD / Maternity</span>
              <div className="p-2.5 rounded-xl bg-accent/10 text-accent group-hover:scale-105 transition-transform">
                <MdPregnantWoman className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{totalAntenatal}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>{totalSvdCases} Normal Deliveries (SVD)</span>
              <FaArrowRight className="w-3 h-3 text-accent opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 7. Phototherapy Unit */}
          <Link
            to="/dashboard/admin/phototherapy"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-warning/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Phototherapy Unit</span>
              <div className="p-2.5 rounded-xl bg-warning/10 text-warning group-hover:scale-105 transition-transform">
                <FaSun className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">Active</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>NICU Jaundice & Incubator Care</span>
              <FaArrowRight className="w-3 h-3 text-warning opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 8. Drugs & Consumables */}
          <Link
            to="/dashboard/admin/stocks"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-purple-500/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Drugs & Consumables</span>
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 group-hover:scale-105 transition-transform">
                <FaBoxes className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{totalStockCount}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span className="text-warning font-medium">{lowStockCount} Need restock</span>
              <FaArrowRight className="w-3 h-3 text-purple-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 9. Attended Today by Doctors (Replaced Financial Invoices/Revenue) */}
          <div
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Attended Today (Doctors)</span>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <FaUserMd className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{attendedTodayList.length}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>{consultEventsCount} Consults · {antenatalEventsCount} Antenatal</span>
              <span className="text-primary font-bold">Today</span>
            </div>
          </div>

          {/* 10. HMO Attendance */}
          <Link
            to="/dashboard/admin/hmo-attendance"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-primary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">HMO Attendance</span>
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary group-hover:scale-105 transition-transform">
                <FaIdCard className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{hmoAttendanceCount}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>Managed health enrollees</span>
              <FaArrowRight className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 11. Staff Management */}
          <Link
            to="/dashboard/admin/users"
            className="p-5 rounded-2xl bg-base-100 border border-base-200 hover:border-secondary/50 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Hospital Staff</span>
              <div className="p-2.5 rounded-xl bg-secondary/10 text-secondary group-hover:scale-105 transition-transform">
                <TbStethoscope className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-base-content mt-2">{dashboardData.users.length}</h3>
            <div className="flex items-center justify-between text-xs text-base-content/60 mt-1">
              <span>Clinical & administrative roster</span>
              <FaArrowRight className="w-3 h-3 text-secondary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </Link>

          {/* 12. Full Executive Reports Shortcut */}
          <Link
            to="/dashboard/admin/reports"
            className="p-5 rounded-2xl bg-primary text-primary-content border border-primary hover:bg-primary/90 hover:shadow-md transition-all group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-content/80">Full Reports Hub</span>
              <div className="p-2.5 rounded-xl bg-white/20 text-white">
                <MdAnalytics className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-2">
              <h3 className="text-2xl font-extrabold">All 12 Modules</h3>
              <p className="text-xs text-primary-content/80 mt-1">
                Filter by date, search, and export CSV reports.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold mt-2">
              <span>Explore Reports</span>
              <FaArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>

        {/* ========================================================================= */}
        {/* NEW DEDICATED SECTION: Attended Today by Doctors */}
        {/* ========================================================================= */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-base-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FaUserCheck className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-base-content">
                  Attended Today by Doctors
                </h3>
                <span className="badge badge-primary badge-sm font-semibold">
                  {attendedTodayList.length} Today
                </span>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                Live registry of patients attended today for consultation creation, antenatal bookings, and antenatal edits.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Category Filter Tabs */}
              <div className="join bg-base-200 p-1 rounded-xl text-xs">
                <button
                  type="button"
                  className={`join-item px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    attendedTab === "all" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/70 hover:text-base-content"
                  }`}
                  onClick={() => {
                    setAttendedTab("all");
                    setAttendedPage(1);
                  }}
                >
                  All ({attendedTodayList.length})
                </button>
                <button
                  type="button"
                  className={`join-item px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    attendedTab === "consultation" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/70 hover:text-base-content"
                  }`}
                  onClick={() => {
                    setAttendedTab("consultation");
                    setAttendedPage(1);
                  }}
                >
                  Consultations ({consultEventsCount})
                </button>
                <button
                  type="button"
                  className={`join-item px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    attendedTab === "antenatal" ? "bg-base-100 text-primary shadow-xs" : "text-base-content/70 hover:text-base-content"
                  }`}
                  onClick={() => {
                    setAttendedTab("antenatal");
                    setAttendedPage(1);
                  }}
                >
                  Antenatal ({antenatalEventsCount})
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
                <input
                  type="text"
                  placeholder="Search doctor, patient, ID..."
                  value={attendedSearch}
                  onChange={(e) => {
                    setAttendedSearch(e.target.value);
                    setAttendedPage(1);
                  }}
                  className="input input-sm input-bordered pl-9 pr-3 text-xs w-full sm:w-56 rounded-xl"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-zebra w-full text-left text-xs">
              <thead className="bg-base-200/60 uppercase font-bold text-base-content">
                <tr>
                  <th className="py-3 px-3">Time</th>
                  <th className="px-3">Attending Doctor</th>
                  <th className="px-3">Patient Attended</th>
                  <th className="px-3">Clinical Activity</th>
                  <th className="px-3">Details / Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {paginatedAttended.map((item) => (
                  <tr key={item.id} className="hover:bg-base-200/40 transition-colors">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-mono text-base-content/80">
                        <FaClock className="w-3 h-3 text-primary/70 shrink-0" />
                        <span>{item.timeFormatted}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                          <FaUserMd className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-semibold text-base-content whitespace-nowrap">
                          {item.doctorName}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-base-content">
                            {item.patientName}
                          </span>
                          {item.isDependant && (
                            <span className="badge badge-secondary badge-xs font-medium">
                              Dependant
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-base-content/60 mt-0.5">
                          <span>Hospital ID: <strong className="text-primary">{item.hospitalId}</strong></span>
                          {item.guardianName && <span>· Guardian: {item.guardianName}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`badge badge-sm font-semibold ${item.activityBadgeClass}`}>
                        {item.activity}
                      </span>
                    </td>
                    <td className="px-3 py-3 max-w-xs truncate text-base-content/75" title={item.notes}>
                      {item.notes}
                    </td>
                  </tr>
                ))}

                {paginatedAttended.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-base-content/50">
                      <FaUserCheck className="w-10 h-10 mx-auto text-base-content/20 mb-2" />
                      <p className="font-semibold text-sm">No doctor attendances recorded yet today</p>
                      <p className="text-xs text-base-content/40 mt-0.5">
                        {attendedSearch
                          ? `No records match your search "${attendedSearch}"`
                          : "Patients attended for consultations or antenatal care today will appear here in real time."}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalAttendedPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t border-base-200 text-xs">
              <span className="text-base-content/60">
                Showing {(attendedPage - 1) * attendedPerPage + 1} to{" "}
                {Math.min(attendedPage * attendedPerPage, filteredAttendedToday.length)} of{" "}
                {filteredAttendedToday.length} attendances
              </span>
              <div className="join">
                <button
                  type="button"
                  className="join-item btn btn-xs btn-outline"
                  disabled={attendedPage <= 1}
                  onClick={() => setAttendedPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button type="button" className="join-item btn btn-xs btn-ghost no-animation">
                  Page {attendedPage} of {totalAttendedPages}
                </button>
                <button
                  type="button"
                  className="join-item btn btn-xs btn-outline"
                  disabled={attendedPage >= totalAttendedPages}
                  onClick={() => setAttendedPage((p) => Math.min(totalAttendedPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Analytical Visuals Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-w-0">
          {/* Activity Volume Bar Chart */}
          <div className="lg:col-span-7 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-base-content">
                  Hospital Care Volume by Department
                </h3>
                <p className="text-xs text-base-content/60">
                  Real-time operational volume across key clinical touchpoints
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-base-200 rounded-lg text-base-content/70">
                Live Metrics
              </span>
            </div>

            <div className="w-full min-w-0" style={{ height: 260, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                <BarChart data={activityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-base-100, #fff)",
                      borderColor: "var(--color-base-300, #e5e7eb)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="count" fill="#0052CC" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Departmental Staff Distribution Donut Chart */}
          <div className="lg:col-span-5 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4 min-w-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-base-content">
                  Staff Role Distribution
                </h3>
                <p className="text-xs text-base-content/60">
                  Personnel allocation across medical and support services
                </p>
              </div>
              <span className="text-xs font-bold text-primary">
                {dashboardData.users.length} Total
              </span>
            </div>

            <div className="w-full min-w-0" style={{ height: 260, minHeight: 260 }}>
              <ResponsiveContainer width="100%" height={260} minWidth={0} minHeight={260}>
                <PieChart>
                  <Pie
                    data={staffChartData}
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {staffChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--color-base-100, #fff)",
                      borderColor: "var(--color-base-300, #e5e7eb)",
                      borderRadius: "0.75rem",
                      fontSize: "12px",
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Quick Overseeing Tables: Recent Card Openings & Active Inpatients */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Card Openings */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-base-content">
                  Recent Card Openings & Registrations
                </h3>
                <p className="text-xs text-base-content/60">
                  Newest patients registered into the hospital system
                </p>
              </div>
              <Link
                to="/dashboard/admin/patients"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View All</span>
                <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left text-xs">
                <thead className="bg-base-200/60 uppercase font-bold text-base-content">
                  <tr>
                    <th className="py-2.5 px-3">Hospital ID</th>
                    <th className="px-3">Patient Name</th>
                    <th className="px-3">Scheme</th>
                    <th className="px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {dashboardData.patients.slice(0, 5).map((p, idx) => (
                    <tr key={p._id || idx} className="hover:bg-base-200/40">
                      <td className="px-3 py-2.5 font-semibold text-primary">{p.hospitalId || "—"}</td>
                      <td className="px-3 py-2.5 font-medium text-base-content">{formatPersonName(p)}</td>
                      <td className="px-3 py-2.5 text-base-content/70">
                        {p.hmo?.provider ? `HMO (${p.hmo.provider})` : "Private"}
                      </td>
                      <td className="px-3 py-2.5 text-base-content/60 whitespace-nowrap">
                        {p.createdAt ? formatNigeriaDate(p.createdAt) : "—"}
                      </td>
                    </tr>
                  ))}
                  {dashboardData.patients.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-base-content/50">
                        No registrations recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Active Inpatients & Wards */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-base-content">
                  Active Inpatient Hospitalizations
                </h3>
                <p className="text-xs text-base-content/60">
                  Currently admitted patients and allocated wards
                </p>
              </div>
              <Link
                to="/dashboard/admin/admissions"
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <span>View Wards</span>
                <FaArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left text-xs">
                <thead className="bg-base-200/60 uppercase font-bold text-base-content">
                  <tr>
                    <th className="py-2.5 px-3">Patient Name</th>
                    <th className="px-3">Ward</th>
                    <th className="px-3">Bed No</th>
                    <th className="px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200">
                  {dashboardData.admissions
                    .filter((a) => a.status?.toLowerCase() !== "discharged")
                    .slice(0, 5)
                    .map((adm, idx) => (
                      <tr key={adm._id || idx} className="hover:bg-base-200/40">
                        <td className="px-3 py-2.5 font-medium text-base-content">
                          {formatPersonName(adm.patient) || adm.patientName || "Inpatient"}
                        </td>
                        <td className="px-3 py-2.5 text-base-content/80">
                          {adm.ward?.name || adm.wardName || "General Ward"}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-base-content/70">{adm.bedNumber || "Allocated"}</td>
                        <td className="px-3 py-2.5">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning/10 text-warning">
                            Admitted
                          </span>
                        </td>
                      </tr>
                    ))}
                  {dashboardData.admissions.filter((a) => a.status?.toLowerCase() !== "discharged").length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-base-content/50">
                        No currently admitted patients.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
