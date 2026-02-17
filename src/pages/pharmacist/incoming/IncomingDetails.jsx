import React, { useEffect, useState } from 'react'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useParams, useNavigate } from 'react-router-dom'
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI'
import { getPatientById } from '@/services/api/patientsAPI'
import { updatePatientStatus } from '@/services/api/patientsAPI'
import { updatePrescription } from '@/services/api/prescriptionsAPI'
import { AddDrugModal } from '@/components/modals'
import toast from 'react-hot-toast'

const IncomingDetails = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prescription, setPrescription] = useState(null)
  const [patient, setPatient] = useState(null)
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)

  useEffect(() => {
    let mounted = true
    const fetch = async () => {
      setLoading(true)
      setError(null)
      try {
        // fetch prescription by patient id
        const presRes = await getPrescriptionByPatientId(patientId)
        const presData = presRes?.data ?? presRes
        console.log("Prescription Data:", presData);
        const oralMedication = presData.medications?.filter(med => med.medicationType === 'oral') || [];
        presData.medications = oralMedication; // Keep only oral medications
        if (mounted) setPrescription(presData)

        // fetch patient snapshot for extra info
        try {
          const pRes = await getPatientById(patientId)
          const pData = pRes?.data ?? pRes
          if (mounted) setPatient(pData)
        } catch (e) {
          // patient fetch optional
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

  console.log('Prescription:', prescription)

  const renderMedications = () => {
    if (!prescription?.medications || !prescription.medications.length) return <div className="text-sm text-base-content/60">No medications found.</div>
    return (
      <div className="space-y-3">
        {prescription.medications.map((m, idx) => (
          <div key={idx} className="p-4 rounded-lg border bg-base-100">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{m.drugName}</div>
                <div className="text-sm text-base-content/70">Drug Code: {m.drugCode || '—'}</div>
                <div className="text-sm text-base-content/70">Dosage: {m.dosage ? `${m.dosage}` : ''}</div>
              </div>
              <div className="text-sm text-base-content/70">
                <div>Status: {prescription.status}</div>
                <div>Freq: {m.frequency || '—'}</div>
                <div>Duration: {m.duration || '—'}</div>

              </div>
            </div>
            {m.instructions && <div className="mt-2 text-sm text-base-content/70">Instructions: {m.instructions}</div>}
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
            <p className="text-sm text-base-content/70">Details for patient: {patient?.firstName ? `${patient.firstName} ${patient.lastName || ''}` : patientId}</p>
          </div>
          <div>
            <button className="btn btn-ghost btn-sm mr-2" onClick={() => navigate(-1)}>Back</button>
          </div>
        </div>

        <div className="rounded-xl bg-base-100 border border-base-300 p-6">
          {loading ? (
            <div className="animate-pulse h-24 w-full bg-base-200 rounded" />
          ) : error ? (
            <div className="text-sm text-error">Failed to load prescription data.</div>
          ) : (
            <>
              <div className="mb-4">
                <div className="text-sm text-base-content/70">Status: <span className="font-medium">{prescription?.status || '—'}</span></div>
                <div className="text-sm text-base-content/70">Created: {prescription?.createdAt ? new Date(prescription.createdAt).toLocaleString() : '—'}</div>
              </div>

              <h3 className="text-lg font-medium mb-3">Medications</h3>
              {renderMedications()}
              <div className="mt-6 flex flex-wrap gap-3">
                {/* Mark prescription completed (only affects the prescription resource) */}
                <button
                  className="btn btn-outline btn-sm"
                  disabled={!prescription || prescription.status === 'completed'}
                  onClick={async () => {
                    if (!prescription?._id) return
                    const id = prescription._id
                    const promise = updatePrescription(id, { status: 'completed' })
                    toast.promise(promise, {
                      loading: 'Marking prescription completed...',
                      success: 'Prescription marked completed',
                      error: (err) => err?.response?.data?.message || 'Failed to update prescription'
                    })
                    try {
                      const res = await promise
                      const data = res?.data ?? res
                      setPrescription((prev) => ({ ...(prev || {}), status: data?.status ?? 'completed' }))
                    } catch (e) {
                      // handled by toast
                    }
                  }}
                >
                  Mark Prescription Completed
                </button>
                {prescription?.medications?.length > 0 && (
                  <button
                  className="btn btn-warning btn-sm" onClick={() => setIsSelectModalOpen(true)}
                >
                  Dispense Drug
                </button>
                )}


                {/* Complete Pharmacy: mark prescription completed and update patient status */}
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!patient || !prescription || patient?.status === 'pharmacy_completed'}
                  onClick={async () => {
                    if (!prescription?._id) return
                    const presId = prescription._id
                    const tasks = [updatePrescription(presId, { status: 'completed' })]
                    // also update patient status
                    if (patient?.id || patient?._id) {
                      const pid = patient.id || patient._id || patient.patientId
                      tasks.push(updatePatientStatus(pid, 'pharmacy_completed'))
                    }
                    const promise = Promise.all(tasks)
                    toast.promise(promise, {
                      loading: 'Completing pharmacy...',
                      success: 'Pharmacy completed',
                      error: (err) => err?.response?.data?.message || 'Failed to complete pharmacy'
                    })
                    try {
                      const results = await promise
                      // update local state
                      const presRes = results[0]
                      const presData = presRes?.data ?? presRes
                      setPrescription((prev) => ({ ...(prev || {}), status: presData?.status ?? 'completed' }))
                      // update patient state
                      setPatient((prev) => ({ ...(prev || {}), status: 'pharmacy_completed' }))
                    } catch (e) {
                      // handled by toast
                    }
                  }}
                >
                  Complete Pharmacy
                </button>

                {/* Send to cashier: update patient status to awaiting_payment */}
                <button
                  className="btn btn-ghost btn-sm"
                  disabled={!patient || patient?.status === 'awaiting_payment'}
                  onClick={async () => {
                    if (!patient?.id && !patient?._id && !patient?.patientId) return
                    const pid = patient.id || patient._id || patient.patientId
                    const promise = updatePatientStatus(pid, 'awaiting_payment')
                    toast.promise(promise, {
                      loading: 'Sending to cashier...',
                      success: 'Patient sent to cashier',
                      error: (err) => err?.response?.data?.message || 'Failed to send to cashier'
                    })
                    try {
                      await promise
                      setPatient((prev) => ({ ...(prev || {}), status: 'awaiting_payment' }))
                    } catch (e) {}
                  }}
                >
                  Send to Cashier
                </button>

                {/* Discharge: shown only when prescription status is completed */}
                {prescription?.status === 'completed' && (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={async () => {
                      if (!patient?.id && !patient?._id && !patient?.patientId) return
                      const pid = patient.id || patient._id || patient.patientId
                      const promise = updatePatientStatus(pid, 'discharged')
                      toast.promise(promise, {
                        loading: 'Discharging patient...',
                        success: 'Patient discharged',
                        error: (err) => err?.response?.data?.message || 'Failed to discharge'
                      })
                      try {
                        await promise
                        setPatient((prev) => ({ ...(prev || {}), status: 'discharged' }))
                      } catch (e) {}
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
            prescriptionPatient={prescription}
          />
        )}
      </div>
    </PharmacistLayout>
  )
}

export default IncomingDetails
