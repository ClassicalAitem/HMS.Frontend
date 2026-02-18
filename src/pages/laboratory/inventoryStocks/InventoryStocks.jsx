import React, { useState, useEffect } from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { FaPlus } from "react-icons/fa6";
import { FiSettings } from "react-icons/fi";
import { getInventories, getAllInventoryTransactions } from "@/services/api/inventoryAPI";
import InventoryItems from "./InventoryItems";

const InventoryStocks = () => {
  const [stockStats, setStockStats] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [criticalItems, setCriticalItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [inventories, transactions] = await Promise.all([
          getInventories(),
          getAllInventoryTransactions(),
        ]);

        const itemsArray = Array.isArray(inventories) ? inventories : inventories?.data || [];
        const transactionsArray = Array.isArray(transactions) ? transactions : transactions?.data || [];

        // Create a mapping of inventoryId to last restocked date
        const lastRestockedMap = {};
        transactionsArray.forEach((transaction) => {
          const inventoryId = transaction.inventoryId?.["$oid"] || transaction.inventoryId;
          if (transaction.type === "in") {
            const transactionDate = new Date(transaction.createdAt?.["$date"] || transaction.createdAt);
            if (!lastRestockedMap[inventoryId] || new Date(lastRestockedMap[inventoryId]) < transactionDate) {
              lastRestockedMap[inventoryId] = transactionDate;
            }
          }
        });

        // Enrich inventory items with last restocked date
        const enrichedItems = itemsArray.map((item) => {
          const itemId = item._id?.["$oid"] || item._id;
          const lastRestocked = lastRestockedMap[itemId];
          return {
            ...item,
            lastRestocked: lastRestocked ? new Date(lastRestocked).toLocaleDateString() : "N/A",
          };
        });

        // Calculate stats
        const totalItems = enrichedItems.length;
        const criticalStockItems = enrichedItems.filter(
          (item) => item.quantity <= item.reorderLevel || item.status === "low_stock"
        );
        const lowStockItems = enrichedItems.filter(
          (item) =>
            item.quantity > (item.reorderLevel || 0) &&
            item.status !== "in_stock"
        );
        const wellStockedItems = enrichedItems.filter(
          (item) => item.quantity > (item.reorderLevel || 0) && item.status === "in_stock"
        );

        setStockStats([
          {
            header: "Total Items",
            value: totalItems,
            status: "Across all items",
          },
          {
            header: "Critical Stock",
            value: criticalStockItems.length,
            status: "immediate action needed",
          },
          {
            header: "Low Stock",
            value: lowStockItems.length,
            status: "Re order soon",
          },
          {
            header: "Well stocked",
            value: wellStockedItems.length,
            status: "Adequate supply",
          },
        ]);

        // Set all items for the inventory table
        setAllItems(enrichedItems);

        // Set critical items (limit to 4)
        const formattedCritical = criticalStockItems.slice(0, 4).map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit: item.form || "units",
        }));

        setCriticalItems(formattedCritical);
        setError(null);
      } catch (err) {
        console.error("Error fetching inventory data:", err);
        setError("Failed to load inventory data");
        setStockStats([
          {
            header: "Total Items",
            value: "0",
            status: "Unable to load",
          },
          {
            header: "Critical Stock",
            value: "0",
            status: "Unable to load",
          },
          {
            header: "Low Stock",
            value: "0",
            status: "Unable to load",
          },
          {
            header: "Well stocked",
            value: "0",
            status: "Unable to load",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen bg-base-200">
        <LaboratorySidebar />
        <div className="flex overflow-hidden flex-col flex-1">
          <Header />
          <div className="flex items-center justify-center flex-1">
            <p className="text-lg text-gray-600">Loading inventory data...</p>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            {error && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            <div className="flex justify-between">
              <div>
                <h5 className="text-[32px] text-[#00943C] font-[500]">
                  Inventory & Stocks
                </h5>
                <p className="text-[12px]">
                  Manage laboratory supplies and equipment
                </p>
              </div>
              {/* <div>
                <button className="flex items-center justify-center bg-[#00943C] text-[#FFFFFF] w-[154px] h-[56px]">
                  <FaPlus /> <p>Add Item</p>
                </button>
              </div> */}
            </div>

            <div className="flex gap-10 justify-between mt-10">
              {stockStats.map((test, index) => {
                const isRed = index === 1;
                const isGreen = index === 3;
                const isThird = index === 2;
                return (
                  <div
                    key={index}
                    className={`w-[300px] h-[150px] bg-[#FFFFFF] shadow p-4 text-[12px] rounded-[8px] ${
                      index === 1 ? "text-[#DC362E] " : ""
                    } ${isGreen ? "text-[#11AD4B]" : ""} ${
                      isThird ? "text-[#DC362E]" : ""
                    }`}
                  >
                    <h1
                      className={`text-[20px] text-[#605D66] ${
                        isRed ? "text-[#DC362E]" : ""
                      }
                          ${isGreen ? "text-[#11AD4B]" : ""} `}
                    >
                      {test.header}
                    </h1>
                    <p className="text-[30px] py-2 font-[500]">{test.value}</p>
                    <p className="">{test.status}</p>
                  </div>
                );
              })}
            </div>

            {criticalItems.length > 0 && (
              <div className="h-[232px] w-full bg-[#FFE2E2] rounded-[6px] mt-5 p-5 text-[#CA332C]">
                <div className="flex items-center gap-3">
                  <FiSettings />
                  <h4 className="text-[20px]">Critical Stock Alert</h4>
                </div>
                <p className="text-[12px]">
                  The following items are critically low and need immediate
                  restocking
                </p>

                <div className="mt-8 text-[12px] space-y-2">
                  {criticalItems.map((item, index) => (
                    <li key={index} className="flex justify-between ">
                      <div>• {item.name}</div>
                      <span className=" font-medium">
                        {item.quantity} {item.unit} remaining
                      </span>
                    </li>
                  ))}
                </div>
              </div>
            )}

            <InventoryItems items={allItems} />
          </section>
        </div>
      </div>
    </div>
  );
};

export default InventoryStocks;
