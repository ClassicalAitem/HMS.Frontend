import React, { useState, useEffect } from 'react';
import {
  FaClock,
  FaPills,
  FaSyringe,
  FaPlus,
  FaTrash,
  FaCheckCircle,
  FaInfoCircle,
  FaHistory,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { scheduleMedicationDoses } from '@/services/api/nurseAPI';

// Standard preset dose time configurations
const PRESET_SCHEDULES = {
  '1_dose': ['08:00'],
  '2_doses': ['08:00', '20:00'],
  '3_doses': ['08:00', '16:00', '22:00'],
  '4_doses': ['06:00', '12:00', '18:00', '22:00'],
  '6_doses': ['04:00', '08:00', '12:00', '16:00', '20:00', '00:00'],
};

const getInitialDoseTimes = (frequency, existingScheduled = []) => {
  if (Array.isArray(existingScheduled) && existingScheduled.length > 0) {
    return [...existingScheduled];
  }

  const freq = String(frequency || '').toLowerCase().trim();
  if (freq === 'stat') return ['08:00'];
  if (freq === 'dly' || freq === 'daily' || freq === 'mane') return ['08:00'];
  if (freq === 'nocte') return ['22:00'];
  if (freq === 'b.d' || freq === 'bd' || freq === '12hly') return PRESET_SCHEDULES['2_doses'];
  if (freq === 'tds' || freq === '8hly') return PRESET_SCHEDULES['3_doses'];
  if (freq === 'qds' || freq === '6hly') return PRESET_SCHEDULES['4_doses'];
  if (freq === '4hly') return PRESET_SCHEDULES['6_doses'];

  return ['08:00', '20:00'];
};

const formatTime12h = (time24) => {
  if (!time24) return '';
  const [hStr, mStr] = String(time24).split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (isNaN(h)) return time24;
  const h12 = h % 12 || 12;
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
};

const ScheduleMedicationModal = ({
  isOpen,
  onClose,
  admissionId,
  prescription,
  medication,
  medicationIndex = 0,
  onScheduleSuccess,
}) => {
  const [scheduledTimes, setScheduledTimes] = useState(['08:00', '20:00']);
  const [scheduleNotes, setScheduleNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && medication) {
      const times = getInitialDoseTimes(medication.frequency, medication.scheduledTimes);
      setScheduledTimes(times);
      setScheduleNotes(medication.scheduleNotes || '');
    }
  }, [isOpen, medication]);

  if (!isOpen || !medication) return null;

  const pId = prescription?._id || prescription?.id || '';
  const mId = medication?._id || medication?.id || '';

  const handleAddTimeSlot = () => {
    if (scheduledTimes.length >= 8) {
      toast.error('Maximum 8 dose slots allowed per day');
      return;
    }
    setScheduledTimes([...scheduledTimes, '12:00']);
  };

  const handleRemoveTimeSlot = (index) => {
    if (scheduledTimes.length <= 1) {
      toast.error('At least one dose slot time is required');
      return;
    }
    const updated = [...scheduledTimes];
    updated.splice(index, 1);
    setScheduledTimes(updated);
  };

  const handleTimeChange = (index, value) => {
    const updated = [...scheduledTimes];
    updated[index] = value;
    setScheduledTimes(updated);
  };

  const handleApplyPreset = (times) => {
    setScheduledTimes([...times]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledTimes.length) {
      toast.error('Please specify at least one dose schedule time.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        prescriptionId: pId,
        medicationId: mId || undefined,
        medicationIndex: mId ? undefined : medicationIndex,
        scheduledTimes: scheduledTimes.sort(),
        scheduleNotes: scheduleNotes.trim() || undefined,
      };

      await scheduleMedicationDoses(admissionId, payload);
      toast.success(`Dose schedule for ${medication.drugName} updated successfully!`);
      if (onScheduleSuccess) {
        onScheduleSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Failed to schedule medication doses:', err);
      toast.error(err?.response?.data?.error || 'Failed to save medication schedule.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const lastAdminTime = medication.lastAdministeredAt ? new Date(medication.lastAdministeredAt) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-5 overflow-y-auto">
      <div className="bg-base-100 rounded-3xl max-w-xl w-full shadow-2xl border border-base-200 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-5 border-b border-base-200 bg-linear-to-r from-primary/10 via-base-200/50 to-primary/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary text-primary-content rounded-2xl shadow-sm">
              <FaClock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-content flex items-center gap-2">
                Schedule Medication Doses
              </h3>
              <p className="text-xs text-base-content/70">
                Set administration round times for admitted inpatient care
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="btn btn-sm btn-ghost btn-circle"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Medication Summary Banner */}
          <div className="p-4 rounded-2xl bg-base-200/60 border border-base-200 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                {medication.medicationType === 'injection' ? (
                  <FaSyringe className="text-primary w-4 h-4" />
                ) : (
                  <FaPills className="text-primary w-4 h-4" />
                )}
                <span className="font-bold text-base text-base-content">
                  {medication.drugName}
                </span>
              </div>
              <span className="badge badge-primary badge-outline text-xs font-semibold capitalize">
                {medication.medicationType || 'Medication'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/80 pt-1 border-t border-base-200/60">
              <span>
                <strong>Dose:</strong> {medication.dosage || (medication.dosageAmount ? `${medication.dosageAmount} ${medication.dosageUnit || ''}` : '1 dose')}
              </span>
              <span>
                <strong>Prescribed Frequency:</strong> {medication.frequency || 'N/A'}
              </span>
              <span>
                <strong>Duration:</strong> {medication.duration || 'N/A'}
              </span>
            </div>

            {lastAdminTime && (
              <div className="flex items-center gap-1.5 text-xs text-success font-medium pt-1">
                <FaHistory className="w-3 h-3" />
                <span>
                  Last dose administered at: <strong>{lastAdminTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong> ({lastAdminTime.toLocaleDateString()})
                </span>
              </div>
            )}
          </div>

          {/* Quick Schedule Presets */}
          <div>
            <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider block mb-2">
              Quick Timing Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(['08:00', '20:00'])}
                className="btn btn-xs btn-outline rounded-lg"
              >
                12-Hourly (08:00, 20:00)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['08:00', '16:00', '22:00'])}
                className="btn btn-xs btn-outline rounded-lg"
              >
                8-Hourly (08:00, 16:00, 22:00)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['06:00', '12:00', '18:00', '22:00'])}
                className="btn btn-xs btn-outline rounded-lg"
              >
                6-Hourly (06:00, 12:00, 18:00, 22:00)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['08:00'])}
                className="btn btn-xs btn-outline rounded-lg"
              >
                Once Daily Morning (08:00)
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset(['22:00'])}
                className="btn btn-xs btn-outline rounded-lg"
              >
                Nightly (22:00)
              </button>
            </div>
          </div>

          {/* Dose Times List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-base-content/70 uppercase tracking-wider">
                Daily Dose Schedule ({scheduledTimes.length} {scheduledTimes.length === 1 ? 'dose' : 'doses'}/day)
              </label>
              <button
                type="button"
                onClick={handleAddTimeSlot}
                className="btn btn-xs btn-ghost text-primary font-semibold gap-1 hover:bg-primary/10 rounded-lg"
              >
                <FaPlus className="w-2.5 h-2.5" /> Add Dose Time
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {scheduledTimes.map((time, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl border border-base-200 bg-base-100 hover:border-primary/40 transition-colors shadow-2xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => handleTimeChange(idx, e.target.value)}
                    required
                    className="input input-sm input-bordered w-full rounded-lg font-semibold text-center focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                  <span className="text-xs text-base-content/60 font-medium shrink-0 min-w-16 text-right">
                    {formatTime12h(time)}
                  </span>
                  {scheduledTimes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTimeSlot(idx)}
                      title="Remove this dose time"
                      className="btn btn-xs btn-ghost btn-circle text-error/70 hover:text-error hover:bg-error/10 shrink-0"
                    >
                      <FaTrash className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Smart Reminder Adjustment Callout */}
          <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3 text-xs">
            <FaInfoCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="text-primary font-bold">Dynamic Administration Recalibration:</strong>
              <p className="text-base-content/75 leading-relaxed">
                When a nurse or doctor administers a dose, the next medication reminder automatically advances based on the actual administration time and prescribed interval, ensuring patient safety and preventing premature redosing.
              </p>
            </div>
          </div>

          {/* Optional Schedule Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-base-content/70">
              Schedule Notes / Instructions <span className="text-base-content/40 font-normal">(Optional)</span>
            </label>
            <textarea
              value={scheduleNotes}
              onChange={(e) => setScheduleNotes(e.target.value)}
              placeholder="e.g. Give with meals; monitor vitals 15 mins after dose..."
              className="textarea textarea-bordered w-full rounded-xl text-xs h-20 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Action Buttons */}
          <div className="modal-action pt-4 border-t border-base-200 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-ghost rounded-xl flex-1 hover:bg-base-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary text-white rounded-xl flex-1 font-bold gap-2 shadow-sm"
            >
              {isSubmitting ? (
                <span className="loading loading-spinner loading-xs"></span>
              ) : (
                <FaCheckCircle className="w-4 h-4" />
              )}
              Save Schedule
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/60" onClick={() => !isSubmitting && onClose()}></div>
    </div>
  );
};

export default ScheduleMedicationModal;

