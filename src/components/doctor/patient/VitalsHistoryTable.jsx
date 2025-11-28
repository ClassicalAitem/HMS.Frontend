import React from "react";

const VitalsHistoryTable = ({ sortedVitals, loading }) => {
  return (
    <div className="shadow-xl card bg-base-100">
      <div className="p-4 card-body">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-base-content">Vitals History</h2>
          <div className="text-sm text-base-content/70">Showing {sortedVitals?.length || 0} readings</div>
        </div>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-10 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto max-h-64 overflow-y-auto">
            <table className="table w-full">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Blood Pressure</th>
                  <th>Heart Rate</th>
                  <th>Temperature</th>
                  <th>Weight</th>
                  <th>O2 Saturation</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedVitals?.length ? sortedVitals.map((v, i) => (
                  <tr key={i} className="hover">
                    <td>{v?.createdAt ? new Date(v.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                    <td>{v?.bp ?? "—"} <span className="text-sm text-base-content/70">mmHg</span></td>
                    <td>{v?.pulse ?? "—"} <span className="text-sm text-base-content/70">bpm</span></td>
                    <td>{v?.temperature ?? "—"} <span className="text-sm text-base-content/70">°F</span></td>
                    <td>{v?.weight ?? "—"} <span className="text-sm text-base-content/70">kg</span></td>
                    <td>{v?.spo2 ?? v?.oxygen ?? "—"} <span className="text-sm text-base-content/70">%</span></td>
                    <td><span className="badge badge-success">Normal</span></td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="text-center text-base-content/70 py-6">No vitals history found</td>
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

export default VitalsHistoryTable;