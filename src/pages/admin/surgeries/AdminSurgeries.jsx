/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaFileExport,
  FaProcedures,
  FaCalendarCheck,
  FaChevronLeft,
  FaChevronRight,
  FaUserMd,
} from "react-icons/fa";
import { getAllSurgeries } from "@/services/api/surgeryAPI";
import { getAllAppointments } from "@/services/api/appointmentsAPI";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const AdminSurgeries = () => {
  const [surgeries, setSurgeries] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        const [surgRes, apptRes] = await Promise.allSettled([
          getAllSurgeries(),
          getAllAppointments(),
        ]);

        if (!mounted) return;

        const surgList = surgRes.status === "fulfilled"
          ? (Array.isArray(surgRes.value?.data) ? surgRes.value.data : Array.isArray(surgRes.value) ? surgRes.value : [])
          : [];

        const apptList = apptRes.status === "fulfilled"
          ? (Array.isArray(apptRes.value?.data) ? apptRes.value.data : Array.isArray(apptRes.value) ? apptRes.value : [])
          : [];

        setSurgeries(surgList);
        setAppointments(apptList);
      } catch (err) {
        console.error("Error fetching surgeries & appointments:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, []);

  const formattedProcedures = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();

    return surgeries
      .map((surg, idx) => {
        const patient = surg.patient || {};
        const surgeon = surg.surgeon || surg.leadSurgeon || {};

        return {
          id: surg._id || surg.id || `surg-${idx}`,
          procedureName: surg.surgeryName || surg.procedure || surg.title || "Surgical Procedure",
          patientName:
            [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
            patient.fullName ||
            surg.patientName ||
            "—",
          hospitalId: patient.hospitalId || surg.patientHospitalId || "—",
          surgeonName:
            [surgeon.firstName, surgeon.lastName].filter(Boolean).join(" ").trim() ||
            surgeon.fullName ||
            surg.surgeonName ||
            "Consultant Surgeon",
          theatre: surg.theatre || surg.operatingRoom || "Operating Theatre A",
          diagnosis: surg.diagnosis || surg.preOpDiagnosis || "Surgical Indication",
          scheduledDate: surg.scheduledDate || surg.date || surg.createdAt || "",
          status: surg.status || "Scheduled",
        };
      })
      .filter((row) => {
        return (
          !term ||
          row.procedureName.toLowerCase().includes(term) ||
          row.patientName.toLowerCase().includes(term) ||
          row.hospitalId.toLowerCase().includes(term) ||
          row.surgeonName.toLowerCase().includes(term) ||
          row.theatre.toLowerCase().includes(term)
        );
      });
  }, [surgeries, searchTerm]);

  const totalRows = formattedProcedures.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return formattedProcedures.slice(start, start + itemsPerPage);
  }, [formattedProcedures, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "procedureName", label: "Procedure Name" },
      { key: "patientName", label: "Patient Name" },
      { key: "hospitalId", label: "Hospital ID" },
      { key: "surgeonName", label: "Surgeon" },
      { key: "theatre", label: "Operating Theatre" },
      { key: "diagnosis", label: "Pre-Op Diagnosis" },
      { key: "scheduledDate", label: "Date & Time" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(formattedProcedures, columns, `surgical_procedures_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-error/10 text-error">
                Surgical & Clinical Procedures
              </span>
              <span className="text-xs text-base-content/60">Operating Theatres & Surgical Bookings</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Procedures & Surgeries
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Comprehensive report of appointments progressing to surgical procedures, theatre allocations, and lead surgeons.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!formattedProcedures.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Procedures</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Total Surgeries</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">{surgeries.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Scheduled / Pending</p>
            <p className="text-2xl font-extrabold text-warning mt-1">
              {surgeries.filter((s) => s.status?.toLowerCase() !== "completed").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Completed Procedures</p>
            <p className="text-2xl font-extrabold text-success mt-1">
              {surgeries.filter((s) => s.status?.toLowerCase() === "completed").length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Related Appointments</p>
            <p className="text-2xl font-extrabold text-primary mt-1">{appointments.length}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by procedure name, patient, surgeon, hospital ID, or theatre..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading procedure records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Procedure Name</th>
                    <th className="px-4">Patient Name</th>
                    <th className="px-4">Hospital ID</th>
                    <th className="px-4">Lead Surgeon</th>
                    <th className="px-4">Operating Theatre</th>
                    <th className="px-4">Pre-Op Diagnosis</th>
                    <th className="px-4">Scheduled Date</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-base-content/50">
                        No surgical procedure records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((surg, idx) => (
                      <tr key={surg.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-base-content">{surg.procedureName}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{surg.patientName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{surg.hospitalId}</td>
                        <td className="px-4 py-3 text-base-content/80">{surg.surgeonName}</td>
                        <td className="px-4 py-3 text-base-content/80">{surg.theatre}</td>
                        <td className="px-4 py-3 text-base-content/80 max-w-xs truncate">{surg.diagnosis}</td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {surg.scheduledDate ? formatNigeriaDateTime(surg.scheduledDate) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              surg.status.toLowerCase() === "completed"
                                ? "bg-success/10 text-success"
                                : "bg-warning/10 text-warning"
                            }`}
                          >
                            {surg.status}
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

export default AdminSurgeries;

