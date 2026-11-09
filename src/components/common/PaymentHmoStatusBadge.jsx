import React from 'react';
import { FaCheckCircle, FaTimesCircle, FaClock, FaCheck, FaTimes } from 'react-icons/fa';

/**
 * PaymentHmoStatusBadge
 * Displays HMO Decision (Approved / Rejected / Pending / Partial)
 * and Payment Status (Paid / Unpaid).
 */
const PaymentHmoStatusBadge = ({
  hmoStatus,
  paymentStatus,
  hasHmo = false,
  isPaid = false,
  size = 'sm',
  showPayment = true,
  showHmo = true,
  className = '',
}) => {
  const normHmo = hmoStatus ? String(hmoStatus).toLowerCase().trim() : (hasHmo ? 'pending' : null);
  const effectiveIsPaid = Boolean(
    isPaid ||
    paymentStatus === 'paid' ||
    paymentStatus === 'approved' ||
    normHmo === 'approved'
  );
  const normPayment = effectiveIsPaid ? 'paid' : (paymentStatus ? String(paymentStatus).toLowerCase().trim() : 'unpaid');

  const sizeClass = size === 'xs' ? 'badge-xs text-[10px]' : size === 'md' ? 'badge-md' : 'badge-sm text-xs';

  // HMO Badge configuration
  let hmoLabel = 'Pending Decision';
  let hmoBadgeClass = 'bg-warning/20 text-warning-content border-warning/40';
  let HmoIcon = FaClock;

  if (normHmo === 'approved') {
    hmoLabel = 'HMO: Approved';
    hmoBadgeClass = 'badge-success text-white shadow-xs';
    HmoIcon = FaCheckCircle;
  } else if (normHmo === 'rejected') {
    hmoLabel = 'HMO: Rejected';
    hmoBadgeClass = 'badge-error text-white shadow-xs';
    HmoIcon = FaTimesCircle;
  } else if (normHmo === 'partial') {
    hmoLabel = 'HMO: Partial';
    hmoBadgeClass = 'badge-warning text-warning-content shadow-xs';
    HmoIcon = FaClock;
  } else if (normHmo === 'pending') {
    hmoLabel = 'HMO: Pending';
    hmoBadgeClass = 'bg-warning/20 text-warning-content border-warning/50 font-medium';
    HmoIcon = FaClock;
  }

  // Payment Badge configuration
  const isPaidStatus = normPayment === 'paid';
  const paymentLabel = isPaidStatus ? 'Paid' : 'Unpaid';
  const paymentBadgeClass = isPaidStatus
    ? 'badge-success text-white shadow-xs font-semibold'
    : 'badge-error text-white shadow-xs font-semibold';
  const PaymentIcon = isPaidStatus ? FaCheck : FaTimes;

  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* HMO Decision Badge */}
      {showHmo && normHmo && (
        <span
          className={`badge ${sizeClass} ${hmoBadgeClass} gap-1 inline-flex items-center font-medium whitespace-nowrap`}
          title={`HMO Decision: ${hmoLabel}`}
        >
          <HmoIcon className="w-2.5 h-2.5 shrink-0" />
          <span>{hmoLabel}</span>
        </span>
      )}

      {/* Payment Status Badge (Paid / Unpaid) */}
      {showPayment && (
        <span
          className={`badge ${sizeClass} ${paymentBadgeClass} gap-1 inline-flex items-center whitespace-nowrap`}
          title={`Payment Status: ${paymentLabel}`}
        >
          <PaymentIcon className="w-2.5 h-2.5 shrink-0" />
          <span>{paymentLabel}</span>
        </span>
      )}
    </div>
  );
};

export default PaymentHmoStatusBadge;

