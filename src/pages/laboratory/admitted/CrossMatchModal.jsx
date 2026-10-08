import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const CrossMatchModal = ({ isOpen, onClose, onSave, patient }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    crossCheckDate: new Date().toISOString().split('T')[0],
    patientBloodGroup: '',
    results: '',
    labRepSign: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        crossCheckDate: new Date().toISOString().split('T')[0],
        patientBloodGroup: '',
        results: '',
        labRepSign: '',
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const saved = await onSave({ ...formData, recordType: 'crossMatch' });
      if (saved) {
        toast.success('Cross-match record saved.');
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-base-100 shadow-xl">
        <div className="flex items-center justify-between border-b border-base-200 p-4">
          <h3 className="text-lg font-bold">New Cross-Matching Record</h3>
          <button type="button" onClick={onClose} className="btn btn-sm btn-circle btn-ghost" disabled={saving}>✕</button>
        </div>

        <form id="cross-match-form" onSubmit={handleSubmit} className="flex-1 space-y-6 overflow-y-auto p-6">
          <div className="grid grid-cols-1 gap-4 rounded-lg bg-base-200 p-4 md:grid-cols-2">
            <div>
              <label className="label"><span className="label-text">Patient Name</span></label>
              <input
                type="text"
                className="input input-bordered w-full"
                value={patient?.fullName || `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim()}
                disabled
              />
            </div>
            <div>
              <label className="label"><span className="label-text">Card No. / Patient ID</span></label>
              <input type="text" className="input input-bordered w-full" value={patient?.hospitalId || patient?.id || ''} disabled />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="label"><span className="label-text">Cross-Match Date</span></label>
              <input type="date" name="crossCheckDate" value={formData.crossCheckDate} onChange={handleChange} className="input input-bordered w-full" required />
            </div>
            <div>
              <label className="label"><span className="label-text">Patient Blood Group</span></label>
              <select name="patientBloodGroup" value={formData.patientBloodGroup} onChange={handleChange} className="select select-bordered w-full" required>
                <option value="">Select Blood Group</option>
                {bloodGroups.map((group) => <option key={group} value={group}>{group}</option>)}
              </select>
            </div>
            <div>
              <label className="label"><span className="label-text">Compatibility Results</span></label>
              <input type="text" name="results" value={formData.results} onChange={handleChange} className="input input-bordered w-full" placeholder="Enter compatibility results" required />
            </div>
            <div>
              <label className="label"><span className="label-text">Lab Representative</span></label>
              <input type="text" name="labRepSign" value={formData.labRepSign} onChange={handleChange} className="input input-bordered w-full" placeholder="Initials or name" required />
            </div>
          </div>
        </form>

        <div className="flex justify-end gap-3 border-t border-base-200 p-4">
          <button type="button" onClick={onClose} className="btn btn-ghost" disabled={saving}>Cancel</button>
          <button type="submit" form="cross-match-form" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-xs" /> : 'Save Cross-Match'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CrossMatchModal;
