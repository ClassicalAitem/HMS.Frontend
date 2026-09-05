import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaPlus, FaMoneyBillWave, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { createBilling } from '@/services/api/billingAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { updateSubjectStatus } from '@/utils/statusHelper';
import { SERVICE_CHARGE_CATEGORY } from '@/constants/cardTypes';

import { getInvestigationByPatientId } from '@/services/api/investigationRequestAPI';
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import { getAllAppointments } from '@/services/api/appointmentsAPI';

const billItemSchema = yup.object({
  serviceChargeId: yup.string().nullable().optional(),
  investigationId: yup.string().nullable().optional(),
  prescriptionId: yup.string().nullable().optional(),
  admissionId: yup.string().nullable().optional(),
  appointmentId: yup.string().nullable().optional(),
  procedureId: yup.string().nullable().optional(),
  code: yup.string().required('Item code is required'),
  description: yup.string().required('Description is required'),
  quantity: yup.number().typeError('Must be a number').min(1, 'Min 1').required(),
  price: yup.number().typeError('Must be a number').min(0, 'Min 0').required(),
});

const billingSchema = yup.object({
  items: yup.array().of(billItemSchema).min(1, 'At least one item is required'),
});

// ─── Searchable Service Dropdown ─────────────────────────────────────────────
const ServiceSearchInput = ({ index, services, loadingServices, value, onSelect, error }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedService = services.find(s => (s._id || s.id) === value);
  const availabilityText = selectedService ? (selectedService.isBillable !== false ? 'Available' : 'Unavailable') : '';
  const displayValue = open
    ? search
    : selectedService
      ? `${selectedService.service || selectedService.name}`
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
                const isBillable = s.isBillable !== false;
                const availabilityBadge = isBillable ? 'Available' : 'Unavailable';
                return (
                  <li
                    key={id}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      onSelect(id, s);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{name}</span>
                      <span className={`text-xs ${ isBillable ? 'text-green-600' : 'text-error' }`}>
                        {availabilityBadge}
                      </span>
                    </div>
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

// ─── Main Modal ───────────────────────────────────────────────────────────────
const CreateBillModal = ({
  isOpen,
  onClose,
  patientId,
  dependantId,
  onSuccess,
  defaultItems = [],
  admissionId = null,
  consultationId = null,
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

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (!isOpen) return;
    const loadServices = async () => {
      try {
        setLoadingServices(true);
        const res = await getServiceCharges();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setServices(list);
      } catch {
        toast.error("Could not load service list");
      } finally {
        setLoadingServices(false);
      }
    };
    loadServices();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (defaultItems?.length > 0) {
      reset({
        items: defaultItems.map(d => {
          const isUnavailable = d.availability === 'unavailable';
          const isOutOfStock = d.insufficientStock === true || (d.availability === 'available' && Number(d.stock) <= 0);
          const isUnbillable = isUnavailable || isOutOfStock;

          return {
            serviceChargeId: d.serviceChargeId || null,
            investigationId: d.investigationId || null,
            prescriptionId: d.prescriptionId || null,
            admissionId: d.admissionId || null,
            appointmentId: d.appointmentId || d.procedureId || null,
            procedureId: d.procedureId || d.appointmentId || null,
            code: d.code || '',
            description: d.description || '',
            quantity: d.quantity || 1,
            price: isUnbillable ? 0 : (d.price || 0),
            isAuto: true,
            isUnavailable,
            isOutOfStock,
          };
        })
      });
      return;
    }

    if (patientId) {
      let isSubscribed = true;
      const loadUnbilledItems = async () => {
        try {
          const [invRes, presRes, admRes, apptRes, scRes] = await Promise.allSettled([
            getInvestigationByPatientId(patientId),
            getPrescriptionByPatientId(patientId),
            getAdmissionByPatientId(patientId),
            getAllAppointments(),
            getServiceCharges(),
          ]);

          if (!isSubscribed) return;

          const rawSc = scRes.status === 'fulfilled' ? (scRes.value?.data ?? scRes.value ?? []) : [];
          const scList = Array.isArray(rawSc) ? rawSc : (rawSc?.data ?? []);

          const findCharge = (name, id) => {
            if (id) {
              const byId = scList.find(c => (c.id || c._id) === id);
              if (byId) return byId;
            }
            if (!name) return null;
            const norm = String(name).toLowerCase().trim();
            return scList.find(c => {
              const cName = String(c.service || c.name || '').toLowerCase().trim();
              return cName === norm || cName.includes(norm) || norm.includes(cName);
            });
          };

          const autoItems = [];

          // 1. Lab investigations
          if (invRes.status === 'fulfilled') {
            const rawInv = invRes.value?.data ?? invRes.value ?? [];
            const invList = Array.isArray(rawInv) ? rawInv : (rawInv?.data ? (Array.isArray(rawInv.data) ? rawInv.data : [rawInv.data]) : []);
            const filteredInv = invList.filter(inv => {
              if (dependantId) return String(inv.dependantId || '') === String(dependantId);
              return !inv.dependantId;
            }).filter(inv => !inv.isBilled && !inv.billId && String(inv.status || '').toLowerCase() !== 'cancelled')
            .filter(inv => {
              if (consultationId) {
                const invCId = inv.consultationId || inv.consultation?._id || inv.consultation?.id || inv.consultation;
                const invAId = inv.admissionId || inv.admission?._id || inv.admission?.id || inv.admission;
                return String(invCId || '') === String(consultationId) || (admissionId && String(invAId || '') === String(admissionId));
              }
              return true;
            });

            filteredInv.forEach(inv => {
              const tests = Array.isArray(inv.tests) ? inv.tests : [];
              if (tests.length === 0) {
                const charge = findCharge(inv.type, inv.serviceChargeId);
                autoItems.push({
                  serviceChargeId: inv.serviceChargeId || charge?.id || charge?._id || null,
                  investigationId: inv._id || inv.id,
                  prescriptionId: null,
                  admissionId: null,
                  appointmentId: null,
                  procedureId: null,
                  code: 'LAB',
                  description: inv.type || 'Lab Investigation',
                  quantity: 1,
                  price: Number(charge?.amount || charge?.price || 0),
                  isAuto: true,
                });
              } else {
                tests.forEach(test => {
                  const testName = typeof test === 'string' ? test : (test?.name || test?.code || '');
                  const charge = findCharge(testName, test?.serviceChargeId || inv.serviceChargeId);
                  autoItems.push({
                    serviceChargeId: test?.serviceChargeId || inv.serviceChargeId || charge?.id || charge?._id || null,
                    investigationId: inv._id || inv.id,
                    prescriptionId: null,
                    admissionId: null,
                    appointmentId: null,
                    procedureId: null,
                    code: 'LAB',
                    description: testName || 'Lab Test',
                    quantity: 1,
                    price: Number(test?.price || charge?.amount || charge?.price || 0),
                    isAuto: true,
                  });
                });
              }
            });
          }

          // 2. Prescriptions
          if (presRes.status === 'fulfilled') {
            const rawPres = presRes.value?.data ?? presRes.value ?? [];
            const presList = Array.isArray(rawPres) ? rawPres : (rawPres?.data ? (Array.isArray(rawPres.data) ? rawPres.data : [rawPres.data]) : []);
            const filteredPres = presList.filter(p => {
              if (dependantId) return String(p.dependantId || '') === String(dependantId);
              return !p.dependantId;
            }).filter(p => !p.isBilled && !p.billId && String(p.status || '').toLowerCase() !== 'cancelled')
            .filter(p => {
              if (consultationId) {
                const pCId = p.consultationId || p.consultation?._id || p.consultation?.id || p.consultation;
                const pAId = p.admissionId || p.admission?._id || p.admission?.id || p.admission;
                return String(pCId || '') === String(consultationId) || (admissionId && String(pAId || '') === String(admissionId));
              }
              return true;
            });

            filteredPres.forEach(p => {
              const meds = Array.isArray(p.medications) ? p.medications : [];
              meds.forEach(m => {
                const isUnavailable = m.availability === 'unavailable';
                autoItems.push({
                  serviceChargeId: p.serviceChargeId || m.serviceChargeId || null,
                  investigationId: null,
                  prescriptionId: p._id || p.id,
                  admissionId: null,
                  appointmentId: null,
                  procedureId: null,
                  code: 'PRESCRIPTION',
                  description: `${m.drugName || 'Medication'} (${m.dosage || ''})`,
                  quantity: Number(m.billedQuantity || m.prescribedQuantity || 1),
                  price: isUnavailable ? 0 : Number(m.unitPrice || m.price || 0),
                  isAuto: true,
                  isUnavailable,
                });
              });
            });
          }

          // 3. Admissions
          if (admRes.status === 'fulfilled') {
            const rawAdm = admRes.value?.data ?? admRes.value ?? [];
            const admList = Array.isArray(rawAdm) ? rawAdm : (rawAdm?.data ? (Array.isArray(rawAdm.data) ? rawAdm.data : [rawAdm.data]) : []);
            const filteredAdm = admList.filter(a => {
              if (dependantId) return String(a.dependantId || '') === String(dependantId);
              return !a.dependantId;
            }).filter(a => !a.isBilled && !a.billId && String(a.status || '').toLowerCase() !== 'cancelled')
            .filter(a => {
              if (admissionId) {
                return String(a._id || a.id) === String(admissionId);
              }
              if (consultationId) {
                const aCId = a.consultationId || a.consultation?._id || a.consultation?.id || a.consultation;
                return String(aCId || '') === String(consultationId);
              }
              return true;
            });

            filteredAdm.forEach(a => {
              const items = Array.isArray(a.admissions) ? a.admissions : [];
              if (items.length === 0) {
                autoItems.push({
                  serviceChargeId: a.serviceChargeId || null,
                  investigationId: null,
                  prescriptionId: null,
                  admissionId: a._id || a.id,
                  appointmentId: null,
                  procedureId: null,
                  code: 'ADMISSION',
                  description: a.ward || 'Admission',
                  quantity: 1,
                  price: 0,
                  isAuto: true,
                });
              } else {
                items.forEach(item => {
                  autoItems.push({
                    serviceChargeId: item.serviceChargeId || null,
                    investigationId: null,
                    prescriptionId: null,
                    admissionId: a._id || a.id,
                    appointmentId: null,
                    procedureId: null,
                    code: 'ADMISSION',
                    description: item.name || a.ward || 'Admission Item',
                    quantity: 1,
                    price: Number(item.amount || 0),
                    isAuto: true,
                  });
                });
              }
            });
          }

          // 4. Procedures / Surgical Appointments
          if (apptRes.status === 'fulfilled') {
            const rawAppts = apptRes.value?.data?.data ?? apptRes.value?.data ?? [];
            const apptList = Array.isArray(rawAppts) ? rawAppts : (rawAppts.appointments ?? []);
            const targetPid = String(patientId);
            const targetDepId = dependantId ? String(dependantId) : null;

            const surgicalAppts = apptList.filter(a => {
              const isSurg = (a.appointmentType || '').toLowerCase() === 'surgery';
              if (!isSurg) return false;
              if (targetDepId) {
                return String(a.dependantId || '') === targetDepId;
              }
              return String(a.patientId || '') === targetPid && !a.dependantId;
            }).filter(a => !a.isBilled && !a.billId && String(a.status || '').toLowerCase() !== 'cancelled')
            .filter(a => {
              if (consultationId) {
                const aCId = a.consultationId || a.consultation?._id || a.consultation?.id || a.consultation;
                return String(aCId || '') === String(consultationId);
              }
              return true;
            });

            surgicalAppts.forEach(proc => {
              const charge = findCharge(proc.procedureName, proc.serviceChargeId);
              autoItems.push({
                serviceChargeId: proc.serviceChargeId || charge?.id || charge?._id || null,
                investigationId: null,
                prescriptionId: null,
                admissionId: null,
                appointmentId: proc.id || proc._id || null,
                procedureId: proc.id || proc._id || null,
                code: 'SURGERY',
                description: proc.procedureName || 'Surgical Procedure',
                quantity: 1,
                price: Number(proc.price || charge?.amount || charge?.price || 0),
                isAuto: true,
              });
            });
          }

          if (autoItems.length > 0) {
            reset({ items: autoItems });
          } else {
            reset({ items: [{ serviceChargeId: null, investigationId: null, prescriptionId: null, admissionId: null, appointmentId: null, procedureId: null, code: '', description: '', quantity: 1, price: 0 }] });
          }
        } catch (err) {
          console.error('Error auto-loading unbilled items:', err);
          reset({ items: [{ serviceChargeId: null, investigationId: null, prescriptionId: null, admissionId: null, appointmentId: null, procedureId: null, code: '', description: '', quantity: 1, price: 0 }] });
        }
      };

      loadUnbilledItems();
      return () => { isSubscribed = false; };
    }

    reset({ items: [{ serviceChargeId: null, investigationId: null, prescriptionId: null, admissionId: null, appointmentId: null, procedureId: null, code: '', description: '', quantity: 1, price: 0 }] });
  }, [isOpen, defaultItems, patientId, dependantId, admissionId, consultationId, reset]);

  const items = watch("items");

  const grandTotal = items?.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.price) || 0);
  }, 0) || 0;

  const handleServiceSelect = (index, serviceId, service) => {
    setValue(`items.${index}.serviceChargeId`, serviceId);
    setValue(`items.${index}.code`, service.category || service.code || 'SVC');
    setValue(`items.${index}.description`, service.service || service.name || '');
    setValue(`items.${index}.price`, Number(service.amount || service.price || 0));
    setValue(`items.${index}.quantity`, 1);
  };

  const onSubmit = async (data) => {
    if (!patientId) { toast.error("Patient ID is missing"); return; }
    setIsLoading(true);
    try {
      const payload = {
        itemDetail: data.items.map(item => ({
          code: item.code,
          description: item.description,
          quantity: Number(item.quantity),
          price: Number(item.price),
          total: Number(item.quantity) * Number(item.price),
          serviceChargeId: item.serviceChargeId || undefined,
          investigationId: item.investigationId || undefined,
          prescriptionId: item.prescriptionId || undefined,
          admissionId: item.admissionId || undefined,
          appointmentId: item.appointmentId || item.procedureId || undefined,
        })),
        ...(dependantId && { dependantId }),
      };

      await createBilling(patientId, payload);

      try {
        await updateSubjectStatus(patientId, dependantId, PATIENT_STATUS.AWAITING_CASHIER);
        toast.success(dependantId ? 'Dependant sent to cashier' : 'Patient sent to cashier');
      } catch (err) {
        console.log(err);
        toast.error('Failed to update patient status!');
      }
      toast.success('Bill created successfully!');
      reset();
      if (onSuccess) onSuccess();
      
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create bill'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full h-full sm:h-auto sm:max-w-4xl bg-base-100 sm:rounded-xl shadow-2xl overflow-hidden border-0 sm:border border-base-200 flex flex-col max-h-full sm:max-h-[90vh]">

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-base-200 flex justify-between items-center bg-base-50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-primary/10 p-2 rounded-full text-primary shrink-0">
              <FaMoneyBillWave className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-base-content truncate">Create Bill</h2>
              <p className="text-xs text-base-content/60">Select services to bill the patient</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm text-base-content/60 hover:bg-base-200 shrink-0">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

            {Object.keys(errors).length > 0 && (
              <div className="alert alert-error text-sm">
                Please fix the errors before submitting.
              </div>
            )}

            {/* Desktop / tablet table */}
            <div className="hidden sm:block border border-base-200 rounded-lg overflow-visible">
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
                    const isUnavailable = items[index]?.isUnavailable;
                    const isOutOfStock = items[index]?.isOutOfStock;


                    return (
                      <tr key={item.id} className="hover:bg-base-50/50">
                        <td className="align-top p-2">
                          {items[index]?.isAuto ? (
                             <div className="pt-1">
                            <div className="text-sm font-medium">{items[index]?.description}</div>
                            {isUnavailable && (
                              <span className="badge badge-warning badge-xs mt-1">Unavailable — sourced externally</span>
                            )}
                            {isOutOfStock && (
                              <span className="badge badge-error badge-xs mt-1">Out of stock</span>
                            )}
                          </div>
                          ) : (
                            <ServiceSearchInput
                              index={index}
                              services={services}
                              loadingServices={loadingServices}
                              value={items[index]?.serviceChargeId || ''}
                              onSelect={(id, svc) => handleServiceSelect(index, id, svc)}
                              error={errors.items?.[index]?.serviceChargeId}
                            />
                          )}
                        </td>
                        <td>
                          <input type="text" readOnly
                            className="input input-bordered input-sm w-full bg-base-200/50"
                            {...register(`items.${index}.code`)} />
                        </td>
                        <td>
                          <input type="text" readOnly
                            className="input input-bordered input-sm w-full bg-base-200/50"
                            {...register(`items.${index}.description`)} />
                        </td>
                        <td>
                           <input type="number" min="1"
                             readOnly={isUnavailable || isOutOfStock}
                            className={`input input-bordered input-sm w-full text-center ${errors.items?.[index]?.quantity ? 'input-error' : ''}`}
                            {...register(`items.${index}.quantity`)} />
                        </td>
                        <td>
                         <input type="number" readOnly
                            className={`input input-bordered input-sm w-full text-right bg-base-200/50 ${isUnavailable || isOutOfStock ? 'text-error' : ''}`}
                             {...register(`items.${index}.price`)} />
                        </td>
                         <td className={`text-right font-medium ${isUnavailable || isOutOfStock ? 'text-error' : ''}`}>
                         ₦{lineTotal.toLocaleString()}
                       </td>
                        <td className="text-center">
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(index)}
                              className="btn btn-ghost btn-xs text-error hover:bg-error/10">
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

            {/* Mobile item cards */}
            <div className="sm:hidden space-y-3">
              {fields.map((item, index) => {
                const qty = Number(items[index]?.quantity) || 0;
                const price = Number(items[index]?.price) || 0;
                const lineTotal = qty * price;
                 const isUnavailable = items[index]?.isUnavailable;
                const isOutOfStock = items[index]?.isOutOfStock;


                return (
                  <div key={item.id} className="border border-base-200 rounded-lg p-3 space-y-3 relative">
                    {fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 absolute top-2 right-2"
                      >
                        <FaTrash />
                      </button>
                    )}

                    <div className="pr-8">
                      <label className="text-xs text-base-content/60 mb-1 block">Service Item</label>
                      {items[index]?.isAuto ? (
                        <div>
                        <div className="text-sm font-medium">{items[index]?.description}</div>
                        {isUnavailable && (
                          <span className="badge badge-warning badge-xs mt-1">Unavailable — sourced externally</span>
                        )}
                        {isOutOfStock && (
                          <span className="badge badge-error badge-xs mt-1">Out of stock</span>
                        )}
                      </div>
                      ) : (
                        <ServiceSearchInput
                          index={index}
                          services={services}
                          loadingServices={loadingServices}
                          value={items[index]?.serviceChargeId || ''}
                          onSelect={(id, svc) => handleServiceSelect(index, id, svc)}
                          error={errors.items?.[index]?.serviceChargeId}
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-base-content/60 mb-1 block">Code</label>
                        <input type="text" readOnly
                          className="input input-bordered input-sm w-full bg-base-200/50"
                          {...register(`items.${index}.code`)} />
                      </div>
                      <div>
                        <label className="text-xs text-base-content/60 mb-1 block">Qty</label>
                       <input type="number" min="1"
                           readOnly={isUnavailable || isOutOfStock}
                          {...register(`items.${index}.quantity`)} />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-base-content/60 mb-1 block">Description</label>
                      <input type="text" readOnly
                        className="input input-bordered input-sm w-full bg-base-200/50"
                        {...register(`items.${index}.description`)} />
                    </div>

                    <div className="flex items-center justify-between text-sm pt-1">
                      <div>
                        <span className="text-xs text-base-content/60 block">Price</span>
                           <span className={`font-semibold ${isUnavailable || isOutOfStock ? 'text-error' : ''}`}>₦{lineTotal.toLocaleString()}</span>
                      
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-base-content/60 block">Total</span>
                        <span className={`font-semibold ${isUnavailable || isOutOfStock ? 'text-error' : ''}`}>₦{lineTotal.toLocaleString()}</span>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add item button */}
            <button
              type="button"
              className="btn btn-outline btn-primary btn-sm w-full border-dashed gap-2"
              onClick={() => append({ serviceChargeId: null, code: '', description: '', quantity: 1, price: 0, isAuto: false })}
            >
              <FaPlus className="w-3 h-3" /> Add Another Item
            </button>

            {/* Footer */}
            <div className="pt-4 border-t border-base-200 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div>
                <span className="text-sm text-base-content/60 block">Grand Total</span>
                <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
              </div>
              <div className="flex gap-3">
                <button type="button" className="btn btn-ghost flex-1 sm:flex-none" onClick={onClose} disabled={isLoading}>Cancel</button>
                <button type="submit" className="btn btn-primary flex-1 sm:flex-none px-8" disabled={isLoading}>
                  {isLoading ? <span className="loading loading-spinner loading-sm"></span> : 'Submit Bill'}
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