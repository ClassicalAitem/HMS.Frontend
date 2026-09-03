import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import {
  FaArrowLeft,
  FaShieldAlt,
  FaKey,
  FaUserShield,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaSave,
  FaCheckCircle,
  FaUsers,
  FaUserCheck,
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getSecuritySettings, updateSecuritySettings } from '@/services/api/settingsAPI';
import { usersAPI } from '@/services/api/usersAPI';
import { showErrorToast } from '@/utils/errorHandler';

const HOSPITAL_ROLES_PERMISSIONS = [
  {
    role: 'super-admin',
    name: 'Super Administrator',
    description: 'Complete unrestricted hospital root control, DB configs, security policies',
    permissions: ['ALL_ACCESS', 'AUDIT_LOGS', 'SECURITY_POLICY', 'STAFF_MANAGEMENT'],
  },
  {
    role: 'admin',
    name: 'Hospital Administrator',
    description: 'Facility operations, staff directory, departments, and clinical ward setup',
    permissions: ['DEPARTMENTS', 'WARDS', 'STAFF_MANAGEMENT', 'REPORTS'],
  },
  {
    role: 'medical-director',
    name: 'Medical Director',
    description: 'Clinical oversight, doctor scheduling, theatre protocols, and approvals',
    permissions: ['CLINICAL_APPROVALS', 'THEATRE_OVERSIGHT', 'PATIENT_EMR', 'REPORTS'],
  },
  {
    role: 'doctor',
    name: 'Consultant / Doctor',
    description: 'Outpatient consultations, clinical diagnoses, prescriptions, and lab orders',
    permissions: ['CONSULTATIONS', 'PATIENT_EMR', 'PRESCRIPTIONS', 'LAB_REQUESTS'],
  },
  {
    role: 'surgeon',
    name: 'Surgeon / Surgical Specialist',
    description: 'Operating theatre procedures, pre/post-op surgical notes, and theatre bookings',
    permissions: ['THEATRE_OPS', 'SURGICAL_NOTES', 'SURGERY_APPOINTMENTS', 'PATIENT_EMR'],
  },
  {
    role: 'nurse',
    name: 'Nursing Officer',
    description: 'Triage vital signs, inpatient ward medication administration, bed management',
    permissions: ['VITALS_TRIAGE', 'WARD_CARE', 'MEDICATION_ADMIN', 'PATIENT_EMR'],
  },
  {
    role: 'pharmacist',
    name: 'Pharmacist',
    description: 'Dispense prescribed medication, manage pharmaceutical inventory and restock',
    permissions: ['PHARMACY_DISPENSE', 'DRUG_INVENTORY', 'RESTOCK_ORDERS'],
  },
  {
    role: 'lab-technician',
    name: 'Laboratory Technician',
    description: 'Execute laboratory investigations, diagnostic scans, and enter test results',
    permissions: ['LAB_INVESTIGATIONS', 'TEST_RESULTS', 'LAB_INVENTORY'],
  },
  {
    role: 'cashier',
    name: 'Billing & Cashier',
    description: 'Create hospital bills, generate official receipts, process POS/cash/transfer payments',
    permissions: ['BILLING_INVOICE', 'RECEIPT_GENERATION', 'PAYMENT_COLLECTION'],
  },
  {
    role: 'receptionist',
    name: 'Reception & Front Desk',
    description: 'Patient biometric registration, appointment bookings, queue dispatch',
    permissions: ['PATIENT_REGISTRATION', 'APPOINTMENTS', 'FRONT_DESK_QUEUE'],
  },
  {
    role: 'hmo',
    name: 'HMO & Insurance Officer',
    description: 'Verify health insurance pre-authorizations, corporate claims, and tariff limits',
    permissions: ['HMO_CLAIMS', 'PRE_AUTHORIZATION', 'TARIFF_AUDIT'],
  },
];

const SecuritySettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('password-policy');

  // Password Policy State
  const [minLength, setMinLength] = useState(8);
  const [maxAgeDays, setMaxAgeDays] = useState(90);
  const [requireUppercase, setRequireUppercase] = useState(true);
  const [requireLowercase, setRequireLowercase] = useState(true);
  const [requireNumbers, setRequireNumbers] = useState(true);
  const [requireSpecialChars, setRequireSpecialChars] = useState(true);
  const [preventReuse, setPreventReuse] = useState(true);

  // Session & 2FA State
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(180);
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState(3);
  const [forceLogoutOnPasswordChange, setForceLogoutOnPasswordChange] = useState(true);
  const [logAllLogins, setLogAllLogins] = useState(true);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState('email');

  // Live Users & Role Counts
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // Change Password Form State
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const navigate = useNavigate();
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  // Fetch live security policy & live staff users
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [secRes, usersRes] = await Promise.all([
          getSecuritySettings(),
          usersAPI.getUsers({ limit: 500 }),
        ]);

        if (secRes?.data) {
          const pp = secRes.data.passwordPolicy || {};
          if (pp.minLength) setMinLength(pp.minLength);
          if (pp.maxAgeDays) setMaxAgeDays(pp.maxAgeDays);
          if (pp.requireUppercase !== undefined) setRequireUppercase(pp.requireUppercase);
          if (pp.requireLowercase !== undefined) setRequireLowercase(pp.requireLowercase);
          if (pp.requireNumbers !== undefined) setRequireNumbers(pp.requireNumbers);
          if (pp.requireSpecialChars !== undefined) setRequireSpecialChars(pp.requireSpecialChars);

          const sm = secRes.data.sessionManagement || {};
          if (sm.sessionTimeoutMinutes) setSessionTimeoutMinutes(sm.sessionTimeoutMinutes);
          if (sm.maxConcurrentSessions) setMaxConcurrentSessions(sm.maxConcurrentSessions);
          if (sm.forceLogoutOnPasswordChange !== undefined)
            setForceLogoutOnPasswordChange(sm.forceLogoutOnPasswordChange);
          if (sm.logAllLogins !== undefined) setLogAllLogins(sm.logAllLogins);

          const tfa = secRes.data.twoFactor || {};
          if (tfa.enabled !== undefined) setTwoFactorEnabled(tfa.enabled);
          if (tfa.method) setTwoFactorMethod(tfa.method);
        }

        const uList = usersRes?.data?.data ?? usersRes?.data ?? [];
        setUsersList(Array.isArray(uList) ? uList : []);
      } catch (err) {
        console.error('Failed to load security configurations:', err);
      }
    };
    fetchData();
  }, []);

  // Compute live active counts per role
  const userCountsByRole = useMemo(() => {
    const map = {};
    usersList.forEach((u) => {
      const role = String(u.accountType || u.role || '').toLowerCase();
      map[role] = (map[role] || 0) + 1;
    });
    return map;
  }, [usersList]);

  const handleSaveSecurityPolicy = async () => {
    try {
      setSavingPolicy(true);
      await updateSecuritySettings({
        passwordPolicy: {
          minLength: Number(minLength),
          maxAgeDays: Number(maxAgeDays),
          requireUppercase,
          requireLowercase,
          requireNumbers,
          requireSpecialChars,
          preventReuse,
        },
        sessionManagement: {
          sessionTimeoutMinutes: Number(sessionTimeoutMinutes),
          maxConcurrentSessions: Number(maxConcurrentSessions),
          forceLogoutOnPasswordChange,
          logAllLogins,
        },
        twoFactor: {
          enabled: twoFactorEnabled,
          method: twoFactorMethod,
        },
      });
      toast.success('Hospital security & session policy saved successfully!');
    } catch (err) {
      showErrorToast(err, 'Failed to update security policies');
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      toast.error('Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < minLength) {
      toast.error(`New password must be at least ${minLength} characters`);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setChangingPassword(true);
      await usersAPI.resetUserPassword({
        currentPassword,
        newPassword,
      });
      toast.success('Admin password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showErrorToast(err, 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const sections = [
    { id: 'password-policy', label: 'Password Policy', icon: FaKey },
    { id: 'session-management', label: 'Session & Timeout (3 hrs)', icon: FaUserShield },
    { id: 'two-factor', label: 'Two-Factor Auth (2FA)', icon: FaShieldAlt },
    { id: 'access-control', label: 'Role-Based Access Matrix', icon: FaLock },
  ];

  const renderPasswordPolicy = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-base-200 pb-3">
        <div>
          <h4 className="text-base font-bold text-base-content">Password Security Requirements</h4>
          <p className="text-xs text-base-content/60">Configure institutional password complexity rules across all staff accounts</p>
        </div>
        <span className="badge badge-primary badge-sm font-semibold">Hospital Standard</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1.5">
            Minimum Password Length
          </label>
          <input
            type="number"
            value={minLength}
            onChange={(e) => setMinLength(Number(e.target.value))}
            className="input input-bordered input-sm rounded-xl w-full"
            min="6"
            max="32"
          />
          <span className="text-[11px] text-base-content/50 mt-1 block">Recommended: 8-16 characters</span>
        </div>
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1.5">
            Maximum Password Age (days)
          </label>
          <input
            type="number"
            value={maxAgeDays}
            onChange={(e) => setMaxAgeDays(Number(e.target.value))}
            className="input input-bordered input-sm rounded-xl w-full"
            min="30"
            max="365"
          />
          <span className="text-[11px] text-base-content/50 mt-1 block">Forces rotation every {maxAgeDays} days</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <h5 className="text-xs font-bold uppercase tracking-wider text-base-content/60">Character Complexity Rules</h5>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-3 p-3 rounded-xl border border-base-200 bg-base-200/30 cursor-pointer hover:bg-base-200/60 transition-colors">
            <input
              type="checkbox"
              checked={requireUppercase}
              onChange={(e) => setRequireUppercase(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="text-xs font-medium text-base-content">Require uppercase letters (A-Z)</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-base-200 bg-base-200/30 cursor-pointer hover:bg-base-200/60 transition-colors">
            <input
              type="checkbox"
              checked={requireLowercase}
              onChange={(e) => setRequireLowercase(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="text-xs font-medium text-base-content">Require lowercase letters (a-z)</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-base-200 bg-base-200/30 cursor-pointer hover:bg-base-200/60 transition-colors">
            <input
              type="checkbox"
              checked={requireNumbers}
              onChange={(e) => setRequireNumbers(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="text-xs font-medium text-base-content">Require numerical digits (0-9)</span>
          </label>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-base-200 bg-base-200/30 cursor-pointer hover:bg-base-200/60 transition-colors">
            <input
              type="checkbox"
              checked={requireSpecialChars}
              onChange={(e) => setRequireSpecialChars(e.target.checked)}
              className="checkbox checkbox-primary checkbox-sm"
            />
            <span className="text-xs font-medium text-base-content">Require special characters (!@#$%^&*)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-base-200">
        <button
          onClick={handleSaveSecurityPolicy}
          disabled={savingPolicy}
          className="btn btn-primary btn-sm rounded-xl px-5 shadow-sm shadow-primary/20"
        >
          {savingPolicy ? <span className="loading loading-spinner loading-xs"></span> : <FaSave className="w-3.5 h-3.5 mr-1.5" />}
          Save Password Policy
        </button>
      </div>
    </div>
  );

  const renderSessionManagement = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-base-200 pb-3">
        <div>
          <h4 className="text-base font-bold text-base-content">Session Lifetime & Timeout Controls</h4>
          <p className="text-xs text-base-content/60">Configured to 180 minutes (3 hours) for continuous clinical workflows</p>
        </div>
        <span className="badge badge-success badge-sm font-semibold">3 Hours Configured</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1.5">
            Session Timeout Duration (Minutes)
          </label>
          <input
            type="number"
            value={sessionTimeoutMinutes}
            onChange={(e) => setSessionTimeoutMinutes(Number(e.target.value))}
            className="input input-bordered input-sm rounded-xl w-full"
            min="15"
            max="720"
          />
          <span className="text-[11px] text-primary font-medium mt-1 block">
            = {Math.round(sessionTimeoutMinutes / 60 * 10) / 10} hours before inactivity logout
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1.5">
            Max Concurrent Devices per Account
          </label>
          <input
            type="number"
            value={maxConcurrentSessions}
            onChange={(e) => setMaxConcurrentSessions(Number(e.target.value))}
            className="input input-bordered input-sm rounded-xl w-full"
            min="1"
            max="10"
          />
          <span className="text-[11px] text-base-content/50 mt-1 block">Active workstation logins permitted</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <label className="flex items-center gap-3 p-3 rounded-xl border border-base-200 bg-base-200/30 cursor-pointer hover:bg-base-200/60 transition-colors">
          <input
            type="checkbox"
            checked={forceLogoutOnPasswordChange}
            onChange={(e) => setForceLogoutOnPasswordChange(e.target.checked)}
            className="checkbox checkbox-primary checkbox-sm"
          />
          <div>
            <div className="text-xs font-semibold text-base-content">Force invalidate other sessions upon password change</div>
            <div className="text-[11px] text-base-content/60">Terminates open desktop and mobile sessions immediately</div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-xl border border-base-200 bg-base-200/30 cursor-pointer hover:bg-base-200/60 transition-colors">
          <input
            type="checkbox"
            checked={logAllLogins}
            onChange={(e) => setLogAllLogins(e.target.checked)}
            className="checkbox checkbox-primary checkbox-sm"
          />
          <div>
            <div className="text-xs font-semibold text-base-content">Log all authentication attempts into Audit Trail</div>
            <div className="text-[11px] text-base-content/60">Records timestamp, IP address, user role, and status</div>
          </div>
        </label>
      </div>

      <div className="flex justify-end pt-4 border-t border-base-200">
        <button
          onClick={handleSaveSecurityPolicy}
          disabled={savingPolicy}
          className="btn btn-primary btn-sm rounded-xl px-5 shadow-sm shadow-primary/20"
        >
          {savingPolicy ? <span className="loading loading-spinner loading-xs"></span> : <FaSave className="w-3.5 h-3.5 mr-1.5" />}
          Save Session Policy
        </button>
      </div>
    </div>
  );

  const renderTwoFactor = () => (
    <div className="space-y-6">
      <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
        <h4 className="text-sm font-bold text-primary mb-1">Two-Factor Authentication (2FA)</h4>
        <p className="text-xs text-base-content/70 mb-3">
          Protect superadmin and clinical credentials with multi-factor OTP verification.
        </p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={twoFactorEnabled}
            onChange={(e) => setTwoFactorEnabled(e.target.checked)}
            className="toggle toggle-primary toggle-sm"
          />
          <span className="text-xs font-semibold text-base-content">
            {twoFactorEnabled ? '2FA Protection Enabled' : '2FA Protection Disabled'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-base-content/70 mb-1.5">
            OTP Dispatch Channel
          </label>
          <select
            value={twoFactorMethod}
            onChange={(e) => setTwoFactorMethod(e.target.value)}
            className="select select-bordered select-sm rounded-xl w-full"
          >
            <option value="email">Institutional Email</option>
            <option value="sms">SMS Hotline</option>
            <option value="app">Authenticator App (TOTP)</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-base-200">
        <button
          onClick={handleSaveSecurityPolicy}
          disabled={savingPolicy}
          className="btn btn-primary btn-sm rounded-xl px-5 shadow-sm shadow-primary/20"
        >
          {savingPolicy ? <span className="loading loading-spinner loading-xs"></span> : <FaSave className="w-3.5 h-3.5 mr-1.5" />}
          Save 2FA Settings
        </button>
      </div>
    </div>
  );

  const renderAccessControl = () => (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-base-200 pb-3">
        <div>
          <h4 className="text-base font-bold text-base-content flex items-center gap-2">
            <FaLock className="text-primary w-4 h-4" /> Role-Based Access Control (RBAC) Matrix
          </h4>
          <p className="text-xs text-base-content/60">Live personnel counts & authorized functional scope per hospital role</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-primary badge-sm font-semibold">{usersList.length} Staff Enrolled</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-base-200">
        <table className="table table-zebra w-full text-xs">
          <thead className="bg-base-200/60 font-semibold uppercase text-base-content/70">
            <tr>
              <th className="py-2.5 px-3">Role & Function</th>
              <th className="py-2.5 px-3">Active Personnel</th>
              <th className="py-2.5 px-3">Authorized Permissions</th>
              <th className="py-2.5 px-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-200">
            {HOSPITAL_ROLES_PERMISSIONS.map((r) => {
              const count = userCountsByRole[r.role] || 0;
              return (
                <tr key={r.role} className="hover:bg-base-200/40">
                  <td className="py-3 px-3">
                    <div className="font-bold text-base-content text-xs">{r.name}</div>
                    <div className="text-[11px] text-base-content/60">{r.description}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="badge badge-sm badge-neutral font-bold gap-1">
                      <FaUsers className="w-2.5 h-2.5" /> {count} users
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-sm">
                      {r.permissions.map((p) => (
                        <span key={p} className="badge badge-ghost badge-xs text-[10px] font-mono">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span className="badge badge-success badge-xs font-semibold">Active</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'password-policy':
        return renderPasswordPolicy();
      case 'two-factor':
        return renderTwoFactor();
      case 'session-management':
        return renderSessionManagement();
      case 'access-control':
        return renderAccessControl();
      default:
        return renderPasswordPolicy();
    }
  };

  return (
    <div className="flex h-screen bg-base-300/20">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-opacity-50 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>

      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1">
        <Header onToggleSidebar={toggleSidebar} />

        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 h-full space-y-6">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/superadmin/settings')}
                className="flex items-center text-xs font-semibold text-base-content/70 hover:text-primary transition-colors mb-2"
              >
                <FaArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back to Settings
              </button>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Security & Access Policies</h1>
                <span className="badge badge-primary badge-sm font-semibold">Institutional Governance</span>
              </div>
              <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
                Configure credential standards, 3-hour session rules, role-based access controls, and admin authentication
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="p-3 bg-base-100 rounded-2xl border border-base-200 shadow-sm space-y-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/50 block px-3 py-2">
                  Security Modules
                </span>
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                        isActive
                          ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
                          : 'text-base-content/70 hover:bg-base-200 hover:text-base-content'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span>{section.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="p-6 bg-base-100 rounded-2xl border border-base-200 shadow-sm">
                {renderActiveSection()}
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-6 space-y-4">
            <div className="border-b border-base-200 pb-3">
              <h4 className="text-base font-bold text-base-content flex items-center gap-2">
                <FaKey className="text-primary w-4 h-4" /> Change Super Admin Password
              </h4>
              <p className="text-xs text-base-content/60">Ensure you use a strong, unique passphrase with symbols and numbers</p>
            </div>

            <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input input-bordered input-sm rounded-xl w-full pr-9 text-xs"
                    placeholder="Current password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showCurrentPassword ? <FaEyeSlash className="w-3.5 h-3.5" /> : <FaEye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input input-bordered input-sm rounded-xl w-full pr-9 text-xs"
                    placeholder="New strong password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showNewPassword ? <FaEyeSlash className="w-3.5 h-3.5" /> : <FaEye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-base-content/70 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input input-bordered input-sm rounded-xl w-full pr-9 text-xs"
                    placeholder="Repeat new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showConfirmPassword ? <FaEyeSlash className="w-3.5 h-3.5" /> : <FaEye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={changingPassword}
                  className="btn btn-primary btn-sm rounded-xl px-5 shadow-sm shadow-primary/20"
                >
                  {changingPassword ? <span className="loading loading-spinner loading-xs"></span> : <FaKey className="w-3.5 h-3.5 mr-1.5" />}
                  Update Master Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
