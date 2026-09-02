import React, { useEffect, useState } from 'react';
import { FaTimes, FaHospital, FaCalendarAlt, FaClock, FaNotesMedical } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { createAppointment } from '@/services/api/appointmentsAPI';

const AddProcedureModal = ({
  isOpen,
  onClose,
  patientId,
  dependantId,
  consultationId,
  onProcedureCreated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProcedures, setIsLoadingProcedures] = useState(false);
  const [surgicalCharges, setSurgicalCharges] = useState([]);
  const [procedureSearch, setProcedureSearch] = useState('');
  const [isProcedureDropdownOpen, setIsProcedureDropdownOpen] = useState(false);

  const [form, setForm] = useState({
    procedureName: '',
    serviceChargeId: '',
    price: 0,
    appointmentDate: '',
    appointmentTime: '',
    department: '',
    notes: '',
  });

  // Load surgical-category SERVICE CHARGES (this is the "procedure list" to bill against)
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
      setForm({
        procedureName: '',
        serviceChargeId: '',
        price: 0,
        appointmentDate: '',
        appointmentTime: '',
        department: 'doctor',
        notes: '',
      });
      setProcedureSearch('');
      setIsProcedureDropdownOpen(false);
    }
  }, [isOpen]);

  const filteredCharges = surgicalCharges.filter((item) =>
    procedureSearch
      ? String(item.service || '')
          .toLowerCase()
          .includes(procedureSearch.toLowerCase())
      : true,
  );

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.procedureName.trim() || !form.serviceChargeId) {
      toast.error('Please select a procedure from the list');
      return;
    }
    if (!form.appointmentDate) {
      toast.error('Please pick a date');
      return;
    }
    if (!form.department) {
      toast.error('Please select a department');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        patientId,
        dependantId,
        consultationId,
        appointmentType: 'surgery',
        appointmentDate: form.appointmentDate,
        appointmentTime: form.appointmentTime,
        procedureName: form.procedureName,
        serviceChargeId: form.serviceChargeId,
        price: form.price,
        department: form.department,
        notes: form.notes,
        status: 'scheduled',
      };

      const result = await createAppointment(payload);
      const created = result?.data?.data ?? result?.data ?? result;

      toast.success('Procedure scheduled successfully');

      if (onProcedureCreated) onProcedureCreated(created);

      onClose();
    } catch (error) {
      console.error('Error creating procedure appointment:', error);
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl mx-4 bg-base-100 rounded-xl shadow-2xl border border-base-200 max-h-[90vh] flex flex-col">
        {/* HEADER */}
        <div className="p-6 border-b border-base-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full text-primary">
              <FaHospital />
            </div>
            <h2 className="text-xl font-bold">Add Procedure</h2>
          </div>

          <button onClick={onClose} className="btn btn-ghost btn-circle btn-sm">
            <FaTimes />
          </button>
        </div>

        {/* FORM */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="add-procedure-form" onSubmit={handleSubmit} className="space-y-6">
            {/* PROCEDURE PICKER (from surgical service charges) */}
            <div className="form-control w-full relative">
              <label className="label">
                <span className="label-text font-medium">Procedure</span>
              </label>
              <input
                type="text"
                placeholder={
                  isLoadingProcedures ? 'Loading procedures...' : 'Search surgical procedure...'
                }
                className="input input-bordered w-full"
                value={isProcedureDropdownOpen ? procedureSearch : form.procedureName}
                onFocus={() => {
                  setIsProcedureDropdownOpen(true);
                  setProcedureSearch('');
                }}
                onChange={(e) => {
                  setProcedureSearch(e.target.value);
                  setIsProcedureDropdownOpen(true);
                  // typing manually invalidates a previous exact pick
                  setForm((prev) => ({
                    ...prev,
                    procedureName: e.target.value,
                    serviceChargeId: '',
                    price: 0,
                  }));
                }}
                onBlur={() => {
                  // slight delay so click on dropdown item registers first
                  setTimeout(() => setIsProcedureDropdownOpen(false), 150);
                }}
              />

              {isProcedureDropdownOpen && filteredCharges.length > 0 && (
                <div className="absolute z-50 w-full mt-1 top-[72px] bg-white border rounded-md shadow max-h-60 overflow-auto">
                  {filteredCharges.map((item) => (
                    <div
                      key={item.id || item._id}
                      className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex justify-between items-center"
                      onClick={() => {
                        setForm((prev) => ({
                          ...prev,
                          procedureName: item.service || '',
                          serviceChargeId: item.id || item._id,
                          price: Number(item.amount) || 0,
                        }));
                        setIsProcedureDropdownOpen(false);
                        setProcedureSearch('');
                      }}
                    >
                      <span>{item.service}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ₦{Number(item.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {isProcedureDropdownOpen &&
                procedureSearch &&
                filteredCharges.length === 0 &&
                !isLoadingProcedures && (
                  <div className="absolute z-50 w-full mt-1 top-[72px] bg-white border rounded-md shadow p-3 text-sm text-gray-500">
                    No surgical service charge matches "{procedureSearch}"
                  </div>
                )}
            </div>

            {/* Auto-filled price, read-only display */}
            {form.serviceChargeId && (
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium">Price</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full bg-base-200"
                  value={`₦${Number(form.price || 0).toLocaleString()}`}
                  readOnly
                />
              </div>
            )}

        


            <div className="divider">Schedule</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <FaCalendarAlt className="text-base-content/50" /> Date
                  </span>
                </label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                  value={form.appointmentDate}
                  onChange={(e) => handleChange('appointmentDate', e.target.value)}
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <FaClock className="text-base-content/50" /> Time
                  </span>
                </label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                  value={form.appointmentTime}
                  onChange={(e) => handleChange('appointmentTime', e.target.value)}
                />
              </div>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium">Department</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={form.department}
                onChange={(e) => handleChange('department', e.target.value)}
              >
                <option value="">Select department</option>
                <option value="doctor">Doctor</option>
                <option value="medical-director">Medical Director</option>
                
              </select>
            </div>

            <div className="form-control w-full">
              <label className="label">
                <span className="label-text font-medium flex items-center gap-2">
                  <FaNotesMedical className="text-base-content/50" /> Notes
                </span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Any additional notes for this procedure..."
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
              />
            </div>
          </form>
        </div>

        {/* FOOTER */}
        <div className="p-6 border-t flex justify-end gap-3">
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            Cancel
          </button>

          <button
            type="submit"
            form="add-procedure-form"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Schedule Procedure'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProcedureModal;