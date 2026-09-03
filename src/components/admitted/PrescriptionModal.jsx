import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createPrescription, getPrescriptionsForConsultation } from '@/services/api/prescriptionsAPI'

const PrescriptionModal = ({ isOpen, onClose, consultationId, patientId, onCreated }) => {
  const [loading, setLoading] = useState(false)
  const [drugName, setDrugName] = useState('')
  const [medicationType, setMedicationType] = useState('tablet')
  const [dosageAmount, setDosageAmount] = useState('')
  const [dosageUnit, setDosageUnit] = useState('tablet')
  const [frequency, setFrequency] = useState('b.d')
  const [durationAmount, setDurationAmount] = useState('3')
  const [durationUnit, setDurationUnit] = useState('day')
  const [instructions, setInstructions] = useState('')

  useEffect(() => {
    if (!isOpen) {
      setDrugName('')
      setMedicationType('tablet')
      setDosageAmount('')
      setDosageUnit('tablet')
      setFrequency('b.d')
      setDurationAmount('3')
      setDurationUnit('day')
      setInstructions('')
    }
  }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!drugName) return toast.error('Drug name is required')
    if (!dosageAmount || Number(dosageAmount) <= 0) return toast.error('Valid dosage amount is required')

    setLoading(true)
    try {
      const normalizedDuration =
        durationUnit === 'week'
          ? `${durationAmount}/52`
          : durationUnit === 'month'
          ? `${durationAmount}/12`
          : durationUnit === 'year'
          ? `${durationAmount}yr`
          : `${durationAmount}/7`

      const payload = {
        patientId,
        consultationId,
        medications: [
          {
            medicationType,
            drugName,
            dosage: `${dosageAmount} ${dosageUnit}`,
            dosageAmount: Number(dosageAmount),
            dosageUnit,
            frequency,
            duration: normalizedDuration,
            instructions: instructions || undefined,
            availability: 'available',
          },
        ],
        status: 'pending',
      }
      await createPrescription(payload, consultationId, 'consultation')
      toast.success('Prescription created')
      onCreated && onCreated()
      onClose()
    } catch (err) {
      console.error('PrescriptionModal: error', err)
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create prescription')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg bg-base-100 rounded-xl p-5 shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-primary">Create Prescription</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs text-base-content/70 block mb-1">Drug Name *</label>
            <input
              value={drugName}
              onChange={(e) => setDrugName(e.target.value)}
              className="input input-bordered w-full input-sm"
              placeholder="e.g. Paracetamol"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Type</label>
              <select
                className="select select-bordered w-full select-sm"
                value={medicationType}
                onChange={(e) => {
                  setMedicationType(e.target.value)
                  if (e.target.value === 'syrup' || e.target.value === 'gutt') setDosageUnit('ml')
                  else if (e.target.value === 'injection') setDosageUnit('ml')
                  else setDosageUnit('tablet')
                }}
              >
                <option value="tablet">Tablet / Cap</option>
                <option value="syrup">Syrup</option>
                <option value="injection">Injection</option>
                <option value="cream">Cream</option>
                <option value="gutt">Gutt</option>
                <option value="infusion">Infusion</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Dose Amount *</label>
              <input
                type="number"
                min="0.1"
                step="any"
                value={dosageAmount}
                onChange={(e) => setDosageAmount(e.target.value)}
                className="input input-bordered w-full input-sm"
                placeholder="e.g. 500"
                required
              />
            </div>
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Dose Unit *</label>
              <input
                value={dosageUnit}
                onChange={(e) => setDosageUnit(e.target.value)}
                className="input input-bordered w-full input-sm"
                placeholder="e.g. mg, tablet, ml"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Frequency</label>
              <select
                className="select select-bordered w-full select-sm"
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
              >
                <option value="STAT">STAT (Once)</option>
                <option value="dly">Daily</option>
                <option value="b.d">b.d (2x daily)</option>
                <option value="tds">tds (3x daily)</option>
                <option value="qds">qds (4x daily)</option>
                <option value="mane">Mane (Morning)</option>
                <option value="nocte">Nocte (Night)</option>
                <option value="prn">PRN (As needed)</option>
                <option value="alt die">Alt Die</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Duration</label>
              <input
                type="number"
                min="1"
                value={durationAmount}
                onChange={(e) => setDurationAmount(e.target.value)}
                className="input input-bordered w-full input-sm"
                required
              />
            </div>
            <div>
              <label className="text-xs text-base-content/70 block mb-1">Duration Unit</label>
              <select
                className="select select-bordered w-full select-sm"
                value={durationUnit}
                onChange={(e) => setDurationUnit(e.target.value)}
              >
                <option value="day">Day(s)</option>
                <option value="week">Week(s)</option>
                <option value="month">Month(s)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-base-content/70 block mb-1">Instructions (optional)</label>
            <input
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="input input-bordered w-full input-sm"
              placeholder="e.g. After meals"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrescriptionModal
