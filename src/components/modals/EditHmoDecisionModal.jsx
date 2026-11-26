import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';

const EditHmoDecisionModal = ({ isOpen, onClose, item, onSave, submitting }) => {
  const [decision, setDecision] = useState('approved');

  useEffect(() => {
    if (isOpen && item) {
      setDecision(item.status === 'rejected' ? 'rejected' : 'approved');
    }
  }, [isOpen, item]);

  if (!isOpen || !item) return null;

  const total = item.total || 0;

  const handleSave = () => {
    const finalCovered = decision === 'approved' ? total : 0;
    onSave(decision, finalCovered);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={(e) => { if (e.target === e.currentTarget) { const btn = e.currentTarget.querySelector('button.btn-circle') || Array.from(e.currentTarget.querySelectorAll('button')).find(b => b.textContent.includes('\u2715') || b.textContent.toLowerCase().includes('cancel') || b.textContent.toLowerCase().includes('close')); if (btn) btn.click(); } }}>
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
            {item.regimenSummary && (
              <p className="text-xs text-base-content/60 mt-0.5">{item.regimenSummary}</p>
            )}
            <p className="text-xs text-base-content/60">Code: {item.code}</p>
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
                <option value="rejected">Rejected</option>
              </select>
            </div>
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
            disabled={submitting}
          >
            {submitting ? <span className="loading loading-spinner loading-sm" /> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditHmoDecisionModal;
