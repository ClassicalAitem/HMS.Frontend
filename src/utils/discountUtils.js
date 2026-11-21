/**
 * Utilities for formatting discount displays across Cashier, Super Admin, and Medical Director views.
 */

export const getDiscountDisplay = (bill) => {
  if (!bill) return null;
  const discountAmount = Number(bill.discountAmount || 0);
  if (discountAmount <= 0) return null;

  const amountStr = `₦${discountAmount.toLocaleString()}`;
  const rawReason = (bill.discountReason || '').trim();

  // Determine approver role: check explicit field first, then sniff from reason
  let role = (bill.discountApprovedRole || '').trim();
  if (!role) {
    if (/super[-_\s]?admin/i.test(rawReason)) {
      role = 'Super Admin';
    } else if (/medical[-_\s]?director/i.test(rawReason)) {
      role = 'Medical Director';
    } else if (/\badmin\b/i.test(rawReason)) {
      role = 'Admin';
    }
  }

  // Generic reason formats like "Medical Director Discount" or "Super Admin Discount"
  const isGenericRoleDiscount = /^(super[-_\s]?admin|medical[-_\s]?director|admin)?\s*discount$/i.test(rawReason);

  let title = role ? `${role} Discount` : 'Discount';
  let badgeText = '';

  if (!rawReason || isGenericRoleDiscount) {
    badgeText = `${title}: ${amountStr}`;
  } else if (/discount|waiver/i.test(rawReason)) {
    // e.g. "10% Super Admin Discount" or "Full Medical Waiver approved by Super Admin"
    badgeText = `${rawReason}: ${amountStr}`;
    title = rawReason;
  } else {
    // Custom reason like "Indigent patient assistance"
    badgeText = `${title}: ${amountStr} (${rawReason})`;
  }

  return {
    amount: discountAmount,
    amountStr,
    role: role || 'Discount',
    title,
    badgeText,
    reason: rawReason,
  };
};
