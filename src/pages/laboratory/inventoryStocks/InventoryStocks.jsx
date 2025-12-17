import React from "react";
import { Header } from "@/components/common";
import LaboratorySidebar from "@/components/laboratory/dashboard/LaboratorySidebar";
import { FaPlus } from "react-icons/fa6";
import { stocks } from "../../../../data";
import { FiSettings } from "react-icons/fi";
import InventoryItems from "./InventoryItems";

const InventoryStocks = () => {
  return (
    <div className="flex h-screen bg-base-200">
      <LaboratorySidebar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1 ">
          <section className="p-7">
            <div className="flex justify-between">
              <div>
                <h5 className="text-[32px] text-[#00943C] font-[500]">
                  Inventory & Stocks
                </h5>
                <p className="text-[12px]">
                  Manage laboratory supplies and equipment
                </p>
              </div>
              <div>
                <button className="flex items-center justify-center bg-[#00943C] text-[#FFFFFF] w-[154px] h-[56px]">
                  <FaPlus /> <p>Add Item</p>
                </button>
              </div>
            </div>

            <div className="flex gap-10 justify-between mt-10">
              {stocks.map((test, index) => {
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

            <div className="h-[232px] w-full bg-[#FFE2E2] rounded-[6px] mt-5 p-5 text-[#CA332C]">
              <div className="flex items-center gap-3">
                <FiSettings />{" "}
                <h4 className="text-[20px]">Critical Stock Alert</h4>
              </div>
              <p className="text-[12px]">
                The following items are critically low and need immediate
                restocking
              </p>

              <div className="mt-8 text-[12px] space-y-2">
                <li className="flex justify-between ">
                  <div>• Syringes (5ml)</div>
                  <span className=" font-medium">
                    4 boxes remaining
                  </span>
                </li>
                <li className="flex justify-between ">
                  <div>• Gloves (Large)</div>
                  <span className=" font-medium">
                    10 boxes remaining
                  </span>
                </li>
                <li className="flex justify-between">
                  <div>• Bandages (50 pack)</div>
                  <span className=" font-medium">
                    15 packs remaining
                  </span>
                </li>
                <li className="flex justify-between">
                  <div>• Alcohol Swabs</div>
                  <span className=" font-medium">
                    20 packs remaining
                  </span>
                </li>
              </div>
            </div>

            <InventoryItems/>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InventoryStocks;
