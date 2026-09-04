import React, { useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import CurrentVitalsCard from '@/components/doctor/patient/CurrentVitalsCard'
import VitalsChart from './VitalsChart'
import { createVital } from '@/services/api/vitalsAPI'
import { formatNigeriaDateTimeShort, formatNigeriaTime } from '@/utils/formatDateTimeUtils'
import {
  FaHeartbeat,
  FaPlus,
  FaVial,
  FaHistory,
  FaUserNurse,
} from 'react-icons/fa'

const VitalsTab = ({
  patientId,
  dependantId,
  consultationId,
  patient,
  vitals = [],
  loading = false,
  onRefresh,
  isDoctor = false,
  isNurse = false,
}) => {
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [recordError, setRecordError] = useState('')

  const [recordForm, setRecordForm] = useState({
    bp: '',
    pulse: '',
    temperature: '',
    weight: '',
    spo2: '',
    height: '',
    respiratoryRate: '',
    urine: '',
    stool: '',
    notes: '',
  })

  // Sort vitals newest first for history table
  const sortedVitals = useMemo(() => {
    return [...vitals].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
  }, [vitals])

  // Latest reading for summary card
  const latest = sortedVitals[0] || null

  const handleSaveVital = async (e) => {
    e.preventDefault()
    setSaving(true)
    setRecordError('')

    try {
      const payload = {
        patientId,
        dependantId: dependantId || undefined,
        consultationId: consultationId || undefined,
        bp: recordForm.bp || undefined,
        temperature: recordForm.temperature ? Number(recordForm.temperature) : undefined,
        weight: recordForm.weight ? Number(recordForm.weight) : undefined,
        pulse: recordForm.pulse ? Number(recordForm.pulse) : undefined,
        spo2: recordForm.spo2 ? Number(recordForm.spo2) : undefined,
        height: recordForm.height ? Number(recordForm.height) : undefined,
        respiratoryRate: recordForm.respiratoryRate ? Number(recordForm.respiratoryRate) : undefined,
        urine: recordForm.urine ? Number(recordForm.urine) : undefined,
        stool: recordForm.stool ? Number(recordForm.stool) : undefined,
        notes: recordForm.notes || undefined,
      }

      await createVital(payload)
      toast.success('Inpatient vitals recorded successfully')
      setIsRecordModalOpen(false)
      setRecordForm({
        bp: '',
        pulse: '',
        temperature: '',
        weight: '',
        spo2: '',
        height: '',
        respiratoryRate: '',
        urine: '',
        stool: '',
        notes: '',
      })
      if (onRefresh) onRefresh()
    } catch (err) {
      console.error('Failed to record vitals', err)
      const msg = err?.response?.data?.error || err?.response?.data?.message || 'Failed to save vital entry'
      setRecordError(typeof msg === 'string' ? msg : JSON.stringify(msg))
      toast.error(typeof msg === 'string' ? msg : 'Failed to save vital entry')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Current Vitals Card (Reused from CurrentVitalsCard.jsx) */}
      <CurrentVitalsCard
        patient={patient}
        latest={latest}
        loading={loading}
        onRecordOpen={() => {
          setRecordError('')
          setIsRecordModalOpen(true)
        }}
        buttonHidden={!isNurse}
      />

      {/* Continuous Temperature & Clinical Vitals Observation Chart */}
      <VitalsChart vitals={vitals} data={vitals} />

      {/* Detailed Chronological History Table */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-base text-base-content flex items-center gap-2">
              <FaHistory className="text-primary" /> History Ledger ({sortedVitals.length})
            </h4>
            <p className="text-xs text-base-content/60">
              Chronological timeline of nurse evaluations logged during this admission
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : sortedVitals.length === 0 ? (
          <div className="p-10 text-center text-xs text-base-content/50">
            No vitals entries logged for this admission yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-xs min-w-[900px]">
            <thead className="bg-base-200/60 uppercase tracking-wider text-base-content/70">
              <tr>
                <th className="py-3 px-4">Recorded At</th>
                <th className="py-3 px-4 text-error">Temp (°C)</th>
                <th className="py-3 px-4 text-info">Pulse (bpm)</th>
                <th className="py-3 px-4 text-secondary">BP (mmHg)</th>
                <th className="py-3 px-4">SpO2 (%)</th>
                <th className="py-3 px-4">Resp (cpm)</th>
                <th className="py-3 px-4">Weight (kg)</th>
                <th className="py-3 px-4">Height (cm)</th>
                <th className="py-3 px-4">Logged By Nurse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-200">
              {sortedVitals.map((v, idx) => {
                const nurseName = v.nurse
                  ? `Nurse ${v.nurse.firstName || ''} ${v.nurse.lastName || ''}`.trim()
                  : v.nurseId
                  ? `Nurse (ID: ${String(v.nurseId).slice(-4)})`
                  : 'Nurse on Duty'

                return (
                  <tr key={v.id || v._id || idx} className="hover:bg-base-200/40">
                    <td className="py-3 px-4 font-bold text-base-content whitespace-nowrap">
                      {formatNigeriaDateTimeShort(v.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-bold text-error">
                      {v.temperature != null ? `${v.temperature}°C` : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-info">
                      {v.pulse != null ? `${v.pulse} bpm` : '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-secondary">
                      {v.bp || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold">
                      {v.spo2 != null ? `${v.spo2}%` : '—'}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {v.respiratoryRate != null ? `${v.respiratoryRate}` : '—'}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {v.weight != null ? `${v.weight} kg` : '—'}
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {v.height != null ? `${v.height} cm` : '—'}
                    </td>
                   
                    <td className="py-3 px-4 text-base-content/80 whitespace-nowrap">
                      <div className="flex items-center gap-1 font-medium text-success">
                        <FaUserNurse className="w-3 h-3" />
                        {nurseName}
                      </div>
                    </td>
                    
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Record Inpatient Vitals Modal (Nurse Only) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-base-300 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                  <FaHeartbeat className="text-primary" /> Record Inpatient Vitals
                </h3>
                <p className="text-xs text-base-content/60">
                  {patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Admitted Patient'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveVital} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    Blood Pressure (mmHg)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 120/80"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.bp}
                    onChange={(e) => setRecordForm((f) => ({ ...f, bp: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    Pulse Rate (bpm)
                  </label>
                  <input
                    type="number"
                    placeholder="78"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.pulse}
                    onChange={(e) => setRecordForm((f) => ({ ...f, pulse: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="36.8"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.temperature}
                    onChange={(e) => setRecordForm((f) => ({ ...f, temperature: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    SpO2 (%)
                  </label>
                  <input
                    type="number"
                    placeholder="98"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.spo2}
                    onChange={(e) => setRecordForm((f) => ({ ...f, spo2: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    Respiratory Rate (cpm)
                  </label>
                  <input
                    type="number"
                    placeholder="16"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.respiratoryRate}
                    onChange={(e) => setRecordForm((f) => ({ ...f, respiratoryRate: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="65"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.weight}
                    onChange={(e) => setRecordForm((f) => ({ ...f, weight: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-xs font-semibold text-base-content/70">
                    Height (cm)
                  </label>
                  <input
                    type="number"
                    placeholder="170"
                    className="input input-bordered input-sm w-full rounded-xl"
                    value={recordForm.height}
                    onChange={(e) => setRecordForm((f) => ({ ...f, height: e.target.value }))}
                  />
                </div>
                
               
              </div>

              

              {recordError && (
                <div className="p-2.5 rounded-xl bg-error/10 border border-error/20 text-xs text-error">
                  {recordError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
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
                  {saving ? 'Saving...' : 'Record Vitals'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default VitalsTab
