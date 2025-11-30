import React from 'react';
// Use DaisyUI/Tailwind skeleton placeholders for loading states
import { IoAddCircleOutline } from 'react-icons/io5';
import { MdEditNote } from 'react-icons/md';
import { RiUserAddLine } from 'react-icons/ri';
import { CiEdit } from 'react-icons/ci';

const HmoDependantsSection = ({
  patient,
  isTransitionLoading,
  onAddHmo,
  onEditHmo,
  onAddDependant,
  onEditDependant,
}) => (
  <div className="shadow-xl card bg-base-100">
    <div className="p-6 card-body">
      <h3 className="mb-4 text-lg font-medium text-primary flex items-center justify-between">
        HMO & Dependants Information 
        <span className='flex items-center gap-2'>
          <label className="label text-base-content text-sm">HMO</label>
          <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Add HMO Plan">
            <IoAddCircleOutline className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={onAddHmo}/>
          </div>
          <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Edit HMO Plan">
            <MdEditNote className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={onEditHmo}/>
          </div>
          <div>
            <label className="label text-base-content text-sm">: | :</label>
          </div>
          <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Add Dependant">
            <RiUserAddLine className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={onAddDependant}/>
          </div>
          <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Edit Dependant">
            <CiEdit className='font-bold cursor-pointer text-xl hover:text-primary transition-colors duration-300' onClick={onEditDependant}/>
          </div>
          <label className="label text-base-content text-sm">Dependants</label>
        </span>
      </h3>
      <div className="flex flex-col lg:flex-row lg:justify-between gap-6">
        {/* Left Column - HMO & Dependants */}
        <div className="space-y-6 w-full lg:w-7/12 2xl:pl-12">
          {/* HMO Plans */}
          <div>
            {isTransitionLoading ? (
              <>
                <div className="skeleton h-4 w-64 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-24 w-full rounded-lg" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-sm text-base-content/70">
                  <span className="font-medium">HMO Plans:</span> {patient.hmos?.length > 0 ? `${patient.hmos.length} plan(s)` : "No HMO plans"}
                </div>
                {patient.hmos?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {patient.hmos.map((hmo, index) => (
                      <div key={index} className="p-4 rounded-lg border border-base-300">
                        <div className="text-sm font-semibold text-primary">
                          {hmo.planName || hmo.plan || hmo.planType || 'Unknown Plan'}
                        </div>
                        <div className="mt-2 space-y-1">
                          <div className="text-xs text-base-content/70">
                            <span className="font-medium">Provider:</span> {hmo.provider || '—'}
                          </div>
                          <div className="text-xs text-base-content/70">
                            <span className="font-medium">Member ID:</span> {hmo.memberId || '—'}
                          </div>
                          <div className="text-xs text-base-content/70">
                            <span className="font-medium">Expires:</span> {hmo.expirationDate ? new Date(hmo.expirationDate).toLocaleDateString('en-US') : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Dependants */}
          <div>
            {isTransitionLoading ? (
              <>
                <div className="skeleton h-4 w-48 mb-2" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="skeleton h-24 w-full rounded-lg" />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 text-sm text-base-content/70">
                  <span className="font-medium">Dependants:</span> {patient.dependants?.length > 0 ? `${patient.dependants.length} dependant(s)` : "No dependants"}
                </div>
                {patient.dependants?.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {patient.dependants.map((dep, index) => {
                      const middleInitial = dep.middleName ? ` ${dep.middleName.charAt(0)}.` : '';
                      const fullName = `${dep.lastName || ''}, ${dep.firstName || ''}${middleInitial}`.trim();
                      const dobFormatted = dep.dob ? new Date(dep.dob).toLocaleDateString('en-US') : '—';
                      const relationship = dep.relationshipType || dep.relationship || '—';
                      const statusText = dep.status || 'Unknown';
                      const statusColor = dep.status === 'Active' ? 'bg-green-500' : dep.status === 'Inactive' ? 'bg-gray-400' : dep.status === 'Pending' ? 'bg-yellow-500' : 'bg-base-300';
                      return (
                        <div key={index} className="p-4 rounded-lg border border-base-300">
                          <div className="text-sm font-semibold text-primary">{fullName}</div>
                          <div className="mt-2 grid grid-cols-2 gap-y-1 gap-x-3">
                            <div className="text-xs text-base-content/70"><span className="font-medium">DOB:</span> {dobFormatted}</div>
                            <div className="text-xs text-base-content/70"><span className="font-medium">Gender:</span> {dep.gender || '—'}</div>
                            <div className="text-xs text-base-content/70"><span className="font-medium">Relationship:</span> {relationship}</div>
                            <div className="text-xs text-base-content/70 flex items-center">
                              <span className="font-medium mr-2">Status:</span>
                              <span className={`w-2 h-2 rounded-full mr-2 ${statusColor}`}></span>
                              <span>{statusText}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Column - Appointments */}
        <div className="w-full lg:w-5/12">
          <div className="shadow-xl card">
            <div className="py-0 card-body">
              <div className="flex items-center mb-4 space-x-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <h3 className="text-lg font-semibold text-base-content">Appointments</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-base-content">Upcoming Appointment:</h4>
                  {isTransitionLoading ? (
                    <div className="skeleton h-4 w-48" />
                  ) : (
                    <p className="text-sm text-base-content/70">No upcoming appointment</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-base-content">Last Appointment:</h4>
                  {isTransitionLoading ? (
                    <div className="skeleton h-4 w-48" />
                  ) : (
                    <p className="text-sm text-base-content/70">No previous appointment</p>
                  )}
                </div>
                <div>
                  <h4 className="font-medium text-base-content">Registration Date:</h4>
                  {isTransitionLoading ? (
                    <div className="skeleton h-4 w-40" />
                  ) : (
                    <p className="text-sm text-base-content/70">{patient.createdAt ? new Date(patient.createdAt).toLocaleDateString() : 'Not available'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default HmoDependantsSection;