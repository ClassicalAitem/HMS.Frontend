import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { SuperAdminLayout } from '@/layouts/superadmin';
import {
  FaUserPlus,
  FaUser,
  FaEnvelope,
  FaPhoneAlt,
  FaLock,
  FaShieldAlt,
  FaEye,
  FaEyeSlash,
  FaUndo,
  FaSave,
  FaCheckCircle,
  FaInfoCircle,
  FaUserTag,
  FaIdCard,
} from 'react-icons/fa';
import { usersAPI } from '@/services/api/usersAPI';
import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

// Validation schema
const registrationSchema = yup.object({
  firstName: yup
    .string()
    .required('First name is required')
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name must not exceed 50 characters'),

  lastName: yup
    .string()
    .required('Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name must not exceed 50 characters'),

  email: yup
    .string()
    .required('Email address is required')
    .email('Please enter a valid email address'),

  phone: yup
    .string()
    .required('Phone number is required')
    .min(7, 'Phone number must be at least 7 characters'),

  role: yup
    .string()
    .required('Role selection is required')
    .oneOf(
      [
        'admin',
        'doctor',
        'medical-director',
        'nurse',
        'front-desk',
        'cashier',
        'accountant',
        'account-officer',
        'medical-laboratory',
        'lab-technician',
        'surgeon',
        'pharmacist',
        'hmo',
        'sonographer',
        'human-resource',
        'hr',
      ],
      'Please select a valid role'
    ),

  password: yup
    .string()
    .required('Password is required')
    .min(6, 'Password must be at least 6 characters')
    .max(50, 'Password must not exceed 50 characters'),

  confirmPassword: yup
    .string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password'), null], 'Passwords do not match'),
});

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Administrator', badge: 'Admin', desc: 'Full administrative access, staff configuration, system audits' },
  { value: 'medical-director', label: 'Medical Director', badge: 'Clinical Lead', desc: 'Clinical oversight, discount approvals, surgical reviews' },
  { value: 'doctor', label: 'Doctor', badge: 'Clinical', desc: 'Patient consultations, diagnosis, clinical notes, prescriptions' },
  { value: 'surgeon', label: 'Surgeon', badge: 'Surgery', desc: 'Pre-op assessments, theater scheduling, surgical operations' },
  { value: 'nurse', label: 'Nurse', badge: 'Inpatient Care', desc: 'Vitals tracking, bed allocations, nursing notes, triage' },
  { value: 'front-desk', label: 'Front Desk', badge: 'Reception', desc: 'Patient intake, appointment booking, check-in registration' },
  { value: 'cashier', label: 'Cashier / Billing', badge: 'Finance', desc: 'Payment collections, receipt issuances, POS & transfers clearance' },
  { value: 'accountant', label: 'Accountant', badge: 'Accounts', desc: 'Hospital revenue streams, expenses, cashbook ledger, and stock balance' },
  { value: 'pharmacist', label: 'Pharmacist', badge: 'Pharmacy', desc: 'Prescription dispensing, drug inventory stock tracking' },
  { value: 'medical-laboratory', label: 'Medical Laboratory', badge: 'Diagnostics', desc: 'Lab test execution, sample processing, results certification' },
  { value: 'sonographer', label: 'Sonographer', badge: 'Ultrasound', desc: 'Ultrasound scanning, imaging reports, diagnostic sonography' },
  { value: 'hmo', label: 'HMO Officer', badge: 'Insurance', desc: 'Health insurance claims, HMO verification and tariff audits' },
  { value: 'human-resource', label: 'Human Resources (HR)', badge: 'Staff Operations', desc: 'Staff leave tracking, shift roster governance, personnel records' },
];

const SuperAdminRegistration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(registrationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      role: '',
      password: '',
      confirmPassword: '',
    },
  });

  const watchedRole = watch('role');
  const selectedRoleMeta = ROLE_OPTIONS.find((r) => r.value === watchedRole);

  const onSubmit = async (data) => {
    setIsLoading(true);

    try {
      const userData = {
        firstName: data.firstName.trim(),
        lastName: data.lastName.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone.trim(),
        role: data.role,
        password: data.password,
      };

      if (data.role === 'admin' || data.role === 'human-resource' || data.role === 'hr') {
        await usersAPI.createAdmin(userData);
      } else {
        await usersAPI.createUser(userData);
      }

      toast.success(`${selectedRoleMeta?.label || data.role} registered successfully!`);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to register staff account'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset();
    toast.info('Registration form reset');
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 pb-12 max-w-6xl mx-auto">
        {/* Sleek Modern Header Bar */}
        <div className="bg-base-100 border border-base-200/80 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
              <FaUserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-base-content">
                  Staff Account Registration
                </h1>
                <span className="badge badge-xs badge-success gap-1 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Directory
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Onboard clinical, operational, and administrative staff with role-based permission boundaries
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300/40 text-xs text-base-content/80 font-medium">
            <FaShieldAlt className="w-3.5 h-3.5 text-primary" />
            <span>Encrypted Provisioning</span>
          </div>
        </div>

        {/* =========================================================================
            MAIN FORM CARD
            ========================================================================= */}
        <div className="bg-base-100 rounded-3xl shadow-sm border border-base-200 overflow-hidden">
          {/* Card Header */}
          <div className="px-6 sm:px-8 py-5 border-b border-base-200/80 bg-base-200/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                <FaIdCard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-base-content">Personnel Intake Form</h2>
                <p className="text-xs text-base-content/60">Complete all required fields below to create a secure active account</p>
              </div>
            </div>
            {isDirty && (
              <span className="badge badge-warning badge-sm gap-1 font-medium">
                Unsaved Changes
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="p-6 sm:p-8 space-y-8">
            {/* SECTION 1: Personal Identity */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-5 rounded-full bg-primary" />
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                  1. Staff Identity
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* First Name */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                      <FaUser className="w-3 h-3 text-base-content/50" />
                      First Name <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Oluwaseun"
                    className={`input input-bordered w-full rounded-xl transition-colors ${
                      errors.firstName ? 'input-error focus:border-error' : 'focus:border-primary'
                    }`}
                    {...register('firstName')}
                    disabled={isLoading}
                  />
                  {errors.firstName && (
                    <span className="text-xs text-error mt-1 flex items-center gap-1">
                      <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.firstName.message}
                    </span>
                  )}
                </div>

                {/* Last Name */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                      <FaUser className="w-3 h-3 text-base-content/50" />
                      Last Name / Surname <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Adebayo"
                    className={`input input-bordered w-full rounded-xl transition-colors ${
                      errors.lastName ? 'input-error focus:border-error' : 'focus:border-primary'
                    }`}
                    {...register('lastName')}
                    disabled={isLoading}
                  />
                  {errors.lastName && (
                    <span className="text-xs text-error mt-1 flex items-center gap-1">
                      <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.lastName.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Contact Information */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-5 rounded-full bg-primary" />
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                  2. Contact & Communications
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Email Address */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                      <FaEnvelope className="w-3 h-3 text-base-content/50" />
                      Email Address (Login ID) <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. staff.member@kolakhospital.com"
                    className={`input input-bordered w-full rounded-xl transition-colors ${
                      errors.email ? 'input-error focus:border-error' : 'focus:border-primary'
                    }`}
                    {...register('email')}
                    disabled={isLoading}
                  />
                  {errors.email ? (
                    <span className="text-xs text-error mt-1 flex items-center gap-1">
                      <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.email.message}
                    </span>
                  ) : (
                    <span className="text-[11px] text-base-content/50 mt-1">
                      Used for authentication and system alerts
                    </span>
                  )}
                </div>

                {/* Phone Number */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                      <FaPhoneAlt className="w-3 h-3 text-base-content/50" />
                      Phone Number <span className="text-error">*</span>
                    </span>
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 801 234 5678"
                    className={`input input-bordered w-full rounded-xl transition-colors ${
                      errors.phone ? 'input-error focus:border-error' : 'focus:border-primary'
                    }`}
                    {...register('phone')}
                    disabled={isLoading}
                  />
                  {errors.phone && (
                    <span className="text-xs text-error mt-1 flex items-center gap-1">
                      <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.phone.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 3: Role & Department Assignment */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-5 rounded-full bg-primary" />
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                  3. System Role & Department Assignment
                </h3>
              </div>

              <div className="form-control">
                <label className="label py-1">
                  <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                    <FaUserTag className="w-3 h-3 text-base-content/50" />
                    Assigned Role & Privilege Tier <span className="text-error">*</span>
                  </span>
                </label>
                <select
                  className={`select select-bordered w-full rounded-xl transition-colors text-sm ${
                    errors.role ? 'select-error focus:border-error' : 'focus:border-primary'
                  }`}
                  {...register('role')}
                  disabled={isLoading}
                >
                  <option value="">Select organizational role...</option>
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label} — [{opt.badge}]
                    </option>
                  ))}
                </select>
                {errors.role && (
                  <span className="text-xs text-error mt-1 flex items-center gap-1">
                    <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                    {errors.role.message}
                  </span>
                )}
              </div>

              {/* Dynamic Role Capability Card */}
              {selectedRoleMeta && (
                <div className="mt-4 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-start gap-3.5 transition-all">
                  <div className="w-8 h-8 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                    <FaShieldAlt className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-primary">
                        {selectedRoleMeta.label}
                      </span>
                      <span className="badge badge-sm badge-primary badge-outline text-[10px] font-semibold">
                        {selectedRoleMeta.badge}
                      </span>
                    </div>
                    <p className="text-xs text-base-content/80 leading-relaxed">
                      {selectedRoleMeta.desc}
                    </p>
                    {(watchedRole === 'admin' || watchedRole === 'human-resource' || watchedRole === 'hr') && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                        • This user will be created via the privileged administrative gateway with administrative audit privileges.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 4: Security & Authentication */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-5 rounded-full bg-primary" />
                <h3 className="text-sm font-bold text-base-content uppercase tracking-wider">
                  4. Security & Access Credentials
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Password */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                      <FaLock className="w-3 h-3 text-base-content/50" />
                      Initial Password <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 6 characters"
                      className={`input input-bordered w-full pr-10 rounded-xl transition-colors ${
                        errors.password ? 'input-error focus:border-error' : 'focus:border-primary'
                      }`}
                      {...register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                      tabIndex={-1}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-xs text-error mt-1 flex items-center gap-1">
                      <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.password.message}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="form-control">
                  <label className="label py-1">
                    <span className="label-text font-semibold text-xs text-base-content flex items-center gap-1.5">
                      <FaLock className="w-3 h-3 text-base-content/50" />
                      Confirm Password <span className="text-error">*</span>
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Re-enter password"
                      className={`input input-bordered w-full pr-10 rounded-xl transition-colors ${
                        errors.confirmPassword ? 'input-error focus:border-error' : 'focus:border-primary'
                      }`}
                      {...register('confirmPassword')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content transition-colors"
                      tabIndex={-1}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-xs text-error mt-1 flex items-center gap-1">
                      <FaInfoCircle className="w-3 h-3 flex-shrink-0" />
                      {errors.confirmPassword.message}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* FORM ACTIONS */}
            <div className="pt-6 border-t border-base-200 flex flex-col sm:flex-row items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                className="btn btn-outline btn-sm sm:btn-md rounded-xl w-full sm:w-auto px-6 gap-2"
              >
                <FaUndo className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-sm sm:btn-md rounded-xl w-full sm:w-auto px-8 gap-2 shadow-sm text-white"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    <span>Registering Staff...</span>
                  </>
                ) : (
                  <>
                    <FaSave className="w-4 h-4" />
                    <span>Register Staff Member</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SuperAdminRegistration;
