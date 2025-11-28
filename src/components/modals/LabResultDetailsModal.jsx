import React, { useEffect, useState } from 'react';
import { getLabResultById } from '@/services/api/labResultsAPI';
import toast from 'react-hot-toast';

const LabResultDetailsModal = ({ isOpen, onClose, labResultId }) => {
  const [loading, setLoading] = useState(false);
  const [lab, setLab] = useState(null);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !labResultId) return;
      try {
        setLoading(true);
        const res = await getLabResultById(labResultId);
        const data = res?.data ?? res;
        if (!data) throw new Error('No lab result');
        setLab(data);
      } catch (e) {
        toast.error('Failed to load lab result');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, labResultId]);

  if (!isOpen) return null;

  const items = Array.isArray(lab?.result) ? lab.result : [];
  const files = Array.isArray(lab?.attachedFiles) ? lab.attachedFiles : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-base-content">Lab Result Details</h2>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>

          {loading ? (
            <div className="skeleton h-24 w-full" />
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-base-content/70">Lab ID</div>
                  <div className="font-medium">{lab?._id || lab?.id || '—'}</div>
                </div>
                <div>
                  <div className="text-base-content/70">Patient ID</div>
                  <div className="font-medium">{lab?.patientId || '—'}</div>
                </div>
                <div>
                  <div className="text-base-content/70">Investigation Request</div>
                  <div className="font-medium">{lab?.investigationRequestId || '—'}</div>
                </div>
                <div>
                  <div className="text-base-content/70">Remarks</div>
                  <div className="font-medium">{lab?.remarks || '—'}</div>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-2">Result</h3>
                <div className="overflow-x-auto">
                  <table className="table w-full">
                    <thead>
                      <tr>
                        <th>Code</th>
                        <th>Value</th>
                        <th>Unit</th>
                        <th>Range</th>
                        <th>Flag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-base-content/70">No result data</td></tr>
                      ) : items.map((r, idx) => (
                        <tr key={idx}>
                          <td>{r?.code || '—'}</td>
                          <td>{r?.value || '—'}</td>
                          <td>{r?.unit || '—'}</td>
                          <td>{r?.range || '—'}</td>
                          <td>{r?.flag || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold mb-2">Attachments</h3>
                <div className="space-y-2">
                  {files.length === 0 ? (
                    <div className="text-sm text-base-content/70">No attachments</div>
                  ) : files.map((f) => (
                    <div key={f?._id || f?.id} className="flex justify-between items-center text-sm p-2 rounded bg-base-200">
                      <div>
                        <div className="font-medium">{f?.name || 'file'}</div>
                        <div className="text-base-content/70">{f?.mimetype || '—'}</div>
                      </div>
                      <div className="text-base-content/60">{f?.uploadedAt ? new Date(f.uploadedAt).toLocaleString() : '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabResultDetailsModal;
