import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { createPrescription, getPrescriptionsForConsultation } from '@/services/api/prescriptionsAPI'

const PrescriptionModal = ({ isOpen, onClose, consultationId, patientId, onCreated }) => {
  const [loading, setLoading] = useState(false)
  const [drugName, setDrugName] = useState('')
  const [dosage, setDosage] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [instructions, setInstructions] = useState('')

  useEffect(()=>{ if (!isOpen) { setDrugName(''); setDosage(''); setFrequency(''); setDuration(''); setInstructions('') } }, [isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        medications: [{ drugName, dosage, frequency, duration, instructions }],
        status: 'pending'
      }
      await createPrescription(payload, consultationId, 'consultation')
      toast.success('Prescription created')
      onCreated && onCreated()
      onClose()
    } catch (err) {
      console.error('PrescriptionModal: error', err)
      toast.error(err?.response?.data?.message || 'Failed to create prescription')
    } finally { setLoading(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg bg-base-100 rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Create Prescription</h3>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input value={drugName} onChange={(e)=>setDrugName(e.target.value)} className="input input-bordered w-full" placeholder="Drug name" required />
          <div className="grid grid-cols-2 gap-2">
            <input value={dosage} onChange={(e)=>setDosage(e.target.value)} className="input input-bordered" placeholder="Dosage" required />
            <input value={frequency} onChange={(e)=>setFrequency(e.target.value)} className="input input-bordered" placeholder="Frequency" required />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={duration} onChange={(e)=>setDuration(e.target.value)} className="input input-bordered" placeholder="Duration" required />
            <input value={instructions} onChange={(e)=>setInstructions(e.target.value)} className="input input-bordered" placeholder="Instructions (optional)" />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PrescriptionModal
