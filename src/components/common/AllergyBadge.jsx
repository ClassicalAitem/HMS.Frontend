import React, { useState } from 'react';
import { FaShieldAlt, FaExclamationTriangle, FaPlus, FaTimes, FaCheck } from 'react-icons/fa';
import { parseAllergies, COMMON_ALLERGY_TAGS } from '@/utils/allergyUtils';
import toast from 'react-hot-toast';

const AllergyBadge = ({ allergies, onUpdateAllergies, editable = false, className = '' }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAllergies, setCurrentAllergies] = useState(parseAllergies(allergies));
  const [customTag, setCustomTag] = useState('');
  const [saving, setSaving] = useState(false);

  const parsed = parseAllergies(allergies);
  const isNKDA = parsed.length === 0 || parsed.some(a => a.toLowerCase().includes('nkda') || a.toLowerCase().includes('no known'));

  const handleOpenModal = () => {
    if (!editable) return;
    setCurrentAllergies(parseAllergies(allergies));
    setIsModalOpen(true);
  };

  const toggleAllergy = (tag) => {
    if (tag.includes('NKDA')) {
      setCurrentAllergies(['No Known Drug Allergies (NKDA)']);
      return;
    }

    const withoutNKDA = currentAllergies.filter(a => !a.toLowerCase().includes('nkda'));
    if (withoutNKDA.includes(tag)) {
      setCurrentAllergies(withoutNKDA.filter(a => a !== tag));
    } else {
      setCurrentAllergies([...withoutNKDA, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (currentAllergies.some(a => a.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Allergy already added');
      return;
    }
    const withoutNKDA = currentAllergies.filter(a => !a.toLowerCase().includes('nkda'));
    setCurrentAllergies([...withoutNKDA, trimmed]);
    setCustomTag('');
  };

  const handleSave = async () => {
    if (!onUpdateAllergies) {
      setIsModalOpen(false);
      return;
    }
    try {
      setSaving(true);
      await onUpdateAllergies(currentAllergies);
      toast.success('Allergy records updated');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to update allergies:', err);
      toast.error('Failed to update allergies');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div 
        onClick={handleOpenModal}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer select-none transition-all ${
          isNKDA 
            ? 'bg-success/15 text-success border border-success/30 hover:bg-success/25' 
            : 'bg-error/15 text-error border border-error/30 hover:bg-error/25 shadow-xs'
        } ${editable ? 'cursor-pointer ring-offset-base-100 hover:ring-1 hover:ring-primary' : 'cursor-default'} ${className}`}
        title={editable ? 'Click to manage patient drug allergies' : undefined}
      >
        {isNKDA ? (
          <>
            <FaShieldAlt className="w-3.5 h-3.5 shrink-0" />
            <span>No Known Drug Allergies (NKDA)</span>
          </>
        ) : (
          <>
            <FaExclamationTriangle className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[280px]">
              Allergies: {parsed.join(', ')}
            </span>
          </>
        )}
        {editable && <span className="text-[10px] opacity-70 underline ml-1">Edit</span>}
      </div>

      {/* Edit Allergies Modal */}
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
                <FaExclamationTriangle className="w-4 h-4 text-warning" />
                Manage Patient Drug Allergies
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="btn btn-ghost btn-circle btn-xs"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-base-content/70 mb-2 block">
                  Quick Select Common Drug Allergens:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_ALLERGY_TAGS.map((tag) => {
                    const isSelected = currentAllergies.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleAllergy(tag)}
                        className={`btn btn-xs rounded-full gap-1 transition-all ${
                          isSelected ? 'btn-primary' : 'btn-outline border-base-300'
                        }`}
                      >
                        {isSelected && <FaCheck className="w-2.5 h-2.5" />}
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-base-content/70 mb-1 block">
                  Or Add Other Allergen:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomTag())}
                    placeholder="e.g. Paracetamol, Metronidazole..."
                    className="input input-sm input-bordered flex-1 text-xs"
                  />
                  <button 
                    type="button" 
                    onClick={addCustomTag}
                    className="btn btn-sm btn-outline"
                  >
                    <FaPlus className="w-3 h-3" /> Add
                  </button>
                </div>
              </div>

              {currentAllergies.length > 0 && (
                <div className="bg-base-200/50 p-3 rounded-lg border border-base-200">
                  <span className="text-[11px] font-semibold text-base-content/70 block mb-1.5">
                    Selected Patient Allergies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {currentAllergies.map((allergy, i) => (
                      <span 
                        key={i} 
                        className="badge badge-sm badge-error text-white gap-1 py-2 text-[11px]"
                      >
                        {allergy}
                        <button
                          type="button"
                          onClick={() => setCurrentAllergies(currentAllergies.filter(a => a !== allergy))}
                          className="hover:text-black"
                        >
                          <FaTimes className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-base-200 bg-base-200/30 flex justify-end gap-2">
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="btn btn-sm btn-ghost"
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSave} 
                disabled={saving}
                className="btn btn-sm btn-primary"
              >
                {saving ? 'Saving...' : 'Save Allergies'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllergyBadge;

