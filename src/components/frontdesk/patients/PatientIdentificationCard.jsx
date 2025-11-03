import React from 'react';
// Using DaisyUI/Tailwind skeleton classes to mirror nurse pages

const getInitials = (firstName, lastName) => {
  const f = (firstName || '').trim();
  const l = (lastName || '').trim();
  if (!f && !l) return 'U';
  const firstInitial = f ? f.charAt(0).toUpperCase() : '';
  const lastInitial = l ? l.charAt(0).toUpperCase() : '';
  return `${firstInitial}${lastInitial}` || 'U';
};

const PatientIdentificationCard = ({ patient, isTransitionLoading }) => (
  <div className="shadow-xl card bg-base-100">
    <div className="flex flex-col p-6 card-body">
      <div className="flex flex-row items-center space-x-4">
        <div className="ml-4 avatar">
          <div className="w-20 h-20 rounded-full border-3 border-primary/80 flex items-center justify-center overflow-hidden p-[2px]">
            {isTransitionLoading ? (
              <div className="skeleton w-full h-full rounded-full" />
            ) : (
              <div className="w-full h-full grid place-items-center bg-primary text-primary-content text-2xl font-bold">
                {getInitials(patient.firstName, patient.lastName)}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-12 justify-around px-8 w-auto 2xl:gap-0 2xl:w-full">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-base-content/70">Patient Name </span>
            {isTransitionLoading ? (
              <div className="skeleton h-5 w-40" />
            ) : (
              <span className="text-xl font-semibold text-base-content">
                {(patient.firstName || '')} {(patient.lastName || '')}
              </span>
            )}
          </div>

          <div className="w-[1px] h-auto bg-base-content/70"></div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-base-content/70">Gender</span>
            {isTransitionLoading ? (
              <div className="skeleton h-5 w-20" />
            ) : (
              <span className="text-xl font-semibold text-base-content capitalize">{patient.gender || ''}</span>
            )}
          </div>

          <div className="w-[1px] h-auto bg-base-content/70"></div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-base-content/70">Phone Number</span>
            {isTransitionLoading ? (
              <div className="skeleton h-5 w-32" />
            ) : (
              <span className="text-xl font-semibold text-base-content">{patient.phone || ''}</span>
            )}
          </div>

          <div className="w-[1px] h-auto bg-base-content/70"></div>

          <div className="flex flex-col space-y-1">
            <span className="text-sm text-base-content/70">Hospital ID</span>
            {isTransitionLoading ? (
              <div className="skeleton h-5 w-24" />
            ) : (
              <span className="text-xl font-semibold text-base-content">{patient.hospitalId || ''}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center px-4 pt-4 mt-4 space-y-1 border-t-2 border-base-content/70">
        <div>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-56" />
          ) : (
            <li className="text-sm font-semibold text-base-content">
              HMO: {patient.hmos?.length > 0 ? `${patient.hmos[0]?.provider || ''} (${patient.hmos[0]?.memberId || ''})` : 'None'}
            </li>
          )}
        </div>

        <div className="flex justify-center items-center gap-1">
          <span className="text-sm font-semibold text-base-content">Status</span>
          {isTransitionLoading ? (
            <div className="skeleton h-6 w-28 rounded-full" />
          ) : (
            <span className="px-12 text-sm font-semibold text-base-100 btn btn-xs bg-primary capitalize">{patient.status || ''}</span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default PatientIdentificationCard;