/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getPatients } from '@/services/api/patientsAPI';
import { toast } from 'react-hot-toast';

const BookAppointmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '',
    department: '',
    appointmentType: 'consultation',
    notes: ''
  });

  // Patient search state
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpenList, setIsOpenList] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = 'patient-combobox-listbox';
  const inputRef = useRef(null);

  // Fetch patients lazily when user focuses or starts typing
  useEffect(() => {
    if (!isOpen) return;
    // Reset state when modal opens
    setQuery('');
    setActiveIndex(-1);
    setIsOpenList(false);
  }, [isOpen]);

  const fetchPatients = async () => {
    try {
      setIsSearching(true);
      const res = await getPatients();
      const raw = res?.data ?? res ?? [];
      const list = Array.isArray(raw) ? raw : (raw.data ?? []);
      const mapped = list.map((p) => ({
        id: p?.id || p?.patientId || p?.uuid || p?.hospitalId,
        hospitalId: p?.hospitalId || p?.id,
        name: `${p?.firstName || ''} ${p?.middleName || ''} ${p?.lastName || ''}`.trim(),
      })).filter((p) => p.id);
      setPatients(mapped);
    } catch (e) {
      toast.error('Failed to load patients');
    } finally {
      setIsSearching(false);
    }
  };

  const handleFocus = async () => {
    setIsOpenList(true);
    if (!patients.length) {
      await fetchPatients();
    }
  };

  // Debounced query handling
  const debounceRef = useRef(null);
  const handleQueryChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpenList(true);
    setActiveIndex(-1);
    if (!patients.length) {
      // First type triggers fetch
      fetchPatients();
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilteredResults(computeFiltered(value));
    }, 250);
  };

  const computeFiltered = (value) => {
    const v = (value || '').toLowerCase();
    if (!v) return patients.slice(0, 10);
    const results = patients.filter((p) =>
      (p.name || '').toLowerCase().includes(v) ||
      String(p.hospitalId || '').toLowerCase().includes(v) ||
      String(p.id || '').toLowerCase().includes(v)
    );
    return results.slice(0, 10);
  };

  const [filteredResults, setFilteredResults] = useState([]);
  useEffect(() => {
    setFilteredResults(computeFiltered(query));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patients]);

  const selectPatient = (patient) => {
    setFormData((prev) => ({ ...prev, patientId: patient.id }));
    setQuery(`${patient.name} — ${patient.hospitalId || patient.id}`);
    setIsOpenList(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpenList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((idx) => Math.min(idx + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((idx) => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredResults[activeIndex]) {
        selectPatient(filteredResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpenList(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
    // Reset form
    setFormData({
      patientId: '',
      appointmentDate: '',
      appointmentTime: '',
      department: '',
      appointmentType: 'consultation',
      notes: ''
    });
    setQuery('');
    setFilteredResults([]);
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      patientId: '',
      appointmentDate: '',
      appointmentTime: '',
      department: '',
      appointmentType: 'consultation',
      notes: ''
    });
    setQuery('');
    setFilteredResults([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancel} />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Book Appointment</h2>
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Selector Combobox */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Patient
              </label>
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  role="combobox"
                  aria-expanded={isOpenList}
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
                  placeholder="Search by name or ID"
                  value={query}
                  onFocus={handleFocus}
                  onChange={handleQueryChange}
                  onKeyDown={handleKeyDown}
                  className="w-full input input-bordered pr-10"
                />
                {/* Loading indicator */}
                {isSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm" aria-hidden="true" />
                )}
                {/* Dropdown list */}
                {isOpenList && (
                  <ul
                    id={listboxId}
                    role="listbox"
                    className="absolute z-20 mt-1 w-full max-h-56 overflow-auto menu bg-base-100 border border-base-300 rounded-box shadow"
                  >
                    {!isSearching && filteredResults.length === 0 && (
                      <li className="px-4 py-2 text-sm text-base-content/70">No results</li>
                    )}
                    {filteredResults.map((p, idx) => (
                      <li
                        key={p.id}
                        id={`${listboxId}-option-${idx}`}
                        role="option"
                        aria-selected={activeIndex === idx}
                        className={`px-4 py-2 cursor-pointer flex justify-between items-center ${activeIndex === idx ? 'bg-base-200' : ''}`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); selectPatient(p); }}
                      >
                        <span className="text-sm text-base-content">{p.name || 'Unknown'}</span>
                        <span className="text-xs text-base-content/70">{p.hospitalId || p.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Helper text */}
              <p className="mt-2 text-xs text-base-content/60">Selected patient ID: {formData.patientId || 'None'}</p>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Appointment Date
                </label>
                <input
                  type="date"
                  name="appointmentDate"
                  value={formData.appointmentDate}
                  onChange={handleInputChange}
                  placeholder="MM/DD/YYYY"
                  className="w-full input input-bordered"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Appointment Time
                </label>
                <input
                  type="time"
                  name="appointmentTime"
                  value={formData.appointmentTime}
                  onChange={handleInputChange}
                  placeholder="12:00pm"
                  className="w-full input input-bordered"
                  required
                />
              </div>
            </div>

            {/* Department/Doctor */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Department/Doctor
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                className="w-full select select-bordered"
                required
              >
                <option value="">Select department/doctor</option>
                <option value="doctor">Doctor</option>
              </select>
            </div>

            {/* Appointment Type */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Appointment Type
              </label>
              <select
                name="appointmentType"
                value={formData.appointmentType}
                onChange={handleInputChange}
                className="w-full select select-bordered"
                required
              >
                <option value="consultation">Consultation</option>
                <option value="follow_up">Follow-up</option>
                <option value="routine_check">Check-up</option>
                <option value="emergency">Emergency</option>
                <option value="lab_test">Lab Test</option>
                <option value="vaccination">Vaccination</option>
                <option value="surgery">Surgery</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Brief notes for the appointment"
                className="w-full textarea textarea-bordered"
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!formData.patientId}
              >
                Save Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
