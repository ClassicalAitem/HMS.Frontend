import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { FaArrowLeft, FaCog, FaBell, FaCalendarAlt, FaShieldAlt, FaSlidersH } from 'react-icons/fa';
import { GeneralTab, NotificationsTab, AppointmentsTab } from '@/components/superadmin/settings/preferences';

const SecurityPreferences = () => {
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  const tabs = [
    { id: 'general', label: 'General Hospital Rules', icon: FaCog },
    { id: 'notifications', label: 'Alerts & Notifications', icon: FaBell },
    { id: 'appointments', label: 'Appointment Scheduling', icon: FaCalendarAlt },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'appointments':
        return <AppointmentsTab />;
      default:
        return <GeneralTab />;
    }
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Sleek Modern Header Bar */}
        <div className="bg-base-100 border border-base-200/80 px-5 py-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/superadmin/settings')}
              className="btn btn-ghost btn-sm btn-square rounded-xl text-base-content/70 hover:text-primary hover:bg-base-200"
              title="Back to Settings"
            >
              <FaArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black shrink-0">
              <FaSlidersH className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-base-content">
                  System Preferences
                </h1>
                <span className="badge badge-xs badge-success gap-1 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Policy Engine
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Operational hospital policies, automatic session logout countdowns, and clinical booking limits
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300/40 text-xs text-base-content/80 font-medium">
            <FaShieldAlt className="w-3.5 h-3.5 text-primary" />
            <span>Policy Governance</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2 bg-base-200/70 p-1.5 rounded-2xl border border-base-300/60 w-fit">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all gap-2 ${
                  isActive
                    ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
                    : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 sm:p-8">
          {renderTabContent()}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default SecurityPreferences;
