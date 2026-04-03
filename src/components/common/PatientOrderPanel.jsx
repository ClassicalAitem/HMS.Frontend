import React, { useMemo, useState } from "react";
import { FaFlask, FaPills, FaUserInjured, FaTimes, FaListUl } from "react-icons/fa";
import { formatNigeriaDateTime } from "@/utils/formatDateTimeUtils";

const isWithin72Hours = (createdAt) => {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < 72 * 60 * 60 * 1000;
};

const PREVIEW_LIMIT = 2; // cards shown before "View All"

// ─── Prescription Card ────────────────────────────────────────────────
const PrescriptionCard = ({ p, patientName }) => {
  const isForDependant = !!p?.dependantId;
  const forName = isForDependant ? 'Dependant' : patientName;

  return (
    <div className="border border-base-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-100">
        <span className="text-sm font-medium">{forName}</span>
        <span className={`badge badge-sm ${isForDependant ? 'badge-secondary' : 'badge-primary'}`}>
          {isForDependant ? 'Dependant' : 'Main Patient'}
        </span>
        <span className={`badge badge-sm ml-auto ${
          p?.status === 'pending' ? 'badge-warning' :
          p?.status === 'completed' ? 'badge-success' : 'badge-ghost'
        }`}>
          {p?.status || 'unknown'}
        </span>
      </div>

      {(p?.medications || []).length > 0 ? (
        <div className="space-y-1">
          {p.medications.map((med, mIdx) => (
           <div key={mIdx} className="text-sm space-y-1">
  {/* Top Row */}
  <div className="flex items-center justify-between">
    <span className="font-medium text-base-content">
      {med.drugName}
    </span>

    {/* Badges */}
    <div className="flex items-center gap-2">
      {med.medicationType === "injection" && (
        <span className="badge badge-outline badge-xs">
          Injection Status
        </span>
      )}

      {med.medicationType === "injection" && (
        <span
          className={`badge badge-xs ${
            med.injectionStatus === "pending"
              ? "badge-warning"
              : med.injectionStatus === "administered"
              ? "badge-success"
              : med.injectionStatus === "missed"
              ? "badge-error"
              : "badge-ghost"
          }`}
        >
          {med.injectionStatus || "unknown"}
        </span>
      )}
    </div>
  </div>

  {/* Dosage */}
  <div className="text-base-content/60">
    {med.dosage} · {med.frequency} · {med.duration}
  </div>

  {/* Instructions */}
  {med.instructions && (
    <p className="text-xs text-base-content/50">
      Instruction::   {med.instructions}
    </p>
  )}
</div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-base-content/50 italic">No medications</p>
      )}

      <p className="text-xs text-base-content/40 mt-2">
        {p?.createdAt ? formatNigeriaDateTime(p.createdAt) : '—'}
      </p>
    </div>
  );
};

// ─── Investigation Card ───────────────────────────────────────────────
const InvestigationCard = ({ inv, patientName }) => {
  const isForDependant = !!inv?.dependantId;
  const forName = isForDependant ? 'Dependant' : patientName;

  return (
    <div className="border border-base-200 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-100">
        <span className="text-sm font-medium">{forName}</span>
        <span className={`badge badge-sm ${isForDependant ? 'badge-secondary' : 'badge-primary'}`}>
          {isForDependant ? 'Dependant' : 'Main Patient'}
        </span>
        <div className="flex items-center gap-1 ml-auto">
          {inv?.priority === 'urgent' && (
            <span className="badge badge-error badge-xs">Urgent</span>
          )}
          <span className={`badge badge-sm ${
            inv?.status === 'completed' ? 'badge-success' :
            inv?.status === 'in_progress' ? 'badge-info' : 'badge-ghost'
          }`}>
            {(inv?.status || 'pending').replace('_', ' ')}
          </span>
        </div>
      </div>

      {(inv?.tests || []).length > 0 ? (
        <div className="space-y-1">
          {inv.tests.map((test, tIdx) => (
            <div key={tIdx} className="text-sm text-base-content/80">
              • {typeof test === 'string' ? test : test?.name || '—'}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-base-content/50 italic">No tests listed</p>
      )}

      <p className="text-xs text-base-content/40 mt-2">
        {inv?.createdAt ? formatNigeriaDateTime(inv.createdAt) : '—'}
      </p>
    </div>
  );
};

// ─── View All Modal ───────────────────────────────────────────────────
const ViewAllModal = ({ isOpen, onClose, title, icon, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl bg-base-100 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-200 shrink-0">
          <div className="flex items-center gap-2 font-semibold text-base-content">
            {icon}
            {title}
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FaTimes />
          </button>
        </div>
        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-3">
          {children}
        </div>
        <div className="p-4 border-t border-base-200 shrink-0 flex justify-end">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────
const PatientOrdersPanel = ({
  prescriptions = [],
  investigations = [],
  loading = false,
  role = "nurse",
  patientName = "Patient",
}) => {
  const [showAllPrescriptions, setShowAllPrescriptions] = useState(false);
  const [showAllInvestigations, setShowAllInvestigations] = useState(false);

  const recentPrescriptions = useMemo(() =>
    prescriptions.filter(p => isWithin72Hours(p?.createdAt)),
    [prescriptions]
  );

  const recentInvestigations = useMemo(() =>
    investigations.filter(inv => isWithin72Hours(inv?.createdAt)),
    [investigations]
  );

  if (loading) {
    return (
      <div className="space-y-4 mb-4">
        {[1, 2].map(i => (
          <div key={i} className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-4 space-y-3">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-16 w-full" />
              <div className="skeleton h-16 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (recentPrescriptions.length === 0 && recentInvestigations.length === 0) {
    return (
      <div className="card bg-base-100 shadow-sm border border-base-200 mb-4">
        <div className="card-body p-4 text-center text-base-content/50 text-sm py-8">
          No active orders — consultation data clears after 72 hours.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 mb-4">

      {/* ── PRESCRIPTIONS ── */}
      {recentPrescriptions.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaPills className="text-primary" />
              <h2 className="font-semibold text-base-content">
                Prescriptions
                <span className="badge badge-primary badge-sm ml-2">{recentPrescriptions.length}</span>
              </h2>
              <span className="text-xs text-base-content/50 ml-auto">Last 72 hrs</span>
            </div>

            {/* Preview — first N cards */}
            <div className="space-y-3">
              {recentPrescriptions.slice(0, PREVIEW_LIMIT).map((p, idx) => (
                <PrescriptionCard key={p?._id || idx} p={p} patientName={patientName} />
              ))}
            </div>

            {/* View All button */}
            {recentPrescriptions.length > PREVIEW_LIMIT && (
              <button
                className="btn btn-outline btn-sm w-full mt-3 gap-2"
                onClick={() => setShowAllPrescriptions(true)}
              >
                <FaListUl />
                View All {recentPrescriptions.length} Prescriptions
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── LAB INVESTIGATIONS ── */}
      {recentInvestigations.length > 0 && (
        <div className="card bg-base-100 shadow-sm border border-base-200">
          <div className="card-body p-4">
            <div className="flex items-center gap-2 mb-3">
              <FaFlask className="text-info" />
              <h2 className="font-semibold text-base-content">
                Lab Investigations
                <span className="badge badge-info badge-sm ml-2">{recentInvestigations.length}</span>
              </h2>
              <span className="text-xs text-base-content/50 ml-auto">Last 48 hrs</span>
            </div>

            <div className="space-y-3">
              {recentInvestigations.slice(0, PREVIEW_LIMIT).map((inv, idx) => (
                <InvestigationCard key={inv?.id || inv?._id || idx} inv={inv} patientName={patientName} />
              ))}
            </div>

            {recentInvestigations.length > PREVIEW_LIMIT && (
              <button
                className="btn btn-outline btn-sm w-full mt-3 gap-2"
                onClick={() => setShowAllInvestigations(true)}
              >
                <FaListUl />
                View All {recentInvestigations.length} Investigations
              </button>
            )}
          </div>
        </div>
      )}

      {/* Role badge */}
      <div className="text-xs text-base-content/50 flex items-center gap-2">
        <FaUserInjured />
        Viewing as: <span className="badge badge-outline badge-sm">{role}</span>
      </div>

      {/* ── Prescriptions Modal ── */}
      <ViewAllModal
        isOpen={showAllPrescriptions}
        onClose={() => setShowAllPrescriptions(false)}
        title={`All Prescriptions (${recentPrescriptions.length})`}
        icon={<FaPills className="text-primary" />}
      >
        {recentPrescriptions.map((p, idx) => (
          <PrescriptionCard key={p?._id || idx} p={p} patientName={patientName} />
        ))}
      </ViewAllModal>

      {/* ── Investigations Modal ── */}
      <ViewAllModal
        isOpen={showAllInvestigations}
        onClose={() => setShowAllInvestigations(false)}
        title={`All Lab Investigations (${recentInvestigations.length})`}
        icon={<FaFlask className="text-info" />}
      >
        {recentInvestigations.map((inv, idx) => (
          <InvestigationCard key={inv?.id || inv?._id || idx} inv={inv} patientName={patientName} />
        ))}
      </ViewAllModal>

    </div>
  );
};

export default PatientOrdersPanel;