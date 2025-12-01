import React from 'react';
// Use DaisyUI skeleton placeholders for loading state

const AdditionalInformationCard = ({ patient, isLoading }) => (
  <div className="mt-6 shadow-xl card bg-base-100">
    <div className="p-6 card-body">
      <h3 className="mb-4 text-lg font-medium text-primary">Additional Information</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <p className="text-sm text-base-content/70">Patient ID</p>
          {isLoading ? (
            <div className="skeleton h-4 w-24" />
          ) : (
            <p className="font-medium">{patient.id || ''}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-base-content/70">Hospital ID</p>
          {isLoading ? (
            <div className="skeleton h-4 w-24" />
          ) : (
            <p className="font-medium">{patient.hospitalId || ''}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-base-content/70">Status</p>
          {isLoading ? (
            <div className="skeleton h-4 w-28" />
          ) : (
            <p className="font-medium capitalize">{patient.status || ''}</p>
          )}
        </div>
        <div>
          <p className="text-sm text-base-content/70">Last Updated</p>
          {isLoading ? (
            <div className="skeleton h-4 w-40" />
          ) : (
            <p className="font-medium">
              {patient.updatedAt ? new Date(patient.updatedAt).toLocaleString() : 'Not available'}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AdditionalInformationCard;