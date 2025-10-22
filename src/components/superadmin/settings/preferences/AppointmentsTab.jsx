import React, { useState } from 'react';
import { FaSave, FaUndo } from 'react-icons/fa';
import toast from 'react-hot-toast';

const AppointmentsTab = () => {
  const [defaultDuration, setDefaultDuration] = useState('30');
  const [advanceBookingLimit, setAdvanceBookingLimit] = useState('30');
  const [cancellationWindow, setCancellationWindow] = useState('2');
  const [autoConfirmAppointments, setAutoConfirmAppointments] = useState(false);
  
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('17:00');
  const [lunchBreak, setLunchBreak] = useState('12:00');
  const [workingDays, setWorkingDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false
  });

  const handleSaveSettings = () => {
    toast.success('Appointment settings saved successfully!');
  };

  const handleResetToDefault = () => {
    setDefaultDuration('30');
    setAdvanceBookingLimit('30');
    setCancellationWindow('2');
    setAutoConfirmAppointments(false);
    setStartTime('08:00');
    setEndTime('17:00');
    setLunchBreak('12:00');
    setWorkingDays({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false
    });
    toast.info('Settings reset to default values');
  };

  const handleWorkingDayChange = (day) => {
    setWorkingDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-base-content">Appointment Settings</h3>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Appointment Settings */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-base-content">Appointment Settings</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Default Appointment Duration
              </label>
              <select
                value={defaultDuration}
                onChange={(e) => setDefaultDuration(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Advance Booking Limit
              </label>
              <select
                value={advanceBookingLimit}
                onChange={(e) => setAdvanceBookingLimit(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="7">7 days</option>
                <option value="14">14 days</option>
                <option value="30">30 days</option>
                <option value="60">60 days</option>
                <option value="90">90 days</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Cancellation Window
              </label>
              <select
                value={cancellationWindow}
                onChange={(e) => setCancellationWindow(e.target.value)}
                className="select select-bordered w-full"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
                <option value="2">2 hours</option>
                <option value="4">4 hours</option>
                <option value="24">24 hours</option>
              </select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium text-base-content">Auto Confirm Appointments</h5>
                <p className="text-sm text-base-content/70">Automatically confirm new appointments</p>
              </div>
              <input
                type="checkbox"
                checked={autoConfirmAppointments}
                onChange={(e) => setAutoConfirmAppointments(e.target.checked)}
                className="toggle toggle-primary"
              />
            </div>
          </div>
        </div>

        {/* Right Column - Working Hours */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-base-content">Working Hours</h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Start Time
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="select select-bordered w-full"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                End Time
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="select select-bordered w-full"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-2">
                Lunch Break
              </label>
              <select
                value={lunchBreak}
                onChange={(e) => setLunchBreak(e.target.value)}
                className="select select-bordered w-full"
              >
                {Array.from({ length: 24 }, (_, i) => {
                  const hour = i.toString().padStart(2, '0');
                  return (
                    <option key={hour} value={`${hour}:00`}>
                      {hour}:00
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-base-content/70 mb-3">
                Working Days
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'monday', label: 'Monday' },
                  { key: 'tuesday', label: 'Tuesday' },
                  { key: 'wednesday', label: 'Wednesday' },
                  { key: 'thursday', label: 'Thursday' },
                  { key: 'friday', label: 'Friday' },
                  { key: 'saturday', label: 'Saturday' },
                  { key: 'sunday', label: 'Sunday' }
                ].map((day) => (
                  <label key={day.key} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={workingDays[day.key]}
                      onChange={() => handleWorkingDayChange(day.key)}
                      className="checkbox checkbox-primary"
                    />
                    <span className="text-sm text-base-content">{day.label}</span>
                  </label>
                ))}
              </div>
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

export default AppointmentsTab;
