import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import bloodTransfusionApi from '@/services/api/bloodTransfusionApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import {
  FaHeartbeat,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaUserMd,
  FaUserNurse,
} from 'react-icons/fa'

const BloodTransfusionTab = ({
  patientId,
  dependantId,
  consultationId,
  isDoctor = false,
  isNurse = false,
}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completingId, setCompletingId] = useState(null)

  const [form, setForm] = useState({
    note: '',
    bloodGroup: '',
    units: 1,
  })

  const loadOrders = async () => {
    try {
      setLoading(true)
      const res = await bloodTransfusionApi.getBloodTransfusionsByPatient(patientId, {
        ...(dependantId ? { dependantId } : {}),
      })
      const list = res?.data ?? res ?? []
      setOrders(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load blood transfusion orders', err)
      toast.error('Failed to load blood transfusion orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [patientId, dependantId])

  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    if (!form.note.trim()) {
      return toast.error('Please enter a clinical note for the blood transfusion order')
    }

    setSaving(true)
    try {
      await bloodTransfusionApi.createBloodTransfusionOrder({
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId,
        note: form.note.trim(),
        bloodGroup: form.bloodGroup || undefined,
        units: Number(form.units || 1),
      })
      toast.success('Blood transfusion order placed successfully')
      setShowOrderModal(false)
      setForm({ note: '', bloodGroup: '', units: 1 })
      await loadOrders()
    } catch (err) {
      console.error('Failed to create transfusion order', err)
      toast.error(err?.response?.data?.error || 'Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteOrder = async (orderId) => {
    if (!window.confirm('Mark this blood transfusion order as completed?')) return
    setCompletingId(orderId)
    try {
      await bloodTransfusionApi.completeBloodTransfusionOrder(orderId)
      toast.success('Blood transfusion recorded as completed')
      await loadOrders()
    } catch (err) {
      console.error('Failed to complete transfusion', err)
      toast.error(err?.response?.data?.error || 'Failed to mark completed')
    } finally {
      setCompletingId(null)
    }
  }

  const pendingOrders = orders.filter((o) => !o.isCompleted)
  const completedOrders = orders.filter((o) => o.isCompleted)

  return (
    <div className="space-y-6">
      {/* Header & Doctor Order Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-error/10 text-error rounded-xl">
            <FaHeartbeat className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-base-content">
              Blood Transfusion Orders & Administration
            </h3>
            <p className="text-xs text-base-content/60">
              Physician-ordered hemotherapy, cross-match directives, and nursing administration log
            </p>
          </div>
        </div>

        {/* Doctor-Only Order Button */}
        {isDoctor && (
          <button
            onClick={() => setShowOrderModal(true)}
            className="btn btn-sm btn-error rounded-xl text-white gap-2 font-semibold shadow-sm"
          >
            <FaPlus className="w-3 h-3" /> Order Blood Transfusion
          </button>
        )}
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-warning flex items-center gap-1.5">
              <FaClock className="w-3.5 h-3.5" /> Pending Administration
            </span>
            <div className="text-2xl font-black text-base-content mt-1">
              {pendingOrders.length} <span className="text-sm font-semibold text-base-content/50">order(s)</span>
            </div>
            <p className="text-[11px] text-base-content/50 mt-0.5">Awaiting nursing completion</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
            {pendingOrders.length}
          </div>
        </div>

        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-success flex items-center gap-1.5">
              <FaCheckCircle className="w-3.5 h-3.5" /> Transfusions Completed
            </span>
            <div className="text-2xl font-black text-base-content mt-1">
              {completedOrders.length} <span className="text-sm font-semibold text-base-content/50">order(s)</span>
            </div>
            <p className="text-[11px] text-base-content/50 mt-0.5">Successfully administered to patient</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-success/10 text-success flex items-center justify-center font-bold">
            {completedOrders.length}
          </div>
        </div>
      </div>

      {/* Pending Transfusions Section */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden space-y-3">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between bg-warning/5">
          <h4 className="font-bold text-base text-base-content flex items-center gap-2">
            <FaClock className="text-warning" />
            Pending Transfusions ({pendingOrders.length})
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : pendingOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-base-content/50">
            No active pending blood transfusion orders for this patient.
          </div>
        ) : (
          <div className="divide-y divide-base-200">
            {pendingOrders.map((order) => (
              <div
                key={order._id || order.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-base-200/30 transition-colors"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="badge badge-error text-white font-bold text-xs py-2 px-3">
                      {order.units || 1} Unit(s) {order.bloodGroup ? `· ${order.bloodGroup}` : ''}
                    </span>
                    <span className="badge badge-warning badge-sm font-semibold">Pending</span>
                    <span className="text-xs text-base-content/50">
                      Ordered: {formatNigeriaDateTimeShort(order.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-base-content">{order.note}</p>
                  <div className="text-xs text-base-content/60 flex items-center gap-1.5">
                    <FaUserMd className="text-primary w-3 h-3" />
                    <span>Ordered by {order.doctorName || 'Attending Physician'}</span>
                  </div>
                </div>

                {/* Only Nurse Can Mark Completed */}
                {isNurse && (
                  <div>
                    <button
                      onClick={() => handleCompleteOrder(order._id || order.id)}
                      disabled={completingId === (order._id || order.id)}
                      className="btn btn-sm btn-success rounded-xl text-white gap-2 font-semibold shadow-sm w-full sm:w-auto"
                    >
                      {completingId === (order._id || order.id) ? (
                        <>
                          <span className="loading loading-spinner loading-xs"></span>
                          Recording...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="w-3.5 h-3.5" />
                          Mark Completed
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Completed Transfusions Ledger */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <h4 className="font-bold text-base text-base-content flex items-center gap-2">
            <FaCheckCircle className="text-success" />
            Transfusion Administration History ({completedOrders.length})
          </h4>
        </div>

        {completedOrders.length === 0 ? (
          <div className="p-8 text-center text-xs text-base-content/50">
            No completed transfusion records on file.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-xs">
              <thead className="bg-base-200/60 uppercase tracking-wider text-base-content/70">
                <tr>
                  <th className="py-3 px-4">Order Directive</th>
                  <th className="py-3 px-4">Blood Product</th>
                  <th className="py-3 px-4">Ordered By</th>
                  <th className="py-3 px-4">Ordered Timestamp</th>
                  <th className="py-3 px-4">Administered By</th>
                  <th className="py-3 px-4">Administered Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {completedOrders.map((order) => (
                  <tr key={order._id || order.id} className="hover:bg-base-200/40">
                    <td className="py-3 px-4 font-medium text-base-content max-w-xs">
                      {order.note}
                    </td>
                    <td className="py-3 px-4">
                      <span className="badge badge-error/15 text-error font-bold text-xs py-1.5 px-2.5">
                        {order.units || 1} Unit(s) {order.bloodGroup ? `(${order.bloodGroup})` : ''}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-base-content/80">
                      <div className="flex items-center gap-1.5">
                        <FaUserMd className="text-primary w-3 h-3" />
                        {order.doctorName || 'Attending Physician'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-base-content/70">
                      {formatNigeriaDateTimeShort(order.orderedAt || order.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-base-content/80">
                      <div className="flex items-center gap-1.5 text-success font-medium">
                        <FaUserNurse className="w-3 h-3" />
                        {order.completedByName || 'Nurse'}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-base-content/70">
                      {formatNigeriaDateTimeShort(order.completedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Create Transfusion Order Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-base-300 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaHeartbeat className="text-error" /> Order Blood Transfusion
              </h3>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Transfusion Note / Clinical Directive *
                </label>
                <textarea
                  name="note"
                  value={form.note}
                  onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                  rows={3}
                  placeholder="e.g. Transfuse 2 units of packed cells over 4 hours under frusemide cover"
                  className="textarea textarea-bordered w-full rounded-xl text-xs leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Blood Group (Optional)
                  </label>
                  <select
                    name="bloodGroup"
                    value={form.bloodGroup}
                    onChange={(e) => setForm((f) => ({ ...f, bloodGroup: e.target.value }))}
                    className="select select-bordered select-sm w-full rounded-xl text-xs"
                  >
                    <option value="">Select Group...</option>
                    <option value="O+">O Positive (O+)</option>
                    <option value="O-">O Negative (O-)</option>
                    <option value="A+">A Positive (A+)</option>
                    <option value="A-">A Negative (A-)</option>
                    <option value="B+">B Positive (B+)</option>
                    <option value="B-">B Negative (B-)</option>
                    <option value="AB+">AB Positive (AB+)</option>
                    <option value="AB-">AB Negative (AB-)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Units Requested
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="units"
                    value={form.units}
                    onChange={(e) => setForm((f) => ({ ...f, units: e.target.value }))}
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="btn btn-sm btn-ghost rounded-xl"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-sm btn-error text-white rounded-xl font-semibold gap-2"
                >
                  {saving ? 'Placing Order...' : 'Place Transfusion Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default BloodTransfusionTab
