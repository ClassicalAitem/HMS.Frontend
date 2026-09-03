import React, { useEffect, useState } from 'react';
import {
  FaTimes,
  FaHospital,
  FaCalendarAlt,
  FaClock,
  FaNotesMedical,
  FaCheck,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { createAppointment } from '@/services/api/appointmentsAPI';

const AddProcedureModal = ({
  isOpen,
  onClose,
  patientId,
  dependantId,
  consultationId,
  patient,
  onProcedureCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);
  const [surgicalCharges, setSurgicalCharges] = useState([]);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [isProcedureDropdownOpen, setIsProcedureDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    procedureName: '',
    procedureCode: '',
    serviceChargeId: '',
    price: 0,
    appointmentDate: '',
    appointmentTime: '',
    department: 'surgeon',
    notes: '',
  });

  // Load surgical-category SERVICE CHARGES
  useEffect(() => {
    if (!isOpen) return;

    const loadSurgicalCharges = async () => {
      try {
        setIsLoadingProcedures(true);
        const res = await getServiceCharges();
        const raw = res?.data ?? res ?? [];
        const list = Array.isArray(raw) ? raw : (raw?.data ?? []);
        const surgicalOnly = list.filter(
          (x) => String(x?.category || '').toLowerCase() === 'surgical',
        );
        setSurgicalCharges(surgicalOnly);
      } catch (err) {
        console.error('Failed to load surgical service charges', err);
      } finally {
        setIsLoadingProcedures(false);
      }
    };

    loadSurgicalCharges();
  }, [isOpen]);

  // Reset form each time modal opens
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      setForm({
        procedureName: '',
        procedureCode: '',
        serviceChargeId: '',
        price: 0,
        appointmentDate: today,
        appointmentTime: '09:00',
        department: 'surgeon',
        notes: '',
      });
      setProcedureSearch('');
      setIsProcedureDropdownOpen(false);
    }
  }, [isOpen]);

  const filteredCharges = surgicalCharges.filter((item) =>
    procedureSearch
      ? String(item.service || item.name || '')
          .toLowerCase()
          .includes(procedureSearch.toLowerCase())
      : true,
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectCharge = (item) => {
    setForm((prev) => ({
      ...prev,
      procedureName: item.service || item.name || '',
      procedureCode: item.code || item.procedureCode || '',
      serviceChargeId: item.id || item._id,
      price: Number(item.amount || item.price) || 0,
    }));
    setProcedureSearch(item.service || item.name || '');
    setIsProcedureDropdownOpen(false);
  };

  const executeSubmit = async () => {
    if (!form.procedureName.trim()) {
      toast.error('Please select or enter a procedure name');
      return;
    }
    if (!form.appointmentDate) {
      toast.error('Please pick an appointment date');
      return;
    }
    if (!form.department) {
      toast.error('Please select a department');
      return;
    }

    setIsLoading(true);
    try {
      let finalServiceChargeId = form.serviceChargeId;
      let finalPrice = Number(form.price) || 0;
      let finalCode = form.procedureCode;

      if (!finalServiceChargeId || finalPrice === 0) {
        const match = surgicalCharges.find(
          (sc) =>
            String(sc.service || sc.name || '').toLowerCase() === form.procedureName.trim().toLowerCase()
        );
        if (match) {
          finalServiceChargeId = finalServiceChargeId || match.id || match._id;
          finalPrice = finalPrice || Number(match.amount || match.price) || 0;
          finalCode = finalCode || match.code || match.procedureCode;
        }
      }

      const payload = {
        patientId,
        dependantId: dependantId || undefined,
        consultationId: consultationId || undefined,
        appointmentType: 'surgery',
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        procedureName: form.procedureName,
        procedureCode: finalCode || undefined,
        serviceChargeId: finalServiceChargeId || undefined,
        price: finalPrice,
        department: form.department,
        notes: form.notes,
        status: 'scheduled',
      };

      const result = await createAppointment(payload);
      const created = result?.data?.data ?? result?.data ?? result;

      toast.success('Surgical procedure added successfully');

      if (onProcedureCreated) {
        onProcedureCreated(created);
      }

      onClose();
    } catch (error) {
      console.error('Error scheduling procedure:', error);
      toast.error(
        error?.response?.data?.message ||
          error?.response?.data?.error ||
          'Failed to schedule procedure',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-base-100 rounded-2xl shadow-2xl border border-base-300 max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-100">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10 text-primary">
              <FaHospital className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-base-content">
                Add Surgical Procedure
              </h2>
              <p className="text-xs text-base-content/60">
                Select surgical service charge, schedule theatre appointment, and bill patient or request HMO approval
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-circle btn-sm"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* PROCEDURE PICKER (from surgical service charges) */}
          <div className="form-control w-full relative">
            <label className="label py-1">
              <span className="label-text font-semibold text-sm">
                Surgical Procedure *
              </span>
              <span className="label-text-alt text-xs text-primary font-medium">
                {surgicalCharges.length} available services
              </span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder={
                  isLoadingProcedures
                    ? 'Loading surgical catalog...'
                    : 'Search procedure catalog (e.g. Appendectomy, Caesarean Section)...'
                }
                className="input input-bordered w-full pr-10 focus:input-primary text-sm font-medium"
                value={isProcedureDropdownOpen ? procedureSearch : form.procedureName}
                onFocus={() => {
                  setIsProcedureDropdownOpen(true);
                  setProcedureSearch(form.procedureName || '');
                }}
                onChange={(e) => {
                  setProcedureSearch(e.target.value);
                  setIsProcedureDropdownOpen(true);
                  setForm((prev) => ({
                    ...prev,
                    procedureName: e.target.value,
                    serviceChargeId: '',
                    price: 0,
                  }));
                }}
                onBlur={() => {
                  setTimeout(() => setIsProcedureDropdownOpen(false), 200);
                }}
              />
              {form.serviceChargeId && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success">
                  <FaCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Dropdown Menu */}
            {isProcedureDropdownOpen && filteredCharges.length > 0 && (
              <div className="absolute z-50 w-full mt-1 top-[74px] bg-base-100 border border-base-300 rounded-xl shadow-2xl max-h-64 overflow-y-auto divide-y divide-base-200">
                {filteredCharges.map((item) => (
                  <div
                    key={item.id || item._id}
                    className="px-4 py-3 cursor-pointer hover:bg-primary/10 transition-colors flex justify-between items-center group"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelectCharge(item);
                    }}
                  >
                    <div>
                      <p className="text-sm font-semibold text-base-content group-hover:text-primary">
                        {item.service || item.name}
                      </p>
                      {item.code && (
                        <p className="text-xs text-base-content/50 font-mono">
                          Code: {item.code}
                        </p>
                      )}
                    </div>
                    <span className="badge badge-outline badge-primary font-semibold text-xs">
                      ₦{Number(item.amount || item.price || 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {isProcedureDropdownOpen &&
              procedureSearch &&
              filteredCharges.length === 0 &&
              !isLoadingProcedures && (
                <div className="absolute z-50 w-full mt-1 top-[74px] bg-base-100 border border-base-300 rounded-xl shadow-xl p-4 text-xs text-base-content/60 text-center">
                  No catalog match found. You may continue typing to schedule as a custom procedure.
                </div>
              )}
          </div>

          {/* Pricing & Procedure Code Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-medium text-xs">
                  Standard Bill Amount (₦)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-base-content/50">
                  ₦
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0.00"
                  className="input input-bordered w-full pl-8 font-semibold text-sm"
                  value={form.price || ''}
                  onChange={(e) =>
                    handleChange('price', Number(e.target.value) || 0)
                  }
                />
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-medium text-xs">
                  Procedure Code
                </span>
              </label>
              <input
                type="text"
                placeholder="e.g. SURG-042"
                className="input input-bordered w-full text-sm font-mono"
                value={form.procedureCode}
                onChange={(e) => handleChange('procedureCode', e.target.value)}
              />
            </div>
          </div>

          {/* Schedule Section */}
          <div className="divider my-1 text-xs uppercase font-bold tracking-wider text-base-content/40">
            Scheduling & Assignment
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-medium text-xs flex items-center gap-1.5">
                  <FaCalendarAlt className="text-base-content/50" /> Scheduled Date *
                </span>
              </label>
              <input
                type="date"
                className="input input-bordered w-full text-sm"
                value={form.appointmentDate}
                onChange={(e) => handleChange('appointmentDate', e.target.value)}
              />
            </div>

            <div className="form-control w-full">
              <label className="label py-1">
                <span className="label-text font-medium text-xs flex items-center gap-1.5">
                  <FaClock className="text-base-content/50" /> Start Time
                </span>
              </label>
              <input
                type="time"
                className="input input-bordered w-full text-sm"
                value={form.appointmentTime}
                onChange={(e) => handleChange('appointmentTime', e.target.value)}
              />
            </div>
          </div>

          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-medium text-xs">Department</span>
            </label>
            <select
              className="select select-bordered w-full text-sm"
              value={form.department}
              onChange={(e) => handleChange('department', e.target.value)}
            >
              <option value="surgeon">Surgeon / Theatre</option>
              <option value="doctor">Doctor</option>
              <option value="medical-director">Medical Director</option>
            </select>
          </div>

          <div className="form-control w-full">
            <label className="label py-1">
              <span className="label-text font-medium text-xs flex items-center gap-1.5">
                <FaNotesMedical className="text-base-content/50" /> Clinical Notes & Instructions
              </span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full text-sm"
              rows={2}
              placeholder="Specify clinical indication, theatre requirements, or pre-operative instructions..."
              value={form.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 sm:p-5 border-t border-base-200 bg-base-200/40 flex items-center justify-between gap-2">
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm gap-1.5 font-semibold text-white"
            disabled={isLoading}
            onClick={executeSubmit}
          >
            {isLoading ? (
              <>
                <span className="loading loading-spinner loading-xs"></span>
                Adding Procedure...
              </>
            ) : (
              'Add Procedure'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProcedureModal;