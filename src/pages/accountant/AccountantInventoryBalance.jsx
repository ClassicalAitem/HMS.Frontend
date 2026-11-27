import React, { useState, useEffect, useCallback, useMemo } from "react";
import AccountantLayout from "@/layouts/accountant/AccountantLayout";
import accountantAPI from "@/services/api/accountantAPI";
import KolakLoader from "@/components/common/KolakLoader";
import { formatNaira, exportToCsv, usePagination, PaginationBar } from "./accountantUtils";
import { FaDownload, FaSearch, FaSyncAlt, FaExchangeAlt } from "react-icons/fa";
import toast from "react-hot-toast";

const AccountantInventoryBalance = () => {
  const [activeTab, setActiveTab] = useState("shelf"); // 'shelf' | 'store' | 'all'
  const [deptFilter, setDeptFilter] = useState("all"); // 'all' | 'pharmacy' | 'laboratory'
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inventoryData, setInventoryData] = useState({
    shelf: [],
    store: [],
    all: [],
    summary: {
      shelf: { itemCount: 0, totalUnits: 0, totalCostValue: 0, totalSellingValue: 0 },
      store: { itemCount: 0, totalUnits: 0, totalCostValue: 0, totalSellingValue: 0 },
      overall: { itemCount: 0, totalUnits: 0, totalCostValue: 0, totalSellingValue: 0 },
    },
  });

  const loadInventory = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await accountantAPI.getInventoryBalance();
      if (res?.data) setInventoryData(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load drugs & consumables balance");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const currentList = useMemo(() => {
    const base =
      activeTab === "shelf"
        ? inventoryData.shelf
        : activeTab === "store"
        ? inventoryData.store
        : inventoryData.all;

    return base.filter((i) => {
      if (deptFilter !== "all" && i.department !== deptFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        String(i.name || "").toLowerCase().includes(q) ||
        String(i.category || "").toLowerCase().includes(q) ||
        String(i.batchNumber || "").toLowerCase().includes(q)
      );
    });
  }, [inventoryData, activeTab, deptFilter, searchQuery]);

  const inventoryPagination = usePagination(currentList, 15);

  const currentSummary =
    activeTab === "shelf"
      ? inventoryData.summary.shelf
      : activeTab === "store"
      ? inventoryData.summary.store
      : inventoryData.summary.overall;

  const handleToggleLocation = async (item) => {
    const nextLocation = item.location === "store" ? "shelf" : "store";
    try {
      await accountantAPI.updateInventoryLocation(item.id, {
        location: nextLocation,
        department: item.department,
      });
      toast.success(`Moved ${item.name} to ${nextLocation}`);
      loadInventory(true);
    } catch {
      toast.error("Failed to update item location");
    }
  };

  const handleExportCsv = () => {
    exportToCsv(
      `balancing-drugs-consumables-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`,
      [
        "Item Name",
        "Department",
        "Location",
        "Batch",
        "Stock Qty",
        "Unit",
        "Reorder Level",
        "Unit Cost (NGN)",
        "Unit Selling (NGN)",
        "Total Cost Value (NGN)",
        "Total Selling Value (NGN)",
        "Status",
      ],
      currentList.map((i) => [
        i.name,
        i.department,
        i.location,
        i.batchNumber,
        i.stock,
        i.unit,
        i.reorderLevel,
        i.costPrice,
        i.sellingPrice,
        i.totalCostValue,
        i.totalSellingValue,
        i.status,
      ])
    );
    toast.success("Inventory balance exported to CSV");
  };

  return (
    <AccountantLayout>
      {loading && <KolakLoader fullscreen text="Loading drugs & consumables balance..." />}

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
              Balancing Drugs & Consumables
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-1">
              Stock quantities and financial valuation on shelf and in store.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => loadInventory(true)}
              disabled={refreshing}
              className="btn btn-sm btn-ghost bg-base-200/70 rounded-xl gap-1.5"
            >
              <FaSyncAlt className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn btn-sm btn-primary rounded-xl gap-1.5"
            >
              <FaDownload className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">Items Count</p>
            <p className="text-2xl font-extrabold text-base-content mt-2">
              {currentSummary?.itemCount || 0}
            </p>
            <p className="text-xs text-base-content/60 mt-1">
              {currentSummary?.totalUnits || 0} total units in stock
            </p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">
              Total Cost Value
            </p>
            <p className="text-2xl font-extrabold text-primary mt-2">
              {formatNaira(currentSummary?.totalCostValue || 0)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Inventory cost valuation</p>
          </div>
          <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-base-content/60">
              Total Selling Value
            </p>
            <p className="text-2xl font-extrabold text-success mt-2">
              {formatNaira(currentSummary?.totalSellingValue || 0)}
            </p>
            <p className="text-xs text-base-content/60 mt-1">Expected retail valuation</p>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="tabs tabs-boxed bg-base-100 border border-base-200 p-1 rounded-xl">
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                activeTab === "shelf" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setActiveTab("shelf")}
            >
              On Shelf ({inventoryData.shelf.length})
            </button>
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                activeTab === "store" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setActiveTab("store")}
            >
              In Store ({inventoryData.store.length})
            </button>
            <button
              className={`tab tab-sm sm:tab-md rounded-lg font-semibold ${
                activeTab === "all" ? "tab-active bg-primary text-primary-content" : ""
              }`}
              onClick={() => setActiveTab("all")}
            >
              All Combined ({inventoryData.all.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="select select-bordered select-sm rounded-xl bg-base-100"
            >
              <option value="all">All Inventories (Pharmacy + Lab)</option>
              <option value="pharmacy">Pharmacy Drugs & Consumables</option>
              <option value="laboratory">Laboratory Inventories</option>
            </select>
            <div className="relative w-full sm:w-64">
              <FaSearch className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
              <input
                type="text"
                placeholder="Search drug, lab item, batch..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input input-bordered input-sm w-full pl-9 rounded-xl bg-base-100"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-base-100 rounded-2xl border border-base-200 p-5 shadow-sm overflow-x-auto">
          <table className="table table-sm w-full">
            <thead>
              <tr className="text-xs uppercase text-base-content/60">
                <th>Item Name</th>
                <th>Dept</th>
                <th>Location</th>
                <th className="text-right">Balance Qty</th>
                <th className="text-right">Cost Price</th>
                <th className="text-right">Total Cost</th>
                <th className="text-right">Total Selling</th>
                <th>Status</th>
                <th className="text-right">Move</th>
              </tr>
            </thead>
            <tbody>
              {inventoryPagination.paginatedItems.map((item) => (
                <tr key={`${item.department}-${item.id}`} className="hover">
                  <td>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-base-content/60">
                      Batch: {item.batchNumber}
                    </p>
                  </td>
                  <td className="capitalize text-xs">{item.department}</td>
                  <td>
                    <span
                      className={`badge badge-sm capitalize ${
                        item.location === "store" ? "badge-info text-white" : "badge-ghost"
                      }`}
                    >
                      {item.location}
                    </span>
                  </td>
                  <td className="text-right font-bold">
                    {item.stock} <span className="text-xs font-normal">{item.unit}</span>
                  </td>
                  <td className="text-right text-xs">{formatNaira(item.costPrice)}</td>
                  <td className="text-right font-semibold">{formatNaira(item.totalCostValue)}</td>
                  <td className="text-right font-semibold text-success">
                    {formatNaira(item.totalSellingValue)}
                  </td>
                  <td>
                    <span
                      className={`badge badge-sm ${
                        item.status === "out_of_stock"
                          ? "badge-error text-white"
                          : item.status === "low_stock"
                          ? "badge-warning"
                          : "badge-success text-white"
                      }`}
                    >
                      {item.status === "out_of_stock"
                        ? "Out"
                        : item.status === "low_stock"
                        ? "Low"
                        : "In Stock"}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleLocation(item)}
                      className="btn btn-ghost btn-xs gap-1"
                      title={`Move to ${item.location === "store" ? "shelf" : "store"}`}
                    >
                      <FaExchangeAlt className="w-3 h-3" />
                      {item.location === "store" ? "To Shelf" : "To Store"}
                    </button>
                  </td>
                </tr>
              ))}
              {currentList.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-sm text-base-content/50">
                    No items found in {activeTab}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <PaginationBar
            currentPage={inventoryPagination.currentPage}
            totalPages={inventoryPagination.totalPages}
            totalItems={inventoryPagination.totalItems}
            pageSize={inventoryPagination.pageSize}
            onPageChange={inventoryPagination.setCurrentPage}
            onPageSizeChange={inventoryPagination.setPageSize}
          />
        </div>
      </div>
    </AccountantLayout>
  );
};

export default AccountantInventoryBalance;
