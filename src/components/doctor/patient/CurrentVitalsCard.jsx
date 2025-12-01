import React from "react";
import { FiHeart, FiClock } from "react-icons/fi";
import { TbHeartbeat } from "react-icons/tb";
import { LuDroplet, LuThermometer } from "react-icons/lu";
import { GiWeightLiftingUp } from "react-icons/gi";

const formatRelativeTime = (dateInput) => {
  if (!dateInput) return "";
  const now = new Date();
  const then = new Date(dateInput);
  const diffMs = now.getTime() - then.getTime();
  if (Number.isNaN(diffMs)) return "";
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hour${diffHr > 1 ? "s" : ""} ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} day${diffDay > 1 ? "s" : ""} ago`;
};

const CurrentVitalsCard = ({ patient, latest, loading, onRecordOpen, buttonHidden = false }) => {
  return (
    <div className="shadow-xl card bg-base-100 mb-4">
      <div className="p-4 card-body">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xl font-semibold text-base-content">Current Vitals - {patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient"}</h2>
            <div className="flex items-center gap-2 text-sm text-base-content/70">
              {patient?.ward || patient?.bed ? (
                <span>
                  {patient?.ward ? `Ward ${patient.ward}` : ""}
                  {patient?.ward && patient?.bed ? " - " : ""}
                  {patient?.bed ? `Bed ${patient.bed}` : ""}
                </span>
              ) : (
                <span>Ward info unavailable</span>
              )}
              <span>•</span>
              <span>Last updated {formatRelativeTime(latest?.createdAt)}</span>
            </div>
          </div>
          <button className={`btn btn-outline ${buttonHidden ? "hidden" : ""} btn-sm`} onClick={onRecordOpen}> Record Vitals</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : latest ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-xl border border-base-300 p-3">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <FiHeart className="w-5 h-5" />
                  <span>Heart Rate</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{latest?.heartRate ?? latest?.pulse ?? "—"}</span>
                  <span className="text-sm text-base-content/70">bpm</span>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 p-3">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <TbHeartbeat className="w-5 h-5" />
                  <span>Blood Pressure</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{latest?.bloodPressure ?? latest?.bp ?? "—"}</span>
                  <span className="text-sm text-base-content/70">bpm</span>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 p-3">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <LuDroplet className="w-5 h-5" />
                  <span>Oxygen</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{latest?.oxygenSaturation ?? latest?.oxygen ?? latest?.spo2 ?? "—"}</span>
                  <span className="text-sm text-base-content/70">%</span>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 p-3">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <LuThermometer className="w-5 h-5" />
                  <span>Temperature</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{latest?.temperature ?? "—"}</span>
                  <span className="text-sm text-base-content/70">°F</span>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 p-3">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <GiWeightLiftingUp className="w-5 h-5" />
                  <span>Weight</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{latest?.weight ?? "—"}</span>
                  <span className="text-sm text-base-content/70">kg</span>
                </div>
              </div>

              <div className="rounded-xl border border-base-300 p-3">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <FiClock className="w-5 h-5" />
                  <span>Last Updated</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold">{formatRelativeTime(latest?.createdAt) || "—"}</span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <div className="rounded-xl border border-base-300 p-4">
                <div className="text-base font-medium text-base-content">Additional Notes</div>
                <div className="mt-2 text-sm text-base-content/80 min-h-24 whitespace-pre-wrap">
                  {latest?.notes ? latest.notes : "—"}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div className="text-sm text-base-content/70">No vitals available</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentVitalsCard;