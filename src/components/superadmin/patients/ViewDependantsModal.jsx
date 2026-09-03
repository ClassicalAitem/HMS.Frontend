import React from 'react';
import { FaUserFriends, FaTimes, FaBirthdayCake, FaVenusMars, FaIdCard, FaHeartbeat } from 'react-icons/fa';
import { formatNigeriaDate } from '@/utils/formatDateTimeUtils';

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? `${age} yrs` : 'N/A';
};

const ViewDependantsModal = ({ isOpen, onClose, patient }) => {
  if (!isOpen || !patient) return null;

  const dependants = patient.dependants || [];
  const primaryName = patient.fullName || `${patient.firstName || ''} ${patient.lastName || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="fixed inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-3xl bg-base-100 rounded-2xl shadow-2xl border border-base-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-primary/10 via-base-100 to-transparent border-b border-base-300 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-xl bg-primary text-primary-content shadow-md">
              <FaUserFriends className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-base-content">
                Family Dependants
              </h3>
              <p className="text-xs sm:text-sm text-base-content/70">
                Principal Patient: <span className="font-semibold text-primary">{primaryName}</span> ({patient.hospitalId || 'No ID'})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle text-base-content/70 hover:text-base-content"
          >
            <FaTimes className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Top Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-base-200/60 border border-base-300/60">
              <div className="text-xs text-base-content/60">Total Dependants</div>
              <div className="text-2xl font-extrabold text-primary mt-1">{dependants.length}</div>
            </div>
            <div className="p-3 rounded-xl bg-base-200/60 border border-base-300/60">
              <div className="text-xs text-base-content/60">Card Type</div>
              <div className="text-sm font-semibold text-base-content capitalize mt-1">{patient.cardType || 'Personal'}</div>
            </div>
            <div className="p-3 rounded-xl bg-base-200/60 border border-base-300/60">
              <div className="text-xs text-base-content/60">Family / Company</div>
              <div className="text-sm font-semibold text-base-content mt-1">{patient.familyName || patient.companyName || '—'}</div>
            </div>
          </div>

          {/* Dependants List */}
          {dependants.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-base-300 rounded-2xl bg-base-200/30">
              <FaUserFriends className="w-12 h-12 mx-auto text-base-content/30 mb-3" />
              <h4 className="text-base font-semibold text-base-content">No Dependants Registered</h4>
              <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
                No child, spouse, or secondary dependant records are currently linked under {primaryName}'s account.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
                Registered Family Members ({dependants.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dependants.map((dep, idx) => {
                  const depName = `${dep.firstName || ''} ${dep.middleName || ''} ${dep.lastName || ''}`.trim() || 'Unnamed Dependant';
                  const relationship = dep.relationshipType || dep.relationship || 'Dependant';
                  const age = calculateAge(dep.dob || dep.dateOfBirth);

                  return (
                    <div 
                      key={dep._id || dep.id || idx}
                      className="p-4 rounded-xl border border-base-300 bg-base-100 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base-content text-base">{depName}</span>
                            <span className="badge badge-sm badge-outline badge-primary capitalize font-medium">
                              {relationship}
                            </span>
                          </div>
                          <div className="text-xs text-base-content/60 mt-1 flex items-center gap-1">
                            <FaIdCard className="w-3 h-3 text-base-content/40" />
                            <span>ID: {dep.hospitalId || dep.dependantHospitalId || `${patient.hospitalId || 'HOS'}-D${idx + 1}`}</span>
                          </div>
                        </div>
                        <span className={`badge badge-sm ${dep.status?.toLowerCase() === 'active' ? 'badge-success' : 'badge-neutral'} capitalize`}>
                          {dep.status || 'Active'}
                        </span>
                      </div>

                      <div className="mt-3 pt-3 border-t border-base-200 grid grid-cols-2 gap-2 text-xs text-base-content/70">
                        <div className="flex items-center gap-1.5">
                          <FaVenusMars className="w-3.5 h-3.5 text-primary/70" />
                          <span className="capitalize">{dep.gender || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaBirthdayCake className="w-3.5 h-3.5 text-primary/70" />
                          <span>{age} ({dep.dob ? formatNigeriaDate(dep.dob) : 'No DOB'})</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-base-200/50 border-t border-base-300 flex justify-end">
          <button 
            onClick={onClose}
            className="btn btn-primary btn-sm px-6"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewDependantsModal;
