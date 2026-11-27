import React, { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  FaLungs,
  FaPlay,
  FaStop,
  FaClock,
  FaCheckCircle,
  FaMoneyBillWave,
  FaHeartbeat,
  FaUserNurse,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSun,
  FaBaby,
  FaPlus,
} from 'react-icons/fa';
import {
  getTimedSessionsByAdmission,
  startTimedSession,
  completeTimedSession,
  cancelTimedSession,
} from '@/services/api/timedServiceAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import {
  getVitalsByPatient,
  normalizeVitalsResponse,
  getLatestVital,
} from '@/services/api/vitalsAPI';
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils';

const THERAPY_OPTIONS = [
  { value: 'oxygen', label: 'Oxygen Therapy', icon: FaLungs, defaultRate: 1500, defaultSetting: '4 L/min via Nasal Cannula', defaultGoal: 'SpO2 > 95%' },
  { value: 'phototherapy', label: 'Phototherapy', icon: FaSun, defaultRate: 2000, defaultSetting: 'Double Surface Blue Light', defaultGoal: 'Bilirubin Reduction' },
  { value: 'incubator', label: 'Incubator Care', icon: FaBaby, defaultRate: 2500, defaultSetting: 'Target Temp 36.5°C', defaultGoal: 'Thermoregulation' },
  { value: 'nebulization', label: 'Nebulization', icon: FaLungs, defaultRate: 1000, defaultSetting: 'Salbutamol 2.5mg in 3ml Normal Saline', defaultGoal: 'Relieve Bronchospasm' },
  { value: 'other', label: 'Other Timed Therapy', icon: FaClock, defaultRate: 1500, defaultSetting: 'Continuous Monitoring', defaultGoal: 'Clinical Recovery' },
];

export const TimedTherapyTab = ({
  patientId,
  dependantId,
  admissionId,
  isNurse = false,
  isDoctor = false,
}) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [now, setNow] = useState(Date.now());

  // Modal states
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [sessionToComplete, setSessionToComplete] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for Starting a session
  const [startForm, setStartForm] = useState({
    serviceType: 'oxygen',
    serviceName: 'Oxygen Administration',
    hourlyRate: 1500,
    serviceChargeId: '',
    flowRateOrSettings: '4 L/min via Nasal Cannula',
    targetGoal: 'SpO2 > 95%',
    instructions: '',
    notes: '',
    startVitals: {
      bp: '',
      pulse: '',
      spo2: '',
      temperature: '',
      respiratoryRate: '',
    },
  });

  // Form states for Completing a session
  const [completeForm, setCompleteForm] = useState({
    endVitals: {
      bp: '',
      pulse: '',
      spo2: '',
      temperature: '',
      respiratoryRate: '',
    },
    discontinuationReason: 'Patient stable on room air',
    notes: '',
  });

  // Timer ticker for live running durations
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000); // update every 30s
    return () => clearInterval(timer);
  }, []);

  const loadSessions = async () => {
    if (!admissionId) return;
    try {
      setLoading(true);
      const data = await getTimedSessionsByAdmission(admissionId);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load timed sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, [admissionId]);

  const loadLatestVitals = async () => {
    if (!patientId) return;
    try {
      const res = await getVitalsByPatient(patientId);
      const list = normalizeVitalsResponse(res);
      const scoped = dependantId
        ? list.filter((v) => String(v?.dependantId || '') === String(dependantId))
        : list.filter((v) => !v?.dependantId);
      const latest = getLatestVital(scoped.length > 0 ? scoped : list);
      if (latest) {
        setStartForm((prev) => ({
          ...prev,
          startVitals: {
            bp: latest.bp ? String(latest.bp) : '',
            pulse: latest.pulse != null ? String(latest.pulse) : '',
            spo2: latest.spo2 != null ? String(latest.spo2) : '',
            temperature: latest.temperature != null ? String(latest.temperature) : '',
            respiratoryRate: latest.respiratoryRate != null ? String(latest.respiratoryRate) : '',
          },
        }));
      }
    } catch (err) {
      console.warn('Could not load latest patient vitals', err);
    }
  };

  useEffect(() => {
    loadLatestVitals();
  }, [patientId, dependantId]);

  // Load relevant Service Charges for hourly pricing
  useEffect(() => {
    const loadCharges = async () => {
      try {
        const res = await getServiceCharges();
        const list = res?.data?.data || res?.data || res || [];
        if (Array.isArray(list)) {
          setServiceCharges(list);
        }
      } catch (err) {
        console.warn('Could not load service charges', err);
      }
    };
    loadCharges();
  }, []);

  // Update defaults when switching serviceType in Start Modal
  const handleServiceTypeChange = (type) => {
    const opt = THERAPY_OPTIONS.find((t) => t.value === type) || THERAPY_OPTIONS[0];
    
    // Look for matching charge in MySQL service charges
    const matchedCharge = serviceCharges.find(
      (sc) =>
        String(sc.service || '').toLowerCase().includes(type) ||
        (type === 'oxygen' && String(sc.service || '').toLowerCase().includes('oxygen'))
    );

    setStartForm((prev) => ({
      ...prev,
      serviceType: type,
      serviceName: matchedCharge ? matchedCharge.service : opt.label,
      hourlyRate: matchedCharge ? Number(matchedCharge.amount) || opt.defaultRate : opt.defaultRate,
      serviceChargeId: matchedCharge ? matchedCharge.id || matchedCharge._id : '',
      flowRateOrSettings: opt.defaultSetting,
      targetGoal: opt.defaultGoal,
    }));
  };

  const activeSessions = useMemo(
    () => sessions.filter((s) => s.status === 'active'),
    [sessions]
  );
  const completedSessions = useMemo(
    () => sessions.filter((s) => s.status === 'completed' || s.status === 'cancelled'),
    [sessions]
  );

  const calculateLiveDuration = (startedAt) => {
    const diffMs = Math.max(0, now - new Date(startedAt).getTime());
    const totalMinutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return {
      display: `${hours}h ${mins}m`,
      fractionalHours: Math.max(0.1, parseFloat((totalMinutes / 60).toFixed(2))),
    };
  };

  const handleStartSubmit = async (e) => {
    e.preventDefault();
    if (!admissionId || !patientId) {
      toast.error('Missing admission or patient context');
      return;
    }

    try {
      setIsSubmitting(true);
      await startTimedSession({
        patientId,
        dependantId: dependantId || undefined,
        admissionId,
        ...startForm,
      });
      toast.success(`${startForm.serviceName} session started!`);
      setIsStartModalOpen(false);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!sessionToComplete) return;

    try {
      setIsSubmitting(true);
      await completeTimedSession(sessionToComplete._id || sessionToComplete.id, completeForm);
      toast.success('Session completed and logged for billing!');
      setSessionToComplete(null);
      loadSessions();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-base-100 border border-base-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center text-xl shrink-0">
            <FaLungs />
          </div>
          <div>
            <h3 className="font-bold text-base sm:text-lg text-base-content flex items-center gap-2">
              Oxygen & Continuous Therapies
              {activeSessions.length > 0 && (
                <span className="badge badge-success badge-sm animate-pulse text-white font-semibold">
                  {activeSessions.length} Running
                </span>
              )}
            </h3>
            <p className="text-xs text-base-content/60">
              Track live nurse administration, flow rates, and hourly billing charges (Oxygen, Phototherapy, Incubator).
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            handleServiceTypeChange('oxygen');
            loadLatestVitals();
            setIsStartModalOpen(true);
          }}
          className="btn btn-sm btn-primary rounded-xl gap-2 font-medium shadow-sm hover:shadow"
        >
          <FaPlus className="w-3.5 h-3.5" /> Start Therapy Session
        </button>
      </div>

      {/* Active Running Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 flex items-center gap-2">
            <FaClock className="text-success" /> Active Ongoing Sessions ({activeSessions.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => {
              const live = calculateLiveDuration(session.startedAt);
              const estCharge = Math.round(Math.max(1, Math.ceil(live.fractionalHours)) * (session.hourlyRate || 0));

              return (
                <div
                  key={session._id || session.id}
                  className="card bg-base-100 border-2 border-success/40 shadow-sm p-4 rounded-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 bg-success text-success-content px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                    LIVE RUNNING
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center text-lg shrink-0 mt-0.5">
                      <FaLungs />
                    </div>
                    <div className="flex-1 pr-16">
                      <h5 className="font-bold text-sm text-base-content">{session.serviceName}</h5>
                      <p className="text-xs text-base-content/70 mt-0.5">
                        <strong>Settings:</strong> {session.flowRateOrSettings || 'Continuous'}
                      </p>
                      {session.targetGoal && (
                        <p className="text-xs text-info font-medium mt-0.5">
                          <strong>Goal:</strong> {session.targetGoal}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Vitals Snapshot */}
                  {session.startVitals && (
                    <div className="mt-3 p-2.5 rounded-xl bg-base-200/60 border border-base-200 grid grid-cols-4 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-base-content/50 uppercase block font-semibold">Start SpO2</span>
                        <span className="font-bold text-base-content">{session.startVitals.spo2 || '—'}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 uppercase block font-semibold">Start BP</span>
                        <span className="font-bold text-base-content">{session.startVitals.bp || '—'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 uppercase block font-semibold">Start Pulse</span>
                        <span className="font-bold text-base-content">{session.startVitals.pulse || '—'} bpm</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-base-content/50 uppercase block font-semibold">Rate</span>
                        <span className="font-bold text-base-content">₦{Number(session.hourlyRate).toLocaleString()}/hr</span>
                      </div>
                    </div>
                  )}

                  {/* Live Timer and Charge Bar */}
                  <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-base-content/50 block font-medium">Elapsed Duration:</span>
                      <span className="text-base font-black text-success font-mono flex items-center gap-1.5">
                        <FaClock className="w-3.5 h-3.5" /> {live.display}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-base-content/50 block font-medium">Current Accrued Bill:</span>
                      <span className="text-sm font-bold text-base-content font-mono">
                        ≈ ₦{estCharge.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-base-content/60 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <FaUserNurse className="w-3 h-3 text-primary" /> Started by: {session.startedByName}
                    </span>
                    <span>{formatNigeriaDateTimeShort(session.startedAt)}</span>
                  </div>

                  {/* Stop Action */}
                  <div className="mt-4 pt-2">
                    <button
                      onClick={() => {
                        setSessionToComplete(session);
                        setCompleteForm({
                          endVitals: {
                            bp: '',
                            pulse: session.startVitals?.pulse || '',
                            spo2: '98',
                            temperature: '',
                            respiratoryRate: '',
                          },
                          discontinuationReason: 'Patient stable, weaned off oxygen',
                          notes: '',
                        });
                      }}
                      className="btn btn-sm btn-error btn-outline w-full rounded-xl gap-2 font-semibold"
                    >
                      <FaStop className="w-3.5 h-3.5" /> Stop & Finalize Billing
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Sessions Table */}
      <div className="card bg-base-100 border border-base-200 shadow-sm p-4 sm:p-5 rounded-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-base-200 mb-3">
          <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
            <FaCheckCircle className="text-primary" /> Completed Therapy Sessions Log ({completedSessions.length})
          </h4>
          <span className="text-xs text-base-content/50">Cumulative billed items</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-base-content/50">Loading sessions...</div>
        ) : completedSessions.length === 0 ? (
          <div className="p-8 text-center text-sm text-base-content/50">
            No completed therapy sessions yet. Start a session when oxygen or phototherapy is administered.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full">
              <thead>
                <tr className="text-xs text-base-content/60 border-b border-base-200">
                  <th>Therapy</th>
                  <th>Duration</th>
                  <th>Settings & Goal</th>
                  <th>Outcome / Discontinued Reason</th>
                  <th>Hourly Rate</th>
                  <th>Total Billed</th>
                  <th>Administered By</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-base-200">
                {completedSessions.map((session) => (
                  <tr key={session._id || session.id} className="hover:bg-base-200/40">
                    <td className="font-semibold text-base-content">
                      <div className="flex items-center gap-1.5">
                        <FaCheckCircle className="text-success shrink-0" />
                        {session.serviceName}
                      </div>
                    </td>
                    <td className="font-mono font-medium">
                      {session.durationHours ? `${session.durationHours} hr(s)` : `${session.durationMinutes || 0} mins`}
                    </td>
                    <td className="text-base-content/70">
                      <div>{session.flowRateOrSettings || 'Standard'}</div>
                      {session.targetGoal && <div className="text-[10px] text-info">{session.targetGoal}</div>}
                    </td>
                    <td className="text-base-content/80 max-w-[180px] truncate" title={session.discontinuationReason}>
                      {session.discontinuationReason || 'Completed'}
                      {session.endVitals?.spo2 && (
                        <span className="text-[10px] text-success block">Final SpO2: {session.endVitals.spo2}%</span>
                      )}
                    </td>
                    <td className="font-mono">₦{Number(session.hourlyRate || 0).toLocaleString()}/hr</td>
                    <td className="font-bold text-primary font-mono">
                      ₦{Number(session.totalAmount || 0).toLocaleString()}
                    </td>
                    <td className="text-base-content/70 text-[11px]">
                      <div>{session.endedByName || session.startedByName}</div>
                    </td>
                    <td className="text-base-content/50 text-[11px]">
                      {formatNigeriaDateTimeShort(session.startedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: START SESSION */}
      {isStartModalOpen && (
        <div className="modal modal-open">
          <div className="modal-box max-w-lg rounded-2xl p-6">
            <h3 className="font-bold text-base sm:text-lg text-base-content flex items-center gap-2 mb-1">
              <FaPlay className="text-primary" /> Start Timed Therapy Session
            </h3>
            <p className="text-xs text-base-content/60 mb-4">
              Initiates continuous monitoring. The system will track live duration and compute hourly charges upon completion.
            </p>

            <form onSubmit={handleStartSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-content/70 block mb-1.5">Therapy Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {THERAPY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleServiceTypeChange(opt.value)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all ${
                        startForm.serviceType === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-base-300 text-base-content/70 hover:bg-base-200'
                      }`}
                    >
                      <opt.icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-base-content/70 block mb-1">Flow Rate / Settings</label>
                  <input
                    type="text"
                    value={startForm.flowRateOrSettings}
                    onChange={(e) => setStartForm({ ...startForm, flowRateOrSettings: e.target.value })}
                    placeholder="e.g. 4 L/min via nasal cannula"
                    className="input input-sm input-bordered w-full rounded-xl text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-base-content/70 block mb-1">Hourly Billing Rate (₦)</label>
                  <input
                    type="number"
                    value={startForm.hourlyRate}
                    onChange={(e) => setStartForm({ ...startForm, hourlyRate: Number(e.target.value) || 0 })}
                    className="input input-sm input-bordered w-full rounded-xl text-xs font-mono font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70 block mb-1">Target Clinical Goal</label>
                <input
                  type="text"
                  value={startForm.targetGoal}
                  onChange={(e) => setStartForm({ ...startForm, targetGoal: e.target.value })}
                  placeholder="e.g. Maintain SpO2 > 95%"
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                />
              </div>

              {/* Baseline Vitals */}
              <div className="p-3 bg-base-200/50 rounded-xl border border-base-200">
                <span className="text-[11px] font-bold uppercase text-base-content/60 block mb-2">
                  Starting Patient Vitals
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-base-content/60 block">SpO2 (%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 88"
                      value={startForm.startVitals.spo2}
                      onChange={(e) =>
                        setStartForm({
                          ...startForm,
                          startVitals: { ...startForm.startVitals, spo2: e.target.value },
                        })
                      }
                      className="input input-xs input-bordered w-full rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-base-content/60 block">BP</label>
                    <input
                      type="text"
                      placeholder="e.g. 120/80"
                      value={startForm.startVitals.bp}
                      onChange={(e) =>
                        setStartForm({
                          ...startForm,
                          startVitals: { ...startForm.startVitals, bp: e.target.value },
                        })
                      }
                      className="input input-xs input-bordered w-full rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-base-content/60 block">Pulse (bpm)</label>
                    <input
                      type="text"
                      placeholder="e.g. 96"
                      value={startForm.startVitals.pulse}
                      onChange={(e) =>
                        setStartForm({
                          ...startForm,
                          startVitals: { ...startForm.startVitals, pulse: e.target.value },
                        })
                      }
                      className="input input-xs input-bordered w-full rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-action pt-2 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setIsStartModalOpen(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold"
                  disabled={isSubmitting}
                >
                  <FaPlay className="w-3 h-3" /> Start Session Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: COMPLETE SESSION */}
      {sessionToComplete && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md rounded-2xl p-6">
            <h3 className="font-bold text-base sm:text-lg text-base-content flex items-center gap-2 mb-1">
              <FaStop className="text-error" /> Stop & Finalize Session
            </h3>
            <p className="text-xs text-base-content/60 mb-4">
              Recording completion will calculate the total elapsed hours and add the billing line item to the patient's admission folio.
            </p>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-content/70 block mb-1">Discontinuation Reason</label>
                <input
                  type="text"
                  value={completeForm.discontinuationReason}
                  onChange={(e) => setCompleteForm({ ...completeForm, discontinuationReason: e.target.value })}
                  placeholder="e.g. Patient stable, weaned off oxygen"
                  className="input input-sm input-bordered w-full rounded-xl text-xs"
                  required
                />
              </div>

              <div className="p-3 bg-base-200/50 rounded-xl border border-base-200">
                <span className="text-[11px] font-bold uppercase text-base-content/60 block mb-2">
                  Ending Patient Vitals
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-base-content/60 block">Final SpO2 (%)</label>
                    <input
                      type="text"
                      placeholder="e.g. 98"
                      value={completeForm.endVitals.spo2}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          endVitals: { ...completeForm.endVitals, spo2: e.target.value },
                        })
                      }
                      className="input input-xs input-bordered w-full rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-base-content/60 block">Final Pulse</label>
                    <input
                      type="text"
                      placeholder="e.g. 78"
                      value={completeForm.endVitals.pulse}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          endVitals: { ...completeForm.endVitals, pulse: e.target.value },
                        })
                      }
                      className="input input-xs input-bordered w-full rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-base-content/60 block">Final BP</label>
                    <input
                      type="text"
                      placeholder="e.g. 120/80"
                      value={completeForm.endVitals.bp}
                      onChange={(e) =>
                        setCompleteForm({
                          ...completeForm,
                          endVitals: { ...completeForm.endVitals, bp: e.target.value },
                        })
                      }
                      className="input input-xs input-bordered w-full rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70 block mb-1">Closing Nurse Notes</label>
                <textarea
                  rows={2}
                  value={completeForm.notes}
                  onChange={(e) => setCompleteForm({ ...completeForm, notes: e.target.value })}
                  placeholder="Optional observations or patient tolerance..."
                  className="textarea textarea-bordered w-full rounded-xl text-xs"
                />
              </div>

              <div className="modal-action pt-2 border-t border-base-200">
                <button
                  type="button"
                  onClick={() => setSessionToComplete(null)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-sm btn-error text-white rounded-xl gap-2 font-semibold"
                  disabled={isSubmitting}
                >
                  <FaStop className="w-3 h-3" /> Stop & Bill Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimedTherapyTab;
