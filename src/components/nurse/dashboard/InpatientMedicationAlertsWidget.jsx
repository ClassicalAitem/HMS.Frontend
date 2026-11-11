import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPills,
  FaSyringe,
  FaBed,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaExternalLinkAlt,
  FaSyncAlt,
} from 'react-icons/fa';
import { getAdmissionMedicationAlerts, administerMedication } from '@/services/api/nurseAPI';
import toast from 'react-hot-toast';

const InpatientMedicationAlertsWidget = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('due'); // 'due' | 'all' | 'administered'
  const [administeringId, setAdministeringId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAdmissionMedicationAlerts();
      setAlerts(res?.alerts || []);
    } catch (err) {
      console.warn('InpatientMedicationAlertsWidget: load error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      loadData();
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  const handleAdminister = async (alert) => {
    try {
      setAdministeringId(alert.alertId);
      const payload = {
        prescriptionId: alert.prescriptionId,
        medicationId: alert.medicationId,
        medicationIndex: alert.medicationIndex,
        doseGiven: 1,
        notes: `Administered via Dashboard Medication Widget (${alert.slotName || alert.scheduledTime})`,
        administeredAt: new Date().toISOString(),
      };

      await administerMedication(alert.admissionId, payload);
      toast.success(`Administered ${alert.drugName} for ${alert.patientName}!`);
      loadData();
    } catch (err) {
      console.error('Failed to administer from widget:', err);
      toast.error(err?.response?.data?.error || 'Failed to record administration.');
    } finally {
      setAdministeringId(null);
    }
  };

  const dueList = alerts.filter((a) => a.isDue && !a.isAdministered);
  const administeredList = alerts.filter((a) => a.isAdministered);
  const upcomingList = alerts.filter((a) => !a.isDue && !a.isAdministered);

  const displayedList =
    filter === 'due'
      ? dueList
      : filter === 'administered'
      ? administeredList
      : alerts;

  return (
    <div className="w-full bg-base-100 border border-base-200 shadow-sm rounded-2xl p-5 sm:p-6 space-y-4">
      {/* Widget Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-base-200 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <FaPills className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
              Inpatient Medication Schedule
              {dueList.length > 0 && (
                <span className="badge badge-error badge-sm text-white font-bold animate-pulse">
                  {dueList.length} Due Now
                </span>
              )}
            </h2>
            <p className="text-xs text-base-content/60">
              Today's scheduled medication rounds for admitted patients in wards
            </p>
          </div>
        </div>

        {/* Filter Pills & Refresh */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <div className="join bg-base-200/50 p-1 rounded-xl">
            <button
              onClick={() => setFilter('due')}
              className={`join-item btn btn-xs rounded-lg ${
                filter === 'due'
                  ? 'btn-primary text-white font-semibold'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              Due ({dueList.length})
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`join-item btn btn-xs rounded-lg ${
                filter === 'all'
                  ? 'btn-primary text-white font-semibold'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              All Today ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('administered')}
              className={`join-item btn btn-xs rounded-lg ${
                filter === 'administered'
                  ? 'btn-primary text-white font-semibold'
                  : 'btn-ghost text-base-content/70'
              }`}
            >
              Given ({administeredList.length})
            </button>
          </div>

          <button
            onClick={loadData}
            className="btn btn-xs btn-ghost btn-circle text-primary"
            title="Refresh medication schedule"
          >
            <FaSyncAlt className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Widget Content */}
      {loading && alerts.length === 0 ? (
        <div className="space-y-3 py-2">
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
              <div className="h-6 w-24 rounded bg-base-300" />
            </div>
          ))}
        </div>
      ) : displayedList.length === 0 ? (
        <div className="text-center py-8 bg-base-200/20 rounded-2xl border border-dashed border-base-200">
          <FaCheckCircle className="w-8 h-8 text-success/60 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-base-content/80">
            {filter === 'due'
              ? 'No Inpatient Medications Currently Due'
              : filter === 'administered'
              ? 'No Medications Administered Yet Today'
              : 'No Active Inpatient Prescriptions for Today'}
          </h3>
          <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
            {filter === 'due'
              ? 'All scheduled doses are up to date or upcoming later today.'
              : 'Scheduled inpatient doses appear here automatically based on ward admission treatment charts.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
          {displayedList.map((alert) => (
            <div
              key={alert.alertId}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.isAdministered
                  ? 'bg-base-200/10 border-base-200/60 opacity-80'
                  : alert.isDue
                  ? 'bg-warning/5 border-warning/30 hover:border-warning/60 shadow-xs'
                  : 'bg-base-200/20 border-base-200 hover:border-primary/30'
              }`}
            >
              {/* Left Column: Drug, Patient & Bed */}
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    alert.isAdministered
                      ? 'bg-success/15 text-success'
                      : alert.isDue
                      ? 'bg-warning/20 text-warning-content animate-pulse'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {alert.medicationType === 'injection' ? (
                    <FaSyringe className="w-4 h-4" />
                  ) : (
                    <FaPills className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-bold text-base-content truncate">
                      {alert.drugName}
                    </h4>
                    <span className="badge badge-ghost badge-xs capitalize">
                      {alert.dosage}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-base-content/70">
                    <span className="font-semibold text-base-content/90">
                      {alert.patientName}
                    </span>
                    <span>·</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      <FaBed className="w-3 h-3" />
                      {alert.ward} {alert.bedNumber ? `· Bed ${alert.bedNumber}` : ''}
                    </span>
                    <span>·</span>
                    <span className="font-mono text-[11px] text-base-content/60">
                      ID: {alert.hospitalId}
                    </span>
                  </div>
                  {alert.reminderBasis && (
                    <p className="text-[10px] text-primary font-medium truncate">
                      ⚡ {alert.reminderBasis}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Time, Status Badge & Actions */}
              <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-base-200">
                {alert.isAdministered ? (
                  <span className="badge badge-success text-white badge-sm font-semibold gap-1 py-2">
                    <FaCheckCircle className="w-3 h-3" />
                    Given
                  </span>
                ) : alert.isDue ? (
                  <span className="badge badge-warning badge-sm font-bold gap-1 py-2 shadow-xs">
                    <FaClock className="w-3 h-3" />
                    {alert.minutesUntilDue <= 0
                      ? `Due Now (${alert.scheduledTime})`
                      : `Due in ${alert.minutesUntilDue}m (${alert.scheduledTime})`}
                  </span>
                ) : (
                  <span className="badge badge-ghost badge-sm text-base-content/70 gap-1 py-2 font-medium">
                    <FaClock className="w-3 h-3" />
                    {alert.scheduledTime}
                  </span>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      navigate(`/dashboard/nurse/admitted/${alert.patientId}`, {
                        state: {
                          admission: { _id: alert.admissionId },
                          dependantId: alert.dependantId,
                          activeTab: 'treatment',
                        },
                      })
                    }
                    className="btn btn-xs btn-ghost gap-1 text-base-content/70 hover:text-primary"
                    title="Open Patient Inpatient Record"
                  >
                    <FaExternalLinkAlt className="w-3 h-3" />
                  </button>

                  {!alert.isAdministered && (
                    <button
                      onClick={() => handleAdminister(alert)}
                      disabled={administeringId === alert.alertId}
                      className="btn btn-xs btn-primary rounded-lg font-semibold gap-1 text-white shadow-xs"
                      title="Log Dose Given"
                    >
                      {administeringId === alert.alertId ? (
                        <span className="loading loading-spinner loading-xs"></span>
                      ) : (
                        <>
                          <FaCheckCircle className="w-3 h-3" />
                          <span>Administer</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InpatientMedicationAlertsWidget;

