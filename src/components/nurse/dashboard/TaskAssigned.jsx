import React from "react";
import { useNavigate } from "react-router-dom";
import { GrTask } from "react-icons/gr";
import { RiArrowLeftRightFill, RiArrowRightLine } from "react-icons/ri";
import { EmptyState } from "@/components/common";

const TaskAssigned = ({ tasksCount = 0, incoming = [], loading = false, onRefresh }) => {
  const navigate = useNavigate();

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s.includes('vitals')) {
      return 'bg-primary/10 text-primary border border-primary/20';
    }
    if (s.includes('sampling')) {
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20';
    }
    if (s.includes('injection')) {
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20';
    }
    return 'bg-base-200 text-base-content/80 border border-base-300';
  };

  const prettifyStatus = (status) => {
    const s = String(status || '').toLowerCase().replace(/_/g, ' ');
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Card 1: Tasks Assigned Metric */}
        <div className="lg:col-span-4 bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <GrTask className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-base-content">
                  Tasks Assigned
                </h3>
                <p className="text-xs text-base-content/60">Today&apos;s vitals & care target</p>
              </div>
            </div>
            <span className="badge badge-primary badge-outline badge-sm font-semibold">
              Today
            </span>
          </div>

          <div className="py-2">
            {loading ? (
              <div className="animate-pulse w-24 h-12 rounded-xl bg-base-300" />
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl sm:text-5xl font-extrabold text-primary tracking-tight">
                  {tasksCount}
                </span>
                <span className="text-xs font-semibold text-base-content/60">
                  observations recorded
                </span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-base-200">
            <button
              onClick={() => navigate('/dashboard/nurse/incoming')}
              className="btn btn-sm btn-outline btn-primary w-full rounded-xl gap-2 font-medium"
            >
              <span>View Incoming Work Queue</span>
              <RiArrowRightLine className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Card 2: Incoming Queue Preview */}
        <div className="lg:col-span-8 bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-base-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 text-primary rounded-xl">
                <RiArrowLeftRightFill className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-bold text-base-content">
                    Incoming Patient Queue
                  </h3>
                  <span className="badge badge-primary badge-sm font-bold">
                    {incoming.length}
                  </span>
                </div>
                <p className="text-xs text-base-content/60">
                  Patients dispatched to nursing station awaiting care
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/dashboard/nurse/incoming')}
              className="btn btn-xs btn-ghost text-primary font-semibold gap-1 hover:bg-primary/10 rounded-lg"
            >
              <span>View All</span>
              <RiArrowRightLine className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="min-h-[160px]">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl border border-base-200 bg-base-200/30 animate-pulse"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-base-300" />
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-32 rounded bg-base-300" />
                        <div className="h-3 w-20 rounded bg-base-300" />
                      </div>
                    </div>
                    <div className="h-4 w-16 rounded bg-base-300" />
                  </div>
                ))}
              </div>
            ) : incoming.length === 0 ? (
              <EmptyState
                title="No incoming patients"
                description="Your queue is clear. Patients sent for vitals, injections, or sampling will appear here."
                actionLabel="Refresh Queue"
                onAction={onRefresh}
              />
            ) : (
              <div className="space-y-2.5">
                {incoming.slice(0, 4).map((patient, index) => {
                  const initials = (patient.patientName || "P")
                    .split(" ")
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("")
                    .toUpperCase();

                  return (
                    <div
                      key={index}
                      className="p-3 rounded-xl border border-base-200 hover:border-primary/40 bg-base-200/20 hover:bg-base-200/50 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-base-content truncate">
                              {patient.patientName}
                            </span>
                            {patient.hospitalId && (
                              <span className="badge badge-ghost badge-xs font-mono">
                                {patient.hospitalId}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-base-content/60">
                            <span>Sent by {patient.administeredBy}</span>
                            {patient.status && (
                              <span
                                className={`badge badge-xs font-medium ${getStatusBadge(
                                  patient.status
                                )}`}
                              >
                                {prettifyStatus(patient.status)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-base-content/60 font-medium">
                          {patient.time}
                        </span>
                        <button
                          onClick={() => {
                            if (patient.patientId) {
                              navigate(`/dashboard/nurse/patient/${patient.patientId}`, {
                                state: { from: 'dashboard' }
                              });
                            } else {
                              navigate('/dashboard/nurse/incoming');
                            }
                          }}
                          className="btn btn-xs btn-primary rounded-lg font-medium shadow-2xs"
                        >
                          Attend
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskAssigned;
