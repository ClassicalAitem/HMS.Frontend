import React, { useState, useMemo } from "react";

const MedicalHistoryTable = ({ rows, onAdd, onViewDetails, onEdit, onViewAll, loading = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paginationData = useMemo(() => {
    const totalItems = Array.isArray(rows) ? rows.length : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = Array.isArray(rows)
      ? rows.slice(startIdx, startIdx + itemsPerPage)
      : [];
    return { paginatedItems, totalPages, totalItems };
  }, [rows, currentPage]);

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-base-content">Medical History</h2>
          <div className="flex gap-2">
            <button
              className="btn btn-success btn-sm"
              onClick={onAdd}
              
            >
              + Add New Consultation
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={typeof onViewAll === "function" ? onViewAll : undefined}
            >
              View All Records
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 gap-3">
                {Array.from({ length: 7 }).map((__, j) => (
                  <div key={j} className="skeleton h-4 w-full rounded" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr className="border-b border-base-200">
                    <th className="text-base-content/60 font-semibold">Patient</th>
                    <th className="text-base-content/60 font-semibold">Type</th>
                    <th className="text-base-content/60 font-semibold">Diagnosis</th>
                    <th className="text-base-content/60 font-semibold">Date</th>
                    <th className="text-base-content/60 font-semibold">Time</th>
                    <th className="text-base-content/60 font-semibold">Notes</th>
                    <th className="text-base-content/60 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <tr key={row.id || idx} className="hover:bg-base-200/40 border-b border-base-200 last:border-0">

                        {/* ✅ Patient / Dependant column */}
                        <td className="py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium text-base-content truncate max-w-[140px]">
                              {row.forName || "—"}
                            </span>
                            <span
                              className={`badge badge-xs w-fit ${
                                row.isForDependant
                                  ? "badge-secondary"
                                  : "badge-primary"
                              }`}
                            >
                              {row.forRelation || " Patient"}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 text-base-content/70">{row.type}</td>

                        <td className="py-3">
                          <span
                            className={`text-sm font-medium ${
                              row.diagnosis?.toLowerCase().includes("pending")
                                ? "text-warning"
                                : "text-base-content"
                            }`}
                          >
                            {row.diagnosis}
                          </span>
                        </td>

                        <td className="py-3 text-base-content/70">{row.date}</td>
                        <td className="py-3 text-base-content/70">{row.time}</td>

                        <td className="py-3 text-base-content/60 max-w-[160px]">
                          <span className="truncate block">{row.notes}</span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              className="btn btn-xs btn-outline btn-primary"
                              onClick={() =>
                                typeof onViewDetails === "function" &&
                                onViewDetails(row)
                              }
                            >
                              View
                            </button>
                            {typeof onEdit === "function" && (
                              <button
                                className={`btn btn-xs btn-outline btn-secondary ${
                                  row.canEdit
                                    ? ""
                                    : "opacity-40 cursor-not-allowed"
                                }`}
                                onClick={() => {
                                  if (row.canEdit) onEdit(row, idx);
                                }}
                                disabled={!row.canEdit}
                                title={
                                  !row.canEdit
                                    ? "Edit window expired (24h)"
                                    : "Edit consultation"
                                }
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="py-10 text-center text-base-content/50"
                      >
                        No consultations found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {paginationData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
                <span className="text-sm text-base-content/60">
                  Showing{" "}
                  {(currentPage - 1) * itemsPerPage + 1}–
                  {Math.min(
                    currentPage * itemsPerPage,
                    paginationData.totalItems
                  )}{" "}
                  of {paginationData.totalItems}
                </span>
                <div className="flex gap-1">
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: paginationData.totalPages }).map(
                    (_, i) => (
                      <button
                        key={i}
                        className={`btn btn-sm ${
                          currentPage === i + 1
                            ? "btn-primary"
                            : "btn-outline"
                        }`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    )
                  )}
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === paginationData.totalPages}
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

export default MedicalHistoryTable;