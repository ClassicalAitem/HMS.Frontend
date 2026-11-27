import React, { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "@/layouts/admin/AdminLayout";
import KolakLoader from "@/components/common/KolakLoader";
import {
  FaUsers,
  FaUserInjured,
  FaBed,
  FaUserMd,
  FaArrowRight,
  FaSearch,
} from "react-icons/fa";
import { getPatients } from "@/services/api/patientsAPI";
import { getAllDependants } from "@/services/api/dependantAPI";
import { getAllOpdPatients } from "@/services/api/opdPatientAPI";
import { getAdmissions } from "@/services/api/admissionApi";
import { getAllSurgeries } from "@/services/api/surgeryAPI";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getAllAnteNatalRecords } from "@/services/api/anteNatalAPI";
import { usersAPI } from "@/services/api/usersAPI";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";
import {
  PeriodFilterBar,
  exportToCsv,
  usePagination,
  PaginationBar,
} from "@/pages/accountant/accountantUtils";
import toast from "react-hot-toast";

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const isDateInPeriod = (dateStr, period, startDate, endDate) => {
  if (period === "all") return true;
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const now = new Date();

  if (period === "today") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (period === "week") {
    const start = new Date(now);
    const day = start.getDay();
    start.setDate(start.getDate() - day + (day === 0 ? -6 : 1));
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }
  if (period === "month") {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  if (period === "custom") {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : new Date(0);
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : new Date(8640000000000000);
    return d >= start && d <= end;
  }
  return true;
};

const AdminDashboard = () => {
  const [period, setPeriod] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [store, setStore] = useState({
    patients: [],
    dependants: [],
    opd: [],
    admissions: [],
    surgeries: [],
    labResults: [],
    antenatal: [],
    staff: [],
  });

  const loadData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const [patRes, depRes, opdRes, admRes, surgRes, labRes, ancRes, staffRes] =
        await Promise.allSettled([
          getPatients({ limit: 1000 }),
          getAllDependants(),
          getAllOpdPatients(),
          getAdmissions(),
          getAllSurgeries(),
          getLabResults(),
          getAllAnteNatalRecords(),
          usersAPI.getUsers(),
        ]);

      setStore({
        patients: patRes.status === "fulfilled" ? extractArray(patRes.value) : [],
        dependants: depRes.status === "fulfilled" ? extractArray(depRes.value) : [],
        opd: opdRes.status === "fulfilled" ? extractArray(opdRes.value) : [],
        admissions: admRes.status === "fulfilled" ? extractArray(admRes.value) : [],
        surgeries: surgRes.status === "fulfilled" ? extractArray(surgRes.value) : [],
        labResults: labRes.status === "fulfilled" ? extractArray(labRes.value) : [],
        antenatal: ancRes.status === "fulfilled" ? extractArray(ancRes.value) : [],
        staff: staffRes.status === "fulfilled" ? extractArray(staffRes.value) : [],
      });
      setHasLoadedOnce(true);
    } catch (err) {
      console.error("Failed to load admin dashboard:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    const byPeriod = (list) =>
      list.filter((item) =>
        isDateInPeriod(item.createdAt || item.updatedAt, period, startDate, endDate)
      );

    return {
      patients: byPeriod(store.patients),
      dependants: byPeriod(store.dependants),
      opd: byPeriod(store.opd),
      admissions: byPeriod(store.admissions),
      surgeries: byPeriod(store.surgeries),
      labResults: byPeriod(store.labResults),
      antenatal: byPeriod(store.antenatal),
      activeAdmissions: store.admissions.filter(
        (a) => String(a.status || "").toLowerCase() === "admitted"
      ),
    };
  }, [store, period, startDate, endDate]);

  const recentPatients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return filtered.patients.filter((p) => {
      if (!q) return true;
      const name = `${p.firstName || ""} ${p.lastName || ""}`.toLowerCase();
      return (
        name.includes(q) ||
        String(p.hospitalId || "").toLowerCase().includes(q) ||
        String(p.phone || "").toLowerCase().includes(q)
      );
    });
  }, [filtered.patients, searchQuery]);

  const pagination = usePagination(recentPatients, 10);

  const handleExportCsv = () => {
    exportToCsv(
      `registered-patients-${period}.csv`,
      ["Hospital ID", "Name", "Gender", "Phone", "Card Type", "Registered Date"],
      recentPatients.map((p) => [
        p.hospitalId || "—",
        `${p.firstName || ""} ${p.lastName || ""}`.trim(),
        p.gender || "—",
        p.phone || "—",
        p.cardType || "—",
        formatNigeriaDate(p.createdAt),
      ])
    );
    toast.success("Registered patients exported to CSV");
  };

  const operationsSummary = [
    {
      label: "Registered Patients & Dependants",
      count: filtered.patients.length + filtered.dependants.length,
      sub: `${filtered.patients.length} principals, ${filtered.dependants.length} dependants`,
      path: "/dashboard/admin/patients",
    },
    {
      label: "OPD Patients & Visits",
      count: filtered.opd.length,
      sub: "Outpatient visits in selected period",
      path: "/dashboard/admin/opd",
    },
    {
      label: "Admissions & Inpatient Wards",
      count: filtered.admissions.length,
      sub: `${filtered.activeAdmissions.length} currently admitted`,
      path: "/dashboard/admin/admissions",
    },
    {
      label: "Surgical Procedures",
      count: filtered.surgeries.length,
      sub: "Scheduled & completed surgeries",
      path: "/dashboard/admin/surgeries",
    },
    {
      label: "Diagnostics & Lab Results",
      count: filtered.labResults.length,
      sub: "Lab tests & scans processed",
      path: "/dashboard/admin/diagnostics",
    },
    {
      label: "Antenatal & Maternity",
      count: filtered.antenatal.length,
      sub: "Antenatal bookings & follow-ups",
      path: "/dashboard/admin/antenatal",
    },
  ];

  return (
    <AdminLayout>
      {loading && !hasLoadedOnce && <KolakLoader fullscreen text="Loading admin dashboard..." />}

      <div className="space-y-6">
        {/* Clean Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Admin Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Hospital operations overview across registered patients, wards, diagnostics, and staff.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/dashboard/admin/patients" className="btn btn-sm btn-primary rounded-xl">
              Registered Patients
            </Link>
            <Link to="/dashboard/admin/staff" className="btn btn-sm btn-outline rounded-xl">
              Staff & Rosters
            </Link>
          </div>
        </div>

        {/* Period Filter */}
        <PeriodFilterBar
          period={period}
          setPeriod={setPeriod}
          startDate={startDate}
          setStartDate={setStartDate}
          endDate={endDate}
          setEndDate={setEndDate}
          onExportCsv={handleExportCsv}
          exportLabel="Export Patients CSV"
          onRefresh={() => loadData(true)}
          refreshing={refreshing}
        />

        {/* 4 Purposeful KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Registered Patients
              </span>
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary">
                <FaUsers className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-base-content mt-3">
              {filtered.patients.length + filtered.dependants.length}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {filtered.patients.length} principals • {filtered.dependants.length} dependants
            </p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                OPD Visits
              </span>
              <span className="p-2.5 rounded-xl bg-info/10 text-info">
                <FaUserInjured className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-base-content mt-3">
              {filtered.opd.length}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Outpatient attendances</p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Active Admissions
              </span>
              <span className="p-2.5 rounded-xl bg-warning/15 text-warning-content">
                <FaBed className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-base-content mt-3">
              {filtered.activeAdmissions.length}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {filtered.admissions.length} total admissions in view
            </p>
          </div>

          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Total Staff
              </span>
              <span className="p-2.5 rounded-xl bg-success/10 text-success">
                <FaUserMd className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-extrabold text-base-content mt-3">
              {store.staff.length}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Active hospital personnel</p>
          </div>
        </div>

        {/* Operations Summary */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <h2 className="text-lg font-bold text-base-content mb-4">Hospital Operations Summary</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>Department / Registry</th>
                  <th>Details</th>
                  <th className="text-right">Count</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {operationsSummary.map((row) => (
                  <tr key={row.path} className="hover">
                    <td className="font-semibold">{row.label}</td>
                    <td className="text-xs text-base-content/70">{row.sub}</td>
                    <td className="text-right font-bold">{row.count}</td>
                    <td className="text-right">
                      <Link
                        to={row.path}
                        className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
                      >
                        Open <FaArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Registered Patients Table with Pagination */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-bold text-base-content">Registered Patients</h2>
              <p className="text-xs text-base-content/60">
                Patients registered in the selected period
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search name, ID, phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-xs uppercase text-base-content/60">
                  <th>Hospital ID</th>
                  <th>Patient Name</th>
                  <th>Gender</th>
                  <th>Phone</th>
                  <th>Card Type</th>
                  <th>Registered</th>
                </tr>
              </thead>
              <tbody>
                {pagination.paginatedItems.map((p) => (
                  <tr key={p.id || p._id} className="hover">
                    <td className="font-mono text-xs">{p.hospitalId || "—"}</td>
                    <td className="font-semibold">
                      <Link
                        to={`/dashboard/admin/patients/${p.id || p._id}`}
                        className="text-primary hover:underline"
                      >
                        {`${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown"}
                      </Link>
                    </td>
                    <td className="capitalize text-xs">{p.gender || "—"}</td>
                    <td className="text-xs">{p.phone || "—"}</td>
                    <td className="uppercase text-xs font-semibold">{p.cardType || "—"}</td>
                    <td className="text-xs text-base-content/70">
                      {formatNigeriaDate(p.createdAt)}
                    </td>
                  </tr>
                ))}
                {pagination.paginatedItems.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-sm text-base-content/50">
                      No registered patients found for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <PaginationBar
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalItems}
            pageSize={pagination.pageSize}
            onPageChange={pagination.setCurrentPage}
            onPageSizeChange={pagination.setPageSize}
          />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
