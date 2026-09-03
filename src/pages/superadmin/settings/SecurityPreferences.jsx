import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaCog, FaBell, FaCalendarAlt } from 'react-icons/fa';
import { GeneralTab, NotificationsTab, AppointmentsTab } from '@/components/superadmin/settings/preferences';

const SecurityPreferences = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaCog },
    { id: 'notifications', label: 'Notifications', icon: FaBell },
    { id: 'appointments', label: 'Appointments', icon: FaCalendarAlt }
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
    <div className="flex h-screen bg-base-300/20">
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-opacity-50 lg:hidden"
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
              className="flex items-center text-xs font-semibold text-base-content/70 hover:text-primary transition-colors mb-2"
            >
              <FaArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              Back to Settings
            </button>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">System Preferences</h1>
              <span className="badge badge-primary badge-sm font-semibold">Hospital Rules</span>
            </div>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">Configure system-wide operational rules, automated session timeouts, and notifications</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-base-200/60 p-1.5 rounded-2xl border border-base-300/60 w-fit mb-6">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary text-primary-content shadow-sm shadow-primary/30'
                      : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <div className="bg-base-100 rounded-2xl shadow-sm border border-base-200 p-6 sm:p-8">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPreferences;
