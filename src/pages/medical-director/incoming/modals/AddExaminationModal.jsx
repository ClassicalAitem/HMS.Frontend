import { useEffect, useState } from 'react';
import { FaPlus, FaTimes, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import {
  createExamination,
  getExaminationTemplates,
  updateExamination,
} from '@/services/api/examinationAPI';

const SYSTEMS = [
  'CVS',
  'RESPIRATORY',
  'ABDOMEN',
  'CNS',
  'MUSCULOSKELETAL',
  'ENT',
  'OTHER',
];

const emptyFinding = {
  system: 'CVS',
  findings: '',
  isNormal: false,
};

const AddExaminationModal = ({
  isOpen,
  consultationId,
  examination,
  onSkip,
  onSaved,
}) => {
  const [saving, setSaving] = useState(false);
  const [generalAppearance, setGeneralAppearance] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [findings, setFindings] = useState([{ ...emptyFinding }]);
  const [suggestions, setSuggestions] = useState({});
  const [fieldSuggestions, setFieldSuggestions] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setGeneralAppearance(examination?.generalAppearance || '');
    setGeneralNotes(examination?.generalNotes || '');
    setFindings(
      examination?.findings?.length
        ? examination.findings.map((finding) => ({ ...finding }))
        : [{ ...emptyFinding }]
    );
    setSuggestions({});
    setFieldSuggestions({});
  }, [isOpen, examination]);

  const updateFinding = (index, field, value) => {
    setFindings((previous) =>
      previous.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const searchSuggestions = async (index, value) => {
    updateFinding(index, 'findings', value);

    if (!value.trim()) return;

    const system = findings[index].system;

    try {
      const response = await getExaminationTemplates({
        system,
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

  const searchFieldSuggestions = async (field, value, setter) => {
    setter(value);

    if (!value.trim()) {
      setFieldSuggestions((previous) => ({ ...previous, [field]: [] }));
      return;
    }

    try {
      const response = await getExaminationTemplates({
        field,
        query: value,
      });
      const data = response?.data || response || [];

      setFieldSuggestions((previous) => ({
        ...previous,
        [field]: Array.isArray(data) ? data : [],
      }));
    } catch {
      // Suggestions are optional; free-text entry still works.
    }
  };

  const addFinding = () => {
    setFindings((previous) => [...previous, { ...emptyFinding }]);
  };

  const removeFinding = (index) => {
    setFindings((previous) => previous.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const validFindings = findings.filter(
      (item) => item.system && item.findings.trim()
    );


    setSaving(true);

    try {
      const findingsPayload = validFindings.map((item) => ({
        system: item.system,
        findings: item.findings.trim(),
        isNormal: item.isNormal,
      }));
      const payload = {
        generalAppearance: generalAppearance.trim() || undefined,
        generalNotes: generalNotes.trim() || undefined,
        findings: findingsPayload,
      };

      if (examination?.id || examination?._id) {
        await updateExamination(examination.id || examination._id, payload);
      } else {
        await createExamination({ consultationId, ...payload });
      }

      toast.success(examination ? 'Examination updated successfully' : 'Examination saved successfully');
      onSaved?.();
    } catch (error) {
      toast.error(
        error?.response?.data?.message || 'Failed to save examination'
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-base-100 shadow-2xl">
        <div className="flex items-center justify-between border-b p-5">
          <h2 className="text-xl font-bold">
            {examination ? 'Edit  Examination' : 'Add  Examination'}
          </h2>

          <button type="button" onClick={onSkip} disabled={saving}>
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="max-h-[80vh] space-y-4 overflow-y-auto p-5">
      

          {/* <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {[
              { field: 'edema', label: 'Edema', value: edema, setter: setEdema },
            ].map(({ field, label, value, setter }) => (
              <div key={field}>
                <input
                  list={`examination-suggestion-${field}`}
                  className="input input-bordered input-sm w-full"
                  placeholder={label}
                  value={value}
                  onChange={(e) =>
                    searchFieldSuggestions(field, e.target.value, setter)
                  }
                  disabled={saving}
                />
                <datalist id={`examination-suggestion-${field}`}>
                  {(fieldSuggestions[field] || []).map((item) => (
                    <option key={item.id || item.phrase} value={item.phrase} />
                  ))}
                </datalist>
              </div>
            ))} */}
          {/* </div> */}

          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="General examination notes"
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            disabled={saving}
          />

          {findings.map((finding, index) => (
            <div key={index} className="rounded-lg border p-3">
              <div className="mb-2 flex gap-2">
                <select
                  className="select select-bordered flex-1"
                  value={finding.system}
                  onChange={(e) =>
                    updateFinding(index, 'system', e.target.value)
                  }
                  disabled={saving}
                >
                  {SYSTEMS.map((system) => (
                    <option key={system} value={system}>
                      {system}
                    </option>
                  ))}
                </select>

                {findings.length > 1 && (
                  <button
                    type="button"
                    className="btn btn-error btn-outline"
                    onClick={() => removeFinding(index)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>

              <input
                list={`examination-suggestions-${index}`}
                className="input input-bordered w-full"
                placeholder="Enter findings"
                value={finding.findings}
                onChange={(e) => searchSuggestions(index, e.target.value)}
                disabled={saving}
              />

              <datalist id={`examination-suggestions-${index}`}>
                {(suggestions[index] || []).map((item) => (
                  <option key={item.id || item.phrase} value={item.phrase} />
                ))}
              </datalist>

              <label className="label cursor-pointer justify-start gap-5 pt-5">
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={finding.isNormal}
                  onChange={(e) =>
                    updateFinding(index, 'isNormal', e.target.checked)
                  }
                  disabled={saving}
                />
                <span className="label-text">Normal</span>
              </label>
            </div>
          ))}

          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={addFinding}
            disabled={saving}
          >
            <FaPlus /> Add another finding
          </button>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onSkip}
              disabled={saving}
            >
              Skip
            </button>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : examination ? 'Update Examination' : 'Save Examination'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddExaminationModal;