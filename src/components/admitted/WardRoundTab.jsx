import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import wardRoundApi from '@/services/api/wardRoundApi'
import { dischargeAdmission } from '@/services/api/admissionApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import PrescribeDrugsModal from '@/components/modals/PrescribeDrugsModal'
import OrderInvestigationModal from '@/pages/doctor/incoming/modals/OrderInvestigationModal'
import {
  createPrescriptionByWardRound,
  getPrescriptionsByWardRound,
} from '@/services/api/prescriptionsAPI'
import {
  createInvestigationRequestByWardRound,
  getInvestigationRequestsByWardRound,
} from '@/services/api/investigationRequestAPI'
import {
  FaNotesMedical,
  FaPrescriptionBottleAlt,
  FaFlask,
  FaSignOutAlt,
  FaHistory,
  FaUserMd,
  FaUserNurse,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTrashAlt,
  FaXRay,
  FaChevronDown,
  FaChevronUp,
  FaBed,
  FaClinicMedical,
  FaFilePrescription,
  FaVial,
  FaInfoCircle,
} from 'react-icons/fa'

const WardRoundTab = ({
  patientId,
  dependantId,
  admission,
  consultationId,
  isDoctor = false,
  isNurse = false,
  onRoundSaved,
}) => {
  const [form, setForm] = useState({
    note: '',
    dischargeNote: '',
    isDischargeRound: false,
  })
  const [saving, setSaving] = useState(false)
  const [showDischargeConfirm, setShowDischargeConfirm] = useState(false)

  // Modals and queue state
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false)
  const [isOrderLabsOpen, setIsOrderLabsOpen] = useState(false)
  const [inlineMedications, setInlineMedications] = useState([])
  const [inlineInvestigationOrders, setInlineInvestigationOrders] = useState([])

  // Related data (prescriptions, investigations, ward rounds)
  const [relatedData, setRelatedData] = useState({
    prescriptions: [],
    investigations: [],
    prescriptionsMap: {},
    investigationsMap: {},
    wardRounds: [],
  })
  const [loadingRelated, setLoadingRelated] = useState(false)

  // Track which historical rounds are expanded (set of round IDs)
  const [expandedRounds, setExpandedRounds] = useState(new Set())

  // Ensure effective consultation ID is always a string, never an object
  const effectiveConsultationId = useMemo(() => {
    const fromProps = typeof consultationId === 'object'
      ? consultationId?._id || consultationId?.id
      : consultationId
    const fromAdmConsultationId = typeof admission?.consultationId === 'object'
      ? admission?.consultationId?._id || admission?.consultationId?.id
      : admission?.consultationId
    const fromAdmConsultation = typeof admission?.consultation === 'object'
      ? admission?.consultation?._id || admission?.consultation?.id
      : admission?.consultation
    return fromProps || fromAdmConsultationId || fromAdmConsultation || null
  }, [consultationId, admission])

  const admissionId = admission?._id || admission?.id || null

  const fetchRelated = async () => {
    if (!effectiveConsultationId && !admissionId && !patientId) return
    try {
      setLoadingRelated(true)
      let rounds = []
      let relatedPrescriptions = []
      let relatedInvestigations = []

      if (effectiveConsultationId) {
        try {
          const res = await wardRoundApi.getWardRoundRelatedByConsultation(
            effectiveConsultationId,
            admissionId ? { admissionId } : {}
          )
          const data = res?.data ?? res ?? {}
          if (Array.isArray(data.wardRounds) && data.wardRounds.length > 0) {
            rounds = data.wardRounds
          }
          if (Array.isArray(data.prescriptions)) {
            relatedPrescriptions = data.prescriptions
          }
          if (Array.isArray(data.investigations)) {
            relatedInvestigations = data.investigations
          }
        } catch (cErr) {
          console.warn('Consultation related fetch fallback', cErr)
        }
      }

      if (rounds.length === 0 && patientId) {
        try {
          const res = await wardRoundApi.getWardRoundsByPatient(patientId)
          const data = res?.data ?? res ?? []
          rounds = Array.isArray(data) ? data : []
        } catch (pErr) {
          console.warn('Patient rounds fetch error', pErr)
        }
      }

      // Sort rounds newest first
      const sorted = [...rounds].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      )

      // Fetch prescriptions and investigations for each ward round one by one!
      const prescriptionsMap = {}
      const investigationsMap = {}

      await Promise.all(
        sorted.map(async (round) => {
          const rId = String(round.id || round._id)
          if (!rId) return
          try {
            const [rxRes, invRes] = await Promise.all([
              getPrescriptionsByWardRound(rId).catch(() => null),
              getInvestigationRequestsByWardRound(rId).catch(() => null),
            ])
            const rxData = rxRes?.data?.data ?? rxRes?.data ?? rxRes ?? []
            const invData = invRes?.data?.data ?? invRes?.data ?? invRes ?? []
            prescriptionsMap[rId] = Array.isArray(rxData) ? rxData : []
            investigationsMap[rId] = Array.isArray(invData) ? invData : []
          } catch (roundErr) {
            console.warn(`Error loading orders for round ${rId}`, roundErr)
          }
        })
      )

      setRelatedData({
        prescriptions: relatedPrescriptions,
        investigations: relatedInvestigations,
        prescriptionsMap,
        investigationsMap,
        wardRounds: sorted,
      })

      // By default, expand the newest round
      if (sorted.length > 0) {
        const newestId = String(sorted[0]?.id || sorted[0]?._id)
        if (newestId) {
          setExpandedRounds((prev) => {
            const next = new Set(prev)
            next.add(newestId)
            return next
          })
        }
      }
    } catch (err) {
      console.warn('Failed to load related records', err)
    } finally {
      setLoadingRelated(false)
    }
  }

  useEffect(() => {
    fetchRelated()
  }, [effectiveConsultationId, admissionId, patientId])

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const toggleRoundExpand = (roundId) => {
    setExpandedRounds((prev) => {
      const next = new Set(prev)
      if (next.has(roundId)) {
        next.delete(roundId)
      } else {
        next.add(roundId)
      }
      return next
    })
  }

  const handlePreSubmit = (e) => {
    e.preventDefault()
    const totalMedications = inlineMedications.length
    const totalOrders = inlineInvestigationOrders.length
    const hasContent = form.note.trim() || totalMedications > 0 || totalOrders > 0
    if (!hasContent) {
      return toast.error('Add a clinical note, prescribe drugs, or order investigations before saving')
    }
    if (form.isDischargeRound) {
      setShowDischargeConfirm(true)
    } else {
      executeSubmit()
    }
  }

  const executeSubmit = async () => {
    setSaving(true)
    setShowDischargeConfirm(false)
    try {
    
      // Step 1: Create the Ward Round note
      const roundPayload = {
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId: effectiveConsultationId,
        admissionId: admissionId || undefined,
        wardId: admission?.wardId || undefined,
        note: form.note.trim() ,
        dischargeNote: form.dischargeNote ? form.dischargeNote.trim() : undefined,
        isDischargeRound: Boolean(form.isDischargeRound),
      }

      const res = await wardRoundApi.createWardRound(roundPayload)
      const createdRound = res?.data ?? res
      const roundId = createdRound?.id || createdRound?._id

      if (!roundId) {
        throw new Error('Ward round was created but no ID was returned.')
      }

      // Step 2: Create queued prescriptions using createPrescriptionByWardRound with that roundId
      if (inlineMedications.length > 0) {
        try {
          await createPrescriptionByWardRound(roundId, {
            patientId,
            ...(dependantId ? { dependantId } : {}),
            consultationId: effectiveConsultationId,
            medications: inlineMedications,
            status: 'pending',
          })
        } catch (rxErr) {
          console.error('Failed to create prescription by ward round:', rxErr)
          toast.error('Ward round created, but prescription creation failed.')
        }
      }

      // Step 3: Create queued lab/radiology orders using createInvestigationRequestByWardRound with that roundId
      if (inlineInvestigationOrders.length > 0) {
        for (const order of inlineInvestigationOrders) {
          try {
            await createInvestigationRequestByWardRound(roundId, {
              patientId,
              ...(dependantId ? { dependantId } : {}),
              consultationId: effectiveConsultationId,
              type: order.type || 'lab',
              priority: order.priority || 'normal',
              tests: order.tests,
            })
          } catch (invErr) {
            console.error('Failed to create investigation request by ward round:', invErr)
            toast.error('Ward round created, but lab/radiology order creation failed.')
          }
        }
      }

      // Step 4: If marked as discharge round, also ensure the admission is updated
      if (form.isDischargeRound && admissionId) {
        try {
          await dischargeAdmission(admissionId, form.dischargeNote || form.note)
        } catch (disErr) {
          console.warn('dischargeAdmission fallback warning', disErr)
        }
      }

      toast.success(
        form.isDischargeRound
          ? 'Patient successfully discharged with final round note and orders created'
          : 'Ward round saved with all queued prescriptions and lab orders created'
      )

      setForm({ note: '', dischargeNote: '', isDischargeRound: false })
      setInlineMedications([])
      setInlineInvestigationOrders([])
      await fetchRelated()
      if (onRoundSaved) onRoundSaved()
    } catch (err) {
      console.error('Ward round submission error:', err)
      toast.error(
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to save ward round'
      )
    } finally {
      setSaving(false)
    }
  }

  const handleClearDraft = () => {
    if (form.note.trim() || inlineMedications.length > 0 || inlineInvestigationOrders.length > 0) {
      if (window.confirm('Are you sure you want to discard your draft note and queued orders?')) {
        setForm({ note: '', dischargeNote: '', isDischargeRound: false })
        setInlineMedications([])
        setInlineInvestigationOrders([])
        toast.info('Draft cleared')
      }
    }
  }

  // Sorted list of past rounds (newest first)
  const sortedRounds = useMemo(() => {
    return [...(relatedData.wardRounds || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    )
  }, [relatedData.wardRounds])

  // Helper to find prescriptions linked to a given round
  const getRoundPrescriptions = (round) => {
    if (!round) return []
    const roundId = String(round.id || round._id || '')
    const fromMap = relatedData.prescriptionsMap?.[roundId]
    if (Array.isArray(fromMap)) return fromMap

    return (relatedData.prescriptions || []).filter(
      (p) => p.wardRoundId && String(p.wardRoundId) === roundId
    )
  }

  // Helper to find investigations linked to a given round
  const getRoundInvestigations = (round) => {
    if (!round) return []
    const roundId = String(round.id || round._id || '')
    const fromMap = relatedData.investigationsMap?.[roundId]
    if (Array.isArray(fromMap)) return fromMap

    return (relatedData.investigations || []).filter(
      (inv) => inv.wardRoundId && String(inv.wardRoundId) === roundId
    )
  }

  const totalInvestigationTests = useMemo(() => {
    return inlineInvestigationOrders.reduce((sum, ord) => sum + (ord.tests?.length || 0), 0)
  }, [inlineInvestigationOrders])

  const canSubmit =
    form.note.trim().length > 0 ||
    inlineMedications.length > 0 ||
    inlineInvestigationOrders.length > 0

  return (
    <div className="space-y-6">
  
 {/* Main Active Ward Round Workspace — doctors only */}
    {isDoctor && (
      <div className="bg-base-100 p-5 sm:p-6 rounded-2xl border border-base-200 shadow-sm space-y-6">
        <form onSubmit={handlePreSubmit} className="space-y-6">
          {/* Section 1: Clinical Progress Note */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <label className="text-xs sm:text-sm font-bold text-base-content flex items-center gap-1.5">
                <FaNotesMedical className="text-primary w-4 h-4" />
                Clinical Progress & Examination Note
                
              </label>
              
            </div>

            <textarea
              name="note"
              value={form.note}
              onChange={handleChange}
              placeholder={
                isNurse
                  ? 'Enter patient current status, nurse observations, treatment tolerance, fluid balance, vitals review, complaints, and nursing care plan...'
                  : 'Enter subjective complaints, physical examination findings, treatment response, fluid balance review, and plan for today...'
              }
              className="textarea textarea-bordered w-full h-32 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary leading-relaxed"
            />
          </div>

          {/* Section 2: Staged Orders Queue (Dual Card Layout) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Column A: Queued Prescriptions Card */}
            <div className="bg-base-200/30 rounded-2xl border border-base-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-base-300/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <FaPrescriptionBottleAlt className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-base-content flex items-center gap-1.5">
                      Queued Prescriptions
                      <span className="badge badge-primary badge-outline badge-xs font-bold">
                        {inlineMedications.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-base-content/60">
                      Drugs staged for creation with this ward round
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrescribeOpen(true)}
                  className="btn btn-xs btn-primary rounded-lg gap-1 shadow-2xs"
                >
                  <FaFilePrescription className="w-3 h-3" /> Prescribe Drugs
                </button>
              </div>

              {/* Prescriptions List or Empty State */}
              {inlineMedications.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-base-300 rounded-xl space-y-2 bg-base-100/50">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FaPrescriptionBottleAlt className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-base-content/70">
                    No medications queued yet
                  </p>
                  <p className="text-[11px] text-base-content/50 max-w-xs mx-auto">
                    Click &quot;Prescribe Drugs&quot; to calculate dosage, check stock, and add medications to this round.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsPrescribeOpen(true)}
                    className="btn btn-xs btn-outline btn-primary rounded-lg text-xs"
                  >
                    + Add Medication to Queue
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {inlineMedications.map((m, i) => (
                    <div
                      key={i}
                      className="bg-base-100 p-3 rounded-xl border border-base-300/80 shadow-2xs flex items-start justify-between gap-2 hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-xs text-base-content">
                            {m.drugName}
                          </span>
                          <span className="badge badge-outline badge-xs">
                            {m.dosage}
                          </span>
                          {m.availability === 'unavailable' ? (
                            <span className="badge badge-warning badge-xs">Out of Stock</span>
                          ) : (
                            <span className="badge badge-success badge-xs text-white">In Stock</span>
                          )}
                        </div>

                        <div className="text-[11px] text-base-content/70 space-y-0.5">
                          <div>
                            <span className="font-medium text-base-content/90">Regimen:</span> {m.frequency} · {m.duration}
                          </div>
                          {m.instructions && (
                            <div className="italic text-base-content/60">
                              Instructions: {m.instructions}
                            </div>
                          )}
                          {m.lineTotal ? (
                            <div className="font-semibold text-primary text-[11px]">
                              Estimated Total: ₦{Number(m.lineTotal).toLocaleString()}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setInlineMedications((prev) => prev.filter((_, idx) => idx !== i))
                        }
                        className="btn btn-ghost btn-xs text-error shrink-0 hover:bg-error/10"
                        title="Remove medication from queue"
                      >
                        <FaTrashAlt className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Column B: Queued Investigation Orders Card */}
            <div className="bg-base-200/30 rounded-2xl border border-base-200 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-base-300/60 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <FaFlask className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-base-content flex items-center gap-1.5">
                      Queued Investigations
                      <span className="badge badge-primary badge-outline badge-xs font-bold">
                        {inlineInvestigationOrders.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-base-content/60">
                     Order labs for ward round
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOrderLabsOpen(true)}
                  className="btn btn-xs btn-outline btn-primary rounded-lg gap-1 shadow-2xs"
                >
                  <FaVial className="w-3 h-3" /> Order Labs / Imaging
                </button>
              </div>

              {/* Investigations List or Empty State */}
              {inlineInvestigationOrders.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-base-300 rounded-xl space-y-2 bg-base-100/50">
                  <div className="w-10 h-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <FaFlask className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-base-content/70">
                    No investigations queued yet
                  </p>
                  <p className="text-[11px] text-base-content/50 max-w-xs mx-auto">
                    Click &quot;Order Labs / Imaging&quot; to pick laboratory tests or radiology requests with priority levels.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsOrderLabsOpen(true)}
                    className="btn btn-xs btn-outline btn-primary rounded-lg text-xs"
                  >
                    + Add Investigation to Queue
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {inlineInvestigationOrders.map((order, orderIdx) => {
                    const isRadiology = order.type === 'radiology'
                    return (
                      <div
                        key={orderIdx}
                        className="bg-base-100 p-3 rounded-xl border border-base-300/80 shadow-2xs space-y-2 hover:border-primary/40 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-outline badge-sm font-semibold gap-1 capitalize">
                              {isRadiology ? (
                                <FaXRay className="w-2.5 h-2.5" />
                              ) : (
                                <FaFlask className="w-2.5 h-2.5" />
                              )}
                              {order.type || 'Laboratory'}
                            </span>
                            <span
                              className={`badge badge-xs uppercase font-bold tracking-wider ${
                                order.priority === 'emergency'
                                  ? 'badge-error text-white animate-pulse'
                                  : order.priority === 'urgent'
                                  ? 'badge-warning'
                                  : 'badge-ghost'
                              }`}
                            >
                              {order.priority || 'Normal'} Priority
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              setInlineInvestigationOrders((prev) =>
                                prev.filter((_, i) => i !== orderIdx)
                              )
                            }
                            className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                            title="Remove this order"
                          >
                            <FaTrashAlt className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {(order.tests || []).map((t, tIdx) => (
                            <span
                              key={tIdx}
                              className="badge badge-outline badge-sm text-xs gap-1 bg-base-200/50"
                            >
                              {typeof t === 'string' ? t : t.name}
                              {t.isCustom && (
                                <span className="text-warning text-[10px]" title="Custom Test">
                                  *
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Final Discharge Round Designation */}
          <div className="p-4 bg-base-200/40 rounded-xl border border-base-200 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                name="isDischargeRound"
                checked={form.isDischargeRound}
                onChange={handleChange}
                className="checkbox checkbox-warning checkbox-sm rounded-lg"
              />
              <div>
                <span className="font-bold text-xs sm:text-sm text-base-content flex items-center gap-2">
                
                  Designate this assessment as the Final Discharge Round
                </span>
                <p className="text-[11px] text-base-content/60">
                  Checking this marks the inpatient hospital admission as discharged and prepares take-home instructions.
                </p>
              </div>
            </label>

            {form.isDischargeRound && (
              <div className="pt-2 animate-fadeIn">
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Formal Discharge Note*
                </label>
                <textarea
                  name="dischargeNote"
                  value={form.dischargeNote}
                  onChange={handleChange}
                  placeholder="Discharge condition, take-home medication regimen, wound care instructions, follow-up clinic appointment date..."
                  className="textarea textarea-bordered textarea-warning w-full h-24 rounded-xl text-xs leading-relaxed"
                  required={form.isDischargeRound}
                />
              </div>
            )}
          </div>

          {/* Section 4: Live Summary Bar & Action Controls */}
          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-base-200">
          

            <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
              {(form.note.trim() || inlineMedications.length > 0 || inlineInvestigationOrders.length > 0) && (
                <button
                  type="button"
                  onClick={handleClearDraft}
                  disabled={saving}
                  className="btn btn-sm btn-ghost rounded-xl text-xs text-base-content/60"
                >
                  Clear Draft
                </button>
              )}

              <button
                type="submit"
                disabled={saving || !canSubmit}
                className={`btn btn-sm rounded-xl font-semibold gap-2 shadow-xs transition-all ${
                  form.isDischargeRound
                    ? 'btn-warning text-warning-content'
                    : 'btn-primary'
                }`}
              >
                {saving ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Saving Ward Round & Orders...
                  </>
                ) : form.isDischargeRound ? (
                  <>
                    <FaSignOutAlt className="w-3.5 h-3.5" /> Complete Round & Discharge Patient
                  </>
                ) : (
                  <>
                    <FaCheckCircle className="w-3.5 h-3.5" /> Save Ward Round Notes & Orders
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
        )}

      {/* Section 5: Historical Ward Rounds Timeline & Embedded Review */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-3">
          <div>
            <h3 className="font-bold text-base text-base-content flex items-center gap-2">
              <FaHistory className="text-primary w-4 h-4" />
              Ward Round Entries & Progress Log ({sortedRounds.length})
            </h3>
            <p className="text-xs text-base-content/60">
              Complete chronological record of ward assessments, prescribed medications, and ordered tests throughout this admission.
            </p>
          </div>

          {sortedRounds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (expandedRounds.size === sortedRounds.length) {
                    setExpandedRounds(new Set())
                  } else {
                    setExpandedRounds(
                      new Set(sortedRounds.map((r) => String(r.id || r._id)).filter(Boolean))
                    )
                  }
                }}
                className="btn btn-ghost btn-xs text-primary font-medium"
              >
                {expandedRounds.size === sortedRounds.length ? 'Collapse All' : 'Expand All'}
              </button>
            </div>
          )}
        </div>

        {loadingRelated ? (
          <div className="p-8 text-center space-y-2">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/50">Loading admission ward rounds and orders...</p>
          </div>
        ) : sortedRounds.length === 0 ? (
          <div className="p-8 text-center text-xs text-base-content/50 bg-base-200/20 rounded-xl">
            No ward round notes have been logged for this admission yet.
          </div>
        ) : (
          <div className="space-y-3">
            {sortedRounds.map((round, idx) => {
              const roundId = String(round.id || round._id || idx)
              const isExpanded = expandedRounds.has(roundId)

              const isNurseAuthor = round.doctor?.accountType === 'nurse'
              const clinicianName = round.doctor
                ? `${isNurseAuthor ? 'Nurse' : 'Dr.'} ${round.doctor.firstName || ''} ${
                    round.doctor.lastName || ''
                  }`.trim()
                : 'Attending Clinician'

              const roundPrescriptions = getRoundPrescriptions(round)
              const roundInvestigations = getRoundInvestigations(round)

              return (
                <div
                  key={roundId}
                  className={`rounded-xl border transition-all duration-200 ${
                    round.isDischargeRound
                      ? 'bg-warning/5 border-warning/30 hover:border-warning'
                      : 'bg-base-200/20 border-base-200 hover:border-primary/40'
                  }`}
                >
                  {/* Round Card Header (Clickable to toggle expand) */}
                  <div
                    onClick={() => toggleRoundExpand(roundId)}
                    className="p-3.5 sm:p-4 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2.5 rounded-xl shrink-0 ${
                          isNurseAuthor
                            ? 'bg-info/10 text-info'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {isNurseAuthor ? (
                          <FaUserNurse className="w-4 h-4" />
                        ) : (
                          <FaUserMd className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-base-content">
                            {clinicianName}
                          </span>
                          {round.isDischargeRound && (
                            <span className="badge badge-warning badge-xs font-bold gap-1">
                              <FaSignOutAlt className="w-2.5 h-2.5" /> Discharge Round
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-base-content/60">
                          {formatNigeriaDateTimeShort(round.createdAt)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <div className="flex items-center gap-1.5">
                        {roundPrescriptions.length > 0 && (
                          <span className="badge badge-outline badge-xs font-semibold gap-1 text-primary border-primary/30">
                            <FaPrescriptionBottleAlt className="w-2.5 h-2.5" />
                            {roundPrescriptions.length} Rx
                          </span>
                        )}
                        {roundInvestigations.length > 0 && (
                          <span className="badge badge-outline badge-xs font-semibold gap-1 text-primary border-primary/30">
                            <FaFlask className="w-2.5 h-2.5" />
                            {roundInvestigations.length} Lab(s)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn btn-ghost btn-xs btn-circle text-base-content/60"
                        title={isExpanded ? 'Collapse' : 'Expand'}
                      >
                        {isExpanded ? (
                          <FaChevronUp className="w-3 h-3" />
                        ) : (
                          <FaChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Round Card Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 pt-1 sm:p-5 sm:pt-2 border-t border-base-200/70 space-y-4 animate-fadeIn">
                      {/* Note Content */}
                      <div className="space-y-1">
                        <span className="text-[11px] uppercase tracking-wider font-bold text-base-content/60">
                          Clinical Progress Note
                        </span>
                        <p className="text-xs sm:text-sm text-base-content leading-relaxed whitespace-pre-wrap bg-base-100 p-3 rounded-xl border border-base-200">
                          {round.note}
                        </p>
                      </div>

                      {/* Discharge Instructions (if discharge round) */}
                      {round.dischargeNote && (
                        <div className="bg-warning/10 p-3 rounded-xl border border-warning/20 space-y-1">
                          <span className="text-xs font-bold text-warning flex items-center gap-1.5">
                            <FaSignOutAlt className="w-3 h-3" /> Discharge Instructions & Regimen
                          </span>
                          <p className="text-xs text-base-content/90 whitespace-pre-wrap leading-relaxed">
                            {round.dischargeNote}
                          </p>
                        </div>
                      )}

                      {/* Direct Inline Prescriptions List */}
                      {roundPrescriptions.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <FaPrescriptionBottleAlt className="w-3.5 h-3.5" />
                              Prescribed Medications ({roundPrescriptions.length})
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {roundPrescriptions.map((rx, rxIdx) => (
                              <div
                                key={rx._id || rx.id || rxIdx}
                                className="bg-base-100 p-3 rounded-xl border border-base-200 text-xs space-y-1.5 shadow-2xs"
                              >
                                <div className="flex items-center justify-between font-bold text-base-content border-b border-base-200/60 pb-1">
                                  <span>Prescription #{String(rx._id || rx.id).slice(-6)}</span>
                                  <span className="badge badge-outline badge-xs capitalize">
                                    {rx.status || 'Pending'}
                                  </span>
                                </div>
                                <div className="space-y-1 pt-0.5">
                                  {(rx.medications || []).map((med, mIdx) => (
                                    <div
                                      key={mIdx}
                                      className="flex flex-col sm:flex-row sm:items-center justify-between text-base-content/90 font-medium gap-1"
                                    >
                                      <div>
                                        • <span className="font-bold">{med.drugName}</span> -{' '}
                                        <span className="badge badge-ghost badge-xs font-semibold">{med.dosage}</span>{' '}
                                        ({med.frequency}, {med.duration})
                                        {med.instructions && (
                                          <span className="text-base-content/60 italic ml-1">
                                            — {med.instructions}
                                          </span>
                                        )}
                                      </div>
                                      {med.lineTotal ? (
                                        <span className="text-primary font-semibold text-[11px]">
                                          ₦{Number(med.lineTotal).toLocaleString()}
                                        </span>
                                      ) : null}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Direct Inline Investigations List */}
                      {roundInvestigations.length > 0 && (
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                              <FaFlask className="w-3.5 h-3.5" />
                              Ordered Investigations ({roundInvestigations.length})
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {roundInvestigations.map((inv, invIdx) => {
                              const isRad = inv.type === 'radiology'
                              return (
                                <div
                                  key={inv._id || inv.id || invIdx}
                                  className="bg-base-100 p-3 rounded-xl border border-base-200 text-xs space-y-1.5 shadow-2xs"
                                >
                                  <div className="flex items-center justify-between font-bold text-base-content border-b border-base-200/60 pb-1">
                                    <div className="flex items-center gap-2">
                                      <span className="badge badge-outline badge-xs capitalize">
                                        {isRad ? 'Radiology' : 'Laboratory'}
                                      </span>
                                      <span>Order #{String(inv._id || inv.id).slice(-6)}</span>
                                      {inv.priority && (
                                        <span className="badge badge-ghost badge-xs uppercase font-bold text-[10px]">
                                          {inv.priority}
                                        </span>
                                      )}
                                    </div>
                                    <span className="badge badge-outline badge-xs capitalize">
                                      {inv.status || 'Requested'}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                                    {(inv.tests || []).map((t, tIdx) => (
                                      <span
                                        key={tIdx}
                                        className="badge badge-ghost badge-sm text-xs gap-1 font-medium bg-base-200"
                                      >
                                        {t.name || t}
                                        {t.isCustom && <span className="text-warning">*</span>}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Fallback if round has neither meds nor labs */}
                      {roundPrescriptions.length === 0 && roundInvestigations.length === 0 && (
                        <div className="text-[11px] text-base-content/50 italic">
                          No prescriptions or laboratory investigations ordered during this assessment.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Discharge Confirmation Modal */}
      {showDischargeConfirm && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-base-300 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-warning">
              <div className="p-3 bg-warning/10 rounded-xl">
                <FaExclamationTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Confirm Inpatient Discharge</h3>
                <p className="text-xs text-base-content/60">
                  This action marks the hospital admission as completed
                </p>
              </div>
            </div>

            <p className="text-sm text-base-content/80 leading-relaxed">
              Are you sure you want to complete this ward round as a <strong>Discharge Round</strong>? This will release the assigned bed and mark the patient&apos;s admission as discharged.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDischargeConfirm(false)}
                className="btn btn-sm btn-ghost rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSubmit}
                disabled={saving}
                className="btn btn-sm btn-warning rounded-xl font-semibold gap-2"
              >
                {saving ? 'Discharging...' : 'Confirm & Discharge'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Prescribe Drugs Modal (Queue-First Mode) */}
      <PrescribeDrugsModal
        isOpen={isPrescribeOpen}
        onClose={() => setIsPrescribeOpen(false)}
        onQueue={(meds) => {
          setInlineMedications((prev) => [...prev, ...meds])
          toast.success(`Queued ${meds.length} medication(s) for this round`)
        }}
      />

      {/* Order Investigation Modal (Queue-First Mode) */}
      <OrderInvestigationModal
        isOpen={isOrderLabsOpen}
        onClose={() => setIsOrderLabsOpen(false)}
        patientId={patientId}
        dependantId={dependantId}
        consultationId={effectiveConsultationId}
        onQueue={(order) => {
          setInlineInvestigationOrders((prev) => [...prev, order])
          toast.success(
            `Queued ${order.type === 'radiology' ? 'Radiology' : 'Lab'} order with ${
              order.tests?.length || 0
            } test(s)`
          )
        }}
      />
    </div>
  )
}

export default WardRoundTab
