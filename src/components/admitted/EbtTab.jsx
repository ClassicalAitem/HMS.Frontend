import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import ebtApi from '@/services/api/ebtApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import {
  FaExchangeAlt,
  FaPlus,
  FaUserMd,
  FaVial,
  FaNotesMedical,
  FaHistory,
} from 'react-icons/fa'

const EbtTab = ({
  patientId,
  dependantId,
  consultationId,
  isDoctor = false,
}) => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    indication: '',
    donorBloodGroup: '',
    volumeExchangedMl: '',
    preTransfusionBilirubin: '',
    postTransfusionBilirubin: '',
    doctorNote: '',
  })

  const loadRecords = async () => {
    try {
      setLoading(true)
      const res = await ebtApi.getEbtByPatient(patientId, {
        ...(dependantId ? { dependantId } : {}),
      })
      const list = res?.data ?? res ?? []
      setRecords(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load EBT records', err)
      toast.error('Failed to load EBT procedure history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [patientId, dependantId])

  const handleFormChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.indication.trim()) {
      return toast.error('Please specify the indication for exchange blood transfusion')
    }

    setSaving(true)
    try {
      await ebtApi.createEbtRecord({
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId,
        indication: form.indication.trim(),
        donorBloodGroup: form.donorBloodGroup || undefined,
        volumeExchangedMl: form.volumeExchangedMl ? Number(form.volumeExchangedMl) : 0,
        preTransfusionBilirubin: form.preTransfusionBilirubin
          ? Number(form.preTransfusionBilirubin)
          : undefined,
        postTransfusionBilirubin: form.postTransfusionBilirubin
          ? Number(form.postTransfusionBilirubin)
          : undefined,
        doctorNote: form.doctorNote.trim() || undefined,
      })

      toast.success('Exchange blood transfusion procedure recorded')
      setShowAddModal(false)
      setForm({
        indication: '',
        donorBloodGroup: '',
        volumeExchangedMl: '',
        preTransfusionBilirubin: '',
        postTransfusionBilirubin: '',
        doctorNote: '',
      })
      await loadRecords()
    } catch (err) {
      console.error('Failed to save EBT record', err)
      toast.error(err?.response?.data?.error || 'Failed to record EBT procedure')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header & Doctor Entry Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-secondary/10 text-secondary rounded-xl">
            <FaExchangeAlt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-base-content">
              Exchange Blood Transfusion (EBT)
            </h3>
            <p className="text-xs text-base-content/60">
              Specialized neonatal and pediatric whole blood replacement protocols and bilirubin clearance
            </p>
          </div>
        </div>

        {/* Doctor-Only Record Button */}
        {isDoctor && (
          <button
            onClick={() => setShowAddModal(true)}
            className="btn btn-sm btn-secondary rounded-xl gap-2 font-semibold shadow-sm"
          >
            <FaPlus className="w-3 h-3" /> Record EBT Procedure
          </button>
        )}
      </div>

      {!isDoctor && (
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center gap-3 text-xs text-base-content/70">
          <FaUserMd className="text-primary w-4 h-4 shrink-0" />
          <span>
            Exchange Blood Transfusion procedures are documented exclusively by attending physicians and surgeons. Nurses have read-only access to procedural records.
          </span>
        </div>
      )}

      {/* EBT Procedure History Table */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <h4 className="font-bold text-base text-base-content flex items-center gap-2">
            <FaHistory className="text-primary" />
            EBT Procedure Ledger ({records.length})
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : records.length === 0 ? (
          <div className="p-10 text-center text-xs text-base-content/50">
            No Exchange Blood Transfusion procedures recorded for this patient.
          </div>
        ) : (
          <div className="divide-y divide-base-200">
            {records.map((item) => {
              const diffBilirubin =
                item.preTransfusionBilirubin != null && item.postTransfusionBilirubin != null
                  ? (item.preTransfusionBilirubin - item.postTransfusionBilirubin).toFixed(1)
                  : null

              return (
                <div key={item._id || item.id} className="p-4 sm:p-5 space-y-3 hover:bg-base-200/20">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-base-content">{item.indication}</span>
                      {item.donorBloodGroup && (
                        <span className="badge badge-secondary badge-xs font-semibold">
                          Donor: {item.donorBloodGroup}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-base-content/60">
                      {formatNigeriaDateTimeShort(item.createdAt)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-200/40 p-3 rounded-xl text-xs">
                    <div>
                      <span className="text-base-content/50 block">Exchanged Volume:</span>
                      <span className="font-bold text-base-content">
                        {item.volumeExchangedMl ? `${item.volumeExchangedMl} ml` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/50 block">Pre-Tx Bilirubin:</span>
                      <span className="font-bold text-warning">
                        {item.preTransfusionBilirubin != null ? `${item.preTransfusionBilirubin} mg/dL` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/50 block">Post-Tx Bilirubin:</span>
                      <span className="font-bold text-success">
                        {item.postTransfusionBilirubin != null ? `${item.postTransfusionBilirubin} mg/dL` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-base-content/50 block">Bilirubin Clearance:</span>
                      <span className="font-bold text-primary">
                        {diffBilirubin ? `-${diffBilirubin} mg/dL` : '—'}
                      </span>
                    </div>
                  </div>

                  {item.doctorNote && (
                    <div className="text-xs text-base-content/80 bg-base-100 p-2.5 rounded-lg border border-base-200">
                      <span className="font-semibold text-base-content block mb-0.5">Physician Notes:</span>
                      {item.doctorNote}
                    </div>
                  )}

                  <div className="text-[11px] text-base-content/50 flex items-center gap-1.5">
                    <FaUserMd className="text-primary" />
                    <span>Performed / Logged by {item.doctorName || 'Doctor'}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Record EBT Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-base-300 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaExchangeAlt className="text-secondary" /> Record Exchange Blood Transfusion
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Clinical Indication *
                </label>
                <input
                  type="text"
                  name="indication"
                  value={form.indication}
                  onChange={handleFormChange}
                  placeholder="e.g. Severe Neonatal Jaundice, Rh Isoimmunization, Hydrops Fetalis"
                  className="input input-bordered input-sm w-full rounded-xl text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Donor Blood Group
                  </label>
                  <input
                    type="text"
                    name="donorBloodGroup"
                    value={form.donorBloodGroup}
                    onChange={handleFormChange}
                    placeholder="e.g. O Rh-Negative"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Volume Exchanged (ml)
                  </label>
                  <input
                    type="number"
                    name="volumeExchangedMl"
                    value={form.volumeExchangedMl}
                    onChange={handleFormChange}
                    placeholder="e.g. 340"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Pre-Tx Bilirubin (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="preTransfusionBilirubin"
                    value={form.preTransfusionBilirubin}
                    onChange={handleFormChange}
                    placeholder="e.g. 24.5"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Post-Tx Bilirubin (mg/dL)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="postTransfusionBilirubin"
                    value={form.postTransfusionBilirubin}
                    onChange={handleFormChange}
                    placeholder="e.g. 11.2"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Procedure & Patient Tolerance Notes
                </label>
                <textarea
                  name="doctorNote"
                  value={form.doctorNote}
                  onChange={handleFormChange}
                  rows={3}
                  placeholder="Document catheter route (umbilical venous catheter), cycle volumes, vitals tolerance, and post-procedure phototherapy continuation..."
                  className="textarea textarea-bordered w-full rounded-xl text-xs leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-sm btn-secondary rounded-xl font-semibold gap-2"
                >
                  {saving ? 'Saving Procedure...' : 'Save EBT Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default EbtTab
