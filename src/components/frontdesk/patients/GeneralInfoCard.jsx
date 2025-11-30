import React from 'react';
// Use DaisyUI/Tailwind skeleton placeholders to match nurse dashboard style

const GeneralInfoCard = ({ patient, isTransitionLoading }) => (
  <div className="shadow-xl card bg-base-100">
    <div className="p-6 card-body">
      <h3 className="mb-4 text-lg font-medium text-primary">General Info</h3>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div className="flex flex-col space-y-1">
          <p className="text-sm font-regular text-base-content/70 text-md">Address</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-64" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.address || 'Not provided'}</span>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <p className="font-regular text-base-content/70 text-md">Middle Name</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-40" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.middleName || 'Not provided'}</span>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <p className="font-regular text-base-content/70 text-md">Date of Birth</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-32" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.dob ? new Date(patient.dob).toLocaleDateString() : 'Not provided'}
            </span>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <p className="font-regular text-base-content/70 text-md">Email</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-48" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">{patient.email || 'Not provided'}</span>
          )}
        </div>

        <div className="flex flex-col space-y-1">
          <p className="font-regular text-base-content/70 text-md">Created</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-36" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}
            </span>
          )}
        </div>
        
        <div className="flex flex-col space-y-1">
          <p className="font-regular text-base-content/70 text-md">Last Updated</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-36" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.updatedAt ? new Date(patient.updatedAt).toLocaleDateString() : 'Not available'}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default GeneralInfoCard;