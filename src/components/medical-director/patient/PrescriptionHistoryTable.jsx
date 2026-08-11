import React, { useState, useMemo } from "react";

const PrescriptionHistoryTable = ({ rows, loading = false, onViewAll, scopedToSingleSubject = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paginationData = useMemo(() => {
    const totalItems = Array.isArray(rows) ? rows.length : 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = Array.isArray(rows) ? rows.slice(startIdx, startIdx + itemsPerPage) : [];
    return { paginatedItems, totalPages, totalItems };
  }, [rows, currentPage]);

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex flex-col gap-3 mb-3 sm:flex-row sm:justify-between sm:items-center">
          <h2 className="text-lg font-semibold text-base-content">Prescription History</h2>
          <button
            className="btn btn-outline btn-sm w-full sm:w-auto"
            onClick={onViewAll}
          >
            View All
          </button>
        </div>
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-6 w-40" />
            <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
              <div className="overflow-auto max-h-64 p-4 space-y-2">
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
            </div>
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table w-full text-center">
                <thead>
                  <tr>
                    <th>Patient Type</th>
                    <th>Status</th>
                    <th>Medications Count</th>
                    <th>Created At</th>
                    <th>Medications</th>
                    <th>Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <tr key={idx} className="hover">
                        <td className="py-3">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-medium text-base-content">
                              {row.forName || "Unknown"}
                            </span>
                            {!scopedToSingleSubject && (
                              <span className={`badge badge-sm ${
                                row.isForDependant ? 'badge-secondary' : 'badge-primary'
                              }`}>
                                {row.isForDependant ? 'Dependant' : 'Patient'}
                              </span>
                            )}
                          </div>
                        </td>

                        <td>
                          <span className={`badge ${row.status === 'Pending' ? 'badge-warning' : row.status === 'Dispensed' ? 'badge-success' : 'badge-ghost'}`}>
                            {row.status}
                          </span>
                        </td>
                        <td>{row.medicationsCount}</td>
                        <td>{row.date}</td>
                        <td className="text-left">
                          <ul className="list-disc list-inside text-xs">
                            {row.medicationsSummary.map((med, i) => (
                              <li key={i}>{med}</li>
                            ))}
                            {row.medicationsCount > 2 && <li>...</li>}
                          </ul>
                        </td>
                        <td className="font-medium text-primary">
                          {row.totalPrice ? `₦${Number(row.totalPrice).toLocaleString()}` : '—'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-base-content/70">No prescriptions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {paginationData.paginatedItems.length > 0 ? (
                paginationData.paginatedItems.map((row, idx) => (
                  <div key={idx} className="border border-base-200 rounded-lg p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 min-w-0">
                        <span className="font-medium text-base-content truncate">
                          {row.forName || "Unknown"}
                        </span>
                        {!scopedToSingleSubject && (
                          <span className={`badge badge-sm w-fit ${
                            row.isForDependant ? 'badge-secondary' : 'badge-primary'
                          }`}>
                            {row.isForDependant ? 'Dependant' : 'Patient'}
                          </span>
                        )}
                      </div>
                      <span className={`badge shrink-0 ${row.status === 'Pending' ? 'badge-warning' : row.status === 'Dispensed' ? 'badge-success' : 'badge-ghost'}`}>
                        {row.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-base-content/60">
                      <span>{row.date}</span>
                      <span>{row.medicationsCount} medication{row.medicationsCount === 1 ? '' : 's'}</span>
                    </div>

                    {row.medicationsSummary?.length > 0 && (
                      <ul className="list-disc list-inside text-xs text-base-content/80">
                        {row.medicationsSummary.map((med, i) => (
                          <li key={i}>{med}</li>
                        ))}
                        {row.medicationsCount > 2 && <li>...</li>}
                      </ul>
                    )}

                    <div className="text-right font-medium text-primary text-sm">
                      {row.totalPrice ? `₦${Number(row.totalPrice).toLocaleString()}` : '—'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-base-content/70">No prescriptions found</div>
              )}
            </div>

            {paginationData.totalPages > 1 && (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-base-200 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-base-content/70">
                  Page {currentPage} of {paginationData.totalPages} ({paginationData.totalItems} items)
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: Math.min(paginationData.totalPages, 5) }).map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${currentPage === pageNum ? 'btn-active' : 'btn-outline'}`}
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    className="btn btn-sm btn-outline"
                    disabled={currentPage === paginationData.totalPages}
                    onClick={() => setCurrentPage(p => Math.min(paginationData.totalPages, p + 1))}
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

export default PrescriptionHistoryTable;