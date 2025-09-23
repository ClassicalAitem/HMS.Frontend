/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaCog, FaSave, FaDatabase, FaShieldAlt, FaBell, FaPalette, FaGlobe } from 'react-icons/fa';

const SuperAdminSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    hospitalName: 'Kolak Hospital',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
    language: 'en',
    notifications: {
      email: true,
      sms: false,
      push: true
    },
    security: {
      twoFactor: true,
      sessionTimeout: 30,
      passwordPolicy: 'strong'
    },
    system: {
      autoBackup: true,
      backupFrequency: 'daily',
      maintenanceMode: false
    }
  });

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const handleSettingChange = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: value
      }
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // Handle save logic here
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaCog },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Security', icon: FaShieldAlt },
    { id: 'system', label: 'System', icon: FaDatabase },
    { id: 'appearance', label: 'Appearance', icon: FaPalette }
  ];

  return (
    <div className="flex h-screen">
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
      <div className="flex overflow-hidden flex-col flex-1 bg-base-300/20">
        {/* Header */}
        <Header onToggleSidebar={toggleSidebar} />
        
        {/* Page Content */}
        <div className="flex overflow-y-auto flex-col p-2 py-1 h-full sm:p-6 sm:py-4">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary 2xl:text-4xl">System Settings</h1>
            <p className="text-sm text-base-content/70 2xl:text-base">Configure system-wide settings and preferences</p>
          </div>

          <div className="max-w-6xl">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
              {/* Settings Navigation */}
              <div className="lg:col-span-1">
                <div className="p-4 rounded-lg shadow-lg bg-base-100">
                  <h3 className="mb-4 text-lg font-semibold text-base-content">Settings Categories</h3>
                  <div className="space-y-2">
                    {tabs.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            activeTab === tab.id
                              ? 'bg-primary text-primary-content'
                              : 'text-base-content/70 hover:bg-base-200'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Settings Content */}
              <div className="lg:col-span-3">
                <div className="p-6 rounded-lg shadow-lg bg-base-100">
                  {/* General Settings */}
                  {activeTab === 'general' && (
                    <div>
                      <h2 className="mb-6 text-xl font-semibold text-base-content">General Settings</h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Hospital Name</label>
                          <input
                            type="text"
                            value={settings.hospitalName}
                            onChange={(e) => setSettings(prev => ({ ...prev, hospitalName: e.target.value }))}
                            className="input input-bordered w-full"
                          />
                        </div>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <label className="block mb-2 text-sm font-medium text-base-content">Timezone</label>
                            <select
                              value={settings.timezone}
                              onChange={(e) => setSettings(prev => ({ ...prev, timezone: e.target.value }))}
                              className="select select-bordered w-full"
                            >
                              <option value="Africa/Lagos">Africa/Lagos</option>
                              <option value="UTC">UTC</option>
                              <option value="America/New_York">America/New_York</option>
                              <option value="Europe/London">Europe/London</option>
                            </select>
                          </div>
                          <div>
                            <label className="block mb-2 text-sm font-medium text-base-content">Date Format</label>
                            <select
                              value={settings.dateFormat}
                              onChange={(e) => setSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                              className="select select-bordered w-full"
                            >
                              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Language</label>
                          <select
                            value={settings.language}
                            onChange={(e) => setSettings(prev => ({ ...prev, language: e.target.value }))}
                            className="select select-bordered w-full"
                          >
                            <option value="en">English</option>
                            <option value="fr">French</option>
                            <option value="es">Spanish</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notifications Settings */}
                  {activeTab === 'notifications' && (
                    <div>
                      <h2 className="mb-6 text-xl font-semibold text-base-content">Notification Settings</h2>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base-content">Email Notifications</h3>
                            <p className="text-sm text-base-content/70">Receive notifications via email</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.email}
                            onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                            className="toggle toggle-primary"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base-content">SMS Notifications</h3>
                            <p className="text-sm text-base-content/70">Receive notifications via SMS</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.sms}
                            onChange={(e) => handleSettingChange('notifications', 'sms', e.target.checked)}
                            className="toggle toggle-primary"
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base-content">Push Notifications</h3>
                            <p className="text-sm text-base-content/70">Receive push notifications in browser</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.notifications.push}
                            onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                            className="toggle toggle-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Settings */}
                  {activeTab === 'security' && (
                    <div>
                      <h2 className="mb-6 text-xl font-semibold text-base-content">Security Settings</h2>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base-content">Two-Factor Authentication</h3>
                            <p className="text-sm text-base-content/70">Require 2FA for all users</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.security.twoFactor}
                            onChange={(e) => handleSettingChange('security', 'twoFactor', e.target.checked)}
                            className="toggle toggle-primary"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Session Timeout (minutes)</label>
                          <input
                            type="number"
                            value={settings.security.sessionTimeout}
                            onChange={(e) => handleSettingChange('security', 'sessionTimeout', parseInt(e.target.value))}
                            className="input input-bordered w-full"
                            min="5"
                            max="480"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Password Policy</label>
                          <select
                            value={settings.security.passwordPolicy}
                            onChange={(e) => handleSettingChange('security', 'passwordPolicy', e.target.value)}
                            className="select select-bordered w-full"
                          >
                            <option value="basic">Basic (6+ characters)</option>
                            <option value="medium">Medium (8+ characters, mixed case)</option>
                            <option value="strong">Strong (8+ characters, numbers, symbols)</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* System Settings */}
                  {activeTab === 'system' && (
                    <div>
                      <h2 className="mb-6 text-xl font-semibold text-base-content">System Settings</h2>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base-content">Automatic Backup</h3>
                            <p className="text-sm text-base-content/70">Enable automatic system backups</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.system.autoBackup}
                            onChange={(e) => handleSettingChange('system', 'autoBackup', e.target.checked)}
                            className="toggle toggle-primary"
                          />
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Backup Frequency</label>
                          <select
                            value={settings.system.backupFrequency}
                            onChange={(e) => handleSettingChange('system', 'backupFrequency', e.target.value)}
                            className="select select-bordered w-full"
                          >
                            <option value="hourly">Hourly</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
                            <option value="monthly">Monthly</option>
                          </select>
                        </div>
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-base-content">Maintenance Mode</h3>
                            <p className="text-sm text-base-content/70">Put system in maintenance mode</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings.system.maintenanceMode}
                            onChange={(e) => handleSettingChange('system', 'maintenanceMode', e.target.checked)}
                            className="toggle toggle-primary"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Appearance Settings */}
                  {activeTab === 'appearance' && (
                    <div>
                      <h2 className="mb-6 text-xl font-semibold text-base-content">Appearance Settings</h2>
                      <div className="space-y-6">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Default Theme</label>
                          <div className="grid grid-cols-2 gap-4">
                            <button className="btn btn-outline">Light</button>
                            <button className="btn btn-outline">Dark</button>
                          </div>
                        </div>
                        <div>
                          <label className="block mb-2 text-sm font-medium text-base-content">Primary Color</label>
                          <div className="flex space-x-2">
                            <button className="w-8 h-8 rounded-full bg-green-500 border-2 border-primary"></button>
                            <button className="w-8 h-8 rounded-full bg-blue-500 border-2 border-transparent"></button>
                            <button className="w-8 h-8 rounded-full bg-purple-500 border-2 border-transparent"></button>
                            <button className="w-8 h-8 rounded-full bg-red-500 border-2 border-transparent"></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="flex justify-end pt-6 mt-6 border-t border-base-300">
                    <button
                      onClick={handleSave}
                      className="btn btn-primary"
                    >
                      <FaSave className="w-4 h-4 mr-2" />
                      Save Settings
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
