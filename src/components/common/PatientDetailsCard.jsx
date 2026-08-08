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
    <div className="bg-base-100 rounded-xl shadow-lg p-3 mb-4 sm:p-4 sm:mb-6 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4 md:gap-6">
        {/* Avatar */}
        <div className="w-12 h-12 shrink-0 mx-auto rounded-full border-2 border-primary overflow-hidden sm:mx-0 sm:w-16 sm:h-16 lg:w-20 lg:h-20">
          {patient?.photo || patient?.profilePicture ? (
            <img
              src={patient?.photo || patient?.profilePicture}
              alt={fullName}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="flex justify-center items-center w-full h-full bg-primary/10">
              <span className="text-lg font-bold text-primary sm:text-2xl">{fullName?.charAt(0)}</span>
            </div>
          )}
        </div>

        {/* Info grid */}
        <div className="flex-1 min-w-0 grid grid-cols-2 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="min-w-0 col-span-2 sm:col-span-1">
            <p className="text-xs uppercase tracking-wide text-base-content/50">
              {isViewingDependant ? 'Dependant Name' : 'Patient Name'}
            </p>
            <p className="text-sm font-semibold text-base-content truncate sm:text-md 2xl:text-lg">{fullName}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-base-content/50">Gender</p>
            <p className="text-sm font-semibold text-base-content truncate sm:text-md 2xl:text-lg">{gender}</p>
          </div>
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wide text-base-content/50">Phone Number</p>
            <p className="text-sm font-semibold text-base-content truncate sm:text-md 2xl:text-lg">{phone}</p>
          </div>
          <div className="min-w-0 col-span-2 sm:col-span-2">
            <p className="text-xs uppercase tracking-wide text-base-content/50">
              {isViewingDependant ? 'Parent Patient ID' : 'Patient ID'}
            </p>
            <p className="text-sm font-semibold text-base-content truncate sm:text-md 2xl:text-lg">{patientIdDisplay}</p>
          </div>
        </div>

        {/* Status + card type */}
        <div className="flex flex-row items-center justify-between gap-3 pt-2 border-t border-base-300 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0 sm:gap-2">
          <div className="flex flex-row items-center gap-2 sm:flex-col sm:items-center">
            <span className="text-xs text-base-content/50">Status</span>
            <span className={`badge whitespace-nowrap ${
              String(statusDisplay).toLowerCase().includes('cashier') ? 'badge-warning' :
              String(statusDisplay).toLowerCase().includes('completed') ? 'badge-success' :
              'badge-neutral'
            }`}>{prettyStatus}</span>
          </div>
          <PatientCardTypeInfo />
        </div>
      </div>

      {/* Insurance */}
      <div className="mt-4 pt-4 border-t border-base-300">
        <p className="mb-2 text-xs uppercase tracking-wide text-base-content/50">Insurance</p>
        {hmoList.length === 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-base-content/70">None</span>
            <span className="badge badge-neutral">Inactive</span>
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {hmoList.map((h, idx) => (
              <div
                key={h.id || idx}
                className="flex flex-wrap items-center gap-2 rounded-lg bg-base-200/50 px-2.5 py-1.5 text-sm sm:bg-transparent sm:px-0 sm:py-0"
              >
                <span className="text-base-content/70 break-words">
                  {h.provider || '—'} <span className="text-base-content/50">({h.plan || '—'})</span>
                  {h.memberId && <span className="text-base-content/40 ml-1">· ID: {h.memberId}</span>}
                </span>
                <span className={`badge badge-sm shrink-0 ${isExpired(h) ? 'badge-error' : 'badge-info'}`}>
                  {isExpired(h) ? 'Expired' : 'Active'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailsCard;