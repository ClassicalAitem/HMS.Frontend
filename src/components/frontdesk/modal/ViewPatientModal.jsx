import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const initials = (firstName = '', lastName = '') =>
  `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || '?';

const ViewPatientModal = ({ patientId, patient }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const dependants = patient?.dependants || [];
  const hasDependants = dependants.length > 0;

  const goTo = (subject) => {
    setIsOpen(false);
    if (subject.type === 'dependant') {
      navigate(location.pathname, {
        state: { dependantId: subject.id, dependantSnapshot: subject.raw },
      });
    } else {
      // Back to the guardian patient — clear dependant context
      navigate(location.pathname, { state: {} });
    }
  };

  const open = () => {
    if (!hasDependants) {
      // Nothing to pick — just (re)view the patient themself
      goTo({ type: 'patient', id: patientId });
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <button className="btn btn-outline btn-primary m-3" onClick={open}>
        View Patient
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60" onClick={() => setIsOpen(false)} />
          <div className="relative z-10 w-full max-w-md shadow-xl card bg-base-100">
            <div className="p-6 card-body">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-base-content">Who do you want to view?</h2>
                <button className="btn btn-ghost btn-xs btn-circle" onClick={() => setIsOpen(false)}>✕</button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {/* Patient option */}
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                  onClick={() => goTo({ type: 'patient', id: patientId })}
                >
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                    {initials(patient?.firstName, patient?.lastName)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {`${patient?.firstName || ''} ${patient?.lastName || ''}`.trim() || 'Patient'}
                    </div>
                    <div className="text-xs text-base-content/50">{patient?.hospitalId || 'Patient'}</div>
                  </div>
                  <span className="badge badge-ghost badge-sm shrink-0">Patient</span>
                </button>

                {/* Dependant options */}
                {dependants.map((dep) => (
                  <button
                    key={dep.id}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border border-base-300 hover:border-primary hover:bg-primary/5 transition-all text-left"
                    onClick={() => goTo({ type: 'dependant', id: dep.id, raw: dep })}
                  >
                    <div className="w-9 h-9 rounded-full bg-secondary/10 text-secondary flex items-center justify-center text-xs font-bold shrink-0">
                      {initials(dep.firstName, dep.lastName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">
                        {`${dep.firstName || ''} ${dep.lastName || ''}`.trim()}
                      </div>
                      <div className="text-xs text-base-content/50 capitalize">{dep.relationshipType || 'Dependant'}</div>
                    </div>
                    <span className="badge badge-ghost badge-sm shrink-0">Dependant</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ViewPatientModal;