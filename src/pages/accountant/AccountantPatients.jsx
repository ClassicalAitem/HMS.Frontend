import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { exportToCsv, usePagination, PaginationBar } from "./accountantUtils";
import { FaDownload, FaSearch, FaSyncAlt, FaUser, FaUserFriends } from "react-icons/fa";
import toast from "react-hot-toast";

const AccountantPatients = () => {
  const [records, setRecords] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all"); // 'all' | 'patient' | 'dependant'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPatients = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await accountantAPI.getPatients();
      setRecords(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load patients & dependants");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(r.name || "").toLowerCase().includes(q) ||
        String(r.hospitalId || "").toLowerCase().includes(q) ||
        String(r.phone || "").toLowerCase().includes(q) ||
        String(r.principalName || "").toLowerCase().includes(q)
      );
    });
  }, [records, typeFilter, searchQuery]);

  const patientsPagination = usePagination(filtered, 15);

  const handleExportCsv = () => {
    exportToCsv(
      `patients-dependants-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Type", "Name", "Hospital ID", "Principal / Relationship", "Gender", "Phone", "Card Type"],
      filtered.map((r) => [
        r.type === "dependant" ? "Dependant" : "Patient",
        r.name,
        r.hospitalId,
        r.type === "dependant" ? `${r.principalName} (${r.relationshipType})` : "Principal",
        r.gender,
        r.phone,
        r.cardType,
      ])
    );
    toast.success("Patients & dependants exported to CSV");
  };

  return (
    <AccountantLayout>
      {loading && <KolakLoader fullscreen text="Loading patients & dependants..." />}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Patients & Dependants
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Click any patient or dependant to inspect their complete billing & payment history.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadPatients(true)}
              disabled={refreshing}
              className="btn btn-sm btn-ghost bg-base-200/70 rounded-xl gap-1.5"
            >
              <FaSyncAlt className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn btn-sm btn-primary rounded-xl gap-1.5"
            >
              <FaDownload className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="tabs tabs-boxed bg-base-100 border border-base-200 p-1 rounded-xl">
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                typeFilter === "all" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setTypeFilter("all")}
            >
              All ({records.length})
            </button>
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                typeFilter === "patient" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setTypeFilter("patient")}
            >
              Patients ({records.filter((r) => r.type === "patient").length})
            </button>
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                typeFilter === "dependant" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setTypeFilter("dependant")}
            >
              Dependants ({records.filter((r) => r.type === "dependant").length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
            <input
              type="text"
              placeholder="Search name, Hospital ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
            />
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-xs uppercase text-base-content/60">
                <th>Type</th>
                <th>Name</th>
                <th>Hospital ID</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Card Type</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {patientsPagination.paginatedItems.map((r) => {
                const detailUrl =
                  r.type === "dependant"
                    ? `/accountant/patients/${r.id}?type=dependant`
                    : `/accountant/patients/${r.id}`;
                return (
                  <tr key={`${r.type}-${r.id}`} className="hover">
                    <td>
                      {r.type === "dependant" ? (
                        <span className="badge badge-info badge-sm gap-1 text-white">
                          <FaUserFriends className="w-2.5 h-2.5" /> Dependant
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-sm gap-1">
                          <FaUser className="w-2.5 h-2.5" /> Patient
                        </span>
                      )}
                    </td>
                    <td>
                      <Link to={detailUrl} className="font-bold text-primary hover:underline">
                        {r.name}
                      </Link>
                      {r.type === "dependant" && (
                        <p className="text-xs text-base-content/60">
                          {r.relationshipType} of {r.principalName}
                        </p>
                      )}
                    </td>
                    <td className="font-mono text-xs">{r.hospitalId}</td>
                    <td className="capitalize text-xs">{r.gender}</td>
                    <td className="text-xs">{r.phone}</td>
                    <td className="uppercase text-xs font-semibold">{r.cardType}</td>
                    <td className="text-right">
                      <Link to={detailUrl} className="btn btn-xs btn-outline btn-primary rounded-lg">
                        View Bills & Payments
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-sm text-base-content/50">
                    No patients or dependants match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            currentPage={patientsPagination.currentPage}
            totalPages={patientsPagination.totalPages}
            totalItems={patientsPagination.totalItems}
            pageSize={patientsPagination.pageSize}
            onPageChange={patientsPagination.setCurrentPage}
            onPageSizeChange={patientsPagination.setPageSize}
          />
        </div>
      </div>
    </AccountantLayout>
  );
};

export default AccountantPatients;
