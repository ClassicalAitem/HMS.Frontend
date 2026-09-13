import React from 'react';
import { IoAddCircleOutline } from 'react-icons/io5';
import { MdEditNote, MdDeleteOutline } from 'react-icons/md';
import { RiUserAddLine } from 'react-icons/ri';
import { CiEdit } from 'react-icons/ci';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const initials = (firstName, lastName) =>
  `${(firstName || '').charAt(0)}${(lastName || '').charAt(0)}`.toUpperCase() || '—';

const HmoPlanChip = ({ hmo, onDeleteHmo }) => (
  <div className="p-2 mt-2 rounded-lg bg-success/10 relative group border border-success/20">
    {onDeleteHmo && (
      <button 
        type="button" 
        onClick={() => onDeleteHmo(hmo)}
        className="absolute top-1 right-1 p-1 rounded-full text-error/70 hover:bg-error/10 hover:text-error transition-colors"
        title="Delete HMO Plan"
      >
        <MdDeleteOutline size={16} />
      </button>
    )}
    <div className="text-xs font-semibold text-success pr-6">{hmo.provider || 'Unknown provider'}</div>
    <div className="mt-1 space-y-0.5 text-xs text-base-content/70">
      <div>Member ID: {hmo.memberId || '—'}</div>
      {hmo.plan && <div>Plan: {hmo.plan}</div>}
      <div>Expires: {hmo.expiresAt ? formatNigeriaDate(hmo.expiresAt) : '—'}</div>
    </div>
  </div>
);

const HmoDependantsSection = ({
  patient,
  isTransitionLoading,
  viewingDependantId,
  onAddHmo,
  onEditHmo,
  onAddDependant,
  onEditDependant,
  onAddHmoForDependant,
  onEditHmoForDependant,
  onDeleteHmo,
  onDeleteDependant,
}) => {
  const isViewingDependant = !!viewingDependantId;

   if (!patient) {
    return (
      <div className="shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          <div className="w-full h-40 rounded-lg skeleton" />
        </div>
      </div>
    );
  }

  const allHmos = patient.hmos || [];
  const patientHmos = allHmos.filter((h) => !h.dependantId);
  const hmosByDependantId = allHmos.reduce((acc, h) => {
    if (h.dependantId) {
      acc[h.dependantId] = acc[h.dependantId] || [];
      acc[h.dependantId].push(h);
    }
    return acc;
  }, {});

  return (
    <div className="shadow-xl card bg-base-100">
      <div className="p-6 card-body">
        <h3 className="flex items-center justify-between mb-4 text-lg font-medium text-primary">
          HMO & Dependants Information
          <span className="flex items-center gap-2">
            {!isViewingDependant && (
              <>
                <label className="text-sm label text-base-content">HMO</label>
                <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Add HMO Plan">
                  <IoAddCircleOutline className="text-xl font-bold transition-colors duration-300 cursor-pointer hover:text-primary" onClick={onAddHmo} />
                </div>
                <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Edit HMO Plan">
                  <MdEditNote className="text-xl font-bold transition-colors duration-300 cursor-pointer hover:text-primary" onClick={onEditHmo} />
                </div>
                <label className="text-sm label text-base-content">: | :</label>
                <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Add Dependant">
                  <RiUserAddLine className="text-xl font-bold transition-colors duration-300 cursor-pointer hover:text-primary" onClick={onAddDependant} />
                </div>
                <div className="tooltip tooltip-primary tooltip-bottom" data-tip="Edit Dependant">
                  <CiEdit className="text-xl font-bold transition-colors duration-300 cursor-pointer hover:text-primary" onClick={onEditDependant} />
                </div>
                <label className="text-sm label text-base-content">Dependants</label>
              </>
            )}
          </span>
        </h3>

        <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
          <div className="w-full space-y-6 lg:w-7/12 2xl:pl-12">

            {/* Patient row */}
            <div>
              <div className="mb-2 text-sm font-medium text-base-content/70">Patient</div>
              {isTransitionLoading ? (
                <div className="w-full rounded-lg skeleton h-20" />
              ) : (
                <div className="p-4 rounded-lg border border-base-300">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 text-sm font-semibold rounded-full bg-primary/10 text-primary shrink-0">
                      {initials(patient.firstName, patient.lastName)}
                    </div>
                    <div>
                      <div className="text-sm font-semibold">
                        {patient.firstName} {patient.lastName}
                      </div>
                      <div className="text-xs text-base-content/50">{patient.hospitalId || '—'}</div>
                    </div>
                  </div>
                  <div className="pt-3 mt-3 border-t border-base-300">
                    {patientHmos.length === 0 ? (
                      <div className="text-xs text-base-content/50">No HMO plan on file</div>
                    ) : (
                      patientHmos.map((hmo) => <HmoPlanChip key={hmo.id} hmo={hmo} onDeleteHmo={onDeleteHmo} />)
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dependants grid */}
            <div>
              <div className="mb-2 text-sm font-medium text-base-content/70">
                Dependants {patient.dependants?.length > 0 ? `(${patient.dependants.length})` : ''}
              </div>
              {isTransitionLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="w-full rounded-lg skeleton h-32" />
                  ))}
                </div>
              ) : patient.dependants?.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {patient.dependants.map((dep) => {
                    const middleInitial = dep.middleName ? ` ${dep.middleName.charAt(0)}.` : '';
                    const fullName = `${dep.firstName || ''} ${dep.lastName || ''}${middleInitial}`.trim();
                    const dobFormatted = dep.dob ? formatNigeriaDate(dep.dob) : '—';
                    const relationship = dep.relationshipType || '—';
                    const depHmos = hmosByDependantId[dep.id] || [];

                    return (
                      <div key={dep.id} className={`p-4 rounded-lg border relative group transition-all ${dep.id === viewingDependantId ? 'border-primary ring-1 ring-primary/50 bg-primary/5' : 'border-base-300'}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold rounded-full bg-primary/10 text-primary shrink-0">
                              {initials(dep.firstName, dep.lastName)}
                            </div>
                            <div>
                              <div className="text-sm font-semibold flex items-center gap-2">
                                {fullName}
                                {dep.id === viewingDependantId && <span className="badge badge-primary badge-xs text-[10px]">Viewing</span>}
                              </div>
                              <div className="text-xs capitalize text-base-content/50">{relationship}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <div className="tooltip tooltip-primary tooltip-left" data-tip={`Add HMO for ${dep.firstName || 'dependant'}`}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs btn-circle text-primary"
                                onClick={() => onAddHmoForDependant(dep)}
                              >
                                <IoAddCircleOutline className="text-base" />
                              </button>
                            </div>
                            <div className="tooltip tooltip-primary tooltip-left" data-tip={`Edit HMO for ${dep.firstName || 'dependant'}`}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-xs btn-circle text-primary"
                                onClick={() => onEditHmoForDependant && onEditHmoForDependant(dep)}
                              >
                                <MdEditNote className="text-base" />
                              </button>
                            </div>
                            {onDeleteDependant && (
                              <div className="tooltip tooltip-error tooltip-left" data-tip="Delete Dependant">
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-xs btn-circle text-error/70 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => onDeleteDependant(dep)}
                                >
                                  <MdDeleteOutline className="text-base" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 mt-2 text-xs gap-y-1 gap-x-3 text-base-content/70">
                          <div>DOB: {dobFormatted}</div>
                          <div className="capitalize">Gender: {dep.gender || '—'}</div>
                        </div>

                        <div className="pt-3 mt-3 border-t border-base-300">
                          {depHmos.length === 0 ? (
                            <div className="text-xs text-base-content/50">No HMO plan</div>
                          ) : (
                            depHmos.map((hmo) => <HmoPlanChip key={hmo.id} hmo={hmo} onDeleteHmo={onDeleteHmo} />)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-base-content/50">No dependants</div>
              )}
            </div>
          </div>

          {/* Right column - Appointments (unchanged) */}
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
                      <div className="w-48 h-4 skeleton" />
                    ) : (
                      <p className="text-sm text-base-content/70">No upcoming appointment</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-base-content">Last Appointment:</h4>
                    {isTransitionLoading ? (
                      <div className="w-48 h-4 skeleton" />
                    ) : (
                      <p className="text-sm text-base-content/70">No previous appointment</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-base-content">Registration Date:</h4>
                    {isTransitionLoading ? (
                      <div className="w-40 h-4 skeleton" />
                    ) : (
                      <p className="text-sm text-base-content/70">{patient.createdAt ? formatNigeriaDate(patient.createdAt) : 'Not available'}</p>
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
};

export default HmoDependantsSection;