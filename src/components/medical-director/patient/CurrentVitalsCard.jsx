import React, { useState } from "react";
import { FiHeart, FiClock, FiUser, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { TbHeartbeat } from "react-icons/tb";
import { LuActivity, LuDroplet, LuThermometer } from "react-icons/lu";
import { GiBodyHeight, GiWeightLiftingUp } from "react-icons/gi";
import { useNurseName } from "@/utils/useNurseName";

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

const CurrentVitalsCard = ({ patient, latest, loading, onRecordOpen, buttonHidden = false, defaultExpanded = false }) => {
  const nurseName = useNurseName(latest?.nurseId);
  const [isOpen, setIsOpen] = useState(defaultExpanded);
  const isStale = latest?.updatedAt && (Date.now() - new Date(latest.updatedAt).getTime() > 24 * 60 * 60 * 1000);

  const bmi = latest?.weight && latest?.height ? (latest.weight / Math.pow(latest.height / 100, 2)).toFixed(1) : null;

  const StatCard = ({ icon: Icon, label, value, unit, className = "" }) => (
    <div className={`rounded-xl border border-base-300 p-2.5 bg-base-100/60 ${className}`}>
      <div className="flex items-center gap-1.5 text-xs text-base-content/70">
        <Icon className="w-4 h-4 shrink-0 text-primary" />
        <span className="truncate">{label}</span>
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="text-xl font-bold text-base-content">{value}</span>
        {unit && <span className="text-xs text-base-content/60">{unit}</span>}
      </div>
    </div>
  );

  const subjectName = latest?.forName || patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient";
  const isDependant = latest?.isForDependant ?? (patient?.isDependant || !!patient?.dependantId);

  return (
    <div className={`shadow-md card bg-base-100 mb-3 border border-base-200 transition-all duration-200 ${isStale ? 'border-warning' : ''}`}>
      <div className="p-4">
        {/* Clickable Header for Collapsible behavior */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div
            className="flex-1 min-w-0 cursor-pointer select-none"
            onClick={() => setIsOpen((prev) => !prev)}
          >
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
                <span>Current Vitals</span>
                <span className={`badge badge-sm font-semibold ${isDependant ? 'badge-secondary' : 'badge-primary'}`}>
                  {isDependant ? 'Dependant' : 'Patient'}
                </span>
              </h2>

              {nurseName && (
                <span className="hidden md:inline-flex items-center gap-1 text-xs text-base-content/60">
                  <FiUser className="w-3.5 h-3.5 text-primary" /> Nurse {nurseName}
                </span>
              )}

              {latest?.updatedAt && (
                <span className="text-xs text-base-content/50">
                  · {formatRelativeTime(latest?.updatedAt)}
                </span>
              )}
            </div>

            <div className="text-sm font-medium text-base-content/90 truncate mt-0.5">
              {subjectName}
            </div>

            {/* Quick Summary Badges when Collapsed or Expanded */}
            {!loading && latest && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {latest?.bp && (
                  <span className="badge badge-sm badge-outline gap-1 font-mono font-medium">
                    <TbHeartbeat className="w-3 h-3 text-error" /> {latest.bp} mmHg
                  </span>
                )}
                {latest?.pulse && (
                  <span className="badge badge-sm badge-outline gap-1 font-mono font-medium">
                    <FiHeart className="w-3 h-3 text-secondary" /> {latest.pulse} bpm
                  </span>
                )}
                {latest?.temperature && (
                  <span className="badge badge-sm badge-outline gap-1 font-mono font-medium">
                    <LuThermometer className="w-3 h-3 text-warning" /> {latest.temperature} °C
                  </span>
                )}
                {latest?.spo2 && (
                  <span className="badge badge-sm badge-outline gap-1 font-mono font-medium">
                    <LuDroplet className="w-3 h-3 text-info" /> {latest.spo2}% SpO2
                  </span>
                )}
                {latest?.weight && (
                  <span className="badge badge-sm badge-ghost font-mono text-xs hidden sm:inline-flex">
                    {latest.weight} kg
                  </span>
                )}
                {bmi && (
                  <span className="badge badge-sm badge-ghost font-mono text-xs hidden sm:inline-flex">
                    BMI {bmi}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              className={`btn btn-outline btn-xs sm:btn-sm ${buttonHidden ? "hidden" : ""}`}
              onClick={onRecordOpen}
            >
              Record Vitals
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
              title={isOpen ? "Collapse vitals details" : "Expand vitals details"}
              aria-label={isOpen ? "Collapse vitals details" : "Expand vitals details"}
            >
              {isOpen ? <FiChevronUp className="w-5 h-5" /> : <FiChevronDown className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="mt-4 pt-3 border-t border-base-200 animate-in fade-in slide-in-from-top-2 duration-150">
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skeleton h-20 w-full rounded-xl" />
                ))}
              </div>
            ) : latest ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                <StatCard icon={FiHeart} label="Heart Rate" value={isStale ? "—" : (latest?.pulse ?? "—")} unit="bpm" />
                <StatCard icon={TbHeartbeat} label="Blood Pressure" value={isStale ? "—" : (latest?.bp ?? "—")} unit="mmHg" />
                <StatCard icon={LuDroplet} label="Oxygen" value={isStale ? "—" : (latest?.spo2 ?? "—")} unit="%" />
                <StatCard icon={LuThermometer} label="Temperature" value={isStale ? "—" : (latest?.temperature ?? "—")} unit="°C" />
                <StatCard icon={GiWeightLiftingUp} label="Weight" value={isStale ? "—" : (latest?.weight ?? "—")} unit="kg" />
                <StatCard icon={GiBodyHeight} label="Height" value={isStale ? "—" : (latest?.height ?? "—")} unit="cm" />
                <StatCard icon={GiWeightLiftingUp} label="BMI" value={isStale ? "—" : (bmi ?? "—")} unit="kg/m²" />
                <StatCard icon={LuActivity} label="Respiratory" value={isStale ? "—" : (latest?.respiratoryRate ?? "—")} unit="bpm" />
              </div>
            ) : (
              <div className="py-4 text-center text-sm text-base-content/60">
                No vital readings recorded yet. Click "Record Vitals" to add.
              </div>
            )}

            {latest?.notes && (
              <div className="mt-3 p-2.5 bg-base-200/40 rounded-lg text-xs text-base-content/80">
                <span className="font-semibold text-base-content/60 uppercase block mb-0.5">Nurse Notes</span>
                {latest.notes}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CurrentVitalsCard;