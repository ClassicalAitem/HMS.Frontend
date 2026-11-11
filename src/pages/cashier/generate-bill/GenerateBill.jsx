import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CashierLayout } from '@/layouts/cashier';
import { FaTimes, FaPlus, FaTrash, FaFileInvoice } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { createBill } from '@/services/api/billingAPI';
import { getPatientById } from '@/services/api/patientsAPI';
import KolakLoader from '@/components/common/KolakLoader';

const GenerateBill = () => {
  const navigate = useNavigate();
  const { patientId } = useParams();

  const [billItems, setBillItems] = useState([
    { id: 1, category: '', description: '', rate: 0 },
    { id: 2, category: '', description: '', rate: 0 }
  ]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [patientData, setPatientData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!patientId) return;
    const fetchPatient = async () => {
      try {
        setIsLoading(true);
        const res = await getPatientById(patientId);
        const p = res?.data?.data ?? res?.data;
        if (p) setPatientData(p);
      } catch (err) {
        console.error('Failed to load patient:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPatient();
  }, [patientId]);

  const patient = patientData ? {
    id: patientData.hospitalId || patientData.id || patientId,
    name: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim() || 'Unknown',
    gender: patientData.gender || '—',
    phone: patientData.phone || patientData.phoneNumber || '—',
    insurance: Array.isArray(patientData.hmos) && patientData.hmos.length > 0
      ? patientData.hmos.map(h => h.provider).filter(Boolean).join(', ')
      : 'Self-pay',
    status: patientData.status || 'Active'
  } : {
    id: patientId || "—",
    name: "Patient",
    gender: "—",
    phone: "—",
    insurance: "Self-pay",
    status: "Active"
  };

  const addBillItem = () => {
    const newItem = {
      id: Date.now(),
      category: '',
      description: '',
      rate: 0
    };
    setBillItems([...billItems, newItem]);
  };

  const removeBillItem = (id) => {
    if (billItems.length > 1) {
      setBillItems(billItems.filter(item => item.id !== id));
    }
  };

  const updateBillItem = (id, field, value) => {
    setBillItems(billItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    const total = billItems.reduce((sum, item) => sum + (item.rate || 0), 0);
    setTotalAmount(total);
    return total;
  };

  useEffect(() => {
    calculateTotal();
  }, [billItems]);

  const handleGenerateBill = async () => {
    if (!patientId) {
      toast.error('Missing patient ID');
      return;
    }

    try {
      setIsSubmitting(true);
      const items = billItems.map(({ category, description, rate }) => ({ category, description, rate }));
      const payload = { items, paymentMethod };
      const promise = createBill(patientId, payload);

      await toast.promise(promise, {
        loading: 'Generating bill...',
        success: 'Bill generated successfully',
        error: (err) => err?.response?.data?.message || 'Failed to generate bill',
      }, { duration: 3000 });
      
      navigate(`/cashier/patient-details/${patientId}`);
    } catch (error) {
      console.error('GenerateBill: error generating bill', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <CashierLayout>
      {(isLoading || isSubmitting) && <KolakLoader fullscreen />}
      <div className="flex flex-col min-w-0">
        {/* Page Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Generate Bill</h1>
            <p className="text-sm text-base-content/70">Create a billing statement for patient services</p>
          </div>
          <button onClick={() => navigate(-1)} className="btn btn-ghost btn-circle" title="Close">
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Patient Information Card */}
        <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-base-100 border border-base-200 mb-6 min-w-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                {patient.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-xl font-bold text-base-content">{patient.name}</h2>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-1 text-xs text-base-content/70">
                  <p>Gender: <span className="font-medium text-base-content">{patient.gender}</span></p>
                  <p>Phone: <span className="font-medium text-base-content">{patient.phone}</span></p>
                  <p>ID: <span className="font-medium font-mono text-base-content">{patient.id}</span></p>
                  <p>Insurance: <span className="font-medium text-base-content">{patient.insurance}</span></p>
                </div>
              </div>
            </div>
            <span className="badge badge-info badge-sm capitalize">{patient.status}</span>
          </div>
        </div>

        {/* Generate Bill Form */}
        <div className="p-4 sm:p-6 rounded-xl shadow-sm bg-base-100 border border-base-200 min-w-0">
          <h3 className="text-lg font-bold text-base-content mb-4">Bill Items</h3>
          
          {/* Bill Items */}
          <div className="mb-6 space-y-3">
            {billItems.map((item) => (
              <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 rounded-lg bg-base-200/40">
                <div className="sm:col-span-4">
                  <label className="text-xs font-medium text-base-content/60 mb-1 block sm:hidden">Category</label>
                  <select
                    value={item.category}
                    onChange={(e) => updateBillItem(item.id, 'category', e.target.value)}
                    className="select select-bordered select-sm w-full"
                  >
                    <option value="">Select Category</option>
                    <option value="consultation">Consultation</option>
                    <option value="lab">Lab Test</option>
                    <option value="xray">X-Ray / Radiology</option>
                    <option value="surgery">Surgery</option>
                    <option value="medication">Medication / Pharmacy</option>
                    <option value="admission">Admission / Bed</option>
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label className="text-xs font-medium text-base-content/60 mb-1 block sm:hidden">Description</label>
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateBillItem(item.id, 'description', e.target.value)}
                    className="input input-bordered input-sm w-full"
                    placeholder="Item description..."
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-xs font-medium text-base-content/60 mb-1 block sm:hidden">Rate (₦)</label>
                  <input
                    type="number"
                    value={item.rate || ''}
                    onChange={(e) => updateBillItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="input input-bordered input-sm w-full"
                    placeholder="0.00"
                  />
                </div>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    onClick={() => removeBillItem(item.id)}
                    className="btn btn-ghost btn-xs text-error"
                    disabled={billItems.length === 1}
                    title="Remove item"
                  >
                    <FaTrash className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            <button
              onClick={addBillItem}
              className="btn btn-outline btn-sm gap-2"
            >
              <FaPlus className="w-3 h-3" />
              Add Item
            </button>
          </div>

          {/* Payment Method and Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-base-200">
            <div>
              <label className="block text-xs font-medium text-base-content/70 mb-1">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="select select-bordered select-sm w-full"
              >
                <option value="">Select Payment Method</option>
                <option value="cash">Cash</option>
                <option value="bank-transfer">Bank Transfer</option>
                <option value="debit-card">Debit Card / POS</option>
                <option value="hmo">HMO / Corporate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-base-content/70 mb-1">Total Amount</label>
              <input
                type="text"
                value={`₦${totalAmount.toLocaleString()}`}
                className="input input-bordered input-sm w-full font-bold text-primary"
                readOnly
              />
            </div>
          </div>

          {/* Generate Bill Button */}
          <div className="mt-6">
            <button
              className="btn btn-primary w-full gap-2"
              onClick={handleGenerateBill}
              disabled={isSubmitting || totalAmount <= 0}
            >
              <FaFileInvoice className="w-4 h-4" />
              Generate Bill
            </button>
          </div>
        </div>
      </div>
    </CashierLayout>
  );
};

export default GenerateBill;
