import React, { useState } from 'react'
import {
  FaTimes,
  FaSignOutAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBed,
  FaCalendarAlt,
  FaUserNurse,
  FaFileInvoiceDollar,
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import { dischargeAdmission } from '@/services/api/admissionApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'

const DischargePatientModal = ({
  isOpen,
  onClose,
  admission,
  patientName = 'Patient',
  onDischarged,
  onOpenBillingModal,
}) => {
  const [dischargeNotes, setDischargeNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!isOpen || !admission) return null

  const admissionId = admission._id || admission.id
  const isDoctorCleared = Boolean(admission.dischargeReady || admission.dischargeOrderNote)
  const doctorNote = admission.dischargeOrderNote || ''
  const wardName = admission.ward || admission.wardId || 'General Ward'
  const bedNum = admission.bedNumber || 'Unassigned'
  const admittedDateStr = admission.admittedAt
    ? formatNigeriaDateTimeShort(admission.admittedAt)
    : 'Unknown'

  const handleDischarge = async (e) => {
    e.preventDefault()
    if (!admissionId) return

    setSubmitting(true)
    try {
      const finalNote = dischargeNotes.trim() || 'Discharged by nursing team upon clinical review'
      await dischargeAdmission(admissionId, finalNote)
      toast.success(`Patient ${patientName} has been successfully discharged!`)
      if (onDischarged) onDischarged()
      onClose()
    } catch (err) {
      console.error('Failed to discharge patient:', err)
      toast.error(
        err?.response?.data?.error || err?.response?.data?.message || 'Failed to discharge patient'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-base-100 rounded-3xl max-w-lg w-full shadow-2xl border border-base-300 overflow-hidden animate-scaleUp">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-base-200 bg-base-200/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 bg-warning/15 text-warning rounded-2xl shrink-0">
              <FaSignOutAlt className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-base-content truncate">
                Discharge Inpatient
              </h2>
              <p className="text-xs text-base-content/60 truncate">
                Nursing Discharge & Bed Clearance
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn btn-sm btn-circle btn-ghost shrink-0 text-base-content/60 hover:text-base-content"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleDischarge} className="p-4 sm:p-6 space-y-4">
          {/* Patient Stay Summary Card */}
          <div className="bg-base-200/40 rounded-2xl p-3.5 border border-base-200 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-base-content text-sm">{patientName}</span>
              <span className="badge badge-neutral text-[11px] font-semibold">
                Bed: {bedNum}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-base-content/70">
              <div>Ward: <strong className="text-base-content">{wardName}</strong></div>
              <div>Admitted: <strong className="text-base-content">{admittedDateStr}</strong></div>
            </div>
          </div>

          {/* Doctor Clearance Status Card */}
          {isDoctorCleared ? (
            <div className="bg-success/10 border border-success/30 rounded-2xl p-3.5 space-y-1.5 text-xs text-success-content">
              <div className="flex items-center gap-2 font-bold text-success">
                <FaCheckCircle className="w-4 h-4 shrink-0" />
                <span>Doctor Discharge Clearance Certified</span>
              </div>
              <p className="text-base-content/80 text-[11px] pl-6 font-mono leading-relaxed">
                "{doctorNote || 'Patient is medically fit for discharge.'}"
              </p>
            </div>
          ) : (
            <div className="bg-warning/10 border border-warning/30 rounded-2xl p-3.5 space-y-1 text-xs text-warning-content">
              <div className="flex items-center gap-2 font-bold text-warning">
                <FaExclamationTriangle className="w-4 h-4 shrink-0" />
                <span>No Doctor Discharge Order in Ward Round</span>
              </div>
              <p className="text-base-content/70 text-[11px] pl-6">
                The doctor has not formally marked discharge in the ward round note yet. If verbal or senior medical clearance was given, you may proceed.
              </p>
            </div>
          )}

          {/* Quick Reminder on Billing */}
          <div className="p-3 bg-base-200/50 rounded-xl border border-base-200 flex items-center justify-between gap-3 text-xs">
            <span className="text-base-content/70">
              Ensure all medication bills and inpatient stay charges have been reviewed.
            </span>
            {onOpenBillingModal && (
              <button
                type="button"
                onClick={() => {
                  onClose()
                  onOpenBillingModal()
                }}
                className="btn btn-xs btn-outline btn-primary shrink-0 gap-1"
              >
                <FaFileInvoiceDollar className="w-3 h-3" /> Preview Bill
              </button>
            )}
          </div>

          {/* Nurse Discharge Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-base-content/70">
              Nurse Discharge Notes / Handover Condition
            </label>
            <textarea
              value={dischargeNotes}
              onChange={(e) => setDischargeNotes(e.target.value)}
              placeholder="e.g. Vitals stable, peripheral cannula removed, take-home medications explained to patient and relative, discharge summary handed over, patient ambulating comfortably."
              rows={4}
              className="textarea textarea-bordered w-full rounded-2xl text-xs leading-relaxed"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="btn btn-sm btn-ghost rounded-xl text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-sm btn-warning text-warning-content rounded-xl font-bold gap-2 shadow-xs"
            >
              {submitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  Discharging...
                </>
              ) : (
                <>
                  <FaSignOutAlt className="w-3.5 h-3.5" />
                  Confirm & Discharge Patient
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DischargePatientModal

