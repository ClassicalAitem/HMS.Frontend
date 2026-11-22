import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { SuperAdminLayout } from '@/layouts/superadmin';
import {
  FaArrowLeft,
  FaCreditCard,
  FaExchangeAlt,
  FaFileAlt,
  FaCoins,
  FaShieldAlt,
} from 'react-icons/fa';
import ServiceChargesTab from '@/components/superadmin/settings/ServiceChargesTab';
import TransactionsTab from '@/components/superadmin/settings/TransactionsTab';
import FinancialReportsTab from '@/components/superadmin/settings/FinancialReportsTab';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchServiceCharges } from '@/store/slices/serviceChargesSlice';

const STANDARD_CATEGORIES = [
  { id: 'all', label: 'All Tariffs' },
  { id: 'surgical', label: 'Surgical & Procedures', matchKeys: ['surg', 'theatr', 'operat'] },
  { id: 'pharmacy', label: 'Pharmacy & Drugs', matchKeys: ['pharm', 'drug', 'med'] },
  { id: 'laboratory', label: 'Laboratory & Diagnostics', matchKeys: ['lab', 'test', 'investigat'] },
  { id: 'radiology', label: 'Radiology & Imaging', matchKeys: ['rad', 'scan', 'imag', 'xray'] },
  { id: 'consultation', label: 'Consultations', matchKeys: ['consult'] },
  { id: 'admission', label: 'Admission & Wards', matchKeys: ['admiss', 'ward', 'bed'] },
  { id: 'emergency', label: 'Emergency', matchKeys: ['emerg'] },
  { id: 'vaccination', label: 'Vaccination', matchKeys: ['vacc'] },
  { id: 'nursing', label: 'Nursing & Care', matchKeys: ['nurs'] },
  { id: 'form', label: 'Forms & Cards', matchKeys: ['form', 'gen', 'reg'] },
];

const BillingFinance = () => {
  const [activeTab, setActiveTab] = useState('service-charges');
  const [activeCategory, setActiveCategory] = useState('all');
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { serviceCharges } = useAppSelector((s) => s.serviceCharges);

  useEffect(() => {
    dispatch(fetchServiceCharges());
  }, [dispatch]);

  // Safe list
  const chargesList = useMemo(() => {
    if (Array.isArray(serviceCharges)) return serviceCharges;
    if (Array.isArray(serviceCharges?.data)) return serviceCharges.data;
    if (Array.isArray(serviceCharges?.data?.data)) return serviceCharges.data.data;
    return [];
  }, [serviceCharges]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: chargesList.length };

    STANDARD_CATEGORIES.forEach((cat) => {
      if (cat.id === 'all') return;
      counts[cat.id] = chargesList.filter((sc) => {
        const itemCat = String(sc?.category || '').toLowerCase();
        if (cat.matchKeys) {
          return cat.matchKeys.some((k) => itemCat.includes(k));
        }
        return itemCat === cat.id;
      }).length;
    });

    return counts;
  }, [chargesList]);

  const tabs = [
    {
      id: 'service-charges',
      label: 'Service Tariffs & Charges',
      icon: FaCreditCard,
      badge: chargesList.length,
    },
    {
      id: 'transactions',
      label: 'Receipt Transactions',
      icon: FaExchangeAlt,
    },
    {
      id: 'financial-reports',
      label: 'Revenue Analytics',
      icon: FaFileAlt,
    },
  ];

  return (
    <SuperAdminLayout>
      <div className="space-y-6 pb-12 max-w-7xl mx-auto">
        {/* Sleek Compact Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-base-100 p-4 sm:px-6 sm:py-3.5 rounded-2xl border border-base-200/80 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/superadmin/settings')}
              className="btn btn-ghost btn-circle btn-sm text-base-content/70 hover:text-primary"
              title="Back to Settings"
            >
              <FaArrowLeft className="w-3.5 h-3.5" />
            </button>
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold flex-shrink-0">
              <FaCoins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold text-base-content">Billing & Finance Settings</h1>
                <span className="badge badge-sm badge-primary badge-outline text-[11px] font-semibold">Financial Ledger</span>
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">Clinical service tariffs, cashier receipts, and real-time revenue analytics</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="badge badge-sm badge-ghost text-xs font-medium text-base-content/70 gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Ledger Connected
            </span>
          </div>
        </div>

        {/* Main Tab Navigation */}
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
                {tab.badge !== undefined && (
                  <span
                    className={`badge badge-xs px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive ? 'bg-white text-primary border-none' : 'badge-neutral'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Category Sub-Tabs (Under Service Charges Tab) */}
        {activeTab === 'service-charges' && (
          <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-base-content/60 block">
              Filter by Tariff Category
            </span>
            <div className="flex flex-wrap gap-1.5">
              {STANDARD_CATEGORIES.map((cat) => {
                const count = categoryCounts[cat.id] ?? 0;
                const isSelected = activeCategory === cat.id;

                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all inline-flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-primary text-primary-content shadow-sm shadow-primary/20'
                        : 'bg-base-200/80 text-base-content/70 hover:bg-base-200 hover:text-base-content'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span
                      className={`badge badge-xs px-1 text-[10px] ${
                        isSelected ? 'bg-white/20 text-white border-none' : 'badge-ghost text-base-content/60'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content Display */}
        <div>
          {activeTab === 'service-charges' && (
            <ServiceChargesTab
              categoryFilter={activeCategory}
              onClearCategory={() => setActiveCategory('all')}
            />
          )}

          {activeTab === 'transactions' && <TransactionsTab />}

          {activeTab === 'financial-reports' && <FinancialReportsTab />}
        </div>
      </div>
    </SuperAdminLayout>
  );
};

export default BillingFinance;
