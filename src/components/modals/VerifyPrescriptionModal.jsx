import React, { useEffect, useState } from 'react';
import { FaTimes, FaCheckCircle, FaSyncAlt } from 'react-icons/fa';
import { calculatePrescriptionLine, isSingleUnitDispense } from '@/utils/prescriptionsCalculator';

const VerifyPrescriptionModal = ({
  isOpen,
  onClose,
  prescription,
  inventory = [],
  onSave,
  submitting = false,
}) => {
  const [rows, setRows] = useState([]);

  const findInventoryMatch = (med) => {
    if (med.inventoryId) {
      const byId = inventory.find((i) => String(i._id || i.id) === String(med.inventoryId));
      if (byId) return byId;
    }
    const name = String(med.drugName || '').trim().toLowerCase();
    return inventory.find((i) => String(i.name || '').trim().toLowerCase() === name) || null;
  };

  const computeFromInventory = (med, inv) => {
    if (!inv) {
      return {
        billedQuantity: Number(med.billedQuantity || med.prescribedQuantity || 1),
        unitPrice: Number(med.unitPrice || 0),
      };
    }
    const line = calculatePrescriptionLine({
      medicationType: med.medicationType,
      dosageAmount: med.dosageAmount,
      dosageUnit: med.dosageUnit,
      frequency: med.frequency,
      duration: med.duration,
      inventory: inv,
    });
    if (line && line.convertible !== false) {
      return {
        billedQuantity: Number(line.billedQuantity || 1),
        unitPrice: Number(line.unitPrice || 0),
      };
    }
    const packSize = Number(inv.packSize) || 1;
    const isSingle = isSingleUnitDispense(med.medicationType, inv);
    return {
      billedQuantity: isSingle ? 1 : Number(med.billedQuantity || med.prescribedQuantity || 1),
      unitPrice: isSingle
        ? Number(inv.sellingPrice || 0)
        : packSize > 0
        ? Number(inv.sellingPrice || 0) / packSize
        : Number(inv.sellingPrice || 0),
    };
  };

  useEffect(() => {
    if (!isOpen || !prescription) return;
    const meds = Array.isArray(prescription.medications) ? prescription.medications : [];
    setRows(
      meds.map((m) => {
        const inv = findInventoryMatch(m);
        const calc = computeFromInventory(m, inv);
        const hasSavedQty = Number(m.billedQuantity) > 0;
        const hasSavedPrice = m.unitPrice !== undefined && m.unitPrice !== null && Number(m.unitPrice) >= 0 && prescription.pharmacistId;
        const qty = hasSavedQty ? Number(m.billedQuantity) : calc.billedQuantity;
        const unitPrice = hasSavedPrice ? Number(m.unitPrice) : calc.unitPrice;
        const availability =
          m.availability === 'unavailable' || (!inv && m.availability !== 'available')
            ? 'unavailable'
            : 'available';

        return {
          ...m,
          inventoryId: m.inventoryId || (inv ? inv._id || inv.id : null),
          availability,
          dosage: m.dosage || (m.dosageAmount ? `${m.dosageAmount}${m.dosageUnit ? ` ${m.dosageUnit}` : ''}` : ''),
          frequency: m.frequency || '',
          duration: m.duration || '',
          billedQuantity: qty,
          unitPrice,
          _invStock: inv ? Number(inv.stock || 0) : 0,
          _invName: inv?.name || '',
          _form: inv?.form || m.form || m.dosageForm || m.medicationType || '',
        };
      })
    );
  }, [isOpen, prescription, inventory]);

  if (!isOpen || !prescription) return null;

  const updateRow = (idx, patch) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const handleAlignInventory = (idx) => {
    const r = rows[idx];
    const inv = findInventoryMatch(r);
    const calc = computeFromInventory(r, inv);
    updateRow(idx, {
      inventoryId: inv ? inv._id || inv.id : r.inventoryId,
      billedQuantity: calc.billedQuantity,
      unitPrice: calc.unitPrice,
      availability: inv && Number(inv.stock || 0) > 0 ? 'available' : 'unavailable',
      _invStock: inv ? Number(inv.stock || 0) : 0,
      _invName: inv?.name || '',
      _form: inv?.form || r.form || r.dosageForm || r.medicationType || '',
    });
  };

  const grandTotal = rows.reduce((sum, r) => {
    if (r.availability === 'unavailable') return sum;
    return sum + Number(r.billedQuantity || 0) * Number(r.unitPrice || 0);
  }, 0);

  const handleSave = (e) => {
    e.preventDefault();
    const cleaned = rows.map(({ _invStock, _invName, _form, ...rest }) => {
      const qty = Math.max(1, Number(rest.billedQuantity) || 1);
      const price = rest.availability === 'unavailable' ? 0 : Math.max(0, Number(rest.unitPrice) || 0);
      return {
        ...rest,
        billedQuantity: qty,
        unitPrice: price,
        lineTotal: qty * price,
      };
    });
    onSave(cleaned);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div className="bg-base-100 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-base-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-base-content">Verify & Edit Prescription</h3>
            <p className="text-xs text-base-content/60">
              Confirm medication availability, dosage, dispense quantity, and inventory-aligned price before sending to cashier.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            disabled={submitting}
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          {rows.map((r, idx) => {
            const isUnavailable = r.availability === 'unavailable';
            const lineTotal = isUnavailable ? 0 : Number(r.billedQuantity || 0) * Number(r.unitPrice || 0);

            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border space-y-3 ${
                  isUnavailable ? 'border-error/30 bg-error/5' : 'border-base-300 bg-base-200/30'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-base text-base-content">{r.drugName}</span>
                      {r._form && (
                        <span className="badge badge-outline badge-sm capitalize text-xs font-medium">
                          {r._form}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-base-content/60">
                      {r._invName ? `Inventory: ${r._invName} (Stock: ${r._invStock})` : 'Not matched in hospital inventory'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-xs btn-outline gap-1"
                      onClick={() => handleAlignInventory(idx)}
                      title="Recalculate from hospital inventory"
                    >
                      <FaSyncAlt className="w-2.5 h-2.5" /> Align to Inventory
                    </button>
                    <select
                      className={`select select-bordered select-xs font-semibold ${
                        isUnavailable ? 'text-error' : 'text-success'
                      }`}
                      value={r.availability}
                      onChange={(e) => updateRow(idx, { availability: e.target.value })}
                    >
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="text-xs text-base-content/70 block mb-1">Dosage</label>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={r.dosage}
                      onChange={(e) => updateRow(idx, { dosage: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-base-content/70 block mb-1">Frequency</label>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={r.frequency}
                      onChange={(e) => updateRow(idx, { frequency: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-base-content/70 block mb-1">Duration</label>
                    <input
                      type="text"
                      className="input input-bordered input-sm w-full"
                      value={r.duration}
                      onChange={(e) => updateRow(idx, { duration: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-base-content/70 block mb-1">Dispense Qty</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      className="input input-bordered input-sm w-full font-semibold"
                      value={r.billedQuantity ?? ''}
                      onChange={(e) => updateRow(idx, { billedQuantity: e.target.value })}
                      disabled={isUnavailable}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-base-content/70 block mb-1">Unit Price (₦)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      className="input input-bordered input-sm w-full font-semibold text-primary"
                      value={isUnavailable ? 0 : (r.unitPrice ?? '')}
                      onChange={(e) => updateRow(idx, { unitPrice: e.target.value })}
                      disabled={isUnavailable}
                    />
                  </div>
                </div>

                <div className="flex justify-end text-sm font-semibold">
                  <span className={isUnavailable ? 'text-error' : 'text-primary'}>
                    Line Total: ₦{lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            );
          })}

          <div className="pt-4 border-t border-base-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs text-base-content/60 block">Verified Prescription Total</span>
              <span className="text-xl font-bold text-primary">
                ₦{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex gap-3">
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary gap-2" disabled={submitting}>
                {submitting ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <FaCheckCircle className="w-4 h-4" />
                )}
                Save Verification
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VerifyPrescriptionModal;
