import React from "react";
import doctorIcon from "../../../assets/images/doctorIcon.png";
import { FiSearch } from "react-icons/fi";

const InventoryItems = () => {
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
          <p className="font-[500] text-[#3498DB]">See All</p>
        </div>
      </div>
    </div>
  );
};

export default InventoryItems;
