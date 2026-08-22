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

  const finalRows = useMemo(() => {
    return rows
      .filter((row) => {
        if (row.hmoStatus !== 'rejected') return true
        if (!isSuperAdmin) return false
        return !!selected[row.key]
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Prescription Summary</h3>
            <p className="text-sm text-base-content/70">
              Review prescription details and availability before finalizing.
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

        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {rows.map((row) => {
            const isRejected = row.hmoStatus === 'rejected'
            const blockedForPharmacist = isRejected && !isSuperAdmin
            const isChecked = isRejected ? !!selected[row.key] : true

            return (
            <div
              key={row.key}
              className={`rounded-xl border p-3 ${
                blockedForPharmacist
                  ? 'border-error/30 bg-error/5 opacity-70'
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
                    {row.hmoStatus === 'approved' && (
                      <span className="badge badge-sm badge-success font-medium">HMO: Covered</span>
                    )}
                    {row.hmoStatus === 'partial' && (
                      <span className="badge badge-sm badge-warning font-medium">HMO: Partial</span>
                    )}
                    {isRejected && (
                      <span className="badge badge-sm badge-error font-medium">
                        HMO: Not Covered{blockedForPharmacist ? ' — Excluded' : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-base-content/70">
                    {row.forName || 'Patient'} · {row.dosage || '—'} · {row.frequency || '—'} · {row.duration || '—'}
                  </div>
                  {row.formStrength && (
                    <div className="text-xs text-base-content/60 mt-1">
                      {row.formStrength}
                    </div>
                  )}
                  {blockedForPharmacist && (
                    <div className="text-xs text-error mt-1">
                      Not covered by HMO — this item will not be dispensed. If the patient agrees to pay directly, a SuperAdmin can dispense it separately.
                    </div>
                  )}
                  </div>
                </div>

                <div className="text-left md:text-right">
                  <div className="text-xs text-base-content/60">Prescribed Qty</div>
                  {isRejected && isSuperAdmin && isChecked ? (
                    <input
                      type="number"
                      min={1}
                      className="input input-bordered input-sm w-24 text-right"
                      value={qtyOverride[row.key] ?? row.suggestedQty}
                      onChange={(e) => setQtyOverride((prev) => ({ ...prev, [row.key]: e.target.value }))}
                    />
                  ) : (
                    <div className={`text-sm font-bold ${blockedForPharmacist ? 'text-base-content/40 line-through' : 'text-primary'}`}>
                      {row.suggestedQty} unit(s)
                    </div>
                  )}
                </div>
              </div>
            </div>
            )
          })}
        </div>

        <div className="mt-5 flex justify-end gap-3">
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
  )
}

export default DispenseConfirmModal