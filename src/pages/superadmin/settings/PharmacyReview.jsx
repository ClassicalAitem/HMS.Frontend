import React, { useEffect, useMemo, useState } from 'react'
import { useAppSelector } from '@/store/hooks'
import { SuperAdminLayout } from '@/layouts/superadmin'
import { getPatients, getPatientById } from '@/services/api/patientsAPI'
import { getDependants } from '@/services/api/dependantAPI'
import { getPrescriptionByPatientId, updatePrescription } from '@/services/api/prescriptionsAPI'
import { getInventories } from '@/services/api/inventoryAPI'
import { getAllBillings } from '@/services/api/billingAPI'
import dispensesAPI from '@/services/api/dispensesAPI'
import { calculateDispenseQuantity } from '@/utils/prescriptionsCalculator'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'
import { DispenseConfirmModal } from '@/components/modals'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/utils/errorHandler'

const PharmacyReview = () => {
  const currentUser = useAppSelector((state) => state.auth.user)
  const superAdminId = currentUser?.id || currentUser?._id
  const superAdminName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim()

  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState([])
  const [search, setSearch] = useState('')

  const [selected, setSelected] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [prescriptions, setPrescriptions] = useState([])
  const [inventory, setInventory] = useState([])
  const [billings, setBillings] = useState([])

  const [dispenseModalRows, setDispenseModalRows] = useState(null)
  const [dispenseSubmitting, setDispenseSubmitting] = useState(false)

  // Step 1 — find every patient/dependant that has at least one HMO-rejected
  // prescription line item still sitting in their billing records.
  useEffect(() => {
    let mounted = true
    const loadCandidates = async () => {
      setLoading(true)
      try {
        const [patientsRes, dependantsRes, billingsRes] = await Promise.allSettled([
          getPatients(),
          getDependants(),
          getAllBillings(),
        ])

        const patients = patientsRes.status === 'fulfilled'
          ? (Array.isArray(patientsRes.value?.data) ? patientsRes.value.data : [])
          : []

        const dependants = dependantsRes.status === 'fulfilled'
          ? (() => {
              const raw = dependantsRes.value?.data?.data ?? dependantsRes.value?.data ?? []
              return Array.isArray(raw) ? raw : (raw?.dependants ?? [])
            })()
          : []

        const rawBillings = billingsRes.status === 'fulfilled'
          ? (billingsRes.value?.data?.data ?? billingsRes.value?.data ?? [])
          : []
        const allBillings = Array.isArray(rawBillings) ? rawBillings : []

        // Tally HMO-rejected prescription items per patient / dependant.
        const rejectedByKey = {}
        allBillings.forEach((bill) => {
          const items = bill.itemDetails || []
          const rejectedItems = items.filter(
            (item) => item.hmoStatus === 'rejected' && item.prescriptionId
          )
          if (!rejectedItems.length) return

          const key = bill.dependantId ? `dep-${bill.dependantId}` : `pat-${bill.patientId}`
          rejectedByKey[key] = (rejectedByKey[key] || 0) + rejectedItems.length
        })

        const patientMap = new Map(patients.map((p) => [p.id || p._id, p]))

        const patientCandidates = patients
          .filter((p) => rejectedByKey[`pat-${p.id || p._id}`])
          .map((p) => ({
            type: 'patient',
            patientId: p.id || p._id,
            dependantId: null,
            name: `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Unknown',
            hospitalId: p.hospitalId || '—',
            rejectedCount: rejectedByKey[`pat-${p.id || p._id}`],
          }))

        const dependantCandidates = dependants
          .filter((d) => rejectedByKey[`dep-${d.id}`])
          .map((d) => {
            const parent = patientMap.get(d.patientId)
            return {
              type: 'dependant',
              patientId: d.patientId,
              dependantId: d.id,
              name: `${d.firstName || ''} ${d.lastName || ''}`.trim() || 'Dependant',
              hospitalId: parent?.hospitalId || '—',
              relationshipType: d.relationshipType,
              rejectedCount: rejectedByKey[`dep-${d.id}`],
            }
          })

        if (mounted) setCandidates([...patientCandidates, ...dependantCandidates])
      } catch (err) {
        toast.error(getErrorMessage(err, 'Failed to load pharmacy review list'))
      } finally {
        if (mounted) setLoading(false)
      }
    }
    loadCandidates()
    return () => { mounted = false }
  }, [])

  const filteredCandidates = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return candidates
    return candidates.filter((c) =>
      [c.name, c.hospitalId].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [candidates, search])

  // Step 2 — load full prescription/inventory/billing detail for whichever
  // patient or dependant was selected from the left-hand list.
  const loadDetail = async (candidate) => {
    setSelected(candidate)
    setDetailLoading(true)
    setPrescriptions([])
    setBillings([])
    try {
      const [presRes, invRes, billRes] = await Promise.allSettled([
        getPrescriptionByPatientId(candidate.patientId),
        getInventories(),
        getAllBillings({ patientId: candidate.patientId }),
      ])

      const presData = presRes.status === 'fulfilled' ? (presRes.value?.data ?? presRes.value) : []
      const presList = Array.isArray(presData) ? presData : presData ? [presData] : []
      const scopedPres = candidate.dependantId
        ? presList.filter((p) => p.dependantId === candidate.dependantId)
        : presList.filter((p) => !p.dependantId)
      const activePres = scopedPres.filter((p) => String(p.status).toLowerCase() !== 'completed')
      setPrescriptions(activePres)

      setInventory(invRes.status === 'fulfilled' ? (invRes.value?.data ?? []) : [])

      const rawBillings = billRes.status === 'fulfilled'
        ? (billRes.value?.data?.data ?? billRes.value?.data ?? [])
        : []
      setBillings(Array.isArray(rawBillings) ? rawBillings : [])
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load patient detail'))
    } finally {
      setDetailLoading(false)
    }
  }

  const calculateQuantity = (med) => calculateDispenseQuantity(med.frequency, med.duration)

  const getDrugAvailabilityStatus = (med, suggestedQty) => {
    if (med.availability === 'unavailable' || !med.inventoryId) {
      return { label: 'Not Stocked by Hospital', badgeClass: 'badge-warning', inStock: false, stockQty: 0 }
    }
    const inv = inventory.find(
      (i) => (i._id || i.id) === med.inventoryId || i.name.toLowerCase() === med.drugName.toLowerCase()
    )
    const stockQty = Number(inv?.stock ?? inv?.quantity ?? inv?.stockQuantity ?? 0)
    if (!inv || stockQty < suggestedQty) {
      return {
        label: stockQty === 0 ? 'Out of Stock (0 Left)' : `Insufficient Stock (${stockQty} Left)`,
        badgeClass: 'badge-error',
        inStock: false,
        stockQty,
      }
    }
    return { label: `In Stock (${stockQty} Available)`, badgeClass: 'badge-success', inStock: true, stockQty }
  }

  // Same matching approach used on the pharmacist page: prescriptionId + a
  // drug-name substring check against the bill item's description.
  const getHmoStatusForMed = (prescriptionId, drugName) => {
    if (!billings.length) return null
    for (const bill of billings) {
      const matchesSubject = selected?.dependantId
        ? bill.dependantId === selected.dependantId
        : !bill.dependantId
      if (!matchesSubject) continue

      const items = bill.itemDetails || []
      const match = items.find(
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

  const buildDispenseRows = () =>
    prescriptions.flatMap((p) =>
      (p.medications || []).map((m) => {
        const inv = inventory.find(
          (i) => (i._id || i.id) === m.inventoryId || i.name.toLowerCase() === m.drugName.toLowerCase()
        )
        const suggestedQty = calculateQuantity(m)
        const availabilityInfo = getDrugAvailabilityStatus(m, suggestedQty)
        const hmoStatus = getHmoStatusForMed(p._id, m.drugName)

        return {
          key: `${p._id}-${m.drugName}`,
          prescriptionId: p._id,
          drugName: m.drugName,
          dosage: m.dosage,
          frequency: m.frequency,
          duration: m.duration,
          forName: selected?.name,
          suggestedQty,
          formStrength: inv ? `${inv.form || ''} ${inv.strength ? '• ' + inv.strength : ''}`.trim() : '',
          availabilityInfo,
          hmoStatus,
        }
      })
    )

  const openDispenseModal = () => {
    if (!prescriptions.length) return
    setDispenseModalRows(buildDispenseRows())
  }

  const submitDispense = async (finalRows) => {
    setDispenseSubmitting(true)
    try {
      const dispensableRows = finalRows.filter((row) => Number(row.suggestedQty) > 0)

      const byPrescription = dispensableRows.reduce((acc, row) => {
        if (!acc[row.prescriptionId]) acc[row.prescriptionId] = []
        acc[row.prescriptionId].push({
          drugName: row.drugName,
          quantity: Number(row.suggestedQty) || 0,
        })
        return acc
      }, {})

      const dispenseCalls = Object.entries(byPrescription).map(([prescriptionId, items]) =>
        dispensesAPI.createDispense(prescriptionId, {
          items,
          pharmacistId: superAdminId,
          pharmacistName: superAdminName,
          status: 'dispensed',
          overrideBySuperAdmin: true,
        })
      )

      const affectedPrescriptionIds = new Set(dispensableRows.map((r) => r.prescriptionId))
      const promise = Promise.all([
        ...prescriptions
          .filter((p) => affectedPrescriptionIds.has(p._id))
          .map((p) =>
            updatePrescription(p._id, {
              status: 'completed',
              pharmacistId: superAdminId,
              pharmacistName: superAdminName,
            })
          ),
        ...dispenseCalls,
      ])

      toast.promise(promise, {
        loading: 'Dispensing override item(s)...',
        success: 'Dispensed successfully',
        error: (error) => getErrorMessage(error, 'Failed to dispense. Check stock levels.'),
      })

      await promise

      const invRes = await getInventories()
      setInventory(invRes?.data ?? [])
      await loadDetail(selected)
      setDispenseModalRows(null)

      // Drop this patient/dependant from the review list once handled —
      // refetch would also work, this just avoids a full reload.
      setCandidates((prev) =>
        prev.filter(
          (c) => !(c.patientId === selected.patientId && c.dependantId === selected.dependantId)
        )
      )
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to dispense. Check stock levels.'))
    } finally {
      setDispenseSubmitting(false)
    }
  }

  return (
    <SuperAdminLayout>
      <div className="p-6">
        <div className="mb-4">
          <h1 className="text-2xl font-semibold text-primary">Pharmacy Review</h1>
          <p className="text-sm text-base-content/70">
            Patients and dependants with HMO-rejected medications. Override and dispense here
            if the patient agrees to pay directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left — candidate list */}
          <div className="lg:col-span-1 rounded-xl bg-base-100 border border-base-300 p-4">
            <input
              className="input input-sm input-bordered w-full mb-3"
              placeholder="Search by name or hospital ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-base-200 animate-pulse" />
                ))}
              </div>
            ) : filteredCandidates.length === 0 ? (
              <div className="text-sm text-base-content/60 py-8 text-center">
                No patients currently have HMO-rejected medications awaiting review.
              </div>
            ) : (
              <div className="space-y-2 max-h-[70vh] overflow-y-auto">
                {filteredCandidates.map((c) => {
                  const isActive =
                    selected?.patientId === c.patientId && selected?.dependantId === c.dependantId
                  return (
                    <button
                      key={`${c.type}-${c.patientId}-${c.dependantId || 'main'}`}
                      onClick={() => loadDetail(c)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        isActive ? 'border-primary bg-primary/5' : 'border-base-300 hover:bg-base-200/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">{c.name}</span>
                        {c.type === 'dependant' && (
                          <span className="badge badge-secondary badge-xs shrink-0">
                            {c.relationshipType || 'Dependant'}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-base-content/60 mt-1">
                        ID: {c.hospitalId} · {c.rejectedCount} item(s) not covered
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right — detail panel */}
          <div className="lg:col-span-2 rounded-xl bg-base-100 border border-base-300 p-4">
            {!selected ? (
              <div className="text-sm text-base-content/60 py-16 text-center">
                Select a patient or dependant from the list to review their prescriptions.
              </div>
            ) : detailLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-lg bg-base-200 animate-pulse" />
                ))}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold">{selected.name}</h2>
                    <p className="text-xs text-base-content/60">
                      Hospital ID: {selected.hospitalId}
                      {selected.type === 'dependant' && ` · ${selected.relationshipType || 'Dependant'}`}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={openDispenseModal}
                    disabled={!prescriptions.length}
                  >
                    Review &amp; Dispense
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <div className="text-sm text-base-content/60">No active prescriptions found.</div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.flatMap((p) =>
                      (p.medications || []).map((m, idx) => {
                        const suggestedQty = calculateQuantity(m)
                        const availabilityInfo = getDrugAvailabilityStatus(m, suggestedQty)
                        const hmoStatus = getHmoStatusForMed(p._id, m.drugName)
                        return (
                          <div key={`${p._id}-${idx}`} className="p-3 rounded-lg border bg-base-100">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <span className="font-semibold">{m.drugName}</span>
                              <span className={`badge badge-sm font-medium ${availabilityInfo.badgeClass}`}>
                                {availabilityInfo.label}
                              </span>
                              {hmoStatus === 'approved' && (
                                <span className="badge badge-sm badge-success font-medium">HMO: Covered</span>
                              )}
                              {hmoStatus === 'partial' && (
                                <span className="badge badge-sm badge-warning font-medium">HMO: Partial</span>
                              )}
                              {hmoStatus === 'rejected' && (
                                <span className="badge badge-sm badge-error font-medium">HMO: Not Covered</span>
                              )}
                            </div>
                            <div className="text-sm text-base-content/70">
                              Dosage: {m.dosage} · Frequency: {m.frequency} · Duration: {m.duration}
                            </div>
                            <div className="text-sm font-medium text-primary mt-1">
                              Prescribed Quantity: {suggestedQty} unit(s)
                            </div>
                            <div className="text-xs text-base-content/50 mt-1">
                              Ordered {p.createdAt ? formatNigeriaDateTime(p.createdAt) : '—'}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {dispenseModalRows && (
        <DispenseConfirmModal
          rows={dispenseModalRows}
          submitting={dispenseSubmitting}
          isSuperAdmin
          onCancel={() => setDispenseModalRows(null)}
          onConfirm={(finalRows) => submitDispense(finalRows)}
        />
      )}
    </SuperAdminLayout>
  )
}

export default PharmacyReview