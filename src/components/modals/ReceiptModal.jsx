import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
import { toast } from 'react-hot-toast';

const ReceiptModal = ({ isOpen, onClose, billingId, patientId, onSubmit }) => {
  const [formData, setFormData] = useState({
    amountPaid: '',
    paymentMethod: 'Select payment method',
    paidBy: 'self',
    paymentDestination: 'Select Destination',
    bankName: '',
    senderName: '',
    sessionId: '',
  });

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
      onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        amountPaid: '',
        paymentMethod: 'Select payment method',
        paidBy: 'self',
        paymentDestination: 'Select Destination',
        bankName: '',
        senderName: '',
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
      senderName: '',
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
                  className="w-full select select-bordered"
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
