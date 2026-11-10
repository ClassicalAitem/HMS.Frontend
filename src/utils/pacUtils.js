/**
 * HMO Pre-Authorization Code (PAC) Tracking & Expiry Utilities
 */

export const getPacExpiryStatus = (admission = {}) => {
  const { pacCode, pacValidUntil, pacApprovedDays, admittedAt } = admission;

  if (!pacCode && !pacValidUntil && !pacApprovedDays) {
    return {
      hasPac: false,
      status: 'none',
      label: 'No PAC Logged',
      badgeClass: 'badge-ghost',
      remainingHours: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  // Calculate target date
  let targetDate = pacValidUntil ? new Date(pacValidUntil) : null;
  if (!targetDate && pacApprovedDays && admittedAt) {
    targetDate = new Date(new Date(admittedAt).getTime() + pacApprovedDays * 24 * 60 * 60 * 1000);
  }

  if (!targetDate || isNaN(targetDate.getTime())) {
    return {
      hasPac: Boolean(pacCode),
      status: 'logged',
      label: pacCode ? `PAC: ${pacCode}` : 'PAC Logged',
      badgeClass: 'badge-info',
      remainingHours: null,
      isExpiringSoon: false,
      isExpired: false,
    };
  }

  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));
  const diffDays = Math.ceil(diffHours / 24);

  if (diffHours <= 0) {
    return {
      hasPac: true,
      status: 'expired',
      label: 'PAC Expired',
      badgeClass: 'bg-error/15 text-error border border-error/30 font-semibold',
      remainingHours: diffHours,
      remainingDays: 0,
      targetDate,
      isExpiringSoon: false,
      isExpired: true,
      alertMessage: `PAC coverage ended ${Math.abs(diffHours)} hrs ago. Action required to prevent hospital uncovered costs.`,
    };
  }

  if (diffHours <= 24) {
    return {
      hasPac: true,
      status: 'expiring_soon',
      label: `PAC Expiring in ${diffHours}h`,
      badgeClass: 'bg-warning/20 text-warning-content border border-warning/40 font-semibold animate-pulse',
      remainingHours: diffHours,
      remainingDays: diffDays,
      targetDate,
      isExpiringSoon: true,
      isExpired: false,
      alertMessage: `PAC expires in ${diffHours} hours! Contact HMO desk for extension approval.`,
    };
  }

  return {
    hasPac: true,
    status: 'active',
    label: `PAC Active (${diffDays}d left)`,
    badgeClass: 'bg-success/15 text-success border border-success/30 font-medium',
    remainingHours: diffHours,
    remainingDays: diffDays,
    targetDate,
    isExpiringSoon: false,
    isExpired: false,
    alertMessage: null,
  };
};

