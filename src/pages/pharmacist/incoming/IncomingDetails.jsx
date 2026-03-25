import React, { useEffect, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useParams, useNavigate } from 'react-router-dom'
import { getPrescriptionByPatientId, updatePrescription } from '@/services/api/prescriptionsAPI'
import { getPatientById, updatePatientStatus } from '@/services/api/patientsAPI'
import { getInventories } from '@/services/api/inventoryAPI'
import { AddDrugModal } from '@/components/modals'
import { hasStatus } from '@/utils/statusUtils'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import toast from 'react-hot-toast'

const IncomingDetails = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [prescriptions, setPrescriptions] = useState({
    active: [],
    history: []
  })

  const [patient, setPatient] = useState(null)
  const [inventory, setInventory] = useState([])
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true

    const fetch = async () => {
      setLoading(true)
      setError(null)

      try {
        // inventory
        const invRes = await getInventories()
        const invData = invRes?.data ?? []
        if (mounted) setInventory(invData)

        // prescriptions
        const presRes = await getPrescriptionByPatientId(patientId)
        const presData = presRes?.data ?? presRes
        const list = Array.isArray(presData) ? presData : (presData ? [presData] : [])

        const active = list.filter(p => String(p.status).toLowerCase() !== 'completed')
        const history = list
          .filter(p => String(p.status).toLowerCase() === 'completed')
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

        if (mounted) setPrescriptions({ active, history })

        // patient
        const pRes = await getPatientById(patientId)
        const pData = pRes?.data ?? pRes
        if (mounted) setPatient(pData)

      } catch (err) {
        console.error(err)
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [patientId])

  // 🔥 reusable render
  const renderMedications = (list = [], isHistory = false) => {
    if (!list.length) {
      return <div className="text-sm text-base-content/60">No data.</div>
    }

    const meds = list.flatMap(p =>
      (p.medications || []).map(m => {
        const inv = inventory.find(
          i => i.name.toLowerCase() === m.drugName.toLowerCase()
        )

       return {
        ...m,
        form: inv?.form,
        strength: inv?.strength,
        status: p.status,
        _id: p._id,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt
      }
      })
    )

    return (
      <div className="space-y-3">
        {meds.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${
              isHistory ? 'bg-base-200 opacity-70' : 'bg-base-100'
            }`}
          >
            <div className="flex justify-between">
              
               
              <div>
                <div className="font-semibold">{m.drugName}</div>
                <div className="text-sm text-base-content/70">
                  {m.form || ''} {m.strength ? `• ${m.strength}` : ''}
                </div>
                <div className="text-sm">Dosage: {m.dosage}</div>
                <div className="text-sm">Frequency: {m.frequency}</div>
                <div className="text-sm">Duration: {m.duration}</div>
              </div>
<div className="text-sm text-right space-y-1">
  <div>Status: {m.status}</div>

  <div className="text-xs text-base-content/60">
    Created: {m.createdAt
      ? new Date(m.createdAt).toLocaleString('en-NG', {
          dateStyle: 'medium',
          timeStyle: 'short'
        })
      : '—'}
  </div>



  {m.instructions && (
    <div className="text-xs mt-1">
      Instruction: {m.instructions}
    </div>
  )}
</div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  // 🔥 actions
  const handleComplete = async () => {
    const pres = prescriptions.active[0]
    if (!pres) return

    const pid = patient?.id || patient?._id || patient?.patientId

    const promise = Promise.all([
      updatePrescription(pres._id, { status: 'completed' }),
      updatePatientStatus(pid, { status: PATIENT_STATUS.PHARMACY_COMPLETED })
    ])

    toast.promise(promise, {
      loading: 'Completing...',
      success: 'Completed',
      error: 'Failed'
    })

    try {
      await promise

      // move to history instantly
      setPrescriptions(prev => {
        const updatedActive = prev.active.filter(p => p._id !== pres._id)
        const updatedHistory = [{ ...pres, status: 'completed' }, ...prev.history]
        return { active: updatedActive, history: updatedHistory }
      })

      setPatient(prev => ({
        ...(prev || {}),
        status: PATIENT_STATUS.PHARMACY_COMPLETED
      }))

    } catch (e) {
      toast.error('Failed to complete')
    }
  }

  const handleSendToNurse = async () => {
    const pres = prescriptions.active[0]
    if (!pres) return

    const pid = patient?.id || patient?._id || patient?.patientId

    const promise = Promise.all([
      updatePrescription(pres._id, { status: 'pending_nurse' }),
      updatePatientStatus(pid, { status: PATIENT_STATUS.AWAITING_INJECTION })
    ])

    toast.promise(promise, {
      loading: 'Sending...',
      success: 'Sent to nurse',
      error: 'Failed'
    })

    try {
      await promise

      setPrescriptions(prev => ({
        ...prev,
        active: prev.active.map(p =>
          p._id === pres._id ? { ...p, status: 'pending_nurse' } : p
        )
      }))

      setPatient(prev => ({
        ...(prev || {}),
        status: PATIENT_STATUS.AWAITING_INJECTION
      }))
    } catch (e) {
      toast.error('Failed to send to nurse')
    }
  }

  return (
    <PharmacistLayout>
      <div className="p-6">

        {/* header */}
        <div className="mb-4 flex justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              Prescription Details
            </h1>
            <p className="text-sm">
              {patient?.firstName} {patient?.lastName}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        <div className="p-6 border rounded-xl bg-base-100">

          {loading ? (
            <div className="h-20 bg-base-200 animate-pulse" />
          ) : error ? (
            <div className="text-error">Error loading</div>
          ) : (
            <>
              {/* ACTIVE */}
              <h3 className="font-medium mb-3">Active</h3>
              {renderMedications(prescriptions.active)}

              {/* BUTTONS */}
              {prescriptions.active.length > 0 && (
                <div className="mt-4 flex gap-3">
                  <button className="btn btn-primary btn-sm" onClick={handleComplete}>
                    Complete Pharmacy
                  </button>

                  <button
  className="btn btn-primary btn-sm"
  disabled={
    !patient ||
    prescriptions.active.length === 0 ||
    hasStatus(patient?.status, PATIENT_STATUS.AWAITING_INJECTION)
  }
  onClick={async () => {
    const pres = prescriptions.active[0]
    if (!pres) return

    const pid = patient?.id || patient?._id || patient?.patientId
    if (!pid) return

    const promise = Promise.all([
      // ✅ mark prescription done
      updatePrescription(pres._id, { status: 'completed' }),

      // ✅ move patient to nurse
      updatePatientStatus(pid, {
        status: PATIENT_STATUS.AWAITING_INJECTION
      })
    ])

    toast.promise(promise, {
      loading: 'Completing & sending to nurse...',
      success: 'Sent to nurse',
      error: 'Failed'
    })

    try {
      await promise

      // 🔥 move to history immediately
      setPrescriptions(prev => {
        const updatedActive = prev.active.filter(p => p._id !== pres._id)
        const updatedHistory = [
          { ...pres, status: 'completed' },
          ...prev.history
        ]

        return {
          active: updatedActive,
          history: updatedHistory
        }
      })

      setPatient(prev => ({
        ...(prev || {}),
        status: PATIENT_STATUS.AWAITING_INJECTION
      }))

    } catch (e) {
      toast.error('Failed to send to nurse')
    }
  }}
>
  Complete & Send to Nurse
</button>
                </div>
              )}

              {/* HISTORY */}
              <h3 className="font-medium mt-6 mb-3">History</h3>
              {renderMedications(prescriptions.history, true)}
            </>
          )}

        </div>

        {isSelectModalOpen && (
          <AddDrugModal
            setIsSelectModalOpen={setIsSelectModalOpen}
            prescriptionPatient={prescriptions.active[0]}
          />
        )}

      </div>
    </PharmacistLayout>
  )
}

export default IncomingDetails