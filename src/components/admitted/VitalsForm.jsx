import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { createVital } from '@/services/api/vitalsAPI'

const VitalsForm = ({ patientId, consultationId, onSaved }) => {
  const [form, setForm] = useState({ temperature: '', pulse: '', respiratoryRate: '', systolic: '', diastolic: '', urine: '', stool: '' })
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        patientId,
        consultationId,
        temperature: form.temperature || undefined,
        pulse: form.pulse || undefined,
        respiratoryRate: form.respiratoryRate || undefined,
        bp: form.systolic || form.diastolic ? `${form.systolic}/${form.diastolic}` : undefined,
        urine: form.urine || undefined,
        stool: form.stool || undefined,
      }
      await createVital(payload)
      toast.success('Vital recorded')
      setForm({ temperature: '', pulse: '', respiratoryRate: '', systolic: '', diastolic: '', urine: '', stool: '' })
      onSaved && onSaved()
    } catch (err) {
      console.error('Failed to save vital', err)
      toast.error(err?.response?.data?.message || 'Failed to save vital')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-base-100 rounded">
      <div className="grid grid-cols-2 gap-3">
        <input name="temperature" value={form.temperature} onChange={handleChange} placeholder="Temperature (°C)" className="input input-bordered" />
        <input name="pulse" value={form.pulse} onChange={handleChange} placeholder="Pulse (bpm)" className="input input-bordered" />
        <input name="respiratoryRate" value={form.respiratoryRate} onChange={handleChange} placeholder="Respiration" className="input input-bordered" />
        <div className="flex gap-2">
          <input name="systolic" value={form.systolic} onChange={handleChange} placeholder="BP systolic" className="input input-bordered flex-1" />
          <input name="diastolic" value={form.diastolic} onChange={handleChange} placeholder="BP diastolic" className="input input-bordered flex-1" />
        </div>
        <input name="urine" value={form.urine} onChange={handleChange} placeholder="Urine" className="input input-bordered col-span-2" />
        <input name="stool" value={form.stool} onChange={handleChange} placeholder="Stool" className="input input-bordered col-span-2" />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Record Vital'}</button>
      </div>
    </form>
  )
}

export default VitalsForm
