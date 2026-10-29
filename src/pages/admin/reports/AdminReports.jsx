/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaUsers,
  FaUserInjured,
  FaBed,
  FaProcedures,
  FaVial,
  FaSun,
  FaIdCard,
  FaFileAlt,
  FaSearch,
  FaDownload,
  FaPrint,
  FaSync,
  FaArrowRight,
  FaCheckCircle,
  FaFilter,
} from "react-icons/fa";
import { MdPregnantWoman, MdOutlineDashboard, MdAnalytics } from "react-icons/md";
import { TbStethoscope } from "react-icons/tb";

import { getPatients } from "@/services/api/patientsAPI";
import { getAllDependants } from "@/services/api/dependantAPI";
import { getAllOpdPatients } from "@/services/api/opdPatientAPI";
import { getAdmissions } from "@/services/api/admissionApi";
import { getAllSurgeries } from "@/services/api/surgeryAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getAllAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { getAttendanceLogs } from "@/services/api/attendanceAPI";
import { getAllHmos } from "@/services/api/hmoAPI";
import { usersAPI } from "@/services/api/usersAPI";
import metricsAPI, { getMetrics, getOverallMetrics } from "@/services/api/metricsAPI";
import { getCachedData, clearAdminCache } from "@/utils/adminDataCache";

import {
  adminDateRangeOptions,
  getDateRangeFromSelection,
  isWithinDateRange,
  exportRowsToCsv,
} from "./adminReportUtils";
import { formatNigeriaDate, formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

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

const AdminReports = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [viewMode, setViewMode] = useState("modules"); // 'modules' | 'consolidated'

  // Consolidated suite state
  const [dateRangeKey, setDateRangeKey] = useState("thisMonth");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedSuiteModule, setSelectedSuiteModule] = useState("cardOpening");
  const [suiteSearch, setSuiteSearch] = useState("");

  const [dataStore, setDataStore] = useState({
    patients: [],
    dependants: [],
    opdPatients: [],
    admissions: [],
    surgeries: [],
    appointments: [],
    labResults: [],
    antenatal: [],
    attendance: [],
    users: [],
    hmos: [],
  });

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getCachedData(
        "admin_reports_registry_data",
        async () => {
          const [
            patientsRes,
            dependantsRes,
            opdRes,
            admissionsRes,
            surgeriesRes,
            appointmentsRes,
            labResultsRes,
            antenatalRes,
            attendanceRes,
            usersRes,
            hmosRes,
          ] = await Promise.allSettled([
            getPatients({ limit: 150 }),
            getAllDependants(),
            getAllOpdPatients({ limit: 150 }),
            getAdmissions(),
            getAllSurgeries(),
            getAllAppointments(),
            getLabResults({ limit: 150 }),
            getAllAnteNatalRecords(),
            getAttendanceLogs(),
            usersAPI.getUsers(),
            getAllHmos(),
          ]);

          return {
            patients: patientsRes.status === "fulfilled" ? extractArray(patientsRes.value) : [],
            dependants: dependantsRes.status === "fulfilled" ? extractArray(dependantsRes.value) : [],
            opdPatients: opdRes.status === "fulfilled" ? extractArray(opdRes.value) : [],
            admissions: admissionsRes.status === "fulfilled" ? extractArray(admissionsRes.value) : [],
            surgeries: surgeriesRes.status === "fulfilled" ? extractArray(surgeriesRes.value) : [],
            appointments: appointmentsRes.status === "fulfilled" ? extractArray(appointmentsRes.value) : [],
            labResults: labResultsRes.status === "fulfilled" ? extractArray(labResultsRes.value) : [],
            antenatal: antenatalRes.status === "fulfilled" ? extractArray(antenatalRes.value) : [],
            attendance: attendanceRes.status === "fulfilled" ? extractArray(attendanceRes.value) : [],
            users: usersRes.status === "fulfilled" ? extractArray(usersRes.value) : [],
            hmos: hmosRes.status === "fulfilled" ? extractArray(hmosRes.value) : [],
          };
        },
        60000,
        forceRefresh
      );

      setDataStore(data);
    } catch (err) {
      console.error("Failed to load reports registry data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Aggregate counts
  const totalCardsOpened = dataStore.patients.length + dataStore.dependants.length;
  const activeInpatients = dataStore.admissions.filter((a) => a.status?.toLowerCase() !== "discharged").length;

  const quickStats = [
    {
      label: "Total Card Registrations",
      value: totalCardsOpened,
      sub: `${dataStore.patients.length} primary, ${dataStore.dependants.length} dependants`,
      icon: FaUsers,
      color: "text-primary bg-primary/10 border-primary/20",
    },
    {
      label: "OPD Attendances",
      value: dataStore.opdPatients.length,
      sub: "Outpatient clinical visits",
      icon: FaUserInjured,
      color: "text-info bg-info/10 border-info/20",
    },
    {
      label: "Active Inpatients",
      value: activeInpatients,
      sub: `${dataStore.admissions.length} cumulative admissions`,
      icon: FaBed,
      color: "text-warning bg-warning/10 border-warning/20",
    },
    {
      label: "Diagnostic Investigations",
      value: dataStore.labResults.length,
      sub: "Lab tests & Ultrasound scans",
      icon: FaVial,
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
    },
  ];

  const categories = [
    { id: "all", label: "All Modules" },
    { id: "registrations", label: "Card Opening & OPD" },
    { id: "clinical", label: "Inpatients & Surgeries" },
    { id: "diagnostics", label: "Diagnostics & Scans" },
    { id: "maternity", label: "Maternity & Neonatal" },
    { id: "insurance", label: "HMO Attendance" },
  ];

  const registryModules = [
    {
      id: "card-opening",
      category: "registrations",
      title: "Card Opening & Patient Registry",
      badge: "Patient Registration",
      badgeColor: "badge-primary",
      icon: FaUsers,
      iconColor: "text-primary bg-primary/10",
      description: "Supervise all registered hospital cards, family dependants, primary phone contacts, blood groups, and card types.",
      countLabel: `${totalCardsOpened} Total Cards Opened`,
      path: "/dashboard/admin/patients",
    },
    {
      id: "opd-patients",
      category: "registrations",
      title: "OPD Patients & Attendances",
      badge: "Outpatient Queue",
      badgeColor: "badge-info",
      icon: FaUserInjured,
      iconColor: "text-info bg-info/10",
      description: "Real-time outpatient queue, vital triage logs, doctor assignments, and clinical consultation records.",
      countLabel: `${dataStore.opdPatients.length} Attended Records`,
      path: "/dashboard/admin/opd",
    },
    {
      id: "admissions",
      category: "clinical",
      title: "Admissions & Inpatient Wards",
      badge: "Ward Oversight",
      badgeColor: "badge-warning",
      icon: FaBed,
      iconColor: "text-warning bg-warning/10",
      description: "Hospital bed occupancy, admitted patient cases, ward transfers, attending physicians, and discharge summaries.",
      countLabel: `${activeInpatients} Active / ${dataStore.admissions.length} Total`,
      path: "/dashboard/admin/admissions",
    },
    {
      id: "procedures",
      category: "clinical",
      title: "Procedures & Surgeries",
      badge: "Operating Theatre",
      badgeColor: "badge-error",
      icon: FaProcedures,
      iconColor: "text-error bg-error/10",
      description: "Operating theatre appointments, surgical procedures, preoperative/postoperative notes, and surgeon teams.",
      countLabel: `${dataStore.surgeries.length} Procedures Scheduled`,
      path: "/dashboard/admin/surgeries",
    },
    {
      id: "diagnostics",
      category: "diagnostics",
      title: "Diagnostics (Laboratory & Sonography)",
      badge: "Pathology & Scans",
      badgeColor: "badge-secondary",
      icon: FaVial,
      iconColor: "text-secondary bg-secondary/10",
      description: "Laboratory pathology investigations, test result flags (critical, high, low), ultrasound sonography scans, and imaging.",
      countLabel: `${dataStore.labResults.length} Diagnostics Logged`,
      path: "/dashboard/admin/diagnostics",
    },
    {
      id: "antenatal",
      category: "maternity",
      title: "Antenatal Care & SVD Maternity",
      badge: "Maternal Health",
      badgeColor: "badge-accent",
      icon: MdPregnantWoman,
      iconColor: "text-accent bg-accent/10",
      description: "Maternal antenatal bookings, LMP, estimated delivery dates (EDD), gestational progress, and Spontaneous Vaginal Delivery (SVD) logs.",
      countLabel: `${dataStore.antenatal.length} Antenatal Mothers`,
      path: "/dashboard/admin/antenatal",
    },
    {
      id: "phototherapy",
      category: "maternity",
      title: "Neonatal Phototherapy Unit",
      badge: "Neonatal Care",
      badgeColor: "badge-warning",
      icon: FaSun,
      iconColor: "text-amber-500 bg-amber-500/10",
      description: "Neonatal jaundice light therapy unit, incubator care, total serum bilirubin (TSB) tracking, and pediatric protocols.",
      countLabel: "Active Neonatal Unit",
      path: "/dashboard/admin/phototherapy",
    },
    {
      id: "hmo",
      category: "insurance",
      title: "HMO Attendance & Insurance",
      badge: "Health Insurance",
      badgeColor: "badge-success",
      icon: FaIdCard,
      iconColor: "text-success bg-success/10",
      description: "Health insurance enrollee verification, primary HMO provider attendance, insurance claims, and coverage verification.",
      countLabel: `${dataStore.hmos.length} Providers Registered`,
      path: "/dashboard/admin/hmo-attendance",
    },
  ];

  const filteredModules = useMemo(() => {
    return registryModules.filter((item) => {
      const matchesCat = selectedCategory === "all" || item.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.badge.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery, registryModules]);

  // Consolidated date range
  const { start: filterStart, end: filterEnd } = useMemo(() => {
    return getDateRangeFromSelection(dateRangeKey, customStartDate, customEndDate);
  }, [dateRangeKey, customStartDate, customEndDate]);

  // Consolidated data mapper
  const consolidatedRows = useMemo(() => {
    switch (selectedSuiteModule) {
      case "cardOpening":
        return [...dataStore.patients, ...dataStore.dependants]
          .filter((item) => isWithinDateRange(item.createdAt, filterStart, filterEnd))
          .filter((item) => {
            if (!suiteSearch.trim()) return true;
            const q = suiteSearch.toLowerCase();
            const name = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
            const id = (item.hospitalId || item.patientId || "").toLowerCase();
            return name.includes(q) || id.includes(q);
          });
      case "opd":
        return dataStore.opdPatients
          .filter((item) => isWithinDateRange(item.createdAt || item.date, filterStart, filterEnd))
          .filter((item) => {
            if (!suiteSearch.trim()) return true;
            const q = suiteSearch.toLowerCase();
            const name = `${item.firstName || ""} ${item.lastName || ""}`.toLowerCase();
            return name.includes(q);
          });
      case "admissions":
        return dataStore.admissions
          .filter((item) => isWithinDateRange(item.admissionDate || item.createdAt, filterStart, filterEnd));
      case "surgeries":
        return dataStore.surgeries
          .filter((item) => isWithinDateRange(item.surgeryDate || item.createdAt, filterStart, filterEnd));
      case "diagnostics":
        return dataStore.labResults
          .filter((item) => isWithinDateRange(item.createdAt, filterStart, filterEnd));
      case "antenatal":
        return dataStore.antenatal
          .filter((item) => isWithinDateRange(item.createdAt, filterStart, filterEnd));
      default:
        return [];
    }
  }, [selectedSuiteModule, dataStore, filterStart, filterEnd, suiteSearch]);

  const handleExportConsolidatedCsv = () => {
    const headers = ["Record ID", "Name / Subject", "Category / Status", "Date Recorded"];
    const rows = consolidatedRows.map((item, idx) => [
      item.hospitalId || item._id || `#${idx + 1}`,
      item.firstName ? `${item.firstName} ${item.lastName || ""}` : item.name || "—",
      item.status || item.accountType || item.cardType || "Standard",
      formatNigeriaDate(item.createdAt || item.admissionDate || item.date),
    ]);
    exportRowsToCsv(`hospital-report-${selectedSuiteModule}.csv`, headers, rows);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
              <MdAnalytics className="w-3.5 h-3.5" />
              Administrative Registry & Reports
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Hospital Reports & Registry
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-2xl">
              Centralized hospital oversight for patient registration, OPD attendance, inpatient admissions, surgical procedures, diagnostics, and maternal care.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                clearAdminCache("admin_reports_registry_data");
                setRefreshKey((k) => k + 1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-base-200 hover:bg-base-300 text-base-content transition-colors"
              title="Refresh Registry Data"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Sync Registry</span>
            </button>

            <button
              onClick={() => setViewMode(viewMode === "modules" ? "consolidated" : "modules")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors shadow-xs ${
                viewMode === "consolidated"
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 hover:bg-base-300 text-base-content"
              }`}
            >
              <FaFileAlt className="w-3.5 h-3.5" />
              <span>{viewMode === "consolidated" ? "View Modules Grid" : "Consolidated Export"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-base-content mt-1">{stat.value}</p>
                  <p className="text-[11px] text-base-content/50 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border ${stat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* View Mode: Modules Grid (SuperAdminSettings Style) */}
        {viewMode === "modules" ? (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-content"
                        : "bg-base-200 hover:bg-base-300 text-base-content/70"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search registry modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm w-full pl-9 bg-base-200/60 border-base-300 rounded-xl text-xs focus:outline-primary"
                />
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModules.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="bg-base-100 rounded-2xl border border-base-200 p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl ${item.iconColor} group-hover:scale-105 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`badge badge-sm font-bold ${item.badgeColor} text-[10px]`}>
                          {item.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-base-content/70 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-base-200/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        {item.countLabel}
                      </span>
                      <span className="text-xs font-semibold text-base-content/60 group-hover:text-primary group-hover:translate-x-1 transition-all flex items-center gap-1">
                        Open Registry <FaArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Consolidated Export Suite */
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-base-200 pb-4">
              <div>
                <h2 className="text-lg font-bold text-base-content">Consolidated Report Suite</h2>
                <p className="text-xs text-base-content/60">
                  Filter by date range, review departmental records, and export comprehensive CSV spreadsheets.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportConsolidatedCsv}
                  className="btn btn-sm btn-primary text-xs font-semibold flex items-center gap-2"
                >
                  <FaDownload className="w-3 h-3" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="btn btn-sm btn-ghost text-xs font-semibold flex items-center gap-2 border border-base-300"
                >
                  <FaPrint className="w-3 h-3" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-base-content/60 uppercase mb-1 block">
                  Select Department
                </label>
                <select
                  value={selectedSuiteModule}
                  onChange={(e) => setSelectedSuiteModule(e.target.value)}
                  className="select select-sm select-bordered w-full text-xs font-semibold"
                >
                  <option value="cardOpening">Card Opening / Registrations</option>
                  <option value="opd">OPD Patients</option>
                  <option value="admissions">Admissions & Inpatients</option>
                  <option value="surgeries">Procedures & Surgeries</option>
                  <option value="diagnostics">Diagnostics (Lab & Scans)</option>
                  <option value="antenatal">Antenatal & Maternity</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/60 uppercase mb-1 block">
                  Date Range
                </label>
                <select
                  value={dateRangeKey}
                  onChange={(e) => setDateRangeKey(e.target.value)}
                  className="select select-sm select-bordered w-full text-xs font-semibold"
                >
                  {adminDateRangeOptions.map((opt) => (
                    <option key={opt.key} value={opt.key}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-base-content/60 uppercase mb-1 block">
                  Search Filter
                </label>
                <input
                  type="text"
                  placeholder="Filter by name or ID..."
                  value={suiteSearch}
                  onChange={(e) => setSuiteSearch(e.target.value)}
                  className="input input-sm input-bordered w-full text-xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-base-200">
              <table className="table table-sm w-full">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content/70">
                  <tr>
                    <th>#</th>
                    <th>Record ID</th>
                    <th>Name / Subject</th>
                    <th>Status / Type</th>
                    <th>Recorded Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-base-200">
                  {consolidatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-base-content/50">
                        No records found matching the selected timeframe.
                      </td>
                    </tr>
                  ) : (
                    consolidatedRows.slice(0, 50).map((row, idx) => (
                      <tr key={idx} className="hover:bg-base-200/40">
                        <td className="font-semibold text-base-content/50">{idx + 1}</td>
                        <td className="font-bold text-primary">{row.hospitalId || row._id?.slice(-8) || "—"}</td>
                        <td className="font-semibold text-base-content">
                          {row.firstName ? `${row.firstName} ${row.lastName || ""}` : row.name || "—"}
                        </td>
                        <td>
                          <span className="badge badge-sm badge-ghost font-semibold">
                            {row.status || row.cardType || row.accountType || "Standard"}
                          </span>
                        </td>
                        <td className="text-base-content/70">
                          {formatNigeriaDateTime(row.createdAt || row.admissionDate || row.date)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {consolidatedRows.length > 50 && (
              <p className="text-[11px] text-base-content/50 text-right">
                Showing first 50 of {consolidatedRows.length} records. Export CSV to view complete records.
              </p>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminReports;
