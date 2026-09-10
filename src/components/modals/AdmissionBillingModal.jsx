import React, { useEffect, useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FaTimes, FaMoneyBillWave, FaShieldAlt } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { createBilling, getAllBillings } from '@/services/api/billingAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { PATIENT_STATUS } from '@/constants/patientStatus';
import { updateSubjectStatus } from '@/utils/statusHelper';
import { getInvestigationByPatientId } from '@/services/api/investigationRequestAPI';
import { getPrescriptionByPatientId } from '@/services/api/prescriptionsAPI';
import { getAdmissionByPatientId } from '@/services/api/admissionApi';
import { getAllAppointments } from '@/services/api/appointmentsAPI';
import { getIvFluidByPatient } from '@/services/api/ivFluidApi';
import { getBloodTransfusionsByPatient } from '@/services/api/bloodTransfusionApi';

const billItemSchema = yup.object({
  included: yup.boolean().default(false),
  serviceChargeId: yup.string().nullable().optional(),
  investigationId: yup.string().nullable().optional(),
  prescriptionId: yup.string().nullable().optional(),
  admissionId: yup.string().nullable().optional(),
  appointmentId: yup.string().nullable().optional(),
  procedureId: yup.string().nullable().optional(),
  ivFluidId: yup.string().nullable().optional(),
  bloodTransfusionId: yup.string().nullable().optional(),
  code: yup.string().required('Item code is required'),
  description: yup.string().required('Description is required'),
  quantity: yup.number().typeError('Must be a number').min(1, 'Min 1').required(),
  price: yup.number().optional(),
  amountToBill: yup.number().typeError('Must be a number').min(0, 'Min 0').required(),
  originalPrice: yup.number().optional(),
});

const billingSchema = yup.object({
  items: yup.array().of(billItemSchema),
});

const AdmissionBillingModal = ({
  isOpen,
  onClose,
  patientId,
  dependantId,
  onSuccess,
  admissionId = null,
  consultationId = null,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitTarget, setSubmitTarget] = useState(null);
  const [viewMode, setViewMode] = useState('pending'); // 'pending' | 'history'

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
      items: []
    }
  });

  const { fields } = useFieldArray({ control, name: "items" });

  useEffect(() => {
    if (!isOpen || !patientId) return;

    let isSubscribed = true;
    const loadUnbilledItems = async () => {
      try {
        setLoadingServices(true);
        const [invRes, presRes, admRes, apptRes, ivfRes, btRes, scRes, billingsRes] = await Promise.allSettled([
          getInvestigationByPatientId(patientId),
          getPrescriptionByPatientId(patientId),
          getAdmissionByPatientId(patientId),
          getAllAppointments(),
          getIvFluidByPatient(patientId),
          getBloodTransfusionsByPatient(patientId),
          getServiceCharges(),
          getAllBillings({ patientId })
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

        const rawBillings = billingsRes.status === 'fulfilled' ? (billingsRes.value?.data?.data || billingsRes.value?.data || []) : [];
        const billingsList = Array.isArray(rawBillings) ? rawBillings : [];

        const getPreviouslyBilled = (itemId, typeIdKey) => {
          if (!itemId) return { paid: 0, billed: 0 };
          return billingsList.reduce((acc, bill) => {
            if (!bill.itemDetails) return acc;
            const matches = bill.itemDetails.filter(i => String(i[typeIdKey]) === String(itemId));
            const sum = matches.reduce((s, i) => s + (Number(i.total) || 0), 0);
            if (bill.isCleared) {
              acc.paid += sum;
            } else {
              acc.billed += sum;
            }
            return acc;
          }, { paid: 0, billed: 0 });
        };

        const autoItems = [];

        // 1. Lab investigations
        if (invRes.status === 'fulfilled') {
          const rawInv = invRes.value?.data ?? invRes.value ?? [];
          const invList = Array.isArray(rawInv) ? rawInv : (rawInv?.data ? (Array.isArray(rawInv.data) ? rawInv.data : [rawInv.data]) : []);
          const filteredInv = invList.filter(inv => {
            if (dependantId) return String(inv.dependantId || '') === String(dependantId);
            return !inv.dependantId;
          }).filter(inv => !inv.isBilled && String(inv.status || '').toLowerCase() !== 'cancelled')
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
              const price = Number(charge?.amount || charge?.price || 0);
              autoItems.push({
                included: false,
                serviceChargeId: inv.serviceChargeId || charge?.id || charge?._id || null,
                investigationId: inv._id || inv.id,
                code: 'LAB',
                description: inv.type || 'Lab Investigation',
                quantity: 1,
                price: price,
                originalPrice: price,
                previouslyBilled: getPreviouslyBilled(inv._id || inv.id, 'investigationId'),
                isAuto: true,
              });
            } else {
              tests.forEach(test => {
                const testName = typeof test === 'string' ? test : (test?.name || test?.code || '');
                const charge = findCharge(testName, test?.serviceChargeId || inv.serviceChargeId);
                const price = Number(test?.price || charge?.amount || charge?.price || 0);
                autoItems.push({
                  included: false,
                  serviceChargeId: test?.serviceChargeId || inv.serviceChargeId || charge?.id || charge?._id || null,
                  investigationId: inv._id || inv.id,
                  code: 'LAB',
                  description: testName || 'Lab Test',
                  quantity: 1,
                  price: price,
                  originalPrice: price,
                  previouslyBilled: getPreviouslyBilled(inv._id || inv.id, 'investigationId'),
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
          }).filter(p => !p.isBilled && String(p.status || '').toLowerCase() !== 'cancelled')
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
              const price = isUnavailable ? 0 : Number(m.unitPrice || m.price || 0);
              autoItems.push({
                included: false,
                serviceChargeId: p.serviceChargeId || m.serviceChargeId || null,
                prescriptionId: p._id || p.id,
                code: 'PRESCRIPTION',
                description: `${m.drugName || 'Medication'} (${m.dosage || ''})`,
                quantity: Number(m.billedQuantity || m.prescribedQuantity || 1),
                price: price,
                originalPrice: price,
                previouslyBilled: getPreviouslyBilled(p._id || p.id, 'prescriptionId'),
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
          }).filter(a => !a.isBilled && String(a.status || '').toLowerCase() !== 'cancelled')
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
                included: false,
                serviceChargeId: a.serviceChargeId || null,
                admissionId: a._id || a.id,
                code: 'ADMISSION',
                description: a.ward || 'Admission',
                quantity: 1,
                price: 0,
                originalPrice: 0,
                previouslyBilled: getPreviouslyBilled(a._id || a.id, 'admissionId'),
                isAuto: true,
              });
            } else {
              items.forEach(item => {
                const price = Number(item.amount || 0);
                autoItems.push({
                  included: false,
                  serviceChargeId: item.serviceChargeId || null,
                  admissionId: a._id || a.id,
                  code: 'ADMISSION',
                  description: item.name || a.ward || 'Admission Item',
                  quantity: 1,
                  price: price,
                  originalPrice: price,
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
          }).filter(a => !a.isBilled && String(a.status || '').toLowerCase() !== 'cancelled')
          .filter(a => {
            if (consultationId) {
              const aCId = a.consultationId || a.consultation?._id || a.consultation?.id || a.consultation;
              return String(aCId || '') === String(consultationId);
            }
            return true;
          });

          surgicalAppts.forEach(proc => {
            const charge = findCharge(proc.procedureName, proc.serviceChargeId);
            const price = Number(proc.price || charge?.amount || charge?.price || 0);
            autoItems.push({
              included: false,
              serviceChargeId: proc.serviceChargeId || charge?.id || charge?._id || null,
              appointmentId: proc.id || proc._id || null,
              procedureId: proc.id || proc._id || null,
              code: 'SURGERY',
              description: proc.procedureName || 'Surgical Procedure',
              quantity: 1,
              price: price,
              originalPrice: price,
              previouslyBilled: getPreviouslyBilled(proc.id || proc._id, 'appointmentId') || getPreviouslyBilled(proc.id || proc._id, 'procedureId'),
              isAuto: true,
            });
          });
        }

        // 5. IV Fluids
        if (ivfRes.status === 'fulfilled') {
          const rawIvf = ivfRes.value?.data ?? ivfRes.value ?? {};
          const ivfList = Array.isArray(rawIvf.orders) ? rawIvf.orders : (Array.isArray(rawIvf.data?.orders) ? rawIvf.data.orders : []);
          const targetPid = String(patientId);
          const targetDepId = dependantId ? String(dependantId) : null;

          const pendingIvf = ivfList.filter(i => {
            if (targetDepId) return String(i.dependantId || '') === targetDepId;
            return String(i.patientId || '') === targetPid && !i.dependantId;
          }).filter(i => !i.isBilled && String(i.status || '').toLowerCase() !== 'cancelled')
          .filter(i => {
            if (consultationId) {
              const iCId = i.consultationId || i.consultation?._id || i.consultation?.id || i.consultation;
              return String(iCId || '') === String(consultationId);
            }
            return true;
          });

          pendingIvf.forEach(ivf => {
            const charge = findCharge(ivf.fluidName, ivf.serviceChargeId);
            const price = Number(ivf.totalAmount || charge?.amount || charge?.price || 0);
            autoItems.push({
              included: false,
              serviceChargeId: ivf.serviceChargeId || charge?.id || charge?._id || null,
              ivFluidId: ivf.id || ivf._id || null,
              code: 'IV-FLUID',
              description: ivf.fluidName || 'IV Fluid',
              quantity: Number(ivf.unitCount || 1),
              price: price,
              originalPrice: price,
              previouslyBilled: getPreviouslyBilled(ivf.id || ivf._id, 'ivFluidOrderId'),
              isAuto: true,
            });
          });
        }

        // 6. Blood Transfusions
        if (btRes.status === 'fulfilled') {
          const rawBt = btRes.value?.data ?? btRes.value ?? [];
          const btList = Array.isArray(rawBt) ? rawBt : (Array.isArray(rawBt?.data) ? rawBt.data : []);
          const targetPid = String(patientId);
          const targetDepId = dependantId ? String(dependantId) : null;

          const pendingBt = btList.filter(b => {
            if (targetDepId) return String(b.dependantId || '') === targetDepId;
            return String(b.patientId || '') === targetPid && !b.dependantId;
          }).filter(b => !b.isBilled && String(b.status || '').toLowerCase() !== 'cancelled')
          .filter(b => {
            if (consultationId) {
              const bCId = b.consultationId || b.consultation?._id || b.consultation?.id || b.consultation;
              return String(bCId || '') === String(consultationId);
            }
            return true;
          });

          pendingBt.forEach(bt => {
            // Need a display name, perhaps from blood group or service name
            const bgName = typeof bt.bloodGroup === 'object' ? bt.bloodGroup?.name : bt.bloodGroup;
            const desc = bgName ? `Blood Transfusion (${bgName})` : 'Blood Transfusion';
            const charge = findCharge(desc, bt.serviceChargeId);
            const price = Number(bt.amount || charge?.amount || charge?.price || 0);
            
            autoItems.push({
              included: false,
              serviceChargeId: bt.serviceChargeId || charge?.id || charge?._id || null,
              bloodTransfusionId: bt.id || bt._id || null,
              code: 'BLOOD-TRANSFUSION',
              description: desc,
              quantity: Number(bt.units || 1),
              price: price,
              originalPrice: price,
              previouslyBilled: getPreviouslyBilled(bt.id || bt._id, 'bloodTransfusionOrderId'),
              isAuto: true,
            });
          });
        }

        const formattedItems = autoItems.map(item => {
           const originalTotal = (Number(item.originalPrice) || 0) * (Number(item.quantity) || 1);
           const totalBilled = (Number(item.previouslyBilled?.paid) || 0) + (Number(item.previouslyBilled?.billed) || 0);
           const outstanding = originalTotal - totalBilled;
           return {
             ...item,
             outstanding: outstanding > 0 ? outstanding : 0,
             amountToBill: outstanding > 0 ? outstanding : 0,
             isFullyBilled: outstanding <= 0
           };
        });

        reset({ items: formattedItems });
      } catch (err) {
        console.error('Error auto-loading unbilled items:', err);
        reset({ items: [] });
      } finally {
        setLoadingServices(false);
      }
    };

    loadUnbilledItems();
    return () => { isSubscribed = false; };
  }, [isOpen, patientId, dependantId, admissionId, consultationId, reset]);

  const items = watch("items");

  const grandTotal = items?.reduce((sum, item) => {
    if (!item.included) return sum;
    return sum + (Number(item.amountToBill) || 0);
  }, 0) || 0;

  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    items.forEach((_, idx) => {
      setValue(`items.${idx}.included`, checked);
    });
  };

  const areAllSelected = items?.length > 0 && items.every(item => item.included);

  const onSubmit = async (data) => {
    if (!patientId) { toast.error("Patient ID is missing"); return; }
    
    const selectedItems = data.items.filter(item => item.included);
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item to bill.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        itemDetail: selectedItems.map(item => ({
          code: item.code,
          description: item.description,
          quantity: Number(item.quantity),
          price: Number(item.amountToBill) / (Number(item.quantity) || 1),
          total: Number(item.amountToBill),
          serviceChargeId: item.serviceChargeId || undefined,
          investigationId: item.investigationId || undefined,
          prescriptionId: item.prescriptionId || undefined,
          admissionId: item.admissionId || admissionId || undefined,
          appointmentId: item.appointmentId || item.procedureId || undefined,
          ivFluidOrderId: item.ivFluidId || undefined,
          bloodTransfusionOrderId: item.bloodTransfusionId || undefined,
          isPartial: Number(item.amountToBill) < ((Number(item.originalPrice) || 0) * (Number(item.quantity) || 1))
        })),
        ...(dependantId && { dependantId }),
      };

      await createBilling(patientId, payload);

      const statusToSet = submitTarget === 'hmo' ? PATIENT_STATUS.AWAITING_HMO : PATIENT_STATUS.AWAITING_CASHIER;

      try {
        await updateSubjectStatus(patientId, dependantId, statusToSet);
      } catch (err) {
        console.log(err);
        toast.error('Failed to update patient status!');
      }

      toast.success(submitTarget === 'hmo' ? 'Bill sent to HMO successfully!' : 'Bill created and sent to cashier!');
      reset();
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to create bill'));
    } finally {
      setIsLoading(false);
      setSubmitTarget(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-base-100 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="p-5 border-b border-base-200 flex justify-between items-center bg-base-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaMoneyBillWave className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">Generate Bill</h2>
              <p className="text-sm text-base-content/60">Select items to bill and specify amounts for partial billing.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="join">
              <button 
                type="button"
                className={`btn btn-sm join-item ${viewMode === 'pending' ? 'btn-primary' : ''}`}
                onClick={() => setViewMode('pending')}
              >
                Pending
              </button>
              <button 
                type="button"
                className={`btn btn-sm join-item ${viewMode === 'history' ? 'btn-primary' : ''}`}
                onClick={() => setViewMode('history')}
              >
                History
              </button>
            </div>
            <button type="button" onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {loadingServices ? (
            <div className="flex justify-center p-10"><span className="loading loading-spinner loading-lg"></span></div>
          ) : fields.length === 0 ? (
            <div className="text-center p-10 text-base-content/60">No pending bills found for this admission.</div>
          ) : (
            <form id="billing-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="border border-base-200 rounded-lg overflow-hidden">
                <table className="table table-sm w-full">
                  <thead className="bg-base-200/50">
                    <tr>
                      <th className="w-12 text-center">
                        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={areAllSelected} onChange={handleSelectAll} />
                      </th>
                      <th>Service Item</th>
                      <th>Code</th>
                      <th className="w-20 text-center">Qty</th>
                      <th className="text-right">Outstanding</th>
                      <th className="text-center">Status</th>
                      <th className="w-28 text-right">Amount to Bill</th>
                      <th className="w-24 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fields.map((item, index) => {
                      const currentItem = items[index] || item;
                      
                      const qty = Number(currentItem.quantity) || 0;
                      const amountToBill = Number(currentItem.amountToBill) || 0;
                      const originalTotal = (Number(currentItem.originalPrice) || 0) * qty;
                      const totalBilled = (Number(currentItem.previouslyBilled?.paid) || 0) + (Number(currentItem.previouslyBilled?.billed) || 0);
                      const outstanding = originalTotal - totalBilled;
                      const isFullyBilled = outstanding <= 0;

                      if (viewMode === 'pending' && isFullyBilled) return null;
                      if (viewMode === 'history' && (currentItem.previouslyBilled?.paid === 0 && currentItem.previouslyBilled?.billed === 0)) return null;

                      const isUnavailable = currentItem.isUnavailable;
                      const isOutOfStock = currentItem.isOutOfStock;
                      const isChecked = currentItem.included;
                      const isDisabled = isFullyBilled || isUnavailable || isOutOfStock;

                      return (
                        <tr key={item.id} className={`hover:bg-base-50/50 ${isChecked ? 'bg-primary/5' : ''}`}>
                          <td className="text-center">
                            <input 
                              type="checkbox" 
                              className="checkbox checkbox-sm checkbox-primary" 
                              disabled={isDisabled}
                              {...register(`items.${index}.included`)} 
                            />
                          </td>
                          <td className="p-2">
                            <div className="text-sm font-medium">{currentItem.description}</div>
                            {isUnavailable && <span className="badge badge-warning badge-xs mt-1">Unavailable</span>}
                            {isOutOfStock && <span className="badge badge-error badge-xs mt-1">Out of stock</span>}
                            {isFullyBilled && <span className="badge badge-neutral badge-xs mt-1">Fully Billed</span>}
                            <div className="text-xs text-base-content/50 mt-1">Original Price: ₦{Number(currentItem.originalPrice || 0).toLocaleString()}</div>
                          </td>
                          <td>
                            <span className="text-xs">{currentItem.code}</span>
                          </td>
                          <td>
                            <input type="number" min="1"
                              disabled={!isChecked || isDisabled}
                              className={`input input-bordered input-sm w-full text-center`}
                              {...register(`items.${index}.quantity`)} 
                            />
                          </td>
                          <td className="text-right font-medium">
                            ₦{(outstanding > 0 ? outstanding : 0).toLocaleString()}
                          </td>
                          <td className="text-center">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              {currentItem.previouslyBilled?.paid > 0 && (
                                 <span className="badge badge-success badge-sm opacity-80 scale-90 whitespace-nowrap text-white">
                                   Paid: ₦{Number(currentItem.previouslyBilled.paid).toLocaleString()}
                                 </span>
                              )}
                              {currentItem.previouslyBilled?.billed > 0 && (
                                 <span className="badge badge-warning badge-sm opacity-80 scale-90 whitespace-nowrap">
                                   Billed: ₦{Number(currentItem.previouslyBilled.billed).toLocaleString()}
                                 </span>
                              )}
                              {currentItem.previouslyBilled?.paid === 0 && currentItem.previouslyBilled?.billed === 0 && (
                                 <span className="badge badge-ghost badge-sm opacity-80 scale-90">
                                   New
                                 </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <input type="number" min="0" step="any"
                              disabled={!isChecked || isDisabled}
                              className={`input input-bordered input-sm w-full text-right ${amountToBill < outstanding && !isFullyBilled ? 'border-warning focus:border-warning' : ''}`}
                              {...register(`items.${index}.amountToBill`)} 
                            />
                          </td>
                          <td className={`text-right font-medium ${isUnavailable || isOutOfStock ? 'text-error' : ''}`}>
                            ₦{amountToBill.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-base-200 bg-base-50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
          <div>
            <span className="text-sm text-base-content/60 block">Selected Grand Total</span>
            <span className="text-2xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
          </div>
          <div className="flex gap-3">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isLoading}>Cancel</button>
            <button 
              type="submit" 
              form="billing-form"
              className="btn btn-secondary px-6" 
              disabled={isLoading || grandTotal === 0}
              onClick={() => setSubmitTarget('hmo')}
            >
              <FaShieldAlt className="w-4 h-4" /> Send to HMO
            </button>
            <button 
              type="submit" 
              form="billing-form"
              className="btn btn-primary px-6" 
              disabled={isLoading || grandTotal === 0}
              onClick={() => setSubmitTarget('cashier')}
            >
              {isLoading && submitTarget === 'cashier' ? <span className="loading loading-spinner loading-sm" /> : <FaMoneyBillWave className="w-4 h-4" />}
              Send to Cashier
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdmissionBillingModal;
