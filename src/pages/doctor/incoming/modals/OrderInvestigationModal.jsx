import React, { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus, FaFlask, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createInvestigation, updateInvestigation } from '@/services/api/investigationAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';

const testSchema = yup.object({
  name: yup.string().required('Test name is required'),
});

const investigationSchema = yup.object({
  tests: yup.array().of(testSchema).min(1, 'At least one test is required'),
  priority: yup.string().oneOf(['normal', 'urgent', 'emergency']).required(),
});

const OrderInvestigationModal = ({
  isOpen,
  onClose,
  patientId,
  consultationId,
  investigation, // <-- NEW (edit mode)
  onOrderCreated
}) => {

  const isEdit = !!investigation;

  const [isLoading, setIsLoading] = useState(false);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [testSearch, setTestSearch] = useState("");
  const [testDropdownIndex, setTestDropdownIndex] = useState(null);

  const testWrapperRef = useRef(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(investigationSchema),
    defaultValues: {
      tests: [{ name: "" }],
      priority: "normal"
    }
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "tests"
  });

  const filteredTests = serviceCharges.filter((test) =>
    testSearch
      ? test.service?.toLowerCase().includes(testSearch.toLowerCase())
      : true
  );

  // Load service charges
  useEffect(() => {
    const loadCharges = async () => {
      try {
        const res = await getServiceCharges();
        const data = res?.data ?? res ?? [];

        const labCharges = data.filter(
          (item) => (item.category || '').toLowerCase() === 'laboratory'
        );

        setServiceCharges(labCharges);
      } catch (err) {
        console.error('Failed to load service charges', err);
      }
    };

    if (isOpen) loadCharges();
  }, [isOpen]);

  // Prefill when editing
  useEffect(() => {
    if (investigation && isOpen) {

      const tests = investigation.tests?.length
        ? investigation.tests
        : [{ name: "" }];

      replace(tests);

      reset({
        tests,
        priority: investigation.priority || "normal"
      });

    } else if (isOpen) {
      reset({
        tests: [{ name: "" }],
        priority: "normal"
      });
    }
  }, [investigation, isOpen]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (testWrapperRef.current && !testWrapperRef.current.contains(e.target)) {
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
        type: "lab",
        tests: data.tests,
        priority: data.priority,
        status: investigation?.status || "in_progress"
      };

      if (isEdit) {

        await updateInvestigation(investigation._id, payload);
        toast.success("Investigation updated successfully");

      } else {

        await createInvestigation(consultationId, payload);
        toast.success("Investigation order created successfully");

      }

      reset();

      if (onOrderCreated) onOrderCreated();

      onClose();

    } catch (error) {

      console.error("Investigation error:", error);

      toast.error(
        error.response?.data?.message ||
        "Failed to save investigation"
      );

    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/60 backdrop-blur-sm">

      <div className="w-full max-w-2xl mx-4 bg-base-100 rounded-xl shadow-2xl border border-base-200 max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center">

          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaFlask />
            </div>

            <h2 className="text-xl font-bold">
              {isEdit ? "Edit Lab Investigation" : "Order Further Tests"}
            </h2>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FaTimes />
          </button>

        </div>

        {/* FORM */}
        <div className="p-6 overflow-y-auto flex-1">

          <form
            id="investigation-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-6"
          >

            {/* PRIORITY */}
            <div className="form-control w-full max-w-xs">
              <label className="label">
                <span className="label-text font-medium">
                  Priority Level
                </span>
              </label>

              <select
                className="select select-bordered w-full"
                {...register("priority")}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>

              {errors.priority && (
                <span className="text-error text-sm">
                  {errors.priority.message}
                </span>
              )}

            </div>

            <div className="divider">Requested Tests</div>

            {/* TEST LIST */}
            {fields.map((item, index) => (

              <div key={item.id} className="card bg-base-200/40">

                <div className="card-body p-4">

                  <div className="flex justify-between">

                    <span className="badge badge-outline">
                      Test #{index + 1}
                    </span>

                    {fields.length > 1 && (

                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn btn-ghost btn-xs text-error"
                      >
                        <FaTrash />
                      </button>

                    )}

                  </div>

                  <div className="form-control mt-2 relative" ref={testWrapperRef}>

                    <input
                      type="text"
                      placeholder="Search lab test..."
                      className="input input-bordered"
                      value={
                        testDropdownIndex === index
                          ? testSearch
                          : watch(`tests.${index}.name`) || ""
                      }
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

                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow max-h-60 overflow-auto">

                        {filteredTests.map((test) => (

                          <div
                            key={test.id}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex justify-between"
                            onClick={() => {
                              setValue(`tests.${index}.name`, test.service);
                              setTestDropdownIndex(null);
                              setTestSearch("");
                            }}
                          >

                            <span>{test.service}</span>

                            <span className="text-xs text-gray-500">
                              ₦{Number(test.amount).toLocaleString()}
                            </span>

                          </div>

                        ))}

                      </div>

                    )}

                    {errors.tests?.[index]?.name && (
                      <span className="text-error text-xs">
                        {errors.tests[index].name.message}
                      </span>
                    )}

                  </div>

                </div>

              </div>

            ))}

            {/* ADD TEST */}
            <button
              type="button"
              className="btn btn-outline btn-primary w-full"
              onClick={() => append({ name: "" })}
            >
              <FaPlus /> Add Another Test
            </button>

          </form>

        </div>

        {/* FOOTER */}
        <div className="p-6 border-t flex justify-end gap-3">

          <button
            type="button"
            className="btn btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="investigation-form"
            className="btn btn-primary"
            disabled={isLoading}
          >

            {isLoading
              ? "Saving..."
              : isEdit
              ? "Update Investigation"
              : "Submit Order"}

          </button>

        </div>

      </div>

    </div>
  );
};

export default OrderInvestigationModal;