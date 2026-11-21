import React, { useState, useEffect, useMemo } from 'react';
import { FaTimes, FaTag, FaCheckCircle, FaPercent } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { applyDiscount } from '@/services/api/billingAPI';

const AdjustDiscountModal = ({
  isOpen,
  onClose,
  billing,
  patientName = 'Patient',
  onSuccess,
  approverRole = 'Medical Director', // 'Medical Director' | 'Super Admin' | 'Admin'
}) => {
  // Human-readable label for display
  const roleLabel = approverRole || 'Medical Director';
  const [discountAmount, setDiscountAmount] = useState('');
  const [discountReason, setDiscountReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Compute bill financials
  const itemsSum = useMemo(() => {
    if (!billing?.itemDetails || !Array.isArray(billing.itemDetails)) return 0;
    return billing.itemDetails.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [billing]);

  const subtotal = useMemo(() => {
    return Number(billing?.subtotalAmount) > 0
      ? Number(billing.subtotalAmount)
      : (itemsSum > 0 ? itemsSum : Number(billing?.totalAmount || 0));
  }, [billing, itemsSum]);

  const existingDiscount = Number(billing?.discountAmount || 0);

  // Calculate already paid from receipts or bill props
  const totalPaid = useMemo(() => {
    const total = Number(billing?.totalAmount || 0);
    const outstanding = Number(billing?.outstandingBill || 0);
    if (billing?.isCleared) return total;
    if (total > 0 && outstanding >= 0) {
      return Math.max(0, total - outstanding);
    }
    return 0;
  }, [billing]);

  // Pre-fill existing discount when modal opens
  useEffect(() => {
    if (isOpen && billing) {
      setDiscountAmount(existingDiscount > 0 ? String(existingDiscount) : '');
      const prevReason = (billing.discountReason || '').trim();
      const isGenericRoleDiscount = /^(medical director|super admin|admin) discount$/i.test(prevReason);
      setDiscountReason(
        isGenericRoleDiscount || !prevReason
          ? `${roleLabel} Discount`
          : prevReason
      );
    } else if (!isOpen) {
      setDiscountAmount('');
      setDiscountReason('');
    }
  }, [isOpen, billing, existingDiscount, roleLabel]);

  if (!isOpen || !billing) return null;

  const discountNum = Number(discountAmount) || 0;
  const newTotalPayable = Math.max(0, subtotal - discountNum);
  const newOutstanding = Math.max(0, newTotalPayable - totalPaid);

  const handlePercentageClick = (pct) => {
    const calculated = Math.round((subtotal * pct) / 100);
    setDiscountAmount(String(calculated));
    if (!discountReason || /^\d+%\s+.*Discount$/i.test(discountReason) || /^(medical director|super admin|admin) discount$/i.test(discountReason)) {
      setDiscountReason(`${pct}% ${roleLabel} Discount`);
    }
  };

  const handleFullWaiver = () => {
    setDiscountAmount(String(subtotal));
    setDiscountReason(`Full Medical Waiver approved by ${roleLabel}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (discountNum < 0) {
      toast.error('Discount cannot be negative.');
      return;
    }

    if (discountNum > subtotal) {
      toast.error(`Discount (₦${discountNum.toLocaleString()}) cannot exceed the subtotal (₦${subtotal.toLocaleString()}).`);
      return;
    }

    if (discountNum > 0 && !discountReason.trim()) {
      toast.error(`Please provide a reason for the ${roleLabel} discount.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await applyDiscount(billing.id, {
        discountAmount: discountNum,
        discountReason: discountNum > 0 ? discountReason.trim() : '',
      });

      toast.success(
        discountNum > 0
          ? `Discount of ₦${discountNum.toLocaleString()} applied! Cashier bill updated.`
          : 'Discount removed. Bill reset to original total.'
      );

      if (onSuccess) {
        onSuccess(res?.data || res);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update discount:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/10 text-warning">
              <FaTag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-base-content">
                Grant / Adjust {roleLabel} Discount
              </h3>
              <p className="text-xs text-base-content/60">
                Patient: <span className="font-semibold text-base-content">{patientName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Financial Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block">Subtotal</span>
              <span className="font-bold text-sm text-base-content">₦{subtotal.toLocaleString()}</span>
            </div>
            <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block">Current Disc.</span>
              <span className="font-bold text-sm text-warning">₦{existingDiscount.toLocaleString()}</span>
            </div>
            <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block">Already Paid</span>
              <span className="font-bold text-sm text-success">₦{totalPaid.toLocaleString()}</span>
            </div>
            <div className="bg-base-200/60 p-2.5 rounded-xl border border-base-300">
              <span className="text-[10px] uppercase font-bold text-base-content/60 block">Current Due</span>
              <span className="font-bold text-sm text-error">₦{Number(billing.outstandingBill || 0).toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Percentage Presets */}
          <div>
            <label className="block text-xs font-semibold text-base-content mb-1.5 flex items-center gap-1.5">
              <FaPercent className="text-xs text-primary" />
              <span>Quick Preset Shortcuts</span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePercentageClick(10)}
                className="btn btn-xs btn-outline hover:btn-warning"
              >
                10% (₦{Math.round(subtotal * 0.1).toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => handlePercentageClick(25)}
                className="btn btn-xs btn-outline hover:btn-warning"
              >
                25% (₦{Math.round(subtotal * 0.25).toLocaleString()})
              </button>
              <button
                type="button"
                onClick={() => handlePercentageClick(50)}
                className="btn btn-xs btn-outline hover:btn-warning"
              >
                50% (₦{Math.round(subtotal * 0.5).toLocaleString()})
              </button>
              <button
                type="button"
                onClick={handleFullWaiver}
                className="btn btn-xs btn-warning font-bold"
              >
                Full Waiver (100%)
              </button>
            </div>
          </div>

          {/* Discount Amount Input */}
          <div>
            <label className="block text-xs font-semibold text-base-content mb-1">
              {roleLabel} Discount Amount (₦) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-sm font-bold text-base-content/50">₦</span>
              <input
                type="number"
                min="0"
                max={subtotal}
                step="1"
                required
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="input input-bordered w-full pl-8 font-semibold text-sm"
              />
            </div>
            <p className="text-[11px] text-base-content/60 mt-1">
              Enter 0 to remove an existing discount completely.
            </p>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-base-content mb-1">
              Reason for {roleLabel} Discount {discountNum > 0 && <span className="text-error">*</span>}
            </label>
            <input
              type="text"
              required={discountNum > 0}
              value={discountReason}
              onChange={(e) => setDiscountReason(e.target.value)}
              placeholder="e.g. Compassionate waiver, patient plea, hospital goodwill"
              className="input input-bordered w-full text-sm"
            />
          </div>

          {/* Live Result Calculation Preview */}
          <div className="p-3.5 bg-primary/5 border border-primary/20 rounded-xl space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">
              Impact on Patient's Bill & Cashier
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-base-content/70">Original Subtotal:</span>
                <span className="font-semibold text-base-content">₦{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-warning font-semibold">
                <span>{roleLabel} Discount:</span>
                <span>-₦{discountNum.toLocaleString()}</span>
              </div>
              <div className="flex justify-between border-t border-primary/20 pt-1 font-bold">
                <span className="text-base-content">New Net Payable Bill:</span>
                <span className="text-primary text-sm">₦{newTotalPayable.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold pt-0.5">
                <span className="text-base-content/70">Remaining Balance to Pay at Cashier:</span>
                <span className={newOutstanding > 0 ? 'text-error text-sm' : 'text-success text-sm'}>
                  {newOutstanding > 0 ? `₦${newOutstanding.toLocaleString()}` : '₦0 (Cleared)'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-base-200">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn btn-ghost btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-sm gap-2 px-5 font-semibold shadow-md"
            >
              {isSubmitting ? (
                <>
                  <span className="loading loading-spinner loading-xs"></span>
                  <span>Updating Bill...</span>
                </>
              ) : (
                <>
                  <FaCheckCircle className="w-3.5 h-3.5" />
                  <span>Save & Update Bill</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustDiscountModal;
