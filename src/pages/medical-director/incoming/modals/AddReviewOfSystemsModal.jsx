import React, { useEffect, useState } from 'react';
import { FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  createReviewOfSystems,
  getReviewOfSystemsTemplates,
  updateReviewOfSystems,
} from '@/services/api/reviewOfSystemAPI';
import { REVIEW_OF_SYSTEMS } from '@/constants/reviewOfSystem';

const SYSTEMS = Object.values(REVIEW_OF_SYSTEMS);
const emptyReview = { system: SYSTEMS[0], findings: '', isNormal: false };

const AddReviewOfSystemsModal = ({
  isOpen,
  onClose,
  consultationId,
  patientId,
  dependantId,
  review,
  onReviewAdded,
}) => {
  const [reviews, setReviews] = useState([{ ...emptyReview }]);
  const [suggestions, setSuggestions] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setReviews(review
      ? [{
          system: review.system || SYSTEMS[0],
          findings: review.findings || '',
          isNormal: review.isNormal ?? false,
        }]
      : [{ ...emptyReview }]);
    setSuggestions({});
  }, [isOpen, review]);

  if (!isOpen) return null;

  const updateReview = (index, field, value) => {
    setReviews((previous) => previous.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: value } : item
    )));
  };

  const searchSuggestions = async (index, value) => {
    updateReview(index, 'findings', value);
    if (!value.trim()) {
      setSuggestions((previous) => ({ ...previous, [index]: [] }));
      return;
    }

    try {
      const response = await getReviewOfSystemsTemplates({
        system: reviews[index].system,
        query: value,
      });
      const data = response?.data || response || [];
      setSuggestions((previous) => ({
        ...previous,
        [index]: Array.isArray(data) ? data : [],
      }));
    } catch {
      // Suggestions are optional; free-text entry still works.
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validReviews = reviews.filter((item) => item.system && item.findings.trim());
    if (!validReviews.length) {
      toast.error('Add at least one review of systems entry');
      return;
    }

    setSaving(true);
    try {
      const payload = validReviews.map((item) => ({
        system: item.system,
        findings: item.findings.trim(),
        isNormal: item.isNormal,
      }));

      if (review?.id || review?._id) {
        await updateReviewOfSystems(review.id || review._id, payload[0]);
      } else {
        await createReviewOfSystems(
          payload.map((item) => ({
            ...item,
            consultationId,
            patientId,
            ...(dependantId && { dependantId }),
          }))
        );
      }

      toast.success(review ? 'Review of systems updated successfully' : 'Review of systems saved successfully');
      onReviewAdded?.();
      onClose?.();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to save review of systems');
    } finally {
      setSaving(false);
    }
  };

  const addReview = () => setReviews((previous) => [...previous, { ...emptyReview }]);
  const removeReview = (index) => setReviews((previous) => previous.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-base-100 rounded-xl shadow-2xl overflow-hidden border border-base-200">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold text-base-content">{review ? 'Edit Review of Systems' : 'Review of Systems'}</h2>
          <button type="button" onClick={onClose} disabled={saving} className="text-base-content/60 hover:text-base-content">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-5">
          {reviews.map((item, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="mb-2 flex gap-2">
                <select
                  className="select select-bordered flex-1"
                  value={item.system}
                  onChange={(event) => updateReview(index, 'system', event.target.value)}
                  disabled={saving}
                >
                  {SYSTEMS.map((system) => (
                    <option key={system} value={system}>
                      {system.charAt(0).toUpperCase() + system.slice(1)}
                    </option>
                  ))}
                </select>
                {!review && reviews.length > 1 && (
                  <button type="button" className="btn btn-error btn-outline" onClick={() => removeReview(index)} disabled={saving}>
                    <FaTrash />
                  </button>
                )}
              </div>

              <input
                list={`ros-suggestions-${index}`}
                className="input input-bordered w-full"
                placeholder="Enter findings"
                value={item.findings}
                onChange={(event) => searchSuggestions(index, event.target.value)}
                disabled={saving}
              />
              <datalist id={`ros-suggestions-${index}`}>
                {(suggestions[index] || []).map((suggestion) => (
                  <option key={suggestion.id || suggestion.phrase} value={suggestion.phrase} />
                ))}
              </datalist>

         

              <label className="label cursor-pointer justify-start gap-10 pt-5">
                <input type="checkbox" className="checkbox" checked={item.isNormal} onChange={(event) => updateReview(index, 'isNormal', event.target.checked)} disabled={saving} />
                <span className="label-text">Normal</span>
              </label>
            </div>
          ))}

          {!review && (
            <button type="button" className="btn btn-outline btn-sm" onClick={addReview} disabled={saving}>
              <FaPlus /> Add another system
            </button>
          )}

          <div className="flex justify-end gap-3 pt-3">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Skip</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : review ? 'Update Review of Systems' : 'Save Review of Systems'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReviewOfSystemsModal;