import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getPrescriptionByPatientId, updatePrescription } from '@/services/api/prescriptionsAPI'
import { getPatientById, updatePatientStatus } from '@/services/api/patientsAPI'
import { updateDependantStatus } from '@/services/api/dependantAPI'
import { getInventories } from '@/services/api/inventoryAPI'
import { AddDrugModal, DispenseConfirmModal } from '@/components/modals'
import { hasStatus } from '@/utils/statusUtils'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import toast from 'react-hot-toast'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import SendPatientModal from '@/components/modals/SendPatientModal'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import dispensesAPI from '@/services/api/dispensesAPI'

const IncomingDetails = () => {
  const { patientId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const incomingDependantId = location?.state?.dependantId || null
  const incomingDependantSnapshot = location?.state?.dependantSnapshot || null
  const isViewingDependant = !!incomingDependantId
  const dependantId = location?.state?.dependantId || null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [prescriptions, setPrescriptions] = useState({ active: [], history: [] })
  const [patient, setPatient] = useState(null)
  const [inventory, setInventory] = useState([])
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
  const [dispenseModalRows, setDispenseModalRows] = useState(null)
  const [dispenseSubmitting, setDispenseSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [dependants, setDependants] = useState([])
  const currentUser = useAppSelector((state) => state.auth.user)

  const pharmacistId = currentUser?.id || currentUser?._id
  const pharmacistName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()

  useEffect(() => {
    let mounted = true

    const fetch = async () => {
      setLoading(true)
      setError(null)

      try {
        const invRes = await getInventories()
        if (mounted) setInventory(invRes?.data ?? [])

        const presRes = await getPrescriptionByPatientId(patientId)
        const presData = presRes?.data ?? presRes
        const list = Array.isArray(presData) ? presData : presData ? [presData] : []

        const filtered = isViewingDependant
          ? list.filter((p) => p.dependantId === incomingDependantId)
          : list.filter((p) => !p.dependantId)

        const active = filtered.filter((p) => String(p.status).toLowerCase() !== 'completed')
        const history = filtered
          .filter((p) => String(p.status).toLowerCase() === 'completed')
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

        if (mounted) setPrescriptions({ active, history })

        const pRes = await getPatientById(patientId)
        const pData = pRes?.data ?? pRes

        if (mounted) {
          setPatient(pData)
          setDependants(pData?.dependants || pData?.dependant || [])
        }
      } catch (err) {
        console.error(err)
        if (mounted) setError(err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetch()
    return () => { mounted = false }
  }, [patientId, incomingDependantId, isViewingDependant])

  const calculateQuantity = (med) => {
    const freqMap = {
      'once daily': 1,
      'twice daily': 2,
      'three times daily': 3,
      'four times daily': 4,
    }

    const frequencyText = (med.frequency || '').toLowerCase()
    let timesPerDay = freqMap[frequencyText]

    if (!timesPerDay) {
      const match = frequencyText.match(/\d+/)
      timesPerDay = match ? parseInt(match[0], 10) : 1
    }

    const daysMatch = (med.duration || '').match(/\d+/)
    const days = daysMatch ? parseInt(daysMatch[0], 10) : 1

    return timesPerDay * days
  }

  const renderMedications = (list = [], isHistory = false) => {
    if (!list.length) {
      return <div className="text-sm text-base-content/60">No data.</div>
    }

    const meds = list.flatMap((p) => {
      const isForDependant = !!p.dependantId
      const dependant = isForDependant
        ? dependants.find((d) => d.id === p.dependantId || d._id === p.dependantId)
        : null

      const forName = isForDependant
        ? dependant
          ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim()
          : 'Dependant'
        : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()

      return (p.medications || []).map((m) => {
        const inv = inventory.find((i) => i.name.toLowerCase() === m.drugName.toLowerCase())
        return {
          ...m,
          form: inv?.form,
          strength: inv?.strength,
          status: p.status,
          pharmacistName: p.pharmacistName,
          _id: p._id,
          createdAt: p.createdAt,
          updatedAt: p.updatedAt,
          isForDependant,
          dependantId: p.dependantId,
          patientId: p.patientId,
          forName,
        }
      })
    })

    return (
      <div className="space-y-3">
        {meds.map((m, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border ${isHistory ? 'bg-base-200 opacity-70' : 'bg-base-100'}`}
          >
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-base-200">
              <span className="font-medium text-sm">{m.forName || 'Unknown'}</span>
              {m.isForDependant ? (
                <span className="badge badge-secondary badge-sm font-medium">Dependant</span>
              ) : (
                <span className="badge badge-primary badge-sm font-medium">Main Patient</span>
              )}
            </div>

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
                {m.pharmacistName && (
                  <div className="text-xs text-base-content/70">Pharmacist: {m.pharmacistName}</div>
                )}
                <div className="text-xs text-base-content/60">
                  Created: {m.createdAt ? formatNigeriaDateTime(m.createdAt) : '—'}
                </div>
                {m.instructions && <div className="text-xs mt-1">Instruction: {m.instructions}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const buildDispenseRows = () => {
    return prescriptions.active.flatMap((p) => {
      const isForDependant = !!p.dependantId
      const dependant = isForDependant
        ? dependants.find((d) => d.id === p.dependantId || d._id === p.dependantId)
        : null

      const forName = isForDependant
        ? dependant
          ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim()
          : 'Dependant'
        : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()

      return (p.medications || []).map((m) => {
        const inv = inventory.find((i) => i.name.toLowerCase() === m.drugName.toLowerCase())

        return {
          key: `${p._id}-${m.drugName}`,
          prescriptionId: p._id,
          drugName: m.drugName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          forName,
          suggestedQty: calculateQuantity(m),
          formStrength: inv ? `${inv.form || ''} ${inv.strength ? '• ' + inv.strength : ''}`.trim() : '',
        }
      })
    })
  }

  const submitDispense = async (finalRows, action) => {
    setDispenseSubmitting(true)

    const activePrescriptions = prescriptions.active
    const pid = patient?.id || patient?._id || patient?.patientId
    const validRows = (finalRows || []).filter((row) => row && Number(row.quantity) > 0)

    if (!validRows.length) {
      toast.error('Please set a quantity before confirming dispense.')
      setDispenseSubmitting(false)
      return
    }

    const byPrescription = validRows.reduce((acc, row) => {
      if (!acc[row.prescriptionId]) acc[row.prescriptionId] = []
      acc[row.prescriptionId].push({
        drugName: row.drugName,
        quantity: Number(row.quantity) || 0,
      })
      return acc
    }, {})

    const dispenseCalls = Object.entries(byPrescription).map(([prescriptionId, items]) =>
      dispensesAPI.createDispense(prescriptionId, {
        items,
        pharmacistId,
        status: 'dispensed',
      })
    )

    const statusUpdate = action === 'sendToNurse'
      ? isViewingDependant
        ? updateDependantStatus(incomingDependantId, { status: PATIENT_STATUS.AWAITING_INJECTION })
        : updatePatientStatus(pid, { status: PATIENT_STATUS.AWAITING_INJECTION })
      : isViewingDependant
        ? updateDependantStatus(incomingDependantId, { status: PATIENT_STATUS.PHARMACY_COMPLETED })
        : updatePatientStatus(pid, { status: PATIENT_STATUS.PHARMACY_COMPLETED })

    const promise = Promise.all([
      ...activePrescriptions.map((p) =>
        updatePrescription(p._id, {
          status: 'completed',
          pharmacistId,
          pharmacistName,
        })
      ),
      statusUpdate,
      ...dispenseCalls,
    ])

    toast.promise(promise, {
      loading: action === 'sendToNurse' ? 'Dispensing & sending to nurse...' : 'Dispensing...',
      success: action === 'sendToNurse' ? 'Sent to nurse' : 'Completed',
      error: 'Failed — check stock levels',
    })

    try {
      await promise

      const invRes = await getInventories()
      setInventory(invRes?.data ?? [])

      setPrescriptions((prev) => {
        const updatedHistory = [
          ...activePrescriptions.map((p) => ({ ...p, status: 'completed', pharmacistId, pharmacistName })),
          ...prev.history,
        ]

        return { active: [], history: updatedHistory }
      })

      setPatient((prev) =>
        isViewingDependant
          ? prev
          : {
              ...(prev || {}),
              status: action === 'sendToNurse' ? PATIENT_STATUS.AWAITING_INJECTION : PATIENT_STATUS.PHARMACY_COMPLETED,
            }
      )

      setDispenseModalRows(null)
    } catch (err) {
      console.error('Dispense submission failed:', err)
    } finally {
      setDispenseSubmitting(false)
    }
  }

  const handleComplete = () => {
    if (!prescriptions.active.length) return
    setPendingAction('complete')
    setDispenseModalRows(buildDispenseRows())
  }

  const summarySubject = useMemo(() => {
    if (!isViewingDependant) {
      const guardian = patient || {}
      return {
        id: guardian.id,
        fullName: `${guardian.firstName || ''} ${guardian.lastName || ''}`.trim() || guardian.name || 'Unknown',
        gender: guardian.gender,
        phone: guardian.phone || guardian.phoneNumber,
        hospitalId: guardian.hospitalId,
        status: guardian.status,
        hmos: Array.isArray(guardian.hmos) ? guardian.hmos.filter((h) => !h.dependantId) : [],
        relationshipType: null,
      }
    }

    const dep = patient?.dependants?.find((d) => d.id === dependantId || d._id === dependantId) || incomingDependantSnapshot || {}
    const guardian = dep.patient || patient || {}
    const ownHmos = Array.isArray(guardian.hmos)
      ? guardian.hmos.filter((h) => h.dependantId === dep.id)
      : []

    return {
      id: dep.id || dependantId,
      fullName: `${dep.firstName || ''} ${dep.lastName || ''}`.trim() || dep.fullName || 'Dependant',
      gender: dep.gender || '—',
      phone: dep.phone || guardian.phone || guardian.phoneNumber,
      hospitalId: guardian.hospitalId,
      status: dep.status || incomingDependantSnapshot?.status || 'Unknown',
      hmos: ownHmos,
      relationshipType: dep.relationshipType,
    }
  }, [isViewingDependant, patient, incomingDependantSnapshot, dependantId])

  return (
    <PharmacistLayout>
      <div className="p-6">
        <div className="mb-4 justify-between">
          <div className="mb-4 flex justify-between">
            <h1 className="text-2xl font-semibold text-primary">Prescription Details</h1>
            <button className="btn btn-primary btn-sm" onClick={() => navigate(-1)}>
              Back To Incoming
            </button>
          </div>

          <PatientDetailsCard
            patientId={patientId}
            patient={patient}
            summarySubject={summarySubject}
            isViewingDependant={isViewingDependant}
          />

          {isViewingDependant && incomingDependantSnapshot && (
            <div className="text-sm text-base-content/70 mb-3">
              Viewing prescriptions for <strong>{`${incomingDependantSnapshot.firstName || ''} ${incomingDependantSnapshot.lastName || ''}`.trim()}</strong>
              {incomingDependantSnapshot.relationshipType ? ` (${incomingDependantSnapshot.relationshipType})` : ''}
              {' '}· dependant of <strong>{patient?.firstName} {patient?.lastName}</strong>
            </div>
          )}

          <div>
            <SendPatientModal
              patientId={patientId}
              patient={patient}
              defaultDependantId={dependantId}
              defaultDependantLabel={summarySubject?.fullName}
              lockSubject
              onUpdated={() => navigate('/dashboard/pharmacist/incoming')}
              allowedRoles={['nurse', 'labtechnician', 'pharmacist', 'cashier', 'hmo', 'doctor', 'medical-director']}
            />
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-base-100">
          {loading ? (
            <div className="h-20 bg-base-200 animate-pulse" />
          ) : error ? (
            <div className="text-error">Error loading</div>
          ) : (
            <>
              <h3 className="font-medium mb-3">Active</h3>
              {renderMedications(prescriptions.active)}

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
                    onClick={() => {
                      const activePrescriptions = prescriptions.active
                      if (!activePrescriptions.length) return

                      const pid = patient?.id || patient?._id || patient?.patientId
                      if (!pid) return

                      setPendingAction('sendToNurse')
                      setDispenseModalRows(buildDispenseRows())
                    }}
                  >
                    Complete & Send to Nurse
                  </button>
                </div>
              )}

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

        {dispenseModalRows && (
          <DispenseConfirmModal
            rows={dispenseModalRows}
            submitting={dispenseSubmitting}
            onCancel={() => setDispenseModalRows(null)}
            onConfirm={(finalRows) => submitDispense(finalRows, pendingAction)}
          />
        )}
      </div>
    </PharmacistLayout>
  )
}

export default IncomingDetails
