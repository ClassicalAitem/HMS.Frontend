import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "@/layouts/admin/AdminLayout";
import KolakLoader from "@/components/common/KolakLoader";
import { FaBoxes, FaPills, FaVial, FaSearch, FaSync, FaExclamationTriangle, FaArrowRight } from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { getInventories } from "@/services/api/inventoryAPI";
import { getLaboratoryInventories } from "@/services/api/labInventoryApi";
import { getCachedData, clearAdminCache } from "@/utils/adminDataCache";

const extractArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
};

const AdminFinanceSupplies = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dataStore, setDataStore] = useState({ pharmacy: [], laboratory: [] });

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    try {
      const data = await getCachedData(
        "admin_supplies_data",
        async () => {
          const [pharmRes, labRes] = await Promise.allSettled([
            getInventories(),
            getLaboratoryInventories(),
          ]);
          return {
            pharmacy: pharmRes.status === "fulfilled" ? extractArray(pharmRes.value) : [],
            laboratory: labRes.status === "fulfilled" ? extractArray(labRes.value) : [],
          };
        },
        60000,
        forceRefresh
      );
      setDataStore(data);
    } catch (err) {
      console.error("Failed to load supplies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const lowStockCount = useMemo(() => {
    const countLow = (items) => items.filter((item) => {
      const qty = Number(item.quantityInStock ?? item.quantity ?? item.stock ?? 0);
      const minimum = Number(item.reorderLevel ?? item.minimumQuantity ?? 10);
      return qty <= minimum;
    }).length;
    return countLow(dataStore.pharmacy) + countLow(dataStore.laboratory);
  }, [dataStore]);

  const modules = [
    {
      id: "pharmacy",
      title: "Drugs & Pharmaceutical Consumables",
      badge: "Pharmacy Stock",
      icon: FaPills,
      description: "Medication inventory, batches, expiry monitoring, and restock thresholds.",
      count: `${dataStore.pharmacy.length} medication items`,
    },
    {
      id: "lab",
      title: "Laboratory Reagents & Consumables",
      badge: "Diagnostic Supplies",
      icon: FaVial,
      description: "Diagnostic kits, blood collection tubes, chemical reagents, and supply levels.",
      count: `${dataStore.laboratory.length} reagent items`,
    },
  ];

  const filteredModules = modules.filter((module) => {
    const matchesCategory = selectedCategory === "all" || module.id === selectedCategory;
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !query ||
      module.title.toLowerCase().includes(query) ||
      module.description.toLowerCase().includes(query) ||
      module.badge.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <AdminLayout>
      {loading && dataStore.pharmacy.length === 0 && (
        <KolakLoader fullscreen text="Loading supplies data..." />
      )}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
              <MdOutlineInventory2 className="w-3.5 h-3.5" />
              Inventory Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Supplies & Inventory
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1 max-w-2xl">
              Operational oversight for pharmacy medications and laboratory consumables.
            </p>
          </div>
          <button
            onClick={() => {
              clearAdminCache("admin_supplies_data");
              setRefreshKey((key) => key + 1);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-base-200 hover:bg-base-300 text-base-content transition-colors"
          >
            <FaSync className={`w-3.5 h-3.5 ${loading ? "animate-spin text-primary" : ""}`} />
            <span>Sync Data</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Pharmacy Items</p>
            <p className="text-2xl font-black text-base-content mt-1">{dataStore.pharmacy.length}</p>
          </div>
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Laboratory Items</p>
            <p className="text-2xl font-black text-base-content mt-1">{dataStore.laboratory.length}</p>
          </div>
          <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-sm">
            <p className="text-xs font-bold text-base-content/60 uppercase">Low Stock</p>
            <p className="text-2xl font-black text-warning mt-1">{lowStockCount}</p>
          </div>
        </div>

        {lowStockCount > 0 && (
          <div className="flex items-center justify-between bg-warning/10 border border-warning/30 p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="w-5 h-5 text-warning shrink-0" />
              <p className="font-bold text-sm text-base-content">
                {lowStockCount} inventory items are below their reorder threshold
              </p>
            </div>
            <button onClick={() => navigate("/dashboard/admin/stocks")} className="btn btn-warning btn-xs rounded-xl font-bold">
              Review Stocks
            </button>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
          <div className="flex items-center gap-1.5">
            {[{ id: "all", label: "All Supplies" }, { id: "pharmacy", label: "Pharmacy" }, { id: "lab", label: "Laboratory" }].map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-80">
            <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Search supplies..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="input input-sm w-full pl-9 bg-base-200/60 border-base-300 rounded-xl text-xs focus:outline-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredModules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => navigate("/dashboard/admin/stocks")}
                className="bg-base-100 rounded-2xl border border-base-200 p-5 hover:border-primary/40 hover:shadow-md transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-xl bg-primary/10 text-primary"><Icon className="w-5 h-5" /></div>
                  <span className="badge badge-sm badge-primary font-bold text-[10px]">{module.badge}</span>
                </div>
                <h3 className="font-bold text-base text-base-content mt-3">{module.title}</h3>
                <p className="text-xs text-base-content/70 mt-1">{module.description}</p>
                <div className="pt-4 mt-4 border-t border-base-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-primary">{module.count}</span>
                  <span className="text-xs font-semibold text-base-content/60 flex items-center gap-1">Open Module <FaArrowRight className="w-2.5 h-2.5" /></span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFinanceSupplies;
