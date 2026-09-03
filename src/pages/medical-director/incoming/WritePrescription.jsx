import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Header } from '@/components/common';
import Sidebar from '@/components/medical-director/dashboard/Sidebar';
import { getConsultationById } from '@/services/api/consultationAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { getAnteNatalRecordByPatientId } from '@/services/api/anteNatalAPI';
import { createPrescription, getPrescriptionsForConsultation, updatePrescription } from '@/services/api/prescriptionsAPI';
import { IoIosCloseCircleOutline, IoMdAdd, IoMdTrash } from 'react-icons/io';
import { FaPrescriptionBottleAlt, FaSyringe, FaPills, FaTint, FaBoxOpen } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { getInventories } from '@/services/api/inventoryAPI';
import MedicalDirectorLayout from '@/layouts/medical-director/MedicalDirectorLayout';
import KolakLoader from '@/components/common/KolakLoader';
import {
  calculatePrescriptionLine,
  hasConcentrationData,
  buildDurationString,
  parseDurationParts,
} from '@/utils/prescriptionsCalculator';
import { DURATION } from '@/constants/patientStatus';

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

const DURATION_LABELS = {
  '1/7': '1 day', '2/7': '2 days', '3/7': '3 days', '4/7': '4 days', '5/7': '5 days', '6/7': '6 days',
  '1/52': '1 week', '2/52': '2 weeks', '3/52': '3 weeks',
  '1/12': '1 month', '2/12': '2 months', '3/12': '3 months', '4/12': '4 months', '5/12': '5 months', '6/12': '6 months',
  '1yr': '1 year',
};

const currency = (n) => `₦${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

// What units can the doctor pick for this tab + selected drug?
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
  dosesGiven: yup.number().transform((value) => (isNaN(value) ? undefined : value)).when('medicationType', {
    is: 'injection',
    then: (schema) => schema.required('Doses given is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  injectionStatus: yup.string().when('medicationType', {
    is: 'injection',
    then: (schema) => schema.required('Injection status is required'),
    otherwise: (schema) => schema.nullable(),
  }),
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
  dosesGiven: 0,
  injectionStatus: 'pending',
  inventoryId: null,
   _selectedDrug: null,
  availability: undefined,
};

const WritePrescription = () => {
  const { patientId, consultationId, antenatalId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === 'incoming';
  const sourceId = antenatalId || consultationId;
  const isAntenatal = !!antenatalId;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dependants, setDependants] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('patient');
  const [drugList, setDrugList] = useState([]);
  const [drugDropdownIndex, setDrugDropdownIndex] = useState(null);
  const [drugSearch, setDrugSearch] = useState('');
  const drugWrapperRef = useRef(null);
  const [prescriptions, setPrescriptions] = useState([]);

  useEffect(() => {
    const loadPrescriptions = async () => {
      try {
        const res = await getPrescriptionsForConsultation(sourceId);
        const rawData = res?.data ?? res;
        setPrescriptions(Array.isArray(rawData) ? rawData : [rawData]);
      } catch (err) {
        console.error(err);
      }
    };
    if (sourceId) loadPrescriptions();
  }, [sourceId]);

  const editingPrescription = location?.state?.prescription;
  const isEdit = !!editingPrescription;

  const { register, control, setValue, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { medications: [emptyMedication] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'medications' });

  useEffect(() => {
    if (editingPrescription) {
      const meds = editingPrescription.medications.map((med) => {
        const { amount, unit } = parseDurationParts(med.duration);
        return {
          medicationType: med.medicationType || 'tablet',
          drugName: med.drugName || '',
          dosageAmount: med.dosageAmount ?? '',
          dosageUnit: med.dosageUnit || (med.medicationType === 'tablet' ? 'tablet' : 'ml'),
          frequency: med.frequency || '',
          duration: med.duration || '',
          durationAmount: amount,
          durationUnit: unit,
          instructions: med.instructions || '',
          dosesGiven: med.dosesGiven || 0,
          injectionStatus: med.injectionStatus || 'pending',
          inventoryId: med.inventoryId ?? null,
           _selectedDrug: null,
          availability: med.availability || (med.inventoryId ? 'available' : undefined),
        };
      });
      setValue('medications', meds);
    }
  }, [editingPrescription, setValue]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const patientRes = await getPatientById(patientId);
        const patientData = patientRes?.data ?? patientRes;
        setPatient(patientData);

        if (patientData?.dependants) {
          setDependants(Array.isArray(patientData.dependants) ? patientData.dependants : []);
        }

        if (isAntenatal) {
          const allRecords = await getAnteNatalRecordByPatientId(patientId);
          const records = allRecords?.data ?? allRecords ?? [];
          const selectedAntenatal = Array.isArray(records) ? records.find(r => r._id === antenatalId) : null;
          setConsultation(selectedAntenatal || { _id: antenatalId });
          setSelectedTarget('patient');
        } else {
          const consultRes = await getConsultationById(consultationId);
          const consultData = consultRes?.data ?? consultRes;
          setConsultation(consultData);
          setSelectedTarget(consultData?.dependantId || 'patient');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (patientId && sourceId) loadData();
  }, [patientId, sourceId, isAntenatal, antenatalId, consultationId]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()
  ), [patient]);

  useEffect(() => {
    if (editingPrescription) {
      setSelectedTarget(editingPrescription.dependantId || 'patient');
    }
  }, [editingPrescription]);

  const selectedTargetName = useMemo(() => {
    if (selectedTarget === 'patient') return patientName;
    const dependant = dependants.find(d => d.id === selectedTarget);
    return dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() : 'Unknown';
  }, [selectedTarget, patientName, dependants]);

  useEffect(() => {
    const fetchDrugs = async () => {
      try {
        const res = await getInventories();
        setDrugList(res.data || res);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDrugs();
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (drugWrapperRef.current && !drugWrapperRef.current.contains(e.target)) {
        setDrugDropdownIndex(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Line-level quantity/price preview, recalculated on every relevant keystroke.
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
      medicationType,
      dosageAmount,
      dosageUnit,
      frequency,
      duration,
      inventory: selectedDrug,
    });
  };

  const grandTotal = fields.reduce((sum, _item, index) => {
    const preview = getLinePreview(index);
    return sum + (preview?.lineTotal || 0);
  }, 0);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const isDependant = !!consultation?.dependantId;
      const targetId = isDependant ? consultation.dependantId : consultation.patientId;

      const payload = {
        patientId,
        ...(isDependant ? { dependantId: targetId } : {}),
        ...(isAntenatal ? { antenatalId: sourceId } : { consultationId: sourceId }),
        medications: data.medications.map((med) => {
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
            dosesGiven: medData.medicationType === 'injection' ? Number(medData.dosesGiven) : undefined,
            injectionStatus: medData.medicationType === 'injection' ? medData.injectionStatus : undefined,
            // Server recomputes these from inventory before saving — sent here
            // only so the doctor's on-screen estimate is visible immediately.
            prescribedQuantity: preview?.prescribedQuantity ?? null,
            billedQuantity: preview?.billedQuantity ?? null,
            unitPrice: preview?.unitPrice ?? null,
            lineTotal: preview?.lineTotal ?? null,
          };
        }),
        status: editingPrescription?.status || 'pending',
      };

      if (isEdit) {
        await updatePrescription(editingPrescription._id, payload);
        toast.success('Prescription updated successfully');
      } else {
        const sourceType = isAntenatal ? 'antenatal' : 'consultation';
        await createPrescription(payload, sourceId, sourceType);
        toast.success('Prescription created successfully');
      }

      navigate(-1);
    } catch (error) {
      console.error('Prescription error:', error);
      toast.error(getErrorMessage(error, 'Failed to save prescription'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50">
        {loading && <KolakLoader fullscreen />}
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar />
        </div>
        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={toggleSidebar} />
          <div className="flex flex-col h-full overflow-hidden">
            <div className="bg-base-100 border-b border-base-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="skeleton h-12 w-12 rounded-full"></div>
                <div>
                  <div className="skeleton h-6 w-48 mb-2"></div>
                  <div className="skeleton h-4 w-32"></div>
                </div>
              </div>
              <div className="skeleton h-10 w-10 rounded-full"></div>
            </div>
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="card bg-base-100 shadow-sm border border-base-200">
                  <div className="card-body p-6">
                    <div className="skeleton h-6 w-40 mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="col-span-2"><div className="skeleton h-10 w-full"></div></div>
                      <div className="skeleton h-12 w-full"></div>
                      <div className="skeleton h-12 w-full"></div>
                      <div className="skeleton h-12 w-full"></div>
                      <div className="skeleton h-12 w-full"></div>
                      <div className="col-span-2"><div className="skeleton h-24 w-full"></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MedicalDirectorLayout>
      <div className="flex h-screen bg-base-200/50">
        <div className="flex overflow-hidden flex-col flex-1">
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="bg-base-100 border-b border-base-200 px-6 py-4 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                  <FaPrescriptionBottleAlt className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-base-content">{isEdit ? 'Update Prescription' : 'Write Prescription'}</h1>
                  <p className="text-sm text-base-content/70">
                    For:
                    <span className="font-medium text-primary ml-1">{selectedTargetName}</span>
                    <span className="ml-2 badge badge-outline badge-sm">
                      {selectedTarget === 'patient' ? 'Patient' : 'Dependant'}
                    </span>
                  </p>
                </div>
              </div>
              <button className="btn btn-ghost btn-circle text-base-content/70 hover:bg-base-200" onClick={() => navigate(-1)}>
                <IoIosCloseCircleOutline className="w-8 h-8" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mx-auto">
                  {fields.map((item, index) => {
                    const medicationType = watch(`medications.${index}.medicationType`);
                    const selectedDrug = watch(`medications.${index}._selectedDrug`);
                    const availability = watch(`medications.${index}.availability`);
                    const unitOptions = getUnitOptions(medicationType, selectedDrug);
                    const preview = getLinePreview(index);

                    return (
                      <div key={item.id} className="card bg-base-100 shadow-sm border border-base-200 relative overflow-visible">
                        <div className="card-body p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                              <span className="badge badge-primary badge-lg">{index + 1}</span>
                              <h3 className="font-semibold text-lg">Medication Details</h3>
                            </div>
                            {fields.length > 1 && (
                              <button type="button" className="btn btn-ghost btn-sm text-error" onClick={() => remove(index)}>
                                <IoMdTrash className="w-5 h-5" />
                              </button>
                            )}
                          </div>

                          {/* Form tabs */}
                          <div className="tabs tabs-boxed w-fit mb-6">
                            {MEDICATION_TABS.map((tab) => {
                              const Icon = tab.icon;
                              const active = medicationType === tab.value;
                              return (
                                <button
                                  key={tab.value}
                                  type="button"
                                  className={`tab gap-2  ${active ? 'tab-active bg-primary text-primary-content' : ''}`}
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

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Drug search */}
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
                                        key="prescribe-unavailable"
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

                              {watch(`medications.${index}.drugName`) && selectedDrug && (
                                <div className="mt-2 p-3 bg-info/10 border border-info/30 rounded text-sm text-info-content">
                                  <p className="font-medium">
                                    Available: {selectedDrug?.form || 'N/A'} {selectedDrug?.strength ? `- ${selectedDrug.strength}` : ''}
                                  </p>
                                  {selectedDrug?.stock !== undefined && (
                                    <p className="text-xs mt-1">
                                      Stock: <span className={selectedDrug.stock > 0 ? 'text-success font-semibold' : 'text-warning font-semibold'}>{selectedDrug.stock}</span> {selectedDrug.unit || getUnitOptions(medicationType, null)[0]?.value}
                                      {selectedDrug.packSize > 1 && ` (packs of ${selectedDrug.packSize})`}
                                    </p>
                                  )}
                                </div>
                              )}
                              {availability === 'unavailable' && (
                                <div className="badge badge-warning badge-sm gap-1 mt-1">
                                  Unavailable — patient to source externally
                                </div>
                              )}
                              {errors.medications?.[index]?.drugName && (
                                <span className="text-error text-xs mt-1">{errors.medications[index].drugName.message}</span>
                              )}
                            </div>

                            {/* Dosage amount + unit */}
                            <div className="form-control">
                              <label className="label"><span className="label-text">Dose</span></label>
                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  step="any"
                                  placeholder="e.g. 2"
                                  className={`input input-bordered w-full ${errors.medications?.[index]?.dosageAmount ? 'input-error' : ''}`}
                                  {...register(`medications.${index}.dosageAmount`)}
                                />
                                <select
                                  className={`select select-bordered w-32 ${errors.medications?.[index]?.dosageUnit ? 'select-error' : ''}`}
                                  {...register(`medications.${index}.dosageUnit`)}
                                >
                                  {unitOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              </div>
                              {errors.medications?.[index]?.dosageAmount && (
                                <span className="text-error text-xs mt-1">{errors.medications[index].dosageAmount.message}</span>
                              )}
                              {errors.medications?.[index]?.dosageUnit && (
                                <span className="text-error text-xs mt-1">{errors.medications[index].dosageUnit.message}</span>
                              )}
                            </div>

                            <div className="form-control">
                              <label className="label"><span className="label-text">Frequency</span></label>
                              <select
                                className={`select select-bordered w-full ${errors.medications?.[index]?.frequency ? 'select-error' : ''}`}
                                {...register(`medications.${index}.frequency`)}
                              >
                                <option value="">Select frequency</option>
                                {(['injection', 'infusion'].includes(medicationType) ? INJECTION_FREQUENCIES : ORAL_FREQUENCIES).map((f) => (
                                  <option key={f} value={f}>{f}</option>
                                ))}
                              </select>
                              {errors.medications?.[index]?.frequency && (
                                <span className="text-error text-xs mt-1">{errors.medications[index].frequency.message}</span>
                              )}
                            </div>

                            <div className="form-control">
                              <label className="label"><span className="label-text">Duration</span></label>

                              <div className="flex flex-wrap gap-1 mb-2">
                                {[1, 2, 3, 4, 5, 6].map((n) => {
                                  const unit = watch(`medications.${index}.durationUnit`) || 'day';
                                  const active = Number(watch(`medications.${index}.durationAmount`)) === n;
                                  return (
                                    <button
                                      key={n}
                                      type="button"
                                      className={`btn btn-xs ${active ? 'btn-primary' : 'btn-outline'}`}
                                      onClick={() => {
                                        setValue(`medications.${index}.durationAmount`, n);
                                        setValue(`medications.${index}.duration`, buildDurationString(n, unit));
                                      }}
                                    >
                                      {n}
                                    </button>
                                  );
                                })}
                              </div>

                              <div className="flex gap-2">
                                <input
                                  type="number"
                                  min="1"
                                  step="1"
                                  placeholder="e.g. 8"
                                  className={`input input-bordered w-full ${errors.medications?.[index]?.duration ? 'input-error' : ''}`}
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
                              {errors.medications?.[index]?.duration && (
                                <span className="text-error text-xs mt-1">{errors.medications[index].duration.message}</span>
                              )}
                            </div>

                            <div className="form-control md:col-span-2">
                              <label className="label"><span className="label-text">Instructions (Optional)</span></label>
                              <textarea
                                className="textarea textarea-bordered h-20"
                                placeholder="e.g. Take after meals"
                                {...register(`medications.${index}.instructions`)}
                              ></textarea>
                            </div>
                          </div>

                          {/* Live quantity/price preview */}
                          {availability === 'unavailable' ? (
                            <div className="mt-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm">
                              Not in stock — no charge, patient sources this externally.
                            </div>
                          ) : preview && preview.convertible === false ? (
                            <div className="mt-4 p-3 rounded-lg bg-error/10 border border-error/30 text-sm text-error">
                              Can't convert {watch(`medications.${index}.dosageUnit`)} for this drug — add concentration info in Inventory, or switch the unit.
                            </div>
                          ) : preview ? (
                            <div className="mt-4 p-3 rounded-lg bg-success/10 border border-success/30 text-sm flex flex-wrap items-center justify-between gap-2">
                              <div>
                                Prescribed: <span className="font-medium">{Number(preview.prescribedQuantity).toFixed(2)} {preview.unit}</span>
                                {medicationType === 'syrup' && preview.bottlesNeeded > 0 && (
                                  <span className="text-base-content/60">
                                    {' '}— billed as {preview.bottlesNeeded} bottle{preview.bottlesNeeded > 1 ? 's' : ''} ({preview.billedQuantity} {preview.unit})
                                  </span>
                                )}
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

                  {/* Grand total */}
                  <div className="card bg-base-100 shadow-sm border border-base-200">
                    <div className="card-body p-4 flex-row items-center justify-between">
                      <span className="font-semibold text-base-content/70">Estimated Total</span>
                      <span className="text-xl font-bold text-primary">{currency(grandTotal)}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 pb-8">
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => navigate(`/dashboard/medical-director/medical-history/${patientId}/consultation/${consultationId}`, {
                        state: {
                          from: fromIncoming ? 'incoming' : 'patients',
                          dependantId: consultation?.dependantId || null,
                          dependantSnapshot: consultation?.dependant || null,
                        },
                      })}
                    >
                      Cancel
                    </button>
                    <button type="submit" className={`btn btn-primary px-8 ${saving ? 'loading' : ''}`} disabled={saving}>
                      {isEdit ? 'Update Prescription' : 'Create Prescription'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MedicalDirectorLayout>
  );
};

export default WritePrescription;