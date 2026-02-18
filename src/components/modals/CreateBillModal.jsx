import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createBilling } from '@/services/api/billingAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';

// Form validation schema
const billItemSchema = yup.object({
  serviceChargeId: yup.string().required('Service item is required'),
  code: yup.string().required('Item code is required'),
  description: yup.string().required('Description is required'),
  quantity: yup.number().typeError('Must be a number').min(1, 'Min 1').required(),
  price: yup.number().typeError('Must be a number').min(0, 'Min 0').required(),
});

const billingSchema = yup.object({
  items: yup.array().of(billItemSchema).min(1, 'At least one item is required'),
});

const CreateBillModal = ({ isOpen, onClose, patientId, onSuccess, defaultItems = [] }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [services, setServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm({
    resolver: yupResolver(billingSchema),
    defaultValues: {
      items: [{ serviceChargeId: '', code: '', description: '', quantity: 1, price: 0 }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items"
  });

  // Load service charges
  useEffect(() => {
    if (isOpen) {
      const loadServices = async () => {
        try {
          setLoadingServices(true);
          const res = await getServiceCharges();
          const list = res?.data ?? res ?? [];
          setServices(Array.isArray(list) ? list : []);
        } catch (error) {
          console.error("Failed to load service charges", error);
          toast.error("Could not load service list");
        } finally {
          setLoadingServices(false);
        }
      };
      loadServices();
    }
  }, [isOpen]);

  // Watch items to calculate totals dynamically
  const items = watch("items");
  const grandTotal = items?.reduce((sum, item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.price) || 0;
    return sum + (qty * price);
  }, 0) || 0;

  // Handle service selection change
  const handleServiceChange = (index, e) => {
    const selectedId = e.target.value;
    const service = services.find(s => s._id === selectedId || s.id === selectedId);

    if (service) {
      setValue(`items.${index}.serviceChargeId`, selectedId);
      // Map 'category' to 'code' as requested by user
      setValue(`items.${index}.code`, service.category || service.code || 'SVC');
      // Map 'service' to 'description' as requested by user
      setValue(`items.${index}.description`, service.service || service.name || service.description || '');
      setValue(`items.${index}.price`, Number(service.amount || service.price || 0));
      // Reset quantity to 1 on new selection
      setValue(`items.${index}.quantity`, 1);
    }
  };

  // Pre-fill default items if provided when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (defaultItems.length > 0) {
      reset({
        items: defaultItems.map(d => ({
          serviceChargeId: d.serviceChargeId || '',
          code: d.code || '',
          description: d.description || '',
          quantity: d.quantity || 1,
          price: d.price || 0
        }))
      });
    } else {
      reset({
        items: [
          { serviceChargeId: '', code: '', description: '', quantity: 1, price: 0 }
        ]
      });
    }
  }, [isOpen]);


  const onSubmit = async (data) => {
    if (!patientId) {
      toast.error("Patient ID is missing");
      return;
    }

    setIsLoading(true);
    try {
      // Format payload to match API requirement: { itemDetail: [...] }
      const payload = {
        itemDetail: data.items.map(item => ({
          code: item.code,
          description: item.description,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.quantity) * Number(item.price),
          serviceChargeId: item.serviceChargeId
        }))
      };

      await createBilling(patientId, payload);
      toast.success('Bill created successfully! Sent to Cashier.');

      reset();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating bill:', error);
      toast.error(error.response?.data?.message || 'Failed to create bill');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-base-100 rounded-xl shadow-2xl overflow-hidden border border-base-200 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaMoneyBillWave className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">Create Bill</h2>
              <p className="text-xs text-base-content/60">Select services to bill the patient</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-base-200">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="create-bill-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            <div className="overflow-x-auto border border-base-200 rounded-lg">
              <table className="table table-sm w-full">
                <thead className="bg-base-200/50">
                  <tr>
                    <th className="w-1/3">Service Item</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th className="w-20 text-center">Qty</th>
                    <th className="w-32 text-right">Price</th>
                    <th className="w-32 text-right">Total</th>
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((item, index) => {
                    const qty = Number(items[index]?.quantity) || 0;
                    const price = Number(items[index]?.price) || 0;
                    const lineTotal = qty * price;

                    return (
                      <tr key={item.id} className="hover:bg-base-50/50">
                        <td className="align-top p-2">
                          <select
                            className={`select select-bordered select-sm w-full ${errors.items?.[index]?.serviceChargeId ? 'select-error' : ''}`}
                            {...register(`items.${index}.serviceChargeId`)}
                            onChange={(e) => {
                              register(`items.${index}.serviceChargeId`).onChange(e);
                              handleServiceChange(index, e);
                            }}
                          >
                            <option value="">Select Service...</option>
                            {services.map(s => (
                              <option key={s._id || s.id} value={s._id || s.id}>
                                {s.service || s.name} ({s.category || s.code}) - ₦{s.amount || s.price}
                              </option>
                            ))}
                          </select>
                          {loadingServices && <span className="text-xs text-base-content/50 ml-1">Loading...</span>}
                        </td>
                        <td className="align-top p-2">
                          <input
                            type="text"
                            readOnly
                            className="input input-bordered input-sm w-full bg-base-200/50"
                            {...register(`items.${index}.code`)}
                          />
                        </td>
                        <td className="align-top p-2">
                          <input
                            type="text"
                            readOnly
                            className="input input-bordered input-sm w-full bg-base-200/50"
                            {...register(`items.${index}.description`)}
                          />
                        </td>
                        <td className="align-top p-2">
                          <input
                            type="number"
                            min="1"
                            className={`input input-bordered input-sm w-full text-center ${errors.items?.[index]?.quantity ? 'input-error' : ''}`}
                            {...register(`items.${index}.quantity`)}
                          />
                        </td>
                        <td className="align-top p-2">
                          <input
                            type="number"
                            readOnly
                            className="input input-bordered input-sm w-full text-right bg-base-200/50"
                            {...register(`items.${index}.price`)}
                          />
                        </td>
                        <td className="align-top p-2 text-right font-medium text-base-content/70 pt-3">
                          {lineTotal.toLocaleString()}
                        </td>
                        <td className="align-top p-2 text-center">
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="btn btn-ghost btn-xs text-error hover:bg-error/10"
                              title="Remove item"
                            >
                              <FaTrash />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>


          </form>
          <button
            type="button"
            className="btn btn-outline btn-primary btn-sm w-full border-dashed gap-2"
            onClick={(e) => {e.preventDefault(); append({ serviceChargeId: '', code: '', description: '', quantity: 1, price: 0 })}}
          >
            <FaPlus className="w-3 h-3" /> Add Another Item
          </button>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-base-200 bg-base-50 flex justify-between items-center">
          <div className="text-right">
             <span className="text-sm text-base-content/60 block">Grand Total</span>
             <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
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
              form="create-bill-form"
              className="btn btn-primary px-8"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                <>Submit Bill</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBillModal;