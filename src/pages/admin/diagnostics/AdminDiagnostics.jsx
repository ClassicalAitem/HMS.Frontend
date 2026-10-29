/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaFileExport,
  FaVial,
  FaChevronLeft,
  FaChevronRight,
  FaImages,
} from "react-icons/fa";
import { TbStethoscope } from "react-icons/tb";
import { getLabResults } from "@/services/api/labResultsAPI";
import { getCachedData } from "@/utils/adminDataCache";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const AdminDiagnostics = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("all"); // 'all', 'lab', 'sonography'
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchResults = async () => {
      setLoading(true);
      try {
        const res = await getCachedData(
          "admin_diagnostics_results",
          () => getLabResults({ limit: 200 }),
          60000
        );
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.data)
          ? res.data.data
          : Array.isArray(res)
          ? res
          : [];
        if (mounted) setResults(list);
      } catch (err) {
        console.error("Error fetching diagnostics results:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchResults();
    return () => {
      mounted = false;
    };
  }, []);

  const categorizedResults = useMemo(() => {
    const list = results.map((item, idx) => {
      const patient = item.patient || item.opdPatient || item.dependant || {};
      const testName = item.investigationName || item.testName || "Investigation";
      const hasFiles = item.attachedFiles && item.attachedFiles.some((f) => f?.data || f?.name);
      const isSono =
        testName.toLowerCase().includes("scan") ||
        testName.toLowerCase().includes("ultrasound") ||
        testName.toLowerCase().includes("sonograph") ||
        testName.toLowerCase().includes("pelvic") ||
        testName.toLowerCase().includes("obstetric") ||
        hasFiles;

      const firstRes = Array.isArray(item.result) ? item.result[0] : null;

      return {
        id: item._id || item.id || `diag-${idx}`,
        category: isSono ? "Sonography / Scan" : "Laboratory Pathology",
        testName: testName,
        patientName:
          [patient.firstName, patient.lastName].filter(Boolean).join(" ").trim() ||
          patient.fullName ||
          item.patientName ||
          "—",
        hospitalId: patient.hospitalId || "—",
        clinician:
          item.sonographerName ||
          item.scientistName ||
          (isSono ? "Consultant Sonographer" : "Medical Lab Scientist"),
        flag: firstRes?.flag || "Normal",
        attachments: hasFiles ? `${item.attachedFiles.length} Scans Attached` : "Report Only",
        date: item.createdAt || item.testDate || "",
        status: item.status || "Completed",
      };
    });

    const term = searchTerm.toLowerCase().trim();
    return list.filter((r) => {
      const matchSearch =
        !term ||
        r.testName.toLowerCase().includes(term) ||
        r.patientName.toLowerCase().includes(term) ||
        r.hospitalId.toLowerCase().includes(term) ||
        r.clinician.toLowerCase().includes(term);

      if (!matchSearch) return false;

      if (activeSection === "lab") return r.category.includes("Laboratory");
      if (activeSection === "sonography") return r.category.includes("Sonography");

      return true;
    });
  }, [results, searchTerm, activeSection]);

  const totalRows = categorizedResults.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return categorizedResults.slice(start, start + itemsPerPage);
  }, [categorizedResults, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "category", label: "Diagnostic Category" },
      { key: "testName", label: "Investigation Name" },
      { key: "patientName", label: "Patient Name" },
      { key: "hospitalId", label: "Hospital ID" },
      { key: "clinician", label: "Attending Clinician" },
      { key: "flag", label: "Flag" },
      { key: "attachments", label: "Imagery" },
      { key: "date", label: "Date" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(categorizedResults, columns, `diagnostics_lab_sonography_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const labCount = results.filter((r) => {
    const t = (r.investigationName || r.testName || "").toLowerCase();
    return !t.includes("scan") && !t.includes("ultrasound") && !t.includes("sonograph");
  }).length;

  const sonoCount = results.length - labCount;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-info/10 text-info">
                Clinical Diagnostics
              </span>
              <span className="text-xs text-base-content/60">Pathology & Ultrasound Imaging</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Diagnostics (Laboratory & Sonography)
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Supervise all laboratory medical investigations, test results, pathology findings, and ultrasound sonography scans.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!categorizedResults.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Diagnostics</span>
          </button>
        </div>

        {/* Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Total Investigations</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">{results.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Laboratory Tests</p>
            <p className="text-2xl font-extrabold text-info mt-1">{labCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Sonography Scans</p>
            <p className="text-2xl font-extrabold text-secondary mt-1">{sonoCount}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Critical / Abnormal</p>
            <p className="text-2xl font-extrabold text-error mt-1">
              {categorizedResults.filter((r) => r.flag === "C" || r.flag === "H").length}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by test name, patient, hospital ID, or clinician..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Diagnostics" },
              { id: "lab", label: "Laboratory" },
              { id: "sonography", label: "Sonography Scans" },
            ].map((sec) => (
              <button
                key={sec.id}
                onClick={() => {
                  setActiveSection(sec.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  activeSection === sec.id
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {sec.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading diagnostics data...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="px-4">Test / Scan Name</th>
                    <th className="px-4">Patient Name</th>
                    <th className="px-4">Hospital ID</th>
                    <th className="px-4">Scientist / Sonographer</th>
                    <th className="px-4">Result Flag</th>
                    <th className="px-4">Imagery / Files</th>
                    <th className="px-4">Date</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-base-content/50">
                        No diagnostic records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((diag, idx) => (
                      <tr key={diag.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              diag.category.includes("Sonography")
                                ? "bg-secondary/10 text-secondary"
                                : "bg-info/10 text-info"
                            }`}
                          >
                            {diag.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-base-content">{diag.testName}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{diag.patientName}</td>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{diag.hospitalId}</td>
                        <td className="px-4 py-3 text-base-content/80">{diag.clinician}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                              diag.flag === "C" || diag.flag === "H"
                                ? "bg-error/10 text-error"
                                : "bg-success/10 text-success"
                            }`}
                          >
                            {diag.flag}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-base-content/70">{diag.attachments}</td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {diag.date ? formatNigeriaDate(diag.date) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                            {diag.status}
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

export default AdminDiagnostics;

