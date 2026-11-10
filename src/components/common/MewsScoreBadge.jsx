import React, { useState } from 'react';
import { calculateMews } from '@/utils/mewsCalculator';
import { FaHeartbeat, FaInfoCircle } from 'react-icons/fa';

const MewsScoreBadge = ({ vitals = {}, showDetailsOnHover = true, size = 'sm', className = '' }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const mews = calculateMews(vitals);

  if (!mews.hasSufficientData) return null;

  const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <div 
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div 
        className={`inline-flex items-center gap-1.5 rounded-md font-medium cursor-help transition-all ${sizeClass} ${mews.badgeClass}`}
        title={`MEWS Score: ${mews.totalScore} (${mews.label}) - ${mews.recommendation}`}
      >
        <FaHeartbeat className="w-3.5 h-3.5 shrink-0 opacity-80" />
        <span>MEWS: {mews.totalScore}</span>
        <span className="opacity-75">• {mews.label}</span>
      </div>

      {/* Breakdown Tooltip */}
      {showDetailsOnHover && showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-base-100 text-base-content rounded-lg shadow-xl border border-base-200 z-[999] text-xs space-y-2 pointer-events-none animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-base-200 pb-1.5">
            <span className="font-bold flex items-center gap-1">
              <FaHeartbeat className="text-primary w-3.5 h-3.5" /> Early Warning Score
            </span>
            <span className="badge badge-sm font-bold">{mews.totalScore} pts</span>
          </div>

          <div className="grid grid-cols-2 gap-1 text-[11px] text-base-content/80">
            {Object.entries(mews.components).map(([key, comp]) => (
              <div key={key} className="flex justify-between">
                <span>{comp.label}:</span>
                <span className="font-semibold">{comp.value} ({comp.score > 0 ? `+${comp.score}` : '0'})</span>
              </div>
            ))}
          </div>

          <div className="border-t border-base-200 pt-1 text-[10px] text-base-content/70 italic">
            {mews.recommendation}
          </div>
        </div>
      )}
    </div>
  );
};

export default MewsScoreBadge;

