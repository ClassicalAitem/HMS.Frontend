import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const BloodDispenseModal = ({ isOpen, onClose, onSave, patient }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    bagNo: '',
    donorGroup: '',
    expiredDate: '',
    deliveredBy: '',
    dateOut: new Date().toISOString().split('T')[0],
    labRep: '',
    nurseRep: '',
    remark: '',
    status: 'Available'
  });

  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        dateOut: new Date().toISOString().split('T')[0],
      }));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.bagNo || !formData.donorGroup) {
      toast.error('Bag No. and Donor Group are required.');
      return;
    }

    setSaving(true);
    try {
      const saved = await onSave({ ...formData, recordType: 'dispense' });
      if (saved) {
        toast.success('Blood dispense record saved.');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center p-4 border-b border-base-200">
          <h3 className="font-bold text-lg">New Blood Dispense Record</h3>
          <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="blood-dispense-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-base-200 p-4 rounded-lg">
              <div>
                <label className="label"><span className="label-text">Patient Name</span></label>
                <input type="text" className="input input-bordered w-full" value={patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()} disabled />
              </div>
              <div>
                <label className="label"><span className="label-text">Card No. / Patient ID</span></label>
                <input type="text" className="input input-bordered w-full" value={patient?.hospitalId || patient?.id || ''} disabled />
              </div>
            </div>

            <div className="divider text-secondary font-semibold">Blood Dispense Details</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label"><span className="label-text">Bag No.</span></label>
                <input type="text" name="bagNo" value={formData.bagNo} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label"><span className="label-text">Donor Group</span></label>
                <select name="donorGroup" value={formData.donorGroup} onChange={handleChange} className="select select-bordered w-full" required>
                  <option value="">Select Donor Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
              <div>
                <label className="label"><span className="label-text">Expired Date</span></label>
                <input type="date" name="expiredDate" value={formData.expiredDate} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              
              <div>
                <label className="label"><span className="label-text">Delivered By</span></label>
                <input type="text" name="deliveredBy" value={formData.deliveredBy} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label"><span className="label-text">Date Out</span></label>
                <input type="date" name="dateOut" value={formData.dateOut} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label"><span className="label-text">Dispense Status</span></label>
                <select name="status" value={formData.status} onChange={handleChange} className="select select-bordered w-full font-semibold">
                  <option value="Available">Available</option>
                  <option value="Dispensed">Dispensed</option>
                  <option value="Unavailable">Unavailable</option>
                </select>
              </div>

              <div>
                <label className="label"><span className="label-text">Lab Rep</span></label>
                <input type="text" name="labRep" value={formData.labRep} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
              <div>
                <label className="label"><span className="label-text">Nurse Rep</span></label>
                <input type="text" name="nurseRep" value={formData.nurseRep} onChange={handleChange} className="input input-bordered w-full" required />
              </div>
            </div>
            
            <div>
              <label className="label"><span className="label-text">Remark</span></label>
              <textarea name="remark" value={formData.remark} onChange={handleChange} className="textarea textarea-bordered w-full" rows="3" placeholder="Any additional notes..."></textarea>
            </div>

          </form>
        </div>
        
        <div className="p-4 border-t border-base-200 flex justify-end gap-3 bg-base-100">
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={saving}>Cancel</button>
          <button type="submit" form="blood-dispense-form" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-xs" /> : 'Save Record'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BloodDispenseModal;
