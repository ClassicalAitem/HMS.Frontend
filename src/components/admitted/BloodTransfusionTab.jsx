import React, { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import bloodTransfusionApi from '@/services/api/bloodTransfusionApi'
import { getServiceCharges } from '@/services/api/serviceChargesAPI'
import { getInventories } from '@/services/api/inventoryAPI'
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
  admissionId,
  isDoctor = false,
  isNurse = false,
  isPharmacist = false,
}) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [completingId, setCompletingId] = useState(null)
  const [dispensingId, setDispensingId] = useState(null)
  const [administeringId, setAdministeringId] = useState(null)
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState(null)
  const [startOrderModal, setStartOrderModal] = useState(null)
  const [completeOrderModal, setCompleteOrderModal] = useState(null)

  // Laboratory service charges
  const [labServices, setLabServices] = useState([])
  const [loadingServices, setLoadingServices] = useState(false)
  const [serviceSearch, setServiceSearch] = useState('')
  const [selectedService, setSelectedService] = useState(null)

  // Prepping medications (Inventories)
  const [inventories, setInventories] = useState([])
  const [loadingInventories, setLoadingInventories] = useState(false)
  const [medSearch, setMedSearch] = useState('')
  const [selectedMeds, setSelectedMeds] = useState([])

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

  const loadInventories = async () => {
    try {
      setLoadingInventories(true)
      const res = await getInventories()
      const raw = res?.data ?? res ?? []
      const list = Array.isArray(raw) ? raw : raw?.data ?? []
      setInventories(list)
    } catch (err) {
      console.error('Failed to load inventories', err)
    } finally {
      setLoadingInventories(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [patientId, dependantId])

  useEffect(() => {
    if (showOrderModal) {
      if (labServices.length === 0) loadLabServices()
      if (inventories.length === 0) loadInventories()
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

  const filteredInventories = useMemo(() => {
    const q = medSearch.trim().toLowerCase()
    if (!q) return []
    return inventories.filter((inv) => {
      const name = String(inv?.name || '').toLowerCase()
      return name.includes(q)
    }).slice(0, 20) // limit results for performance
  }, [inventories, medSearch])

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

  const handleAddMed = (inv) => {
    const alreadyAdded = selectedMeds.find((m) => m.medicationId === (inv.id || inv._id))
    if (alreadyAdded) return toast.error('Medication already added to prep list')

    setSelectedMeds((prev) => [
      ...prev,
      {
        medicationId: inv.id || inv._id,
        medicationName: inv.name,
        dosage: 'STAT',
        note: '',
      },
    ])
    setMedSearch('')
  }

  const handleRemoveMed = (medId) => {
    setSelectedMeds((prev) => prev.filter((m) => m.medicationId !== medId))
  }

  const handleUpdateMed = (medId, field, value) => {
    setSelectedMeds((prev) =>
      prev.map((m) => (m.medicationId === medId ? { ...m, [field]: value } : m))
    )
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
        admissionId,
        note: form.note.trim(),
        bloodGroup: form.bloodGroup || undefined,
        units,
        serviceChargeId: selectedService?.id || selectedService?._id || undefined,
        serviceName: selectedService?.service || selectedService?.name || undefined,
        amount: calculatedAmount > 0 ? calculatedAmount : undefined,
        preppingMedications: selectedMeds.length > 0 ? selectedMeds : undefined,
      })

      toast.success('Blood transfusion order placed and billed to Laboratory')
      setShowOrderModal(false)
      setForm({ note: '', bloodGroup: '', units: 1, unitPrice: 0, amount: 0 })
      setSelectedService(null)
      setServiceSearch('')
      setSelectedMeds([])
      setMedSearch('')
      await loadOrders()
    } catch (err) {
      console.error('Failed to create transfusion order', err)
      toast.error(err?.response?.data?.error || 'Failed to place order')
    } finally {
      setSaving(false)
    }
  }

  const handleStartOrder = (order) => {
    setStartOrderModal(order)
  }

  const executeStartOrder = async () => {
    if (!startOrderModal) return
    const orderId = startOrderModal._id || startOrderModal.id
    setCompletingId(orderId)
    try {
      await bloodTransfusionApi.startBloodTransfusionOrder(orderId)
      toast.success('Blood transfusion marked as In Progress')
      await loadOrders()
      setStartOrderModal(null)
    } catch (err) {
      console.error('Failed to start transfusion', err)
      toast.error(err?.response?.data?.error || 'Failed to mark in progress')
    } finally {
      setCompletingId(null)
    }
  }

  const handleCompleteOrder = (order) => {
    setCompleteOrderModal(order)
  }

  const executeCompleteOrder = async () => {
    if (!completeOrderModal) return
    const orderId = completeOrderModal._id || completeOrderModal.id
    setCompletingId(orderId)
    try {
      await bloodTransfusionApi.completeBloodTransfusionOrder(orderId)
      toast.success('Blood transfusion recorded as completed')
      await loadOrders()
      setCompleteOrderModal(null)
    } catch (err) {
      console.error('Failed to complete transfusion', err)
      toast.error(err?.response?.data?.error || 'Failed to mark completed')
    } finally {
      setCompletingId(null)
    }
  }

  const handleDispensePreps = async (orderId) => {
    setDispensingId(orderId)
    try {
      await bloodTransfusionApi.dispenseBloodTransfusionPreps(orderId)
      toast.success('Pre-transfusion medications marked as dispensed')
      await loadOrders()
    } catch (err) {
      console.error('Failed to dispense preps', err)
      toast.error(err?.response?.data?.error || 'Failed to dispense medications')
    } finally {
      setDispensingId(null)
    }
  }

  const handleAdministerPreps = async (orderId) => {
    setAdministeringId(orderId)
    try {
      await bloodTransfusionApi.administerBloodTransfusionPreps(orderId)
      toast.success('Pre-transfusion medications marked as administered')
      await loadOrders()
    } catch (err) {
      console.error('Failed to administer preps', err)
      toast.error(err?.response?.data?.error || 'Failed to administer medications')
    } finally {
      setAdministeringId(null)
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

  const pendingOrders = orders.filter((o) => o.status !== 'completed' && !o.isCompleted)
  const completedOrders = orders.filter((o) => o.status === 'completed' || o.isCompleted)

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
        <div className="flex gap-2">
          {isDoctor && (
            <button
              onClick={() => setShowOrderModal(true)}
              className="btn btn-sm btn-error rounded-xl text-white gap-2 font-semibold shadow-sm"
            >
              <FaPlus className="w-3 h-3" /> Order Blood Transfusion
            </button>
          )}
        </div>
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

                    {/* Prep Medications Display */}
                    {order.preppingMedications && order.preppingMedications.length > 0 && (
                      <div className="mt-2 p-2.5 rounded-xl bg-base-200/50 border border-base-300">
                        <div className="text-xs font-semibold text-base-content/70 mb-1 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <FaPlus className="w-3 h-3 text-primary" /> Pre-Transfusion Medications
                          </div>
                          {order.isPrepsDispensed ? (
                            <span className="badge badge-success text-white badge-xs font-bold gap-1">
                              <FaCheckCircle className="w-2.5 h-2.5" /> Dispensed
                            </span>
                          ) : (
                            <span className="badge badge-warning badge-xs font-bold gap-1">
                              <FaClock className="w-2.5 h-2.5" /> Pending Pharmacy
                            </span>
                          )}
                          {order.isPrepsAdministered && (
                            <span className="badge badge-success text-white badge-xs font-bold gap-1">
                              <FaCheckCircle className="w-2.5 h-2.5" /> Administered
                            </span>
                          )}
                        </div>
                        <ul className="text-[11px] space-y-1">
                          {order.preppingMedications.map((med, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="w-1 h-1 rounded-full bg-primary mt-1.5 shrink-0"></span>
                              <span>
                                <strong className="text-base-content">{med.medicationName}</strong>
                                {med.dosage && ` (${med.dosage})`}
                                {med.note && <span className="text-base-content/60 block">{med.note}</span>}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Nurse Payment Clearance Banner */}
                    {isNurse && (
                      <div className="pt-1 flex flex-col gap-1.5">
                        {isCleared ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-success/10 text-success text-[11px] font-semibold border border-success/20">
                            <FaCheckCircle className="w-3 h-3" /> Payment Cleared: Approved for transfusion administration
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-warning/10 text-warning-content text-[11px] font-semibold border border-warning/30">
                            <FaExclamationTriangle className="w-3 h-3 text-warning" /> Payment Pending: Awaiting Cashier receipt or HMO authorization
                          </div>
                        )}
                        {order.status === 'in_progress' && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-info/10 text-info text-[11px] font-semibold border border-info/20">
                            <FaClock className="w-3 h-3 animate-pulse" /> In Progress by {order.inProgressByName} at {formatNigeriaDateTimeShort(order.inProgressAt)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Pharmacist Action Button */}
                  {isPharmacist && order.preppingMedications && order.preppingMedications.length > 0 && (
                    <div className="shrink-0 flex flex-col gap-2">
                      {!order.isPrepsDispensed ? (
                        <button
                          type="button"
                          onClick={() => handleDispensePreps(order._id || order.id)}
                          disabled={dispensingId === (order._id || order.id)}
                          className="btn btn-sm btn-primary rounded-xl font-bold shadow-sm"
                        >
                          {dispensingId === (order._id || order.id) ? 'Marking...' : 'Mark Preps Dispensed'}
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success/10 text-success text-[11px] font-bold border border-success/20">
                          <FaCheckCircle className="w-3.5 h-3.5" /> Preps Dispensed
                        </div>
                      )}
                    </div>
                  )}

                  {/* Nurse Action Button */}
                  {isNurse && (
                    <div className="shrink-0 flex flex-col gap-2">
                      {order.preppingMedications && order.preppingMedications.length > 0 && order.isPrepsDispensed && !order.isPrepsAdministered && (
                        <button
                          type="button"
                          onClick={() => handleAdministerPreps(order._id || order.id)}
                          disabled={administeringId === (order._id || order.id)}
                          className="btn btn-sm btn-success text-white rounded-xl font-bold shadow-sm"
                        >
                          {administeringId === (order._id || order.id) ? 'Marking...' : 'Mark Preps Administered'}
                        </button>
                      )}
                      
                      {order.status !== 'in_progress' ? (
                        <button
                          onClick={() => handleStartOrder(order)}
                          disabled={completingId === (order._id || order.id)}
                          className={`btn btn-sm rounded-xl text-white gap-2 font-semibold shadow-sm w-full sm:w-auto ${
                            isCleared ? 'btn-info' : 'btn-warning text-black'
                          }`}
                        >
                          {completingId === (order._id || order.id) ? (
                            <>
                              <span className="loading loading-spinner loading-xs"></span>
                              Starting...
                            </>
                          ) : (
                            <>
                              <FaClock className="w-3.5 h-3.5" />
                              {isCleared ? 'Start Transfusion' : 'Start (Pending Payment)'}
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompleteOrder(order)}
                          disabled={completingId === (order._id || order.id)}
                          className="btn btn-sm rounded-xl text-white gap-2 font-semibold shadow-sm w-full sm:w-auto btn-success"
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
                      )}
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
                  <th className="py-3 px-4">Blood Product</th>
                  <th className="py-3 px-4">Billing Status</th>
                  <th className="py-3 px-4">Ordered By</th>
                  <th className="py-3 px-4">Administered By</th>
                  <th className="py-3 px-4">Administered Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-base-200">
                {completedOrders.map((order) => {
                  return (
                    <tr 
                      key={order._id || order.id}
                      onClick={() => setSelectedHistoryOrder(order)}
                      className="hover:bg-base-200/40 cursor-pointer transition-colors"
                    >
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
                      <td className="py-3 px-4 text-base-content/70 flex items-center justify-between">
                        <span>{formatNigeriaDateTimeShort(order.completedAt)}</span>
                        <button className="btn btn-ghost btn-xs text-primary">View Details</button>
                      </td>
                    </tr>
                  )
                })}
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

              {/* Pre-Transfusion Medications */}
              <div className="p-3.5 rounded-xl bg-base-200/50 border border-base-300 space-y-3">
                <label className="block text-xs font-bold text-base-content flex items-center justify-between">
                  <span className="flex items-center gap-1.5"><FaPlus className="text-primary w-3 h-3" /> Pre-Transfusion Medications (Optional)</span>
                  <span className="text-[11px] text-base-content/60 font-normal">Sent to Pharmacy for Dispensing</span>
                </label>

                <div className="relative">
                  <FaSearch className="absolute left-3 top-2.5 text-base-content/40 text-xs" />
                  <input
                    type="text"
                    value={medSearch}
                    onChange={(e) => setMedSearch(e.target.value)}
                    placeholder="Search medications (e.g. Frusemide, Hydrocortisone)..."
                    className="input input-bordered input-sm w-full pl-8 rounded-xl text-xs"
                  />
                </div>

                {medSearch.trim() !== '' && (
                  <div className="max-h-36 overflow-y-auto border border-base-300 rounded-xl bg-base-100 divide-y divide-base-200 text-xs mt-1">
                    {loadingInventories ? (
                      <div className="p-3 text-center text-xs text-base-content/50">Loading medications...</div>
                    ) : filteredInventories.length === 0 ? (
                      <div className="p-3 text-center text-xs text-base-content/50">No medications found</div>
                    ) : (
                      filteredInventories.map((inv) => (
                        <div
                          key={inv.id || inv._id}
                          onClick={() => handleAddMed(inv)}
                          className="p-2.5 cursor-pointer flex items-center justify-between hover:bg-base-200/60 transition-colors"
                        >
                          <div className="truncate font-medium pr-2">{inv.name}</div>
                          <FaPlus className="text-primary opacity-50 w-3 h-3 shrink-0" />
                        </div>
                      ))
                    )}
                  </div>
                )}

                {selectedMeds.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {selectedMeds.map((med) => (
                      <div key={med.medicationId} className="p-2.5 rounded-lg bg-base-100 border border-base-200 text-xs relative pr-8">
                        <button
                          type="button"
                          onClick={() => handleRemoveMed(med.medicationId)}
                          className="absolute right-2 top-2.5 text-error opacity-60 hover:opacity-100"
                        >
                          ✕
                        </button>
                        <div className="font-bold text-base-content mb-2">{med.medicationName}</div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] text-base-content/60 mb-0.5">Dosage</label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => handleUpdateMed(med.medicationId, 'dosage', e.target.value)}
                              placeholder="e.g. 20mg STAT"
                              className="input input-bordered input-xs w-full rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-base-content/60 mb-0.5">Note to Pharmacist</label>
                            <input
                              type="text"
                              value={med.note}
                              onChange={(e) => handleUpdateMed(med.medicationId, 'note', e.target.value)}
                              placeholder="e.g. Pre-transfusion"
                              className="input input-bordered input-xs w-full rounded-md"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      {/* Side Drawer for Blood Transfusion History Details */}
      {selectedHistoryOrder && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-lg bg-base-100 h-full shadow-2xl flex flex-col animate-slideInRight">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-base-200 bg-base-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-error/10 text-error rounded-xl shrink-0">
                  <FaHeartbeat className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-base-content">
                    Transfusion Details
                  </h3>
                  <p className="text-xs text-base-content/60">
                    {formatNigeriaDateTimeShort(selectedHistoryOrder.completedAt)}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryOrder(null)}
                className="btn btn-ghost btn-circle btn-sm"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              <div className="flex items-center justify-between bg-base-200/50 p-4 rounded-xl border border-base-200">
                <div>
                  <h4 className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider mb-1">Blood Product</h4>
                  <span className="badge badge-error/15 text-error font-bold py-3 px-3 shadow-sm">
                    {selectedHistoryOrder.units || 1} Unit(s) {selectedHistoryOrder.bloodGroup ? `(${selectedHistoryOrder.bloodGroup})` : ''}
                  </span>
                </div>
                <div className="text-right">
                  <h4 className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider mb-1">Status</h4>
                  <span className="badge badge-success font-bold text-white shadow-sm gap-1.5 py-3 px-3">
                    <FaCheckCircle className="w-3 h-3" /> Completed
                  </span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-sm text-base-content flex items-center gap-2 mb-2">
                  <FaExclamationTriangle className="text-warning w-4 h-4" /> Order Directive
                </h4>
                <div className="bg-base-200/30 p-4 rounded-xl border border-base-200 text-sm text-base-content/80 leading-relaxed whitespace-pre-wrap">
                  {selectedHistoryOrder.note || 'No clinical note provided.'}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <h4 className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">Ordered By</h4>
                  <div className="flex items-center gap-2 text-sm font-medium text-base-content/80">
                    <FaUserMd className="text-primary w-3.5 h-3.5" />
                    {selectedHistoryOrder.doctorName || 'Attending Physician'}
                  </div>
                  <p className="text-[11px] text-base-content/50 ml-5.5">
                    {formatNigeriaDateTimeShort(selectedHistoryOrder.orderedAt || selectedHistoryOrder.createdAt)}
                  </p>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">Started By</h4>
                  {selectedHistoryOrder.inProgressByName ? (
                    <>
                      <div className="flex items-center gap-2 text-sm font-medium text-base-content/80">
                        <FaUserNurse className="text-info w-3.5 h-3.5" />
                        {selectedHistoryOrder.inProgressByName}
                      </div>
                      <p className="text-[11px] text-base-content/50 ml-5.5">
                        {formatNigeriaDateTimeShort(selectedHistoryOrder.inProgressAt)}
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-base-content/50 italic">Not recorded</span>
                  )}
                </div>

                <div className="space-y-1">
                  <h4 className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider">Completed By</h4>
                  {selectedHistoryOrder.completedByName ? (
                    <>
                      <div className="flex items-center gap-2 text-sm font-medium text-base-content/80">
                        <FaUserNurse className="text-success w-3.5 h-3.5" />
                        {selectedHistoryOrder.completedByName}
                      </div>
                      <p className="text-[11px] text-base-content/50 ml-5.5">
                        {formatNigeriaDateTimeShort(selectedHistoryOrder.completedAt)}
                      </p>
                    </>
                  ) : (
                    <span className="text-sm text-base-content/50 italic">Not recorded</span>
                  )}
                </div>
              </div>

              {selectedHistoryOrder.preppingMedications && selectedHistoryOrder.preppingMedications.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between border-b border-base-200 pb-2">
                    <span className="text-sm font-bold text-primary flex items-center gap-1.5">
                      Pre-Transfusion Medications ({selectedHistoryOrder.preppingMedications.length})
                    </span>
                    {selectedHistoryOrder.isPrepsDispensed ? (
                      <div className="text-right">
                        <div className="badge badge-success text-white badge-xs font-bold gap-1 mb-1">
                          <FaCheckCircle className="w-2.5 h-2.5" /> Dispensed
                        </div>
                        <p className="text-[10px] text-base-content/60 leading-tight">
                          by {selectedHistoryOrder.prepsDispensedByName}<br/>
                          {formatNigeriaDateTimeShort(selectedHistoryOrder.prepsDispensedAt)}
                        </p>
                      </div>
                    ) : (
                      <span className="badge badge-warning badge-xs font-bold gap-1">
                        <FaClock className="w-2.5 h-2.5" /> Pending Pharmacy
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {selectedHistoryOrder.preppingMedications.map((med, idx) => (
                      <div key={idx} className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between text-base-content/90 font-medium gap-1">
                        <div>
                          • <span className="font-bold">{med.medicationName}</span> -{' '}
                          <span className="badge badge-ghost badge-sm">{med.dosage || 'STAT'}</span>
                          {med.note && med.note !== 'none' && <span className="text-base-content/60 italic ml-1">— {med.note}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-4 sm:p-6 border-t border-base-200 bg-base-200/50">
              <button onClick={() => setSelectedHistoryOrder(null)} className="btn btn-primary w-full rounded-xl">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Start Order Modal */}
      {startOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-base-300 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-info">
              <div className="p-3 bg-info/10 rounded-xl">
                <FaClock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Start Transfusion</h3>
                <p className="text-xs text-base-content/60">
                  Begin blood transfusion procedure
                </p>
              </div>
            </div>

            {!(startOrderModal.isPaid || startOrderModal.paymentStatus === 'paid' || startOrderModal.paymentStatus === 'approved') && (
              <div className="p-3 bg-warning/10 border border-warning/30 rounded-xl flex gap-3 text-warning-content">
                <FaExclamationTriangle className="w-5 h-5 shrink-0 text-warning mt-0.5" />
                <div className="text-sm">
                  <strong>Payment Pending:</strong> This order has not been cleared by Cashier or HMO yet. Are you sure you want to proceed?
                </div>
              </div>
            )}

            <p className="text-sm text-base-content/80 leading-relaxed">
              Confirming this will mark the transfusion as "In Progress" and record your name and the current timestamp as the starting nurse.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setStartOrderModal(null)}
                className="btn btn-sm btn-ghost rounded-xl"
                disabled={completingId === (startOrderModal._id || startOrderModal.id)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeStartOrder}
                disabled={completingId === (startOrderModal._id || startOrderModal.id)}
                className="btn btn-sm btn-info text-white rounded-xl font-semibold gap-2"
              >
                {completingId === (startOrderModal._id || startOrderModal.id) ? 'Starting...' : 'Confirm Start'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Order Modal */}
      {completeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-base-100 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-base-300 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3 text-success">
              <div className="p-3 bg-success/10 rounded-xl">
                <FaCheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-base-content">Complete Transfusion</h3>
                <p className="text-xs text-base-content/60">
                  Finalize the transfusion procedure
                </p>
              </div>
            </div>

            <p className="text-sm text-base-content/80 leading-relaxed">
              Are you sure you want to mark this blood transfusion order as completed? This will move it to the administration history log.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCompleteOrderModal(null)}
                className="btn btn-sm btn-ghost rounded-xl"
                disabled={completingId === (completeOrderModal._id || completeOrderModal.id)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeCompleteOrder}
                disabled={completingId === (completeOrderModal._id || completeOrderModal.id)}
                className="btn btn-sm btn-success text-white rounded-xl font-semibold gap-2"
              >
                {completingId === (completeOrderModal._id || completeOrderModal.id) ? 'Completing...' : 'Mark Completed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BloodTransfusionTab
