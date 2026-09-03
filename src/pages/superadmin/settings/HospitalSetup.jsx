import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaHospital, FaBuilding, FaBed } from 'react-icons/fa';
import HospitalInfoTab from '@/components/superadmin/settings/HospitalInfoTab';
import DepartmentsTab from '@/components/superadmin/settings/DepartmentsTab';
import WardsTab from '@/components/superadmin/settings/WardsTab';

const HospitalSetup = () => {
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('hospital-info');
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const tabs = [
    { id: 'hospital-info', label: 'Hospital Info', icon: FaHospital },
    { id: 'departments', label: 'Departments', icon: FaBuilding },
    { id: 'wards', label: 'Wards', icon: FaBed }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'hospital-info':
        return <HospitalInfoTab />;
      case 'departments':
        return <DepartmentsTab />;
      case 'wards':
        return <WardsTab />;
      default:
        return <HospitalInfoTab />;
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
        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 h-full space-y-5">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <button
                onClick={() => navigate('/superadmin/settings')}
                className="flex items-center text-xs font-semibold text-base-content/70 hover:text-primary transition-colors mb-2"
              >
                <FaArrowLeft className="w-3.5 h-3.5 mr-1.5" />
                Back to Settings
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Hospital Setup & Facilities</h1>
              <p className="text-xs sm:text-sm text-base-content/70">Configure hospital administrative profile, clinical departments, and inpatient wards</p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-base-200/60 p-1.5 rounded-2xl border border-base-300/60 w-fit">
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
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalSetup;
