import React, { useState, useMemo } from "react";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const VitalsHistoryTable = ({ sortedVitals, loading }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 2;

  const paginationData = useMemo(() => {
    const vitals = sortedVitals || [];
    const totalItems = vitals.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIdx = (currentPage - 1) * itemsPerPage;
    const paginatedItems = vitals.slice(startIdx, startIdx + itemsPerPage);
    return { paginatedItems, totalPages, totalItems };
  }, [sortedVitals, currentPage]);

  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-base-content">Vitals History</h2>
          <div className="text-sm text-base-content/70">Showing {paginationData.totalItems} readings</div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Blood Pressure</th>
                    <th>Heart Rate</th>
                    <th>Temperature</th>
                    <th>Weight</th>
                    <th>Height</th>
                    <th>O2 Saturation</th>
                    <th>Respiratory Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedItems?.length ? paginationData.paginatedItems.map((v, i) => (
                    <tr key={i} className="hover">
                      <td>{v?.createdAt ? formatNigeriaTime(v.createdAt) : "—"}</td>
                      <td>{v?.bp ?? "—"} <span className="text-sm text-base-content/70">mnHg</span></td>
                      <td>{v?.pulse ?? "—"} <span className="text-sm text-base-content/70">bpm</span></td>
                      <td>{v?.temperature ?? "—"} <span className="text-sm text-base-content/70">°F</span></td>
                      <td>{v?.weight ?? "—"} <span className="text-sm text-base-content/70">kg</span></td>
                      <td>{v?.height ?? "—"} <span className="text-sm text-base-content/70">cm</span></td>
                      <td>{v?.spo2 ?? v?.oxygen ?? "—"} <span className="text-sm text-base-content/70">%</span></td>
                      <td>{v?.respiratoryRate ?? "—"} <span className="text-sm text-base-content/70">bpm</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={8} className="text-center text-base-content/70 py-6">No vitals history found</td>
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

export default VitalsHistoryTable;