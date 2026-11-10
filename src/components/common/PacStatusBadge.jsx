import React, { useState } from 'react';
import { FaShieldAlt, FaClock, FaExclamationTriangle, FaEdit, FaTimes } from 'react-icons/fa';
import { getPacExpiryStatus } from '@/utils/pacUtils';
import toast from 'react-hot-toast';

const PacStatusBadge = ({ admission = {}, onUpdatePac, editable = false, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const pac = getPacExpiryStatus(admission);

  const [formData, setFormData] = useState({
    pacCode: admission.pacCode || '',
    pacApprovedDays: admission.pacApprovedDays || '',
    pacValidUntil: admission.pacValidUntil ? new Date(admission.pacValidUntil).toISOString().split('T')[0] : '',
    pacNotes: admission.pacNotes || '',
  });
  const [saving, setSaving] = useState(false);

  const handleOpen = () => {
    if (!editable) return;
    setFormData({
      pacCode: admission.pacCode || '',
      pacApprovedDays: admission.pacApprovedDays || '',
      pacValidUntil: admission.pacValidUntil ? new Date(admission.pacValidUntil).toISOString().split('T')[0] : '',
      pacNotes: admission.pacNotes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!onUpdatePac) {
      setIsModalOpen(false);
      return;
    }
    try {
      setSaving(true);
      await onUpdatePac({
        pacCode: formData.pacCode.trim(),
        pacApprovedDays: formData.pacApprovedDays ? Number(formData.pacApprovedDays) : undefined,
        pacValidUntil: formData.pacValidUntil ? new Date(formData.pacValidUntil).toISOString() : undefined,
        pacNotes: formData.pacNotes.trim(),
      });
      toast.success('HMO PAC authorization updated');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to update PAC:', err);
      toast.error('Failed to update PAC');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs select-none transition-all ${
          pac.badgeClass
        } ${editable ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'} ${className}`}
        title={pac.alertMessage || (pac.hasPac ? `PAC: ${admission.pacCode || 'Logged'}` : 'Click to add HMO PAC')}
      >
        {pac.isExpired ? (
          <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
        ) : pac.isExpiringSoon ? (
          <FaClock className="w-3.5 h-3.5 shrink-0" />
        ) : (
          <FaShieldAlt className="w-3.5 h-3.5 shrink-0" />
        )}
        <span>{pac.label}</span>
        {editable && <FaEdit className="w-2.5 h-2.5 ml-1 opacity-70" />}
      </div>

      {/* Edit PAC Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div 
            className="card w-full max-w-md bg-base-100 shadow-2xl border border-base-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-base-200 flex items-center justify-between bg-base-200/50">
              <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                <FaShieldAlt className="w-4 h-4 text-info" />
                HMO Pre-Authorization Code (PAC)
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="btn btn-ghost btn-circle btn-xs"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                  PAC / Authorization Code:
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PAC-HYG-2026-992"
                  value={formData.pacCode}
                  onChange={(e) => setFormData({ ...formData, pacCode: e.target.value })}
                  className="input input-sm input-bordered w-full text-xs font-mono uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                    Approved Bed Days:
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 3"
                    value={formData.pacApprovedDays}
                    onChange={(e) => setFormData({ ...formData, pacApprovedDays: e.target.value })}
                    className="input input-sm input-bordered w-full text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                    Valid Until Date:
                  </label>
                  <input
                    type="date"
                    value={formData.pacValidUntil}
                    onChange={(e) => setFormData({ ...formData, pacValidUntil: e.target.value })}
                    className="input input-sm input-bordered w-full text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                  HMO Extension / Approval Notes:
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes from HMO officer (e.g. extension granted by phone, contact officer name)..."
                  value={formData.pacNotes}
                  onChange={(e) => setFormData({ ...formData, pacNotes: e.target.value })}
                  className="textarea textarea-bordered w-full text-xs"
                />
              </div>

              {pac.alertMessage && (
                <div className={`p-2.5 rounded-lg text-xs ${pac.badgeClass}`}>
                  {pac.alertMessage}
                </div>
              )}

              <div className="p-3 -mx-5 -mb-5 mt-4 border-t border-base-200 bg-base-200/30 flex justify-end gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn btn-sm btn-ghost"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="btn btn-sm btn-primary"
                >
                  {saving ? 'Saving...' : 'Save PAC Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PacStatusBadge;

