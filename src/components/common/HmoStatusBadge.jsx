import React from 'react';
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils';

/**
 * HmoStatusBadge
 * Reusable badge displaying HMO coverage decision:
 * - 'approved' -> "HMO: Covered" (badge-success)
 * - 'partial'  -> "HMO: Partial" (badge-warning)
 * - 'rejected' -> "HMO: Not Covered" (badge-error)
 * - 'pending'  -> "HMO: Pending" (soft badge-warning)
 */
const HmoStatusBadge = ({
  hmoStatus,
  approvedBy,
  approvedAt,
  className = '',
  size = 'sm', // 'xs' | 'sm' | 'md'
  showTooltip = true,
}) => {
  if (!hmoStatus) return null;

  const normalized = String(hmoStatus).toLowerCase().trim();

  let label = 'HMO: Pending';
  let badgeClass = 'badge-warning/80 text-warning-content';

  if (normalized === 'approved') {
    label = 'HMO: Covered';
    badgeClass = 'badge-success text-success-content';
  } else if (normalized === 'partial') {
    label = 'HMO: Partial';
    badgeClass = 'badge-warning text-warning-content';
  } else if (normalized === 'rejected') {
    label = 'HMO: Not Covered';
    badgeClass = 'badge-error text-error-content';
  } else if (normalized === 'pending') {
    label = 'HMO: Pending';
    badgeClass = 'badge-ghost text-base-content/70 border-base-300';
  } else {
    label = `HMO: ${normalized}`;
    badgeClass = 'badge-ghost';
  }

  const sizeClass = size === 'xs' ? 'badge-xs text-[10px]' : size === 'md' ? 'badge-md' : 'badge-sm text-xs';

  const formattedTime = React.useMemo(() => {
    if (!approvedAt) return null;
    try {
      const d = new Date(approvedAt);
      if (isNaN(d.getTime())) return null;
      return formatNigeriaDateTimeShort(approvedAt);
    } catch {
      return null;
    }
  }, [approvedAt]);

  const badgeElement = (
    <span
      className={`badge font-medium whitespace-nowrap shadow-xs inline-flex items-center gap-1 ${sizeClass} ${badgeClass} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
      <span>{label}</span>
    </span>
  );

  if (!showTooltip || (!approvedBy && !formattedTime)) {
    return badgeElement;
  }

  return (
    <div className="relative group cursor-pointer inline-block">
      {badgeElement}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:flex flex-col items-start gap-1 rounded-lg border border-base-300 bg-base-100 p-2.5 shadow-xl text-xs z-30 min-w-[150px] pointer-events-none animate-in fade-in zoom-in-95 duration-150">
        <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
          HMO Decision
        </span>
        <p className="text-base-content/80">
          Status: <span className="font-semibold text-base-content capitalize">{normalized}</span>
        </p>
        {approvedBy && (
          <p className="text-base-content/80">
            Reviewed by: <span className="font-semibold text-base-content">{approvedBy}</span>
          </p>
        )}
        {formattedTime && (
          <p className="text-base-content/60 text-[10px] pt-1 border-t border-base-200 w-full">
            {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
};

export default HmoStatusBadge;
