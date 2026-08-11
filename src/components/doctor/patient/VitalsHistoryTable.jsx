import React, { useState, useMemo } from "react";
import { formatNigeriaTime } from "@/utils/formatDateTimeUtils";

const VitalsHistoryTable = ({ sortedVitals, loading, onViewAll, patientName = "Patient", scopedToSingleSubject = false }) => {
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
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h2 className="text-lg font-semibold text-base-content">Vitals History</h2>
            <p className="text-base-content/70 text-sm mt-1">For: <span className="font-medium text-base-content">{patientName}</span></p>
          </div>
          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="text-sm text-base-content/70">Showing {paginationData.totalItems} readings</div>
            {onViewAll && (
              <button className="btn btn-outline btn-sm" onClick={onViewAll}>
                View All
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : (
          <>
            {/* Desktop / tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="table w-full">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Nurse</th>
                    <th>Time</th>
                    <th>B.P</th>
                    <th>Heart Rate</th>
                    <th>Temperature</th>
                    <th>Weight</th>
                    <th>Height</th>
                    <th>Respiratory Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {paginationData.paginatedItems?.length ? paginationData.paginatedItems.map((v, i) => (
                    <tr key={i} className="hover">
                      <td className="py-3">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium text-base-content">{v?.forName}</span>
                          {!scopedToSingleSubject && (
                            <span
                              className={`badge badge-sm ${v?.isForDependant ? 'badge-secondary' : 'badge-primary'}`}
                            >
                              {v?.isForDependant ? 'Dependant' : 'Patient'}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="text-sm">{v?.nurseName || 'Unknown Nurse'}</td>
                      <td>{v?.createdAt ? formatNigeriaTime(v.createdAt) : "—"}</td>
                      <td>{v?.bp ?? "—"} <span className="text-sm text-base-content/70">mnHg</span></td>
                      <td>{v?.pulse ?? "—"} <span className="text-sm text-base-content/70">bpm</span></td>
                      <td>{v?.temperature ?? "—"} <span className="text-sm text-base-content/70">°F</span></td>
                      <td>{v?.weight ?? "—"} <span className="text-sm text-base-content/70">kg</span></td>
                      <td>{v?.height ?? "—"} <span className="text-sm text-base-content/70">cm</span></td>
                      <td>{v?.respiratoryRate ?? "—"} <span className="text-sm text-base-content/70">bpm</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={9} className="text-center text-base-content/70 py-6">No vitals history found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile card list */}
            <div className="sm:hidden space-y-3">
              {paginationData.paginatedItems?.length ? paginationData.paginatedItems.map((v, i) => (
                <div key={i} className="border border-base-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-medium text-base-content truncate">{v?.forName}</span>
                      {!scopedToSingleSubject && (
                        <span
                          className={`badge badge-sm w-fit ${v?.isForDependant ? 'badge-secondary' : 'badge-primary'}`}
                        >
                          {v?.isForDependant ? 'Dependant' : 'Patient'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-base-content/60 text-right shrink-0">
                      {v?.createdAt ? formatNigeriaTime(v.createdAt) : "—"}
                    </span>
                  </div>

                  <div className="text-xs text-base-content/60">{v?.nurseName || 'Unknown Nurse'}</div>

                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm pt-1">
                    <div className="flex justify-between">
                      <span className="text-base-content/60">B.P</span>
                      <span>{v?.bp ?? "—"} <span className="text-xs text-base-content/50">mnHg</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Heart Rate</span>
                      <span>{v?.pulse ?? "—"} <span className="text-xs text-base-content/50">bpm</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Temp</span>
                      <span>{v?.temperature ?? "—"} <span className="text-xs text-base-content/50">°F</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Weight</span>
                      <span>{v?.weight ?? "—"} <span className="text-xs text-base-content/50">kg</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Height</span>
                      <span>{v?.height ?? "—"} <span className="text-xs text-base-content/50">cm</span></span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-base-content/60">Resp. Rate</span>
                      <span>{v?.respiratoryRate ?? "—"} <span className="text-xs text-base-content/50">bpm</span></span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center text-base-content/70 py-6">No vitals history found</div>
              )}
            </div>

            {paginationData.totalPages > 1 && (
              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-base-200 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm text-base-content/70">
                  Page {currentPage} of {paginationData.totalPages}
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

export default VitalsHistoryTable;