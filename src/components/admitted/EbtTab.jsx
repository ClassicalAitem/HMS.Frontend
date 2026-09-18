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
  FaCheckCircle,
  FaClock,
  FaSearch,
  FaTrashAlt,
  FaPlay,
} from 'react-icons/fa'
import { getInventories } from '@/services/api/inventoryAPI'

const EbtTab = ({
  patientId,
  dependantId,
  consultationId,
  isDoctor = false,
  isNurse = false,
  isPharmacist = false,
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

  // Nursing Workflow States
  const [showConsumablesModal, setShowConsumablesModal] = useState(null)
  const [consumableSearch, setConsumableSearch] = useState('')
  const [inventoryList, setInventoryList] = useState([])
  const [selectedConsumables, setSelectedConsumables] = useState([])
  const [loadingInventory, setLoadingInventory] = useState(false)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [dispensingId, setDispensingId] = useState(null)
  
  const [confirmStartModal, setConfirmStartModal] = useState(null)
  const [confirmCompleteModal, setConfirmCompleteModal] = useState(null)
  const [addNoteModal, setAddNoteModal] = useState(null)
  const [nurseNoteInput, setNurseNoteInput] = useState('')

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

  const searchInventory = async (term) => {
    try {
      setLoadingInventory(true)
      const res = await getInventories({ search: term, limit: 10 })
      setInventoryList(res?.data?.inventories || res?.data || [])
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoadingInventory(false)
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (consumableSearch.trim().length > 1) {
        searchInventory(consumableSearch)
      } else {
        setInventoryList([])
      }
    }, 500)
    return () => clearTimeout(timeoutId)
  }, [consumableSearch])

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

  const handleUpdateStatus = async (recordId, newStatus, note = '') => {
    setUpdatingOrderId(recordId)
    try {
      await ebtApi.updateEbtStatus(recordId, newStatus, note)
      toast.success(`EBT procedure marked as ${newStatus}`)
      setConfirmStartModal(null)
      setConfirmCompleteModal(null)
      setAddNoteModal(null)
      setNurseNoteInput('')
      await loadRecords()
    } catch (err) {
      console.error('Failed to update status', err)
      toast.error('Failed to update EBT status')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  const handleOrderConsumables = async (e) => {
    e.preventDefault()
    if (!showConsumablesModal) return
    if (selectedConsumables.length === 0) {
      return toast.error('Please select at least one consumable item')
    }

    setSaving(true)
    const recordId = showConsumablesModal._id || showConsumablesModal.id
    try {
      const items = selectedConsumables.map(c => ({
        itemName: c.name || c.itemName,
        quantity: c.quantity || 1
      }))
      await ebtApi.orderEbtConsumables(recordId, { items })
      toast.success('Consumables ordered and sent to Pharmacy')
      setShowConsumablesModal(null)
      setSelectedConsumables([])
      setConsumableSearch('')
      await loadRecords()
    } catch (err) {
      console.error('Failed to order consumables', err)
      toast.error(err?.response?.data?.error || 'Failed to order consumables')
    } finally {
      setSaving(false)
    }
  }

  const handleDispenseConsumable = async (recordId, consumableId) => {
    setDispensingId(consumableId)
    try {
      await ebtApi.dispenseEbtConsumables(recordId, consumableId)
      toast.success('Consumables marked as dispensed')
      await loadRecords()
    } catch (err) {
      console.error('Failed to dispense consumables', err)
      toast.error(err?.response?.data?.error || 'Failed to dispense consumables')
    } finally {
      setDispensingId(null)
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
                      
                      {/* Status Badge */}
                      {item.status === 'completed' && (
                        <span className="badge badge-success text-white badge-xs font-bold gap-1">
                          <FaCheckCircle className="w-2.5 h-2.5" /> Completed
                        </span>
                      )}
                      {item.status === 'in_progress' && (
                        <span className="badge badge-warning text-black badge-xs font-bold gap-1">
                          <FaPlay className="w-2.5 h-2.5" /> In Progress
                        </span>
                      )}
                      {(!item.status || item.status === 'active') && (
                        <span className="badge badge-info text-white badge-xs font-bold gap-1">
                          <FaClock className="w-2.5 h-2.5" /> Pending Start
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

                  {item.nurseNote && (
                    <div className="text-xs text-base-content/80 bg-base-100 p-2.5 rounded-lg border border-base-200">
                      <span className="font-semibold text-base-content block mb-0.5">Nursing Observation Notes:</span>
                      {item.nurseNote}
                    </div>
                  )}

                  {/* Consumables History Display */}
                  {item.consumableOrders && item.consumableOrders.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {item.consumableOrders.map((cons) => (
                        <div key={cons._id || cons.id} className="p-2.5 rounded-xl bg-base-200/50 border border-base-300 text-xs">
                          <div className="flex items-center justify-between mb-1.5 border-b border-base-200 pb-1.5">
                            <span className="font-semibold text-secondary flex items-center gap-1.5">
                              <FaPlus className="w-3 h-3" /> Consumables Order
                            </span>
                            {cons.isDispensed ? (
                              <span className="badge badge-success text-white badge-xs font-bold gap-1">
                                <FaCheckCircle className="w-2.5 h-2.5" /> Dispensed
                              </span>
                            ) : (
                              <span className="badge badge-warning badge-xs font-bold gap-1">
                                <FaClock className="w-2.5 h-2.5" /> Pending Pharmacy
                              </span>
                            )}
                          </div>
                          <ul className="space-y-1 pl-1">
                            {cons.items.map((cItem, idx) => (
                              <li key={idx} className="font-medium text-base-content/80">• {cItem.quantity}x {cItem.itemName}</li>
                            ))}
                          </ul>
                          <div className="mt-1.5 pt-1.5 border-t border-base-200/50 text-[10px] text-base-content/60 flex flex-wrap justify-between gap-2">
                            <span>Ordered by {cons.orderedByName}</span>
                            {cons.isDispensed && <span className="text-success">Dispensed by {cons.dispensedByName}</span>}
                          </div>
                          
                          {/* Pharmacist Action */}
                          {isPharmacist && !cons.isDispensed && (
                            <div className="mt-2 pt-2 border-t border-base-200 flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDispenseConsumable(item._id || item.id, cons._id || cons.id)}
                                disabled={dispensingId === (cons._id || cons.id)}
                                className="btn btn-xs btn-secondary rounded-lg font-bold shadow-sm"
                              >
                                {dispensingId === (cons._id || cons.id) ? 'Marking...' : 'Mark Dispensed'}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[11px] text-base-content/50 flex flex-col gap-1 pt-1">
                    <div className="flex items-center gap-1.5">
                      <FaUserMd className="text-primary w-3 h-3" />
                      <span>Prescribed by {item.doctorName || 'Doctor'}</span>
                    </div>
                    {item.inProgressByName && (
                      <div className="flex items-center gap-1.5 text-warning-content">
                        <FaPlay className="text-warning w-3 h-3" />
                        <span>Started by {item.inProgressByName} at {formatNigeriaDateTimeShort(item.inProgressAt)}</span>
                      </div>
                    )}
                    {item.completedByName && (
                      <div className="flex items-center gap-1.5 text-success">
                        <FaCheckCircle className="text-success w-3 h-3" />
                        <span>Completed by {item.completedByName} at {formatNigeriaDateTimeShort(item.completedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Nurse Actions */}
                  {isNurse && item.status !== 'completed' && (
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-secondary/10 mt-2">
                      <button
                        onClick={() => setShowConsumablesModal(item)}
                        className="btn btn-xs btn-outline rounded-lg gap-1"
                      >
                        <FaPlus className="w-2.5 h-2.5" /> Order Consumables
                      </button>
                      
                      {(!item.status || item.status === 'active') ? (
                        <button
                          onClick={() => setConfirmStartModal(item)}
                          className="btn btn-xs btn-warning text-black rounded-lg gap-1"
                        >
                          <FaPlay className="w-2.5 h-2.5" /> Start Procedure
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setAddNoteModal(item)
                              setNurseNoteInput(item.nurseNote || '')
                            }}
                            className="btn btn-xs btn-info text-white rounded-lg gap-1"
                          >
                            <FaNotesMedical className="w-2.5 h-2.5" /> Add Note
                          </button>
                          <button
                            onClick={() => setConfirmCompleteModal(item)}
                            className="btn btn-xs btn-success text-white rounded-lg gap-1"
                          >
                            <FaCheckCircle className="w-2.5 h-2.5" /> Mark Completed
                          </button>
                        </>
                      )}
                    </div>
                  )}
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

      {/* Consumables Order Modal */}
      {showConsumablesModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-lg w-full shadow-2xl border border-base-300 flex flex-col max-h-[90vh] animate-scaleUp">
            <div className="flex items-center justify-between p-4 border-b border-base-200">
              <div>
                <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
                  <FaPlus className="text-secondary w-4 h-4" /> Order EBT Consumables
                </h3>
                <p className="text-xs text-base-content/60 mt-0.5">
                  For EBT: {showConsumablesModal.indication}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConsumablesModal(null)
                  setSelectedConsumables([])
                  setConsumableSearch('')
                }}
                className="btn btn-ghost btn-circle btn-sm"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Search Pharmacy/Inventory Items
                </label>
                <div className="relative">
                  <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                  <input
                    type="text"
                    value={consumableSearch}
                    onChange={(e) => setConsumableSearch(e.target.value)}
                    placeholder="e.g. EBT Set, Syringe..."
                    className="input input-bordered input-sm w-full pl-9 rounded-xl text-sm"
                  />
                  {loadingInventory && (
                    <span className="loading loading-spinner loading-xs absolute right-3 top-1/2 -translate-y-1/2 text-secondary"></span>
                  )}
                </div>

                {consumableSearch.length > 1 && inventoryList.length > 0 && (
                  <div className="mt-2 border border-base-200 rounded-xl overflow-hidden shadow-sm max-h-40 overflow-y-auto">
                    {inventoryList.map((item) => (
                      <div
                        key={item._id || item.id}
                        className="p-2 hover:bg-base-200/50 cursor-pointer text-sm flex items-center justify-between border-b border-base-200 last:border-0"
                        onClick={() => {
                          if (!selectedConsumables.find(c => (c.id || c._id) === (item.id || item._id))) {
                            setSelectedConsumables([...selectedConsumables, { ...item, quantity: 1 }])
                          }
                          setConsumableSearch('')
                        }}
                      >
                        <span className="font-medium text-base-content">{item.itemName || item.name}</span>
                        <FaPlus className="w-3 h-3 text-secondary" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {selectedConsumables.length > 0 && (
                <div className="bg-base-200/30 p-3 rounded-xl border border-base-200 space-y-2">
                  <h4 className="text-xs font-bold text-base-content uppercase tracking-wider">
                    Selected Items
                  </h4>
                  <div className="space-y-2">
                    {selectedConsumables.map((item, idx) => (
                      <div key={item._id || item.id || idx} className="flex flex-col sm:flex-row sm:items-center justify-between bg-base-100 p-2.5 rounded-lg border border-base-200 shadow-sm gap-2">
                        <div className="text-sm font-medium text-base-content truncate">
                          {item.itemName || item.name}
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                          <input
                            type="number"
                            min="1"
                            className="input input-bordered input-xs w-16 text-center"
                            value={item.quantity}
                            onChange={(e) => {
                              const newQty = parseInt(e.target.value) || 1
                              const updated = [...selectedConsumables]
                              updated[idx].quantity = newQty
                              setSelectedConsumables(updated)
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...selectedConsumables]
                              updated.splice(idx, 1)
                              setSelectedConsumables(updated)
                            }}
                            className="btn btn-ghost btn-xs text-error p-1"
                          >
                            <FaTrashAlt className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-2 border-t border-base-200 mt-2">
                    <p className="text-[10px] text-base-content/50 italic text-center">
                      Note: You are currently ordering consumables without billing attached. 
                      Once confirmed, they will be sent to the Pharmacist for dispensing.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-base-200 bg-base-200/30 flex justify-end gap-3 rounded-b-2xl">
              <button
                type="button"
                onClick={() => {
                  setShowConsumablesModal(null)
                  setSelectedConsumables([])
                  setConsumableSearch('')
                }}
                className="btn btn-sm btn-ghost rounded-xl"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleOrderConsumables}
                disabled={saving || selectedConsumables.length === 0}
                className="btn btn-sm btn-secondary text-white rounded-xl font-bold shadow-sm"
              >
                {saving ? 'Placing Order...' : 'Place Consumables Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Modal */}
      {confirmStartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-warning/30 space-y-4 animate-scaleUp">
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <FaPlay className="text-warning" /> Start EBT Procedure?
            </h3>
            <p className="text-sm text-base-content/80">
              Are you about to commence the Exchange Blood Transfusion for this patient?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmStartModal(null)}
                className="btn btn-sm btn-ghost rounded-xl"
                disabled={updatingOrderId === (confirmStartModal._id || confirmStartModal.id)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(confirmStartModal._id || confirmStartModal.id, 'in_progress')}
                disabled={updatingOrderId === (confirmStartModal._id || confirmStartModal.id)}
                className="btn btn-sm btn-warning text-black rounded-xl font-semibold"
              >
                {updatingOrderId === (confirmStartModal._id || confirmStartModal.id) ? 'Starting...' : 'Yes, Start Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Modal */}
      {confirmCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-success/30 space-y-4 animate-scaleUp">
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <FaCheckCircle className="text-success" /> Mark Completed?
            </h3>
            <p className="text-sm text-base-content/80">
              Are you sure the Exchange Blood Transfusion has been completed successfully?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmCompleteModal(null)}
                className="btn btn-sm btn-ghost rounded-xl"
                disabled={updatingOrderId === (confirmCompleteModal._id || confirmCompleteModal.id)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(confirmCompleteModal._id || confirmCompleteModal.id, 'completed', confirmCompleteModal.nurseNote)}
                disabled={updatingOrderId === (confirmCompleteModal._id || confirmCompleteModal.id)}
                className="btn btn-sm btn-success text-white rounded-xl font-semibold"
              >
                {updatingOrderId === (confirmCompleteModal._id || confirmCompleteModal.id) ? 'Completing...' : 'Yes, Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {addNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-info/30 space-y-4 animate-scaleUp">
            <h3 className="font-bold text-lg text-base-content flex items-center gap-2">
              <FaNotesMedical className="text-info" /> Nursing Observation Note
            </h3>
            <textarea
              rows={4}
              value={nurseNoteInput}
              onChange={(e) => setNurseNoteInput(e.target.value)}
              placeholder="e.g. Vitals stable, cycles tolerated well. No reactions noted..."
              className="textarea textarea-bordered w-full rounded-xl text-sm leading-relaxed"
            />
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setAddNoteModal(null)
                  setNurseNoteInput('')
                }}
                className="btn btn-sm btn-ghost rounded-xl"
                disabled={updatingOrderId === (addNoteModal._id || addNoteModal.id)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(addNoteModal._id || addNoteModal.id, 'in_progress', nurseNoteInput)}
                disabled={updatingOrderId === (addNoteModal._id || addNoteModal.id) || !nurseNoteInput.trim()}
                className="btn btn-sm btn-info text-white rounded-xl font-semibold"
              >
                {updatingOrderId === (addNoteModal._id || addNoteModal.id) ? 'Saving...' : 'Save Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EbtTab
