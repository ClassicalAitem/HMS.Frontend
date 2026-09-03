import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header, EmptyState } from "@/components/common";
import Sidebar from "@/components/surgeon/dashboard/Sidebar";
import {
  RiSearchLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiRefreshLine,
} from "react-icons/ri";
import {
  FaProcedures,
  FaFileMedical,
  FaUserInjured,
  FaClock,
} from "react-icons/fa";
import { getPatientById } from "@/services/api/patientsAPI";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";
import { getInvestigations } from "@/services/api/investigationRequestAPI";
import { getAllSurgeries } from "@/services/api/surgeryAPI";

const SurgeonIncoming = () => {
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const pageSize = 9;

  const toggleSidebar = () => setIsSidebarOpen((v) => !v);
  const closeSidebar = () => setIsSidebarOpen(false);

  useEffect(() => {
    let mounted = true;
    const fetchIncoming = async () => {
      try {
        setLoading(true);
        const [investigationResponse, surgeryResponse] = await Promise.all([
          getInvestigations({ type: "surgical" }),
          getAllSurgeries(),
        ]);
        const investigations = Array.isArray(investigationResponse?.data?.data)
          ? investigationResponse.data.data
          : Array.isArray(investigationResponse?.data)
          ? investigationResponse.data
          : Array.isArray(investigationResponse)
          ? investigationResponse
          : [];
        const surgeries = Array.isArray(surgeryResponse?.data?.data)
          ? surgeryResponse.data.data
          : Array.isArray(surgeryResponse?.data)
          ? surgeryResponse.data
          : Array.isArray(surgeryResponse)
          ? surgeryResponse
          : [];

        const sorted = [...investigations].sort((a, b) => {
          const aTime = new Date(a?.createdAt || 0).getTime();
          const bTime = new Date(b?.createdAt || 0).getTime();
          return bTime - aTime;
        });

        const mapped = await Promise.all(
          sorted.map(async (inv) => {
            let patientName = "Unknown Patient";
            let patientId = "—";
            if (inv?.patient) {
              if (inv.patient.fullName) patientName = inv.patient.fullName;
              else if (inv.patient.firstName || inv.patient.lastName) {
                patientName = `${inv.patient.firstName || ""} ${
                  inv.patient.lastName || ""
                }`.trim();
              }
              patientId = inv.patient.hospitalId || inv.patient.id || "—";
            } else if (inv?.patientName) {
              patientName = inv.patientName;
              patientId = inv?.patientId || inv?.patient_id || "—";
            } else if (inv?.patientId) {
              try {
                const patientRes = await getPatientById(inv.patientId);
                const p = patientRes?.data || patientRes;
                if (p?.fullName) patientName = p.fullName;
                else if (p?.firstName || p?.lastName) {
                  patientName = `${p.firstName || ""} ${p.lastName || ""}`.trim();
                }
                patientId = p?.hospitalId || p?.id || inv.patientId;
              } catch (e) {
                patientName = inv.patientId;
                patientId = inv.patientId;
              }
            }

            const procedureName =
              (Array.isArray(inv.tests) && inv.tests[0]?.name) ||
              inv.type ||
              inv.title ||
              "Surgical Investigation";

            return {
              id: inv?._id || inv?.id,
              patientName,
              patientId,
              procedureName,
              type: inv?.type || "surgical",
              status: surgeries.find(
                (surgery) =>
                  String(surgery?.investigationRequestId) === String(inv?._id || inv?.id),
              )?.status || inv?.status || "pending",
              createdAt: inv?.createdAt
                ? formatNigeriaDateTime(inv.createdAt)
                : "—",
              snapshot: inv,
              surgery: surgeries.find(
                (surgery) =>
                  String(surgery?.investigationRequestId) === String(inv?._id || inv?.id),
              ) || null,
            };
          })
        );

        if (mounted) setItems(mapped);
      } catch (err) {
        console.error("Surgeon Incoming: investigation fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchIncoming();
    return () => {
      mounted = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    setPage(0);
  }, [query, statusFilter, items]);

  const onRefresh = () => setRefreshKey((k) => k + 1);

  const filteredItems = items.filter((d) => {
    const q = query.trim().toLowerCase();
    const matchQuery = q
      ? [d?.patientName, d?.patientId, d?.procedureName, d?.status]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q)
      : true;

    const matchStatus =
      statusFilter === "all" ? true : d?.status?.toLowerCase() === statusFilter;

    return matchQuery && matchStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const start = page * pageSize;
  const visible = filteredItems.slice(start, start + pageSize);

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="overflow-y-auto flex flex-col gap-6 p-4 sm:p-6 lg:p-8 h-full">
          {/* TOP BAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <FaProcedures className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-black text-base-content tracking-tight">
                  Incoming Surgical Requests
                </h1>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                Clinical requests requiring theatre preparation, surgical assessment, and operative notes.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                className="btn btn-sm btn-ghost gap-1.5 font-medium border border-base-300"
                title="Refresh requests"
              >
                <RiRefreshLine className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* SEARCH & STATUS FILTERS */}
          <div className="card bg-base-100 p-4 shadow-sm border border-base-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative w-full max-w-md">
              <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search patient, hospital ID, or procedure..."
                className="input input-sm input-bordered w-full pl-9"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="btn btn-ghost btn-xs absolute right-1.5 top-1/2 -translate-y-1/2"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="join">
              <button
                className={`btn btn-xs join-item ${
                  statusFilter === "all" ? "btn-primary text-white" : "btn-ghost"
                }`}
                onClick={() => setStatusFilter("all")}
              >
                All ({items.length})
              </button>
              <button
                className={`btn btn-xs join-item ${
                  statusFilter === "pending" ? "btn-primary text-white" : "btn-ghost"
                }`}
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </button>
              <button
                className={`btn btn-xs join-item ${
                  statusFilter === "in_progress" ? "btn-primary text-white" : "btn-ghost"
                }`}
                onClick={() => setStatusFilter("in_progress")}
              >
                In Progress
              </button>
              <button
                className={`btn btn-xs join-item ${
                  statusFilter === "completed" ? "btn-primary text-white" : "btn-ghost"
                }`}
                onClick={() => setStatusFilter("completed")}
              >
                Completed
              </button>
            </div>
          </div>

          {/* REQUESTS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {loading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="card bg-base-100 border border-base-200 shadow-sm p-5 space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-base-200 animate-pulse" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-32 bg-base-200 rounded animate-pulse" />
                      <div className="h-3 w-20 bg-base-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="h-10 bg-base-200 rounded animate-pulse" />
                </div>
              ))
            ) : visible.length === 0 ? (
              <div className="col-span-full">
                <EmptyState
                  title="No Incoming Requests Found"
                  description={
                    query
                      ? `No requests match "${query}". Try adjusting your search.`
                      : "There are currently no surgical requests assigned to this queue."
                  }
                  actionLabel={query ? "Clear search" : "Refresh"}
                  onAction={query ? () => setQuery("") : onRefresh}
                />
              </div>
            ) : (
              visible.map((data) => (
                <div
                  key={data.id}
                  className="card bg-base-100 border border-base-200 shadow-xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          <FaUserInjured className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-base-content line-clamp-1">
                            {data.patientName}
                          </h3>
                          <p className="text-xs text-base-content/50 font-mono">
                            ID: {data.patientId}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`badge badge-sm font-semibold capitalize ${
                          data.status === "completed"
                            ? "badge-success text-white"
                            : data.status === "in_progress"
                            ? "badge-info text-white"
                            : "badge-ghost"
                        }`}
                      >
                        {data.status?.replace("_", " ")}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-base-200/50 border border-base-200 space-y-1">
                      <p className="text-xs font-semibold text-base-content line-clamp-1">
                        {data.procedureName}
                      </p>
                      <p className="text-[11px] text-base-content/50 flex items-center gap-1">
                        <FaClock className="w-3 h-3" />
                        Requested: {data.createdAt}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-base-200/30 border-t border-base-200 flex items-center justify-between">
                    <span className="text-xs text-base-content/60 font-medium">
                      Surgical Queue
                    </span>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary gap-1.5 font-semibold text-white shadow-xs"
                      onClick={() =>
                        navigate(
                          `/dashboard/surgeon/write-surgical-note/${data.id}`,
                          {
                            state: {
                              from: "incoming",
                              investigationRequest: data.snapshot,
                              editSurgery: data.surgery,
                            },
                          }
                        )
                      }
                    >
                      <FaFileMedical className="w-3.5 h-3.5" />
                      {data.surgery ? "Edit Note" : "Write Note"}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* PAGINATION */}
          {!loading && totalPages > 1 && (
            <div className="mt-2 flex items-center justify-center gap-3">
              <button
                className="btn btn-ghost btn-sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <RiArrowLeftSLine className="w-4 h-4" /> Previous
              </button>
              <div className="text-xs font-medium text-base-content/70">
                Page {page + 1} of {totalPages}
              </div>
              <button
                className="btn btn-ghost btn-sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              >
                Next <RiArrowRightSLine className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurgeonIncoming;
