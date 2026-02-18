import React, { useState, useMemo } from "react";
import { FiSearch } from "react-icons/fi";

const InventoryItems = ({ items = [] }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredItems = useMemo(() => {
    let filtered = items;

    if (filterStatus !== "all") {
      filtered = filtered.filter((item) => {
        if (filterStatus === "critical" || filterStatus === "low") {
          return item.status === "low_stock";
        }
        if (filterStatus === "well-stocked") {
          return item.status === "in_stock";
        }
        return true;
      });
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.supplier?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.form?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [items, searchQuery, filterStatus]);

  const getStockStatus = (item) => {
    const status = item.status || "unknown";
    
    if (status === "low_stock" || item.quantity <= item.reorderLevel) {
      return { label: "Low Stock", color: "#DC362E", bgColor: "#FFE2E2" };
    }
    if (status === "in_stock") {
      return { label: "In Stock", color: "#11AD4B", bgColor: "#D4EDDA" };
    }
    if (status === "out_of_stock") {
      return { label: "Out of Stock", color: "#6B7280", bgColor: "#F3F4F6" };
    }
    
    return { label: status, color: "#605D66", bgColor: "#EFEFEF" };
  };

  return (
    <div>
      <div className="flex items-center justify-between mt-10">
        <div className="relative w-1/3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAAAE]" />
          <input
            type="text"
            placeholder="Search inventory items... "
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-[388px] p-10 pr-4 py-2 border border-[#AEAAAE] rounded-[100px] focus:outline-none focus:ring-1 focus:ring-[#71B908] text-[12px]"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#605D66]">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-auto flex items-center gap-2 bg-[#FFFFFF] px-3 py-2 rounded-md text-sm text-[#605D66] border border-[#AEAAAE]"
          >
            <option value="all">All Items</option>
            <option value="critical">Critical Stock</option>
            <option value="low">Low Stock</option>
            <option value="well-stocked">Well-stocked</option>
          </select>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between px-3">
          <div className="flex flex-col">
            <h1 className="text-[24px]">All Inventory Items</h1>
            <p className="text-[#605D66]">
              {items.length} total items registered
            </p>
          </div>
          <p className="font-[500] text-[#3498DB]">
            {filteredItems.length} shown
          </p>
        </div>
      </div>

      <div className="mt-5 bg-[#FFFFFF] rounded-[6px] overflow-hidden shadow">
        {filteredItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#AEAAAE] bg-[#F7F7F7]">
                  <th className="px-4 py-3 text-left text-[12px] font-[600] text-[#605D66]">
                    Item Name
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-[600] text-[#605D66]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-[600] text-[#605D66]">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-[600] text-[#605D66]">
                    Vendor
                  </th>
                  <th className="px-4 py-3 text-left text-[12px] font-[600] text-[#605D66]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, index) => {
                  const status = getStockStatus(item);
                  return (
                    <tr
                      key={index}
                      className="border-b border-[#EFEFEF] hover:bg-[#F9F9F9] transition-colors"
                    >
                      <td className="px-4 py-3 text-[14px] text-[#111215] font-[500]">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-[14px] text-[#605D66]">
                        {item.form || "N/A"}
                      </td>
                      <td className="px-4 py-3 text-[14px] text-[#111215] font-[500]">
                        {item.quantity} {item.strength || ""}
                      </td>
                      <td className="px-4 py-3 text-[14px] text-[#605D66]">
                        {item.supplier || "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          style={{
                            backgroundColor: status.bgColor,
                            color: status.color,
                          }}
                          className="px-3 py-1 rounded-[4px] text-[12px] font-[500]"
                        >
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-[#605D66]">
            <p>No inventory items found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryItems;
