import React, { useEffect, useMemo, useState } from 'react';
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
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const nextMidnight = new Date(today);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeout = window.setTimeout(
      () => setToday(new Date()),
      nextMidnight.getTime() - Date.now(),
    );

    return () => window.clearTimeout(timeout);
  }, [today]);

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

  // A dependant's DOB must never fall back to the guardian's DOB.
  const rawDob =
    activeSubject?.dob ||
    activeSubject?.dateOfBirth ||
    activeSubject?.birthDate ||
    subject?.dob ||
    subject?.dateOfBirth ||
    subject?.birthDate ||
    (!isViewingDependant && (parentPatient?.dob || parentPatient?.dateOfBirth));

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

  const consultationType = activeSubject?.consultationType || parentPatient?.consultationType;

  // Age & Birthday Calculation
  const { age, isBirthday } = useMemo(() => {
    const fallbackAge = summarySubject?.age || (!isViewingDependant && patient?.age) || '—';
    if (!rawDob) return { age: fallbackAge, isBirthday: false };

    const birthDate = new Date(rawDob);
    if (isNaN(birthDate.getTime())) {
      return { age: fallbackAge, isBirthday: false };
    }

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
  }, [rawDob, summarySubject?.age, patient?.age, isViewingDependant, today]);

  const isExpired = (h) => {
    const expiresAt = h?.expiresAt || h?.expiryDate;
    return expiresAt ? new Date(expiresAt) < new Date() : false;
  };

  return (
    <div className="bg-base-100 rounded-2xl shadow-sm p-3.5 sm:p-4 mb-4 relative border border-base-200">
      {/* Birthday Banner */}
      {isBirthday && (
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xs font-bold py-1 px-4 text-center -mx-3.5 sm:-mx-4 -mt-3.5 sm:-mt-4 mb-3 rounded-t-2xl flex items-center justify-center gap-2 shadow-sm animate-pulse">
          <span>🎉</span>
          <span>HAPPY BIRTHDAY TO {fullName.toUpperCase()}! 🎂</span>
          <span>🎈</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left Side: Avatar + Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3.5 flex-1">
          {/* Avatar */}
          <div className="relative w-12 h-12 shrink-0 rounded-xl border border-primary/30 overflow-hidden shadow-xs">
            {patient?.photo || patient?.profilePicture ? (
              <img
                src={patient?.photo || patient?.profilePicture}
                alt={fullName}
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="flex justify-center items-center w-full h-full bg-primary/10">
                <span className="text-lg font-bold text-primary">{fullName?.charAt(0)}</span>
              </div>
            )}
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 flex-1 w-full text-left">
            <div>
              <p className="text-[10px] uppercase font-bold text-base-content/50">
                {isViewingDependant ? 'Dependant Name' : 'Patient Name'}
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-bold text-base-content truncate">{fullName}</p>
                {isBirthday && (
                  <span className="badge badge-secondary badge-xs font-bold text-[9px] animate-bounce" title="Today is their birthday!">
                    🎂
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-base-content/50">Gender</p>
              <p className="text-xs sm:text-sm font-semibold text-base-content capitalize">{gender}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-base-content/50">Age</p>
              <p className="text-xs sm:text-sm font-semibold text-base-content">{age}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-base-content/50">Phone Number</p>
              <p className="text-xs sm:text-sm font-semibold text-base-content truncate">{phone}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase font-bold text-base-content/50">
                {isViewingDependant ? 'Parent ID' : 'Patient ID'}
              </p>
              <p className="text-xs sm:text-sm font-semibold text-base-content truncate font-mono">{patientIdDisplay}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Status + Card Type */}
        <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-2 lg:pt-0 border-base-200 gap-1.5 shrink-0">
          {consultationType && (
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className={`badge badge-xs font-bold ${consultationType === 'Medical Director' ? 'badge-secondary' : 'badge-primary'}`}>
                Consulting {consultationType}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-base-content/50">Status:</span>
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
      <div className="mt-3 pt-2.5 border-t border-base-200 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-base-content/50">Insurance / HMO:</span>
          {hmoList.length === 0 ? (
            <span className="badge badge-xs badge-ghost text-base-content/60">Private (Cash Paying)</span>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              {hmoList.map((h, idx) => (
                <div
                  key={h.id || idx}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-base-200/80 px-2 py-0.5 text-[11px]"
                >
                  <span className="text-base-content/80 font-medium">
                    {h.provider || '—'} <span className="text-base-content/50">({h.plan || '—'})</span>
                    {h.memberId && <span className="text-base-content/40 ml-1">· {h.memberId}</span>}
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
    </div>
  );
};

export default PatientDetailsCard;