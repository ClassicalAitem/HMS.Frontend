import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import bloodTransfusionApi from '@/services/api/bloodTransfusionApi'
import { getServiceCharges } from '@/services/api/serviceChargesAPI'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import {
  FaHeartbeat,
  FaPlus,
  FaCheckCircle,
  FaClock,
  FaUserMd,
  FaUserNurse,
  FaShieldAlt,
  FaMoneyBillWave,
  FaSearch,
  FaExclamationTriangle,
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

  // Laboratory service charges
  const [labServices, setLabServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedService, setSelectedService] = useState(null)

  const [form, setForm] = useState({
    note: '',
    bloodGroup: '',
    units: 1,
    unitPrice: 0,
    amount: 0,
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

  const loadLabServices = async () => {
    try {
      setLoadingServices(true)
      const res = await getServiceCharges()
      const raw = res?.data ?? res ?? []
      const list = Array.isArray(raw) ? raw : raw?.data ?? []
      // Filter for laboratory service charges
      const filtered = list.filter((s) => {
        const cat = String(s?.category || '').toLowerCase()
        return cat.includes('lab') || cat.includes('laboratory')
      })
      setLabServices(filtered.length > 0 ? filtered : list)
    } catch (err) {
      console.error('Failed to load lab services', err)
    } finally {
      setLoadingServices(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [patientId, dependantId])

  useEffect(() => {
    if (showOrderModal && labServices.length === 0) {
      loadLabServices()
    }
  }, [showOrderModal])

  const filteredLabServices = useMemo(() => {
    const q = serviceSearch.trim().toLowerCase()
    if (!q) {
      // Prioritize blood-related lab charges first
      return [...labServices].sort((a, b) => {
        const aName = (a.service || a.name || '').toLowerCase()
        const bName = (b.service || b.name || '').toLowerCase()
        const aIsBlood = aName.includes('blood') || aName.includes('transfus') || aName.includes('cross')
        const bIsBlood = bName.includes('blood') || bName.includes('transfus') || bName.includes('cross')
        if (aIsBlood && !bIsBlood) return -1
        if (!aIsBlood && bIsBlood) return 1
        return 0
      })
    }
    return labServices.filter((s) => {
      const name = String(s?.service || s?.name || '').toLowerCase()
      const code = String(s?.code || '').toLowerCase()
      return name.includes(q) || code.includes(q)
    })
  }, [labServices, serviceSearch])

  const handleSelectService = (service) => {
    setSelectedService(service)
    const unitPrice = Number(service?.amount || 0)
    const currentUnits = Number(form.units || 1)
    setForm((prev) => ({
      ...prev,
      unitPrice,
      amount: unitPrice * currentUnits,
    }))
  }

  const handleUnitsChange = (newUnits) => {
    const units = Math.max(1, Number(newUnits) || 1)
    setForm((prev) => ({
      ...prev,
      units,
      amount: prev.unitPrice ? prev.unitPrice * units : prev.amount,
    }))
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault()
    if (!form.note.trim()) {
      return toast.error('Please enter a clinical note for the blood transfusion order')
    }

    setSaving(true)
    try {
      const units = Number(form.units || 1)
      const calculatedAmount = form.amount || (form.unitPrice ? form.unitPrice * units : 0)

      await bloodTransfusionApi.createBloodTransfusionOrder({
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId,
        note: form.note.trim(),
        bloodGroup: form.bloodGroup || undefined,
        units,
        serviceChargeId: selectedService?.id || selectedService?._id || undefined,
        serviceName: selectedService?.service || selectedService?.name || undefined,
        amount: calculatedAmount > 0 ? calculatedAmount : undefined,
      })

      toast.success('Blood transfusion order placed and billed to Laboratory')
      setShowOrderModal(false)
      setForm({ note: '', bloodGroup: '', units: 1, unitPrice: 0, amount: 0 })
      setSelectedService(null)
      setServiceSearch('')
      await loadOrders()
    } catch (err) {
      console.error('Failed to create transfusion order', err)
      toast.error(err?.response?.data?.error || 'Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  const handleCompleteOrder = async (order) => {
    const orderId = order._id || order.id
    const isCleared = order.isPaid || order.paymentStatus === 'paid' || order.paymentStatus === 'approved'

    if (!isCleared) {
      const confirmProceed = window.confirm(
        '⚠️ Warning: This blood transfusion order has NOT been paid or approved by HMO yet.\n\nAre you sure you want to proceed and administer the transfusion?'
      )
      if (!confirmProceed) return
    } else {
      if (!window.confirm('Mark this blood transfusion order as completed?')) return
    }

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

  const renderPaymentBadge = (order) => {
    const status = order.paymentStatus || (order.isPaid ? 'paid' : 'pending')
    if (status === 'paid' || order.isPaid) {
      return (
        <span className="badge badge-success text-white font-bold text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs">
          <FaCheckCircle className="w-3 h-3" /> Paid
        </span>
      )
    }
    if (status === 'approved') {
      return (
        <span className="badge badge-info text-white font-bold text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs">
          <FaShieldAlt className="w-3 h-3" /> HMO Approved
        </span>
      )
    }
    return (
      <span className="badge badge-warning text-base-content font-bold text-xs py-2 px-3 flex items-center gap-1.5 shadow-xs">
        <FaClock className="w-3 h-3" /> Awaiting Payment / Approval
      </span>
    )
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
              Laboratory-billed blood transfusion directives, payment verification, and nursing administration log
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
            {pendingOrders.map((order) => {
              const isCleared = order.isPaid || order.paymentStatus === 'paid' || order.paymentStatus === 'approved'

              return (
                <div
                  key={order._id || order.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-base-200/30 transition-colors"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge badge-error text-white font-bold text-xs py-2 px-3">
                        {order.units || 1} Unit(s) {order.bloodGroup ? `· ${order.bloodGroup}` : ''}
                      </span>
                      {renderPaymentBadge(order)}
                      <span className="text-xs text-base-content/50">
                        Ordered: {formatNigeriaDateTimeShort(order.createdAt)}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-base-content">{order.note}</p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-base-content/70">
                      <div className="flex items-center gap-1.5">
                        <FaUserMd className="text-primary w-3 h-3" />
                        <span>Ordered by {order.doctorName || 'Attending Physician'}</span>
                      </div>
                      {order.serviceName && (
                        <div className="flex items-center gap-1 text-base-content/60">
                          <FaMoneyBillWave className="w-3 h-3 text-success" />
                          <span>Lab Charge: {order.serviceName}</span>
                        </div>
                      )}
                      {order.amount !== undefined && order.amount !== null && (
                        <div className="font-semibold text-base-content">
                          Billed: ₦{Number(order.amount).toLocaleString()}
                        </div>
                      )}
                    </div>

                    {/* Nurse Payment Clearance Banner */}
                    {isNurse && (
                      <div className="pt-1">
                        {isCleared ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success text-[11px] font-semibold border border-success/20">
                            <FaCheckCircle className="w-3 h-3" /> Payment Cleared: Approved for transfusion administration
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 text-warning-content text-[11px] font-semibold border border-warning/30">
                            <FaExclamationTriangle className="w-3 h-3 text-warning" /> Payment Pending: Awaiting Cashier receipt or HMO authorization
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Nurse Action Button */}
                  {isNurse && (
                    <div className="shrink-0">
                      <button
                        onClick={() => handleCompleteOrder(order)}
                        disabled={completingId === (order._id || order.id)}
                        className={`btn btn-sm rounded-xl text-white gap-2 font-semibold shadow-sm w-full sm:w-auto ${
                          isCleared ? 'btn-success' : 'btn-warning text-black'
                        }`}
                      >
                        {completingId === (order._id || order.id) ? (
                          <>
                            <span className="loading loading-spinner loading-xs"></span>
                            Recording...
                          </>
                        ) : (
                          <>
                            <FaCheckCircle className="w-3.5 h-3.5" />
                            {isCleared ? 'Mark Completed' : 'Administer (Pending Payment)'}
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
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
                  <th className="py-3 px-4">Billing Status</th>
                  <th className="py-3 px-4">Ordered By</th>
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
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        {renderPaymentBadge(order)}
                        {order.amount && (
                          <div className="text-[11px] font-semibold text-base-content/70">
                            ₦{Number(order.amount).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-base-content/80">
                      <div className="flex items-center gap-1.5">
                        <FaUserMd className="text-primary w-3 h-3" />
                        {order.doctorName || 'Attending Physician'}
                      </div>
                      <span className="text-[11px] text-base-content/50">
                        {formatNigeriaDateTimeShort(order.orderedAt || order.createdAt)}
                      </span>
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
          <div className="bg-base-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-base-300 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaHeartbeat className="text-error" /> Order Blood Transfusion (Laboratory Charge)
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
              {/* Laboratory Service Charge Picker */}
              <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300 space-y-2">
                <label className="block text-xs font-bold text-base-content flex items-center justify-between">
                  <span>Select Laboratory Service Charge *</span>
                  <span className="text-[11px] text-primary font-normal">Billed under Laboratory</span>
                </label>

                <div className="relative">
                  <FaSearch className="absolute left-3 top-2.5 text-base-content/40 text-xs" />
                  <input
                    type="text"
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    placeholder="Search blood test / transfusion service charge..."
                    className="input input-bordered input-sm w-full pl-8 rounded-xl text-xs"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-base-300 rounded-xl bg-base-100 divide-y divide-base-200 text-xs">
                  {loadingServices ? (
                    <div className="p-3 text-center text-xs text-base-content/50">
                      Loading Laboratory service charges...
                    </div>
                  ) : filteredLabServices.length === 0 ? (
                    <div className="p-3 text-center text-xs text-base-content/50">
                      No matching laboratory service charges found
                    </div>
                  ) : (
                    filteredLabServices.map((srv) => {
                      const isSel = (selectedService?.id || selectedService?._id) === (srv.id || srv._id)
                      return (
                        <div
                          key={srv.id || srv._id}
                          onClick={() => handleSelectService(srv)}
                          className={`p-2.5 cursor-pointer flex items-center justify-between transition-colors ${
                            isSel ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-base-200/60'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="truncate font-medium">{srv.service || srv.name}</div>
                            <div className="text-[10px] text-base-content/50 uppercase">{srv.category || 'Laboratory'}</div>
                          </div>
                          <div className="font-bold text-xs whitespace-nowrap">
                            ₦{Number(srv.amount || 0).toLocaleString()}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {selectedService && (
                  <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-semibold text-primary">Selected: </span>
                      <span className="font-medium text-base-content">{selectedService.service || selectedService.name}</span>
                    </div>
                    <div className="font-bold text-primary">
                      ₦{Number(selectedService.amount || 0).toLocaleString()} / unit
                    </div>
                  </div>
                )}
              </div>

              {/* Directive Note */}
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
                    Units Requested *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    name="units"
                    value={form.units}
                    onChange={(e) => handleUnitsChange(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              {/* Total Billed Amount Display */}
              <div className="p-3 rounded-xl bg-base-200/60 border border-base-300 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-base-content/80">Total Billed to Laboratory:</span>
                  <p className="text-[11px] text-base-content/50">Routed to HMO or Cashier for payment/approval</p>
                </div>
                <div className="text-base font-black text-error">
                  ₦{Number(form.amount || 0).toLocaleString()}
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
                  {saving ? 'Placing Order...' : 'Place & Bill Transfusion'}
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

