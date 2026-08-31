import React from 'react'

const AdmittedCard = ({ admission, onOpen }) => {
  const patient = admission.patient || admission.patientId || {};
  const name = patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown';
  const ward = admission.ward?.name || admission.ward || '—';
  const admittedAt = admission.admittedAt || admission.createdAt;

  return (
    <div className="p-4 bg-white rounded shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{name}</div>
          <div className="text-sm text-muted">Ward: {ward}</div>
        </div>
        <div className="text-right">
          <div className="text-sm">{new Date(admittedAt).toLocaleString()}</div>
          <button className="btn btn-sm btn-outline btn-primary mt-2" onClick={() => onOpen(admission)}>
            Open
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdmittedCard
