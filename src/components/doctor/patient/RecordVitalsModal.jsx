import React from "react";

const RecordVitalsModal = ({ isOpen, patientName, recordForm, setRecordForm, recordError, recordLoading, onCancel, onSubmit }) => {
  if (!isOpen) return null;
  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg">Record New Vitals - {patientName}</h3>
        <p className="py-1 text-sm">Enter the latest vital signs for this patient.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Blood Pressure</label>
            <input type="text" placeholder="120/80" className="input input-bordered w-full"
              value={recordForm.bp}
              onChange={(e) => setRecordForm((f) => ({ ...f, bp: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Heart Rate</label>
            <input type="number" placeholder="78" className="input input-bordered w-full"
              value={recordForm.pulse}
              onChange={(e) => setRecordForm((f) => ({ ...f, pulse: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Oxygen Saturation</label>
            <input type="number" placeholder="98" className="input input-bordered w-full"
              value={recordForm.spo2}
              onChange={(e) => setRecordForm((f) => ({ ...f, spo2: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Temperature</label>
            <input type="text" placeholder="98.6" className="input input-bordered w-full"
              value={recordForm.temperature}
              onChange={(e) => setRecordForm((f) => ({ ...f, temperature: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Weight</label>
            <input type="text" placeholder="70" className="input input-bordered w-full"
              value={recordForm.weight}
              onChange={(e) => setRecordForm((f) => ({ ...f, weight: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Height</label>
            <input type="text" placeholder="70" className="input input-bordered w-full"
              value={recordForm.height}
              onChange={(e) => setRecordForm((f) => ({ ...f, height: e.target.value }))}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-base-content/70">Respiratory Rate</label>
            <input type="text" placeholder="70" className="input input-bordered w-full"
              value={recordForm.respiratoryRate}
              onChange={(e) => setRecordForm((f) => ({ ...f, respiratoryRate: e.target.value }))}
            />
          </div>

        </div>

        {recordError && (
          <div className="mt-2 text-error text-sm">{recordError}</div>
        )}

        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className={`btn btn-success ${recordLoading ? "loading" : ""}`} onClick={onSubmit}>Record Vitals</button>
        </div>
      </div>
    </div>
  );
};

export default RecordVitalsModal;