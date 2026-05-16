import React, { useState, useEffect, useRef } from 'react';
import { FaTimes, FaPlus } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { updateConsultation } from '@/services/api/consultationAPI';
import { getAllComplaint, createMedicalRecord } from '@/services/api/medicalRecordAPI';



const AddDiagnosisModal = ({ isOpen, onClose, consultationId, onDiagnosisAdded }) => {
  const [diagnoses, setDiagnoses] = useState([]); // Array of selected diagnoses
  const [diagnosisInput, setDiagnosisInput] = useState('');
  const [search, setSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const wrapperRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosisOptions, setDiagnosisOptions] = useState([]);
  const [localDiagnosisOptions, setLocalDiagnosisOptions] = useState([]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDiagnosis = async () => {
      try {
        const allRecords = await getAllComplaint();
        const diagnosisList = Array.isArray(allRecords) ? allRecords.filter(item => item.category === 'diagnosis') : [];
        setDiagnosisOptions(diagnosisList);
        setLocalDiagnosisOptions(diagnosisList);
      } catch (err) {
        setDiagnosisOptions([]);
        setLocalDiagnosisOptions([]);
        toast.error('Failed to load diagnosis options');
      }
    };
    fetchDiagnosis();
    setSearch('');
    setDiagnosisInput('');
    setDiagnoses([]);
    setLocalDiagnosisOptions([]);
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);


  if (!isOpen) return null;

  const handleAddDiagnosis = async (name, createIfMissing = false) => {
    if (!name) return;
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const alreadyAdded = diagnoses.some(d => d.toLowerCase() === trimmedName.toLowerCase());
    if (alreadyAdded) {
      toast.error('Diagnosis already added');
      return;
    }

    const existsInOptions = localDiagnosisOptions.some(item => item.name.toLowerCase() === trimmedName.toLowerCase());

    if (!existsInOptions && createIfMissing) {
      try {
        await createMedicalRecord({
          category: 'diagnosis',
          name: trimmedName,
        });
        setLocalDiagnosisOptions(prev => [...prev, { name: trimmedName }]);
        toast.success(`Added "${trimmedName}" to Diagnosis`);
      } catch (error) {
        console.error('Error adding new diagnosis:', error);
        toast.error('Failed to add new diagnosis');
        return;
      }
    }

    setDiagnoses(prev => [...prev, trimmedName]);
    setDiagnosisInput('');
    setSearch('');
    setDropdownOpen(false);
  };

  const handleRemoveDiagnosis = (idx) => {
    setDiagnoses(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();
    if (!diagnoses.length) {
      toast.error('Please add at least one diagnosis');
      return;
    }
    setIsLoading(true);
    try {
      const payload = { diagnosis: diagnoses.join(', ') };
      await updateConsultation(consultationId, payload);
      toast.success('Diagnosis updated successfully!');
      setDiagnoses([]);
      onDiagnosisAdded();
      onClose();
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      toast.error(error.response?.data?.message || 'Failed to update diagnosis');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg mx-4 bg-base-100 rounded-xl shadow-2xl overflow-hidden border border-base-200">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-base-content">Add Diagnosis</h2>
            <button onClick={onClose} className="text-base-content/60 hover:text-base-content transition-colors">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control flex flex-col">
              <label className="label">
                <span className="font-medium label-text text-base-content">Diagnosis</span>
              </label>
              <div ref={wrapperRef} className="relative w-full">
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Search diagnosis..."
                  value={search || diagnosisInput}
                  onChange={e => {
                    setSearch(e.target.value);
                    setDiagnosisInput(e.target.value);
                    setDropdownOpen(true);
                  }}
                  onFocus={() => setDropdownOpen(true)}
                  disabled={isLoading}
                  autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <button
                    type="button"
                    className="text-gray-400 hover:text-primary"
                    onClick={() => handleAddDiagnosis(search || diagnosisInput, true)}
                    tabIndex={-1}
                    disabled={isLoading || !(search || diagnosisInput)}
                  >
                    <FaPlus className="w-4 h-4" />
                  </button>
                </div>
                {dropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                    {(() => {
                      const filteredItems = localDiagnosisOptions.filter(item =>
                        (search || diagnosisInput)
                          ? item.name.toLowerCase().includes((search || diagnosisInput).toLowerCase())
                          : true
                      );

                      if (filteredItems.length > 0) {
                        return (
                          <ul className="py-1">
                            {filteredItems.map(item => (
                              <li
                                key={item.id || item._id}
                                onClick={() => handleAddDiagnosis(item.name)}
                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700"
                              >
                                {item.name}
                              </li>
                            ))}
                          </ul>
                        );
                      }

                      if (search && search.trim()) {
                        return (
                          <div className="py-2 px-4">
                            <button
                              type="button"
                              onClick={() => handleAddDiagnosis(search || diagnosisInput, true)}
                              className="flex items-center gap-2 w-full text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 px-2 py-1 rounded"
                            >
                              <FaPlus className="w-4 h-4" />
                              Add "{search.trim() || diagnosisInput.trim()}" as new diagnosis
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="py-2 px-4 text-gray-400 text-sm">
                          No matches found
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
              {/* Show added diagnoses as chips */}
              <div className="flex flex-wrap gap-2 mt-3">
                {diagnoses.map((item, idx) => (
                  <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 bg-base-200 border border-base-300 rounded-full text-sm text-base-content">
                    {item}
                    <button
                      type="button"
                      className="ml-1 text-error hover:text-red-700"
                      onClick={() => handleRemoveDiagnosis(idx)}
                      tabIndex={-1}
                    >
                      <FaTimes className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {diagnoses.length === 0 && <span className="text-sm text-base-content/40 italic">No diagnosis added</span>}
              </div>
            </div>
            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-ghost text-base-content"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="loading loading-spinner loading-sm"></span>
                ) : (
                  <>
                    <FaPlus className="mr-2" /> Add Diagnosis
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDiagnosisModal;