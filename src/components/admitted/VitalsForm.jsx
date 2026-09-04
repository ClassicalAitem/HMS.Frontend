import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { createVital } from '@/services/api/vitalsAPI'
import { FaHeartbeat, FaThermometerHalf, FaLungs, FaVial } from 'react-icons/fa'

const VitalsForm = ({ patientId, dependantId, consultationId, onSaved, onCancel }) => {
  const [form, setForm] = useState({
    temperature: '',
    pulse: '',
    respiratoryRate: '',
    systolic: '',
    diastolic: '',
    spo2: '',
    urine: '',
    stool: '',
    notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validate at least one vital sign is provided
    const hasReading =
      form.temperature ||
      form.pulse ||
      form.respiratoryRate ||
      form.systolic ||
      form.diastolic ||
      form.spo2 ||
      form.urine ||
      form.stool

    if (!hasReading) {
      return toast.error('Please enter at least one vital sign measurement')
    }

    setSaving(true)
    try {
      const bp = form.systolic || form.diastolic ? `${form.systolic || ''}/${form.diastolic || ''}` : undefined

      const payload = {
        patientId,
        ...(dependantId ? { dependantId } : {}),
        ...(consultationId ? { consultationId } : {}),
        temperature: form.temperature ? Number(form.temperature) : undefined,
        pulse: form.pulse ? Number(form.pulse) : undefined,
        respiratoryRate: form.respiratoryRate ? Number(form.respiratoryRate) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        bp,
        urine: form.urine ? String(form.urine).trim() : undefined,
        stool: form.stool ? String(form.stool).trim() : undefined,
        notes: form.notes ? String(form.notes).trim() : undefined,
      }

      await createVital(payload)
      toast.success('Clinical vitals recorded successfully')
      setForm({
        temperature: '',
        pulse: '',
        respiratoryRate: '',
        systolic: '',
        diastolic: '',
        spo2: '',
        urine: '',
        stool: '',
        notes: '',
      })
      if (onSaved) onSaved()
    } catch (err) {
      console.error('Failed to save vitals', err)
      toast.error(err?.response?.data?.error || err?.response?.data?.message || 'Failed to record vitals')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm space-y-5">
      <div className="flex items-center justify-between border-b border-base-200 pb-3">
        <div>
          <h4 className="text-base font-bold text-base-content flex items-center gap-2">
            <FaHeartbeat className="text-primary" />
            Record Inpatient Vitals
          </h4>
          <p className="text-xs text-base-content/60">
            Enter current vital measurements for admission clinical monitoring
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {/* Temperature */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <FaThermometerHalf className="text-error" /> Temperature (°C)
          </label>
          <input
            type="number"
            step="0.1"
            name="temperature"
            value={form.temperature}
            onChange={handleChange}
            placeholder="e.g. 36.8"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>

        {/* Pulse */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <FaHeartbeat className="text-info" /> Pulse (bpm)
          </label>
          <input
            type="number"
            name="pulse"
            value={form.pulse}
            onChange={handleChange}
            placeholder="e.g. 78"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>

        {/* Respiration */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <FaLungs className="text-success" /> Respiration (/min)
          </label>
          <input
            type="number"
            name="respiratoryRate"
            value={form.respiratoryRate}
            onChange={handleChange}
            placeholder="e.g. 18"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>

        {/* Blood Pressure Systolic / Diastolic */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Blood Pressure (mmHg)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              name="systolic"
              value={form.systolic}
              onChange={handleChange}
              placeholder="Systolic (120)"
              className="input input-bordered input-sm sm:input-md w-full rounded-xl"
            />
            <span className="text-base-content/40 font-bold">/</span>
            <input
              type="number"
              name="diastolic"
              value={form.diastolic}
              onChange={handleChange}
              placeholder="Diastolic (80)"
              className="input input-bordered input-sm sm:input-md w-full rounded-xl"
            />
          </div>
        </div>

        {/* SpO2 */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            SpO2 (%)
          </label>
          <input
            type="number"
            name="spo2"
            value={form.spo2}
            onChange={handleChange}
            placeholder="e.g. 98"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>

        {/* Urine */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1 flex items-center gap-1.5">
            <FaVial className="text-warning" /> Urine Output
          </label>
          <input
            type="text"
            name="urine"
            value={form.urine}
            onChange={handleChange}
            placeholder="e.g. Clear, 400ml"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>

        {/* Stool */}
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Stool Output / Frequency
          </label>
          <input
            type="text"
            name="stool"
            value={form.stool}
            onChange={handleChange}
            placeholder="e.g. Normal, once"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>

        {/* Notes */}
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-base-content/70 mb-1">
            Clinical Observation Notes (Optional)
          </label>
          <input
            type="text"
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="e.g. Patient resting comfortably, febrile on admission"
            className="input input-bordered input-sm sm:input-md w-full rounded-xl"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-base-200">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-sm btn-ghost rounded-xl"
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn btn-sm btn-primary rounded-xl font-semibold gap-2"
        >
          {saving ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              Saving...
            </>
          ) : (
            <>
              <FaHeartbeat />
              Record Vital Sign
            </>
          )}
        </button>
      </div>
    </form>
  )
}

export default VitalsForm
