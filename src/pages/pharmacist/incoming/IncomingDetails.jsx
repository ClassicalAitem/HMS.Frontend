import React, { useEffect, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useParams, useNavigate } from 'react-router-dom'
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI'
import { getPatientById, updatePatientStatus } from '@/services/api/patientsAPI'
import { updatePrescription } from '@/services/api/prescriptionsAPI'
import { AddDrugModal } from '@/components/modals'
import { hasStatus } from '@/utils/statusUtils'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import toast from 'react-hot-toast'

const IncomingDetails = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prescriptions, setPrescriptions] = useState(null)
  const [patient, setPatient] = useState(null)
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        const presRes = await getPrescriptionByPatientId(patientId)
        const presData = presRes?.data ?? presRes
        const list = Array.isArray(presData) ? presData : (presData ? [presData] : [])
        if (mounted) setPrescriptions(list)

        try {
          const pRes = await getPatientById(patientId)
          const pData = pRes?.data ?? pRes
          if (mounted) setPatient(pData)
        } catch (e) {
      toast.error('Failed to load patient data')
        }
      } catch (err) {
        console.error('Failed fetching prescription for patient', err)
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    fetch()
    return () => { mounted = false }
  }, [patientId])

  const renderMedications = () => {
    if (!prescriptions || !prescriptions.length) {
      return <div className="text-sm text-base-content/60">No medications found.</div>
    }

    const medications = prescriptions.flatMap(p =>
      (p.medications || []).map(m => ({
        ...m,
        status: p.status,
        consultationId: p.consultationId,
        createdAt: p.createdAt
      }))
    )

    return (
      <div className="space-y-3">
        {medications.map((m, idx) => (
          <div key={idx} className="p-4 rounded-lg border bg-base-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-base-content">{m.drugName}</div>
                <div className="text-sm text-base-content/70">Dosage: {m.dosage || '—'}</div>
              </div>
              <div className="text-sm text-base-content/70 text-right">
                <div>Status: {m.status}</div>
                <div>Frequency: {m.frequency || '—'}</div>
                <div>Duration: {m.duration || '—'}</div>
              </div>
            </div>
            {m.instructions && (
              <div className="mt-2 text-sm text-base-content/70">
                Instructions: {m.instructions}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <PharmacistLayout>
      <div className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-primary">Incoming — Prescription Details</h1>
            <p className="text-sm text-base-content/70">
              Patient: {patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}` : patientId}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>Back</button>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-6">
          {loading ? (
            <div className="animate-pulse h-24 w-full bg-base-200 rounded" />
          ) : error ? (
            <div className="text-sm text-error">Failed to load prescription data.</div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm text-base-content/70">
                  Status: <span className="font-medium">{prescriptions?.[0]?.status || '—'}</span>
                </div>
                <div className="text-sm text-base-content/70">
                  Created: {prescriptions?.[0]?.createdAt
                    ? new Date(prescriptions[0].createdAt).toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })
                    : '—'}
                </div>
              </div>

              <h3 className="text-lg font-medium mb-3">Medications</h3>
              {renderMedications()}

              <div className="mt-6 flex flex-wrap gap-3">

                {/* Mark prescription completed */}
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!prescriptions?.[0] || prescriptions[0].status === 'completed'}
                  onClick={async () => {
                    if (!prescriptions?.[0]?._id) return
                    const id = prescriptions[0]._id
                    const promise = updatePrescription(id, { status: 'completed' })
                    toast.promise(promise, {
                      loading: 'Marking prescription completed...',
                      success: 'Prescription marked completed',
                      error: (err) => err?.response?.data?.message || 'Failed to update prescription'
                    })
                    try {
                      const res = await promise
                      const data = res?.data ?? res
                      setPrescriptions(prev => {
                        const updated = [...prev]
                        updated[0] = { ...updated[0], status: data?.status ?? 'completed' }
                        return updated
                      })
                    } catch (e) {
                      toast.error(e?.response?.data?.message || 'An error occurred while updating prescription')  
                    }
                  }}
                >
                  Mark Prescription Completed
                </button>

                {/* Dispense Drug */}
                {prescriptions?.[0]?.medications?.length > 0 && (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => setIsSelectModalOpen(true)}
                  >
                    Dispense Drug
                  </button>
                )}

                {/* Complete Pharmacy */}
                <button
                  className="btn btn-primary btn-sm"
                  disabled={
                    !patient ||
                    !prescriptions?.[0] ||
                    hasStatus(patient?.status, PATIENT_STATUS.PHARMACY_COMPLETED)
                  }
                  onClick={async () => {
                    if (!prescriptions?.[0]?._id) return
                    const presId = prescriptions[0]._id
                    const pid = patient?.id || patient?._id || patient?.patientId
                    if (!pid) return

                    const tasks = [
                      updatePrescription(presId, { status: 'completed' }),
                      // ✅ Fixed — object instead of array
                      updatePatientStatus(pid, { status: PATIENT_STATUS.PHARMACY_COMPLETED })
                    ]

                    const promise = Promise.all(tasks)
                    toast.promise(promise, {
                      loading: 'Completing pharmacy...',
                      success: 'Pharmacy completed',
                      error: (err) => err?.response?.data?.message || 'Failed to complete pharmacy'
                    })
                    try {
                      const results = await promise
                      const presData = results[0]?.data ?? results[0]
                      setPrescriptions(prev => {
                        const updated = [...prev]
                        updated[0] = { ...updated[0], status: presData?.status ?? 'completed' }
                        return updated
                      })
                      setPatient(prev => ({ ...(prev || {}), status: PATIENT_STATUS.PHARMACY_COMPLETED }))
                    } catch (e) {
                      toast.error(e?.response?.data?.message || 'An error occurred while completing pharmacy')
                    }
                  }}
                >
                  Complete Pharmacy
                </button>

                {/* Send to Cashier */}
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={
                    !patient ||
                    hasStatus(patient?.status, PATIENT_STATUS.AWAITING_CASHIER)
                  }
                  onClick={async () => {
                    const pid = patient?.id || patient?._id || patient?.patientId
                    if (!pid) return
                    // ✅ Fixed — object instead of array, removed AWAITING_PAYMENT (use AWAITING_CASHIER)
                    const promise = updatePatientStatus(pid, { status: PATIENT_STATUS.AWAITING_CASHIER })
                    toast.promise(promise, {
                      loading: 'Sending to cashier...',
                      success: 'Patient sent to cashier',
                      error: (err) => err?.response?.data?.message || 'Failed to send to cashier'
                    })
                    try {
                      await promise
                      setPatient(prev => ({ ...(prev || {}), status: PATIENT_STATUS.AWAITING_CASHIER }))
                    } catch (e) {
                      toast.error(e?.response?.data?.message || 'An error occurred while sending to cashier')
                    }
                  }}
                >
                  Send to Cashier
                </button>

                {/* Discharge */}
                {prescriptions?.[0]?.status === 'completed' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={async () => {
                      const pid = patient?.id || patient?._id || patient?.patientId
                      if (!pid) return
                      // ✅ Fixed — object instead of array
                      const promise = updatePatientStatus(pid, { status: PATIENT_STATUS.DISCHARGED })
                      toast.promise(promise, {
                        loading: 'Discharging patient...',
                        success: 'Patient discharged',
                        error: (err) => err?.response?.data?.message || 'Failed to discharge'
                      })
                      try {
                        await promise
                        setPatient(prev => ({ ...(prev || {}), status: PATIENT_STATUS.DISCHARGED }))
                      } catch (e) {
                        toast.error(e?.response?.data?.message || 'An error occurred while discharging patient')
                      }
                    }}
                  >
                    Discharge
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {isSelectModalOpen && (
          <AddDrugModal
            setIsSelectModalOpen={setIsSelectModalOpen}
            prescriptionPatient={prescriptions?.[0]}
          />
        )}
      </div>
    </PharmacistLayout>
  )
}

export default IncomingDetails