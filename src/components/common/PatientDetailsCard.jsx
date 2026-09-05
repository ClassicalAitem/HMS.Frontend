import React, { useMemo } from 'react';
import { PatientCardTypeInfo, PatientStatusBadge } from '@/components/common';
import { formatPatientAge } from '@/utils/formatDateTimeUtils';

const PatientDetailsCard = ({
  patient,
  summarySubject,
  subject,
  patientData,
  isViewingDependant,
  guardian,
  activeAdmission,
}) => {
  // Resolve active subject entity (dependant or patient)
  const activeSubject =
    summarySubject || subject || patientData || (isViewingDependant ? null : patient) || patient || {};
  const parentPatient = guardian || patient || activeSubject?.patient || {};

  const fullName =
    activeSubject?.fullName ||
    `${activeSubject?.firstName || ''} ${activeSubject?.lastName || ''}`.trim() ||
    'Unknown';
  const gender = activeSubject?.gender || '—';
  const phone =
    activeSubject?.phone ||
    activeSubject?.phoneNumber ||
    parentPatient?.phone ||
    parentPatient?.phoneNumber ||
    '—';
  const patientIdDisplay = activeSubject?.hospitalId || parentPatient?.hospitalId || '—';
  const statusDisplay =
    activeSubject?.status ||
    (isViewingDependant ? 'awaiting_consultation' : parentPatient?.status) ||
    'Unknown';
  const prettyStatus = String(statusDisplay).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  const hmoList = activeSubject?.hmos || parentPatient?.hmos || [];

  // Card type props extraction
  const cardType = parentPatient?.cardType || activeSubject?.cardType || 'personal';
  const familyName = parentPatient?.familyName || activeSubject?.familyName || parentPatient?.lastName || '';
  const companyName = parentPatient?.companyName || activeSubject?.companyName || '';

  // Extract DOB from activeSubject or parentPatient
  const rawDob =
    activeSubject?.dob ||
    activeSubject?.dateOfBirth ||
    activeSubject?.birthDate ||
    parentPatient?.dob ||
    parentPatient?.dateOfBirth;

  // Status sender info - prioritize activeSubject (dependant), then parentPatient if not viewing dependant
  const resolvedStatusSenderName =
    activeSubject?.statusSenderName ||
    activeSubject?.statusUser?.name ||
    (!isViewingDependant ? parentPatient?.statusSenderName : null);

  const resolvedStatusUser =
    activeSubject?.statusUser ||
    (!isViewingDependant ? parentPatient?.statusUser : null);

  const resolvedUpdatedAt =
    activeSubject?.updatedAt ||
    (!isViewingDependant ? parentPatient?.updatedAt : null);

  // Age & Birthday Calculation
  const { age, isBirthday } = useMemo(() => {
    if (!rawDob) return { age: summarySubject?.age || patient?.age || '—', isBirthday: false };

    const birthDate = new Date(rawDob);
    if (isNaN(birthDate.getTime())) {
      return { age: summarySubject?.age || patient?.age || '—', isBirthday: false };
    }

    const today = new Date();
    const formattedAge = formatPatientAge(rawDob);

    const diffDays = Math.floor((today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24));
    const isTodayBirthday =
      diffDays > 0 &&
      today.getMonth() === birthDate.getMonth() &&
      today.getDate() === birthDate.getDate();

    return {
      age: formattedAge,
      isBirthday: isTodayBirthday,
    };
  }, [rawDob, summarySubject?.age, patient?.age]);

  const isExpired = (h) => {
    const expiresAt = h?.expiresAt || h?.expiryDate;
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-4 mb-6 relative border border-base-200">
      {/* Birthday Banner */}
      {isBirthday && (
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xs font-bold py-1.5 px-4 text-center -mx-4 -mt-4 mb-4 rounded-t-xl flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <span>🎉</span>
          <span>HAPPY BIRTHDAY TO {fullName.toUpperCase()}! 🎂</span>
          <span>🎈</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Avatar + Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 flex-1">
          {/* Avatar */}
          <div className="relative w-16 h-16 shrink-0 rounded-full border-2 border-primary overflow-hidden">
            {patient?.photo || patient?.profilePicture ? (
              <img
                src={patient?.photo || patient?.profilePicture}
                alt={fullName}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full bg-primary/10">
                <span className="text-xl font-bold text-primary">{fullName?.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 flex-1 w-full text-left">
            <div>
              <p className="text-[11px] uppercase font-semibold text-base-content/50">
                {isViewingDependant ? 'Dependant Name' : 'Patient Name'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold text-base-content truncate">{fullName}</p>
                {isBirthday && (
                  <span className="badge badge-secondary badge-xs font-bold text-[9px] animate-bounce" title="Today is their birthday!">
                    🎂 Birthday!
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[11px] uppercase font-semibold text-base-content/50">Gender</p>
              <p className="text-sm font-semibold text-base-content">{gender}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase font-semibold text-base-content/50">Age</p>
              <p className="text-sm font-semibold text-base-content">{age}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase font-semibold text-base-content/50">Phone Number</p>
              <p className="text-sm font-semibold text-base-content truncate">{phone}</p>
            </div>

            <div>
              <p className="text-[11px] uppercase font-semibold text-base-content/50">
                {isViewingDependant ? 'Parent ID' : 'Patient ID'}
              </p>
              <p className="text-sm font-semibold text-base-content truncate">{patientIdDisplay}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Status + Card Type */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-3 lg:pt-0 border-base-200 gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/50">Status:</span>
            <PatientStatusBadge
              status={statusDisplay}
              statusSenderName={resolvedStatusSenderName}
              statusUser={resolvedStatusUser}
              updatedAt={resolvedUpdatedAt}
              tooltipAlign="center"
            />
          </div>

          <PatientCardTypeInfo 
            cardType={cardType} 
            familyName={familyName} 
            companyName={companyName} 
          />
        </div>
      </div>

      {/* HMO Insurance Section */}
      <div className="mt-4 pt-3 border-t border-base-200">
        <p className="mb-1.5 text-[11px] uppercase font-semibold text-base-content/50">Insurance / HMO</p>
        {hmoList.length === 0 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-base-content/70">None</span>
            <span className="badge badge-xs badge-neutral">Inactive</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {hmoList.map((h, idx) => (
              <div
                key={h.id || idx}
                className="flex items-center gap-2 rounded-md bg-base-200 px-2.5 py-1 text-xs"
              >
                <span className="text-base-content/80 font-medium">
                  {h.provider || '—'} <span className="text-base-content/50">({h.plan || '—'})</span>
                  {h.memberId && <span className="text-base-content/40 ml-1">· ID: {h.memberId}</span>}
                </span>
                <span className={`badge badge-xs ${isExpired(h) ? 'badge-error' : 'badge-info'}`}>
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