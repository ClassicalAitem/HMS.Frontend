import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import wardRoundApi from '@/services/api/wardRoundApi'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'


 const WardRoundForm = ({ patientId, dependantId, doctorId, consultationId: providedConsultationId, onSubmitted }) => {
  const [form, setForm] = useState({ note: '', dischargeNote: '', isDischargeRound: false })
  const [saving, setSaving] = useState(false)
  const [consultationId, setConsultationId] = useState(providedConsultationId || null)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      try {
        const res = await getAdmissionByPatientId(patientId)
        const admissions = res?.data ?? res ?? []
        const scoped = Array.isArray(admissions)
          ? admissions.filter(a => dependantId ? a.dependantId === dependantId : !a.dependantId)
          : []
        const activeAdmissions = scoped.filter(a => a.status !== 'discharged')
        const confirmed = activeAdmissions.filter(a => !!a.confirmedAt)
        const active = (confirmed.length > 0 ? confirmed : activeAdmissions)
          .sort((a, b) => new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0))[0]
        if (mounted && active) setConsultationId(active.consultationId || active.consultation || null)
      } catch (err) {
        // ignore
      }
    }
    if (patientId) load()
    return () => { mounted = false }
  }, [patientId, dependantId, providedConsultationId])

  useEffect(() => {
    if (providedConsultationId) setConsultationId(providedConsultationId)
  }, [providedConsultationId])

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!consultationId) return toast.error('No active consultation found for this admission')
    setSaving(true)
    try {
      const payload = {
        patientId,
        ...(dependantId ? { dependantId } : {}),
        ...(doctorId ? { doctorId } : {}),
        consultationId,
        note: form.note,
        dischargeNote: form.dischargeNote,
        isDischargeRound: form.isDischargeRound,
      }
       await wardRoundApi.createWardRound(payload)
      toast.success('Ward round submitted')
      onSubmitted && onSubmitted()
      setForm({ note: '', dischargeNote: '', isDischargeRound: false })
    } catch (err) {
      console.error('WardRoundForm: submit error', err)
      toast.error(err?.response?.data?.message || 'Failed to submit ward round')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-base-100 rounded space-y-3">
      <textarea name="note" value={form.note} onChange={handleChange} placeholder="Round note" className="textarea textarea-bordered w-full" />
      <textarea name="dischargeNote" value={form.dischargeNote} onChange={handleChange} placeholder="Discharge note (optional)" className="textarea textarea-bordered w-full" />
      <label className="flex items-center gap-2"><input type="checkbox" name="isDischargeRound" checked={form.isDischargeRound} onChange={handleChange} /> This is a discharge round</label>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Submit Ward Round'}</button>
      </div>
    </form>
  )
}

export default WardRoundForm
