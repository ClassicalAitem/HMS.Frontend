import React, { useEffect, useState } from 'react'

const DispenseConfirmModal = ({
  rows = [],
  submitting = false,
  onCancel,
  onConfirm,
}) => {
  const [editableRows, setEditableRows] = useState([])

  useEffect(() => {
    setEditableRows(
      rows.map((row) => ({
        ...row,
        quantity: Number(row.suggestedQty ?? row.quantity ?? 1),
      }))
    )
  }, [rows])

  if (!rows.length) return null

  const totalQuantity = editableRows.reduce(
    (sum, row) => sum + (Number(row.quantity) || 0),
    0
  )

  const updateQuantity = (key, value) => {
    const nextValue = Math.max(0, Number(value) || 0)
    setEditableRows((prev) =>
      prev.map((row) =>
        row.key === key ? { ...row, quantity: nextValue } : row
      )
    )
  }

  const handleConfirm = () => {
    const sanitized = editableRows.map((row) => ({
      ...row,
      quantity: Number(row.quantity) || 0,
    }))

    if (!sanitized.some((row) => Number(row.quantity) > 0)) {
      return
    }

    onConfirm?.(sanitized)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-primary">Confirm Dispense</h3>
            <p className="text-sm text-base-content/70">
              Review and adjust the quantity each medication will be dispensed.
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
          {editableRows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-base-300 bg-base-100 p-3"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-base">{row.drugName}</div>
                  <div className="text-xs text-base-content/70">
                    {row.forName || 'Patient'} · {row.dosage || '—'} · {row.frequency || '—'} · {row.duration || '—'}
                  </div>
                  {row.formStrength && (
                    <div className="text-xs text-base-content/60 mt-1">
                      {row.formStrength}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-base-content/60">Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={row.quantity}
                    onChange={(e) => updateQuantity(row.key, e.target.value)}
                    className="input input-bordered input-sm w-24"
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-base-200 px-4 py-3">
          <div className="text-sm text-base-content/70">Total units</div>
          <div className="font-semibold text-base-content">{totalQuantity}</div>
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
            onClick={handleConfirm}
            disabled={submitting || totalQuantity <= 0}
          >
            {submitting ? 'Processing...' : 'Confirm & dispense'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DispenseConfirmModal
