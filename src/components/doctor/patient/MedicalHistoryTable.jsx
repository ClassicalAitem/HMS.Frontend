import React, { useState, useMemo } from "react";

const MedicalHistoryTable = ({ rows, onAdd, onViewDetails, onEdit, onViewAll, loading = false }) => {
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
          <h2 className="text-lg font-semibold text-base-content">Medical History</h2>
          <div className="flex gap-2">
            <button className="btn btn-success btn-sm" onClick={onAdd}>+ Add New Consultation</button>
            <button className="btn btn-outline btn-sm" onClick={typeof onViewAll === 'function' ? onViewAll : undefined}>View Consultation Records</button>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-6 w-40" />
            <div className="overflow-hidden rounded-lg border border-base-300/40 bg-base-100">
              <div className="overflow-auto max-h-64 p-4 space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
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
                    <th>Type</th>
                    <th>Diagnosis</th>
                    <th>Time</th>
                    <th>Date</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <React.Fragment key={idx}>
                        <tr className="hover">
                          <td>{row.type}</td>
                          <td>{row.diagnosis}</td>
                          <td>{row.time}</td>
                          <td>{row.date}</td>
                          <td>{row.notes}</td>
                          <td className="space-x-2">
                            <button className="text-primary hover:underline text-sm" onClick={() => setCurrentPage(idx + 1)}>
                              {row._expanded ? 'Hide Details' : 'View Details'}
                            </button>
                            {typeof onEdit === 'function' && (
                              <button
                                className={`text-secondary hover:underline text-sm ${row.canEdit ? '' : 'opacity-50 cursor-not-allowed'}`}
                                onClick={() => { if (row.canEdit) onEdit(row, idx); }}
                                disabled={!row.canEdit}
                              >
                                Edit
                              </button>
                            )}
                          </td>
                        </tr>
                        {row._expanded && (
                          <tr>
                            <td colSpan={6} className="bg-base-200/40 p-4 text-left">
                              <div className="collapse collapse-open">
                                <div className="collapse-content">
                                  <strong>Diagnosis:</strong> {row.diagnosis}<br />
                                  <strong>Notes:</strong> {row.notes}<br />
                                  <strong>Date:</strong> {row.date}<br />
                                  <strong>Time:</strong> {row.time}<br />
                                  {/* Add more consultation details here as needed */}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-base-content/70">No consultations found</td>
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
                  {Array.from({ length: paginationData.totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`btn btn-sm ${currentPage === i + 1 ? 'btn-active' : 'btn-outline'}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  ))}
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

export default MedicalHistoryTable;
