import React, { useState, useEffect, useMemo } from 'react';
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
  FaSearch,
  FaCalendarCheck,
  FaHistory,
  FaUserInjured,
} from 'react-icons/fa';
import { getAdmissionMedicationAlerts, administerMedication } from '@/services/api/nurseAPI';
import toast from 'react-hot-toast';

const MedicationDoseScheduleTab = ({ userRole = 'nurse', onNavigateToAdmission }) => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'due' | 'upcoming' | 'injections' | 'administered'
  const [administeringId, setAdministeringId] = useState(null);
  const [quickAdminModalAlert, setQuickAdminModalAlert] = useState(null);
  const [quickNotes, setQuickNotes] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getAdmissionMedicationAlerts();
      const list = res?.alerts || [];
      setAlerts(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('MedicationDoseScheduleTab: loadData error', err);
      toast.error('Failed to load medication schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenPatientAdmission = (item) => {
    if (onNavigateToAdmission) {
      onNavigateToAdmission(item);
      return;
    }

    const rolePath = userRole === 'doctor' ? 'doctor' : userRole === 'medical-director' ? 'medical-director' : 'nurse';
    navigate(`/dashboard/${rolePath}/admitted/${item.patientId}`, {
      state: {
        admission: {
          _id: item.admissionId,
          id: item.admissionId,
          patientId: item.patientId,
          dependantId: item.dependantId,
          ward: item.ward,
          bedNumber: item.bedNumber,
        },
        dependantId: item.dependantId,
        activeTab: 'treatment',
        from: 'medication-schedule',
      },
    });
  };

  const handleQuickAdminister = async (e) => {
    e?.preventDefault();
    if (!quickAdminModalAlert) return;

    try {
      setAdministeringId(quickAdminModalAlert.alertId);
      const payload = {
        prescriptionId: quickAdminModalAlert.prescriptionId,
        medicationId: quickAdminModalAlert.medicationId,
        medicationIndex: quickAdminModalAlert.medicationIndex,
        doseGiven: 1,
        notes: `Administered via Medication Schedule Tab (${quickAdminModalAlert.slotName || quickAdminModalAlert.scheduledTime})${
          quickNotes.trim() ? ` - ${quickNotes.trim()}` : ''
        }`,
        administeredAt: new Date().toISOString(),
      };

      await administerMedication(quickAdminModalAlert.admissionId, payload);
      toast.success(
        `Administered ${quickAdminModalAlert.drugName} for ${quickAdminModalAlert.patientName} successfully! Next reminder updated.`
      );
      setQuickAdminModalAlert(null);
      setQuickNotes('');
      loadData();
    } catch (err) {
      console.error('Failed to administer dose:', err);
      toast.error(err?.response?.data?.error || 'Failed to record medication administration.');
    } finally {
      setAdministeringId(null);
    }
  };

  // Filter and search
  const filteredList = useMemo(() => {
    return alerts.filter((item) => {
      // Search
      const q = search.trim().toLowerCase();
      if (q) {
        const matchesName = String(item.patientName || '').toLowerCase().includes(q);
        const matchesDrug = String(item.drugName || '').toLowerCase().includes(q);
        const matchesWard = String(item.ward || '').toLowerCase().includes(q);
        const matchesBed = String(item.bedNumber || '').toLowerCase().includes(q);
        const matchesHospitalId = String(item.hospitalId || '').toLowerCase().includes(q);
        if (!matchesName && !matchesDrug && !matchesWard && !matchesBed && !matchesHospitalId) {
          return false;
        }
      }

      // Filter chips
      if (activeFilter === 'due') {
        return item.isDue && !item.isAdministered;
      }
      if (activeFilter === 'upcoming') {
        return !item.isDue && !item.isAdministered && !item.isOverdue;
      }
      if (activeFilter === 'injections') {
        return String(item.medicationType || '').toLowerCase() === 'injection';
      }
      if (activeFilter === 'administered') {
        return item.isAdministered;
      }

      return true;
    });
  }, [alerts, search, activeFilter]);

  const dueCount = alerts.filter((a) => a.isDue && !a.isAdministered).length;
  const overdueCount = alerts.filter((a) => a.isOverdue && !a.isAdministered).length;
  const administeredCount = alerts.filter((a) => a.isAdministered).length;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-2xs">
          <div className="flex items-center justify-between text-base-content/70">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Scheduled</span>
            <FaPills className="text-primary w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-base-content mt-1.5">{alerts.length}</p>
          <span className="text-[11px] text-base-content/60">Active Inpatient Regimens</span>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-2xs">
          <div className="flex items-center justify-between text-error">
            <span className="text-xs font-semibold uppercase tracking-wider">Due Right Now</span>
            <FaClock className="w-4 h-4 animate-bounce" />
          </div>
          <p className="text-2xl font-bold text-error mt-1.5">{dueCount}</p>
          <span className="text-[11px] text-base-content/60">Pending immediate dose</span>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-2xs">
          <div className="flex items-center justify-between text-warning">
            <span className="text-xs font-semibold uppercase tracking-wider">Overdue Doses</span>
            <FaExclamationTriangle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-warning mt-1.5">{overdueCount}</p>
          <span className="text-[11px] text-base-content/60">Requires urgent attention</span>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-2xs">
          <div className="flex items-center justify-between text-success">
            <span className="text-xs font-semibold uppercase tracking-wider">Administered</span>
            <FaCheckCircle className="w-4 h-4" />
          </div>
          <p className="text-2xl font-bold text-success mt-1.5">{administeredCount}</p>
          <span className="text-[11px] text-base-content/60">Logged in this cycle</span>
        </div>
      </div>

      {/* Control Bar: Filter Pills, Search, Refresh */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-base-200 shadow-2xs">
        <div className="inline-flex p-1 bg-base-200 rounded-xl gap-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
          >
            All Medications ({alerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('due')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeFilter === 'due'
                ? 'bg-error text-white shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
          >
            Due Now
            {dueCount > 0 && (
              <span className="badge badge-xs bg-white text-error font-extrabold">{dueCount}</span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('upcoming')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'upcoming'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
          >
            Upcoming
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('injections')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
              activeFilter === 'injections'
                ? 'bg-primary text-primary-content shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
          >
            <FaSyringe className="w-3 h-3" /> Injections
          </button>
          <button
            type="button"
            onClick={() => setActiveFilter('administered')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeFilter === 'administered'
                ? 'bg-success text-white shadow-xs'
                : 'text-base-content/70 hover:text-base-content'
            }`}
          >
            Administered
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 text-xs" />
            <input
              type="text"
              placeholder="Search patient, bed, drug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-sm input-bordered w-full pl-8 rounded-xl text-xs"
            />
          </div>

          <button
            type="button"
            onClick={loadData}
            title="Refresh medication schedule"
            className="btn btn-sm btn-ghost btn-circle text-primary hover:bg-primary/10"
          >
            <FaSyncAlt className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main List Table / Cards */}
      {loading && alerts.length === 0 ? (
        <div className="bg-base-100 p-12 rounded-2xl border border-base-200 text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="text-xs text-base-content/60 mt-3 font-medium">
            Loading next treatment plan medication rounds...
          </p>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="bg-base-100 p-12 rounded-2xl border border-dashed border-base-300 text-center space-y-2">
          <FaPills className="w-10 h-10 text-base-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-base-content">No Scheduled Medication Doses Found</h3>
          <p className="text-xs text-base-content/60 max-w-sm mx-auto">
            {search
              ? 'No medications match your current search criteria.'
              : 'There are currently no active medication schedules matching this filter for admitted inpatients.'}
          </p>
        </div>
      ) : (
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-base-200/60 text-xs uppercase tracking-wider text-base-content/70">
                <tr>
                  <th className="py-3.5 px-4">Patient & Ward Location</th>
                  <th className="py-3.5 px-4">Medication & Regimen</th>
                  <th className="py-3.5 px-4">Last Dose Administered</th>
                  <th className="py-3.5 px-4">Next Due Dose Time</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200 text-sm">
                {filteredList.map((item) => {
                  const isInjection = String(item.medicationType || '').toLowerCase() === 'injection';
                  return (
                    <tr
                      key={item.alertId}
                      className={`hover:bg-base-200/40 transition-colors ${
                        item.isDue ? 'bg-error/5' : item.isOverdue ? 'bg-warning/5' : ''
                      }`}
                    >
                      {/* Patient & Location */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {item.patientName?.charAt(0)?.toUpperCase() || 'P'}
                          </div>
                          <div>
                            <span className="font-bold text-base-content block hover:text-primary cursor-pointer" onClick={() => handleOpenPatientAdmission(item)}>
                              {item.patientName}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-base-content/60 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-base-content/80">
                                <FaBed className="w-3 h-3 text-primary" /> {item.ward}
                              </span>
                              <span>•</span>
                              <span>Bed {item.bedNumber || 'Unassigned'}</span>
                              {item.hospitalId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-[10px] text-base-content/50">ID: {item.hospitalId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Medication & Regimen */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold text-base-content">
                            {isInjection ? (
                              <FaSyringe className="text-primary w-3.5 h-3.5 shrink-0" />
                            ) : (
                              <FaPills className="text-primary w-3.5 h-3.5 shrink-0" />
                            )}
                            <span>{item.drugName}</span>
                          </div>
                          <div className="text-xs text-base-content/70 flex flex-wrap gap-x-2">
                            <span>
                              <strong>Dose:</strong> {item.dosage}
                            </span>
                            <span>•</span>
                            <span>
                              <strong>Freq:</strong> {item.frequency}
                            </span>
                          </div>
                          {item.instructions && (
                            <p className="text-[11px] text-base-content/50 truncate max-w-xs italic">
                              {item.instructions}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Last Administered */}
                      <td className="py-3.5 px-4">
                        {item.lastAdministeredAt ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-base-content flex items-center gap-1">
                              <FaHistory className="w-2.5 h-2.5 text-success" />
                              {item.lastAdministeredTimeStr || new Date(item.lastAdministeredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-[11px] text-base-content/60 block">
                              By {item.lastAdministeredBy || 'Nurse'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-base-content/40 italic">
                            Not yet administered
                          </span>
                        )}
                      </td>

                      {/* Next Due Dose Time */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-extrabold text-sm text-base-content">
                            <FaClock className={`w-3.5 h-3.5 ${item.isDue ? 'text-error animate-pulse' : 'text-primary'}`} />
                            <span>{item.scheduledTime}</span>
                          </div>
                          <span className="text-[11px] text-base-content/60 block leading-tight">
                            {item.reminderBasis || (item.intervalHours ? `Every ${item.intervalHours} hours` : 'Scheduled slot')}
                          </span>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {item.isAdministered ? (
                          <span className="badge badge-success text-white badge-sm font-bold gap-1 shadow-2xs">
                            <FaCheckCircle className="w-2.5 h-2.5" /> Administered
                          </span>
                        ) : item.isDue ? (
                          <span className="badge badge-error text-white badge-sm font-extrabold gap-1 animate-pulse shadow-xs">
                            <FaClock className="w-2.5 h-2.5" /> Due Now
                          </span>
                        ) : item.isOverdue ? (
                          <span className="badge badge-warning text-xs font-bold gap-1 shadow-2xs">
                            <FaExclamationTriangle className="w-2.5 h-2.5" /> Overdue
                          </span>
                        ) : (
                          <span className="badge badge-primary badge-outline badge-sm font-bold shadow-2xs">
                            Upcoming {item.minutesUntilDue > 0 ? `(in ${Math.round(item.minutesUntilDue / 60)}h)` : ''}
                          </span>
                        )}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!item.isAdministered && (
                            <button
                              type="button"
                              onClick={() => setQuickAdminModalAlert(item)}
                              disabled={administeringId === item.alertId}
                              className={`btn btn-xs rounded-lg font-bold shadow-2xs gap-1 ${
                                item.isDue ? 'btn-error text-white shadow-xs' : 'btn-outline btn-primary'
                              }`}
                            >
                              {administeringId === item.alertId ? (
                                <span className="loading loading-spinner loading-2xs"></span>
                              ) : (
                                <FaCheckCircle className="w-3 h-3" />
                              )}
                              Administer
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenPatientAdmission(item)}
                            title="Go to Patient Admission page"
                            className="btn btn-xs btn-primary rounded-lg font-bold text-white shadow-2xs gap-1.5"
                          >
                            <span>Open Admission</span>
                            <FaExternalLinkAlt className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Quick Administer Modal */}
      {quickAdminModalAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-base-100 rounded-3xl max-w-md w-full shadow-2xl border border-base-200 overflow-hidden animate-scaleUp">
            <div className="p-5 border-b border-base-200 bg-success/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-success">
                <FaCheckCircle className="w-5 h-5" />
                <h3 className="font-bold text-lg text-base-content">Confirm Medication Administration</h3>
              </div>
              <button
                type="button"
                onClick={() => setQuickAdminModalAlert(null)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAdminister} className="p-5 space-y-4">
              <div className="bg-base-200/50 p-3.5 rounded-xl space-y-1.5 text-xs text-base-content/80">
                <p>
                  <strong>Patient:</strong> {quickAdminModalAlert.patientName} ({quickAdminModalAlert.ward}, Bed {quickAdminModalAlert.bedNumber})
                </p>
                <p>
                  <strong>Drug:</strong> <span className="font-bold text-base-content">{quickAdminModalAlert.drugName}</span> ({quickAdminModalAlert.dosage})
                </p>
                <p>
                  <strong>Scheduled For:</strong> {quickAdminModalAlert.scheduledTime}
                </p>
                <p className="text-[11px] text-primary font-medium pt-1 border-t border-base-200">
                  ⚡ Once administered, the next reminder will automatically advance based on the current administration time!
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-base-content">
                  Administration Notes <span className="text-base-content/40 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={quickNotes}
                  onChange={(e) => setQuickNotes(e.target.value)}
                  placeholder="e.g. Tolerated well, no adverse reactions..."
                  className="textarea textarea-bordered w-full rounded-xl text-xs h-20 focus:outline-none focus:ring-2 focus:ring-success"
                />
              </div>

              <div className="modal-action pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuickAdminModalAlert(null)}
                  disabled={!!administeringId}
                  className="btn btn-ghost btn-sm rounded-xl flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!!administeringId}
                  className="btn btn-success text-white btn-sm rounded-xl flex-1 font-bold shadow-xs"
                >
                  {administeringId ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    'Confirm Administered'
                  )}
                </button>
              </div>
            </form>
          </div>
          <div className="modal-backdrop bg-black/50" onClick={() => !administeringId && setQuickAdminModalAlert(null)}></div>
        </div>
      )}
    </div>
  );
};

export default MedicationDoseScheduleTab;

