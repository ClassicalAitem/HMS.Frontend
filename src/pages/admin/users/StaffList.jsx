import React from "react";
import { FiUser } from "react-icons/fi";
import { MdOutlineKeyboardArrowDown } from "react-icons/md";
import { SlCalender } from "react-icons/sl";
import icon from "../../../assets/images/doctorIcon.png";
import { listOfStaffs, staffList } from "../../../../data";

const StaffList = () => {
  return (
    <div className=" p-8 rounded-[20px] shadow mt-8">
      <div className="w-[483px] flex gap-2">
        <div className="flex gap-2 justify-center text-[#605D66]  items-center w-[155px] h-[32px] bg-[#F1F2F1]">
          <FiUser size={20} color="#AEAAAE" />
          <p>All Staff</p>
          <button>
            <MdOutlineKeyboardArrowDown size={18} />
          </button>
        </div>

        <div className="flex gap-2 justify-center text-[#605D66]  items-center w-[157px] h-[32px] bg-[#F1F2F1]">
          <img src={icon} alt="" />
          <p>Doctors</p>
          <button>
            <MdOutlineKeyboardArrowDown size={18} />
          </button>
        </div>

        <div className="flex gap-2 justify-center text-[#605D66]  items-center w-[157px] h-[32px] bg-[#F1F2F1]">
          <SlCalender />
          <p>Doctors</p>
        </div>
      </div>

      <div className="flex flex-col gap-5 mt-5 shadow ">
        {listOfStaffs.map((staffInfo, index) => {
          return (
            <div key={index} className="w-full ">
              <div className="flex items-center justify-between rounded-[10px]  bg-[#FFFFFF]  h-[258px] px-20 ">
                <div>
                  <img
                    src={staffInfo.image}
                    alt=""
                    className="w-[90px] h-[90px] object-cover rounded-full border-[3px] border-[#00943C]"
                  />
                </div>

                <div className="w-[222px]">
                  <div className="flex gap-5">
                    <p>Name:</p>
                    <span>{staffInfo.name}</span>
                  </div>

                  <div className="flex gap-9">
                    <p>Role:</p>
                    <span>{staffInfo.role}</span>
                  </div>

                  <div className="flex gap-3">
                    <p>Gender:</p>
                    <span>{staffInfo.gender}</span>
                  </div>

                  <div className="flex gap-9">
                    <p>DOB:</p>
                    <span>{staffInfo.dob}</span>
                  </div>
                </div>

                <div className="w-[512px]">
                  <div className="flex gap-9">
                    <p>Address:</p>
                    <span>{staffInfo.address}</span>
                  </div>
                  <div className="flex gap-5">
                    <p>Email Address:</p>
                    <span>{staffInfo.email}</span>
                  </div>
                  <div className="flex gap-6">
                    <p>Marital Status:</p>
                    <span>{staffInfo.MaritalStatus}</span>
                  </div>
                  <div className="flex gap-5">
                    <p>State Of Origin:</p>
                    <span>{staffInfo.stateOfOrigin}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StaffList;
