import React, { useState, useMemo } from "react";
import {
  FaFlask,
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
} from "react-icons/fa";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const LabInvestigationTable = ({ investigations = [], loading = false }) => {
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

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FaFlask className="text-info" />
            Lab Investigations
          </h2>
          <span className="badge badge-primary badge-sm">
            {paginationData.totalItems}
          </span>
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
            {/* TABLE */}
            <div className="overflow-x-auto">
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
                    paginationData.paginatedItems.map((inv, idx) => {
                      const isDependant = !!inv.dependantId;

                      return (
                        <tr key={idx} className="hover">
                          {/* PATIENT / DEPENDANT */}
                          <td>
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-medium">
                                {inv.forName || "Unknown"}
                              </span>

                              <span
                                className={`badge badge-sm ${
                                  inv.isForDependant ? "badge-secondary" : "badge-primary"
                                }`}
                              >
                                {inv.isForDependant ? "Dependant" : "Patient"}
                              </span>

                             
                            </div>
                          </td>

                          {/* TYPE */}
                          <td className="font-medium">
                            {inv.type || "Lab Investigation"}
                          </td>

                          {/* STATUS */}
                          <td>
                            <span
                              className={`badge flex items-center gap-1 justify-center ${getStatusBadge(
                                inv.status
                              )}`}
                            >
                              {getStatusIcon(inv.status)}
                              {inv.status?.replace("_", " ") || "Unknown"}
                            </span>
                          </td>

                          {/* PRIORITY */}
                          <td>
                            {inv.priority ? (
                              <span
                                className={`badge badge-sm ${
                                  inv.priority === "urgent"
                                    ? "badge-error"
                                    : inv.priority === "high"
                                    ? "badge-warning"
                                    : "badge-ghost"
                                }`}
                              >
                                {inv.priority}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>

                          {/* DATE */}
                          <td>
                            {inv.createdAt ? formatNigeriaDate(inv.createdAt) : "—"}
                          </td>

                          {/* TESTS */}
                          <td className="text-left">
                            {inv.tests?.length > 0 ? (
                              <ul className="list-disc list-inside text-xs">
                                {inv.tests.slice(0, 2).map((test, i) => (
                                  <li key={i}>
                                    {typeof test === "string"
                                      ? test
                                      : test.name || test.code}
                                  </li>
                                ))}
                                {inv.tests.length > 2 && <li>...</li>}
                              </ul>
                            ) : (
                              "—"
                            )}
                          </td>
                        </tr>
                      );
                    })
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

            {/* PAGINATION */}
            {paginationData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <span className="text-sm opacity-70">
                  Page {currentPage} of {paginationData.totalPages} (
                  {paginationData.totalItems} items)
                </span>

                <div className="flex gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === 1}
                    onClick={() =>
                      setCurrentPage((p) => Math.max(1, p - 1))
                    }
                  >
                    Previous
                  </button>

                  {Array.from({
                    length: Math.min(paginationData.totalPages, 5),
                  }).map((_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        className={`btn btn-sm ${
                          currentPage === page
                            ? "btn-active"
                            : "btn-outline"
                        }`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    );
                  })}

                  <button
                    className="btn btn-sm btn-outline"
                    disabled={
                      currentPage === paginationData.totalPages
                    }
                    onClick={() =>
                      setCurrentPage((p) =>
                        Math.min(paginationData.totalPages, p + 1)
                      )
                    }
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