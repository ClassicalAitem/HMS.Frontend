import React, { useState } from 'react';
import { FaSave, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast';

const GeneralTab = () => {
  const [autoLogout, setAutoLogout] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [defaultLandingPage, setDefaultLandingPage] = useState('dashboard');

  const handleSaveSettings = () => {
    toast.success('General settings saved successfully!');
  };

  const handleResetToDefault = () => {
    setAutoLogout(true);
    setSessionTimeout(30);
    setDefaultLandingPage('dashboard');
    toast.info('Settings reset to default values');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-base-content">General Settings</h3>
      
      <div className="space-y-6">
        {/* Auto Log out */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-base-content">Auto Log out</h4>
            <p className="text-sm text-base-content/70">Automatically log out users after inactivity</p>
          </div>
          <input
            type="checkbox"
            checked={autoLogout}
            onChange={(e) => setAutoLogout(e.target.checked)}
            className="toggle toggle-primary"
          />
        </div>

        {/* Session Timeout */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium text-base-content">Session Timeout</h4>
            <span className="text-sm text-primary font-semibold">{sessionTimeout} minutes</span>
          </div>
          <p className="text-sm text-base-content/70 mb-4">Set the session timeout duration</p>
          <div className="space-y-2">
            <input
              type="range"
              min="5"
              max="120"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              className="range range-primary w-full"
            />
            <div className="flex justify-between text-xs text-base-content/50">
              <span>5 min</span>
              <span>120 min</span>
            </div>
          </div>
        </div>

        {/* Default Landing Page */}
        <div>
          <label className="block text-sm font-medium text-base-content/70 mb-2">
            Default Landing Page
          </label>
          <select
            value={defaultLandingPage}
            onChange={(e) => setDefaultLandingPage(e.target.value)}
            className="select select-bordered w-full"
          >
            <option value="dashboard">Dashboard</option>
            <option value="reports">Reports</option>
            <option value="users">Users</option>
            <option value="patients">Patients</option>
            <option value="appointments">Appointments</option>
            <option value="billing">Billing</option>
          </select>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-base-300">
        <button
          onClick={handleResetToDefault}
          className="btn btn-outline"
        >
          <FaUndo className="w-4 h-4 mr-2" />
          Reset to Default
        </button>
        <button
          onClick={handleSaveSettings}
          className="btn btn-primary"
        >
          <FaSave className="w-4 h-4 mr-2" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default GeneralTab;
