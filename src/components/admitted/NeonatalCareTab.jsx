import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import neonatalCareApi from '@/services/api/neonatalCareApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import {
  FaBaby,
  FaPlus,
  FaLightbulb,
  FaThermometerHalf,
  FaStopwatch,
  FaCheckCircle,
  FaHistory,
} from 'react-icons/fa'

const NeonatalCareTab = ({ patientId, dependantId, consultationId }) => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [showStartModal, setShowStartModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [endingId, setEndingId] = useState(null)

  const [form, setForm] = useState({
    phototherapy: false,
    incubator: false,
    temperature: '',
    feedingType: 'breast',
    feedingAmountMl: '',
    notes: '',
  })

  const loadLogs = async () => {
    try {
      setLoading(true)
      const res = await neonatalCareApi.getNeonatalCareByPatient(patientId, {
        ...(dependantId ? { dependantId } : {}),
      })
      const list = res?.data ?? res ?? []
      setLogs(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load neonatal care logs', err)
      toast.error('Failed to load neonatal care records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [patientId, dependantId])

  const handleStartSession = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await neonatalCareApi.createNeonatalCareLog({
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId,
        sessionStart: new Date(),
        temperature: form.temperature ? Number(form.temperature) : undefined,
        phototherapy: Boolean(form.phototherapy),
        incubator: Boolean(form.incubator),
        feedingType: form.feedingType,
        feedingAmountMl: form.feedingAmountMl ? Number(form.feedingAmountMl) : 0,
        notes: form.notes.trim() || undefined,
      })

      toast.success('Neonatal care session started')
      setShowStartModal(false)
      setForm({
        phototherapy: false,
        incubator: false,
        temperature: '',
        feedingType: 'breast',
        feedingAmountMl: '',
        notes: '',
      })
      await loadLogs()
    } catch (err) {
      console.error('Failed to start neonatal session', err)
      toast.error(err?.response?.data?.error || 'Failed to start session')
    } finally {
      setSaving(false)
    }
  }

  const handleEndSession = async (id) => {
    if (!window.confirm('Conclude this neonatal care session?')) return
    setEndingId(id)
    try {
      await neonatalCareApi.endNeonatalCareSession(id, { sessionEnd: new Date() })
      toast.success('Session concluded successfully')
      await loadLogs()
    } catch (err) {
      console.error('Failed to end session', err)
      toast.error(err?.response?.data?.error || 'Failed to end session')
    } finally {
      setEndingId(null)
    }
  }

  const activeSessions = logs.filter((l) => !l.sessionEnd)
  const completedSessions = logs.filter((l) => !!l.sessionEnd)

  return (
    <div className="space-y-6">
      {/* Header & Session Start */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <FaBaby className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-base-content">
              Neonatal & Special Care Baby Unit (SCBU)
            </h3>
            <p className="text-xs text-base-content/60">
              Phototherapy exposure, incubator thermoregulation, and specialized enteral feeding logs
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowStartModal(true)}
          className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold shadow-sm"
        >
          <FaPlus className="w-3 h-3" /> Start Care Session
        </button>
      </div>

      {/* Active Running Sessions */}
      {activeSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-warning animate-pulse"></span>
            Active Neonatal Sessions ({activeSessions.length})
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeSessions.map((session) => (
              <div
                key={session._id || session.id}
                className="bg-base-100 p-4 rounded-2xl border-2 border-warning/40 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="badge badge-warning badge-sm font-semibold gap-1">
                      <FaStopwatch className="w-3 h-3" /> Active Session
                    </span>
                    <p className="text-xs text-base-content/60 mt-1">
                      Started: {formatNigeriaDateTimeShort(session.sessionStart)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleEndSession(session._id || session.id)}
                    disabled={endingId === (session._id || session.id)}
                    className="btn btn-xs sm:btn-sm btn-outline btn-warning rounded-xl font-semibold"
                  >
                    {endingId === (session._id || session.id) ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      'Conclude Session'
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {session.phototherapy && (
                    <span className="badge badge-info/20 text-info font-bold gap-1 py-2 px-2.5">
                      <FaLightbulb className="w-3 h-3" /> Phototherapy Active
                    </span>
                  )}
                  {session.incubator && (
                    <span className="badge badge-primary/20 text-primary font-bold gap-1 py-2 px-2.5">
                      <FaThermometerHalf className="w-3 h-3" /> Incubator Thermoregulation
                    </span>
                  )}
                  {session.temperature != null && (
                    <span className="badge badge-ghost text-xs font-semibold py-2 px-2.5">
                      Temp: {session.temperature}°C
                    </span>
                  )}
                  {session.feedingType && session.feedingType !== 'none' && (
                    <span className="badge badge-ghost text-xs font-semibold py-2 px-2.5 capitalize">
                      Feed: {session.feedingType}{' '}
                      {session.feedingAmountMl ? `(${session.feedingAmountMl}ml)` : ''}
                    </span>
                  )}
                </div>

                {session.notes && (
                  <p className="text-xs text-base-content/70 italic bg-base-200/50 p-2.5 rounded-xl">
                    {session.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Care Sessions Ledger */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <h4 className="font-bold text-base text-base-content flex items-center gap-2">
            <FaHistory className="text-primary" />
            Completed Care Sessions History ({completedSessions.length})
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : completedSessions.length === 0 ? (
          <div className="p-10 text-center text-xs text-base-content/50">
            No completed neonatal care sessions logged yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-xs">
              <thead className="bg-base-200/60 uppercase tracking-wider text-base-content/70">
                <tr>
                  <th className="py-3 px-4">Session Period</th>
                  <th className="py-3 px-4">Therapy Protocols</th>
                  <th className="py-3 px-4">Temperature</th>
                  <th className="py-3 px-4">Feeding</th>
                  <th className="py-3 px-4">Staff / Directives</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {completedSessions.map((item) => (
                  <tr key={item._id || item.id} className="hover:bg-base-200/40">
                    <td className="py-3 px-4 text-base-content font-medium">
                      <div>{formatNigeriaDateTimeShort(item.sessionStart)}</div>
                      <div className="text-[11px] text-base-content/50">
                        to {formatNigeriaDateTimeShort(item.sessionEnd)}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {item.phototherapy && (
                          <span className="badge badge-info badge-xs">Phototherapy</span>
                        )}
                        {item.incubator && (
                          <span className="badge badge-primary badge-xs">Incubator</span>
                        )}
                        {!item.phototherapy && !item.incubator && (
                          <span className="text-base-content/40 italic">Routine observation</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-base-content">
                      {item.temperature != null ? `${item.temperature}°C` : '—'}
                    </td>
                    <td className="py-3 px-4 capitalize text-base-content">
                      {item.feedingType && item.feedingType !== 'none' ? (
                        <>
                          <span className="font-semibold">{item.feedingType}</span>
                          {item.feedingAmountMl ? ` · ${item.feedingAmountMl} ml` : ''}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-3 px-4 text-base-content/70">
                      <div>{item.recordedByName || 'Staff'}</div>
                      {item.notes && (
                        <div className="text-[11px] text-base-content/40 italic">{item.notes}</div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Start Session Modal */}
      {showStartModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-base-300 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaBaby className="text-primary" /> Start Neonatal Care Session
              </h3>
              <button
                type="button"
                onClick={() => setShowStartModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStartSession} className="space-y-4">
              <div className="space-y-2 bg-base-200/40 p-3.5 rounded-xl border border-base-200">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    name="phototherapy"
                    checked={form.phototherapy}
                    onChange={(e) => setForm((f) => ({ ...f, phototherapy: e.target.checked }))}
                    className="checkbox checkbox-info checkbox-sm"
                  />
                  <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                    <FaLightbulb className="text-info" /> Phototherapy Unit Active
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer pt-1 border-t border-base-200">
                  <input
                    type="checkbox"
                    name="incubator"
                    checked={form.incubator}
                    onChange={(e) => setForm((f) => ({ ...f, incubator: e.target.checked }))}
                    className="checkbox checkbox-primary checkbox-sm"
                  />
                  <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
                    <FaThermometerHalf className="text-primary" /> Incubator Active
                  </span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Infant Temperature (°C)
                </label>
                <input
                  type="number"
                  step="0.1"
                  name="temperature"
                  value={form.temperature}
                  onChange={(e) => setForm((f) => ({ ...f, temperature: e.target.value }))}
                  placeholder="e.g. 36.6"
                  className="input input-bordered input-sm w-full rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Feeding Route / Type
                  </label>
                  <select
                    name="feedingType"
                    value={form.feedingType}
                    onChange={(e) => setForm((f) => ({ ...f, feedingType: e.target.value }))}
                    className="select select-bordered select-sm w-full rounded-xl text-xs"
                  >
                    <option value="breast">Breast Milk</option>
                    <option value="formula">Infant Formula</option>
                    <option value="ngt">Nasogastric Tube (NGT)</option>
                    <option value="parenteral">Total Parenteral</option>
                    <option value="none">NPO / Nil by Mouth</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Feed Amount (ml)
                  </label>
                  <input
                    type="number"
                    name="feedingAmountMl"
                    value={form.feedingAmountMl}
                    onChange={(e) => setForm((f) => ({ ...f, feedingAmountMl: e.target.value }))}
                    placeholder="e.g. 30"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Clinical Observation Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={2}
                  placeholder="e.g. Good suck reflex, bilateral eye protection applied for phototherapy"
                  className="textarea textarea-bordered w-full rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowStartModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-sm btn-primary rounded-xl font-semibold gap-2"
                >
                  {saving ? 'Starting...' : 'Start Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default NeonatalCareTab
