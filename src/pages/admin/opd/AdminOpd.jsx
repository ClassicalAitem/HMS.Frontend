/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaFileExport,
  FaUserInjured,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
} from "react-icons/fa";
import { getAllOpdPatients } from "@/services/api/opdPatientAPI";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const AdminOpd = () => {
  const [opdList, setOpdList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchOpd = async () => {
      setLoading(true);
      try {
        const res = await getAllOpdPatients({ limit: 1000 });
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        if (mounted) setOpdList(list);
      } catch (err) {
        console.error("Error fetching OPD patients:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchOpd();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredOpd = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return opdList.filter((item) => {
      const name = item.fullName || `${item.firstName || ""} ${item.lastName || ""}`.trim();
      const opdNum = item.opdNumber || item.patientId || "";
      const phone = item.phone || item.phoneNumber || "";
      const complaint = item.complaint || item.chiefComplaint || "";

      return (
        !term ||
        name.toLowerCase().includes(term) ||
        opdNum.toLowerCase().includes(term) ||
        phone.toLowerCase().includes(term) ||
        complaint.toLowerCase().includes(term)
      );
    });
  }, [opdList, searchTerm]);

  const totalRows = filteredOpd.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOpd.slice(start, start + itemsPerPage);
  }, [filteredOpd, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "opdNumber", label: "OPD No" },
      { key: "fullName", label: "Patient Name" },
      { key: "phone", label: "Phone" },
      { key: "gender", label: "Gender" },
      { key: "age", label: "Age" },
      { key: "complaint", label: "Chief Complaint" },
      { key: "triage", label: "Triage" },
      { key: "createdAt", label: "Visit Date" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(filteredOpd, columns, `opd_patients_report_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-secondary/10 text-secondary">
                Out-Patient Department
              </span>
              <span className="text-xs text-base-content/60">Triage & Ambulatory Care</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              OPD Patients & Attendances
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Monitor ambulatory out-patients, presenting complaints, triage ratings, and daily OPD volume.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!filteredOpd.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export OPD Report</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Total Out-Patients</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">{opdList.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Attended Today</p>
            <p className="text-2xl font-extrabold text-secondary mt-1">
              {
                opdList.filter(
                  (o) =>
                    o.createdAt &&
                    new Date(o.createdAt).toDateString() === new Date().toDateString()
                ).length
              }
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Standard Triage</p>
            <p className="text-2xl font-extrabold text-success mt-1">
              {opdList.filter((o) => (o.triageCategory || "standard").toLowerCase().includes("standard")).length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Emergency / Priority</p>
            <p className="text-2xl font-extrabold text-error mt-1">
              {opdList.filter((o) => (o.triageCategory || "").toLowerCase().includes("urgent") || (o.triageCategory || "").toLowerCase().includes("emerg")).length}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, OPD number, phone, or complaint..."
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
              <p className="text-sm text-base-content/60 mt-4">Loading OPD data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">OPD No</th>
                    <th className="px-4">Patient Full Name</th>
                    <th className="px-4">Phone</th>
                    <th className="px-4">Gender</th>
                    <th className="px-4">Age</th>
                    <th className="px-4">Presenting Complaint</th>
                    <th className="px-4">Triage Priority</th>
                    <th className="px-4">Visit Time</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-base-content/50">
                        No OPD patient records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((opd, idx) => (
                      <tr key={opd._id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-secondary">
                          {opd.opdNumber || opd.patientId || `OPD-${idx + 1}`}
                        </td>
                        <td className="px-4 py-3 font-medium text-base-content">
                          {opd.fullName || `${opd.firstName || ""} ${opd.lastName || ""}`.trim() || "—"}
                        </td>
                        <td className="px-4 py-3 text-base-content/80">{opd.phone || "—"}</td>
                        <td className="px-4 py-3 capitalize text-base-content/80">{opd.gender || "—"}</td>
                        <td className="px-4 py-3 text-base-content/80">{opd.age || "—"}</td>
                        <td className="px-4 py-3 max-w-xs truncate text-base-content/80">
                          {opd.complaint || opd.chiefComplaint || "General checkup"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-base-200 text-base-content/80">
                            {opd.triageCategory || opd.triage || "Standard"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {opd.createdAt ? formatNigeriaDateTime(opd.createdAt) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                            {opd.status || "Attended"}
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

export default AdminOpd;

