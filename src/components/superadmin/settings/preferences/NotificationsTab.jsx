import React, { useState } from 'react';
import { FaSave, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast';

const NotificationsTab = () => {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(true);
  const [notificationFrequency, setNotificationFrequency] = useState('immediate');
  
  const [appointmentReminders, setAppointmentReminders] = useState(true);
  const [labResultsReady, setLabResultsReady] = useState(true);
  const [billingUpdates, setBillingUpdates] = useState(false);
  const [securityAlerts, setSecurityAlerts] = useState(true);
  const [systemMaintenance, setSystemMaintenance] = useState(true);
  const [reportGeneration, setReportGeneration] = useState(false);

  const handleSaveSettings = () => {
    toast.success('Notification settings saved successfully!');
  };

  const handleResetToDefault = () => {
    setEmailNotifications(true);
    setSmsNotifications(false);
    setSystemAlerts(true);
    setNotificationFrequency('immediate');
    setAppointmentReminders(true);
    setLabResultsReady(true);
    setBillingUpdates(false);
    setSecurityAlerts(true);
    setSystemMaintenance(true);
    setReportGeneration(false);
    toast.info('Settings reset to default values');
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-base-content">Notification Settings</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-base-content">General Notifications</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Email Notifications</h5>
                <p className="text-sm text-base-content/70">Receive notifications via email</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">SMS Notifications</h5>
                <p className="text-sm text-base-content/70">Receive notifications via SMS</p>
              </div>
              <input
                type="checkbox"
                checked={smsNotifications}
                onChange={(e) => setSmsNotifications(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">System Alerts</h5>
                <p className="text-sm text-base-content/70">Receive system-wide alerts</p>
              </div>
              <input
                type="checkbox"
                checked={systemAlerts}
                onChange={(e) => setSystemAlerts(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Notification Frequency
              </label>
              <select
                value={notificationFrequency}
                onChange={(e) => setNotificationFrequency(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="immediate">Immediate</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-base-content">Specific Notifications</h4>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Appointment Reminders</h5>
                <p className="text-sm text-base-content/70">Remind about upcoming appointments</p>
              </div>
              <input
                type="checkbox"
                checked={appointmentReminders}
                onChange={(e) => setAppointmentReminders(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Lab Results Ready</h5>
                <p className="text-sm text-base-content/70">Notify when lab results are available</p>
              </div>
              <input
                type="checkbox"
                checked={labResultsReady}
                onChange={(e) => setLabResultsReady(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Billing Updates</h5>
                <p className="text-sm text-base-content/70">Notify about billing changes</p>
              </div>
              <input
                type="checkbox"
                checked={billingUpdates}
                onChange={(e) => setBillingUpdates(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Security Alerts</h5>
                <p className="text-sm text-base-content/70">Alert about security events</p>
              </div>
              <input
                type="checkbox"
                checked={securityAlerts}
                onChange={(e) => setSecurityAlerts(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">System Maintenance</h5>
                <p className="text-sm text-base-content/70">Notify about maintenance windows</p>
              </div>
              <input
                type="checkbox"
                checked={systemMaintenance}
                onChange={(e) => setSystemMaintenance(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Report Generation</h5>
                <p className="text-sm text-base-content/70">Notify when reports are ready</p>
              </div>
              <input
                type="checkbox"
                checked={reportGeneration}
                onChange={(e) => setReportGeneration(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>
          </div>
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

export default NotificationsTab;
