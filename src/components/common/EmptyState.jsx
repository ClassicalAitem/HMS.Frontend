import React from 'react';
import { FiBox, FiPlus } from 'react-icons/fi';
import { SlRefresh } from 'react-icons/sl';

const EmptyState = ({
  title = 'Nothing here yet',
  description = 'When there is activity, it will appear here.',
  actionLabel = 'Refresh',
  onAction,
  icon,
}) => {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative mb-1">
        <div className="flex items-center justify-center w-28 h-auto rounded-full">
          <div className="text-base-content/40 animate-bounce">
            {icon || <FiBox className="w-auto h-8" />}
          </div>
        </div>
      </div>

      <h3 className="text-md font-semibold text-base-content mb-4">{title}</h3>
      <p className="max-w-xs text-sm text-base-content/70 mb-6 hidden">{description}</p>

      {onAction && (
        <button
          type="button"
          onClick={onAction}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white shadow hover:bg-primary/90 active:scale-[0.98] transition text-md"
          aria-label={actionLabel}
        >
          <SlRefresh className="w-4 h-4" />
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;