import React, { useEffect, useMemo, useState } from 'react'
import { FaFileInvoice, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import apiClient from '@/services/api/apiClient'
import { createBilling, getAllReceipts, getBillingsByAdmissionId } from '@/services/api/billingAPI'
import { getInvestigationByPatientId } from '@/services/api/investigationRequestAPI'
import { getServiceCharges } from '@/services/api/serviceChargesAPI'
import { formatNigeriaDateTime } from '@/utils/formatDateTimeUtils'

const unwrap = (response) => response?.data?.data ?? response?.data ?? response
const toList = (response) => {
  const data = unwrap(response)
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.data)) return data.data
  return data ? [data] : []
}
const currency = (amount) => `₦${Number(amount || 0).toLocaleString()}`
const getId = (record) => record?._id || record?.id

const AdmissionBillManagerModal = ({ isOpen, onClose, admissionId, patientId, dependantId, patientName }) => {
  const [billings, setBillings] = useState([])
  const [unbilledGroups, setUnbilledGroups] = useState({ labs: [], ivs: [], treatments: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [openBillId, setOpenBillId] = useState(null)
  const [billDraft, setBillDraft] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!isOpen || !admissionId || !patientId) return undefined

    let active = true
    const loadBillsAndUnbilledItems = async () => {
      setLoading(true)
      setError('')
      const [billsResult, labsResult, chargesResult, ivsResult, treatmentResult] = await Promise.allSettled([
        getBillingsByAdmissionId(admissionId),
        getInvestigationByPatientId(patientId),
        getServiceCharges(),
        apiClient.get(`/iv-fluid/patient/${patientId}`),
        apiClient.get(`/dispense/treatment-bill/preview/${admissionId}`),
      ])

      if (!active) return
      if (billsResult.status === 'rejected') {
        setError(billsResult.reason?.response?.data?.message || 'Failed to load admission bills.')
        setBillings([])
      } else {
        const bills = toList(billsResult.value)
        const receiptsByBill = await Promise.all(bills.map(async (bill) => {
          try {
            const receipts = toList(await getAllReceipts({ billingId: getId(bill) }))
            return receipts.reduce((sum, receipt) => sum + Number(receipt.amountPaid || 0), 0)
          } catch {
            return 0
          }
        }))
        if (!active) return
        setBillings(bills
          .map((bill, index) => {
            const total = Number(bill.totalAmount) || 0
            const recordedOutstanding = Number(bill.outstandingBill) || 0
            const paidAmount = receiptsByBill[index] || (bill.isCleared ? total : Math.max(total - recordedOutstanding, 0))
            const outstandingAmount = bill.isCleared
              ? 0
              : recordedOutstanding || Math.max(total - paidAmount, 0)
            return { ...bill, paidAmount, outstandingAmount }
          })
          .sort((first, second) => new Date(second.createdAt || 0) - new Date(first.createdAt || 0)))
      }

      const rawCharges = chargesResult.status === 'fulfilled' ? toList(chargesResult.value) : []
      const findCharge = (name, chargeId) => {
        if (chargeId) {
          const match = rawCharges.find((charge) => String(getId(charge)) === String(chargeId))
          if (match) return match
        }
        const normalized = String(name || '').trim().toLowerCase()
        if (!normalized) return null
        return rawCharges.find((charge) => {
          const chargeName = String(charge.service || charge.name || '').trim().toLowerCase()
          return chargeName && (chargeName === normalized || chargeName.includes(normalized) || normalized.includes(chargeName))
        })
      }

      const labs = labsResult.status === 'fulfilled'
        ? toList(labsResult.value)
          .filter((lab) => !lab.isBilled && String(lab.admissionId || '') === String(admissionId) && String(lab.status || '').toLowerCase() !== 'cancelled')
          .flatMap((lab) => {
            const tests = Array.isArray(lab.tests) && lab.tests.length ? lab.tests : [{ name: lab.type || 'Investigation' }]
            return tests.map((test) => {
              const name = typeof test === 'string' ? test : test?.name || test?.code || lab.type || 'Investigation'
              const charge = findCharge(name, test?.serviceChargeId || lab.serviceChargeId)
              const configuredPrice = test?.price ?? lab.price ?? charge?.amount ?? charge?.price
              const hasConfiguredPrice = configuredPrice !== undefined && configuredPrice !== null &&
                !(typeof configuredPrice === 'string' && !configuredPrice.trim()) && Number.isFinite(Number(configuredPrice))
              const price = hasConfiguredPrice ? Number(configuredPrice) : 0
              return {
                code: 'LAB', category: 'Investigation', description: `${name} (Lab Test)`, quantity: 1,
                price, unitPrice: price, total: price, hasConfiguredPrice,
                serviceChargeId: test?.serviceChargeId || lab.serviceChargeId || getId(charge),
                investigationId: getId(lab),
              }
            })
          })
        : []

      const ivs = ivsResult.status === 'fulfilled'
        ? toList(ivsResult.value)
          .filter((order) => !order.isBilled && String(order.admissionId || '') === String(admissionId))
          .map((order) => ({
            code: 'IV_FLUID', category: 'IV Fluid', description: `${order.fluidType || 'IV Fluid'} (IV Fluid)`,
            quantity: Number(order.volume) || 1, price: Number(order.price) || 0,
            unitPrice: Number(order.price) || 0, total: (Number(order.price) || 0) * (Number(order.volume) || 1),
            ivFluidOrderId: getId(order),
          }))
        : []

      const treatmentData = treatmentResult.status === 'fulfilled' ? unwrap(treatmentResult.value) : null
      const treatments = Array.isArray(treatmentData?.itemDetails) ? treatmentData.itemDetails : []
      setUnbilledGroups({ labs, ivs, treatments })
      setLoading(false)
    }

    loadBillsAndUnbilledItems().catch((loadError) => {
      if (active) {
        setError(loadError?.response?.data?.message || 'Failed to load admission billing details.')
        setLoading(false)
      }
    })
    return () => { active = false }
  }, [isOpen, admissionId, patientId, dependantId, reloadKey])

  useEffect(() => {
    if (!isOpen) {
      setOpenBillId(null)
      setBillDraft(null)
    }
  }, [isOpen])

  const totals = useMemo(() => billings.reduce((sum, bill) => ({
    billed: sum.billed + (Number(bill.totalAmount) || 0),
    paid: sum.paid + (Number(bill.paidAmount) || 0),
    outstanding: sum.outstanding + (Number(bill.outstandingAmount) || 0),
  }), { billed: 0, paid: 0, outstanding: 0 }), [billings])

  const openGenerateBill = (group) => setBillDraft({ ...group, discountAmount: '', discountReason: '' })

  const generateBill = async (event) => {
    event.preventDefault()
    if (!billDraft?.items?.length) return

    const subtotal = billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
    const discount = Number(billDraft.discountAmount) || 0
    if (discount < 0 || discount > subtotal) return toast.error('Discount cannot exceed the bill subtotal.')
    if (discount > 0 && !billDraft.discountReason.trim()) return toast.error('Enter a reason for the admission discount.')
    if (billDraft.key === 'labs') {
      const unpriced = billDraft.items.find((item) => !item.hasConfiguredPrice)
      if (unpriced) return toast.error(`No service charge price is configured for ${unpriced.description}.`)
    }

    setGenerating(true)
    const toastId = toast.loading('Generating bill...')
    try {
      if (billDraft.key === 'treatments') {
        await apiClient.post(`/dispense/treatment-bill/${admissionId}`, {
          discountAmount: discount,
          ...(discount > 0 ? { discountReason: billDraft.discountReason.trim() } : {}),
        })
      } else {
        await createBilling(patientId, {
          ...(dependantId ? { dependantId } : {}),
          itemDetail: billDraft.items.map((item) => ({
            code: item.code || item.category || 'MISC',
            description: item.description,
            quantity: Number(item.quantity) || 1,
            price: Number(item.price ?? item.unitPrice) || 0,
            total: Number(item.total) || 0,
            category: item.category,
            serviceChargeId: item.serviceChargeId || undefined,
            investigationId: item.investigationId || undefined,
            admissionId,
            ivFluidOrderId: item.ivFluidOrderId || undefined,
            bloodTransfusionOrderId: item.bloodTransfusionOrderId || undefined,
            paymentStatus: 'pending',
          })),
          discountAmount: discount,
          ...(discount > 0 ? { discountReason: billDraft.discountReason.trim() } : {}),
        })
      }

      toast.success('Admission bill generated successfully.', { id: toastId })
      setBillDraft(null)
      setReloadKey((current) => current + 1)
    } catch (generationError) {
      toast.error(generationError?.response?.data?.message || 'Failed to generate admission bill.', { id: toastId })
    } finally {
      setGenerating(false)
    }
  }

  if (!isOpen) return null

  const groups = [
    { key: 'labs', title: 'Laboratory', items: unbilledGroups.labs },
    { key: 'ivs', title: 'IV Fluids', items: unbilledGroups.ivs },
    { key: 'treatments', title: 'Dispensed Medications & Consumables', items: unbilledGroups.treatments },
  ].filter((group) => group.items.length > 0)

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/60 px-4 pb-4 pt-20" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
      <section className="flex max-h-[calc(100dvh-6rem)] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-base-100 shadow-2xl">
        <header className="flex shrink-0 items-center justify-between border-b border-base-200 p-5">
          <div className="flex items-center gap-3"><span className="rounded-full bg-primary/10 p-2 text-primary"><FaFileInvoice /></span><div><h2 className="text-lg font-bold">Admission Billing Preview</h2>{patientName && <p className="text-sm text-base-content/60">{patientName}</p>}</div></div>
          <button type="button" onClick={onClose} className="btn btn-ghost btn-circle btn-sm" aria-label="Close bill preview"><FaTimes /></button>
        </header>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-base-300 p-4"><p className="text-xs text-base-content/60">Total billed</p><p className="text-xl font-bold">{currency(totals.billed)}</p></div>
            <div className="rounded-lg border border-success/30 bg-success/5 p-4"><p className="text-xs text-base-content/60">Amount paid</p><p className="text-xl font-bold text-success">{currency(totals.paid)}</p></div>
            <div className="rounded-lg border border-error/30 bg-error/5 p-4"><p className="text-xs text-base-content/60">Outstanding</p><p className="text-xl font-bold text-error">{currency(totals.outstanding)}</p></div>
          </div>

          {loading ? <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg" /></div> : error ? <p role="alert" className="py-4 text-center text-error">{error}</p> : <>
            <section>
              <h3 className="mb-3 text-base font-bold">Generated Bills</h3>
              {billings.length === 0 ? <p className="rounded-lg border border-dashed border-base-300 p-5 text-center text-sm text-base-content/60">No admission bills have been generated yet.</p> : <div className="space-y-3">
                {billings.map((bill) => {
                  const billId = getId(bill)
                  const discount = Number(bill.discountAmount) || 0
                  const expanded = openBillId === billId
                  return <article key={billId} className="overflow-hidden rounded-lg border border-base-300">
                    <button type="button" className="grid w-full grid-cols-2 gap-3 p-4 text-left hover:bg-base-200/50 md:grid-cols-5 md:items-center" onClick={() => setOpenBillId(expanded ? null : billId)} aria-expanded={expanded}>
                      <span className="text-sm font-medium">{formatNigeriaDateTime(bill.createdAt)}</span><span><span className="block text-xs text-base-content/60">Discount</span>{currency(discount)}</span><span><span className="block text-xs text-base-content/60">Bill total</span>{currency(bill.totalAmount)}</span><span className="font-semibold text-success"><span className="block text-xs text-base-content/60">Paid</span>{currency(bill.paidAmount)}</span><span className={bill.outstandingAmount > 0 ? 'font-semibold text-error' : 'font-semibold text-success'}><span className="block text-xs text-base-content/60">Outstanding</span>{currency(bill.outstandingAmount)}</span>
                    </button>
                    {discount > 0 && bill.discountReason && <p className="border-t border-base-200 px-4 py-2 text-xs text-base-content/60">Discount reason: {bill.discountReason}</p>}
                    {expanded && <div className="overflow-x-auto border-t border-base-200"><table className="table table-sm w-full"><thead><tr><th>Description</th><th>Category</th><th>Qty</th><th className="text-right">Unit price</th><th className="text-right">Total</th></tr></thead><tbody>{(bill.itemDetails || []).map((item, index) => <tr key={`${item.description}-${index}`}><td>{item.description || 'Bill item'}</td><td>{item.category || item.code || '—'}</td><td>{item.quantity || 1}</td><td className="text-right">{currency(item.price ?? item.unitPrice)}</td><td className="text-right">{currency(item.total)}</td></tr>)}</tbody></table></div>}
                  </article>
                })}
              </div>}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between gap-3"><h3 className="text-base font-bold">Unbilled Items</h3><span className="text-sm font-semibold">Preview total: {currency(groups.reduce((sum, group) => sum + group.items.reduce((groupTotal, item) => groupTotal + (Number(item.total) || 0), 0), 0))}</span></div>
              {groups.length === 0 ? <p className="rounded-lg border border-dashed border-base-300 p-5 text-center text-sm text-base-content/60">No unbilled admission items.</p> : <div className="space-y-4">
                {groups.map((group) => {
                  const subtotal = group.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)
                  const hasMissingLabPrice = group.key === 'labs' && group.items.some((item) => !item.hasConfiguredPrice)
                  return <article key={group.key} className="overflow-hidden rounded-lg border border-base-300">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-base-200 bg-base-200/30 p-3"><div><h4 className="font-semibold">{group.title}</h4><p className="text-xs text-base-content/60">{group.items.length} item{group.items.length === 1 ? '' : 's'} · {currency(subtotal)}</p></div><button type="button" className="btn btn-primary btn-sm" disabled={generating || hasMissingLabPrice || subtotal <= 0} onClick={() => openGenerateBill(group)}>Generate Bill</button></div>
                    {hasMissingLabPrice && <p className="px-3 pt-3 text-xs text-error">A service-charge price is missing for one or more tests; configure the price before generating this bill.</p>}
                    <div className="overflow-x-auto"><table className="table table-sm w-full"><thead><tr><th>Description</th><th>Category</th><th>Qty</th><th className="text-right">Unit price</th><th className="text-right">Total</th></tr></thead><tbody>{group.items.map((item, index) => <tr key={`${item.description}-${index}`}><td>{item.description}</td><td>{item.category || item.code || '—'}</td><td>{item.quantity || 1}</td><td className="text-right">{currency(item.price ?? item.unitPrice)}</td><td className="text-right">{currency(item.total)}</td></tr>)}</tbody></table></div>
                  </article>
                })}
              </div>}
            </section>
          </>}
        </div>
        <footer className="flex shrink-0 justify-end border-t border-base-200 p-4"><button type="button" className="btn btn-ghost" onClick={onClose}>Close</button></footer>
      </section>

      {billDraft && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}><form className="w-full max-w-md space-y-4 rounded-lg bg-base-100 p-5 shadow-xl" onSubmit={generateBill}>
        <div><h3 className="text-lg font-semibold">Generate {billDraft.title} Bill</h3><p className="text-sm text-base-content/60">Subtotal: {currency(billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0))}</p></div>
        <label className="form-control"><span className="label-text">Fixed discount amount</span><input type="number" min="0" max={billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0)} step="1" value={billDraft.discountAmount} onChange={(event) => setBillDraft((current) => ({ ...current, discountAmount: event.target.value }))} className="input input-bordered" placeholder="₦0" /></label>
        {Number(billDraft.discountAmount) > 0 && <label className="form-control"><span className="label-text">Reason for discount *</span><input required value={billDraft.discountReason} onChange={(event) => setBillDraft((current) => ({ ...current, discountReason: event.target.value }))} className="input input-bordered" /></label>}
        <p className="text-sm font-semibold">Amount due: {currency(Math.max(0, billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) - (Number(billDraft.discountAmount) || 0)))}</p>
        <div className="flex justify-end gap-2"><button type="button" className="btn btn-ghost" onClick={() => setBillDraft(null)} disabled={generating}>Cancel</button><button type="submit" className="btn btn-primary" disabled={generating || Number(billDraft.discountAmount) < 0 || Number(billDraft.discountAmount) > billDraft.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0) || (Number(billDraft.discountAmount) > 0 && !billDraft.discountReason.trim())}>{generating ? 'Generating...' : 'Generate Bill'}</button></div>
      </form></div>}
    </div>
  )
}

export default AdmissionBillManagerModal
