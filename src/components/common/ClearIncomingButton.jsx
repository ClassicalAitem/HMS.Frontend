import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ConfirmationModal from '@/components/modals/ConfirmationModal';

/**
 * Standalone per-row "Clear" action for any Incoming page. Sets the item's
 * status to a terminal value (caller decides which, typically
 * PATIENT_STATUS.CANCELLED) so it drops out of every role's Incoming queue —
 * for cases where a patient/dependant has sat unattended (e.g. "collecting
 * injection for 3 days") and staff want to manually remove it rather than
 * waiting for any automatic staleness rule.
 *
 * Props:
 * - item: the row's data object (used only for the confirmation message and passed to onClear)
 * - onClear: async (item) => void — performs the actual status update
 * - onCleared: () => void — called after a successful clear, e.g. to refresh the list
 * - label: button text, default "Clear"
 */
const ClearItemButton = ({ item, onClear, onCleared, label = 'Clear' }) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleConfirmClear = async () => {
    setIsClearing(true);
    setIsConfirmOpen(false);
    try {
      await onClear(item);
      toast.success(`${item?.name || 'Entry'} cleared from queue`);
      if (onCleared) onCleared();
    } catch (err) {
      console.error('Failed to clear item', err);
      toast.error('Failed to clear entry');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isClearing}
        className="btn btn-sm btn-outline text-error"
        title="Remove from queue"
      >
        {isClearing ? <span className="loading loading-spinner loading-xs" /> : (
          <>
            <FaTimes className="w-3 h-3" /> {label}
          </>
        )}
      </button>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmClear}
        title="Clear Entry"
        message={`Remove ${item?.name || 'this entry'} from the queue? This marks it as cancelled and it will no longer appear here. This does not delete any records.`}
        confirmText="Clear"
        cancelText="Cancel"
      />
    </>
  );
};

export default ClearItemButton;