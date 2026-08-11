import React, { useState, useMemo } from "react";
import {
  FaFlask,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const LabInvestigationTable = ({ investigations = [], loading = false, onViewAll, scopedToSingleSubject = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paginationData = useMemo(() => {
    const totalItems = investigations.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const start = (currentPage - 1) * itemsPerPage;
    const paginatedItems = investigations.slice(start, start + itemsPerPage);

    return { paginatedItems, totalPages, totalItems };
  }, [investigations, currentPage]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <FaCheckCircle className="text-success" />;
      case "in_progress":
      case "processing":
        return <FaClock className="text-info" />;
      case "requested":
      case "pending":
        return <FaExclamationCircle className="text-warning" />;
      default:
        return <FaFlask />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "badge-success";
      case "in_progress":
      case "processing":
        return "badge-info";
      case "requested":
      case "pending":
        return "badge-warning";
      default:
        return "badge-ghost";
    }
  };

  const getPriorityBadge = (priority) =>
    priority === "urgent" ? "badge-error" : priority === "high" ? "badge-warning" : "badge-ghost";

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        {/* HEADER */}
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaFlask className="text-info" />
            Lab Investigations
          </h2>
          <div className="flex gap-2">
            <button
              className="btn btn-outline btn-sm w-full sm:w-auto"
              onClick={onViewAll}
            >
              View All
            </button>
          </div>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-3">
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
                <div className="skeleton h-4 w-full" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table w-full text-center">
                <thead>
                  <tr>
                    <th>Patient Type</th>
                    <th>Investigation</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Date</th>
                    <th>Tests</th>
                  </tr>
                </thead>

                <tbody>
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((inv, idx) => (
                      <tr key={idx} className="hover">
                        <td>
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium">{inv.forName || "Unknown"}</span>
                            {!scopedToSingleSubject && (
                              <span
                                className={`badge badge-sm ${
                                  inv.isForDependant ? "badge-secondary" : "badge-primary"
                                }`}
                              >
                                {inv.isForDependant ? "Dependant" : "Patient"}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="font-medium">{inv.type || "Lab Investigation"}</td>

                        <td>
                          <span
                            className={`badge flex items-center gap-1 justify-center ${getStatusBadge(inv.status)}`}
                          >
                            {getStatusIcon(inv.status)}
                            {inv.status?.replace("_", " ") || "Unknown"}
                          </span>
                        </td>

                        <td>
                          {inv.priority ? (
                            <span className={`badge badge-sm ${getPriorityBadge(inv.priority)}`}>
                              {inv.priority}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>

                        <td>{inv.createdAt ? formatNigeriaDate(inv.createdAt) : "—"}</td>

                        <td className="text-left">
                          {inv.tests?.length > 0 ? (
                            <ul className="list-disc list-inside text-xs">
                              {inv.tests.slice(0, 2).map((test, i) => (
                                <li key={i}>{typeof test === "string" ? test : test.name || test.code}</li>
                              ))}
                              {inv.tests.length > 2 && <li>...</li>}
                            </ul>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-base-content/70">
                        No investigations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {paginationData.paginatedItems.length > 0 ? (
                paginationData.paginatedItems.map((inv, idx) => (
                  <div key={idx} className="border border-base-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-medium truncate">{inv.forName || "Unknown"}</span>
                        {!scopedToSingleSubject && (
                          <span
                            className={`badge badge-sm w-fit ${
                              inv.isForDependant ? "badge-secondary" : "badge-primary"
                            }`}
                          >
                            {inv.isForDependant ? "Dependant" : "Patient"}
                          </span>
                        )}
                      </div>
                      <span
                        className={`badge flex items-center gap-1 shrink-0 ${getStatusBadge(inv.status)}`}
                      >
                        {getStatusIcon(inv.status)}
                        {inv.status?.replace("_", " ") || "Unknown"}
                      </span>
                    </div>

                    <div className="font-medium text-sm">{inv.type || "Lab Investigation"}</div>

                    <div className="flex items-center justify-between text-xs text-base-content/60">
                      <span>{inv.createdAt ? formatNigeriaDate(inv.createdAt) : "—"}</span>
                      {inv.priority ? (
                        <span className={`badge badge-sm ${getPriorityBadge(inv.priority)}`}>
                          {inv.priority}
                        </span>
                      ) : (
                        <span>—</span>
                      )}
                    </div>

                    {inv.tests?.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-base-content/80">
                        {inv.tests.slice(0, 2).map((test, i) => (
                          <li key={i}>{typeof test === "string" ? test : test.name || test.code}</li>
                        ))}
                        {inv.tests.length > 2 && <li>...</li>}
                      </ul>
                    )}
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-base-content/70">No investigations found</div>
              )}
            </div>

            {/* PAGINATION */}
            {paginationData.totalPages > 1 && (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm opacity-70">
                  Page {currentPage} of {paginationData.totalPages} ({paginationData.totalItems} items)
                </span>

                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>

                  {Array.from({ length: Math.min(paginationData.totalPages, 5) }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        className={`btn btn-sm ${currentPage === page ? "btn-active" : "btn-outline"}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === paginationData.totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(paginationData.totalPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LabInvestigationTable;