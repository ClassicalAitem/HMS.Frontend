import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/layouts/superadmin';
import { FaArrowLeft, FaHospital, FaBuilding, FaBed, FaShieldAlt } from 'react-icons/fa';
import HospitalInfoTab from '@/components/superadmin/settings/HospitalInfoTab';
import DepartmentsTab from '@/components/superadmin/settings/DepartmentsTab';
import WardsTab from '@/components/superadmin/settings/WardsTab';

const HospitalSetup = () => {
  const [activeTab, setActiveTab] = useState('hospital-info');
  const navigate = useNavigate();

  const tabs = [
    { id: 'hospital-info', label: 'Hospital Info', icon: FaHospital },
    { id: 'departments', label: 'Departments', icon: FaBuilding },
    { id: 'wards', label: 'Wards & Beds', icon: FaBed },
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
              <FaHospital className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-base-content">
                  Hospital Setup & Facilities
                </h1>
                <span className="badge badge-xs badge-success gap-1 text-[11px] font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active Facilities
                </span>
              </div>
              <p className="text-xs text-base-content/60">
                Institutional profile, clinical departments, heads of department, and inpatient admission wards
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-2 bg-base-200/60 px-3 py-1.5 rounded-xl border border-base-300/40 text-xs text-base-content/80 font-medium">
            <FaShieldAlt className="w-3.5 h-3.5 text-primary" />
            <span>Facility Registry</span>
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

        {/* Active Tab Content */}
        <div>{renderTabContent()}</div>
      </div>
    </SuperAdminLayout>
  );
};

export default HospitalSetup;
