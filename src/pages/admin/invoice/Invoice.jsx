import React from "react";
import { Header } from "@/components/common";
import SideBar from "@/components/admin/dashboard/SideBar";
import doctorIcon from "@/assets/images/doctorIcon.png";
import { FaChevronDown } from "react-icons/fa";
import { paymentReceipt } from "../.../../../../../data";
import { IoCheckmarkCircleOutline } from "react-icons/io5";
import { FiPrinter } from "react-icons/fi";
import { IoIosCloseCircleOutline } from "react-icons/io";

const Invoice = () => {
  const statusIcon = (status) => {
    if (status === "Failed") {
      return <IoIosCloseCircleOutline className="text-red-500" />;
    } else if (status === "Successful") {
      return <IoCheckmarkCircleOutline className="text-green-600" />;
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-base-200">
      <SideBar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />

        <div className="flex-1 overflow-y-auto">
          <section className="p-7">
            <h1 className="text-[32px]">All Generated Invoices</h1>
            <div className="flex items-center justify-between">
              <p className="text-[12px]">
                Here's a summary of all generated invoices for Thursday,
                September 11, 2025.
              </p>
              <button className="flex items-center gap-2 px-3 py-2 text-sm border rounded-md bg-base-200 border-base-300 text-base-content/70">
                <img src={doctorIcon} alt="" />

                <p>1/5/12</p>
                <FaChevronDown className="ml-auto text-gray-500" />
              </button>
            </div>

            <div className="grid justify-between grid-cols-2 gap-5 mt-5 ">
              {paymentReceipt.map((invoice, index) => {
                return (
                  <div
                    key={index}
                    className="w-full h-[190px] border border-base-300 rounded-[10px] p-4  font-[400]"
                  >
                    <div className="flex items-center justify-between">
                      <img
                        src={invoice.icon}
                        alt="..."
                        className="w-[35px] h-[35px]"
                      />
                      <span className="text-base-content/70">{invoice.date}</span>
                    </div>

                    {/* heading */}
                    <h6 className="text-[20px] font-[500] mt-5">
                      {invoice.paymentInfo}
                    </h6>
                    <div className="flex items-center gap-1">
                      <p className="my-2">price: {invoice.price}</p>
                    </div>
                    <div className="flex justify-between">
                      <div className="flex items-center gap-1">
                        <p>Status: {invoice.status}</p>
                        {statusIcon(invoice.status)}
                      </div>
                      <FiPrinter />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="w-[301px] flex justify-between mx-auto mt-10">
              <button className="w-[133px] h-[39px] border border-base-300 rounded-[20px] ">
                Back
              </button>
              <button className="w-[133px] h-[39px] bg-primary text-primary-content rounded-[20px]">
                Next
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
