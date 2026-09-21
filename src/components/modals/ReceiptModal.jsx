import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAppSelector } from '../../store/hooks';

const ReceiptModal = ({ isOpen, onClose, billingId, billing, patientId, onSubmit }) => {
  const user = useAppSelector((state) => state.auth.user);
  const userFullName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';

  const [formData, setFormData] = useState({
    amountPaid: '',
    paymentMethod: 'Select payment method',
    paidBy: 'self',
    paymentDestination: 'Select Destination',
    bankName: '',
    senderName: '',
    sessionId: '',
  });

  const [selectedItems, setSelectedItems] = useState([]);

  // Initialize selected items (unpaid items)
  useEffect(() => {
    if (isOpen && billing?.itemDetails) {
      const unpaidIndices = billing.itemDetails
        .map((item, index) => ({ item, index }))
        .filter(({ item }) => item.paymentStatus !== 'paid' && item.hmoStatus !== 'approved' && item.isCleared !== true)
        .map(({ index }) => index);
      setSelectedItems(unpaidIndices);
    } else {
      setSelectedItems([]);
    }
  }, [isOpen, billing]);

  // Update amountPaid when selected items change
  useEffect(() => {
    if (billing?.itemDetails && selectedItems.length > 0) {
      const total = selectedItems.reduce((sum, idx) => sum + Number(billing.itemDetails[idx].total || 0), 0);
      setFormData(prev => ({ ...prev, amountPaid: total.toString() }));
    } else if (selectedItems.length === 0 && isOpen && billing) {
       setFormData(prev => ({ ...prev, amountPaid: '' }));
    }
  }, [selectedItems, billing, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        senderName: prev.senderName || userFullName
      }));
    }
  }, [isOpen, userFullName]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    console.log('get data', formData)
    e.preventDefault();
      onSubmit({ ...formData, paidItemIndices: selectedItems });
      onClose();
      // Reset form
      setFormData({
        amountPaid: '',
        paymentMethod: 'Select payment method',
        paidBy: 'self',
        paymentDestination: 'Select Destination',
        bankName: '',
        senderName: userFullName,
        sessionId: '',
      });
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      amountPaid: '',
      paymentMethod: 'Select payment method',
      paidBy: 'self',
      paymentDestination: 'Select Destination',
      bankName: '',
      senderName: userFullName,
      sessionId: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-opacity-50" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 shadow-xl card bg-base-100 max-h-[90vh] flex flex-col">
        <div className="p-6 card-body overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-primary">Generate Receipt</h2>
            {/* <p>Making payment for the bill</p> */}
            <button
              type="button"
              onClick={handleCancel}
              className="btn btn-ghost btn-sm btn-circle"
            >
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Items to Pay */}
            {billing && billing.itemDetails && billing.itemDetails.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-base-content">
                    Items to Pay
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-xs checkbox-primary"
                      checked={
                        billing.itemDetails.filter(item => item.paymentStatus !== 'paid' && item.hmoStatus !== 'approved').length > 0 &&
                        selectedItems.length === billing.itemDetails.filter(item => item.paymentStatus !== 'paid' && item.hmoStatus !== 'approved').length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          const unpaidIndices = billing.itemDetails
                            .map((item, index) => ({ item, index }))
                            .filter(({ item }) => item.paymentStatus !== 'paid' && item.hmoStatus !== 'approved' && item.isCleared !== true)
                            .map(({ index }) => index);
                          setSelectedItems(unpaidIndices);
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                    Select All
                  </label>
                </div>
                <div className="bg-base-200 rounded-lg p-2 max-h-40 overflow-y-auto space-y-1">
                  {billing.itemDetails.map((item, index) => {
                    const isPaid = item.paymentStatus === 'paid' || item.hmoStatus === 'approved' || item.isCleared === true || billing.isCleared;
                    return (
                      <label key={index} className={`flex items-center justify-between p-2 rounded-md ${isPaid ? 'opacity-50' : 'cursor-pointer hover:bg-base-100'}`}>
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm checkbox-primary"
                            checked={selectedItems.includes(index) || isPaid}
                            disabled={isPaid}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [...prev, index]);
                              } else {
                                setSelectedItems(prev => prev.filter(i => i !== index));
                              }
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-sm font-medium">{item.description} {item.code ? `(${item.code})` : ''}</span>
                            <span className="text-xs opacity-70">Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold">
                          ₦{Number(item.total).toLocaleString()}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* amount paid & paid by*/}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Amount Paid
                </label>
                <input
                  type="number"
                  name="amountPaid"
                  value={formData.amountPaid}
                  onChange={handleInputChange}
                  placeholder="Type the amount paid"
                  className="w-full input input-bordered"
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Paid By
                </label>
                <input type="hidden" name="paidBy" value={formData.paidBy} />
                <span className="block w-full px-4 py-3 border rounded-lg bg-base-200">Self</span>
              </div>
            </div>

            {/* payment method & destination */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
              <label className="block mb-2 text-sm font-medium text-base-content">
                Payment Method
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleInputChange}
                className="w-full select select-bordered"
                required
              >
                <option value="">Select payment method</option>
                <option value="cash">Cash</option>
                <option value="transfer">Bank transfer</option>
                <option value="pos">POS</option>
              </select>
            </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">
                  Payment Destination
                </label>
                <select
                  name="paymentDestination"
                  value={formData.paymentDestination}
                  onChange={handleInputChange}
                  className="w-full select select-bordered"
                  required
                >
                  <option value="">Select Destination</option>
                  <option value="form">Form Registration</option>
                  <option value="pharmacy">pharmacy</option>
                  <option value="lab_test">Lab Test</option>
                  <option value="consultation">Consultation</option>
                  <option value="surgery">Surgery</option>
                  <option value="radiology">Radiology</option>
                  <option value="admission">Admission</option>
                  <option value="nursing">Nursing</option>
                  <option value="vaccination">Vaccination</option>
                  <option value="laboratory">Laboratory</option>
                </select>
              </div>
            </div>

            {/* Conditional Bank Transfer Fields */}
            {formData.paymentMethod === 'transfer' && (
              <div className="space-y-1 p-3 bg-base-200 rounded-lg border-l-4 border-primary">
                <p className="text-sm font-medium text-base-content mb-3">Bank Transfer Details</p>

                <div>
                  <label className="block mb-2 text-sm font-medium text-base-content">
                    Bank Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    placeholder="Enter bank name"
                    className="w-full input input-bordered"
                    required
                  />
                </div>

                <div>
                  <label className="block mb-2 text-sm font-medium text-base-content">
                    Sender's Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="senderName"
                    value={formData.senderName}
                    onChange={handleInputChange}
                    placeholder="Enter sender's full name"
                    className="w-full input input-bordered"
                    required
                  />
                </div>


                <div>
                  <label className="block mb-2 text-sm font-medium text-base-content">
                    Session ID <span className="text-base-content/50">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    name="sessionId"
                    value={formData.sessionId}
                    onChange={handleInputChange}
                    placeholder="Enter session ID (optional)"
                    className="w-full input input-bordered"
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  !formData.amountPaid ||
                  !formData.paymentMethod ||
                  (formData.paymentMethod === 'transfer' && (!formData.bankName || !formData.senderName))
                }
              >
                Send Receipt
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReceiptModal;
