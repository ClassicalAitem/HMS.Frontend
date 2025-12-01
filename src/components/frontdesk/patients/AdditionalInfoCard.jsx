import React from 'react';
// Use DaisyUI skeleton placeholders for loading state

const AdditionalInfoCard = ({ patient, isTransitionLoading }) => (
  <div className="shadow-xl card bg-base-100">
    <div className="p-6 card-body">
      <h3 className="mb-4 text-lg font-medium text-primary">Additional Info</h3>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="font-regular text-base-content/70 text-md">Next of kin</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-48" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.nextOfKin?.name || 'Not provided'}
            </span>
          )}
        </div>

        <div>
          <p className="font-regular text-base-content/70 text-md">Relationship</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-36" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.nextOfKin?.relationship || 'Not provided'}
            </span>
          )}
        </div>

        <div>
          <p className="font-regular text-base-content/70 text-md">Phone number</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-32" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.nextOfKin?.phone || 'Not provided'}
            </span>
          )}
        </div>

        <div className="md:col-span-3">
          <p className="font-regular text-base-content/70 text-md">Address</p>
          {isTransitionLoading ? (
            <div className="skeleton h-4 w-full" />
          ) : (
            <span className="font-medium text-md 2xl:text-xl 2xl:font-regular">
              {patient.nextOfKin?.address || 'Not provided'}
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

export default AdditionalInfoCard;