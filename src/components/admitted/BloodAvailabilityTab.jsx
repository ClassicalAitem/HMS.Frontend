import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getBloodDispenseByAdmission,
  updateBloodDispenseStatus,
} from '@/services/api/bloodDispenseApi';

const unwrapRecords = (response) => {
  const payload = response?.data?.data ?? response?.data ?? response;
  return Array.isArray(payload) ? payload : [];
};

const displayDate = (value) => (value ? String(value).slice(0, 10) : '—');

const BloodAvailabilityTab = ({ admissionId, isNurse = false }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingRecordId, setUpdatingRecordId] = useState(null);

  useEffect(() => {
    let active = true;

    const loadRecords = async () => {
      if (!admissionId) {
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await getBloodDispenseByAdmission(admissionId);
        if (active) setRecords(unwrapRecords(response));
      } catch (error) {
        console.error('Failed to load blood records for admission:', error);
        if (active) toast.error(error?.response?.data?.message || 'Failed to load blood records.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadRecords();
    return () => { active = false; };
  }, [admissionId]);

  const crossMatchRecords = records.filter((record) => (
    record.recordType === 'crossMatch' || (!record.recordType && record.crossCheckDate)
  ));
  const dispenseRecords = records.filter((record) => (
    record.recordType === 'dispense' || (!record.recordType && record.bagNo)
  ));

  const handleStatusChange = async (record, status) => {
    const recordId = record._id || record.id;
    if (!recordId || updatingRecordId) return;

    try {
      setUpdatingRecordId(recordId);
      const response = await updateBloodDispenseStatus(recordId, status);
      if (!response?.success) {
        throw new Error(response?.message || 'The blood dispense status was not updated.');
      }
      const updatedRecord = response.data?.data ?? response.data ?? response;
      setRecords((current) => current.map((item) => (
        (item._id || item.id) === recordId ? { ...item, ...updatedRecord, status } : item
      )));
      toast.success('Blood dispense status updated.');
    } catch (error) {
      console.error('Failed to update blood dispense status:', error);
      toast.error(error?.response?.data?.message || error.message || 'Failed to update blood dispense status.');
    } finally {
      setUpdatingRecordId(null);
    }
  };

  if (!admissionId) {
    return (
      <section className="rounded-lg border border-base-300 bg-base-100 p-4 text-sm text-base-content/60">
        Blood records are not linked to this admission.
      </section>
    );
  }

  if (loading) {
    return (
      <section className="flex justify-center rounded-lg border border-base-300 bg-base-100 py-10">
        <span className="loading loading-spinner" />
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="border-b border-base-200 px-4 py-3">
          <h2 className="font-semibold">Cross-Matching Records</h2>
        </div>
        {crossMatchRecords.length === 0 ? (
          <p className="px-4 py-6 text-sm text-base-content/60">No cross-matching records for this admission.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead><tr><th>Date</th><th>Patient Blood Group</th><th>Compatibility Results</th><th>Lab Representative</th></tr></thead>
              <tbody>
                {crossMatchRecords.map((record) => (
                  <tr key={record._id || record.id}>
                    <td>{displayDate(record.crossCheckDate)}</td>
                    <td>{record.patientBloodGroup || '—'}</td>
                    <td>{record.results || '—'}</td>
                    <td>{record.labRepSign || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-lg border border-base-300 bg-base-100">
        <div className="border-b border-base-200 px-4 py-3">
          <h2 className="font-semibold">Blood Availability and Dispense</h2>
        </div>
        {dispenseRecords.length === 0 ? (
          <p className="px-4 py-6 text-sm text-base-content/60">No blood dispense records for this admission.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead><tr><th>Bag No.</th><th>Donor Group</th><th>Expires</th><th>Status</th><th>Date Out</th><th>Delivered By</th></tr></thead>
              <tbody>
                {dispenseRecords.map((record) => {
                  const recordId = record._id || record.id;
                  const statusClass = record.status === 'Dispensed'
                    ? 'badge-success'
                    : record.status === 'Available'
                      ? 'badge-info'
                      : 'badge-error';

                  return (
                    <tr key={recordId}>
                      <td className="font-medium">{record.bagNo || '—'}</td>
                      <td>{record.donorGroup || '—'}</td>
                      <td>{displayDate(record.expiredDate)}</td>
                      <td>
                        {isNurse && recordId ? (
                          <select
                            aria-label={`Status for blood bag ${record.bagNo || ''}`}
                            className="select select-bordered select-sm"
                            value={record.status || 'Available'}
                            disabled={updatingRecordId !== null}
                            onChange={(event) => handleStatusChange(record, event.target.value)}
                          >
                            <option value="Available">Available</option>
                            <option value="Dispensed">Dispensed</option>
                            <option value="Unavailable">Unavailable</option>
                          </select>
                        ) : (
                          <span className={`badge badge-sm ${statusClass}`}>{record.status || 'Unknown'}</span>
                        )}
                      </td>
                      <td>{displayDate(record.dateOut)}</td>
                      <td>{record.deliveredBy || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default BloodAvailabilityTab;
