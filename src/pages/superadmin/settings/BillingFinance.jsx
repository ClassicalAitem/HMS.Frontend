import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/common';
import { Sidebar } from '@/components/superadmin/dashboard';
import { FaArrowLeft, FaCreditCard, FaExchangeAlt, FaFileAlt } from 'react-icons/fa';
import ServiceChargesTab from '@/components/superadmin/settings/ServiceChargesTab';
import TransactionsTab from '@/components/superadmin/settings/TransactionsTab';
import FinancialReportsTab from '@/components/superadmin/settings/FinancialReportsTab';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchServiceCharges } from '@/store/slices/serviceChargesSlice';

const BillingFinance = () => {
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('service-charges');
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { serviceCharges } = useAppSelector((s) => s.serviceCharges);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  const tabs = [
    { id: 'service-charges', label: 'Service Charges', icon: FaCreditCard },
    { id: 'transactions', label: 'Transactions', icon: FaExchangeAlt },
    { id: 'financial-reports', label: 'Financial Reports', icon: FaFileAlt }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'service-charges':
        return <ServiceChargesTab categoryFilter={activeCategory === 'all' ? null : activeCategory} />;
      case 'transactions':
        return <TransactionsTab />;
      case 'financial-reports':
        return <FinancialReportsTab />;
      default:
        return <ServiceChargesTab />;
    }
  };

  useEffect(() => {
    dispatch(fetchServiceCharges());
  }, [dispatch]);

  const categories = [
    'all',
   "form",
"pharmacy",
 "laboratory",
 "radiology",
  "consultation",
 "surgery",
  "lab_test",
  "vaccination",
  "admission",
  "nursing",
  ];

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
              <h1 className="text-2xl sm:text-3xl font-bold text-base-content">Billing & Finance</h1>
              <span className="badge badge-primary badge-sm font-semibold">Financial Ledger</span>
            </div>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">Manage clinical service tariffs, transaction receipts, and live financial revenue reports</p>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap items-center gap-2 bg-base-200/60 p-1.5 rounded-2xl border border-base-300/60 w-fit mb-5">
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

          {/* Category Sub-Tabs*/}
          {activeTab === 'service-charges' && (
            <div className="mb-5 bg-base-100 p-3 rounded-2xl border border-base-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/60 block mb-2 px-1">Tariff Categories</span>
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      String(activeCategory) === String(cat)
                        ? 'bg-secondary text-secondary-content shadow-sm'
                        : 'bg-base-200/70 text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                  >
                    {cat === 'all' ? 'All Tariffs' : cat.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingFinance;
