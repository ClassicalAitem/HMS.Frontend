import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Header } from '@/components/common';
import Sidebar from '@/components/doctor/dashboard/Sidebar';
import { getConsultationById } from '@/services/api/consultationAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import { createPrescription } from '@/services/api/prescriptionsAPI';
import { IoIosCloseCircleOutline, IoMdAdd, IoMdTrash } from 'react-icons/io';
import { FaPrescriptionBottleAlt, FaSyringe, FaPills, FaNotesMedical, FaFileMedicalAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getInventories } from '@/services/api/inventoryAPI';

const medicationSchema = yup.object().shape({
  medicationType: yup.string().oneOf(['oral', 'injection']).required(),
  drugName: yup.string().required('Drug name is required'),
  dosage: yup.string().required('Dosage is required'),
  frequency: yup.string().required('Frequency is required'),
  duration: yup.string().required('Duration is required'),
  instructions: yup.string(),
   dosesGiven: yup.number().transform((value) => (isNaN(value) ? undefined : value)).when('medicationType', {
    is: 'injection',
    then: (schema) => schema.required('Doses given is required'),
    otherwise: (schema) => schema.nullable()
  }),
  injectionStatus: yup.string().when('medicationType', {
    is: 'injection',
    then: (schema) => schema.required('Injection status is required'),
    otherwise: (schema) => schema.nullable()
  })
});



const schema = yup.object().shape({
  medications: yup.array().of(medicationSchema).min(1, 'At least one medication is required')
});

const WritePrescription = () => {
  const { patientId, consultationId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const fromIncoming = location?.state?.from === "incoming";

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [consultation, setConsultation] = useState(null);
  const [patient, setPatient] = useState(null);
  const [saving, setSaving] = useState(false);
const [drugList, setDrugList] = useState([]);
const [drugDropdownIndex, setDrugDropdownIndex] = useState(null);
const [drugSearch, setDrugSearch] = useState("");
const drugWrapperRef = useRef(null);
  
  const { register, control, setValue, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      medications: [{
        medicationType: 'oral',
        drugName: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: '',
        dosesGiven: 0,
        injectionStatus: 'pending'
      }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "medications"
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [consultRes, patientRes] = await Promise.all([
          getConsultationById(consultationId),
          getPatientById(patientId)
        ]);

        setConsultation(consultRes?.data ?? consultRes);
        setPatient(patientRes?.data ?? patientRes);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load consultation data");
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientId, consultationId]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  const patientName = useMemo(() => (
    patient?.fullName || `${patient?.firstName || ""} ${patient?.lastName || ""}`.trim()
  ), [patient]);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const payload = {
        patientId,
        consultationId, // Add consultationId to link prescription to consultation
        medications: data.medications.map(med => ({
          ...med,
          // Convert empty instructions to undefined to avoid sending empty strings if backend disallows it
          instructions: med.instructions ? med.instructions : undefined,
          // Ensure injection specific fields are handled correctly
          dosesGiven: med.medicationType === 'injection' ? Number(med.dosesGiven) : undefined,
          injectionStatus: med.medicationType === 'injection' ? med.injectionStatus : undefined
        })),
        status: 'pending'
      };

      console.log("Submitting prescription payload:", payload);
      await createPrescription(payload, consultationId);
      toast.success("Prescription created successfully!");
      navigate(`/dashboard/doctor/medical-history/${patientId}`, { state: { from: fromIncoming ? "incoming" : "patients" } });
    } catch (error) {
      console.error("Error creating prescription:", error);
      toast.error(error.response?.data?.message || "Failed to create prescription");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {

  const fetchDrugs = async () => {
    try {
      const res = await getInventories();
      setDrugList(res.data || res); // depends on your API structure
    } catch (err) {
      console.error(err);
    }
  };

  fetchDrugs();
}, []);

useEffect(() => {
  const handleClick = (e) => {
    if (
      drugWrapperRef.current &&
      !drugWrapperRef.current.contains(e.target)
    ) {
      setDrugDropdownIndex(null);
    }
  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200/50">
        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
          <Sidebar />
        </div>

        <div className="flex overflow-hidden flex-col flex-1">
          <Header onToggleSidebar={toggleSidebar} />

          <div className="flex flex-col h-full overflow-hidden">
            {/* Header Skeleton */}
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
              {/* Main Form Skeleton */}
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

              {/* Right Sidebar Skeleton */}
              <div className="w-80 bg-base-100 border-l border-base-200 overflow-y-auto hidden xl:block mr-7 my-7 shadow-md p-6 space-y-6">
                <div className="skeleton h-6 w-48"></div>
                <div className="space-y-4">
                  <div className="skeleton h-32 w-full rounded-lg"></div>
                  <div className="skeleton h-48 w-full rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-200/50">
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <Sidebar />
      </div>

      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex flex-col h-full overflow-hidden">
          {/* Header */}
          <div className="bg-base-100 border-b border-base-200 px-6 py-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full text-primary">
                <FaPrescriptionBottleAlt className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-base-content">Write Prescription</h1>
                <p className="text-sm text-base-content/70">
                  Patient: <span className="font-medium text-primary">{patientName}</span>
                </p>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-circle text-base-content/70 hover:bg-base-200"
              onClick={() => navigate(-1)}
            >
              <IoIosCloseCircleOutline className="w-8 h-8" />
            </button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Main Form Area */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mx-auto">

                {fields.map((item, index) => {
                  const medicationType = watch(`medications.${index}.medicationType`);

                  return (
                    <div key={item.id} className="card bg-base-100 shadow-sm border border-base-200 relative overflow-visible">
                      <div className="card-body p-6">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary badge-lg">{index + 1}</span>
                            <h3 className="font-semibold text-lg">Medication Details</h3>
                          </div>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-error"
                              onClick={() => remove(index)}
                            >
                              <IoMdTrash className="w-5 h-5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Type Selection */}
                          <div className="form-control md:col-span-2">
                            <label className="label cursor-pointer justify-start gap-4">
                              <span className="label-text font-medium">Type:</span>
                              <label className="cursor-pointer flex items-center gap-2">
                                <input
                                  type="radio"
                                  value="oral"
                                  className="radio radio-primary radio-sm"
                                  {...register(`medications.${index}.medicationType`)}
                                />
                                <span className="label-text flex items-center gap-1"><FaPills /> Oral</span>
                              </label>
                              <label className="cursor-pointer flex items-center gap-2">
                                <input
                                  type="radio"
                                  value="injection"
                                  className="radio radio-primary radio-sm"
                                  {...register(`medications.${index}.medicationType`)}
                                />
                                <span className="label-text flex items-center gap-1"><FaSyringe /> Injection</span>
                              </label>
                            </label>
                          </div>

                          {/* Common Fields */}
             <div className="form-control relative" ref={drugWrapperRef}>
  <label className="label">
    <span className="label-text">Drug Name</span>
  </label>

  <input
    type="text"
    placeholder="Search drug..."
    className={`input input-bordered w-full ${
      errors.medications?.[index]?.drugName ? "input-error" : ""
    }`}
    value={
      drugDropdownIndex === index
        ? drugSearch
        : watch(`medications.${index}.drugName`) || ""
    }
    onFocus={() => {
      setDrugDropdownIndex(index);
      setDrugSearch("");
    }}
    onChange={(e) => {
      setDrugSearch(e.target.value);
      setDrugDropdownIndex(index);
    }}
    autoComplete="off"
  />

  {drugDropdownIndex === index && (
    <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
      <ul className="py-1">
        {drugList
          .filter((drug) =>
            drugSearch
              ? drug.name
                  ?.toLowerCase()
                  .includes(drugSearch.toLowerCase())
              : true
          )
          .map((drug) => (
            <li
              key={drug.id}
              onClick={() => {
                setValue(
                  `medications.${index}.drugName`,
                  drug.name
                );
                setDrugDropdownIndex(null);
                setDrugSearch("");
              }}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
            >
              {drug.name}
            </li>
          ))}

        {drugList.filter((drug) =>
          drugSearch
            ? drug.name
                ?.toLowerCase()
                .includes(drugSearch.toLowerCase())
            : true
        ).length === 0 && (
          <li className="px-4 py-2 text-gray-400 text-sm">
            No matches found
          </li>
        )}
      </ul>
    </div>
  )}

  {errors.medications?.[index]?.drugName && (
    <span className="text-error text-xs mt-1">
      {errors.medications[index].drugName.message}
    </span>
  )}
</div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Dosage</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 500mg"
                              className={`input input-bordered w-full ${errors.medications?.[index]?.dosage ? 'input-error' : ''}`}
                              {...register(`medications.${index}.dosage`)}
                            />
                            {errors.medications?.[index]?.dosage && (
                              <span className="text-error text-xs mt-1">{errors.medications[index].dosage.message}</span>
                            )}
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Frequency</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. Twice daily"
                              className={`input input-bordered w-full ${errors.medications?.[index]?.frequency ? 'input-error' : ''}`}
                              {...register(`medications.${index}.frequency`)}
                            />
                            {errors.medications?.[index]?.frequency && (
                              <span className="text-error text-xs mt-1">{errors.medications[index].frequency.message}</span>
                            )}
                          </div>

                          <div className="form-control">
                            <label className="label">
                              <span className="label-text">Duration</span>
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 7 days"
                              className={`input input-bordered w-full ${errors.medications?.[index]?.duration ? 'input-error' : ''}`}
                              {...register(`medications.${index}.duration`)}
                            />
                            {errors.medications?.[index]?.duration && (
                              <span className="text-error text-xs mt-1">{errors.medications[index].duration.message}</span>
                            )}
                          </div>

                          {/* Injection Specific Fields */}
                          {medicationType === 'injection' && (
                            <>
                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text">Doses Given</span>
                                </label>
                                <input
                                  type="number"
                                  placeholder="e.g. 1"
                                  className={`input input-bordered w-full ${errors.medications?.[index]?.dosesGiven ? 'input-error' : ''}`}
                                  {...register(`medications.${index}.dosesGiven`)}
                                />
                                {errors.medications?.[index]?.dosesGiven && (
                                  <span className="text-error text-xs mt-1">{errors.medications[index].dosesGiven.message}</span>
                                )}
                              </div>

                              <div className="form-control">
                                <label className="label">
                                  <span className="label-text">Injection Status</span>
                                </label>
                                <select
                                  className={`select select-bordered w-full ${errors.medications?.[index]?.injectionStatus ? 'select-error' : ''}`}
                                  {...register(`medications.${index}.injectionStatus`)}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="administered">Dispensed/Administered</option>
                                </select>
                                {errors.medications?.[index]?.injectionStatus && (
                                  <span className="text-error text-xs mt-1">{errors.medications[index].injectionStatus.message}</span>
                                )}
                              </div>
                            </>
                          )}

                          <div className="form-control md:col-span-2">
                            <label className="label">
                              <span className="label-text">Instructions (Optional)</span>
                            </label>
                            <textarea
                              className="textarea textarea-bordered h-20"
                              placeholder="e.g. Take after meals"
                              {...register(`medications.${index}.instructions`)}
                            ></textarea>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  className="btn btn-outline btn-primary w-full border-dashed"
                  onClick={() => append({
                    medicationType: 'oral',
                    drugName: '',
                    dosage: '',
                    frequency: '',
                    duration: '',
                    instructions: '',
                    dosesGiven: 0,
                    injectionStatus: 'pending'
                  })}
                >
                  <IoMdAdd className="w-5 h-5" /> Add Another Medication
                </button>

                <div className="flex justify-end gap-4 pt-4 pb-8">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`btn btn-primary px-8 ${saving ? 'loading' : ''}`}
                    disabled={saving}
                  >
                    Create Prescription
                  </button>
                </div>
              </form>
            </div>

            {/* Right Sidebar - Consultation Details */}
            <div className="w-80 bg-base-100 border-l border-base-200 overflow-y-auto hidden xl:block mr-7 my-7 shadow-md">
              <div className="p-6 space-y-6">
                <div className="flex items-center gap-2 text-base-content/70 pb-4 border-b border-base-200">
                  <FaFileMedicalAlt />
                  <h2 className="font-semibold uppercase text-sm tracking-wide">Consultation Reference</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-base-content/60 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <FaNotesMedical /> Diagnosis
                    </h3>
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <p className="font-medium text-primary">
                        {consultation?.diagnosis || "No diagnosis recorded"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-base-content/60 mb-2 uppercase tracking-wide flex items-center gap-2">
                      <FaNotesMedical /> Clinical Notes
                    </h3>
                    <div className="p-4 bg-base-200 rounded-lg text-sm text-base-content/80 whitespace-pre-wrap">
                      {consultation?.notes || "No notes recorded"}
                    </div>
                  </div>

                  {consultation?.complaint?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-base-content/60 mb-2 uppercase tracking-wide">Complaints</h3>
                      <div className="flex flex-wrap gap-2">
                        {consultation.complaint.map((c, i) => (
                          <span key={i} className="badge badge-outline">{c.symptom}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WritePrescription;