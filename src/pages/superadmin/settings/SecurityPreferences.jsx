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
            <h1 className="text-3xl font-bold text-primary">Security Preferences</h1>
            <p className="text-base-content/70">Configure system preferences and settings</p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex space-x-1 bg-base-200 p-1 rounded-lg">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-content'
                        : 'text-base-content/70 hover:text-base-content hover:bg-base-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1">
            <div className="bg-base-100 rounded-lg shadow-lg p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPreferences;
