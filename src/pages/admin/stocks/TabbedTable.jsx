import React from "react";
import { useState } from "react";
import { FiSearch } from "react-icons/fi";
import doctorIcon from "../../../assets/images/doctorIcon.png";
import { pharmacyData } from "../../../../data";
import { laboratoryData } from "../../../../data";

const TabbedTable = () => {
  const [activeTab, setActiveTab] = useState("pharmacy");
  const data = activeTab === "pharmacy" ? pharmacyData : laboratoryData;

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
    b;
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
