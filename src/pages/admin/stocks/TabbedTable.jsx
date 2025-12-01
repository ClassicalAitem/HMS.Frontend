import React, { useEffect, useMemo, useState } from "react";
import { FiSearch } from "react-icons/fi";
import doctorIcon from "../../../assets/images/doctorIcon.png";
import apiClient from "../../../services/api/apiClient";

const TabbedTable = () => {
  const [activeTab, setActiveTab] = useState("pharmacy");
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch transactions then hydrate with inventory details
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const txRes = await apiClient.get("/inventory/InventoryTransaction/transactions");
        const transactions = Array.isArray(txRes?.data?.data) ? txRes.data.data : [];

        // NOTE: Temporarily disable fetching /inventory/:id due to permission constraints.
        // const uniqueIds = [...new Set(transactions.map((t) => t.inventoryId).filter(Boolean))];
        // const invDetails = await Promise.all(uniqueIds.map(async (id) => { /* fetch details */ }));
        // const inventories = invDetails.filter(Boolean);

        // Map transactions directly to table rows (design unchanged)
        const rows = transactions.map((t) => {
          const status = t.type === "out" ? "Out of Stock" : "In Stock";
          return {
            name: t.description || t.batchNumber || t.inventoryId || "-",
            category: t.type === "in" ? "Restock" : "Dispense",
            stock: t.quantity ?? "-",
            vendor: t.batchNumber ?? "-",
            status,
            price: t.unitPrice ?? "-",
          };
        });

        setItems(rows);
      } catch (err) {
        console.error("TabbedTable: failed to load transactions", err);
        setError("Failed to load inventory data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter by search term; keep tabs but same dataset until backend provides category
  const data = useMemo(() => {
    const base = items;
    const q = query.trim().toLowerCase();
    const filtered = q ? base.filter((x) => String(x.name).toLowerCase().includes(q)) : base;
    return filtered;
  }, [items, query]);

  // function to return the right badge style
  const bgChange = (status) => {
    if (status === "In Stock") {
      return "border border-success text-success px-2 py-1 rounded-full text-[12px]";
    }
    if (status === "Low Stock") {
      return "border border-warning text-warning px-2 py-1 rounded-full text-[12px]";
    }
    if (status === "Out of Stock") {
      return "border border-error text-error px-2 py-1 rounded-full text-[12px]";
    }
     // removed stray character
     return null;
   };

  return (
    <div>
      <div className="flex border-b gap-3 text-[20px] text-base-content/70 border-base-300">
        <button
          onClick={() => setActiveTab("pharmacy")}
          className={`pb-2 ${
            activeTab === "pharmacy"
              ? "border-b-2 border-base-content text-base-content"
              : "text-base-content/50"
          }`}
        >
          Pharmacy
        </button>
        <button
          onClick={() => setActiveTab("laboratory")}
          className={`pb-2 ${
            activeTab === "laboratory"
              ? "border-b-2 border-base-content text-base-content"
              : "text-base-content/50"
          }`}
        >
          Laboratory
        </button>
      </div>

      <div className="flex items-center justify-between mt-10">
        <div className="relative w-1/3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/50" />
          <input
            type="text"
            placeholder="Search Name"
            className="w-[388px] p-10 pr-4 py-2 border border-base-300 rounded-[100px] focus:outline-none focus:ring-1 focus:ring-primary text-[12px]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12px] text-base-content/70">
            Thursday 15th Sep 2025
          </span>
          <button className="w-[115px] flex items-center gap-2 bg-base-100 px-3 py-2 rounded-md text-sm text-base-content/70 ">
            <img src={doctorIcon} alt="..." />
            Filter
          </button>
        </div>
      </div>

      <div>
        <div className="overflow-x-auto rounded-lg shadow mt-6">
          <table className="w-full text-[16px]">
            <thead className="bg-base-200 text-left  ">
              <tr className="text-[16px] text-base-content/70">
                <th className="px-4 py-2">Name</th>
                <th className="px-4 p-2 ">Categories</th>
                <th className="px-4 p-2 ">Stock</th>
                <th className="px-4 p-2 ">Vendor</th>
                <th className="px-4 p-2">Status</th>
                <th className="px-4 p-2">Price</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && items.length === 0 && (
                <tr>
                  <td className="p-3 py-5" colSpan={6}>Loading…</td>
                </tr>
              )}
              {error && !isLoading && items.length === 0 && (
                <tr>
                  <td className="p-3 py-5" colSpan={6}>{error}</td>
                </tr>
              )}
              {data.map((medics, index) => {
                return (
                  <tr key={index} className="border-b border-base-300">
                    <td className="p-3 py-5">{medics.name}</td>
                    <td className="p-3">{medics.category}</td>
                    <td className="p-3">{medics.stock}</td>
                    <td className="p-3">{medics.vendor}</td>
                    <td className="p-3 align-middle">
                      <span className={bgChange(medics.status)}>
                        {medics.status}
                      </span>
                    </td>
                    <td className="p-3">{medics.price}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TabbedTable;
