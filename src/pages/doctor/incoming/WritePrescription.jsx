import React, { useEffect, useState, useMemo, useRef } from 'react'; 
import { useParams, useNavigate, useLocation } from 'react-router-dom'; 
import { useForm, useFieldArray, Controller, get } from 'react-hook-form'; 
import { yupResolver } from '@hookform/resolvers/yup'; 
import * as yup from 'yup'; 
import { Header } from '@/components/common'; 
import Sidebar from '@/components/doctor/dashboard/Sidebar'; 
import { getConsultationById } from '@/services/api/consultationAPI'; 
import { getPatientById } from '@/services/api/patientsAPI'; 
import { createPrescription, getPrescriptionsForConsultation, updatePrescription } from '@/services/api/prescriptionsAPI'; 
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
  const [dependants, setDependants] = useState([]); 
  const [selectedTarget, setSelectedTarget] = useState('patient'); // 'patient' or dependant ID
  const [drugList, setDrugList] = useState([]); 
  const [drugDropdownIndex, setDrugDropdownIndex] = useState(null); 
  const [drugSearch, setDrugSearch] = useState(""); 
  const drugWrapperRef = useRef(null); 
  const [prescriptions, setPrescriptions] = useState([]); 
 
useEffect(() => { 
  const loadPrescriptions = async () => { 
    try { 
      const res = await getPrescriptionsForConsultation(consultationId); 
      const rawData = res?.data ?? res; 
      setPrescriptions(Array.isArray(rawData) ? rawData : [rawData]); 
    } catch (err) { 
      console.error(err); 
    } 
  }; 
  loadPrescriptions(); 
}, [consultationId]); 
 
const editingPrescription = location?.state?.prescription; 
const isEdit = !!editingPrescription; 
   
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
  if (editingPrescription) { 
 
    const meds = editingPrescription.medications.map((med) => ({ 
      medicationType: med.medicationType || 'oral', 
      drugName: med.drugName || '', 
      dosage: med.dosage || '', 
      frequency: med.frequency || '', 
      duration: med.duration || '', 
      instructions: med.instructions || '', 
      dosesGiven: med.dosesGiven || 0, 
      injectionStatus: med.injectionStatus || 'pending' 
    })); 
 
    setValue("medications", meds); 
 
  } 
}, [editingPrescription, setValue]); 
 
  useEffect(() => { 
  const loadData = async () => { 
    try { 
      setLoading(true); 

      const [consultRes, patientRes] = await Promise.all([ 
        getConsultationById(consultationId), 
        getPatientById(patientId) 
      ]); 

      const consultData = consultRes?.data ?? consultRes; 
      const patientData = patientRes?.data ?? patientRes; 
      
      setConsultation(consultData); 
      setPatient(patientData); 

      if (patientData?.dependants) {
        setDependants(Array.isArray(patientData.dependants) ? patientData.dependants : []);
      }

      // ✅ Correct target binding
      if (consultData?.dependantId) {
        setSelectedTarget(consultData.dependantId);
      } else {
        setSelectedTarget('patient');
      }

    } catch (error) { 
      console.error(error); 
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

  useEffect(() => {
  if (editingPrescription) {
    if (editingPrescription.dependantId) {
      setSelectedTarget(editingPrescription.dependantId);
    } else {
      setSelectedTarget('patient');
    }
  }
}, [editingPrescription]);
  // Get the display name for the selected target
  const selectedTargetName = useMemo(() => {
    if (selectedTarget === 'patient') {
      return patientName;
    }
    const dependant = dependants.find(d => d.id === selectedTarget);
    return dependant ? `${dependant.firstName || ''} ${dependant.lastName || ''}`.trim() : 'Unknown';
  }, [selectedTarget, patientName, dependants]);
 
const onSubmit = async (data) => { 
  setSaving(true); 
 
  try { 
    // Determine if prescription is for patient or dependant
    const isDependant = !!consultation?.dependantId;
    const targetId = isDependant
  ? consultation.dependantId
  : consultation.patientId;

   

const payload = {
  ...(isDependant
    ? { dependantId: targetId }
    : { patientId: patientId }),

  consultationId,
  medications: data.medications.map((med) => {
    const { _selectedDrug, ...medData } = med;

    return {
      ...medData,
      instructions: medData.instructions || undefined,
      dosesGiven:
        medData.medicationType === "injection"
          ? Number(medData.dosesGiven)
          : undefined,
      injectionStatus:
        medData.medicationType === "injection"
          ? medData.injectionStatus
          : undefined
    };
  }),
  status: editingPrescription?.status || "pending"
};
 
    if (isEdit) { 
 
      await updatePrescription(editingPrescription._id, payload); 
 
      toast.success("Prescription updated successfully"); 
 
    } else { 
 
      await createPrescription(payload, consultationId); 
 
      toast.success("Prescription created successfully"); 
 
    } 
 
    navigate(`/dashboard/doctor/medical-history/${patientId}`, { 
      state: { from: fromIncoming ? "incoming" : "patients" } 
    }); 
 
  } catch (error) { 
 
    console.error("Prescription error:", error); 
 
    toast.error( 
      error.response?.data?.message || 
      "Failed to save prescription" 
    ); 
 
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
                <h1 className="text-xl font-bold text-base-content">{isEdit ? "Update Prescription" : "Write Prescription"}</h1> 
                <p className="text-sm text-base-content/70"> 
                  For: 
                  <span className="font-medium text-primary ml-1">
                    {selectedTargetName}
                  </span>
                  <span className="ml-2 badge badge-outline badge-sm">
                    {selectedTarget === 'patient' ? 'Patient' : 'Dependant'}
                  </span>
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
                // Store selected drug data for display 
                setValue(`medications.${index}._selectedDrug`, drug); 
                setDrugDropdownIndex(null); 
                setDrugSearch(""); 
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
 
  {/* Display selected drug form/strength info */} 
  {watch(`medications.${index}.drugName`) && watch(`medications.${index}._selectedDrug`) && ( 
    <div className="mt-2 p-3 bg-info/10 border border-info/30 rounded text-sm text-info-content"> 
      <p className="font-medium">Available: {watch(`medications.${index}._selectedDrug`)?.form || 'N/A'} {watch(`medications.${index}._selectedDrug`)?.strength ? `- ${watch(`medications.${index}._selectedDrug`)?.strength}` : ''}</p> 
      {watch(`medications.${index}._selectedDrug`)?.quantity && ( 
        <p className="text-xs mt-1">Stock: {watch(`medications.${index}._selectedDrug`)?.quantity} units available</p> 
      )} 
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
                   {isEdit ? "Update Prescription" : "Create Prescription"} 
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
                      Consultation ID 
                    </h3> 
                    <p className="text-base font-mono font-semibold text-base-content">{consultationId}</p> 
                  </div> 
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
