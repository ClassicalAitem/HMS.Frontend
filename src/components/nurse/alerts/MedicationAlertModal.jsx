import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPills,
  FaSyringe,
  FaBed,
  FaClock,
  FaVolumeUp,
  FaVolumeMute,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaCalendarCheck,
} from 'react-icons/fa';
import { RiZzzFill } from 'react-icons/ri';
import toast from 'react-hot-toast';
import { administerMedication } from '@/services/api/nurseAPI';
import audioAlert from '@/utils/audioAlert';

const MedicationAlertModal = ({
  isOpen,
  alerts = [],
  onClose,
  onSnooze,
  onDismiss,
  onAdministerSuccess,
}) => {
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [administeringId, setAdministeringId] = useState(null);
  const [quickAdminNotes, setQuickAdminNotes] = useState('');
  const [activeAdministerAlert, setActiveAdministerAlert] = useState(null);

  if (!isOpen || !alerts || alerts.length === 0) return null;

  const handleToggleMute = () => {
    const nextMuted = audioAlert.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleOpenRecord = (alert) => {
    audioAlert.stop();
    if (onClose) onClose();
    navigate(`/dashboard/nurse/admitted/${alert.patientId}`, {
      state: {
        admission: { _id: alert.admissionId },
        dependantId: alert.dependantId,
        activeTab: 'treatment',
      },
    });
  };

  const handleConfirmAdminister = async (alert) => {
    try {
      setAdministeringId(alert.alertId);
      const payload = {
        prescriptionId: alert.prescriptionId,
        medicationId: alert.medicationId,
        medicationIndex: alert.medicationIndex,
        doseGiven: 1,
        notes: `Administered via Inpatient Alert Modal (${alert.slotName || alert.scheduledTime})${
          quickAdminNotes.trim() ? ` - ${quickAdminNotes.trim()}` : ''
        }`,
        administeredAt: new Date().toISOString(),
      };

      await administerMedication(alert.admissionId, payload);
      toast.success(
        `Administered ${alert.drugName} for ${alert.patientName} successfully!`
      );
      setActiveAdministerAlert(null);
      setQuickAdminNotes('');
      if (onAdministerSuccess) {
        onAdministerSuccess(alert);
      }
    } catch (err) {
      console.error('Failed to administer medication from alert modal:', err);
      toast.error(
        err?.response?.data?.error || 'Failed to record medication administration.'
      );
    } finally {
      setAdministeringId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        // Prevent accidental closing by clicking backdrop so nurses don't dismiss critical alerts by mistake
      }}
    >
      <div className="bg-base-100 rounded-3xl max-w-2xl w-full shadow-2xl border-2 border-primary/40 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-base-200 bg-linear-to-r from-primary/10 via-base-200/50 to-primary/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative p-2.5 sm:p-3 bg-primary text-primary-content rounded-2xl shrink-0 shadow-md">
              <FaPills className="w-5 h-5 sm:w-6 sm:h-6 animate-bounce" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-error"></span>
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-base-content truncate">
                  Inpatient Medication Due Alert
                </h2>
                <span className="badge badge-error badge-sm font-bold text-white shadow-xs">
                  {alerts.length} {alerts.length === 1 ? 'Medication Due' : 'Medications Due'}
                </span>
              </div>
              <p className="text-xs text-base-content/70 mt-0.5 truncate">
                Administer scheduled doses for admitted inpatients in your ward
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Audio Mute / Unmute Button */}
            <button
              type="button"
              onClick={handleToggleMute}
              className={`btn btn-sm rounded-xl gap-1.5 transition-all ${
                isMuted
                  ? 'btn-ghost text-base-content/60 hover:text-base-content'
                  : 'btn-warning text-warning-content shadow-xs'
              }`}
              title={isMuted ? 'Unmute alert sound' : 'Mute alert chime'}
            >
              {isMuted ? (
                <>
                  <FaVolumeMute className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">Unmute</span>
                </>
              ) : (
                <>
                  <FaVolumeUp className="w-4 h-4 animate-pulse" />
                  <span className="hidden sm:inline text-xs font-semibold">Mute Sound</span>
                </>
              )}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                audioAlert.stop();
                if (onClose) onClose();
              }}
              className="btn btn-sm btn-circle btn-ghost text-base-content/60 hover:text-base-content"
              title="Close modal"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Alerts List */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[60vh] overflow-y-auto">
          {alerts.map((alert) => {
            const isDueNow = alert.minutesUntilDue <= 0;
            const isSoon = alert.minutesUntilDue > 0 && alert.minutesUntilDue <= 10;
            const isCurrentQuickAdmin =
              activeAdministerAlert?.alertId === alert.alertId;

            return (
              <div
                key={alert.alertId}
                className="bg-base-200/40 hover:bg-base-200/60 transition-colors border border-base-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
              >
                {/* Patient & Ward Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200/80 pb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                      {alert.patientName ? alert.patientName.charAt(0).toUpperCase() : 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-base-content text-sm sm:text-base">
                          {alert.patientName}
                        </span>
                        {alert.dependantId && (
                          <span className="badge badge-neutral badge-xs font-semibold">
                            Dependant
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-base-content/70 flex-wrap">
                        <span className="font-mono text-base-content/60">
                          ID: {alert.hospitalId || 'N/A'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <FaBed className="w-3.5 h-3.5" />
                          {alert.ward} {alert.bedNumber ? `· Bed ${alert.bedNumber}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Scheduled Time Badge */}
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {isDueNow ? (
                      <span className="badge badge-error badge-sm sm:badge-md font-bold text-white shadow-xs gap-1 py-2 sm:py-2.5 px-2.5">
                        <FaClock className="w-3 h-3" />
                        {alert.minutesUntilDue < 0
                          ? `${Math.abs(alert.minutesUntilDue)}m Overdue (${alert.scheduledTime})`
                          : `Due Now (${alert.scheduledTime})`}
                      </span>
                    ) : (
                      <span className="badge badge-warning badge-sm sm:badge-md font-bold shadow-xs gap-1 py-2 sm:py-2.5 px-2.5">
                        <FaClock className="w-3 h-3" />
                        Due in {alert.minutesUntilDue}m ({alert.scheduledTime})
                      </span>
                    )}
                  </div>
                </div>

                {/* Medication Details */}
                <div className="flex items-start gap-3 bg-base-100 rounded-xl p-3 border border-base-200">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                    {alert.medicationType === 'injection' ? (
                      <FaSyringe className="w-4 h-4 text-primary" />
                    ) : (
                      <FaPills className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h4 className="font-bold text-base-content text-sm sm:text-base">
                        {alert.drugName}
                      </h4>
                      <span className="badge badge-ghost badge-sm capitalize font-medium text-xs">
                        {alert.medicationType || 'Tablet'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/80">
                      <span>
                        <strong>Dose:</strong> {alert.dosage || '1 dose'}
                      </span>
                      <span>
                        <strong>Frequency:</strong> {alert.frequency || 'Scheduled'}
                      </span>
                      <span>
                        <strong>Slot:</strong> {alert.slotName || 'Afternoon'}
                      </span>
                    </div>

                    {alert.instructions && (
                      <p className="text-xs text-warning-content/90 bg-warning/10 rounded-md p-1.5 font-medium mt-1">
                        Note: {alert.instructions}
                      </p>
                    )}
                  </div>
                </div>

                {/* Quick Administer Drawer (if active) */}
                {isCurrentQuickAdmin ? (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-xs text-primary flex items-center gap-1.5">
                        <FaCheckCircle className="w-3.5 h-3.5" />
                        Confirm Administration of {alert.drugName} ({alert.dosage})
                      </h5>
                      <button
                        type="button"
                        onClick={() => setActiveAdministerAlert(null)}
                        className="btn btn-xs btn-ghost btn-circle"
                      >
                        <FaTimes className="w-3 h-3" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[11px] font-medium text-base-content/70 block mb-1">
                        Administration Note / Patient Observation (Optional):
                      </label>
                      <input
                        type="text"
                        value={quickAdminNotes}
                        onChange={(e) => setQuickAdminNotes(e.target.value)}
                        placeholder="e.g. Tolerated well, taken with water..."
                        className="input input-sm input-bordered w-full rounded-lg text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveAdministerAlert(null)}
                        className="btn btn-xs btn-ghost"
                        disabled={administeringId === alert.alertId}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleConfirmAdminister(alert)}
                        className="btn btn-xs sm:btn-sm btn-primary rounded-lg font-semibold gap-1.5"
                        disabled={administeringId === alert.alertId}
                      >
                        {administeringId === alert.alertId ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Recording...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-3 h-3" />
                            Confirm Dose Given
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Action Buttons for this alert */
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleOpenRecord(alert)}
                      className="btn btn-xs sm:btn-sm btn-ghost gap-1.5 text-base-content/70 hover:text-primary"
                      title="Open full admission record and treatment chart"
                    >
                      <FaExternalLinkAlt className="w-3 h-3" />
                      <span>View Inpatient Record</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveAdministerAlert(alert)}
                      className="btn btn-xs sm:btn-sm btn-primary rounded-xl gap-1.5 font-bold shadow-xs text-white"
                    >
                      <FaCheckCircle className="w-3.5 h-3.5" />
                      <span>Administer Now</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-base-200 bg-base-200/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-base-content/60 flex items-center gap-1.5">
            <FaCalendarCheck className="w-3.5 h-3.5 text-primary" />
            <span>Alerts synchronize automatically with hospital treatment chart</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
            {/* Snooze 5 mins */}
            <button
              type="button"
              onClick={() => {
                audioAlert.stop();
                if (onSnooze) onSnooze(5);
              }}
              className="btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1.5"
              title="Snooze for 5 minutes"
            >
              <RiZzzFill className="w-3.5 h-3.5" />
              <span>Snooze (5m)</span>
            </button>

            {/* Snooze 10 mins */}
            <button
              type="button"
              onClick={() => {
                audioAlert.stop();
                if (onSnooze) onSnooze(10);
              }}
              className="btn btn-xs sm:btn-sm btn-outline rounded-xl gap-1.5"
              title="Snooze for 10 minutes"
            >
              <RiZzzFill className="w-3.5 h-3.5" />
              <span>Snooze (10m)</span>
            </button>

            {/* Dismiss for now */}
            <button
              type="button"
              onClick={() => {
                audioAlert.stop();
                if (onDismiss) onDismiss();
              }}
              className="btn btn-xs sm:btn-sm btn-neutral rounded-xl font-medium gap-1.5"
            >
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicationAlertModal;

