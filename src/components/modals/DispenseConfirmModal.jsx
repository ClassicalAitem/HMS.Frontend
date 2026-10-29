import React, { useMemo, useState } from 'react'

const DispenseConfirmModal = ({
  rows = [],
  submitting = false,
  isSuperAdmin = false,
  onCancel,
  onConfirm,
}) => {
  const [selected, setSelected] = useState({})
  const [qtyOverride, setQtyOverride] = useState({})

  const formatQty = (n) => {
    const num = Number(n) || 0
    return Number.isInteger(num) ? num : num.toFixed(2)
  }

  // Exclude rejected items and unpaid items from dispensing
  const finalRows = useMemo(() => {
    return rows
      .filter((row) => {
        const isRejected = row.hmoStatus === 'rejected'
        const isApproved = row.hmoStatus === 'approved'
        const isPaid = !!row.isPaid
        const isDispensable = isApproved || isPaid

        // Rejected items are excluded from normal dispensing
        if (isRejected) {
          if (!isSuperAdmin) return false
          return !!selected[row.key]
        }

        // Unpaid items are excluded from dispensing
        if (!isDispensable) {
          return false
        }

        return true
      })
      .map((row) => {
        if (row.hmoStatus === 'rejected' && isSuperAdmin && selected[row.key]) {
          return {
            ...row,
            suggestedQty: Number(qtyOverride[row.key]) || row.suggestedQty,
          }
        }
        return row
      })
  }, [rows, selected, qtyOverride, isSuperAdmin])

  if (!rows.length) return null

  const hasDispensableItems = finalRows.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('✕') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Prescription Summary</h3>
            <p className="text-sm text-base-content/70">
              Review prescription details and availability before finalizing. Only approved and paid items can be dispensed.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onCancel}
            disabled={submitting}
          >
            Close
          </button>
        </div>

        {!hasDispensableItems && (
          <div className="alert alert-warning text-xs mb-3 py-2.5 rounded-xl border border-warning/20">
            <span>No items are currently eligible for dispensing. Unpaid items must be paid at the cashier, and HMO rejected items are excluded.</span>
          </div>
        )}

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {rows.map((row) => {
            const isRejected = row.hmoStatus === 'rejected'
            const isApproved = row.hmoStatus === 'approved'
            const isPaid = !!row.isPaid
            const isUnpaid = !isPaid && !isApproved
            const isOverriddenBySuperAdmin = isRejected && isSuperAdmin && !!selected[row.key]
            const isExcluded = (isRejected && !isOverriddenBySuperAdmin) || isUnpaid
            const isChecked = isRejected ? !!selected[row.key] : !isUnpaid

            return (
              <div
                key={row.key}
                className={`rounded-xl border p-3 ${
                  isRejected
                    ? 'border-error/30 bg-error/5 opacity-70'
                    : isUnpaid
                    ? 'border-warning/30 bg-warning/5 opacity-75'
                    : 'border-base-300 bg-base-100'
                }`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    {isRejected && isSuperAdmin && (
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm mt-1"
                        checked={isChecked}
                        onChange={(e) => setSelected((prev) => ({ ...prev, [row.key]: e.target.checked }))}
                      />
                    )}
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-base">{row.drugName}</span>
                        {row.availabilityInfo && (
                          <span className={`badge badge-sm font-medium ${row.availabilityInfo.badgeClass}`}>
                            {row.availabilityInfo.label}
                          </span>
                        )}
                        {isApproved && (
                          <span className="badge badge-sm badge-success font-medium">HMO: Covered</span>
                        )}
                        {row.hmoStatus === 'partial' && (
                          <span className="badge badge-sm badge-warning font-medium">HMO: Partial</span>
                        )}
                        {isRejected && (
                          <span className="badge badge-sm badge-error font-medium">
                            HMO: Not Covered — Excluded
                          </span>
                        )}
                        {!isRejected && isPaid && !isApproved && (
                          <span className="badge badge-sm badge-success font-medium">Paid</span>
                        )}
                        {!isRejected && isUnpaid && (
                          <span className="badge badge-sm badge-warning font-medium">
                            Unpaid — Excluded
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-base-content/70">
                        {row.forName || 'Patient'} · {row.dosage || '—'} · {row.frequency || '—'} · {row.duration || '—'}
                        {row.doctorName && <> · Dr. {row.doctorName}</>}
                      </div>
                      {row.formStrength && (
                        <div className="text-xs text-base-content/60 mt-1">
                          {row.formStrength}
                        </div>
                      )}
                      {isRejected && (
                        <div className="text-xs text-error mt-1">
                          {isSuperAdmin
                            ? 'Not covered by HMO — excluded from dispensing. Check the box above if SuperAdmin authorizes manual override.'
                            : 'Not covered by HMO — this item will not be dispensed.'}
                        </div>
                      )}
                      {!isRejected && isUnpaid && (
                        <div className="text-xs text-warning mt-1">
                          Awaiting payment at cashier — this item cannot be dispensed until payment is confirmed.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-left md:text-right">
                    {row.bottlesNeeded ? (
                      <div className="text-xs text-base-content/60">
                        Prescribed: {formatQty(row.prescribedQty)}{row.suggestedUnit ? ` ${row.suggestedUnit}` : ''}
                      </div>
                    ) : (
                      <div className="text-xs text-base-content/60">
                        Prescribed Qty{row.suggestedUnit ? ` (${row.suggestedUnit})` : ''}
                      </div>
                    )}
                    {isRejected && isSuperAdmin && isChecked ? (
                      <input
                        type="number"
                        min={1}
                        className="input input-bordered input-sm w-24 text-right"
                        value={qtyOverride[row.key] ?? row.suggestedQty}
                        onChange={(e) => setQtyOverride((prev) => ({ ...prev, [row.key]: e.target.value }))}
                      />
                    ) : (
                      <div className={`text-sm font-bold ${isExcluded ? 'text-base-content/40 line-through' : 'text-primary'}`}>
                        {row.bottlesNeeded
                          ? `Billed: ${row.bottlesNeeded} bottle${row.bottlesNeeded > 1 ? 's' : ''} (${row.suggestedQty}${row.suggestedUnit ? ` ${row.suggestedUnit}` : ''})`
                          : `${row.suggestedQty}${row.suggestedUnit ? ` ${row.suggestedUnit}` : ' unit(s)'}`}
                      </div>
                    )}
                    {row.lineTotal !== undefined && (
                      <div className={`text-xs font-semibold mt-1 ${isExcluded ? 'text-base-content/40 line-through' : 'text-primary'}`}>
                        Amount: ₦{Number(row.lineTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-5 pt-3 border-t border-base-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm font-semibold">
            Total Dispensable Amount: <span className="text-primary text-base font-bold ml-1">₦{finalRows.reduce((sum, r) => sum + (Number(r.lineTotal) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onCancel}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onConfirm?.(finalRows)}
              disabled={submitting || finalRows.length === 0}
            >
              {submitting ? 'Processing...' : 'Confirm & Complete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DispenseConfirmModal
