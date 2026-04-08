import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CashierLayout } from '@/layouts/cashier';
import toast from 'react-hot-toast';
import { createOpdPatient } from '@/services/api/opdPatientAPI';
import { getServiceCharges } from '@/services/api/serviceChargesAPI';
import { createBillForOpd } from '@/services/api/billingAPI';
import { FaArrowLeft, FaTrash } from 'react-icons/fa';
import { createInvestigationRequestForCashier } from '@/services/api/investigationRequestAPI';

const opdPatientSchema = yup.object().shape({
  fullName: yup.string().required('Full name is required').min(2),
  phone: yup.string().required('Phone number is required').matches(/^[0-9+\-() ]+$/, 'Invalid phone number'),
  address: yup.string().optional(),
});

const TestSearchInput = ({ serviceCharges, onSelect, placeholder = 'Search lab test...' }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapperRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const filtered = serviceCharges.filter((s) => !search || (s.service || '').toLowerCase().includes(search.toLowerCase()));

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
  };

  React.useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
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
        className="input input-bordered input-sm w-full"
        placeholder={placeholder}
        value={search}
        onFocus={openDropdown}
        onChange={(e) => { setSearch(e.target.value); if (!open) openDropdown(); }}
        autoComplete="off"
      />
      {open && (
        <div style={dropdownStyle} className="bg-white border border-gray-200 rounded-md shadow-xl max-h-60 overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-2 text-gray-400 text-sm">No matches found</div>
          ) : filtered.map((s) => (
            <div
              key={s.id || s._id}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm flex justify-between items-center"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(s);
                setSearch('');
                setOpen(false);
              }}
            >
              <span className="font-medium">{s.service}</span>
              <span className="text-gray-400 text-xs ml-2">₦{Number(s.amount || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const CreateOpdPatient = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [serviceCharges, setServiceCharges] = useState([]);
  const [selectedTests, setSelectedTests] = useState([]);
  const [priority, setPriority] = useState('normal');

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(opdPatientSchema),
    defaultValues: { fullName: '', phone: '', address: '' }
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getServiceCharges();
        const data = res?.data ?? res ?? [];
        const labs = data.filter((i) => (i.category || '').toLowerCase() === 'laboratory');
        setServiceCharges(labs);
      } catch {
        /* silent */
      }
    };
    load();
  }, []);

  const handleAddTest = (charge) => {
    if (selectedTests.find((t) => (t.charge.id || t.charge._id) === (charge.id || charge._id))) {
      toast.error('Test already added');
      return;
    }
    setSelectedTests((prev) => [...prev, { charge, qty: 1 }]);
  };

  const handleRemoveTest = (index) => {
    setSelectedTests((prev) => prev.filter((_, i) => i !== index));
  };

  const handleQtyChange = (index, qty) => {
    setSelectedTests((prev) => prev.map((t, i) => i === index ? { ...t, qty: Math.max(1, Number(qty) || 1) } : t));
  };

  const grandTotal = selectedTests.reduce((sum, t) => sum + Number(t.charge.amount || 0) * t.qty, 0);

  const onSubmit = async (data) => {
    if (selectedTests.length === 0) {
      toast.error('Please add at least one lab test');
      return;
    }

    setIsLoading(true);
    try {
      const patientRes = await createOpdPatient({
        ...data,
        address: data.address?.trim() || 'Not provided',
      });
      const newPatient = patientRes?.data?.data ?? patientRes?.data ?? patientRes;
      const newPatientId = newPatient?.id;

      if (!newPatientId) throw new Error('Failed to get patient ID');

      const itemDetail = selectedTests.map((t) => ({
        code: t.charge.category || 'LAB',
        description: t.charge.service,
        quantity: t.qty,
        price: Number(t.charge.amount || 0),
        total: Number(t.charge.amount || 0) * t.qty,
        serviceChargeId: t.charge.id || t.charge._id,
      }));

      await createBillForOpd(newPatientId, { itemDetail });

      const investigationData = {
        opdPatientId: newPatientId,
        type: 'lab',
        priority,
        tests: selectedTests.map((t) => ({ name: t.charge.service })),
      };

      await toast.promise(
        createInvestigationRequestForCashier(investigationData),
        {
          loading: 'Creating investigation request...',
          success: 'Investigation request created successfully!',
          error: (e) => e?.response?.data?.message || 'Failed to create investigation request',
        }
      );

      toast.success('Patient registered, bill created, and investigation requested!');
      navigate(`/cashier/opd-patient-details/${newPatientId}`);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to create patient');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <CashierLayout>
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/cashier/opd-patients')} className="btn btn-ghost btn-sm">
          <FaArrowLeft />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-base-content">Register OPD Patient</h1>
          <p className="text-sm text-base-content/70">Direct lab referral — no doctor consultation needed</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-lg">Patient Information</h2>
            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Full Name *</span></label>
              <input type="text" placeholder="Enter full name"
                className={`input input-bordered w-full ${errors.fullName ? 'input-error' : ''}`}
                {...register('fullName')} />
              {errors.fullName && <span className="text-error text-sm mt-1">{errors.fullName.message}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Phone Number *</span></label>
              <input type="tel" placeholder="Enter phone number"
                className={`input input-bordered w-full ${errors.phone ? 'input-error' : ''}`}
                {...register('phone')} />
              {errors.phone && <span className="text-error text-sm mt-1">{errors.phone.message}</span>}
            </div>

            <div className="form-control">
              <label className="label"><span className="label-text font-medium">Address (optional)</span></label>
              <input type="text" placeholder="Enter address"
                className="input input-bordered w-full"
                {...register('address')} />
            </div>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="form-control w-full">
              <label className="label"><span className="label-text">Investigation Priority</span></label>
              <select
                className="select select-bordered"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>
          </div>
          <div className="card-body">
            <h2 className="card-title text-lg">Lab Tests</h2>
            <p className="text-sm text-base-content/60 mb-2">Search and add the tests the patient needs.</p>

            <TestSearchInput
              serviceCharges={serviceCharges}
              onSelect={handleAddTest}
              placeholder="Search and add a lab test..."
            />

            {selectedTests.length > 0 ? (
              <div className="mt-4 space-y-2">
                <div className="text-xs text-base-content/50 uppercase tracking-wide font-semibold mb-1">Selected Tests</div>
                {selectedTests.map((t, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 border border-base-200 rounded-lg px-3 py-2">
                    <div className="flex-1">
                      <span className="font-medium text-sm">{t.charge.service}</span>
                      <span className="text-xs text-base-content/50 ml-2">₦{Number(t.charge.amount || 0).toLocaleString()} each</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={t.qty}
                        onChange={(e) => handleQtyChange(idx, e.target.value)}
                        className="input input-bordered input-xs w-16 text-center"
                      />
                      <span className="text-sm font-medium text-primary w-24 text-right">
                        ₦{(Number(t.charge.amount || 0) * t.qty).toLocaleString()}
                      </span>
                      <button type="button" onClick={() => handleRemoveTest(idx)} className="btn btn-ghost btn-xs text-error">
                        <FaTrash className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center pt-3 border-t border-base-200 mt-3">
                  <span className="font-semibold text-base-content">Total Bill</span>
                  <span className="text-xl font-bold text-primary">₦{grandTotal.toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="mt-4 text-center py-6 border border-dashed border-base-300 rounded-lg text-base-content/40 text-sm">
                No tests added yet. Search above to add tests.
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => navigate('/cashier/opd-patients')} className="btn btn-ghost" disabled={isLoading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading
              ? <><span className="loading loading-spinner loading-sm"></span> Creating...</>
              : 'Register & Create Bill'
            }
          </button>
        </div>
      </form>
    </CashierLayout>
  );
};

export default CreateOpdPatient;
