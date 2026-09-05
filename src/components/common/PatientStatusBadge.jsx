import React from 'react';
import { getStatusBadgeClass, getStatusDisplayText, formatSenderShortName } from '@/utils/statusUtils';
import { formatNigeriaDateTimeShort } from '@/utils/formatDateTimeUtils';

/**
 * PatientStatusBadge
 * Reusable badge component with interactive hover details card showing
 * who updated the status last (Surname .AA), status details, and timestamp.
 */
const PatientStatusBadge = ({
  status,
  statusSenderName,
  statusUser,
  updatedAt,
  className = '',
  badgeClass: customBadgeClass,
  tooltipAlign = 'center', // 'right' | 'left' | 'center'
}) => {
  const displayStatus = getStatusDisplayText(status);
  const badgeClass = customBadgeClass || getStatusBadgeClass(status);
  const senderText = formatSenderShortName(statusSenderName, statusUser);

  const formattedTime = React.useMemo(() => {
    if (!updatedAt || updatedAt === '—') return null;
    try {
      const d = new Date(updatedAt);
      if (isNaN(d.getTime())) return typeof updatedAt === 'string' ? updatedAt : null;
      return formatNigeriaDateTimeShort(updatedAt);
    } catch {
      return null;
    }
  }, [updatedAt]);

  const alignClass =
    tooltipAlign === 'left'
      ? 'left-0'
      : tooltipAlign === 'center'
      ? 'left-1/2 -translate-x-1/2'
      : 'right-0';

  return (
    <div className={`relative group cursor-pointer inline-block ${className}`}>
      {/* Badge button */}
      <span className={`badge whitespace-nowrap font-medium capitalize ${badgeClass}`}>
        {displayStatus}
      </span>

      {/* Hover Tooltip Card */}
      <div
        className={`absolute ${alignClass} bottom-full mb-2 hidden group-hover:flex flex-col items-start gap-1 rounded-lg border border-base-300 bg-base-100 p-2.5 shadow-xl text-xs z-30 min-w-[170px] pointer-events-none animate-in fade-in zoom-in-95 duration-150`}
      >
        <span className="font-bold text-primary uppercase text-[10px] tracking-wider">
          Status Details
        </span>

        <p className="text-base-content/80">
          Status:{' '}
          <span className="font-semibold text-base-content capitalize">
            {displayStatus}
          </span>
        </p>

        <p className="text-base-content/80">
          Last Updated By:{' '}
          <span className="font-semibold text-primary">
            {senderText || 'Staff / System'}
          </span>
        </p>

        {formattedTime && (
          <p className="text-[10px] text-base-content/50 border-t border-base-200 pt-1 w-full mt-0.5">
            Updated: {formattedTime}
          </p>
        )}
      </div>
    </div>
  );
};

export default PatientStatusBadge;
