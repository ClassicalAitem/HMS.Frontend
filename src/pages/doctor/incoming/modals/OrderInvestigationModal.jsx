import React, { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus, FaFlask, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createInvestigation } from '@/services/api/investigationAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';

const testSchema = yup.object({
  name: yup.string().required('Test name is required'),
});

const investigationSchema = yup.object({
  tests: yup.array().of(testSchema).min(1, 'At least one test is required'),
  priority: yup.string().oneOf(['normal', 'urgent', 'emergency']).required(),
});

const OrderInvestigationModal = ({ isOpen, onClose, patientId, consultationId, doctorId, onOrderCreated }) => {
  const [isLoading, setIsLoading] = useState(false);

  const [serviceCharges, setServiceCharges] = useState([]);
  const [filteredCharges, setFilteredCharges] = useState([]);
  const [testSearch, setTestSearch] = useState("");

const [testDropdownIndex, setTestDropdownIndex] = useState(null);
const testWrapperRef = useRef(null);


const filteredTests = serviceCharges.filter((test) =>
  testSearch
    ? test.service?.toLowerCase().includes(testSearch.toLowerCase())
    : true
);


useEffect(() => {
  const loadCharges = async () => {
    try {
      const res = await getServiceCharges();
      const data = res?.data ?? res ?? [];

      const labCharges = data.filter(
        (item) => (item.category || '').toLowerCase() === 'laboratory'
      );

      setServiceCharges(labCharges);
      setFilteredCharges(labCharges);
    } catch (err) {
      console.error('Failed to load service charges', err);
    }
  };

  if (isOpen) loadCharges();
}, [isOpen]);
  const {
    register,
    control,
    handleSubmit,
    setValue,
     watch, 
    formState: { errors },
    reset
  } = useForm({
    resolver: yupResolver(investigationSchema),
    defaultValues: {
      tests: [{ name: '' }],
      priority: 'normal',
    }
  });

  const { fields, append,  remove } = useFieldArray({
    control,
    name: "tests"
  });

  useEffect(() => {
  const handleClick = (e) => {
    if (
      testWrapperRef.current &&
      !testWrapperRef.current.contains(e.target)
    ) {
      setTestDropdownIndex(null);
    }
  };

  document.addEventListener("mousedown", handleClick);
  return () => document.removeEventListener("mousedown", handleClick);
}, []);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const payload = {
        patientId,
        // doctorId will be handled by backend from token usually, but user passed it in props if needed
        type: 'lab',
        tests: data.tests,
        priority: data.priority,
        status: 'in_progress'
      };

      await createInvestigation(consultationId, payload);
      toast.success('Investigation order created successfully!');
      reset();
      if (onOrderCreated) onOrderCreated();
      onClose();
    } catch (error) {
      console.error('Error creating investigation order:', error);
      toast.error(error.response?.data?.message || 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-base-100 rounded-xl shadow-2xl overflow-hidden border border-base-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-100">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaFlask className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-base-content">Order Further Tests</h2>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-base-200">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Area */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="investigation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Priority Selection */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text font-medium">Priority Level</span>
              </label>
              <select 
                className="select select-bordered w-full"
                {...register('priority')}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
              {errors.priority && (
                <span className="text-error text-sm mt-1">{errors.priority.message}</span>
              )}
            </div>

            <div className="divider text-sm font-medium text-base-content/50">Requested Tests</div>

            {/* Dynamic Test Fields */}
            <div className="space-y-4">
              {fields.map((item, index) => (
                <div key={item.id} className="card bg-base-200/50 border border-base-200">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="badge badge-primary badge-outline text-xs font-bold">Test #{index + 1}</span>
                      {fields.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => remove(index)}
                          className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                        >
                          <FaTrash /> Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="form-control">
                       
                       <div className="form-control relative" ref={testWrapperRef}>
                          <label className="label">
                            <span className="label-text">Test Name</span>
                          </label>

                          <input
                            type="text"
                            placeholder="Search lab test..."
                            className="input input-bordered w-full"
                            value={testDropdownIndex === index ? testSearch : watch(`tests.${index}.name`) || ""}
                            onFocus={() => {
                              setTestDropdownIndex(index);
                              setTestSearch("");
                            }}
                            onChange={(e) => {
                              setTestSearch(e.target.value);
                              setTestDropdownIndex(index);
                            }}
                          />

                          {testDropdownIndex === index && (
                            <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                              <ul>
                                {filteredTests.map((test) => (
                                  <li
                                    key={test.id}
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                                    onClick={() => {
                                    setValue(`tests.${index}.name`, test.service);
                                      setTestDropdownIndex(null);
                                      setTestSearch("");
                                    }}
                                  >
                                    <div className="flex justify-between">
                                      <span>{test.service}</span>
                                      <span className="text-xs text-gray-500">
                                        ₦{Number(test.amount).toLocaleString()}
                                      </span>
                                    </div>
                                  </li>
                                ))}

                                {filteredTests.length === 0 && (
                                  <li className="px-4 py-2 text-gray-400 text-sm">
                                    No matches found
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </div>
                        {errors.tests?.[index]?.name && (
                          <span className="text-error text-xs mt-1">{errors.tests[index].name.message}</span>
                        )}
                      </div>

                

                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button 
              type="button" 
              className="btn btn-outline btn-primary btn-sm w-full border-dashed gap-2"
              onClick={() => append({ name: ''})}
            >
              <FaPlus className="w-3 h-3" /> Add Another Test
            </button>

          </form>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-base-200 bg-base-50 flex justify-end gap-3">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="investigation-form"
            className="btn btn-primary px-8"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading loading-spinner loading-sm"></span>
            ) : (
              <>Submit Order</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderInvestigationModal;