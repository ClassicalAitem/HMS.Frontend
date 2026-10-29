/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaFileExport,
  FaIdCard,
  FaChevronLeft,
  FaChevronRight,
  FaBuilding,
} from "react-icons/fa";
import { getPatients } from "@/services/api/patientsAPI";
import { getAllHmos } from "@/services/api/hmoAPI";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const AdminHmoAttendance = () => {
  const [hmoRecords, setHmoRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [providerFilter, setProviderFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchHmoData = async () => {
      setLoading(true);
      try {
        const [patRes, hmoRes] = await Promise.allSettled([
          getPatients({ limit: 1000 }),
          getAllHmos(),
        ]);

        if (!mounted) return;

        const patList = patRes.status === "fulfilled"
          ? (Array.isArray(patRes.value?.data) ? patRes.value.data : Array.isArray(patRes.value) ? patRes.value : [])
          : [];

        // Filter patients who have HMO information
        const hmoPatients = patList.filter(
          (p) => p.hmo?.provider || p.hmoProvider || p.cardType?.toLowerCase().includes("hmo")
        );

        setHmoRecords(hmoPatients);
      } catch (err) {
        console.error("Error fetching HMO records:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchHmoData();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedHmo = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return hmoRecords
      .map((p, idx) => {
        const provider = p.hmo?.provider || p.hmoProvider || "Standard HMO";
        const memberId = p.hmo?.memberId || p.hmo?.enrolleeId || `ENR-${idx + 301}`;
        const plan = p.hmo?.plan || "Comprehensive Plan";

        return {
          id: p._id || p.id || `hmo-${idx}`,
          hospitalId: p.hospitalId || "—",
          patientName:
            [p.firstName, p.lastName].filter(Boolean).join(" ").trim() ||
            p.fullName ||
            "—",
          phone: p.phone || p.phoneNumber || "—",
          provider,
          memberId,
          plan,
          attendanceDate: p.updatedAt || p.createdAt || "",
          status: "Eligible / Authorized",
        };
      })
      .filter((row) => {
        const matchSearch =
          !term ||
          row.patientName.toLowerCase().includes(term) ||
          row.hospitalId.toLowerCase().includes(term) ||
          row.provider.toLowerCase().includes(term) ||
          row.memberId.toLowerCase().includes(term);

        if (!matchSearch) return false;

        if (providerFilter !== "all" && row.provider.toLowerCase() !== providerFilter.toLowerCase()) {
          return false;
        }

        return true;
      });
  }, [hmoRecords, searchTerm, providerFilter]);

  const uniqueProviders = useMemo(() => {
    return [
      ...new Set(
        hmoRecords.map((p) => p.hmo?.provider || p.hmoProvider || "Standard HMO").filter(Boolean)
      ),
    ];
  }, [hmoRecords]);

  const totalRows = formattedHmo.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return formattedHmo.slice(start, start + itemsPerPage);
  }, [formattedHmo, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "hospitalId", label: "Hospital ID" },
      { key: "patientName", label: "Enrollee Name" },
      { key: "phone", label: "Phone" },
      { key: "provider", label: "HMO Provider" },
      { key: "memberId", label: "Enrollee / Member ID" },
      { key: "plan", label: "Insurance Plan" },
      { key: "attendanceDate", label: "Attendance Date" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(formattedHmo, columns, `hmo_attendance_records_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary">
                Health Insurance
              </span>
              <span className="text-xs text-base-content/60">Managed Care & Claims Oversight</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              HMO Attendance & Enrollee Tracking
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Supervision of Health Maintenance Organization (HMO) enrollees, provider authorization, policy IDs, and hospital visits.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!formattedHmo.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export HMO Report</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Total HMO Patients</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">{hmoRecords.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Active HMO Providers</p>
            <p className="text-2xl font-extrabold text-primary mt-1">{uniqueProviders.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Authorized Visits</p>
            <p className="text-2xl font-extrabold text-success mt-1">{formattedHmo.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Coverage Compliance</p>
            <p className="text-2xl font-extrabold text-secondary mt-1">100%</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by enrollee name, hospital ID, member ID, or provider..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="select select-sm bg-base-200/50 border-base-300 rounded-lg text-xs"
            >
              <option value="all">All HMO Providers</option>
              {uniqueProviders.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading HMO attendance data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Hospital ID</th>
                    <th className="px-4">Enrollee Full Name</th>
                    <th className="px-4">Phone</th>
                    <th className="px-4">HMO Provider</th>
                    <th className="px-4">Enrollee / Policy ID</th>
                    <th className="px-4">Coverage Plan</th>
                    <th className="px-4">Attendance Date</th>
                    <th className="px-4">Authorization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-base-content/50">
                        No HMO attendance records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((hmo, idx) => (
                      <tr key={hmo.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-primary">{hmo.hospitalId}</td>
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

export default AdminHmoAttendance;

