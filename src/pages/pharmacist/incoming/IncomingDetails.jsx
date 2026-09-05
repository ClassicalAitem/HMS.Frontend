import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { PharmacistLayout } from '@/layouts/pharmacist'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { getPrescriptionByPatientId, updatePrescription } from '@/services/api/prescriptionsAPI'
import { getPatientById, updatePatientStatus } from '@/services/api/patientsAPI'
import { getAllBillings } from '@/services/api/billingAPI'
import { updateDependantStatus } from '@/services/api/dependantAPI'
import { getInventories } from '@/services/api/inventoryAPI'
import { AddDrugModal, DispenseConfirmModal } from '@/components/modals'
import { PATIENT_STATUS } from '@/constants/patientStatus'
import toast from 'react-hot-toast'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import SendPatientModal from '@/components/modals/SendPatientModal'
import PatientDetailsCard from '@/components/common/PatientDetailsCard'
import KolakLoader from '@/components/common/KolakLoader'
import { useNotifications } from '@/contexts/NotificationContext'
import { calculatePrescriptionLine } from '@/utils/prescriptionsCalculator'
import dispensesAPI from '@/services/api/dispensesAPI'
import { usersAPI } from '@/services/api/usersAPI'
import { PRESCRIPTION_STATUS } from '@/constants/prescriptionStatus'

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
  const [prescriptions, setPrescriptions] = useState({ active: [], history: [], cancelled: [] })
  const [expandedIds, setExpandedIds] = useState(new Set())
  const [patient, setPatient] = useState(null)
  const [inventory, setInventory] = useState([])
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false)
  const [dispenseModalRows, setDispenseModalRows] = useState(null)
  const [dispenseSubmitting, setDispenseSubmitting] = useState(false)
  const [pendingAction, setPendingAction] = useState(null)
  const [doctors, setDoctors] = useState({}) 
  const [dependants, setDependants] = useState([])
  const [billings, setBillings] = useState([])
  const { refreshQueueCount } = useNotifications()
  const currentUser = useAppSelector((state) => state.auth.user)
  const isSuperAdmin = currentUser?.role === 'super-admin'

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

        const active = filtered.filter(
          (p) => ![PRESCRIPTION_STATUS.COMPLETED, PRESCRIPTION_STATUS.CANCELLED].includes(String(p.status).toLowerCase())
        )
        const history = filtered
          .filter((p) => String(p.status).toLowerCase() === PRESCRIPTION_STATUS.COMPLETED)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        const cancelled = filtered
          .filter((p) => String(p.status).toLowerCase() === PRESCRIPTION_STATUS.CANCELLED)
          .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

        if (mounted) setPrescriptions({ active, history, cancelled })

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
    return () => {
      mounted = false
    }
  }, [patientId, incomingDependantId, isViewingDependant])

  useEffect(() => {
    let mounted = true

    const loadBillings = async () => {
      if (!patientId || !patient?.hmos?.length) {
        setBillings([])
        return
      }

      try {
        const res = await getAllBillings({ patientId })
        const raw = res?.data?.data ?? res?.data ?? res ?? []
        const list = Array.isArray(raw) ? raw : []
        if (mounted) setBillings(list)
      } catch (err) {
        console.error('Failed to load billings for HMO status', err)
        if (mounted) setBillings([])
      }
    }

    loadBillings()
    return () => {
      mounted = false
    }
  }, [patientId, patient?.hmos])

  useEffect(() => {
  let mounted = true

  const loadDoctors = async () => {
    const allPrescriptions = [...prescriptions.active, ...prescriptions.history]
    const doctorIds = [...new Set(allPrescriptions.map((p) => p.doctorId).filter(Boolean))]
    const missingIds = doctorIds.filter((id) => !doctors[id])

    if (!missingIds.length) return

    try {
      const entries = await Promise.all(
        missingIds.map((id) =>
          usersAPI.getUserById(id)
            .then((res) => {
              const user = res?.data?.data ?? res?.data ?? res
              const name = user
                ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown Doctor'
                : 'Unknown Doctor'
              return [id, name]
            })
            .catch(() => [id, 'Unknown Doctor'])
        )
      )
      if (mounted) {
        setDoctors((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
      }
    } catch (err) {
      console.error('Failed to load doctor names', err)
    }
  }

  loadDoctors()
  return () => {
    mounted = false
  }
}, [prescriptions])

const formatQty = (n) => {
  const num = Number(n) || 0
  return Number.isInteger(num) ? num : num.toFixed(2)
}

  const findInventoryMatch = (med) => {
    const medicationName = String(med.drugName || '').toLowerCase()
    return inventory.find(
      (item) =>
        (item._id || item.id) === med.inventoryId ||
        String(item.name || '').toLowerCase() === medicationName
    )
  }

const getDispenseInfo = (med) => {
  const inv = findInventoryMatch(med)
  if (!inv) return { inv: null, quantity: 0, unit: null, convertible: true, prescribedQty: 0, bottlesNeeded: null }

  const line = calculatePrescriptionLine({
    medicationType: med.medicationType,
    dosageAmount: med.dosageAmount,
    dosageUnit: med.dosageUnit,
    frequency: med.frequency,
    duration: med.duration,
    inventory: inv,
  })

  const suppressUnit = med.medicationType === 'tablet' || med.medicationType === 'cream'

  return {
    inv,
    quantity: line.convertible === false ? 0 : (line.billedQuantity ?? 0),
    unit: suppressUnit ? null : line.unit,
    convertible: line.convertible !== false,
    prescribedQty: line.convertible === false ? 0 : (line.prescribedQuantity ?? 0),
    bottlesNeeded: line.bottlesNeeded ?? null,
  }
}

  // Determine stock & billing availability state
  const getDrugAvailabilityStatus = (med, dispenseInfo) => {
  const unitSuffix = dispenseInfo.unit ? ` ${dispenseInfo.unit}` : ''

  // 1. Not Stocked by Hospital (Explicitly set unavailable or missing inventory ID)
  if (med.availability === 'unavailable' || !med.inventoryId) {
    return {
      label: 'Not Stocked by Hospital',
      badgeClass: 'badge-warning',
      inStock: false,
      isBilled: false,
      stockQty: 0,
    }
  }

  const { inv, quantity, convertible } = dispenseInfo

  if (!convertible) {
    return {
      label: 'Cannot determine quantity — check dosage unit',
      badgeClass: 'badge-error',
      inStock: false,
      stockQty: 0,
      isBilled: false,
    }
  }

  const stockQty = Number(inv?.stock ?? 0)

  // 2. Out of Stock (Hospital stocks it, but available quantity is 0 or less than prescribed quantity)
  if (!inv || stockQty < quantity) {
    return {
      label: stockQty === 0
        ? `Out of Stock (0${unitSuffix} Left)`
        : `Insufficient Stock (${formatQty(stockQty)}${unitSuffix} Left)`,
      badgeClass: 'badge-error',
      inStock: false,
      stockQty,
      isBilled: false,
    }
  }

  // 3. In Stock (Sufficient stock available)
  return {
    label: `In Stock (${formatQty(stockQty)}${unitSuffix} Available)`,
    badgeClass: 'badge-success',
    inStock: true,
    stockQty,
    isBilled: true,
  }
}

  const getHmoStatusForMed = (prescriptionId, drugName) => {
    if (!billings.length) return null

    for (const bill of billings) {
      const matchesSubject = isViewingDependant
        ? bill.dependantId === incomingDependantId
        : !bill.dependantId
      if (!matchesSubject) continue

      const match = (bill.itemDetails || []).find(
        (item) =>
          item.prescriptionId === prescriptionId &&
          String(item.description || '')
            .toLowerCase()
            .includes(String(drugName || '').toLowerCase())
      )
      if (match) return match.hmoStatus || 'pending'
    }

    return null
  }

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const renderMedCard = (m, isHistory = false) => (
    <div
      key={`${m._id || m.drugName}-${m.drugName}`}
      className={`p-3 rounded-lg border ${isHistory ? 'bg-base-200 opacity-70' : 'bg-base-100'}`}
    >
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-base-200">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`badge badge-sm font-medium ${m.availabilityInfo.badgeClass}`}>
            {m.availabilityInfo.label}
          </span>
          {m.hmoStatus === 'approved' && (
            <span className="badge badge-sm badge-success font-medium">HMO: Covered</span>
          )}
          {m.hmoStatus === 'partial' && (
            <span className="badge badge-sm badge-warning font-medium">HMO: Partial</span>
          )}
          {m.hmoStatus === 'rejected' && (
            <span className="badge badge-sm badge-error font-medium">HMO: Not Covered</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <div>
          <div className="font-semibold text-base">{m.drugName}</div>
          <div className="text-sm text-base-content/70">
            {m.form || ''} {m.strength ? `• ${m.strength}` : ''}
          </div>
          <div className="text-sm mt-1">Dosage: {m.dosage}</div>
          <div className="text-sm">Frequency: {m.frequency}</div>
          <div className="text-sm">Duration: {m.duration}</div>
          <div className="text-sm font-medium text-primary mt-1">
            <div className="text-sm font-medium text-primary mt-1">
              Prescribed: {formatQty(m.prescribedQty)}{m.suggestedUnit ? ` ${m.suggestedUnit}` : ' unit(s)'}
            </div>
            {m.bottlesNeeded ? (
              <div className="text-sm font-medium text-primary">
                Billed: {m.bottlesNeeded} bottle{m.bottlesNeeded > 1 ? 's' : ''} ({m.suggestedQty}{m.suggestedUnit ? ` ${m.suggestedUnit}` : ''})
              </div>
            ) : null}
          </div>
        </div>
        <div className="text-sm sm:text-right space-y-1">
          {m.instructions && (
            <div className="text-xs mt-1 bg-base-200 p-1.5 rounded">
              Instruction: {m.instructions}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const computeMedRows = (p) => {
    const isForDependant = !!p.dependantId
    const dependant = isForDependant
      ? dependants.find((d) => d.id === p.dependantId || d._id === p.dependantId)
      : null

    const forName = isForDependant
      ? dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() : 'Dependant'
      : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()

    return (p.medications || []).map((m) => {
      const dispenseInfo = getDispenseInfo(m)
      const availabilityInfo = getDrugAvailabilityStatus(m, dispenseInfo)
      const hmoStatus = getHmoStatusForMed(p._id, m.drugName)

      return {
        ...m,
        form: dispenseInfo.inv?.form,
        strength: dispenseInfo.inv?.strength,
        status: p.status,
        pharmacistName: p.pharmacistName,
        doctorName: doctors[p.doctorId] || null,
        _id: p._id,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        isForDependant,
        dependantId: p.dependantId,
        patientId: p.patientId,
        forName,
        suggestedQty: dispenseInfo.quantity,
        suggestedUnit: dispenseInfo.unit,
        prescribedQty: dispenseInfo.prescribedQty,
        bottlesNeeded: dispenseInfo.bottlesNeeded,
        availabilityInfo,
        hmoStatus,
      }
    })
  }

  const buildDispenseRowsForPrescriptions = (list = []) => {
    return list.flatMap((p) => {
      const isForDependant = !!p.dependantId
      const dependant = isForDependant
        ? dependants.find((d) => d.id === p.dependantId || d._id === p.dependantId)
        : null

      const forName = isForDependant
        ? dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() : 'Dependant'
        : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()

      return (p.medications || []).map((m) => {
        const dispenseInfo = getDispenseInfo(m)
        const availabilityInfo = getDrugAvailabilityStatus(m, dispenseInfo)
        const hmoStatus = getHmoStatusForMed(p._id, m.drugName)

        return {
          key: `${p._id}-${m.drugName}`,
          prescriptionId: p._id,
          inventoryId: m.inventoryId || dispenseInfo.inv?._id || dispenseInfo.inv?.id,
          drugName: m.drugName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          forName,
          doctorName: doctors[p.doctorId] || null,
          suggestedQty: dispenseInfo.quantity,
          suggestedUnit: dispenseInfo.unit,
          prescribedQty: dispenseInfo.prescribedQty,
          bottlesNeeded: dispenseInfo.bottlesNeeded,
          formStrength: dispenseInfo.inv ? `${dispenseInfo.inv.form || ''} ${dispenseInfo.inv.strength ? '• ' + dispenseInfo.inv.strength : ''}`.trim() : '',
          availabilityInfo,
          hmoStatus,
        }
      })
    })
  }

  const handlePrescriptionAction = (p) => {
    setPendingAction({ prescriptionIds: [p._id] })
    setDispenseModalRows(buildDispenseRowsForPrescriptions([p]))
  }

  const handleCancelPrescription = async (p) => {
    if (!window.confirm('Cancel this prescription? This cannot be undone.')) return

    const promise = updatePrescription(p._id, {
      status: PRESCRIPTION_STATUS.CANCELLED,
      pharmacistId,
      pharmacistName,
    })

    toast.promise(promise, {
      loading: 'Cancelling prescription...',
      success: 'Prescription cancelled',
      error: 'Failed to cancel prescription',
    })

    try {
      await promise
      setPrescriptions((prev) => {
        const stillActive = prev.active.filter((item) => item._id !== p._id)
        const cancelledEntry = { ...p, status: PRESCRIPTION_STATUS.CANCELLED, pharmacistId, pharmacistName }
        return { ...prev, active: stillActive, cancelled: [cancelledEntry, ...prev.cancelled] }
      })
    } catch (err) {
      console.error('Cancel failed:', err)
    }
  }

  const submitDispense = async (finalRows, pendingActionValue) => {
    const { prescriptionIds } = pendingActionValue || {}
    setDispenseSubmitting(true)

    const targetPrescriptions = prescriptions.active.filter((p) => prescriptionIds.includes(p._id))
    const pid = patient?.id || patient?._id || patient?.patientId

    const unavailableRows = (finalRows || []).filter((row) => !row?.availabilityInfo?.inStock)
    unavailableRows.forEach((row) => {
      const requestedQty = Number(row.suggestedQty) || 0
      const stockQty = Number(row.availabilityInfo?.stockQty) || 0
      const shortage = Math.max(requestedQty - stockQty, 0)

      if (row.availabilityInfo?.label === 'Not Stocked by Hospital') {
        toast.error(`${row.drugName} is not available in the hospital inventory.`)
      } else if (shortage > 0) {
        toast.error(`Insufficient stock for ${row.drugName}, short by ${shortage} unit(s).`)
      }
    })

    const dispensableRows = (finalRows || []).filter(
      (row) => row?.availabilityInfo?.inStock && Number(row.suggestedQty) > 0
    )

    if (dispensableRows.length === 0) {
      toast.error('No items available to dispense. Please check stock levels.')
      setDispenseSubmitting(false)
      return
    }

    const byPrescription = dispensableRows.reduce((acc, row) => {
      if (!acc[row.prescriptionId]) acc[row.prescriptionId] = []
      acc[row.prescriptionId].push({
        inventoryId: row.inventoryId,
        drugName: row.drugName,
        quantity: Number(row.suggestedQty) || 0,
      })
      return acc
    }, {})

    const isPrescriptionFullyFulfilled = (prescription) => {
      const meds = prescription.medications || []
      return meds.every((m) =>
        dispensableRows.some(
          (r) =>
            r.prescriptionId === prescription._id &&
            r.drugName?.toLowerCase() === m.drugName?.toLowerCase()
        )
      )
    }

    const allFulfilled = targetPrescriptions.every(isPrescriptionFullyFulfilled)

    const hasInjection = targetPrescriptions.some((p) =>
      (p.medications || []).some((m) => m.medicationType === 'injection')
    )

    try {
      const dispenseCalls = Object.entries(byPrescription).map(([prescriptionId, items]) =>
        dispensesAPI.createDispense(prescriptionId, {
          items,
          pharmacistId,
          pharmacistName,
          status: PRESCRIPTION_STATUS.DISPENSED,
        })
      )

      await toast.promise(Promise.all(dispenseCalls), {
        loading: 'Dispensing medication...',
        success: 'Medication dispensed successfully',
        error: (err) => err?.response?.data?.message || err?.message || 'Failed to dispense',
      })

      if (allFulfilled) {
        if (hasInjection) {
          if (isViewingDependant) {
            await updateDependantStatus(incomingDependantId, { status: PATIENT_STATUS.AWAITING_INJECTION })
          } else {
            await updatePatientStatus(pid, { status: PATIENT_STATUS.AWAITING_INJECTION })
          }
          toast.success('Sent to nurse for injection')
        } else {
          if (isViewingDependant) {
            await updateDependantStatus(incomingDependantId, { status: PATIENT_STATUS.PHARMACY_COMPLETED })
          } else {
            await updatePatientStatus(pid, { status: PATIENT_STATUS.PHARMACY_COMPLETED })
          }
        }
      } else {
        toast('Prescription partially dispensed. Remaining items kept in queue.', { icon: 'ℹ️' })
      }

      const invRes = await getInventories()
      setInventory(invRes?.data ?? [])

      const presRes = await getPrescriptionByPatientId(patientId)
      const presData = presRes?.data ?? presRes
      const list = Array.isArray(presData) ? presData : presData ? [presData] : []

      const filtered = isViewingDependant
        ? list.filter((p) => p.dependantId === incomingDependantId)
        : list.filter((p) => !p.dependantId)

      const active = filtered.filter(
        (p) => ![PRESCRIPTION_STATUS.COMPLETED, PRESCRIPTION_STATUS.CANCELLED].includes(String(p.status).toLowerCase())
      )
      const history = filtered
        .filter((p) => String(p.status).toLowerCase() === PRESCRIPTION_STATUS.COMPLETED)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      const cancelled = filtered
        .filter((p) => String(p.status).toLowerCase() === PRESCRIPTION_STATUS.CANCELLED)
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))

      setPrescriptions({ active, history, cancelled })

      setPatient((prev) =>
        isViewingDependant
          ? prev
          : {
              ...(prev || {}),
              status: allFulfilled
                ? (hasInjection ? PATIENT_STATUS.AWAITING_INJECTION : PATIENT_STATUS.PHARMACY_COMPLETED)
                : prev?.status,
            }
      )

      setDispenseModalRows(null)
    } catch (err) {
      console.error('Submission failed:', err)
    } finally {
      setDispenseSubmitting(false)
    }
  }

  const renderPrescriptionCard = (p, isHistory = false) => {
    const isForDependant = !!p.dependantId
    const dependant = isForDependant
      ? dependants.find((d) => d.id === p.dependantId || d._id === p.dependantId)
      : null
    const forName = isForDependant
      ? dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() : 'Dependant'
      : `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()
    const medRows = computeMedRows(p)
    const isOpen = isHistory || expandedIds.has(p._id)

    return (
      <div key={p._id} className="border border-base-300 rounded-lg mb-3 overflow-hidden">
        <button
          type="button"
          onClick={() => !isHistory && toggleExpand(p._id)}
          className={`w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 text-left ${isHistory ? 'bg-base-200 opacity-70 cursor-default' : 'bg-base-100 hover:bg-base-200'}`}
        >
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm">{forName || 'Unknown'}</span>
              <span className={`badge badge-sm ${isForDependant ? 'badge-secondary' : 'badge-primary'} font-medium`}>
                {isForDependant ? 'Dependant' : 'Main Patient'}
              </span>
              <span className="capitalize badge badge-sm badge-ghost font-medium">{p.status}</span>
            </div>
            <div className="text-xs text-base-content/60">
              {p.createdAt ? formatNigeriaDateTime(p.createdAt) : '—'}
              {doctors[p.doctorId] && <> · Dr. {doctors[p.doctorId]}</>}
              {p.pharmacistName && <> · Pharmacist: {p.pharmacistName}</>}
              {' · '}{(p.medications || []).length} drug{(p.medications || []).length === 1 ? '' : 's'}
            </div>
          </div>
          {!isHistory && (
            <span className="text-xs text-base-content/50">{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
          )}
        </button>

        {isOpen && (
          <div className="p-3 space-y-3 border-t border-base-200">
            {medRows.map((m) => renderMedCard(m, isHistory))}

            {!isHistory && (
              <div className="flex flex-col gap-2 sm:flex-row pt-2">
                <button
                  className="btn btn-primary btn-sm"
                  disabled={dispenseSubmitting}
                  onClick={() => handlePrescriptionAction(p)}
                >
                  Dispense
                </button>
                <button
                  className="btn btn-outline btn-error btn-sm"
                  disabled={dispenseSubmitting}
                  onClick={() => handleCancelPrescription(p)}
                >
                  Cancel Prescription
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
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
        statusSenderName: guardian.statusSenderName,
        statusUser: guardian.statusUser,
        updatedAt: guardian.updatedAt,
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
      statusSenderName: dep.statusSenderName || incomingDependantSnapshot?.statusSenderName,
      statusUser: dep.statusUser || incomingDependantSnapshot?.statusUser,
      updatedAt: dep.updatedAt || incomingDependantSnapshot?.updatedAt,
      hmos: ownHmos,
      relationshipType: dep.relationshipType,
    }
  }, [isViewingDependant, patient, incomingDependantSnapshot, dependantId])

  return (
    <PharmacistLayout>
      {loading && <KolakLoader fullscreen />}

      <div className="p-0 sm:p-2 lg:p-6">
        <div className="mb-4 justify-between">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold text-primary">Prescription Details</h1>
            <button className="btn btn-primary btn-sm w-fit" onClick={() => navigate(-1)}>
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
              onUpdated={() => {
                refreshQueueCount()
                navigate('/dashboard/pharmacist/incoming')
              }}
              allowedRoles={['nurse', 'labtechnician', 'pharmacist', 'cashier', 'hmo', 'doctor', 'medical-director']}
            />
          </div>
        </div>

        <div className="p-6 border rounded-xl bg-base-100">
          {loading ? (
            <div className="h-20 bg-base-200 animate-pulse" />
          ) : error ? (
            <div className="text-error">Error loading prescriptions</div>
          ) : (
            <>
              <h3 className="font-medium mb-3">Active Prescriptions</h3>
              {prescriptions.active.length ? (
                prescriptions.active.map((p) => renderPrescriptionCard(p, false))
              ) : (
                <div className="text-sm text-base-content/60">No data.</div>
              )}

              <h3 className="font-medium mt-6 mb-3">History</h3>
              {prescriptions.history.length ? (
                prescriptions.history.map((p) => renderPrescriptionCard(p, true))
              ) : (
                <div className="text-sm text-base-content/60">No data.</div>
              )}

              <h3 className="font-medium mt-6 mb-3">Cancelled</h3>
              {prescriptions.cancelled.length ? (
                prescriptions.cancelled.map((p) => renderPrescriptionCard(p, true))
              ) : (
                <div className="text-sm text-base-content/60">No data.</div>
              )}
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
            isSuperAdmin={isSuperAdmin}
            onCancel={() => setDispenseModalRows(null)}
            onConfirm={(finalRows) => submitDispense(finalRows, pendingAction)}
          />
        )}
      </div>
    </PharmacistLayout>
  )
}

export default IncomingDetails