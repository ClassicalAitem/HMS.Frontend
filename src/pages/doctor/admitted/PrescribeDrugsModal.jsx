import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IoIosCloseCircleOutline, IoMdAdd, IoMdTrash } from 'react-icons/io';
import { FaPrescriptionBottleAlt, FaSyringe, FaPills, FaTint, FaBoxOpen } from 'react-icons/fa';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { getInventories } from '@/services/api/inventoryAPI';
import {
  calculatePrescriptionLine,
  hasConcentrationData,
  buildDurationString,
} from '@/utils/prescriptionsCalculator';

const ORAL_FREQUENCIES = ['STAT', 'dly', 'b.d', 'tds', 'qds', 'mane', 'nocte', 'prn', 'alt die'];
const INJECTION_FREQUENCIES = ['STAT', 'dly', 'hly', '4hly', '6hly', '8hly', '12hly', '24hly', 'mane', 'nocte', 'prn'];

const MEDICATION_TABS = [
  { value: 'tablet', label: 'Tab/Cap', icon: FaPills },
  { value: 'syrup', label: 'Syr/Susp', icon: FaPrescriptionBottleAlt },
  { value: 'gutt', label: 'Gutt', icon: FaTint },
  { value: 'cream', label: 'Cream', icon: FaBoxOpen },
  { value: 'infusion', label: 'Infusion', icon: FaTint },
  { value: 'injection', label: 'Injection', icon: FaSyringe },
];

const currency = (n) => `₦${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const getUnitOptions = (medicationType, selectedDrug) => {
  const hasConcentration = hasConcentrationData(selectedDrug);
  if (medicationType === 'tablet') {
    return hasConcentration
      ? [{ value: 'mg', label: 'mg' }, { value: 'tablet', label: 'tablet(s)/cap(s)' }]
      : [{ value: 'tablet', label: 'tablet(s)/cap(s)' }];
  }
  if (medicationType === 'syrup') {
    return hasConcentration
      ? [{ value: 'mg', label: 'mg' }, { value: 'ml', label: 'ml' }]
      : [{ value: 'ml', label: 'ml' }];
  }
  if (medicationType === 'gutt') return [{ value: 'ml', label: 'ml' }];
  if (medicationType === 'infusion') return [{ value: 'ml', label: 'ml' }];
  if (medicationType === 'cream') return [{ value: 'tablet', label: 'tube(s)' }];
  if (medicationType === 'injection') {
    const invUnit = selectedDrug?.unit === 'iu' ? 'iu' : selectedDrug?.unit === 'ampoule' ? 'ampoule' : 'ml';
    const physicalOpt = { value: invUnit, label: invUnit === 'iu' ? 'IU' : invUnit === 'ampoule' ? 'ampoule(s)' : 'ml' };
    return hasConcentration ? [{ value: 'mg', label: 'mg' }, physicalOpt] : [physicalOpt];
  }
  return [{ value: 'unit', label: 'unit' }];
};

const matchesMedicationType = (drug, medicationType) => {
  if (medicationType === 'tablet') return drug.form === 'Tablet';
  if (medicationType === 'syrup') return drug.form === 'Syrup';
  if (medicationType === 'injection') return drug.form === 'Injection';
  if (medicationType === 'gutt') return drug.form === 'Gutt';
  if (medicationType === 'cream') return drug.form === 'Cream';
  if (medicationType === 'infusion') return drug.form === 'Infusion';
  return false;
};

const medicationSchema = yup.object().shape({
  medicationType: yup.string().oneOf(['tablet', 'syrup', 'injection', 'gutt', 'cream', 'infusion']).required(),
  drugName: yup.string().required('Drug name is required'),
  dosageAmount: yup.number().typeError('Enter a number').positive('Must be greater than 0').required('Dose amount is required'),
  dosageUnit: yup.string().required('Select a unit'),
  frequency: yup.string().required('Frequency is required'),
  duration: yup.string().required('Duration is required'),
  durationAmount: yup.number().typeError('Enter a number').positive('Must be greater than 0').required('Duration amount is required'),
  durationUnit: yup.string().required('Duration unit is required'),
  instructions: yup.string(),
  inventoryId: yup.string().nullable(),
  availability: yup.string().oneOf(['available', 'unavailable']).required('Please select the drug from the list or mark it unavailable'),
});

const schema = yup.object().shape({
  medications: yup.array().of(medicationSchema).min(1, 'At least one medication is required'),
});

const emptyMedication = {
  medicationType: 'tablet',
  drugName: '',
  dosageAmount: '',
  dosageUnit: 'tablet',
  frequency: '',
  duration: '',
  durationAmount: '',
  durationUnit: 'day',
  instructions: '',
  inventoryId: null,
  _selectedDrug: null,
  availability: undefined,
};

/**
 * Modal version of the prescription writer, used inside a ward round (or any
 * "queue first, save together" flow). It does NOT call the prescriptions API
 * and does NOT navigate anywhere — it just hands the finished medication
 * lines back to the parent via onQueue, which is responsible for holding
 * them until the ward round itself is saved.
 */
const PrescribeDrugsModal = ({ isOpen, onClose, onQueue, initialMedications }) => {
  const [drugList, setDrugList] = useState([]);
  const [drugDropdownIndex, setDrugDropdownIndex] = useState(null);
  const [drugSearch, setDrugSearch] = useState('');
  const drugWrapperRef = useRef(null);

  const { control, setValue, handleSubmit, watch, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { medications: initialMedications?.length ? initialMedications : [emptyMedication] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

  useEffect(() => {
    if (isOpen) {
      reset({ medications: initialMedications?.length ? initialMedications : [emptyMedication] });
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await getInventories();
        setDrugList(res.data || res);
      } catch (err) {
        console.error(err);
      }
    };
    if (isOpen) fetchDrugs();
  }, [isOpen]);

  useEffect(() => {
    const handleClick = (e) => {
      if (drugWrapperRef.current && !drugWrapperRef.current.contains(e.target)) {
        setDrugDropdownIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getLinePreview = (index) => {
    const medicationType = watch(`medications.${index}.medicationType`);
    const dosageAmount = watch(`medications.${index}.dosageAmount`);
    const dosageUnit = watch(`medications.${index}.dosageUnit`);
    const frequency = watch(`medications.${index}.frequency`);
    const duration = watch(`medications.${index}.duration`);
    const availability = watch(`medications.${index}.availability`);
    const selectedDrug = watch(`medications.${index}._selectedDrug`);

    if (availability === 'unavailable' || !selectedDrug || !dosageAmount || !frequency || !duration) return null;

    return calculatePrescriptionLine({
      medicationType, dosageAmount, dosageUnit, frequency, duration, inventory: selectedDrug,
    });
  };

  const grandTotal = fields.reduce((sum, _item, index) => {
    const preview = getLinePreview(index);
    return sum + (preview?.lineTotal || 0);
  }, 0);

  const onSubmit = (data) => {
    const medications = data.medications.map((med) => {
      const { _selectedDrug, durationAmount, durationUnit, ...medData } = med;
      const normalizedDuration = buildDurationString(durationAmount, durationUnit) || medData.duration;
      const preview = _selectedDrug && medData.availability === 'available'
        ? calculatePrescriptionLine({
          medicationType: medData.medicationType,
          dosageAmount: medData.dosageAmount,
          dosageUnit: medData.dosageUnit,
          frequency: medData.frequency,
          duration: normalizedDuration,
          inventory: _selectedDrug,
        })
        : null;
      const dosageUnitLabel = medData.dosageUnit === 'tablet'
        ? (Number(medData.dosageAmount) === 1 ? 'tablet' : 'tablets')
        : medData.dosageUnit;

      return {
        ...medData,
        duration: normalizedDuration,
        dosage: `${medData.dosageAmount} ${dosageUnitLabel}`,
        instructions: medData.instructions || undefined,
        prescribedQuantity: preview?.prescribedQuantity ?? null,
        billedQuantity: preview?.billedQuantity ?? null,
        unitPrice: preview?.unitPrice ?? null,
        lineTotal: preview?.lineTotal ?? null,
      };
    });

    onQueue(medications);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-base-100 rounded-2xl max-w-3xl w-full shadow-2xl border border-base-300 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="border-b border-base-200 px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-full text-primary">
              <FaPrescriptionBottleAlt className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-base-content">Prescribe Drugs for this Round</h3>
          </div>
          <button className="btn btn-ghost btn-circle" onClick={onClose}>
            <IoIosCloseCircleOutline className="w-7 h-7" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-6">
          {fields.map((item, index) => {
            const medicationType = watch(`medications.${index}.medicationType`);
            const selectedDrug = watch(`medications.${index}._selectedDrug`);
            const availability = watch(`medications.${index}.availability`);
            const unitOptions = getUnitOptions(medicationType, selectedDrug);
            const preview = getLinePreview(index);

            return (
              <div key={item.id} className="card bg-base-200/30 border border-base-200 relative overflow-visible">
                <div className="card-body p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="badge badge-primary badge-md">{index + 1}</span>
                      <h4 className="font-semibold">Medication</h4>
                    </div>
                    {fields.length > 1 && (
                      <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => remove(index)}>
                        <IoMdTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="tabs tabs-boxed w-fit mb-4">
                    {MEDICATION_TABS.map((tab) => {
                      const Icon = tab.icon;
                      const active = medicationType === tab.value;
                      return (
                        <button
                          key={tab.value}
                          type="button"
                          className={`tab gap-2 ${active ? 'tab-active bg-primary text-primary-content' : ''}`}
                          onClick={() => {
                            setValue(`medications.${index}.medicationType`, tab.value);
                            setValue(`medications.${index}.frequency`, '');
                            setValue(`medications.${index}.drugName`, '');
                            setValue(`medications.${index}._selectedDrug`, null);
                            setValue(`medications.${index}.inventoryId`, null);
                            setValue(`medications.${index}.availability`, undefined);
                            setValue(`medications.${index}.dosageAmount`, '');
                            setValue(`medications.${index}.duration`, '');
                            setValue(`medications.${index}.durationAmount`, '');
                            setValue(`medications.${index}.durationUnit`, 'day');
                            const opts = getUnitOptions(tab.value, null);
                            setValue(`medications.${index}.dosageUnit`, opts[0]?.value || '');
                          }}
                        >
                          <Icon /> {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control relative md:col-span-2" ref={drugWrapperRef}>
                      <label className="label"><span className="label-text">Drug Name</span></label>
                      <input
                        type="text"
                        placeholder="Search drug..."
                        className={`input input-bordered w-full ${errors.medications?.[index]?.drugName ? 'input-error' : ''}`}
                        value={drugDropdownIndex === index ? drugSearch : watch(`medications.${index}.drugName`) || ''}
                        onFocus={() => { setDrugDropdownIndex(index); setDrugSearch(''); }}
                        onChange={(e) => {
                          setDrugSearch(e.target.value);
                          setDrugDropdownIndex(index);
                          setValue(`medications.${index}.inventoryId`, null);
                          setValue(`medications.${index}.availability`, undefined);
                          setValue(`medications.${index}._selectedDrug`, null);
                        }}
                        autoComplete="off"
                      />

                      {drugDropdownIndex === index && (
                        <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                          <ul className="py-1">
                            {drugList
                              .filter((drug) => matchesMedicationType(drug, medicationType))
                              .filter((drug) => (drugSearch ? drug.name?.toLowerCase().includes(drugSearch.toLowerCase()) : true))
                              .map((drug) => (
                                <li
                                  key={drug._id || drug.id}
                                  onClick={() => {
                                    setValue(`medications.${index}.drugName`, drug.name);
                                    setValue(`medications.${index}._selectedDrug`, drug);
                                    setValue(`medications.${index}.inventoryId`, drug._id || drug.id);
                                    setValue(`medications.${index}.availability`, 'available');
                                    const opts = getUnitOptions(medicationType, drug);
                                    setValue(`medications.${index}.dosageUnit`, opts[0]?.value || '');
                                    setDrugDropdownIndex(null);
                                    setDrugSearch('');
                                  }}
                                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                                >
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium">{drug.name}</span>
                                    {(drug.form || drug.strength) && (
                                      <span className="text-gray-500 text-xs ml-2">
                                        {[drug.form, drug.strength].filter(Boolean).join(' - ')}
                                      </span>
                                    )}
                                  </div>
                                </li>
                              ))}

                            {drugList
                              .filter((drug) => matchesMedicationType(drug, medicationType))
                              .filter((drug) => (drugSearch ? drug.name?.toLowerCase().includes(drugSearch.toLowerCase()) : true)).length === 0 && (
                              <li
                                onClick={() => {
                                  setValue(`medications.${index}.drugName`, drugSearch);
                                  setValue(`medications.${index}._selectedDrug`, null);
                                  setValue(`medications.${index}.inventoryId`, null);
                                  setValue(`medications.${index}.availability`, 'unavailable');
                                  setDrugDropdownIndex(null);
                                  setDrugSearch('');
                                }}
                                className="px-4 py-2 hover:bg-warning/10 cursor-pointer text-sm border-t"
                              >
                                <span className="font-medium text-warning">+ Prescribe "{drugSearch}" (not in stock)</span>
                                <p className="text-xs text-base-content/60 mt-0.5">Patient will source this externally</p>
                              </li>
                            )}
                          </ul>
                        </div>
                      )}

                      {errors.medications?.[index]?.drugName && (
                        <span className="text-error text-xs mt-1">{errors.medications[index].drugName.message}</span>
                      )}
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text">Dose</span></label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          step="any"
                          placeholder="e.g. 2"
                          className={`input input-bordered w-full ${errors.medications?.[index]?.dosageAmount ? 'input-error' : ''}`}
                          value={watch(`medications.${index}.dosageAmount`) || ''}
                          onChange={(e) => setValue(`medications.${index}.dosageAmount`, e.target.value)}
                        />
                        <select
                          className="select select-bordered w-32"
                          value={watch(`medications.${index}.dosageUnit`) || ''}
                          onChange={(e) => setValue(`medications.${index}.dosageUnit`, e.target.value)}
                        >
                          {unitOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text">Frequency</span></label>
                      <select
                        className="select select-bordered w-full"
                        value={watch(`medications.${index}.frequency`) || ''}
                        onChange={(e) => setValue(`medications.${index}.frequency`, e.target.value)}
                      >
                        <option value="">Select frequency</option>
                        {(['injection', 'infusion'].includes(medicationType) ? INJECTION_FREQUENCIES : ORAL_FREQUENCIES).map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label"><span className="label-text">Duration</span></label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 5"
                          className="input input-bordered w-full"
                          value={watch(`medications.${index}.durationAmount`) || ''}
                          onChange={(e) => {
                            const amount = e.target.value;
                            const unit = watch(`medications.${index}.durationUnit`) || 'day';
                            setValue(`medications.${index}.durationAmount`, amount);
                            setValue(`medications.${index}.duration`, buildDurationString(amount, unit));
                          }}
                        />
                        <select
                          className="select select-bordered w-32"
                          value={watch(`medications.${index}.durationUnit`) || 'day'}
                          onChange={(e) => {
                            const unit = e.target.value;
                            const amount = watch(`medications.${index}.durationAmount`);
                            setValue(`medications.${index}.durationUnit`, unit);
                            setValue(`medications.${index}.duration`, buildDurationString(amount, unit));
                          }}
                        >
                          <option value="day">Day(s)</option>
                          <option value="week">Week(s)</option>
                          <option value="month">Month(s)</option>
                          <option value="year">Year(s)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-control md:col-span-2">
                      <label className="label"><span className="label-text">Instructions (Optional)</span></label>
                      <textarea
                        className="textarea textarea-bordered h-16"
                        placeholder="e.g. Take after meals"
                        value={watch(`medications.${index}.instructions`) || ''}
                        onChange={(e) => setValue(`medications.${index}.instructions`, e.target.value)}
                      />
                    </div>
                  </div>

                  {availability === 'unavailable' ? (
                    <div className="mt-3 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                      Not in stock — no charge, patient sources this externally.
                    </div>
                  ) : preview ? (
                    <div className="mt-3 p-3 rounded-lg bg-success/10 border border-success/30 text-sm flex flex-wrap items-center justify-between gap-2">
                      <div>
                        Prescribed: <span className="font-medium">{Number(preview.prescribedQuantity).toFixed(2)} {preview.unit}</span>
                      </div>
                      <div className="font-semibold text-success">{currency(preview.lineTotal)}</div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="btn btn-outline btn-primary w-full border-dashed"
            onClick={() => append(emptyMedication)}
          >
            <IoMdAdd className="w-5 h-5" /> Add Another Medication
          </button>

          <div className="card bg-base-200/40">
            <div className="card-body p-4 flex-row items-center justify-between">
              <span className="font-semibold text-base-content/70">Estimated Total</span>
              <span className="text-xl font-bold text-primary">{currency(grandTotal)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2 pb-2">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary px-8">
              Queue for this Round
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PrescribeDrugsModal;