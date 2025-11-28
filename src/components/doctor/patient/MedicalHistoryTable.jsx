import React from "react";

const MedicalHistoryTable = ({ rows, onAdd, onViewDetails, loading = false }) => {
  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-base-content">Medical History</h2>
          <button className="btn btn-success btn-sm" onClick={onAdd}>+ Add New Diagnosis</button>
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
                {Array.isArray(rows) && rows.length > 0 ? (
                  rows.map((row, idx) => (
                    <tr key={idx} className="hover">
                      <td>{row.type}</td>
                      <td>{row.diagnosis}</td>
                      <td>{row.time}</td>
                      <td>{row.date}</td>
                      <td>{row.notes}</td>
                      <td>
                        <button className="text-primary hover:underline text-sm" onClick={() => { if (typeof onViewDetails === 'function') onViewDetails(row, idx); }}>View Details</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-6 text-base-content/70">No consultations found</td>
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

export default MedicalHistoryTable;
