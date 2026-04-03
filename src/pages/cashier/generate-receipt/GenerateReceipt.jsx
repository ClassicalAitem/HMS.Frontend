/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/cashier/dashboard';
import { FaTimes, FaPlus, FaTrash, FaFileInvoice } from 'react-icons/fa';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { createBill } from '@/services/api/billingAPI';

const GenerateReceipt = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [billItems, setBillItems] = useState([
    { id: 1, category: '', description: '', rate: 0 },
    { id: 2, category: '', description: '', rate: 0 }
  ]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const { patientId } = useParams();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  // Sample patient data
  const patient = {
    id: patientId || "P-2025-002",
    name: "Leslie Alexander",
    photo: "https://images.unsplash.com/photo-1494790108755-2616b612b786?q=80&w=1000&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    gender: "Female",
    phone: "09127911395",
    insurance: "MedCare HMO",
    status: "Active"
  };

  const addBillItem = () => {
    const newItem = {
      id: billItems.length + 1,
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

  React.useEffect(() => {
    calculateTotal();
  }, [billItems]);

  const handleGenerateBill = async () => {
    try {
      if (!patientId) {
        toast.error('Missing patient ID');
        return;
      }

      const items = billItems.map(({ category, description, rate }) => ({ category, description, rate }));
      const payload = { items, paymentMethod };
      const promise = createBill(patientId, payload);

      await toast.promise(promise, {
        loading: 'Generating bill...',
        success: 'Bill generated successfully',
        error: (err) => err?.response?.data?.message || 'Failed to generate bill',
      }, { duration: 3000 });
    } catch (error) {
      // Errors are handled by toast.promise
      console.error('GenerateBill: error generating bill', error);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />

        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-base-content 2xl:text-4xl">Generate Bill</h1>
            <button className="btn btn-ghost btn-circle">
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          {/* Patient Information Card */}
          <div className="p-6 rounded-lg shadow-lg bg-base-200 mb-6">
            <div className="flex items-center space-x-6">
              <img
                src={patient.photo}
                alt={patient.name}
                className="w-20 h-20 rounded-full object-cover"
              />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-base-content">{patient.name}</h2>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-base-content/70">Gender: {patient.gender}</p>
                    <p className="text-sm text-base-content/70">Phone: {patient.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-base-content/70">Patient ID: {patient.id}</p>
                    <p className="text-sm text-base-content/70">Insurance: {patient.insurance}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <span className="badge badge-info">Active</span>
              </div>
            </div>
          </div>

          {/* Generate Bill Form */}
          <div className="p-6 rounded-lg shadow-lg bg-base-100">
            <h3 className="text-xl font-bold text-base-content mb-6">Generate Patient Bill Here</h3>

            {/* Bill Items */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-semibold text-base-content">Bill Items</h4>
                <button
                  onClick={addBillItem}
                  className="btn btn-primary btn-sm"
                >
                  <FaPlus className="w-4 h-4 mr-2" />
                  Add item
                </button>
              </div>

              <div className="space-y-4">
                {billItems.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-3">
                      <select
                        value={item.category}
                        onChange={(e) => updateBillItem(item.id, 'category', e.target.value)}
                        className="select select-bordered w-full"
                      >
                        <option value="">Select Category</option>
                        <option value="consultation">Consultation</option>
                        <option value="lab">Lab Test</option>
                        <option value="xray">X-Ray</option>
                        <option value="surgery">Surgery</option>
                        <option value="medication">Medication</option>
                      </select>
                    </div>
                    <div className="col-span-4">
                      <select
                        value={item.description}
                        onChange={(e) => updateBillItem(item.id, 'description', e.target.value)}
                        className="select select-bordered w-full"
                      >
                        <option value="">Select Description</option>
                        <option value="general-consultation">General Consultation</option>
                        <option value="blood-test">Blood Test</option>
                        <option value="chest-xray">Chest X-Ray</option>
                        <option value="minor-surgery">Minor Surgery</option>
                        <option value="prescription">Prescription</option>
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateBillItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="input input-bordered w-full"
                        placeholder="₦0.00"
                      />
                    </div>
                    <div className="col-span-2 flex justify-end">
                      <button
                        onClick={() => removeBillItem(item.id)}
                        className="btn btn-ghost btn-sm text-error"
                        disabled={billItems.length === 1}
                      >
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method and Total */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="select select-bordered w-full"
                >
                  <option value="">Select Payment Method</option>
                  <option value="cash">Cash</option>
                  <option value="bank-transfer">Bank Transfer</option>
                  <option value="debit-card">Debit Card</option>
                  <option value="credit-card">Credit Card</option>
                  <option value="hmo">HMO</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-base-content mb-2">Total Amount</label>
                <input
                  type="text"
                  value={`₦${totalAmount.toLocaleString()}`}
                  className="input input-bordered w-full"
                  readOnly
                />
              </div>
            </div>

            {/* Generate Bill Button */}
            <div className="mt-8">
              <button className="btn btn-primary btn-lg w-full" onClick={handleGenerateBill}>
                <FaFileInvoice className="w-5 h-5 mr-2" />
                Generate Bill
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenerateReceipt;
