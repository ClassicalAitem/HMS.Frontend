import React from "react";
import doctorIcon from "../../../assets/images/doctorIcon.png";
import { FiSearch } from "react-icons/fi";
import { inventoryData } from "../../../../data";

const InventoryItems = () => {
  const bgChange = (status) => {
    if (status === "In Stock") return "#DBFCE7";

    if (status === "Out Of Stock") return "#FFE2E2";

    if (status === "Low Stock") return "#FFEDD4";

    if (status === "In Stock") return "#DBFCE7";
  };

  // badge text colors to improve contrast
  const textColor = (status) => {
    if (status === "In Stock") return "#11AD4B";
    if (status === "Out Of Stock") return "#E7000B";
    if (status === "Low Stock") return "#F54A00";
    if (status === "In Stock") return "#11AD4B";
    return "#374151";
  };

  return (
    <div>
      <div className="flex items-center justify-between mt-10">
        <div className="relative w-1/3">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEAAAE]" />
          <input
            type="text"
            placeholder="Search inventory items... "
            className="w-[388px] p-10 pr-4 py-2 border border-[#AEAAAE] rounded-[100px] focus:outline-none focus:ring-1 focus:ring-[#71B908] text-[12px]"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-[12px] text-[#605D66]">
            Thursday 15th Sep 2025
          </span>
          <button className="w-[115px] flex items-center gap-2 bg-[#FFFFFF] px-3 py-2 rounded-md text-sm text-[#605D66] ">
            <img src={doctorIcon} alt="..." />
            Filter
          </button>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between px-3">
          <div className="flex flex-col">
            <h1 className="text-[24px]">All Inventory Items</h1>
            <p className="text-[#605D66]">
              Complete list of laboratory supplies and equipment
            </p>
          </div>
          <p className="font-[500] text-[#3498DB] cursor-pointer">See All</p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg shadow mt-6">
        <table className="w-full text-[16px] rounded-lg overflow-hidden">
          <thead className="bg-[#EAFFF3]">
            <tr className="text-left">
              <th className="p-3 font-semibold">Name</th>
              <th className="p-3 font-semibold">Categories</th>
              <th className="p-3 font-semibold">Stock</th>
              <th className="p-3 font-semibold">Vendor</th>
              <th className="p-3 font-semibold">Last Restocked</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold">Action</th>
            </tr>
          </thead>

          <tbody>
            {inventoryData.map((item, index) => {
              return (
                <tr key={index} className="last:border-b-0">
                  <td className="p-3 last:border-b-0">{item.name}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">{item.stock}</td>
                  <td className="p-3">{item.vendor}</td>
                  <td className="p-3">{item.lastRestocked}</td>
                  <td className="p-3">
                    <span
                      className="min-w-[94px] h-[27px] px-3 rounded-[6px] text-sm font-medium inline-flex items-center justify-center"
                      style={{
                        backgroundColor: bgChange(item.status),
                        color: textColor(item.status),
                      }}
                    >
                      {item.status}{" "}
                    </span>
                  </td>

                  <td className="p-3">
                    <button className="px-4 py-1 border rounded-lg hover:bg-gray-100">
                      Restock
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryItems;
