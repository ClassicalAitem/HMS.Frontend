import React from "react";
import { currentVitals } from "../../../../data";
import { IoAddOutline } from "react-icons/io5";
import { moreVitals } from "../../../../data";
import { useState } from "react";

const CurrentVitals = () => {

     const [selectedValue, setSelectedValue] = useState("");

      const handleChange = (event) => {
        setSelectedValue(event.target.value);
      };

  return (
    <section className="bg-[#FFFFFF]">
      {/* current Vitals */}
      <div className="mt-5">
        {currentVitals.map((info, index) => {
          return (
            <div key={index} className="">
              <div className="flex justify-between">
                <div className="flex flex-col">
                  <h5 className="flex gap-3 text-[20px] font-[500]">
                    <span>current Vitals - </span>
                    {info.patientName}
                  </h5>

                  <div className="flex gap-2 items-center">
                    <p className="flex gap-2 items-center">
                      {info.ward} - {info.bed}
                    </p>{" "}
                    <span className="bg-[#000000] h-[3px] w-[4px] rounded-full"></span>
                    <h5 className="text-[12px]">
                      Last Updated - {info.lastUpdated}
                    </h5>
                  </div>
                </div>

                <div className="flex justify-between">
                  <button className="flex justify-center gap-2 text-[#FFFFFF] items-center h-[40px] w-[181px] text-[12px] bg-[#00943C] rounded-[4px]">
                    <span>
                      <IoAddOutline size={12} />
                    </span>{" "}
                    Send To Nurse{" "}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 justify-between mt-5">
        {moreVitals.map((more, index) => {
          return (
            <div key={index}>
              <div className="border border-[#AEAAAE] w-[210px] h-[100px] shadow rounded-[10px] flex flex-col lg:pl-8 justify-center">
                <div className="flex gap-1 ">
                  <img src={more.image} alt="" />
                  <p className="text-[16px] font-[500] ">{more.heading}</p>
                </div>
                <div className="">
                  <p className="text-[20px] font-[500] flex items-center gap-1">
                    {more.heartRate}{" "}
                    <span className="text-[16px]">{more.value}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5">
        <input
          type="text"
          placeholder="Additional Notes"
          className="h-[112px] w-full rounded-[10px] border  border-[#AEAAAE] px-10"
        />
      </div>

      <div className="mt-5">
        <select
          id="diagnosis"
          value={selectedValue}
          onChange={handleChange}
          className="border border-[#AEAAAE]  rounded-[10px] px-3 h-[85px] w-full focus:outline-none "
        >
          <option value="">-- Choose an option --</option>
          <option value="vitalHistory">Vital History</option>
          <option value="hypertension">Hypertension check-up</option>
          <option value="diabetes">Diabetes review</option>
          <option value="cardiology">Cardiology consultation</option>
          <option value="general">General check-up</option>
        </select>
      </div>
    </section>
  );
};

export default CurrentVitals;
