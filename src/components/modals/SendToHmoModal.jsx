import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { FaUserMd, FaPlus, FaTrash, FaMoneyBillWave } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createBilling } from '@/services/api/billingAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { updatePatientStatus } from '@/services/api/patientsAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';

const billItemSchema = yup.object({
  serviceChargeId: yup.string().nullable().optional(),
  code: yup.string().required('Item code is required'),
  description: yup.string().required('Description is required'),
  quantity: yup.number().typeError('Must be a number').min(1, 'Min 1').required(),
  price: yup.number().typeError('Must be a number').min(0, 'Min 0').required(),
});

const billingSchema = yup.object({
  items: yup.array().of(billItemSchema).min(1, 'At least one item is required'),
});

const ServiceSearchInput = ({ index, services, loadingServices, value, onSelect, error }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedService = services.find(s => (s._id || s.id) === value);
  const displayValue = open
    ? search
    : selectedService
      ? `${selectedService.service || selectedService.name} — ₦${Number(selectedService.amount || selectedService.price || 0).toLocaleString()}`
      : '';

  const filtered = services.filter(s => {
    if (!search) return true;
    const name = (s.service || s.name || '').toLowerCase();
    const cat = (s.category || '').toLowerCase();
    return name.includes(search.toLowerCase()) || cat.includes(search.toLowerCase());
  });

  const openDropdown = () => {
    if (!inputRef.current) return;
    const rect = inputRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
    setSearch('');
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        className={`input input-bordered input-sm w-full ${error ? 'input-error' : ''}`}
        placeholder={loadingServices ? 'Loading services...' : 'Search service...'}
        value={displayValue}
        onFocus={openDropdown}
        onChange={(e) => {
          setSearch(e.target.value);
          if (!open) openDropdown();
        }}
        disabled={loadingServices}
        autoComplete="off"
        readOnly={!open}
      />

      {open && (
        <div style={dropdownStyle} className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-sm">No matches found</div>
          ) : (
            <ul className="py-1">
              {filtered.map(s => {
                const id = s._id || s.id;
                const name = s.service || s.name || 'Unknown';
                const cat = s.category || 'N/A';
                const price = Number(s.amount || s.price || 0);
                return (
                  <li
                    key={id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-700 flex justify-between items-center"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(id, s);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-gray-400 text-xs ml-2">{cat} · ₦{price.toLocaleString()}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const SendToHmoModal = ({
  isOpen,
  onClose,
  patientId,
  patientName,
  doctorName,
  consultationDate,
  visitReason,
  diagnosis,
  defaultItems = [],
  onSentSuccessfully,
}) => {
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

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  // Load service charges
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      try {
        setLoadingServices(true);
        const res = await getServiceCharges();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        if (mounted) setServices(list);
      } catch {
        toast.error('Could not load service list');
      } finally {
        if (mounted) setLoadingServices(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [isOpen]);

  // Pre-fill default items when modal opens

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
          isAuto: true,
        }))
      });
    } else {
      reset({
        items: [{ serviceChargeId: null, code: '', description: '', quantity: 1, price: 0 }]
      });
    }
  }, [isOpen, defaultItems, reset]);

  const items = watch('items');
  const grandTotal = items?.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.price) || 0);
  }, 0) || 0;

  const handleServiceSelect = (index, serviceId, service) => {
    if (!service) return;
    setValue(`items.${index}.serviceChargeId`, serviceId);
    setValue(`items.${index}.code`, service.category || service.code || 'SVC');
    setValue(`items.${index}.description`, service.service || service.name || '');
    setValue(`items.${index}.price`, Number(service.amount || service.price || 0));
    setValue(`items.${index}.quantity`, 1);
  };

  const onSubmit = async (data) => {
    if (!patientId) return toast.error('Patient ID is missing');
    setIsLoading(true);
    try {
      // ✅ Create billing first
      const payload = {
        itemDetail: data.items.map(item => ({
          code: item.code,
          description: item.description,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.quantity) * Number(item.price),
          serviceChargeId: item.serviceChargeId,
        }))
      };

      await toast.promise(createBilling(patientId, payload), {
        loading: 'Creating HMO bill...',
        success: 'Bill created',
        error: (err) => err?.response?.data?.message || 'Failed to create bill',
      });

      // ✅ Then update status to awaiting_hmo instead of awaiting_cashier
      await toast.promise(
        updatePatientStatus(patientId, { status: PATIENT_STATUS.AWAITING_HMO }),
        {
          loading: 'Sending to HMO...',
          success: 'Patient sent to HMO successfully!',
          error: (err) => err?.response?.data?.message || 'Failed to update status',
        }
      );

      reset();
      if (onSentSuccessfully) onSentSuccessfully();
      onClose();
    } catch (error) {
      console.error('Error sending to HMO:', error);
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
            <div className="bg-secondary/10 p-2 rounded-full text-secondary">
              <FaUserMd className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">Send to HMO</h2>
              <p className="text-xs text-base-content/60">
                {patientName} · {consultationDate}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <IoIosCloseCircleOutline className="w-5 h-5" />
          </button>
        </div>


        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  {fields.map((field, index) => {
                    const qty = Number(items[index]?.quantity) || 0;
                    const price = Number(items[index]?.price) || 0;
                    const lineTotal = qty * price;
                    return (
                      <tr key={field.id} className="hover:bg-base-50/50">
                        <td className="align-top p-2">
                          {items[index]?.isAuto ? (
                            <div className="text-sm font-medium pt-1">{items[index]?.description}</div>
                          ) : (
                            <ServiceSearchInput
                              index={index}
                              services={services}
                              loadingServices={loadingServices}
                              value={items[index]?.serviceChargeId || ''}
                              onSelect={(serviceId, service) => handleServiceSelect(index, serviceId, service)}
                              error={errors.items?.[index]?.serviceChargeId}
                            />
                          )}
                        </td>
                        <td><input type="text" readOnly className="input input-bordered input-sm w-full bg-base-200/50" {...register(`items.${index}.code`)} /></td>
                        <td><input type="text" readOnly className="input input-bordered input-sm w-full bg-base-200/50" {...register(`items.${index}.description`)} /></td>
                        <td><input type="number" min="1" className="input input-bordered input-sm w-full text-center" {...register(`items.${index}.quantity`)} /></td>
                        <td><input type="number" readOnly className="input input-bordered input-sm w-full text-right bg-base-200/50" {...register(`items.${index}.price`)} /></td>
                        <td className="text-right font-medium">₦{lineTotal.toLocaleString()}</td>
                        <td className="text-center">
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(index)} className="btn btn-ghost btn-xs text-error">
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

            <button
              type="button"
              className="btn btn-outline btn-secondary btn-sm w-full border-dashed gap-2"
              onClick={() => append({ serviceChargeId: null, code: '', description: '', quantity: 1, price: 0, isAuto: false })}
            >
              <FaPlus className="w-3 h-3" /> Add Item
            </button>

            {/* Footer */}
            <div className="pt-4 border-t border-base-200 flex justify-between items-center">
              <div>
                <span className="text-sm text-base-content/60 block">Grand Total</span>
                <span className="text-2xl font-bold text-secondary">₦{grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
                <button type="submit" className="btn btn-secondary px-8" disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-sm" /> : 'Send to HMO'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SendToHmoModal;