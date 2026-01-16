import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { QuickActionCard, SettingCard } from '@/components/superadmin/settings';
import { 
  FaUserPlus, 
  FaFileAlt, 
  FaShieldAlt, 
  FaBell, 
  FaUsers, 
  FaHospital, 
  FaCreditCard, 
  FaClipboardList, 
  FaCog 
} from 'react-icons/fa';

const SuperAdminSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const quickActions = [
    {
      icon: FaUserPlus,
      label: 'Add New User',
      onClick: () => navigate('/superadmin/users')
    },
    {
      icon: FaFileAlt,
      label: 'Generate Report',
      onClick: () => navigate('/superadmin/reports')
    },
    {
      icon: FaShieldAlt,
      label: 'Security Scan',
      onClick: () => console.log('Security Scan clicked')
    },
    {
      icon: FaBell,
      label: 'Notifications',
      onClick: () => console.log('Notifications clicked')
    }
  ];

  const systemSettings = [
    {
      icon: FaUsers,
      title: 'User & Role Management',
      description: 'Manage users, roles, and permissions across the system',
      onClick: () => navigate('/superadmin/users')
    },
    {
      icon: FaHospital,
      title: 'Hospital Setup',
      description: 'Configure hospital information, departments, and wards',
      onClick: () => navigate('/superadmin/settings/hospital-setup')
    },
    {
      icon: FaShieldAlt,
      title: 'Security',
      description: 'Configure security settings and access controls',
      onClick: () => navigate('/superadmin/settings/security')
    },
    {
      icon: FaCreditCard,
      title: 'Billing & Finance',
      description: 'Manage billing, transactions, and financial reports',
      onClick: () => navigate('/superadmin/settings/billing-finance')
    },
    {
      icon: FaClipboardList,
      title: 'Audit Logs',
      description: 'View system activity and audit trails',
      onClick: () => navigate('/superadmin/settings/audit-logs')
    },
    {
      icon: FaCog,
      title: 'System Preferences',
      description: 'Configure system-wide settings and preferences',
      onClick: () => navigate('/superadmin/settings/security-preferences')
    },
    {
      icon: FaCog,
      title: 'Medical Data',
      description: 'Setup medical prescriptions, allergy, etc.',
      onClick: () => navigate('/superadmin/settings/medical-data')
    },
    {
      icon: FaCog,
      title: 'Pharmacy Inventory',
      description: 'Setup  pharmacy inventory data, etc.',
      onClick: () => navigate('/superadmin/settings/pharmacy-inventory')
    }
  ];

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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary">Settings</h1>
            <p className="text-base-content/70">Manage your system settings and preferences</p>
          </div>

          {/* Quick Actions Section */}
          <div className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-base-content">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {quickActions.map((action, index) => (
                <QuickActionCard
                  key={index}
                  icon={action.icon}
                  label={action.label}
                  onClick={action.onClick}
                />
              ))}
            </div>
          </div>

          {/* System Settings Section */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-base-content">System Settings</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systemSettings.map((setting, index) => (
                <SettingCard
                  key={index}
                  icon={setting.icon}
                  title={setting.title}
                  description={setting.description}
                  onClick={setting.onClick}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;
