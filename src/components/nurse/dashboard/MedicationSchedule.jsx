import React from "react";
import { BsClock } from "react-icons/bs";
import { FaHeartbeat, FaHistory } from "react-icons/fa";
import { RiRefreshLine } from "react-icons/ri";
import { EmptyState } from "@/components/common";

const MedicationSchedule = ({ recentActivity = [], loading = false, onRefresh }) => {
  return (
    <div className="w-full bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FaHistory className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
              Recent Clinical Activity Log
              <span className="badge badge-ghost badge-sm font-semibold">
                {recentActivity.length} logged
              </span>
            </h2>
            <p className="text-xs text-base-content/60">
              Audit log of vital signs, patient observations, and nursing care events
            </p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          className="btn btn-xs btn-ghost gap-1.5 text-primary hover:bg-primary/10 rounded-lg self-end sm:self-center font-medium"
          title="Refresh recent activity"
        >
          <RiRefreshLine className="w-3.5 h-3.5" />
          <span>Refresh</span>
        </button>
      </div>

      <div>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-base-200 bg-base-200/30 flex items-center justify-between animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-base-300" />
                  <div className="space-y-2">
                    <div className="h-4 w-36 rounded bg-base-300" />
                    <div className="h-3 w-48 rounded bg-base-300" />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col items-end">
                  <div className="h-5 w-20 rounded-full bg-base-300" />
                  <div className="h-3 w-16 rounded bg-base-300" />
                </div>
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="py-8">
            <EmptyState
              title="No recent clinical activity"
              description="Vital signs and clinical care assessments you record will appear here in chronological order."
              actionLabel="Refresh Activity"
              onAction={onRefresh}
            />
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="p-3.5 sm:p-4 rounded-xl border border-base-200 hover:border-primary/40 bg-base-200/15 hover:bg-base-200/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5 sm:mt-0">
                    <FaHeartbeat className="w-4 h-4 text-primary" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-sm font-bold text-base-content truncate">
                      {activity.headingTag}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/70">
                      <span className="font-medium text-base-content/90">
                        Patient: {activity.name}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-base-content/60">
                        ID: {activity.patientId}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-base-200/60">
                  <span className="badge badge-outline badge-primary badge-sm font-semibold capitalize px-2.5 py-2">
                    {activity.status || 'Active'}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs text-base-content/60 font-medium">
                    <BsClock className="w-3.5 h-3.5" />
                    <span>{activity.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicationSchedule;
