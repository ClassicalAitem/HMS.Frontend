import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import ivFluidApi from '@/services/api/ivFluidApi'
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils'
import {
  FaTint,
  FaPlus,
  FaCalendarAlt,
  FaTrashAlt,
  FaArrowDown,
  FaArrowUp,
  FaBalanceScale,
  FaUserMd,
  FaUserNurse,
  FaCheckCircle,
  FaPrescriptionBottleAlt,
} from 'react-icons/fa'

const COMMON_FLUIDS = [
  'Normal Saline 0.9%',
  '5% Dextrose in Water (D5W)',
  '5% Dextrose in Normal Saline (DNS)',
  'Ringer\'s Lactate (Hartmann\'s)',
  '10% Dextrose in Water (D10W)',
  '0.45% Sodium Chloride (Half Normal Saline)',
  'Custom / Other Fluid',
]

const IvFluidTab = ({
  patientId,
  dependantId,
  consultationId,
  isDoctor = false,
  isNurse = false,
}) => {
  const todayStr = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [data, setData] = useState({
    entries: [],
    orders: [],
    dailyTotalInput: 0,
    dailyTotalOutput: 0,
    date: todayStr,
  })
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)

  // Doctor order form
  const [orderForm, setOrderForm] = useState({
    fluidName: 'Normal Saline 0.9%',
    customFluidName: '',
    volumeMl: 500,
    rateOrFrequency: '500ml 8-hourly',
    instructions: '',
  })

  // Nurse intake/output form
  const [entryForm, setEntryForm] = useState({
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    inputFluid: '',
    inputAmountMl: '',
    outputType: '',
    outputAmountMl: '',
    notes: '',
  })

  const loadData = async (dateToFetch = selectedDate) => {
    try {
      setLoading(true)
      const res = await ivFluidApi.getIvFluidByPatient(patientId, {
        date: dateToFetch,
        ...(dependantId ? { dependantId } : {}),
      })
      const payload = res?.data ?? res ?? {}
      setData({
        entries: Array.isArray(payload.entries) ? payload.entries : [],
        orders: Array.isArray(payload.orders) ? payload.orders : [],
        dailyTotalInput: Number(payload.dailyTotalInput || 0),
        dailyTotalOutput: Number(payload.dailyTotalOutput || 0),
        date: payload.date || dateToFetch,
      })
    } catch (err) {
      console.error('Failed to load IV fluid records', err)
      toast.error('Failed to load fluid balance records')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData(selectedDate)
  }, [patientId, dependantId, selectedDate])

  const handleOrderChange = (e) => {
    const { name, value } = e.target
    setOrderForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleEntryChange = (e) => {
    const { name, value } = e.target
    setEntryForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSaveOrder = async (e) => {
    e.preventDefault()
    const fluidToPrescribe =
      orderForm.fluidName === 'Custom / Other Fluid'
        ? orderForm.customFluidName.trim()
        : orderForm.fluidName

    if (!fluidToPrescribe) {
      return toast.error('Please select or specify an IV fluid name')
    }
    if (!orderForm.rateOrFrequency.trim()) {
      return toast.error('Please specify the rate or infusion frequency')
    }

    setSaving(true)
    try {
      await ivFluidApi.createIvFluidOrder({
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId,
        fluidName: fluidToPrescribe,
        volumeMl: Number(orderForm.volumeMl || 500),
        rateOrFrequency: orderForm.rateOrFrequency.trim(),
        instructions: orderForm.instructions.trim(),
      })

      toast.success('IV fluid regimen prescribed successfully')
      setShowOrderModal(false)
      setOrderForm({
        fluidName: 'Normal Saline 0.9%',
        customFluidName: '',
        volumeMl: 500,
        rateOrFrequency: '500ml 8-hourly',
        instructions: '',
      })
      await loadData(selectedDate)
    } catch (err) {
      console.error('Failed to prescribe fluid', err)
      toast.error(err?.response?.data?.error || 'Failed to prescribe fluid')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    setUpdatingOrderId(orderId)
    try {
      await ivFluidApi.updateIvFluidOrderStatus(orderId, newStatus)
      toast.success(`Fluid regimen marked as ${newStatus}`)
      await loadData(selectedDate)
    } catch (err) {
      console.error('Failed to update status', err)
      toast.error('Failed to update regimen status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleSaveEntry = async (e) => {
    e.preventDefault()
    if (!entryForm.inputAmountMl && !entryForm.outputAmountMl) {
      return toast.error('Please enter either an intake or output amount')
    }

    setSaving(true)
    try {
      await ivFluidApi.createIvFluidEntry({
        patientId,
        ...(dependantId ? { dependantId } : {}),
        consultationId,
        date: selectedDate,
        time:
          entryForm.time ||
          new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        inputFluid: entryForm.inputFluid.trim(),
        inputAmountMl: entryForm.inputAmountMl ? Number(entryForm.inputAmountMl) : 0,
        outputType: entryForm.outputType.trim(),
        outputAmountMl: entryForm.outputAmountMl ? Number(entryForm.outputAmountMl) : 0,
        notes: entryForm.notes.trim(),
      })

      toast.success('Fluid intake/output balance entry recorded')
      setShowAddModal(false)
      setEntryForm({
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        inputFluid: '',
        inputAmountMl: '',
        outputType: '',
        outputAmountMl: '',
        notes: '',
      })
      await loadData(selectedDate)
    } catch (err) {
      console.error('Failed to save fluid entry', err)
      toast.error(err?.response?.data?.error || 'Failed to save entry')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this fluid chart entry?')) return
    try {
      await ivFluidApi.deleteIvFluidEntry(id)
      toast.success('Entry removed')
      await loadData(selectedDate)
    } catch (err) {
      console.error('Failed to delete fluid entry', err)
      toast.error('Failed to remove entry')
    }
  }

  const netBalance = data.dailyTotalInput - data.dailyTotalOutput
  const activeOrders = (data.orders || []).filter((o) => o.status === 'active')

  return (
    <div className="space-y-6">
      {/* Header & Role-specific actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <FaTint className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-base-content">
              IV Fluid Regimen & Intake/Output Balance
            </h3>
            <p className="text-xs text-base-content/60">
              Physician infusion directives and nursing cumulative fluid balance ledger
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Date Picker */}
          <div className="flex items-center gap-1.5 bg-base-200/70 px-3 py-1.5 rounded-xl border border-base-200">
            <FaCalendarAlt className="text-base-content/50 text-xs" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-base-content focus:outline-none"
            />
          </div>

          {/* Doctor Order Regimen Button */}
          {isDoctor && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="btn btn-sm btn-primary rounded-xl gap-2 font-semibold shadow-sm"
            >
              <FaPlus className="w-3 h-3" /> Prescribe IV Regimen
            </button>
          )}

          {/* Nurse Log Balance Button */}
          {isNurse && (
            <button
              onClick={() => setShowAddModal(true)}
              className="btn btn-sm btn-success rounded-xl text-white gap-2 font-semibold shadow-sm"
            >
              <FaPlus className="w-3 h-3" /> Log Intake / Output
            </button>
          )}
        </div>
      </div>

      {/* Active Regimen Banner (Doctors & Nurses) */}
      <div className="bg-base-100 rounded-2xl border border-base-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-base-200 pb-2">
          <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
            <FaPrescriptionBottleAlt className="text-primary" />
            Active Physician IV Fluid Regimens ({activeOrders.length})
          </h4>
          {isDoctor && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="btn btn-xs btn-outline btn-primary rounded-lg"
            >
              + New Regimen
            </button>
          )}
        </div>

        {activeOrders.length === 0 ? (
          <div className="text-xs text-base-content/50 py-3 text-center">
            No active IV fluid regimens prescribed for this patient.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeOrders.map((ord) => (
              <div
                key={ord._id || ord.id}
                className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-between gap-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-base-content">
                      {ord.fluidName} ({ord.volumeMl || 500}ml)
                    </span>
                    <span className="badge badge-primary badge-xs font-bold uppercase">
                      {ord.rateOrFrequency}
                    </span>
                  </div>
                  {ord.instructions && (
                    <p className="text-xs text-base-content/70 mt-1 italic">
                      &quot;{ord.instructions}&quot;
                    </p>
                  )}
                  <div className="text-[11px] text-base-content/60 mt-2 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <FaUserMd className="text-primary w-3 h-3" />
                      {ord.doctorName || 'Attending Physician'}
                    </span>
                    <span>{formatNigeriaDateTimeShort(ord.orderedAt || ord.createdAt)}</span>
                  </div>
                </div>

                {isNurse && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-primary/10">
                    <button
                      onClick={() => {
                        setEntryForm((prev) => ({
                          ...prev,
                          inputFluid: ord.fluidName,
                          inputAmountMl: ord.volumeMl || 500,
                        }))
                        setShowAddModal(true)
                      }}
                      className="btn btn-xs btn-success text-white rounded-lg gap-1"
                    >
                      <FaTint className="w-2.5 h-2.5" /> Log Infusion
                    </button>
                    <button
                      onClick={() => handleUpdateOrderStatus(ord._id || ord.id, 'completed')}
                      disabled={updatingOrderId === (ord._id || ord.id)}
                      className="btn btn-xs btn-outline rounded-lg gap-1"
                    >
                      <FaCheckCircle className="w-2.5 h-2.5" /> Mark Completed
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Total Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Intake */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-info flex items-center gap-1.5">
              <FaArrowDown className="w-3.5 h-3.5" /> Total Intake (Input)
            </span>
            <div className="text-2xl font-black text-base-content mt-1">
              {data.dailyTotalInput} <span className="text-sm font-semibold text-base-content/50">ml</span>
            </div>
            <p className="text-[11px] text-base-content/50 mt-0.5">Cumulative infusion for {selectedDate}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center font-bold">
            IN
          </div>
        </div>

        {/* Total Output */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-warning flex items-center gap-1.5">
              <FaArrowUp className="w-3.5 h-3.5" /> Total Output
            </span>
            <div className="text-2xl font-black text-base-content mt-1">
              {data.dailyTotalOutput} <span className="text-sm font-semibold text-base-content/50">ml</span>
            </div>
            <p className="text-[11px] text-base-content/50 mt-0.5">Urine, drainage & losses</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-warning/10 text-warning flex items-center justify-center font-bold">
            OUT
          </div>
        </div>

        {/* Net Fluid Balance */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-base-content/70 flex items-center gap-1.5">
              <FaBalanceScale className="w-3.5 h-3.5 text-primary" /> Net Fluid Balance
            </span>
            <div
              className={`text-2xl font-black mt-1 ${
                netBalance > 0 ? 'text-info' : netBalance < 0 ? 'text-warning' : 'text-base-content'
              }`}
            >
              {netBalance > 0 ? `+${netBalance}` : netBalance}{' '}
              <span className="text-sm font-semibold text-base-content/50">ml</span>
            </div>
            <p className="text-[11px] text-base-content/50 mt-0.5">
              {netBalance > 0 ? 'Positive balance (retaining)' : netBalance < 0 ? 'Negative balance (deficit)' : 'Even balance'}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            NET
          </div>
        </div>
      </div>

      {/* Fluid Balance Log Table */}
      <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-base-200 flex items-center justify-between">
          <h4 className="font-bold text-base text-base-content">
            Fluid Balance Log for {selectedDate} ({data.entries.length} entries)
          </h4>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </div>
        ) : data.entries.length === 0 ? (
          <div className="p-10 text-center text-xs text-base-content/50">
            No fluid balance entries logged for {selectedDate}.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm w-full text-xs min-w-[650px]">
              <thead className="bg-base-200/60 uppercase tracking-wider text-base-content/70">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Fluid Intake (Infusion)</th>
                  <th className="py-3 px-4 text-info">Input (ml)</th>
                  <th className="py-3 px-4">Output Classification</th>
                  <th className="py-3 px-4 text-warning">Output (ml)</th>
                  <th className="py-3 px-4">Logged By / Remarks</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {data.entries.map((entry) => (
                  <tr key={entry._id || entry.id} className="hover:bg-base-200/40">
                    <td className="py-3 px-4 font-bold text-base-content">{entry.time}</td>
                    <td className="py-3 px-4 font-medium text-base-content">
                      {entry.inputFluid || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-info">
                      {entry.inputAmountMl ? `${entry.inputAmountMl} ml` : '—'}
                    </td>
                    <td className="py-3 px-4 font-medium text-base-content">
                      {entry.outputType || '—'}
                    </td>
                    <td className="py-3 px-4 font-bold text-warning">
                      {entry.outputAmountMl ? `${entry.outputAmountMl} ml` : '—'}
                    </td>
                    <td className="py-3 px-4 text-base-content/70">
                      <div className="flex items-center gap-1 font-medium text-base-content">
                        <FaUserNurse className="text-success w-3 h-3" />
                        {entry.recordedByName || 'Nurse'}
                      </div>
                      {entry.notes && (
                        <div className="text-[11px] text-base-content/50 italic mt-0.5">{entry.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(entry._id || entry.id)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-lg"
                      >
                        <FaTrashAlt className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Prescribe IV Fluid Regimen Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-base-300 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaPrescriptionBottleAlt className="text-primary" /> Prescribe IV Fluid Regimen
              </h3>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Fluid Selection *
                </label>
                <select
                  name="fluidName"
                  value={orderForm.fluidName}
                  onChange={handleOrderChange}
                  className="select select-bordered select-sm w-full rounded-xl text-xs"
                >
                  {COMMON_FLUIDS.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>

              {orderForm.fluidName === 'Custom / Other Fluid' && (
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Custom Fluid Formulation *
                  </label>
                  <input
                    type="text"
                    name="customFluidName"
                    value={orderForm.customFluidName}
                    onChange={handleOrderChange}
                    placeholder="e.g. 5% Dextrose in 0.45% Saline + 20mEq KCl"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Volume (ml) *
                  </label>
                  <input
                    type="number"
                    name="volumeMl"
                    value={orderForm.volumeMl}
                    onChange={handleOrderChange}
                    placeholder="500"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Rate / Frequency *
                  </label>
                  <input
                    type="text"
                    name="rateOrFrequency"
                    value={orderForm.rateOrFrequency}
                    onChange={handleOrderChange}
                    placeholder="e.g. 500ml 8-hourly, 30 drops/min"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Clinical Directives / Notes
                </label>
                <textarea
                  name="instructions"
                  value={orderForm.instructions}
                  onChange={handleOrderChange}
                  placeholder="Special instructions for nursing administration, cannula site, additives..."
                  className="textarea textarea-bordered textarea-sm w-full rounded-xl text-xs h-20"
                />
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
                  className="btn btn-sm btn-primary rounded-xl font-semibold"
                >
                  {saving ? 'Prescribing...' : 'Prescribe Regimen'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Nurse Record Intake/Output Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-base-300 space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaTint className="text-success" /> Record Fluid Intake & Output
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="btn btn-sm btn-ghost btn-circle"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Time (HH:mm) *
                  </label>
                  <input
                    type="time"
                    name="time"
                    value={entryForm.time}
                    onChange={handleEntryChange}
                    className="input input-bordered input-sm w-full rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-base-content/70 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="input input-bordered input-sm w-full rounded-xl"
                  />
                </div>
              </div>

              {/* Intake section */}
              <div className="bg-info/5 p-3 rounded-xl border border-info/20 space-y-2">
                <h5 className="text-xs font-bold text-info uppercase tracking-wider">
                  Fluid Intake (Infusion / Oral)
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="inputFluid"
                    value={entryForm.inputFluid}
                    onChange={handleEntryChange}
                    placeholder="e.g. Normal Saline, D5W, Oral Water"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    name="inputAmountMl"
                    value={entryForm.inputAmountMl}
                    onChange={handleEntryChange}
                    placeholder="Infused (ml) e.g. 500"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Output section */}
              <div className="bg-warning/5 p-3 rounded-xl border border-warning/20 space-y-2">
                <h5 className="text-xs font-bold text-warning uppercase tracking-wider">
                  Fluid Output (Excretion / Losses)
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    name="outputType"
                    value={entryForm.outputType}
                    onChange={handleEntryChange}
                    placeholder="e.g. Urine, Vomitus, Drain"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                  <input
                    type="number"
                    name="outputAmountMl"
                    value={entryForm.outputAmountMl}
                    onChange={handleEntryChange}
                    placeholder="Output (ml) e.g. 350"
                    className="input input-bordered input-sm w-full rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  name="notes"
                  value={entryForm.notes}
                  onChange={handleEntryChange}
                  placeholder="e.g. Infused via 20G IV cannula; clear straw-colored urine"
                  className="input input-bordered input-sm w-full rounded-xl text-xs"
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
                  className="btn btn-sm btn-success text-white rounded-xl font-semibold gap-2"
                >
                  {saving ? 'Saving...' : 'Save Balance Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default IvFluidTab
