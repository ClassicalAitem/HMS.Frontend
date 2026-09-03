import React, { useEffect, useState } from 'react';
import { FaSave, FaUndo, FaClock, FaCheckCircle } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getSystemPreferences, updateSystemPreferences } from '@/services/api/settingsAPI';

const GeneralTab = () => {
  const [autoLogout, setAutoLogout] = useState(true);
  const [sessionTimeout, setSessionTimeout] = useState(180);
  const [defaultLandingPage, setDefaultLandingPage] = useState('dashboard');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await getSystemPreferences();
        const general = res?.data?.general || {};
        if (general.sessionTimeout) setSessionTimeout(general.sessionTimeout);
        if (general.autoLogout !== undefined) setAutoLogout(general.autoLogout);
        if (general.defaultLandingPage) setDefaultLandingPage(general.defaultLandingPage);
      } catch (err) {
        console.error('Failed to load system preferences:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      await updateSystemPreferences({
        general: {
          autoLogout,
          sessionTimeout,
          defaultLandingPage,
          hospitalTimezone: 'Africa/Lagos',
        },
      });
      toast.success('General operational preferences saved to database!');
    } catch (err) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = () => {
    setAutoLogout(true);
    setSessionTimeout(180);
    setDefaultLandingPage('dashboard');
    toast.info('Settings reset to default values (3 hours)');
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
            <span className="text-sm text-primary font-semibold">
              {sessionTimeout} minutes ({Math.round(sessionTimeout / 60 * 10) / 10} hours)
            </span>
          </div>
          <p className="text-sm text-base-content/70 mb-4">Set the session timeout duration before automatic logout</p>
          <div className="space-y-2">
            <input
              type="range"
              min="15"
              max="360"
              step="15"
              value={sessionTimeout}
              onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
              className="range range-primary w-full"
            />
            <div className="flex justify-between text-xs text-base-content/50">
              <span>15 min</span>
              <span>180 min (3 hrs)</span>
              <span>360 min (6 hrs)</span>
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
