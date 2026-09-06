/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { FaTimes, FaShieldAlt, FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { addDependantForPatient } from '@/services/api/dependantAPI';
import { getErrorMessage } from '@/utils/errorHandler';

const HMO_PROVIDERS = [
  'Hygeia HMO',
  'Reliance HMO',
  'AXA Mansard Health',
  'Avon Healthcare',
  'Leadway Health',
  'Total Health Trust',
  'Novo Health Africa',
  'Clearline HMO',
  'Mediplan Healthcare',
  'Other',
];

const emptyDependant = {
  firstName: '',
  middleName: '',
  lastName: '',
  dob: '',
  gender: '',
  relationshipType: '',
  isHmo: false,
  hmo: {
    provider: '',
    memberId: '',
    plan: '',
    expiryDate: '',
  },
};

const AddDependantModal = ({ isOpen, onClose, patient, onSuccess }) => {
  const [dependants, setDependants] = useState([{ ...emptyDependant }]);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen || !patient) return null;

  const guardianHmos = (patient?.hmos || []).filter((h) => !h.dependantId);
  const primaryGuardianHmo = guardianHmos.length > 0 ? guardianHmos[0] : null;

  const handleChange = (index, field, value) => {
    setDependants((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleHmoToggle = (index, isChecked) => {
    setDependants((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              isHmo: isChecked,
              hmo: isChecked
                ? item.hmo
                : { provider: '', memberId: '', plan: '', expiryDate: '' },
            }
          : item
      )
    );
  };

  const handleHmoChange = (index, field, value) => {
    setDependants((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              hmo: { ...item.hmo, [field]: value },
            }
          : item
      )
    );
  };

  const handleCopyGuardianHmo = (index) => {
    if (!primaryGuardianHmo) return;
    const formattedExpiry = primaryGuardianHmo.expiresAt
      ? String(primaryGuardianHmo.expiresAt).split('T')[0]
      : '';

    setDependants((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              isHmo: true,
              hmo: {
                provider: primaryGuardianHmo.provider || '',
                memberId: primaryGuardianHmo.memberId || '',
                plan: primaryGuardianHmo.plan || '',
                expiryDate: formattedExpiry,
              },
            }
          : item
      )
    );
    toast.success('Copied Guardian HMO details');
  };

  const addRow = () => setDependants((prev) => [...prev, { ...emptyDependant }]);
  const removeRow = (index) => setDependants((prev) => prev.filter((_, i) => i !== index));

  const validate = () => {
    for (let i = 0; i < dependants.length; i++) {
      const d = dependants[i];
      const depNum = dependants.length > 1 ? ` (Dependant #${i + 1})` : '';

      if (!d.firstName?.trim() || !d.lastName?.trim() || !d.relationshipType) {
        return `Please fill first name, last name, and relationship type${depNum}`;
      }
      if (!d.dob) {
        return `Please select date of birth${depNum}`;
      }
      const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoPattern.test(d.dob)) return `Date of birth must be in YYYY-MM-DD format${depNum}`;
      const dateVal = new Date(d.dob);
      if (Number.isNaN(dateVal.getTime())) return `Invalid date of birth${depNum}`;

      if (!d.gender) {
        return `Please select gender${depNum}`;
      }

      if (d.isHmo) {
        if (!d.hmo?.provider?.trim()) {
          return `HMO Provider is required when HMO is enabled${depNum}`;
        }
        if (!d.hmo?.memberId?.trim()) {
          return `HMO Member ID is required when HMO is enabled${depNum}`;
        }
        if (!d.hmo?.plan?.trim()) {
          return `HMO Plan is required when HMO is enabled${depNum}`;
        }
        if (!d.hmo?.expiryDate) {
          return `HMO Expiry Date is required when HMO is enabled${depNum}`;
        }
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      toast.error(getErrorMessage(error));
      return;
    }

    setIsLoading(true);
    try {
      const patientId = patient.id || patient._id;
      const promises = dependants.map((dep) => {
        const payload = {
          firstName: dep.firstName.trim(),
          middleName: dep.middleName?.trim() || undefined,
          lastName: dep.lastName.trim(),
          dob: dep.dob,
          gender: dep.gender,
          relationshipType: dep.relationshipType,
        };

        if (dep.isHmo && dep.hmo?.provider && dep.hmo?.memberId) {
          payload.hmos = [
            {
              provider: dep.hmo.provider.trim(),
              memberId: dep.hmo.memberId.trim(),
              plan: dep.hmo.plan?.trim() || 'Standard',
              expiresAt: dep.hmo.expiryDate,
            },
          ];
        }

        return addDependantForPatient(patientId, payload);
      });

      const promise = Promise.all(promises);
      toast.promise(
        promise,
        {
          loading: `Adding ${dependants.length} dependant${dependants.length > 1 ? 's' : ''}...`,
          success: 'Dependants added successfully',
          error: (err) => getErrorMessage(err, 'Failed to add dependants'),
        },
        { duration: 3000 }
      );

      await promise;
      onSuccess && onSuccess();
      onClose();
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => onClose();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={handleCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl card bg-base-100">
        <div className="p-6 card-body">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-2xl font-bold text-base-content">Add Dependant</h2>
              <p className="text-xs text-base-content/70">
                Register dependants for {patient.firstName} {patient.lastName} ({patient.cardNo})
              </p>
            </div>
            <button type="button" onClick={handleCancel} className="btn btn-ghost btn-sm btn-circle">
              <FaTimes className="w-4 h-4" />
            </button>
          </div>

          {/* Guardian HMO info banner */}
          {primaryGuardianHmo && (
            <div className="p-3 mb-4 rounded-lg bg-info/10 border border-info/20 flex items-start gap-3">
              <FaShieldAlt className="text-info w-5 h-5 mt-0.5 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-info">Guardian has HMO Coverage: </span>
                <span className="font-medium text-base-content">
                  {primaryGuardianHmo.provider} ({primaryGuardianHmo.plan || 'Standard'}) — ID: {primaryGuardianHmo.memberId}
                </span>
                <p className="text-base-content/70 mt-0.5">
                  To cover a dependant under this HMO, toggle the HMO switch below and click &quot;Copy Guardian HMO Details&quot;.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              {dependants.map((dep, index) => (
                <div key={index} className="p-4 border rounded-xl border-base-300 bg-base-100 space-y-4">
                  <div className="flex justify-between items-center border-b border-base-200 pb-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-base-content/80">
                      Dependant #{index + 1}
                    </h3>
                    {dependants.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => removeRow(index)}
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-base-content/70">
                        First Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full input input-bordered input-sm"
                        value={dep.firstName}
                        onChange={(e) => handleChange(index, 'firstName', e.target.value)}
                        placeholder="First Name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-base-content/70">Middle Name</label>
                      <input
                        type="text"
                        className="w-full input input-bordered input-sm"
                        value={dep.middleName}
                        onChange={(e) => handleChange(index, 'middleName', e.target.value)}
                        placeholder="Middle Name"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-base-content/70">
                        Last Name <span className="text-error">*</span>
                      </label>
                      <input
                        type="text"
                        className="w-full input input-bordered input-sm"
                        value={dep.lastName}
                        onChange={(e) => handleChange(index, 'lastName', e.target.value)}
                        placeholder="Last Name"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 text-xs font-medium text-base-content/70">
                        Date of Birth <span className="text-error">*</span>
                      </label>
                      <input
                        type="date"
                        className="w-full input input-bordered input-sm"
                        value={dep.dob}
                        onChange={(e) => handleChange(index, 'dob', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-base-content/70">
                        Gender <span className="text-error">*</span>
                      </label>
                      <select
                        className="w-full select select-bordered select-sm"
                        value={dep.gender}
                        onChange={(e) => handleChange(index, 'gender', e.target.value)}
                        required
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-medium text-base-content/70">
                        Relationship Type <span className="text-error">*</span>
                      </label>
                      <select
                        className="w-full select select-bordered select-sm"
                        value={dep.relationshipType}
                        onChange={(e) => handleChange(index, 'relationshipType', e.target.value)}
                        required
                      >
                        <option value="">Select relationship</option>
                        <option value="child">Child</option>
                        <option value="spouse">Spouse</option>
                        <option value="mother">Mother</option>
                        <option value="father">Father</option>
                        <option value="sibling">Sibling</option>
                        <option value="others">Others</option>
                      </select>
                    </div>
                  </div>

                  {/* HMO Toggle & Details for Dependant */}
                  <div className="mt-3 pt-3 border-t border-base-200">
                    <div className="flex items-center justify-between p-2.5 rounded-lg bg-base-200/50">
                      <div className="flex items-center gap-2">
                        <FaShieldAlt className={dep.isHmo ? 'text-primary' : 'text-base-content/40'} />
                        <div>
                          <span className="text-xs font-semibold">Cover Dependant Under HMO?</span>
                          <span className="block text-[11px] text-base-content/60">
                            {dep.isHmo ? 'HMO details must be completed before saving' : 'Dependant will be registered as Self-Pay'}
                          </span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={dep.isHmo}
                        onChange={(e) => handleHmoToggle(index, e.target.checked)}
                      />
                    </div>

                    {dep.isHmo && (
                      <div className="mt-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <FaShieldAlt className="w-3.5 h-3.5" /> HMO Insurance Information
                          </span>
                          {primaryGuardianHmo && (
                            <button
                              type="button"
                              onClick={() => handleCopyGuardianHmo(index)}
                              className="btn btn-outline btn-primary btn-xs flex items-center gap-1"
                            >
                              <FaCopy className="w-3 h-3" /> Copy Guardian HMO
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block mb-1 text-xs font-medium text-base-content/70">
                              HMO Provider <span className="text-error">*</span>
                            </label>
                            <input
                              type="text"
                              list={`hmo-providers-${index}`}
                              className="w-full input input-bordered input-sm bg-base-100"
                              value={dep.hmo.provider}
                              onChange={(e) => handleHmoChange(index, 'provider', e.target.value)}
                              placeholder="e.g., Hygeia HMO"
                              required={dep.isHmo}
                            />
                            <datalist id={`hmo-providers-${index}`}>
                              {HMO_PROVIDERS.map((p) => (
                                <option key={p} value={p} />
                              ))}
                            </datalist>
                          </div>

                          <div>
                            <label className="block mb-1 text-xs font-medium text-base-content/70">
                              HMO Member ID / Enrollee ID <span className="text-error">*</span>
                            </label>
                            <input
                              type="text"
                              className="w-full input input-bordered input-sm bg-base-100"
                              value={dep.hmo.memberId}
                              onChange={(e) => handleHmoChange(index, 'memberId', e.target.value)}
                              placeholder="e.g., HYG-987654"
                              required={dep.isHmo}
                            />
                          </div>

                          <div>
                            <label className="block mb-1 text-xs font-medium text-base-content/70">
                              Plan Type <span className="text-error">*</span>
                            </label>
                            <input
                              type="text"
                              list="hmo-plan-types"
                              className="w-full input input-bordered input-sm bg-base-100"
                              value={dep.hmo.plan}
                              onChange={(e) => handleHmoChange(index, 'plan', e.target.value)}
                              placeholder="e.g., Gold, Standard"
                              required={dep.isHmo}
                            />
                            <datalist id="hmo-plan-types">
                              <option value="Bronze" />
                              <option value="Silver" />
                              <option value="Gold" />
                              <option value="Platinum" />
                              <option value="Corporate" />
                              <option value="Standard" />
                            </datalist>
                          </div>

                          <div>
                            <label className="block mb-1 text-xs font-medium text-base-content/70">
                              HMO Expiry Date <span className="text-error">*</span>
                            </label>
                            <input
                              type="date"
                              className="w-full input input-bordered input-sm bg-base-100"
                              value={dep.hmo.expiryDate}
                              onChange={(e) => handleHmoChange(index, 'expiryDate', e.target.value)}
                              required={dep.isHmo}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <button type="button" className="btn btn-outline btn-sm" onClick={addRow}>
                + Add Another Dependant
              </button>
              <div className="space-x-2">
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleCancel} disabled={isLoading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Dependant(s)'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDependantModal;