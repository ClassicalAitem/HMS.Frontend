import React from 'react';
import { PatientCardTypeInfo } from '@/components/common';

const PatientDetailsCard = ({ patient, summarySubject, isViewingDependant }) => {
  const fullName = summarySubject?.fullName || 'Unknown';
  const gender = summarySubject?.gender || '—';
  const phone = summarySubject?.phone || '—';
  const patientIdDisplay = summarySubject?.hospitalId || '—';
  const statusDisplay = summarySubject?.status || 'Unknown';
  const prettyStatus = String(statusDisplay).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const hmoList = summarySubject?.hmos || [];

  const isExpired = (h) => {
    const expiresAt = h.expiresAt || h.expiryDate;
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-6 mb-6">
      <div className="flex items-center gap-6">
        <div className="w-15 h-15 2xl:w-20 2xl:h-20 rounded-full border-2 border-primary overflow-hidden">
          {patient?.photo || patient?.profilePicture ? (
            <img src={patient?.photo || patient?.profilePicture} alt={fullName} className="object-cover w-20 h-20" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">{fullName?.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="flex-1 grid grid-cols-5 gap-6">
          <div>
            <p className="text-xs text-base-content/50 uppercase tracking-wide">
              {isViewingDependant ? 'Dependant Name' : 'Patient Name'}
            </p>
            <p className="text-md 2xl:text-lg font-semibold text-base-content">{fullName}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50 uppercase tracking-wide">Gender</p>
            <p className="text-md 2xl:text-lg font-semibold text-base-content">{gender}</p>
          </div>
          <div>
            <p className="text-xs text-base-content/50 uppercase tracking-wide">Phone Number</p>
            <p className="text-md 2xl:text-lg font-semibold text-base-content">{phone}</p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-base-content/50 uppercase tracking-wide">
              {isViewingDependant ? 'Parent Patient ID' : 'Patient ID'}
            </p>
            <p className="text-md 2xl:text-lg font-semibold text-base-content">{patientIdDisplay}</p>
          </div>
        

        </div>
        <div className="text-right">
          <div className="flex flex-col items-center gap-2">
            <span className="text-xs text-base-content/50">Status</span>
            <span className={`badge ${
              String(statusDisplay).toLowerCase().includes('cashier') ? 'badge-warning' :
              String(statusDisplay).toLowerCase().includes('completed') ? 'badge-success' :
              'badge-neutral'
            }`}>{prettyStatus}</span>
          </div>
        <PatientCardTypeInfo />

        </div>

      </div>
      <div className="mt-4 pt-4 border-t border-base-300">
        <p className="text-xs text-base-content/50 uppercase tracking-wide mb-2">Insurance</p>
        {hmoList.length === 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">None</span>
            <span className="badge badge-neutral">Inactive</span>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-2 gap-y-2 justify-evenly items-center">
            {hmoList.map((h, idx) => (
              <React.Fragment key={h.id || idx}>
                {idx > 0 && <span className="text-base-content/30">|</span>}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-base-content/70">
                    {h.provider || '—'} <span className="text-base-content/50">({h.plan || '—'})</span>
                  </span>
                  <span className={`badge badge-sm ${isExpired(h) ? 'badge-error' : 'badge-info'}`}>
                    {isExpired(h) ? 'Expired' : 'Active'}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsCard;