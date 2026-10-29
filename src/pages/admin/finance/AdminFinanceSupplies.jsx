/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaBoxes,
  FaFileInvoiceDollar,
  FaPills,
  FaVial,
  FaMoneyBillWave,
  FaSearch,
  FaSync,
  FaArrowRight,
  FaExclamationTriangle,
  FaCheckCircle,
  FaReceipt,
  FaFilter,
} from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";

import { getInventories } from "@/services/api/inventoryAPI";
import { getLaboratoryInventories } from "@/services/api/labInventoryApi";
import { getAllBillings } from "@/services/api/billingAPI";
import { getAllReceipts } from "@/services/api/receiptAPI";
import { getCachedData, clearAdminCache } from "@/utils/adminDataCache";
import { formatCurrency } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (payload && typeof payload === "object") return [payload];
  return [];
};

const AdminFinanceSupplies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [activeTab, setActiveTab] = useState("modules"); // 'modules' | 'live'

  const [dataStore, setDataStore] = useState({
    pharmacy: [],
    laboratory: [],
    billings: [],
    receipts: [],
  });

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getCachedData(
        "admin_finance_supplies_data",
        async () => {
          const [pharmRes, labRes, billRes, recRes] = await Promise.allSettled([
            getInventories(),
            getLaboratoryInventories(),
            getAllBillings(),
            getAllReceipts(),
          ]);

          return {
            pharmacy: pharmRes.status === "fulfilled" ? extractArray(pharmRes.value) : [],
            laboratory: labRes.status === "fulfilled" ? extractArray(labRes.value) : [],
            billings: billRes.status === "fulfilled" ? extractArray(billRes.value) : [],
            receipts: recRes.status === "fulfilled" ? extractArray(recRes.value) : [],
          };
        },
        60000,
        forceRefresh
      );

      setDataStore(data);
    } catch (err) {
      console.error("Failed to load finance & supplies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  // Aggregate Metrics
  const totalPharmacyValue = useMemo(() => {
    return dataStore.pharmacy.reduce((acc, item) => {
      const price = Number(item.sellingPrice || item.price || item.unitPrice || 0);
      const qty = Number(item.quantityInStock || item.quantity || 0);
      return acc + (isNaN(price * qty) ? 0 : price * qty);
    }, 0);
  }, [dataStore.pharmacy]);

  const totalBilled = useMemo(() => {
    return dataStore.billings.reduce((acc, b) => {
      const amount = Number(b.totalAmount || b.amount || b.grandTotal || 0);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [dataStore.billings]);

  const totalCollected = useMemo(() => {
    return dataStore.receipts.reduce((acc, r) => {
      const amount = Number(r.amountPaid || r.amount || 0);
      return acc + (isNaN(amount) ? 0 : amount);
    }, 0);
  }, [dataStore.receipts]);

  const lowStockCount = useMemo(() => {
    const pharmLow = dataStore.pharmacy.filter((i) => {
      const qty = Number(i.quantityInStock || i.quantity || 0);
      const min = Number(i.reorderLevel || i.minimumQuantity || 10);
      return qty <= min;
    }).length;

    const labLow = dataStore.laboratory.filter((i) => {
      const qty = Number(i.quantityInStock || i.quantity || 0);
      const min = Number(i.reorderLevel || i.minimumQuantity || 10);
      return qty <= min;
    }).length;

    return pharmLow + labLow;
  }, [dataStore.pharmacy, dataStore.laboratory]);

  const quickStats = [
    {
      label: "Pharmacy Valuation",
      value: formatCurrency(totalPharmacyValue),
      sub: `${dataStore.pharmacy.length} medication items`,
      icon: FaPills,
      color: "text-primary bg-primary/10 border-primary/20",
    },
    {
      label: "Laboratory Reagents",
      value: `${dataStore.laboratory.length} Items`,
      sub: "Pathology & diagnostic supplies",
      icon: FaVial,
      color: "text-secondary bg-secondary/10 border-secondary/20",
    },
    {
      label: "Hospital Billings",
      value: formatCurrency(totalBilled),
      sub: `${dataStore.billings.length} generated invoices`,
      icon: FaFileInvoiceDollar,
      color: "text-info bg-info/10 border-info/20",
    },
    {
      label: "Receipts Collected",
      value: formatCurrency(totalCollected),
      sub: "Excluding staff salaries",
      icon: FaMoneyBillWave,
      color: "text-success bg-success/10 border-success/20",
    },
  ];

  const categories = [
    { id: "all", label: "All Modules" },
    { id: "pharmacy", label: "Pharmacy Inventory" },
    { id: "lab", label: "Laboratory Supplies" },
    { id: "billing", label: "Billing & Invoices" },
  ];

  const modules = [
    {
      id: "pharmacy-stocks",
      category: "pharmacy",
      title: "Drugs & Pharmaceutical Consumables",
      badge: "Pharmacy Stock",
      badgeColor: "badge-primary",
      icon: FaPills,
      iconColor: "text-primary bg-primary/10",
      description: "Dispensary inventory, medication batches, expiry monitoring, asset valuation, and restock thresholds.",
      countLabel: `${dataStore.pharmacy.length} Medications Monitored`,
      path: "/dashboard/admin/stocks",
    },
    {
      id: "lab-supplies",
      category: "lab",
      title: "Laboratory Reagents & Consumables",
      badge: "Diagnostic Supplies",
      badgeColor: "badge-secondary",
      icon: FaVial,
      iconColor: "text-secondary bg-secondary/10",
      description: "Diagnostic kits, blood collection tubes, chemical reagents, and laboratory inventory levels.",
      countLabel: `${dataStore.laboratory.length} Reagent Items`,
      path: "/dashboard/admin/stocks",
    },
    {
      id: "invoices-billing",
      category: "billing",
      title: "Hospital Invoices & Patient Billings",
      badge: "Revenue Billing",
      badgeColor: "badge-info",
      icon: FaFileInvoiceDollar,
      iconColor: "text-info bg-info/10",
      description: "Supervise outpatient and inpatient billing invoices, itemized service charges, and unpaid receivables.",
      countLabel: `${dataStore.billings.length} Billings Issued`,
      path: "/dashboard/admin/invoice",
    },
    {
      id: "receipts-settlement",
      category: "billing",
      title: "Payment Receipts & Settlements",
      badge: "Settlement",
      badgeColor: "badge-success",
      icon: FaReceipt,
      iconColor: "text-success bg-success/10",
      description: "Audit verified cashier payment receipts, transaction tokens, and financial settlements.",
      countLabel: `${dataStore.receipts.length} Verified Receipts`,
      path: "/dashboard/admin/invoice",
    },
    {
      id: "hospital-expenses",
      category: "billing",
      title: "Clinical & Operational Expenses",
      badge: "Expenses",
      badgeColor: "badge-warning",
      icon: FaMoneyBillWave,
      iconColor: "text-amber-500 bg-amber-500/10",
      description: "Medical equipment maintenance, consumables procurement, and operational overhead (staff salaries strictly excluded).",
      countLabel: "Non-Salary Clinical Overhead",
      path: "/dashboard/admin/invoice",
    },
  ];

  const filteredModules = useMemo(() => {
    return modules.filter((m) => {
      const matchesCat = selectedCategory === "all" || m.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.badge.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [selectedCategory, searchQuery, modules]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
              <MdOutlineInventory2 className="w-3.5 h-3.5" />
              Finance & Inventory Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Finance & Supplies Administration
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-2xl">
              Centralized oversight for pharmacy medications, laboratory reagents, hospital billing revenues, and clinical expenditures (salaries strictly excluded).
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                clearAdminCache("admin_finance_supplies_data");
                setRefreshKey((k) => k + 1);
              }}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-base-200 hover:bg-base-300 text-base-content transition-colors"
              title="Refresh Data"
            >
              <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
              <span>Sync Data</span>
            </button>

            <button
              onClick={() => setActiveTab(activeTab === "modules" ? "live" : "modules")}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors shadow-xs ${
                activeTab === "live"
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 hover:bg-base-300 text-base-content"
              }`}
            >
              <FaBoxes className="w-3.5 h-3.5" />
              <span>{activeTab === "live" ? "View Modules Grid" : "Live Stocks Overview"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-base-content/60 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-2xl font-black text-base-content mt-1">{stat.value}</p>
                  <p className="text-[11px] text-base-content/50 mt-0.5">{stat.sub}</p>
                </div>
                <div className={`p-3.5 rounded-2xl border ${stat.color} shrink-0`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Low Stock Warning Banner if applicable */}
        {lowStockCount > 0 && (
          <div className="flex items-center justify-between bg-warning/10 border border-warning/30 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-warning shrink-0" />
              <div>
                <p className="font-bold text-sm text-base-content">
                  {lowStockCount} Inventory Items Below Reorder Threshold
                </p>
                <p className="text-xs text-base-content/70">
                  Certain medications or laboratory consumables have reached critical stock levels and require restock.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/dashboard/admin/stocks")}
              className="btn btn-warning btn-xs rounded-xl font-bold"
            >
              Review Stocks
            </button>
          </div>
        )}

        {/* View Mode: Modules Grid (SuperAdminSettings Style) */}
        {activeTab === "modules" ? (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors shrink-0 ${
                      selectedCategory === cat.id
                        ? "bg-primary text-primary-content"
                        : "bg-base-200 hover:bg-base-300 text-base-content/70"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
                <input
                  type="text"
                  placeholder="Search supplies & finance..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input input-sm w-full pl-9 bg-base-200/60 border-base-300 rounded-xl text-xs focus:outline-primary"
                />
              </div>
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredModules.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(item.path)}
                    className="bg-base-100 rounded-2xl border border-base-200 p-5 hover:border-primary/40 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-3 rounded-xl ${item.iconColor} group-hover:scale-105 transition-transform`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`badge badge-sm font-bold ${item.badgeColor} text-[10px]`}>
                          {item.badge}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-bold text-base text-base-content group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-base-content/70 mt-1 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-base-200/80 flex items-center justify-between">
                      <span className="text-xs font-bold text-primary">
                        {item.countLabel}
                      </span>
                      <span className="text-xs font-semibold text-base-content/60 group-hover:text-primary group-hover:translate-x-1 transition-all flex items-center gap-1">
                        Open Module <FaArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Live Table Overview */
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-base-200 pb-3">
              <div>
                <h3 className="text-base font-bold text-base-content">Recent Pharmacy Stock Items</h3>
                <p className="text-xs text-base-content/60">Real-time status of dispensary medications.</p>
              </div>
              <button
                onClick={() => navigate("/dashboard/admin/stocks")}
                className="btn btn-primary btn-xs rounded-xl"
              >
                Full Stock Table →
              </button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-base-200">
              <table className="table table-sm w-full">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content/70">
                  <tr>
                    <th>Item Name</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-base-200">
                  {dataStore.pharmacy.slice(0, 10).map((item, idx) => (
                    <tr key={item._id || idx} className="hover:bg-base-200/40">
                      <td className="font-bold text-base-content">{item.name || item.drugName || "—"}</td>
                      <td className="text-base-content/70">{item.category || "Medication"}</td>
                      <td className="font-semibold text-primary">{item.quantityInStock ?? item.quantity ?? 0} units</td>
                      <td className="font-bold text-base-content">
                        {formatCurrency(item.sellingPrice || item.price || 0)}
                      </td>
                      <td>
                        {(item.quantityInStock || 0) <= (item.reorderLevel || 10) ? (
                          <span className="badge badge-sm badge-warning font-semibold">Low Stock</span>
                        ) : (
                          <span className="badge badge-sm badge-success font-semibold">In Stock</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceSupplies;

