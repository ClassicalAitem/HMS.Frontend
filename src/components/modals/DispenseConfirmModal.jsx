import React from 'react'

const DispenseConfirmModal = ({
  rows = [],
  submitting = false,
  onCancel,
  onConfirm,
}) => {
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
          {rows.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-base-300 bg-base-100 p-3"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-base">{row.drugName}</span>
                    {row.availabilityInfo && (
                      <span className={`badge badge-sm font-medium ${row.availabilityInfo.badgeClass}`}>
                        {row.availabilityInfo.label}
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
                </div>

                <div className="text-left md:text-right">
                  <div className="text-xs text-base-content/60">Prescribed Qty</div>
                  <div className="text-sm font-bold text-primary">{row.suggestedQty} unit(s)</div>
                </div>
              </div>
            </div>
          ))}
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
            onClick={() => onConfirm?.(rows)}
            disabled={submitting}
          >
            {submitting ? 'Processing...' : 'Confirm & Complete'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default DispenseConfirmModal