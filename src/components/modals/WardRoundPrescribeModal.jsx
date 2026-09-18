import React, { useState, useEffect, useRef } from 'react';
import { IoIosCloseCircleOutline, IoMdAdd, IoMdTrash } from 'react-icons/io';
import {
  FaPrescriptionBottleAlt,
  FaSyringe,
  FaPills,
  FaTint,
  FaBoxOpen,
  FaFilePrescription,
} from 'react-icons/fa';
import { getInventories } from '@/services/api/inventoryAPI';

// ─── Constants ───────────────────────────────────────────────────────────────

const ORAL_FREQUENCIES = ['STAT', 'dly', 'b.d', 'tds', 'qds', 'mane', 'nocte', 'prn', 'alt die'];
const INJECTION_FREQUENCIES = ['STAT', 'dly', 'hly', '4hly', '6hly', '8hly', '12hly', '24hly', 'mane', 'nocte', 'prn'];

const MEDICATION_TABS = [
  { value: 'tablet',    label: 'Tab/Cap',   icon: FaPills },
  { value: 'syrup',     label: 'Syr/Susp',  icon: FaPrescriptionBottleAlt },
  { value: 'gutt',      label: 'Gutt',      icon: FaTint },
  { value: 'cream',     label: 'Cream',     icon: FaBoxOpen },
  { value: 'infusion',  label: 'Infusion',  icon: FaTint },
  { value: 'injection', label: 'Injection', icon: FaSyringe },
];

const matchesMedicationType = (drug, medicationType) => {
  if (medicationType === 'tablet')    return drug.form === 'Tablet';
  if (medicationType === 'syrup')     return drug.form === 'Syrup';
  if (medicationType === 'injection') return drug.form === 'Injection';
  if (medicationType === 'gutt')      return drug.form === 'Gutt';
  if (medicationType === 'cream')     return drug.form === 'Cream';
  if (medicationType === 'infusion')  return drug.form === 'Infusion';
  return false;
};

const emptyMed = () => ({
  medicationType: 'tablet',
  drugName: '',
  dose: '',        // free text, e.g. "500mg", "2 tablets"
  frequency: '',
  instructions: '',
  inventoryId: null,
  availability: 'available',
});

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * WardRoundPrescribeModal
 *
 * Simplified prescription modal for ward rounds.
 * - Drug name: searchable from inventory, free-text fallback
 * - Type tabs: Tab/Cap, Syr/Susp, Gutt, Cream, Infusion, Injection
 * - Dose: free text (no calculation)
 * - Frequency: dropdown
 * - NO duration, NO pricing, NO billing
 *
 * Hands finished lines to parent via onQueue(medications[]).
 */
const WardRoundPrescribeModal = ({ isOpen, onClose, onQueue, initialMedications = [] }) => {
  const [meds, setMeds] = useState([emptyMed()]);
  const [drugList, setDrugList] = useState([]);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [drugSearch, setDrugSearch] = useState('');
  const dropdownRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setMeds(initialMedications.length > 0 ? initialMedications : [emptyMed()]);
      setOpenDropdownIdx(null);
      setDrugSearch('');
    }
  }, [isOpen]); // eslint-disable-line

  // Fetch inventory
  useEffect(() => {
    if (!isOpen) return;
    getInventories()
      .then((res) => setDrugList(res?.data || res || []))
      .catch(console.error);
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdownIdx(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const updateMed = (idx, field, value) => {
    setMeds((prev) => prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m)));
  };

  const setMedType = (idx, type) => {
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx
          ? { ...m, medicationType: type, drugName: '', inventoryId: null, availability: 'available', dose: '', frequency: '' }
          : m
      )
    );
  };

  const selectDrug = (idx, drug) => {
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx
          ? { ...m, drugName: drug.name, inventoryId: drug._id || drug.id, availability: 'available' }
          : m
      )
    );
    setOpenDropdownIdx(null);
    setDrugSearch('');
  };

  const selectFreeText = (idx, name) => {
    setMeds((prev) =>
      prev.map((m, i) =>
        i === idx ? { ...m, drugName: name, inventoryId: null, availability: 'unavailable' } : m
      )
    );
    setOpenDropdownIdx(null);
    setDrugSearch('');
  };

  const addMed = () => setMeds((prev) => [...prev, emptyMed()]);
  const removeMed = (idx) => setMeds((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate
    const invalid = meds.find((m) => !m.drugName.trim() || !m.dose.trim() || !m.frequency);
    if (invalid) {
      import('react-hot-toast').then(({ default: toast }) =>
        toast.error('Please fill in drug name, dose, and frequency for all medications.')
      );
      return;
    }

    const payload = meds.map(({ ...m }) => ({
      medicationType: m.medicationType,
      drugName: m.drugName.trim(),
      dosage: m.dose.trim(),           // stored as "dosage" to match existing prescription schema
      frequency: m.frequency,
      instructions: m.instructions.trim() || undefined,
      inventoryId: m.inventoryId || undefined,
      availability: m.availability,
      // Explicitly omit billing/duration fields so they're ignored
      prescribedQuantity: undefined,
      billedQuantity: undefined,
      unitPrice: undefined,
      lineTotal: undefined,
      duration: undefined,
    }));

    onQueue(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl max-w-3xl w-full shadow-2xl border border-base-300 max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="border-b border-base-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-full text-primary">
              <FaFilePrescription className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-base-content">Ward Round Prescription</h3>
              <p className="text-xs text-base-content/60">Drug orders — no billing, no duration needed</p>
            </div>
          </div>
          <button className="btn btn-ghost btn-circle" onClick={onClose} type="button">
            <IoIosCloseCircleOutline className="w-7 h-7" />
          </button>
        </div>

        {/* ── Body ── */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {meds.map((med, idx) => {
            const frequencies = ['injection', 'infusion'].includes(med.medicationType)
              ? INJECTION_FREQUENCIES
              : ORAL_FREQUENCIES;

            const filteredDrugs = drugList
              .filter((d) => matchesMedicationType(d, med.medicationType))
              .filter((d) => drugSearch && openDropdownIdx === idx
                ? d.name?.toLowerCase().includes(drugSearch.toLowerCase())
                : true
              );

            return (
              <div key={idx} className="card bg-base-200/30 border border-base-200">
                <div className="card-body p-5 space-y-4">

                  {/* Card header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary badge-md">{idx + 1}</span>
                      <span className="font-semibold text-sm">
                        {med.drugName || 'New Medication'}
                      </span>
                      {med.availability === 'unavailable' && (
                        <span className="badge badge-warning badge-xs">Not in stock</span>
                      )}
                    </div>
                    {meds.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm text-error"
                        onClick={() => removeMed(idx)}
                      >
                        <IoMdTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Type tabs */}
                  <div className="tabs tabs-boxed w-fit flex-wrap gap-1">
                    {MEDICATION_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = med.medicationType === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          className={`tab gap-1.5 text-xs ${active ? 'tab-active bg-primary text-primary-content' : ''}`}
                          onClick={() => setMedType(idx, tab.value)}
                        >
                          <Icon className="w-3 h-3" /> {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Drug name search */}
                    <div className="form-control relative md:col-span-2" ref={openDropdownIdx === idx ? dropdownRef : null}>
                      <label className="label pb-1">
                        <span className="label-text font-medium">Drug Name</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Search drug or type a name..."
                        className="input input-bordered w-full"
                        value={openDropdownIdx === idx ? drugSearch : med.drugName}
                        onFocus={() => {
                          setOpenDropdownIdx(idx);
                          setDrugSearch(med.drugName || '');
                        }}
                        onChange={(e) => {
                          setDrugSearch(e.target.value);
                          setOpenDropdownIdx(idx);
                          // clear selection if they start re-typing
                          updateMed(idx, 'drugName', '');
                          updateMed(idx, 'inventoryId', null);
                        }}
                        autoComplete="off"
                      />

                      {/* Dropdown */}
                      {openDropdownIdx === idx && (
                        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-base-100 border border-base-300 rounded-xl shadow-xl max-h-56 overflow-auto">
                          <ul className="py-1">
                            {filteredDrugs.map((drug) => (
                              <li
                                key={drug._id || drug.id}
                                onClick={() => selectDrug(idx, drug)}
                                className="px-4 py-2 hover:bg-primary/10 cursor-pointer text-sm flex items-center justify-between gap-2"
                              >
                                <span className="font-medium">{drug.name}</span>
                                {(drug.form || drug.strength) && (
                                  <span className="text-xs text-base-content/50">
                                    {[drug.form, drug.strength].filter(Boolean).join(' · ')}
                                  </span>
                                )}
                              </li>
                            ))}

                            {/* Free text fallback */}
                            {drugSearch.trim() && filteredDrugs.length === 0 && (
                              <li
                                onClick={() => selectFreeText(idx, drugSearch.trim())}
                                className="px-4 py-2.5 hover:bg-warning/10 cursor-pointer text-sm border-t border-base-200"
                              >
                                <span className="font-semibold text-warning">
                                  + Prescribe "{drugSearch.trim()}"
                                </span>
                                <p className="text-xs text-base-content/50 mt-0.5">
                                  Not found in stock — will be marked unavailable
                                </p>
                              </li>
                            )}

                            {!drugSearch.trim() && filteredDrugs.length === 0 && (
                              <li className="px-4 py-3 text-sm text-base-content/50 text-center">
                                No {med.medicationType} drugs found. Type a name to prescribe manually.
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Dose — free text */}
                    <div className="form-control">
                      <label className="label pb-1">
                        <span className="label-text font-medium">Dose</span>
                        <span className="label-text-alt text-base-content/50">free text</span>
                      </label>
                      <input
                        type="text"
                        placeholder={
                          med.medicationType === 'injection'
                            ? 'e.g. 1 ampoule, 500mg'
                            : 'e.g. 2 tablets, 5ml, 500mg'
                        }
                        className="input input-bordered w-full"
                        value={med.dose}
                        onChange={(e) => updateMed(idx, 'dose', e.target.value)}
                      />
                    </div>

                    {/* Frequency */}
                    <div className="form-control">
                      <label className="label pb-1">
                        <span className="label-text font-medium">Frequency</span>
                      </label>
                      <select
                        className="select select-bordered w-full"
                        value={med.frequency}
                        onChange={(e) => updateMed(idx, 'frequency', e.target.value)}
                      >
                        <option value="">Select frequency</option>
                        {frequencies.map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    {/* Instructions */}
                    <div className="form-control md:col-span-2">
                      <label className="label pb-1">
                        <span className="label-text font-medium">Instructions</span>
                        <span className="label-text-alt text-base-content/50">optional</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-14 text-sm"
                        placeholder="e.g. Take after meals, dilute in 100ml NS, apply thinly..."
                        value={med.instructions}
                        onChange={(e) => updateMed(idx, 'instructions', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Add another */}
          <button
            type="button"
            className="btn btn-outline btn-primary w-full border-dashed"
            onClick={addMed}
          >
            <IoMdAdd className="w-5 h-5" /> Add Another Medication
          </button>

          {/* Footer actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary px-8">
              Queue for this Round
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default WardRoundPrescribeModal;
