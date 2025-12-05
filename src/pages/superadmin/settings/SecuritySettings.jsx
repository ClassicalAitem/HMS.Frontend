import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaShieldAlt, FaKey, FaUserShield, FaLock, FaEye, FaEyeSlash, FaSave, FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const SecuritySettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('password-policy');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const sections = [
    { id: 'password-policy', label: 'Password Policy', icon: FaKey },
    { id: 'two-factor', label: 'Two-Factor Authentication', icon: FaShieldAlt },
    { id: 'session-management', label: 'Session Management', icon: FaUserShield },
    { id: 'access-control', label: 'Access Control', icon: FaLock }
  ];

  // Sample data for access control
  const accessRules = [
    {
      id: 1,
      name: 'Admin Access',
      description: 'Full system access for administrators',
      permissions: ['read', 'write', 'delete', 'admin'],
      status: 'Active'
    },
    {
      id: 2,
      name: 'Doctor Access',
      description: 'Medical records and patient management',
      permissions: ['read', 'write'],
      status: 'Active'
    },
    {
      id: 3,
      name: 'Nurse Access',
      description: 'Patient care and basic records',
      permissions: ['read', 'write'],
      status: 'Active'
    },
    {
      id: 4,
      name: 'Front Desk Access',
      description: 'Patient registration and appointments',
      permissions: ['read', 'write'],
      status: 'Active'
    }
  ];

  const handleSavePasswordPolicy = () => {
    toast.success('Password policy updated successfully!');
  };

  const handleSaveTwoFactor = () => {
    toast.success('Two-factor authentication settings updated!');
  };

  const handleSaveSessionManagement = () => {
    toast.success('Session management settings updated!');
  };

  const handleChangePassword = () => {
    toast.success('Password changed successfully!');
  };

  const renderPasswordPolicy = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Minimum Password Length
          </label>
          <input
            type="number"
            defaultValue="8"
            className="input input-bordered w-full"
            min="6"
            max="32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Maximum Password Age (days)
          </label>
          <input
            type="number"
            defaultValue="90"
            className="input input-bordered w-full"
            min="30"
            max="365"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-base-content">Password Requirements</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Require uppercase letters (A-Z)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Require lowercase letters (a-z)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Require numbers (0-9)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Require special characters (!@#$%^&*)</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Prevent password reuse (last 5 passwords)</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSavePasswordPolicy} className="btn btn-primary">
          <FaSave className="w-4 h-4 mr-2" />
          Save Password Policy
        </button>
      </div>
    </div>
  );

  const renderTwoFactor = () => (
    <div className="space-y-6">
      <div className="bg-primary/10 p-6 rounded-lg">
        <h4 className="text-lg font-semibold text-primary mb-2">Two-Factor Authentication</h4>
        <p className="text-base-content/70 mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <div className="flex items-center space-x-3">
          <input type="checkbox" defaultChecked className="toggle toggle-primary" />
          <span className="text-base-content">Enable Two-Factor Authentication</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Authentication Method
          </label>
          <select className="select select-bordered w-full">
            <option value="sms">SMS</option>
            <option value="email">Email</option>
            <option value="app">Authenticator App</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Backup Codes
          </label>
          <div className="flex space-x-2">
            <button className="btn btn-outline">Generate New Codes</button>
            <button className="btn btn-outline">Download Codes</button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSaveTwoFactor} className="btn btn-primary">
          <FaSave className="w-4 h-4 mr-2" />
          Save 2FA Settings
        </button>
      </div>
    </div>
  );

  const renderSessionManagement = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Session Timeout (minutes)
          </label>
          <input
            type="number"
            defaultValue="30"
            className="input input-bordered w-full"
            min="5"
            max="480"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Maximum Concurrent Sessions
          </label>
          <input
            type="number"
            defaultValue="3"
            className="input input-bordered w-full"
            min="1"
            max="10"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-base-content">Session Security</h4>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Force logout on password change</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Require re-authentication for sensitive operations</span>
          </label>
          <label className="flex items-center space-x-3">
            <input type="checkbox" defaultChecked className="checkbox checkbox-primary" />
            <span className="text-base-content">Log all login attempts</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end">
        <button onClick={handleSaveSessionManagement} className="btn btn-primary">
          <FaSave className="w-4 h-4 mr-2" />
          Save Session Settings
        </button>
      </div>
    </div>
  );

  const renderAccessControl = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-base-content">Access Control Rules</h4>
        <button className="btn btn-primary">
          <FaPlus className="w-4 h-4 mr-2" />
          Add New Rule
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th className="text-base-content/70">Rule Name</th>
              <th className="text-base-content/70">Description</th>
              <th className="text-base-content/70">Permissions</th>
              <th className="text-base-content/70">Status</th>
              <th className="text-base-content/70">Actions</th>
            </tr>
          </thead>
          <tbody>
            {accessRules.map((rule) => (
              <tr key={rule.id}>
                <td>
                  <div className="font-medium text-base-content">
                    {rule.name}
                  </div>
                </td>
                <td>
                  <div className="text-base-content/70">
                    {rule.description}
                  </div>
                </td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {rule.permissions.map((permission) => (
                      <span key={permission} className="badge badge-outline badge-sm">
                        {permission}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className={`badge ${
                    rule.status === 'Active' ? 'badge-success' : 'badge-error'
                  }`}>
                    {rule.status}
                  </span>
                </td>
                <td>
                  <div className="flex space-x-2">
                    <button className="btn btn-ghost btn-sm text-primary hover:bg-primary/10">
                      <FaEdit className="w-4 h-4" />
                    </button>
                    <button className="btn btn-ghost btn-sm text-error hover:bg-error/10">
                      <FaTrash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderChangePassword = () => (
    <div className="bg-base-200 p-6 rounded-lg">
      <h4 className="text-lg font-semibold text-base-content mb-4">Change Admin Password</h4>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Current Password
          </label>
          <div className="relative">
            <input
              type={showCurrentPassword ? 'text' : 'password'}
              className="input input-bordered w-full pr-10"
              placeholder="Enter current password"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
            >
              {showCurrentPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            New Password
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? 'text' : 'password'}
              className="input input-bordered w-full pr-10"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
            >
              {showNewPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              className="input input-bordered w-full pr-10"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content"
            >
              {showConfirmPassword ? <FaEyeSlash className="w-4 h-4" /> : <FaEye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={handleChangePassword} className="btn btn-primary">
            <FaKey className="w-4 h-4 mr-2" />
            Change Password
          </button>
        </div>
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
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onCloseSidebar={closeSidebar} />
      </div>
      
      {/* Main Content */}
      <div className="flex overflow-hidden flex-col flex-1">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-6 h-full">
          {/* Page Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate('/superadmin/settings')}
              className="flex items-center text-base-content/70 hover:text-primary transition-colors mb-4"
            >
              <FaArrowLeft className="w-4 h-4 mr-2" />
              Back to Settings
            </button>
            <h1 className="text-3xl font-bold text-primary">Security Settings</h1>
            <p className="text-base-content/70">Configure security policies and access controls</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="p-4 rounded-lg shadow-lg bg-base-100">
                <h3 className="mb-4 text-lg font-semibold text-base-content">Security Categories</h3>
                <div className="space-y-2">
                  {sections.map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                          activeSection === section.id
                            ? 'bg-primary text-primary-content'
                            : 'text-base-content/70 hover:bg-base-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium">{section.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              <div className="p-6 rounded-lg shadow-lg bg-base-100">
                {renderActiveSection()}
              </div>
            </div>
          </div>

          {/* Change Password Section */}
          <div className="mt-6">
            {renderChangePassword()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecuritySettings;
