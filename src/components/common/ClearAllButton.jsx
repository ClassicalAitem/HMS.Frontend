// components/common/ClearAllButton.jsx
import React, { useState, useMemo } from 'react';
import { FaBroom } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

/**
 * Bulk "Clear All" action for any Incoming/Awaiting queue page.
 * Sets items currently in the queue to a terminal status
 * (typically PATIENT_STATUS.CANCELLED) so the queue empties out.
 *
 * It extracts unique statuses from the current items. If multiple statuses
 * exist, it provides a dropdown in the confirmation modal so the user can
 * choose to clear just one status or all of them.
 *
 * Props:
 * - items: array of currently visible queue entries (each needs an id / _id, and status)
 * - updateStatusFn: async (item) => void — performs the status update for one item
 * - onCleared: () => void — called after clearing, e.g. to refetch the list
 * - label: button text, default "Clear All"
 */
const ClearAllButton = ({ items = [], updateStatusFn, onCleared, label = 'Clear All' }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Extract unique statuses from the queue
  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    items.forEach((item) => {
      if (item.status) {
        statuses.add(item.status.toLowerCase());
      }
    });
    return Array.from(statuses);
  }, [items]);

  const prettifyStatus = (s) => {
    if (!s) return '';
    return s.split('_').map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const count = items.length;

  const handleConfirmClearAll = async () => {
    setIsConfirmOpen(false);
    setIsClearing(true);

    const itemsToClear = selectedStatus === 'all' 
      ? items 
      : items.filter((item) => item.status && item.status.toLowerCase() === selectedStatus);

    if (itemsToClear.length === 0) {
      setIsClearing(false);
      toast.error('No items match the selected status');
      return;
    }

    const results = await Promise.allSettled(
      itemsToClear.map((item) => updateStatusFn(item))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    const succeeded = results.length - failed.length;

    setIsClearing(false);
    setSelectedStatus('all'); // reset

    if (failed.length === 0) {
      toast.success(`Cleared ${succeeded} ${succeeded === 1 ? 'patient' : 'patients'} from queue`);
    } else if (succeeded > 0) {
      toast.error(`Cleared ${succeeded}, but ${failed.length} failed. Try again for the rest.`);
    } else {
      toast.error('Failed to clear queue');
    }

    if (onCleared) onCleared();
  };

  const itemsToClearCount = selectedStatus === 'all' 
    ? count 
    : items.filter((item) => item.status && item.status.toLowerCase() === selectedStatus).length;

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isClearing || count === 0}
        className="btn btn-error text-white gap-2 normal-case"
        title="Clear entries in this queue"
      >
        {isClearing ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>
            <FaBroom className="w-4 h-4" /> {label}
          </>
        )}
      </button>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => {
            setIsConfirmOpen(false);
            setSelectedStatus('all');
        }}
        onConfirm={handleConfirmClearAll}
        title="Clear Queue Entries"
        message={`Remove entries currently in this queue? This marks them as cancelled and they will no longer appear here. This does not delete any records.`}
        confirmText={`Clear ${itemsToClearCount}`}
        cancelText="Cancel"
      >
        {uniqueStatuses.length > 1 && (
          <div className="form-control w-full mt-2">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Which status would you like to clear?</span>
            </label>
            <select 
              className="select select-bordered w-full" 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses ({count} entries)</option>
              {uniqueStatuses.map((status) => {
                  const countForStatus = items.filter((item) => item.status && item.status.toLowerCase() === status).length;
                  return (
                    <option key={status} value={status}>
                      {prettifyStatus(status)} ({countForStatus} entries)
                    </option>
                  );
              })}
            </select>
          </div>
        )}
      </ConfirmationModal>
    </>
  );
};

export default ClearAllButton;