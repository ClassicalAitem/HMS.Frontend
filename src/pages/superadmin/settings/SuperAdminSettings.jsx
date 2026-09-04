import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { 
  FaUserPlus, 
  FaFileAlt, 
  FaShieldAlt, 
  FaBell, 
  FaUsers, 
  FaHospital, 
  FaCreditCard, 
  FaClipboardList, 
  FaCog,
  FaPills,
  FaVial,
  FaNotesMedical,
  FaSearch,
  FaCheckCircle,
  FaClock,
  FaLock,
  FaExchangeAlt,
  FaHospitalUser,
  FaSlidersH
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const SuperAdminSettings = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
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
      color: 'text-primary bg-primary/10 border-primary/20',
      onClick: () => navigate('/superadmin/users')
    },
    {
      icon: FaFileAlt,
      label: 'Generate Report',
      color: 'text-info bg-info/10 border-info/20',
      onClick: () => navigate('/superadmin/reports')
    },
    {
      icon: FaShieldAlt,
      label: 'Security Overview',
      color: 'text-warning bg-warning/10 border-warning/20',
      onClick: () => navigate('/superadmin/settings/security')
    },
    {
      icon: FaSlidersH,
      label: 'System Preferences',
      color: 'text-success bg-success/10 border-success/20',
      onClick: () => navigate('/superadmin/settings/security-preferences')
    }
  ];

  const categories = [
    { id: 'all', label: 'All Settings' },
    { id: 'facilities', label: 'Hospital & Staff' },
    { id: 'security', label: 'Security & Access' },
    { id: 'finance', label: 'Billing & Finance' },
    { id: 'clinical', label: 'Clinical & Inventory' },
  ];

  const systemSettings = [
    {
      id: 'hospital-setup',
      category: 'facilities',
      icon: FaHospital,
      iconColor: 'text-primary bg-primary/10',
      badge: 'Core Config',
      title: 'Hospital Setup',
      description: 'Configure hospital profile, clinical departments, inpatient wards, and beds',
      path: '/superadmin/settings/hospital-setup'
    },
    {
      id: 'users',
      category: 'facilities',
      icon: FaUsers,
      iconColor: 'text-secondary bg-secondary/10',
      badge: 'Access',
      title: 'User & Staff Management',
      description: 'Create, edit, and assign roles to doctors, nurses, pharmacists, and admins',
      path: '/superadmin/users'
    },
    {
      id: 'security',
      category: 'security',
      icon: FaShieldAlt,
      iconColor: 'text-warning bg-warning/10',
      badge: '3h Session',
      title: 'Security & Access Controls',
      description: 'Configure password policy, 2FA, 3-hour session timeout, and RBAC permissions',
      path: '/superadmin/settings/security'
    },
    {
      id: 'audit-logs',
      category: 'security',
      icon: FaClipboardList,
      iconColor: 'text-info bg-info/10',
      badge: 'Audit Trail',
      title: 'Audit Logs & Trails',
      description: 'Monitor chronological system activities, logins, and operational audit events',
      path: '/superadmin/settings/audit-logs'
    },
    {
      id: 'preferences',
      category: 'security',
      icon: FaCog,
      iconColor: 'text-neutral-content bg-neutral',
      badge: 'General',
      title: 'System Preferences',
      description: 'Configure system-wide operational rules, notifications, and appointments',
      path: '/superadmin/settings/security-preferences'
    },
    {
      id: 'billing-finance',
      category: 'finance',
      icon: FaCreditCard,
      iconColor: 'text-emerald-500 bg-emerald-500/10',
      badge: 'Revenue',
      title: 'Billing & Finance',
      description: 'Manage hospital tariff, service charges, financial logs, and transaction reports',
      path: '/superadmin/settings/billing-finance'
    },
    {
      id: 'pharmacy-inventory',
      category: 'clinical',
      icon: FaPills,
      iconColor: 'text-rose-500 bg-rose-500/10',
      badge: 'Dispensary',
      title: 'Pharmacy Inventory',
      description: 'Manage pharmaceutical catalog, stock batches, restocks, and pricing',
      path: '/superadmin/settings/pharmacy-inventory'
    },
    {
      id: 'pharmacy-reviews',
      category: 'clinical',
      icon: FaHospitalUser,
      iconColor: 'text-amber-500 bg-amber-500/10',
      badge: 'HMO Review',
      title: 'Pharmacy Reviews & Overrides',
      description: 'Review HMO prescription rejections and dispense emergency overrides',
      path: '/superadmin/settings/pharmacy-reviews'
    },
    {
      id: 'lab-inventory',
      category: 'clinical',
      icon: FaVial,
      iconColor: 'text-cyan-500 bg-cyan-500/10',
      badge: 'Diagnostics',
      title: 'Laboratory Inventory',
      description: 'Manage reagents, test kits, diagnostic parameters, and laboratory consumables',
      path: '/superadmin/settings/laboratory-inventory'
    },
    {
      id: 'medical-data',
      category: 'clinical',
      icon: FaNotesMedical,
      iconColor: 'text-indigo-500 bg-indigo-500/10',
      badge: 'Clinical Data',
      title: 'Medical Data & Complaints',
      description: 'Configure ICD-10 medical complaints, clinical templates, and symptom sets',
      path: '/superadmin/settings/medical-data'
    }
  ];

  const filteredSettings = useMemo(() => {
    return systemSettings.filter((item) => {
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesSearch = !searchQuery.trim() || 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

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
        <Header onToggleSidebar={toggleSidebar} />
        
        <div className="flex overflow-y-auto flex-col p-4 sm:p-6 lg:p-8 h-full space-y-6">
          {/* Header & System Status Banner */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content">System Settings & Administration</h1>
              <p className="text-xs sm:text-sm text-base-content/70 mt-1">
                Centralized hospital configuration, security policies, clinical inventories, and operational parameters
              </p>
            </div>

          
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-base-content/60 mb-3">
              Superadmin Quick Actions
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickActions.map((action, idx) => {
                const Icon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="p-3.5 rounded-xl bg-base-100 border border-base-300 shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex items-center gap-3 text-left group"
                  >
                    <div className={`p-2.5 rounded-xl border ${action.color} group-hover:scale-110 transition-transform`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-semibold text-xs sm:text-sm text-base-content group-hover:text-primary transition-colors">
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-base-100 p-3 rounded-2xl border border-base-300 shadow-sm">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-primary-content shadow-sm'
                      : 'bg-base-200/70 text-base-content/70 hover:text-base-content hover:bg-base-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search settings..."
                className="input input-bordered input-sm w-full pl-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSettings.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="p-5 rounded-2xl bg-base-100 border border-base-300 hover:border-primary/50 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-3 rounded-xl ${item.iconColor} group-hover:scale-110 transition-transform`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="badge badge-sm badge-outline text-xs font-semibold text-base-content/70">
                        {item.badge}
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-base-content/70 mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-base-200 flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Manage Settings</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredSettings.length === 0 && (
            <div className="p-12 text-center bg-base-100 rounded-2xl border border-base-300">
              <FaCog className="w-12 h-12 mx-auto text-base-content/30 mb-3 animate-spin-slow" />
              <h3 className="font-bold text-base text-base-content">No Settings Found</h3>
              <p className="text-xs text-base-content/60 mt-1">
                No system setting matched "{searchQuery}". Try selecting another category or clearing your search.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettings;

