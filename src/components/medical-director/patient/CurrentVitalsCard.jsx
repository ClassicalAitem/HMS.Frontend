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

const CurrentVitalsCard = ({ patient, latest, loading, onRecordOpen, buttonHidden = false }) => {
  const nurseName = useNurseName(latest?.nurseId);
  const [expanded, setExpanded] = useState(false);
  const isStale = latest?.updatedAt && (Date.now() - new Date(latest.updatedAt).getTime() > 24 * 60 * 60 * 1000);

  const bmi = latest?.weight && latest?.height ? (latest.weight / Math.pow(latest.height / 100, 2)).toFixed(1) : null;

  const StatCard = ({ icon: Icon, label, value, unit, className = "" }) => (
    <div className={`rounded-xl border border-base-300 p-2 ${className}`}>
      <div className="flex items-center gap-2 text-sm text-base-content/80">
        <Icon className="w-5 h-5 shrink-0" />
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold">{value}</span>
        <span className="text-sm text-base-content/70">{unit}</span>
      </div>
    </div>
  );

  return (
    <div className={`shadow-xl card bg-base-100 mb-2 ${isStale ? 'border-warning' : ''}`}>
      <div className="p-4 card-body">
        <div className="flex flex-col gap-3 mb-1 sm:flex-row sm:justify-between sm:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-xl font-semibold text-base-content">Current Vitals</h2>
              {nurseName && (
                <span className="flex items-center gap-1 text-sm text-base-content/70">
                  <FiUser className="w-4 h-4" /> Recorded by NURSE {nurseName}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-base font-medium text-base-content">
                {latest?.forName || patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim() || "Patient"}
              </span>
              <span
                className={`badge ${latest?.isForDependant ? 'badge-secondary' : 'badge-primary'}`}
              >
                {latest?.isForDependant ? 'Dependant' : 'Patient'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-base-content/70 mt-1">
              {patient?.ward || patient?.bed ? (
                <span>
                  {patient?.ward ? `Ward ${patient.ward}` : ""}
                  {patient?.ward && patient?.bed ? " - " : ""}
                  {patient?.bed ? `Bed ${patient.bed}` : ""}
                </span>
              ) : (
                <span>Ward info unavailable</span>
              )}
              <span className="hidden sm:inline">•</span>
              <span>Last updated {formatRelativeTime(latest?.updatedAt)}</span>
            </div>
          </div>
          <button
            className={`btn btn-outline ${buttonHidden ? "hidden" : ""} btn-sm w-full sm:w-auto`}
            onClick={onRecordOpen}
          >
            Record Vitals
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-1 mt-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="skeleton h-20 w-full" />
            ))}
          </div>
        ) : latest ? (
          <>
            {/* Desktop / tablet: always show full grid */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-8 gap-1 mt-3">
              <StatCard icon={FiHeart} label="Heart Rate" value={isStale ? "—" : (latest?.pulse ?? "—")} unit="bpm" />
              <StatCard icon={TbHeartbeat} label="Blood Pressure" value={isStale ? "—" : (latest?.bp ?? "—")} unit="mmHg" />
              <StatCard icon={LuDroplet} label="Oxygen" value={isStale ? "—" : (latest?.spo2 ?? "—")} unit="%" />
              <StatCard icon={LuThermometer} label="Temperature" value={isStale ? "—" : (latest?.temperature ?? "—")} unit="°C" />
              <StatCard icon={GiWeightLiftingUp} label="Weight" value={isStale ? "—" : (latest?.weight ?? "—")} unit="kg" />
              <StatCard icon={GiBodyHeight} label="Height" value={isStale ? "—" : (latest?.height ?? "—")} unit="cm" />
              <StatCard icon={GiWeightLiftingUp} label="BMI" value={isStale ? "—" : (bmi ?? "—")} unit="kg/m²" />
              <StatCard icon={LuActivity} label="Respiratory Rate" value={isStale ? "—" : (latest?.respiratoryRate ?? "—")} unit="bpm" />
              <div className="rounded-xl border border-base-300 p-2">
                <div className="flex items-center gap-2 text-sm text-base-content/80">
                  <FiClock className="w-5 h-5 shrink-0" />
                  <span>Last Updated</span>
                </div>
                <div className="mt-2">
                  <span className="text-sm font-semibold">{formatRelativeTime(latest?.createdAt) || "—"}</span>
                </div>
              </div>
            </div>

            {/* Mobile: collapsed preview + expandable rest */}
            <div className="sm:hidden mt-3">
              <div className="grid grid-cols-2 gap-1">
                <StatCard icon={FiHeart} label="Heart Rate" value={isStale ? "—" : (latest?.pulse ?? "—")} unit="bpm" />
                <StatCard icon={TbHeartbeat} label="Blood Pressure" value={isStale ? "—" : (latest?.bp ?? "—")} unit="mmHg" />
              </div>

              {expanded && (
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <StatCard icon={LuDroplet} label="Oxygen" value={isStale ? "—" : (latest?.spo2 ?? "—")} unit="%" />
                  <StatCard icon={LuThermometer} label="Temperature" value={isStale ? "—" : (latest?.temperature ?? "—")} unit="°C" />
                  <StatCard icon={GiWeightLiftingUp} label="Weight" value={isStale ? "—" : (latest?.weight ?? "—")} unit="kg" />
                  <StatCard icon={GiBodyHeight} label="Height" value={isStale ? "—" : (latest?.height ?? "—")} unit="cm" />
                  <StatCard icon={GiWeightLiftingUp} label="BMI" value={isStale ? "—" : (bmi ?? "—")} unit="kg/m²" />
                  <StatCard icon={LuActivity} label="Respiratory Rate" value={isStale ? "—" : (latest?.respiratoryRate ?? "—")} unit="bpm" />
                  <StatCard
                    icon={FiClock}
                    label="Last Updated"
                    value={formatRelativeTime(latest?.createdAt) || "—"}
                    unit=""
                    className="col-span-2"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="btn btn-ghost btn-sm w-full mt-2 gap-1"
              >
                {expanded ? (
                  <>Show less <FiChevronUp className="w-4 h-4" /></>
                ) : (
                  <>Show more vitals <FiChevronDown className="w-4 h-4" /></>
                )}
              </button>
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