import React, { useState, useMemo } from "react";

const AdmissionHistoryTable = ({ rows, loading = false, onViewAll, scopedToSingleSubject = false, hidePrice = false }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paginationData = useMemo(() => {
    const totalItems = Array.isArray(rows) ? rows.length : 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = Array.isArray(rows) ? rows.slice(startIdx, startIdx + itemsPerPage) : [];
    return { paginatedItems, totalPages, totalItems };
  }, [rows, currentPage]);

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "active":
        return "badge-success";
      case "discharged":
        return "badge-ghost";
      case "cancelled":
        return "badge-error";
      default:
        return "badge-ghost";
    }
  };

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-base-content">Admission History</h2>
          <button
            className="btn btn-outline btn-sm"
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
            <div className="overflow-x-auto">
              <table className="table w-full text-center">
                <thead>
                  <tr>
                    <th>Patient Type</th>
                    <th>Ward</th>
                    <th>Status</th>
                    <th>Items Count</th>
                    <th>Created At</th>
                    <th>Items</th>
                    {!hidePrice && <th>Total Price</th>}
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

                        <td className="font-medium text-sm">{row.ward || "—"}</td>

                        <td>
                          <span className={`badge ${getStatusBadge(row.status)}`}>
                            {row.status
                              ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
                              : "—"}
                          </span>
                        </td>

                        <td>{row.itemsCount}</td>
                        <td>{row.date}</td>
                        <td className="text-left">
                          <div className="space-y-2">
                            {(row.items && row.items.length > 0
                              ? row.items
                              : (row.itemsSummary || []).map(name => ({ name, admissionCovered: [] }))
                            ).map((item, i) => (
                              <div key={item._id || i}>
                                <span className="text-xs font-medium">{item.name}</span>
                                {Array.isArray(item.admissionCovered) && item.admissionCovered.length > 0 && (
                                  <ul className="list-disc list-inside mt-1 ml-1 text-xs text-base-content/60">
                                    {item.admissionCovered.map((cond, ci) => (
                                      <li key={ci}>{cond}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                        </td>
                        {!hidePrice && (
                          <td className="font-medium text-primary">
                            {row.totalPrice ? `₦${Number(row.totalPrice).toLocaleString()}` : '—'}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={hidePrice ? 6 : 7} className="py-6 text-base-content/70">No admissions found</td>
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

export default AdmissionHistoryTable;