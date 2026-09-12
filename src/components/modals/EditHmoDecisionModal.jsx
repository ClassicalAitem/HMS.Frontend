import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const EditHmoDecisionModal = ({ isOpen, onClose, item, onSave, submitting }) => {
  const [decision, setDecision] = useState('approved');
  const [hmoCovered, setHmoCovered] = useState('');

  useEffect(() => {
    if (isOpen && item) {
      setDecision(item.status || 'approved');
      setHmoCovered(item.hmoCovered || 0);
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const total = item.total || 0;
  const isPartial = decision === 'partial';

  const handleSave = () => {
    let finalCovered = 0;
    if (decision === 'approved') finalCovered = total;
    else if (decision === 'partial') finalCovered = Number(hmoCovered) || 0;
    
    // Validate partial covered amount
    if (decision === 'partial' && (finalCovered <= 0 || finalCovered >= total)) {
      return; // Validation handled via required/min/max in input, but safe check here
    }

    onSave(decision, finalCovered);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between">
          <h3 className="font-semibold text-lg text-base-content">Edit HMO Decision</h3>
          <button 
            onClick={onClose}
            disabled={submitting}
            className="btn btn-ghost btn-sm btn-square text-base-content/70 hover:text-base-content"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <p className="text-sm font-medium text-base-content">{item.description}</p>
            <p className="text-xs text-base-content/60">Code: {item.code}</p>
            <p className="text-sm font-semibold mt-1">Total Bill: ₦{total.toLocaleString()}</p>
          </div>

          <div className="space-y-4">
            <div className="form-control">
              <label className="label text-sm font-medium pb-1">Decision</label>
              <select 
                className="select select-bordered w-full"
                value={decision}
                onChange={(e) => setDecision(e.target.value)}
                disabled={submitting}
              >
                <option value="approved">Approved</option>
                <option value="partial">Partial</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {isPartial && (
              <div className="form-control animate-in fade-in slide-in-from-top-2">
                <label className="label text-sm font-medium pb-1">HMO Covered Amount (₦)</label>
                <input 
                  type="number"
                  className="input input-bordered w-full"
                  placeholder="Enter amount"
                  value={hmoCovered}
                  onChange={(e) => setHmoCovered(e.target.value)}
                  disabled={submitting}
                  min={1}
                  max={total - 1}
                />
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-base-200/50 border-t border-base-200 flex justify-end gap-3">
          <button 
            className="btn btn-ghost" 
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleSave}
            disabled={submitting || (isPartial && (!hmoCovered || hmoCovered <= 0 || hmoCovered >= total))}
          >
            {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHmoDecisionModal;
