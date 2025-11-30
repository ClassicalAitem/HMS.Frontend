/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FaTimes } from 'react-icons/fa';
import { getPatients } from '@/services/api/patientsAPI';
import { toast } from 'react-hot-toast';
import { getAllHmos } from '@/services/api/hmoAPI';

const ReceiptModal = ({ isOpen, onClose, billingId, patientId, onSubmit }) => {
  const [formData, setFormData] = useState({
    amountPaid: '',
    paymentMethod: 'Select payment method',
    hmoId: null,
    paidBy: 'Select payer',
  });

  // Patient search state
  const [query, setQuery] = useState('');
  const [isOpenList, setIsOpenList] = useState(false);
  const [filteredResults, setFilteredResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [hmos, setHmos] = useState([]);

  const inputRef = useRef(null);

  useEffect(() => {
  if (!isOpen) return;

  const fetchHmos = async () => {
    try {
      const res = await getAllHmos({ patientId });
      const list = Array.isArray(res) ? res : res?.data.data ?? [];

      console.log('Fetched HMOs for patient:', list);

      setHmos(list);
      setFilteredResults(list);  // ✅ IMPORTANT FIX

      // Auto-select if only one HMO
      if (list.length === 1) {
        setFormData(prev => ({ ...prev, hmoId: list[0].id }));

        setQuery(
          "Select HMO"
        );
      }
    } catch (err) {
      console.log('Error fetching HMOs or none found');
    }
  };

  fetchHmos();

  // Reset state on modal open
  setQuery('');
  setActiveIndex(-1);
  setIsOpenList(false);
}, [isOpen, patientId]);


  const selectHmo = (hmo) => {
    console.log('Selected HMO:', hmo);
    setFormData(prev => ({ ...prev, hmoId: hmo.id }));

    // Combine into one string
    const displayValue = `${hmo.provider} - ${hmo.plan} (Expires: ${hmo.expiresAt}) - Member ID: ${hmo.memberId}`;
    setQuery(displayValue);

    setIsOpenList(false);
    setActiveIndex(-1);
  };

  const handleQueryChange = (e) => {
    console.log('handleQueryChange fired, value:', e.target.value);

    const value = e.target.value;
    setQuery(value);
    setIsOpenList(true);
    setActiveIndex(-1);

    if (!value) {
      setFilteredResults(hmos);
      return;
    }

    const results = hmos.filter(hmo => {
      const provider = hmo.provider || '';
      const plan = hmo.plan || '';
      const memberId = hmo.memberId || '';
      return (
        provider.toLowerCase().includes(value.toLowerCase()) ||
        plan.toLowerCase().includes(value.toLowerCase()) ||
        memberId.toLowerCase().includes(value.toLowerCase())
      );
    });

    setFilteredResults(results);
  };

  const handleKeyDown = (e) => {
    if (!isOpenList) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(idx => Math.min(idx + 1, filteredResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(idx => Math.max(idx - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && filteredResults[activeIndex]) {
        selectHmo(filteredResults[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpenList(false);
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    console.log(formData)
    e.preventDefault();
      onSubmit(formData);
      onClose();
      // Reset form
      setFormData({
        amountPaid: '',
        paymentMethod: 'Select payment method',
        hmoId: '',
        paidBy: 'Select payer',
      });
      setQuery('');
      setFilteredResults([]);
  };

  const handleCancel = () => {
    onClose();
    // Reset form
    setFormData({
      amountPaid: '',
      paymentMethod: 'Select payment method',
      hmoId: '',
      paidBy: 'Select payer',
    });
    setQuery('');
    setFilteredResults([]);
  };

  console.log('filterResults', filteredResults);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-lg mx-4 shadow-xl card bg-base-100">
        <div className="p-6 card-body">
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
            {/* Patient Selector Combobox */}
            <div>
              {/* HMO Selector only if multiple */}
              {hmos.length > 0 && (
              <div>
                <label className="block mb-2 text-sm font-medium">Select HMO</label>
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={handleQueryChange}
                  onFocus={() => setIsOpenList(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full input input-bordered"
                  placeholder="Search HMO"
                />
                {isOpenList && filteredResults.length > 0 && (
                  <ul className="menu bg-base-100 border rounded-box shadow mt-1 max-h-56 overflow-auto">
                    {filteredResults.map((hmo, idx) => (
                      <li
                        key={hmo.id}
                        className={`px-4 py-2 cursor-pointer ${
                          activeIndex === idx ? 'bg-base-200' : ''
                        }`}
                        onMouseDown={() => selectHmo(hmo)}
                      >
                        {hmo.provider} - {hmo.plan} (Expires: {hmo.expiresAt}) - Member ID: {hmo.memberId}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
            </div>

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
                <select
                  name="paidBy"
                  value={formData.paidBy}
                  onChange={handleInputChange}
                  className="w-full select select-bordered"
                  required
                >
                  <option value="">Select payer</option>
                  <option value="self">Self</option>
                  <option value="hmo">HMO</option>
                </select>
              </div>
            </div>

            {/* Payment Method */}
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
                <option value="hmo">HMO</option>
              </select>
            </div>

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
                disabled={!formData.amountPaid || !formData.paymentMethod || !formData.paidBy}
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
