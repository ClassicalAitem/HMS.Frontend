import React from "react";
import { Header } from "@/components/common";
import SideBar from "@/components/admin/dashboard/Sidebar";
import { TbChartDots2 } from "react-icons/tb";
import TabbedTable from "./TabbedTable";

const Stocks = () => {
  const stockData = {
    total: 100,
    inStock: 70,
    lowStock: 15,
    outOfStock: 15,
  };

  //destructure stockData
  const { total, inStock, lowStock, outOfStock } = stockData;

  const inStockPercentage = (inStock / total) * 100;
  const lowStockPercentage = (lowStock / total) * 100;
  const outOfStockPercentage = (outOfStock / total) * 100;

  return (
    <div className="flex h-screen bg-base-200">
      <SideBar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <section className="p-7">
            {/* Page Heading */}
            <div className="w-[798px]">
              <h1 className="text-[32px]">Stock Overview</h1>
              <p className="text-[12px]">Manage and view all Current Status</p>
            </div>

            {/* Stock Data */}
            <div className="flex gap-5 mt-5">
              <div className="w-[50%]  h-[152px] bg-base-100 rounded-[20px] p-5">
                <div className="flex items-center gap-2">
                  <h4 className="text-[32px] ">{total}</h4>
                  <p className="text-base-content/70 text-[16px]">Product</p>
                </div>

                <div className="mt-3 w-full h-[11px] rounded-full flex gap-2  ">
                  <div
                    className="bg-[#17C59C] rounded-[6px]"
                    style={{ width: `${inStockPercentage}%` }}
                  ></div>
                  <div
                    className="bg-[#CEAB37] rounded-[6px]"
                    style={{ width: `${lowStockPercentage}%` }}
                  ></div>
                  <div
                    className="bg-[#B55853] rounded-[6px]"
                    style={{ width: `${outOfStockPercentage}%` }}
                  ></div>
                </div>

                <div className="flex gap-5 mt-4 text-[16px] text-base-content">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-[#17C59C]"></span>
                    <span className="text-gray-600">In Stock</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-[#CEAB37]"></span>
                    <span className="text-gray-600">Low Stock</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-3 rounded-full bg-[#B55853]"></span>
                    <span className="text-gray-600">Out of Stock</span>
                  </div>
                </div>
              </div>

              <div className="w-[25%] bg-base-100 rounded-[20px] p-5 text-base-content/70">
                <div className="flex items-center gap-5 ">
                  <h5 className="text-[24px]">Total Resources</h5>
                  <TbChartDots2 size={24} />
                </div>
                <h4 className="text-[32px]">1,250</h4>
                <p className="text-[12px]">
                  All assets managed by the hospital
                </p>
              </div>

              <div className="w-[25%] bg-base-100 rounded-[20px] p-5 text-base-content/70">
                <div className="flex items-center gap-5 ">
                  <h5 className="text-[24px] ">Total Resources</h5>
                  <TbChartDots2 size={24} />
                </div>
                <h4 className="text-[32px]">1,250</h4>
                <p className="text-[12px]">
                  All assets managed by the hospital
                </p>
              </div>
            </div>

            {/* Tabbed Table */}
            <div className="mt-5">
              <TabbedTable />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Stocks;
