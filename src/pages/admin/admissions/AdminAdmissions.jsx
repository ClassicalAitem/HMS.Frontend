/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaFileExport,
  FaBed,
  FaChevronLeft,
  FaChevronRight,
  FaHospitalUser,
} from "react-icons/fa";
import { getAdmissions } from "@/services/api/admissionApi";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const AdminAdmissions = () => {
  const [admissions, setAdmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchAdmissions = async () => {
      setLoading(true);
      try {
        const res = await getAdmissions();
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        if (mounted) setAdmissions(list);
      } catch (err) {
        console.error("Error fetching admissions:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAdmissions();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedAdmissions = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return admissions
      .map((adm, idx) => {
        const patient = adm.patient || {};
        const ward = adm.ward || adm.wardId || {};
        const doctor = adm.admittingDoctor || adm.doctor || {};
        const isDischarged = adm.status?.toLowerCase() === "discharged" || Boolean(adm.dischargeDate);

        return {
          id: adm._id || adm.id || `adm-${idx}`,
          hospitalId: patient.hospitalId || adm.patientHospitalId || "—",
          patientName:
            [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
            patient.fullName ||
            adm.patientName ||
            "—",
          wardName: typeof ward === "object" ? ward.name || ward.wardName || "General Ward" : String(ward),
          bedNumber: adm.bedNumber || adm.bed || "Allocated",
          doctorName:
            [doctor.firstName, doctor.lastName].filter(Boolean).join(" ").trim() ||
            doctor.fullName ||
            adm.doctorName ||
            "Attending Doctor",
          admissionDate: adm.admissionDate || adm.createdAt || "",
          dischargeDate: adm.dischargeDate || (isDischarged ? "Discharged" : "Active Inpatient"),
          status: isDischarged ? "Discharged" : "Admitted",
          rawStatus: adm.status,
        };
      })
      .filter((row) => {
        const matchSearch =
          !term ||
          row.patientName.toLowerCase().includes(term) ||
          row.hospitalId.toLowerCase().includes(term) ||
          row.wardName.toLowerCase().includes(term) ||
          row.doctorName.toLowerCase().includes(term);

        if (!matchSearch) return false;

        if (statusFilter === "admitted") return row.status === "Admitted";
        if (statusFilter === "discharged") return row.status === "Discharged";

        return true;
      });
  }, [admissions, searchTerm, statusFilter]);

  const totalRows = formattedAdmissions.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return formattedAdmissions.slice(start, start + itemsPerPage);
  }, [formattedAdmissions, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "hospitalId", label: "Hospital ID" },
      { key: "patientName", label: "Patient Name" },
      { key: "wardName", label: "Ward" },
      { key: "bedNumber", label: "Bed" },
      { key: "doctorName", label: "Admitting Clinician" },
      { key: "admissionDate", label: "Admission Date" },
      { key: "dischargeDate", label: "Discharge Date" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(formattedAdmissions, columns, `inpatient_admissions_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-warning/10 text-warning">
                Inpatient Wards
              </span>
              <span className="text-xs text-base-content/60">Bed Occupancy & Length of Stay</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Admissions & Inpatients
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Supervise all hospitalized in-patients, allocated ward beds, admitting medical officers, and discharge records.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!formattedAdmissions.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Admissions</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Total Admissions</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">{admissions.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Currently Admitted</p>
            <p className="text-2xl font-extrabold text-warning mt-1">
              {admissions.filter((a) => a.status?.toLowerCase() !== "discharged").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Discharged</p>
            <p className="text-2xl font-extrabold text-success mt-1">
              {admissions.filter((a) => a.status?.toLowerCase() === "discharged").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Active Wards</p>
            <p className="text-2xl font-extrabold text-primary mt-1">
              {new Set(admissions.map((a) => a.ward?.name || a.wardName || "Ward")).size}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, hospital ID, ward, or doctor..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            {["all", "admitted", "discharged"].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setStatusFilter(status);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  statusFilter === status
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading admissions data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Hospital ID</th>
                    <th className="px-4">Patient Name</th>
                    <th className="px-4">Ward Location</th>
                    <th className="px-4">Bed Number</th>
                    <th className="px-4">Admitting Doctor</th>
                    <th className="px-4">Date Admitted</th>
                    <th className="px-4">Discharge Date</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-base-content/50">
                        No admission records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((adm, idx) => (
                      <tr key={adm.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-warning">{adm.hospitalId}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{adm.patientName}</td>
                        <td className="px-4 py-3 text-base-content/80">{adm.wardName}</td>
                        <td className="px-4 py-3 text-base-content/80 font-mono text-xs">{adm.bedNumber}</td>
                        <td className="px-4 py-3 text-base-content/80">{adm.doctorName}</td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {adm.admissionDate ? formatNigeriaDate(adm.admissionDate) : "—"}
                        </td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {adm.dischargeDate && adm.dischargeDate !== "Active Inpatient"
                            ? formatNigeriaDate(adm.dischargeDate)
                            : adm.dischargeDate}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              adm.status === "Admitted"
                                ? "bg-warning/10 text-warning"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {adm.status}
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

export default AdminAdmissions;

