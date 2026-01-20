import React from "react";

const PrescriptionHistoryTable = ({ rows, loading = false }) => {
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
                  <div key={i} className="grid grid-cols-5 gap-3">
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
          <div className="overflow-x-auto">
            <table className="table w-full text-center">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Medications Count</th>
                  <th>Created At</th>
                  <th>Medications</th>
                </tr>
              </thead>
              <tbody>
                {Array.isArray(rows) && rows.length > 0 ? (
                  rows.map((row, idx) => (
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-6 text-base-content/70">No prescriptions found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionHistoryTable;