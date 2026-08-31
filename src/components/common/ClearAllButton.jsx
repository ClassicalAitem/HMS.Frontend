// components/common/ClearAllButton.jsx
import React, { useState } from 'react';
import { FaBroom } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

/**
 * Bulk "Clear All" action for any Incoming/Awaiting queue page.
 * Sets every item currently in the queue to a terminal status
 * (typically PATIENT_STATUS.CANCELLED) so the queue empties out.
 *
 * Role-agnostic: each Incoming page decides what "the queue" is
 * (awaiting_md, awaiting_consultation, awaiting_nurse, etc.) by
 * passing the already-filtered `items` array and its own
 * `updateStatusFn`.
 *
 * Props:
 * - items: array of currently visible queue entries (each needs an id / _id)
 * - updateStatusFn: async (id) => void — performs the status update for one item
 * - onCleared: () => void — called after clearing, e.g. to refetch the list
 * - label: button text, default "Clear All"
 */
const ClearAllButton = ({ items = [], updateStatusFn, onCleared, label = 'Clear All' }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const count = items.length;

  const handleConfirmClearAll = async () => {
    setIsConfirmOpen(false);
    setIsClearing(true);

    const results = await Promise.allSettled(
      items.map((item) => updateStatusFn(item.id || item._id))
    );

    const failed = results.filter((r) => r.status === 'rejected');
    const succeeded = results.length - failed.length;

    setIsClearing(false);

    if (failed.length === 0) {
      toast.success(`Cleared ${succeeded} ${succeeded === 1 ? 'patient' : 'patients'} from queue`);
    } else if (succeeded > 0) {
      toast.error(`Cleared ${succeeded}, but ${failed.length} failed. Try again for the rest.`);
    } else {
      toast.error('Failed to clear queue');
    }

    if (onCleared) onCleared();
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isClearing || count === 0}
        className="btn btn-error text-white gap-2 normal-case"
        title="Clear all entries in this queue"
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
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear All Entries"
        message={`Remove all ${count} ${count === 1 ? 'entry' : 'entries'} currently in this queue? This marks them all as cancelled and they will no longer appear here. This does not delete any records.`}
        confirmText={`Clear ${count}`}
        cancelText="Cancel"
      />
    </>
  );
};

export default ClearAllButton;