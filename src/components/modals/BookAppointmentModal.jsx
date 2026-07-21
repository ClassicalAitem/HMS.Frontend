/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getPatients } from '@/services/api/patientsAPI';
import { getAllComplaint } from '@/services/api/medicalRecordAPI';
import { toast } from 'react-hot-toast';

const BookAppointmentModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '',
    department: '',
    appointmentType: 'consultation',
    procedureName: '',
    procedureCode: '',
    notes: ''
  });

  console.log('Form Data:', formData);

  const [complaints, setComplaints] = useState([]);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const res = await getAllComplaint();
        if(res || Array.isArray(res)) {

          setComplaints(prev => ({
            ...prev,
            surgical: res.filter(c => c.category === 'surgical'),
          }));
        }
      } catch (e) {
        toast.error('Failed to load complaints');
      }
    };

    if (isOpen) {
      fetchComplaints();
    }
  }, [isOpen]);

  console.log('Fetched complaints:', complaints);

  // Validation state
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [procedureError, setProcedureError] = useState({ name: '', code: '' });

  const isSurgery = formData.appointmentType === 'surgery';

  // Get today's date for min attribute
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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

  // Validation functions
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getCurrentTimeString = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const validateDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      setDateError('Appointment date cannot be in the past');
      return false;
    }
    setDateError('');
    return true;
  };

  const validateTime = (date, time) => {
    if (!date || !time) return true;

    const todayDateString = getTodayDateString();

    if (date === todayDateString) {
      const currentTime = getCurrentTimeString();
      if (time <= currentTime) {
        setTimeError('Appointment time cannot be in the past for today');
        return false;
      }
    }
    setTimeError('');
    return true;
  };

  const validateProcedureFields = () => {
    if (!isSurgery) return true;
    const errors = { name: '', code: '' };
    let valid = true;

    if (!formData.procedureName.trim()) {
      errors.name = 'Procedure name is required for surgery';
      valid = false;
    }
    if (!formData.procedureCode.trim()) {
      errors.code = 'Procedure code is required for surgery';
      valid = false;
    }

    setProcedureError(errors);
    return valid;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear procedure fields when switching away from surgery
      ...(name === 'appointmentType' && value !== 'surgery' && {
        procedureName: '',
        procedureCode: '',
      }),
    }));

    // Clear procedure errors on change
    if (name === 'procedureName') {
      setProcedureError(prev => ({ ...prev, name: value.trim() ? '' : prev.name }));
    }
    if (name === 'procedureCode') {
      setProcedureError(prev => ({ ...prev, code: value.trim() ? '' : prev.code }));
    }

    if (name === 'appointmentDate') {
      validateDate(value);
      if (formData.appointmentTime) {
        validateTime(value, formData.appointmentTime);
      }
    } else if (name === 'appointmentTime') {
      validateTime(formData.appointmentDate, value);
    }
  };

  const resetForm = () => {
    setFormData({
      patientId: '',
      appointmentDate: '',
      appointmentTime: '',
      department: '',
      appointmentType: 'consultation',
      procedureName: '',
      procedureCode: '',
      notes: ''
    });
    setQuery('');
    setFilteredResults([]);
    setDateError('');
    setTimeError('');
    setProcedureError({ name: '', code: '' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isDateValid = validateDate(formData.appointmentDate);
    const isTimeValid = validateTime(formData.appointmentDate, formData.appointmentTime);
    const isProcedureValid = validateProcedureFields();

    if (!isDateValid || !isTimeValid) {
      toast.error('Please fix the appointment date and time');
      return;
    }

    if (!isProcedureValid) {
      toast.error('Please fill in all required surgery fields');
      return;
    }

    onSubmit(formData);
    onClose();
    resetForm();
  };

  const handleCancel = () => {
    onClose();
    resetForm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 shadow-xl card bg-base-100 max-h-[90vh] overflow-y-auto">
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
                  className="w-full input input-bordered pr-10 focus:ring focus:ring-primary/30"
                />
                {isSearching && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-sm" aria-hidden="true" />
                )}
                {isOpenList && (
                  <ul
                    id={listboxId}
                    role="listbox"
                    className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-base-100 border border-base-300 rounded-lg shadow-lg divide-y divide-base-200"
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
                        className={`px-4 py-2 cursor-pointer flex justify-between items-center hover:bg-base-200 ${
                          activeIndex === idx ? 'bg-base-200' : ''
                        }`}
                        onMouseEnter={() => setActiveIndex(idx)}
                        onMouseDown={(e) => { e.preventDefault(); selectPatient(p); }}
                      >
                        <span className="text-sm font-medium text-base-content">{p.name || 'Unknown'}</span>
                        <span className="text-xs text-base-content/70">{p.hospitalId || p.id}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {formData.patientId && (
                <span className="mt-2 inline-block px-2 py-1 text-xs rounded bg-base-200 text-base-content/70">
                  Selected ID: {formData.patientId}
                </span>
              )}
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
                  min={getTodayDate()}
                  className={`w-full input input-bordered ${dateError ? 'input-error' : ''}`}
                  required
                />
                {dateError && (
                  <p className="mt-1 text-xs text-error">{dateError}</p>
                )}
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
                  className={`w-full input input-bordered ${timeError ? 'input-error' : ''}`}
                  required
                />
                {timeError && (
                  <p className="mt-1 text-xs text-error">{timeError}</p>
                )}
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

            {/* Surgery Fields — conditionally rendered */}
            {isSurgery && (
              <div className="p-4 space-y-4 rounded-lg border border-warning/40 bg-warning/5">
                <p className="flex gap-2 items-center text-xs font-medium text-warning">
                  <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  Surgery requires procedure details
                </p>

                <div>
                  <label className="block mb-2 text-sm font-medium text-base-content">
                    Procedure Name <span className="text-error">*</span>
                  </label>
                  <select
                    name="procedureName"
                    value={formData.procedureName}
                    onChange={handleInputChange}
                    className={`w-full select select-bordered ${procedureError.name ? 'select-error' : ''}`}
                  >
                    <option value="">Select a procedure</option>
                    {complaints.surgical?.map((item, idx) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  {procedureError.name && (
                    <p className="mt-1 text-xs text-error">{procedureError.name}</p>
                  )}
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-base-content">
                    Procedure Code <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="procedureCode"
                    value={formData.procedureCode}
                    onChange={handleInputChange}
                    placeholder="e.g. ICD-10: K35.89"
                    className={`w-full input input-bordered ${procedureError.code ? 'input-error' : ''}`}
                  />
                  {procedureError.code && (
                    <p className="mt-1 text-xs text-error">{procedureError.code}</p>
                  )}
                </div>
              </div>
            )}

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
                disabled={!formData.patientId || !!dateError || !!timeError}
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
