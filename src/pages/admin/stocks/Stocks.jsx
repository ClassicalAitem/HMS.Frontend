/* eslint-disable no-unused-vars */
import React, { useEffect, useState, useMemo } from "react";
import AdminLayout from "@/layouts/admin/AdminLayout";
import {
  FaBoxes,
  FaSearch,
  FaFileExport,
  FaPills,
  FaVial,
  FaExclamationTriangle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { TbChartDots2 } from "react-icons/tb";
import { getInventories } from "@/services/api/inventoryAPI";
import { getLaboratoryInventories } from "@/services/api/labInventoryApi";
import { exportRowsToCsv, formatCurrency } from "../reports/adminReportUtils";
import { formatNigeriaDate } from "@/utils/formatDateTimeUtils";

const Stocks = () => {
  const [pharmacyItems, setPharmacyItems] = useState([]);
  const [labItems, setLabItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'pharmacy', 'lab'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    let mounted = true;
    const fetchAllStock = async () => {
      setLoading(true);
      try {
        const [pharmRes, labRes] = await Promise.allSettled([
          getInventories(),
          getLaboratoryInventories(),
        ]);

        if (!mounted) return;

        const pharmList = pharmRes.status === "fulfilled"
          ? (Array.isArray(pharmRes.value?.data) ? pharmRes.value.data : Array.isArray(pharmRes.value) ? pharmRes.value : [])
          : [];

        const labList = labRes.status === "fulfilled"
          ? (Array.isArray(labRes.value?.data) ? labRes.value.data : Array.isArray(labRes.value) ? labRes.value : [])
          : [];

        setPharmacyItems(pharmList);
        setLabItems(labList);
      } catch (err) {
        console.error("Error fetching stocks:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAllStock();
    return () => {
      mounted = false;
    };
  }, []);

  const mergedStocks = useMemo(() => {
    const list = [];

    pharmacyItems.forEach((item, idx) => {
      const stock = Number(item.stock || item.quantity || 0);
      const reorder = Number(item.reorderLevel || 10);
      const price = Number(item.sellingPrice || item.price || item.costPrice || 0);
      const status = stock <= 0 ? "Out of Stock" : stock <= reorder ? "Low Stock" : "In Stock";

      list.push({
        id: item._id || item.id || `p-stock-${idx}`,
        categoryType: "Pharmacy",
        name: item.name || item.drugName || "Pharmaceutical Drug",
        category: item.category || "Prescription Medicine",
        stock,
        reorder,
        unitPrice: price,
        expiryDate: item.expiryDate || "",
        status,
        batch: item.batchNumber || "—",
      });
    });

    labItems.forEach((item, idx) => {
      const stock = Number(item.stock || item.quantity || 0);
      const reorder = Number(item.reorderLevel || 10);
      const price = Number(item.sellingPrice || item.price || 0);
      const status = stock <= 0 ? "Out of Stock" : stock <= reorder ? "Low Stock" : "In Stock";

      list.push({
        id: item._id || item.id || `l-stock-${idx}`,
        categoryType: "Laboratory",
        name: item.name || "Reagent / Consumable",
        category: item.category || "Diagnostic Reagent",
        stock,
        reorder,
        unitPrice: price,
        expiryDate: item.expiryDate || "",
        status,
        batch: item.batchNumber || "—",
      });
    });

    const term = searchTerm.toLowerCase().trim();
    return list.filter((r) => {
      const matchSearch =
        !term ||
        r.name.toLowerCase().includes(term) ||
        r.category.toLowerCase().includes(term) ||
        r.batch.toLowerCase().includes(term);

      if (!matchSearch) return false;

      if (activeTab === "pharmacy" && r.categoryType !== "Pharmacy") return false;
      if (activeTab === "lab" && r.categoryType !== "Laboratory") return false;

      if (statusFilter !== "all" && r.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }

      return true;
    });
  }, [pharmacyItems, labItems, searchTerm, activeTab, statusFilter]);

  const totalCount = pharmacyItems.length + labItems.length;
  const inStockCount = mergedStocks.filter((s) => s.status === "In Stock").length;
  const lowStockCount = mergedStocks.filter((s) => s.status === "Low Stock").length;
  const outOfStockCount = mergedStocks.filter((s) => s.status === "Out of Stock").length;

  const inStockPercentage = totalCount > 0 ? (inStockCount / totalCount) * 100 : 0;
  const lowStockPercentage = totalCount > 0 ? (lowStockCount / totalCount) * 100 : 0;
  const outOfStockPercentage = totalCount > 0 ? (outOfStockCount / totalCount) * 100 : 0;

  const totalValuation = mergedStocks.reduce((sum, item) => sum + item.stock * item.unitPrice, 0);

  const totalRows = mergedStocks.length;
  const totalPages = Math.ceil(totalRows / itemsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return mergedStocks.slice(start, start + itemsPerPage);
  }, [mergedStocks, currentPage, itemsPerPage]);

  const handleExport = () => {
    const columns = [
      { key: "categoryType", label: "Department" },
      { key: "name", label: "Supply Item" },
      { key: "category", label: "Category" },
      { key: "stock", label: "Current Stock" },
      { key: "reorder", label: "Reorder Alert" },
      { key: "unitPrice", label: "Unit Price" },
      { key: "batch", label: "Batch No" },
      { key: "expiryDate", label: "Expiry Date" },
      { key: "status", label: "Status" },
    ];
    exportRowsToCsv(mergedStocks, columns, `drugs_consumables_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-primary/10 text-primary">
                Supplies & Pharmacy
              </span>
              <span className="text-xs text-base-content/60">Inventory & Consumables</span>
            </div>
            <h1 className="text-2xl font-bold text-base-content mt-1">
              Drugs & Consumables Stock Overview
            </h1>
            <p className="text-sm text-base-content/70 mt-0.5">
              Live oversight of hospital medications, surgical consumables, lab reagents, stock valuations, and reorder levels.
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={!mergedStocks.length}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl bg-primary text-primary-content hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50"
          >
            <FaFileExport className="w-4 h-4" />
            <span>Export Inventory</span>
          </button>
        </div>

        {/* Stock Status Bar & KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-extrabold text-base-content">{totalCount}</h3>
                <span className="text-sm font-semibold text-base-content/60">Total Catalogued Supplies</span>
              </div>
              <p className="text-xs text-base-content/60 mt-1">
                Live ratio across pharmacy medications and laboratory diagnostics
              </p>
            </div>

            {/* Visual ratio bar */}
            <div className="mt-4">
              <div className="w-full h-3 rounded-full flex gap-1 overflow-hidden bg-base-200">
                <div
                  className="bg-success rounded-full transition-all duration-500"
                  style={{ width: `${inStockPercentage}%` }}
                ></div>
                <div
                  className="bg-warning rounded-full transition-all duration-500"
                  style={{ width: `${lowStockPercentage}%` }}
                ></div>
                <div
                  className="bg-error rounded-full transition-all duration-500"
                  style={{ width: `${outOfStockPercentage}%` }}
                ></div>
              </div>

              <div className="flex items-center justify-between text-xs mt-3 pt-2 border-t border-base-200">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                  <span className="text-base-content/70 font-medium">In Stock: {inStockCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                  <span className="text-base-content/70 font-medium">Low Stock: {lowStockCount}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-error"></span>
                  <span className="text-base-content/70 font-medium">Out of Stock: {outOfStockCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Pharmacy Drugs</span>
              <FaPills className="w-5 h-5 text-primary" />
            </div>
            <div className="my-2">
              <h4 className="text-3xl font-extrabold text-base-content">{pharmacyItems.length}</h4>
              <p className="text-xs text-base-content/60 mt-1">Active pharmaceutical products</p>
            </div>
            <span className="text-[11px] text-primary font-semibold">Managed by Central Pharmacy</span>
          </div>

          <div className="md:col-span-3 bg-base-100 rounded-2xl p-6 border border-base-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-base-content/60 uppercase">Stock Valuation</span>
              <TbChartDots2 className="w-5 h-5 text-secondary" />
            </div>
            <div className="my-2">
              <h4 className="text-2xl font-extrabold text-base-content truncate">{formatCurrency(totalValuation)}</h4>
              <p className="text-xs text-base-content/60 mt-1">Estimated asset inventory value</p>
            </div>
            <span className="text-[11px] text-secondary font-semibold">Consumables & drugs combined</span>
          </div>
        </div>

        {/* Tab & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-base-100 p-4 rounded-xl border border-base-200">
          <div className="flex items-center gap-2">
            {[
              { id: "all", label: "All Supplies" },
              { id: "pharmacy", label: "Pharmacy Drugs" },
              { id: "lab", label: "Lab Consumables" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? "bg-primary text-primary-content"
                    : "bg-base-200 hover:bg-base-300 text-base-content/70"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 flex-1 md:max-w-md">
            <div className="relative flex-1">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-3.5 h-3.5" />
              <input
                type="text"
                placeholder="Search supplies, drugs, or batch..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="input input-sm w-full pl-9 bg-base-200/50 border-base-300 rounded-lg text-xs"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="select select-sm bg-base-200/50 border-base-300 rounded-lg text-xs"
            >
              <option value="all">All Status</option>
              <option value="in stock">In Stock</option>
              <option value="low stock">Low Stock</option>
              <option value="out of stock">Out of Stock</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-sm text-base-content/60 mt-4">Loading stock inventory...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full text-left">
                <thead className="bg-base-200/60 text-xs font-bold text-base-content uppercase border-b border-base-200">
                  <tr>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="px-4">Item Name</th>
                    <th className="px-4">Category</th>
                    <th className="px-4">Stock Level</th>
                    <th className="px-4">Reorder Alert</th>
                    <th className="px-4">Unit Tariff</th>
                    <th className="px-4">Batch No</th>
                    <th className="px-4">Expiry Date</th>
                    <th className="px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-base-200 text-sm">
                  {paginatedRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-base-content/50">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    paginatedRows.map((item, idx) => (
                      <tr key={item.id || idx} className="hover:bg-base-200/40">
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              item.categoryType === "Pharmacy"
                                ? "bg-primary/10 text-primary"
                                : "bg-info/10 text-info"
                            }`}
                          >
                            {item.categoryType}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-base-content">{item.name}</td>
                        <td className="px-4 py-3 text-base-content/80 text-xs">{item.category}</td>
                        <td className="px-4 py-3 font-bold text-base-content">{item.stock}</td>
                        <td className="px-4 py-3 text-base-content/70">{item.reorder}</td>
                        <td className="px-4 py-3 font-medium text-base-content">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-base-content/80">{item.batch}</td>
                        <td className="px-4 py-3 text-base-content/70 whitespace-nowrap">
                          {item.expiryDate ? formatNigeriaDate(item.expiryDate) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              item.status === "In Stock"
                                ? "bg-success/10 text-success"
                                : item.status === "Low Stock"
                                ? "bg-warning/10 text-warning"
                                : "bg-error/10 text-error"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-base-200 bg-base-100">
              <span className="text-xs text-base-content/60">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, totalRows)} of {totalRows}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-40 transition-colors"
                >
                  <FaChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-semibold px-3 py-1.5 bg-base-200 rounded-lg">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg bg-base-200 hover:bg-base-300 disabled:opacity-40 transition-colors"
                >
                  <FaChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Stocks;
