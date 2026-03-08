import React, { useState, useMemo } from "react";
import { FaFlask, FaCheckCircle, FaClock, FaExclamationCircle } from "react-icons/fa";

const LabHistoryTable = ({ rows = [], loading = false, onViewResult }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paginationData = useMemo(() => {
    const totalItems = Array.isArray(rows) ? rows.length : 0;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = Array.isArray(rows) ? rows.slice(startIdx, startIdx + itemsPerPage) : [];
    return { paginatedItems, totalPages, totalItems };
  }, [rows, currentPage]);

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return <FaCheckCircle className="text-success w-4 h-4" />;
      case 'in_progress':
      case 'processing':
        return <FaClock className="text-info w-4 h-4" />;
      case 'pending':
        return <FaClock className="text-warning w-4 h-4" />;
      default:
        return <FaExclamationCircle className="text-error w-4 h-4" />;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
      case 'processing':
        return 'badge-info';
      case 'pending':
        return 'badge-warning';
      default:
        return 'badge-ghost';
    }
  };

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <FaFlask className="text-info w-5 h-5" />
            <h2 className="text-lg font-semibold text-base-content">Lab Results History</h2>
          </div>
          <div className="text-sm text-base-content/70">{paginationData.totalItems} results</div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full text-sm">
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Investigation Type</th>
                    <th>Test Date</th>
                    <th>Tests</th>
                    <th>Priority</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedItems.length > 0 ? (
                    paginationData.paginatedItems.map((row, idx) => (
                      <tr key={idx} className="hover">
                        <td>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(row.status)}
                            <span className={`badge ${getStatusBadgeClass(row.status)} badge-sm`}>
                              {row.status ? row.status.replace('_', ' ') : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="text-xs text-base-content/70">{row.type || 'Lab'}</td>
                        <td className="text-xs">{row.date || '—'}</td>
                        <td className="text-xs">
                          <div className="flex flex-wrap gap-1">
                            {Array.isArray(row.tests) && row.tests.length > 0 ? (
                              <>
                                {row.tests.slice(0, 2).map((test, tIdx) => (
                                  <span key={tIdx} className="badge badge-outline badge-xs">
                                    {typeof test === 'string' ? test : test.name || '—'}
                                  </span>
                                ))}
                                {row.tests.length > 2 && (
                                  <span className="badge badge-outline badge-xs">+{row.tests.length - 2}</span>
                                )}
                              </>
                            ) : (
                              '—'
                            )}
                          </div>
                        </td>
                        <td>
                          {row.priority === 'urgent' ? (
                            <span className="badge badge-error badge-xs">Urgent</span>
                          ) : (
                            <span className="badge badge-ghost badge-xs">Normal</span>
                          )}
                        </td>
                        <td>
                          {row.status?.toLowerCase() === 'completed' && (
                            <button
                              className="btn btn-xs btn-primary"
                              onClick={() => onViewResult && onViewResult(row)}
                            >
                              View
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center text-base-content/70 py-6">
                        No lab results found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {paginationData.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-base-200">
                <span className="text-sm text-base-content/70">
                  Page {currentPage} of {paginationData.totalPages}
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

export default LabHistoryTable;
