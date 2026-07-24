import React, { useEffect, useRef, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus, FaHospital, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { createAdmission, updateAdmission } from '@/services/api/admissionApi';

const itemSchema = yup.object({
  name: yup.string().required('Item is required'),
});

const admissionSchema = yup.object({
  ward: yup.string().required('Ward is required'),
  reason: yup.string().optional(),
  admissions: yup.array().of(itemSchema).min(1, 'At least one item is required'),
});

const AdmissionModal = ({
  isOpen,
  onClose,
  patientId,
  dependantId,
  consultationId,
  antenatalId,
  admission, // <-- pass this to edit an existing admission
  onAdmissionCreated,
}) => {
  const isEdit = !!admission;

  const [isLoading, setIsLoading] = useState(false);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [itemSearch, setItemSearch] = useState('');
  const [itemDropdownIndex, setItemDropdownIndex] = useState(null);

  const itemWrapperRef = useRef(null);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(admissionSchema),
    defaultValues: {
      ward: '',
      reason: '',
      admissions: [{ name: '', amount: 0 }],
    },
  });

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: 'admissions',
  });

  const filteredItems = serviceCharges.filter((item) =>
    itemSearch
      ? item.service?.toLowerCase().includes(itemSearch.toLowerCase())
      : true
  );

  // Load ward/admission-related service charges
  useEffect(() => {
    const loadCharges = async () => {
      try {
        const res = await getServiceCharges();
        const data = res?.data ?? res ?? [];

        const admissionCharges = data.filter((item) =>
          ['admission', 'ward', 'bed'].includes(
            (item.category || '').toLowerCase()
          )
        );

        setServiceCharges(admissionCharges);
      } catch (err) {
        console.error('Failed to load service charges', err);
      }
    };

    if (isOpen) loadCharges();
  }, [isOpen]);

  // Prefill when editing
  useEffect(() => {
    if (admission && isOpen) {
      const items = admission.admissions?.length
        ? admission.admissions
        : [{ name: '', amount: 0 }];

      replace(items);

      reset({
        ward: admission.ward || '',
        reason: admission.reason || '',
        admissions: items,
      });
    } else if (isOpen) {
      reset({
        ward: '',
        reason: '',
        admissions: [{ name: '', amount: 0 }],
      });
    }
  }, [admission, isOpen]);

  // close dropdown on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (itemWrapperRef.current && !itemWrapperRef.current.contains(e.target)) {
        setItemDropdownIndex(null);
      }
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const payload = {
        patientId,
        dependantId,
        ward: data.ward,
        reason: data.reason,
        admissions: data.admissions,
        status: admission?.status || 'active',
      };

      let result;

      if (isEdit) {
        result = await updateAdmission(admission._id, payload);
        toast.success('Admission updated successfully');
      } else if (antenatalId) {
        result = await createAdmission(payload, antenatalId, 'antenatal');
        toast.success('Patient admitted successfully');
      } else {
        result = await createAdmission(payload, consultationId, 'consultation');
        toast.success('Patient admitted successfully');
      }

      const created = result?.data ?? result;

      reset();

      if (onAdmissionCreated) onAdmissionCreated(created);

      onClose();
    } catch (error) {
      console.error('Admission error:', error);

      toast.error(
        error.response?.data?.message || error.response?.data?.error || 'Failed to save admission'
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
              <FaHospital />
            </div>
            <h2 className="text-xl font-bold">
              {isEdit ? 'Edit Admission' : 'Admit Patient'}
            </h2>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FaTimes />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="admission-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* WARD */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Ward</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Male Medical Ward"
                className="input input-bordered w-full"
                {...register('ward')}
              />
              {errors.ward && (
                <span className="text-error text-sm">{errors.ward.message}</span>
              )}
            </div>

            {/* REASON */}
            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Reason for Admission</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                placeholder="Reason for admission (optional)"
                {...register('reason')}
              />
            </div>

            <div className="divider">Admission Items / Charges</div>

            {/* ITEMS LIST */}
            {fields.map((item, index) => (
              <div key={item.id} className="card bg-base-200/40">
                <div className="card-body p-4">
                  <div className="flex justify-between">
                    <span className="badge badge-outline">Item #{index + 1}</span>

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

                  <div className="form-control mt-2 relative" ref={itemWrapperRef}>
                    <input
                      type="text"
                      placeholder="Search admission item/charge..."
                      className="input input-bordered"
                      value={
                        itemDropdownIndex === index
                          ? itemSearch
                          : watch(`admissions.${index}.name`) || ''
                      }
                      onFocus={() => {
                        setItemDropdownIndex(index);
                        setItemSearch('');
                      }}
                      onChange={(e) => {
                        setItemSearch(e.target.value);
                        setItemDropdownIndex(index);
                      }}
                    />

                    {itemDropdownIndex === index && (
                      <div className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow max-h-60 overflow-auto">
                        {filteredItems.map((chargeItem) => (
                          <div
                            key={chargeItem.id}
                            className="px-4 py-2 cursor-pointer flex justify-between hover:bg-gray-100"
                            onClick={() => {
                              setValue(`admissions.${index}.name`, chargeItem.service);
                              setValue(`admissions.${index}.amount`, chargeItem.amount || 0);
                              setValue(`admissions.${index}.serviceChargeId`, chargeItem.id);
                              setItemDropdownIndex(null);
                              setItemSearch('');
                            }}
                          >
                            <span>{chargeItem.service}</span>
                            <span className="text-xs text-gray-500">
                              ₦{Number(chargeItem.amount).toLocaleString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {errors.admissions?.[index]?.name && (
                      <span className="text-error text-xs">
                        {errors.admissions[index].name.message}
                      </span>
                    )}
                  </div>

                  <div className="form-control mt-2">
                    <label className="label">
                      <span className="label-text text-xs">Amount (₦)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="input input-bordered input-sm"
                      {...register(`admissions.${index}.amount`)}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* ADD ITEM */}
            <button
              type="button"
              className="btn btn-outline btn-primary w-full"
              onClick={() => append({ name: '', amount: 0 })}
            >
              <FaPlus /> Add Another Item
            </button>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            type="submit"
            form="admission-form"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Admission' : 'Admit Patient'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdmissionModal;