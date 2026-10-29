/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaSearch,
  FaDownload,
  FaUserPlus,
  FaUsers,
  FaIdCard,
  FaChevronLeft,
  FaChevronRight,
  FaFileExport,
} from "react-icons/fa";
import { getPatients } from "@/services/api/patientsAPI";
import { getAllDependants } from "@/services/api/dependantAPI";
import { getCachedData } from "@/utils/adminDataCache";
import { exportRowsToCsv } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const AdminPatients = () => {
  const [patients, setPatients] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all"); // 'all', 'principal', 'dependant', 'hmo', 'private'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchRegistrations = async () => {
      setLoading(true);
      try {
        const { patData, depData } = await getCachedData(
          "admin_patients_registry",
          async () => {
            const [patRes, depRes] = await Promise.allSettled([
              getPatients({ limit: 200 }),
              getAllDependants(),
            ]);
            return {
              patData: patRes.status === "fulfilled" ? (Array.isArray(patRes.value?.data) ? patRes.value.data : Array.isArray(patRes.value) ? patRes.value : []) : [],
              depData: depRes.status === "fulfilled" ? (Array.isArray(depRes.value?.data) ? depRes.value.data : Array.isArray(depRes.value) ? depRes.value : []) : [],
            };
          },
          60000
        );

        if (!mounted) return;
        setPatients(patData);
        setDependants(depData);
      } catch (err) {
        console.error("Error fetching card registrations:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchRegistrations();
    return () => {
      mounted = false;
    };
  }, []);

  const mergedRecords = useMemo(() => {
    const list = [];

    patients.forEach((p, idx) => {
      const isHmo = Boolean(p.hmo?.provider || p.cardType?.toLowerCase().includes("hmo"));
      list.push({
        id: p._id || p.id || `p-${idx}`,
        hospitalId: p.hospitalId || "—",
        name: [p.firstName, p.lastName].filter(Boolean).join(" ").trim() || p.fullName || "—",
        type: "Principal Patient",
        gender: p.gender || "—",
        age: p.age || "—",
        phone: p.phone || p.phoneNumber || "—",
        scheme: isHmo ? `HMO (${p.hmo?.provider || p.hmoProvider})` : "Private Patient",
        isHmo,
        date: p.createdAt || p.registrationDate || "",
        status: p.status || "Active",
      });
    });

    dependants.forEach((d, idx) => {
      const isHmo = Boolean(d.hmo?.provider || d.cardType?.toLowerCase().includes("hmo"));
      list.push({
        id: d._id || d.id || `d-${idx}`,
        hospitalId: d.hospitalId || d.patient?.hospitalId || "Dependant",
        name: [d.firstName, d.lastName].filter(Boolean).join(" ").trim() || d.fullName || "—",
        type: `Dependant (${d.relationship || "Family"})`,
        gender: d.gender || "—",
        age: d.age || "—",
        phone: d.phone || d.parentPhone || "—",
        scheme: isHmo ? `HMO (${d.hmo?.provider || "Family HMO"})` : "Private Scheme",
        isHmo,
        date: d.createdAt || "",
        status: d.status || "Active",
      });
    });

    const term = searchTerm.toLowerCase().trim();
    return list.filter((r) => {
      const matchSearch =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.hospitalId.toLowerCase().includes(term) ||
        r.phone.toLowerCase().includes(term) ||
        r.scheme.toLowerCase().includes(term);

      if (!matchSearch) return false;

      if (filterType === "principal") return r.type.startsWith("Principal");
      if (filterType === "dependant") return r.type.startsWith("Dependant");
      if (filterType === "hmo") return r.isHmo;
      if (filterType === "private") return !r.isHmo;

      return true;
    });
  }, [patients, dependants, searchTerm, filterType]);

  const totalRows = mergedRecords.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return mergedRecords.slice(start, start + itemsPerPage);
  }, [mergedRecords, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "hospitalId", label: "Hospital ID" },
      { key: "name", label: "Full Name" },
      { key: "type", label: "Record Type" },
      { key: "gender", label: "Gender" },
      { key: "age", label: "Age" },
      { key: "phone", label: "Phone" },
      { key: "scheme", label: "Care Scheme" },
      { key: "date", label: "Registration Date" },
      { key: "status", label: "Card Status" },
    ];
    exportRowsToCsv(mergedRecords, columns, `card_opening_registry_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary">
                Patient Registry
              </span>
              <span className="text-xs text-base-content/60">Card Opening Oversight</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Card Opening & Registered Patients
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Oversight of all opened patient cards, hospital IDs, dependants, and medical billing schemes.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!mergedRecords.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Registry</span>
          </button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Total Cards Opened</p>
            <p className="text-2xl font-extrabold text-base-content mt-1">
              {patients.length + dependants.length}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Principal Patients</p>
            <p className="text-2xl font-extrabold text-primary mt-1">{patients.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Registered Dependants</p>
            <p className="text-2xl font-extrabold text-secondary mt-1">{dependants.length}</p>
          </div>
          <div className="p-4 rounded-xl bg-base-100 border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">HMO Scheme Cards</p>
            <p className="text-2xl font-extrabold text-success mt-1">
              {patients.filter((p) => p.hmo?.provider).length}
            </p>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by patient name, hospital ID, phone, or scheme..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="input input-sm w-full pl-10 bg-base-200/50 border-base-300 rounded-lg"
            />
          </div>

          <div className="flex items-center gap-2">
            {["all", "principal", "dependant", "hmo", "private"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilterType(type);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                  filterType === type
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading patient records...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Hospital ID</th>
                    <th className="px-4">Patient Name</th>
                    <th className="px-4">Record Type</th>
                    <th className="px-4">Gender</th>
                    <th className="px-4">Age</th>
                    <th className="px-4">Phone Number</th>
                    <th className="px-4">Care Scheme</th>
                    <th className="px-4">Date Opened</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-base-content/50">
                        No card registration records found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((r, idx) => (
                      <tr key={r.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3 font-semibold text-primary">{r.hospitalId}</td>
                        <td className="px-4 py-3 font-medium text-base-content">{r.name}</td>
                        <td className="px-4 py-3 text-xs text-base-content/70">{r.type}</td>
                        <td className="px-4 py-3 capitalize text-base-content/80">{r.gender}</td>
                        <td className="px-4 py-3 text-base-content/80">{r.age}</td>
                        <td className="px-4 py-3 text-base-content/80">{r.phone}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              r.isHmo ? "bg-info/10 text-info" : "bg-base-200 text-base-content/80"
                            }`}
                          >
                            {r.scheme}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {r.date ? formatNigeriaDate(r.date) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-success/10 text-success">
                            {r.status}
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

export default AdminPatients;

