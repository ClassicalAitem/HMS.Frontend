import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createBilling } from '@/services/api/billingAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';

// Form validation schema
const billItemSchema = yup.object({
  serviceChargeId: yup.string().nullable().optional(), // Allow empty for pre-filled items
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
      items: [{ serviceChargeId: null, code: '', description: '', quantity: 1, price: 0 }]
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
          console.log('CreateBillModal: Service charges response:', res);
          
          // Handle different response formats
          let list = [];
          if (Array.isArray(res)) {
            list = res;
          } else if (res?.data) {
            if (Array.isArray(res.data)) {
              list = res.data;
            } else if (Array.isArray(res.data.data)) {
              list = res.data.data;
            } else if (res.data) {
              list = [res.data];
            }
          }
          
          console.log('CreateBillModal: Processed services list:', list);
          setServices(Array.isArray(list) ? list : []);
        } catch (error) {
          console.error("Failed to load service charges", error);
          toast.error("Could not load service list");
          setServices([]);
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
    if (!selectedId) {
      console.log('CreateBillModal: No service selected');
      return;
    }

    const service = services?.find(s => {
      const serviceId = s._id || s.id;
      return serviceId === selectedId || String(serviceId) === String(selectedId);
    });

    console.log('CreateBillModal: Selected service:', { selectedId, service });

    if (service) {
      const code = service.category || service.code || service.serviceCode || 'SVC';
      const description = service.service || service.name || service.description || '';
      const price = Number(service.amount || service.price || 0);

      console.log('CreateBillModal: Setting values:', { code, description, price });

      setValue(`items.${index}.code`, code);
      setValue(`items.${index}.description`, description);
      setValue(`items.${index}.price`, price);
      setValue(`items.${index}.quantity`, 1);
    } else {
      console.warn('CreateBillModal: Service not found for ID:', selectedId);
      toast.error('Service not found. Please select again.');
    }
  };

  // Pre-fill default items if provided when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (defaultItems && defaultItems.length > 0) {
      reset({
        items: defaultItems.map(d => ({
          serviceChargeId: d.serviceChargeId || null,
          code: d.code || '',
          description: d.description || '',
          quantity: d.quantity || 1,
          price: d.price || 0,
          isAuto: true
        }))
      });
    } else {
      reset({
        items: [
          { serviceChargeId: null, code: '', description: '', quantity: 1, price: 0 }
        ]
      });
    }
  }, [isOpen]); // Only depend on isOpen, not reset


  const onSubmit = async (data) => {
    if (!patientId) {
      toast.error("Patient ID is missing");
      return;
    }

    setIsLoading(true);
    try {
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

  console.log("FORM SUBMITTED", data);

      await createBilling(patientId, payload);
      toast.success('Bill created successfully!');

      // Update patient status to awaiting cashier so incoming list removes the patient
      try {
        const statusPromise = updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_CASHIER });
        await toast.promise(statusPromise, {
          loading: 'Updating patient status...',
          success: 'Patient sent to cashier',
          error: (err) => err?.response?.data?.message || 'Failed to update patient status',
        });
      } catch (err) {
        console.error('CreateBillModal: failed updating patient status', err);
      }

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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

          {/* Validation Errors */}
          {Object.keys(errors).length > 0 && (
            <div className="alert alert-error">
              <div>
                <span className="font-semibold">Please fix the following errors:</span>
                <ul className="list-disc list-inside mt-2">
                  {Object.entries(errors).map(([field, error]) => (
                    <li key={field} className="text-sm">
                      {error?.message || `Error in ${field}`}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

  {/* Table of items */}
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
                {items[index]?.isAuto ? (
                  <div className="text-sm font-medium pt-1">{items[index]?.description}</div>
                ) : (
                  <select
                    className={`select select-bordered select-sm w-full ${errors.items?.[index]?.serviceChargeId ? 'select-error' : ''}`}
                    value={items[index]?.serviceChargeId || ''}
                    {...register(`items.${index}.serviceChargeId`)}
                    onChange={(e) => {
                      register(`items.${index}.serviceChargeId`).onChange(e);
                      handleServiceChange(index, e);
                    }}
                    disabled={loadingServices}
                  >
                    <option value="">
                      {loadingServices ? 'Loading services...' : 'Select Service...'}
                    </option>
                    {services && services.length > 0 ? (
                      services.map(s => {
                        const serviceId = s._id || s.id;
                        const serviceName = s.service || s.name || s.description || 'Unknown';
                        const categoryCode = s.category || s.code || 'N/A';
                        const price = s.amount || s.price || 0;
                        
                        return (
                          <option key={serviceId} value={serviceId}>
                            {serviceName} ({categoryCode}) - ₦{Number(price).toLocaleString()}
                          </option>
                        );
                      })
                    ) : (
                      <option value="" disabled>
                        {loadingServices ? 'Loading...' : 'No services available'}
                      </option>
                    )}
                  </select>
                )}
              </td>

              <td>
                <input type="text" readOnly className="input input-bordered input-sm w-full bg-base-200/50"
                  {...register(`items.${index}.code`)} />
              </td>
              <td>
                <input type="text" readOnly className="input input-bordered input-sm w-full bg-base-200/50"
                  {...register(`items.${index}.description`)} />
              </td>
              <td>
                <input type="number" min="1" className={`input input-bordered input-sm w-full text-center ${errors.items?.[index]?.quantity ? 'input-error' : ''}`}
                  {...register(`items.${index}.quantity`)} />
              </td>
              <td>
                <input type="number" readOnly className="input input-bordered input-sm w-full text-right bg-base-200/50"
                  {...register(`items.${index}.price`)} />
              </td>
              <td className="text-right font-medium">{lineTotal.toLocaleString()}</td>
              <td className="text-center">
                {fields.length > 1 && (
                  <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-xs text-error hover:bg-error/10">
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

  {/* Add new item button */}
  <button
    type="button"
    className="btn btn-outline btn-primary btn-sm w-full border-dashed gap-2"
    onClick={() => append({ serviceChargeId: null, code: '', description: '', quantity: 1, price: 0, isAuto: false })}
  >
    <FaPlus className="w-3 h-3" /> Add Another Item
  </button>

  {/* Footer */}
  <div className="p-5 border-t border-base-200 bg-base-50 flex justify-between items-center">
    <div className="text-right">
      <span className="text-sm text-base-content/60 block">Grand Total</span>
      <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
    </div>
    <div className="flex gap-3">
      <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
      <button type="submit" className="btn btn-primary px-8" disabled={isLoading}>
        {isLoading ? <span className="loading loading-spinner loading-sm"></span> : <>Submit Bill</>}
      </button>
    </div>
  </div>

</form>
        </div>
      </div>
    </div>
  );
};

export default CreateBillModal;