import React, { useState, useMemo } from "react";

const PrescriptionHistoryTable = ({ rows, loading = false }) => {
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
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-base-content">Prescription History</h2>
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
            <div className="overflow-x-auto">
              <table className="table w-full text-center">
                <thead>
                  <tr>
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
                        <td>
                          <span className={`badge ${row.status === 'pending' ? 'badge-warning' : row.status === 'dispensed' ? 'badge-success' : 'badge-ghost'}`}>
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
                      <td colSpan={5} className="py-6 text-base-content/70">No prescriptions found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {paginationData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
                <span className="text-sm text-base-content/70">
                  Page {currentPage} of {paginationData.totalPages} ({paginationData.totalItems} items)
                </span>
                <div className="flex gap-2">
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