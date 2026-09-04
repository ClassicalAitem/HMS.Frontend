import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import wardRoundApi from '@/services/api/wardRoundApi'
import { getAdmissionByPatientId } from '@/services/api/admissionApi'
import { FaPrescriptionBottleAlt, FaFlask, FaTrashAlt } from 'react-icons/fa'

const WardRoundForm = ({ patientId, dependantId, doctorId, consultationId: providedConsultationId, onSubmitted }) => {
  const [form, setForm] = useState({ note: '', dischargeNote: '', isDischargeRound: false })
  const [saving, setSaving] = useState(false)
  const [consultationId, setConsultationId] = useState(providedConsultationId || null)

  // Inline prescription queue
  const [inlineMedications, setInlineMedications] = useState([])
  const [showAddMed, setShowAddMed] = useState(false)
  const [medForm, setMedForm] = useState({
    drugName: '',
    dosage: '1 tablet',
    frequency: 'BD (twice daily)',
    duration: '5 days',
    instructions: 'Take after meals',
  })

  // Inline lab queue
  const [inlineTests, setInlineTests] = useState([])
  const [testInput, setTestInput] = useState('')

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

  const handleChange = (e) =>
    setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  const handleAddMedication = (e) => {
    e.preventDefault()
    if (!medForm.drugName.trim()) return toast.error('Please enter drug name')
    setInlineMedications(prev => [...prev, { ...medForm, drugName: medForm.drugName.trim() }])
    setMedForm({
      drugName: '',
      dosage: '1 tablet',
      frequency: 'BD (twice daily)',
      duration: '5 days',
      instructions: 'Take after meals',
    })
    setShowAddMed(false)
  }

  const handleAddTest = (e) => {
    e.preventDefault()
    if (!testInput.trim()) return
    setInlineTests(prev => [...prev, testInput.trim()])
    setTestInput('')
  }

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
        prescriptions: inlineMedications.length > 0 ? inlineMedications : undefined,
        investigations: inlineTests.length > 0 ? inlineTests : undefined,
      }
      await wardRoundApi.createWardRound(payload)
      toast.success('Ward round submitted')
      onSubmitted && onSubmitted()
      setForm({ note: '', dischargeNote: '', isDischargeRound: false })
      setInlineMedications([])
      setInlineTests([])
    } catch (err) {
      console.error('WardRoundForm: submit error', err)
      toast.error(err?.response?.data?.message || 'Failed to submit ward round')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-base-100 rounded space-y-3">
      <textarea
        name="note"
        value={form.note}
        onChange={handleChange}
        placeholder="Round note"
        className="textarea textarea-bordered w-full"
      />

      {/* Inline Prescriptions Queue */}
      <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
            <FaPrescriptionBottleAlt className="text-primary" />
            Prescribed Medications for this Round ({inlineMedications.length})
          </span>
          <button
            type="button"
            onClick={() => setShowAddMed(prev => !prev)}
            className="btn btn-xs btn-outline btn-primary rounded-lg"
          >
            + Add Drug
          </button>
        </div>

        {inlineMedications.length > 0 && (
          <div className="space-y-1.5 pt-1">
            {inlineMedications.map((m, i) => (
              <div key={i} className="flex items-center justify-between bg-base-100 p-2 rounded-lg text-xs border border-base-300">
                <span className="font-semibold text-base-content">
                  {m.drugName} - {m.dosage} ({m.frequency}, {m.duration})
                </span>
                <button
                  type="button"
                  onClick={() => setInlineMedications(prev => prev.filter((_, idx) => idx !== i))}
                  className="btn btn-ghost btn-xs text-error"
                >
                  <FaTrashAlt className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showAddMed && (
          <div className="p-3 bg-base-100 rounded-xl border border-base-300 space-y-2 mt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Drug name (e.g. IV Ceftriaxone 1g)"
                className="input input-bordered input-xs rounded-lg"
                value={medForm.drugName}
                onChange={(e) => setMedForm({ ...medForm, drugName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Dosage (e.g. 1 vial / 1 tab)"
                className="input input-bordered input-xs rounded-lg"
                value={medForm.dosage}
                onChange={(e) => setMedForm({ ...medForm, dosage: e.target.value })}
              />
              <input
                type="text"
                placeholder="Frequency (e.g. BD, TDS, Stat)"
                className="input input-bordered input-xs rounded-lg"
                value={medForm.frequency}
                onChange={(e) => setMedForm({ ...medForm, frequency: e.target.value })}
              />
              <input
                type="text"
                placeholder="Duration (e.g. 5 days)"
                className="input input-bordered input-xs rounded-lg"
                value={medForm.duration}
                onChange={(e) => setMedForm({ ...medForm, duration: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setShowAddMed(false)} className="btn btn-xs btn-ghost">
                Cancel
              </button>
              <button type="button" onClick={handleAddMedication} className="btn btn-xs btn-primary">
                Attach Drug
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inline Lab Orders Queue */}
      <div className="p-3.5 bg-base-200/40 rounded-xl border border-base-200 space-y-2">
        <span className="text-xs font-bold text-base-content flex items-center gap-1.5">
          <FaFlask className="text-primary" />
          Ordered Laboratory Investigations ({inlineTests.length})
        </span>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type test name and click Add..."
            className="input input-bordered input-xs rounded-lg flex-1 text-xs"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTest(e)
              }
            }}
          />
          <button type="button" onClick={handleAddTest} className="btn btn-xs btn-primary rounded-lg">
            + Add Test
          </button>
        </div>

        {inlineTests.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {inlineTests.map((t, idx) => (
              <span key={idx} className="badge badge-primary badge-outline badge-sm gap-1 py-2 px-2.5 font-medium">
                {t}
                <button
                  type="button"
                  onClick={() => setInlineTests(prev => prev.filter((_, i) => i !== idx))}
                  className="hover:text-black"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <textarea
        name="dischargeNote"
        value={form.dischargeNote}
        onChange={handleChange}
        placeholder="Discharge note (optional)"
        className="textarea textarea-bordered w-full"
      />
      <label className="flex items-center gap-2">
        <input type="checkbox" name="isDischargeRound" checked={form.isDischargeRound} onChange={handleChange} />
        This is a discharge round
      </label>
      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Submit Ward Round'}
        </button>
      </div>
    </form>
  )
}

export default WardRoundForm