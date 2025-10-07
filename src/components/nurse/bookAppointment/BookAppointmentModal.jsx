import React from "react";
import { IoMdClose } from "react-icons/io";

const BookAppointmentModal = ({ setShowModal }) => {
  return (
    <div>
      <div className="fixed inset-0 z-50 p-3 bg-[#00000080] bg-opacity-40 flex items-center justify-center">
        <div className="bg-[#FFFFFF] rounded-xl shadow-lg p-6 max-w-[688px] h-[700px] w-full">
          <div className="flex justify-between">
            <div className="text-[#00943C] text-[24px]">Book Appointment</div>
            <div>
              <button
                onClick={() => setShowModal(false)}
                className=" text-[#AEAAAE] hover:text-black text-xl cursor-pointer"
              >
                <IoMdClose size={30} />
              </button>
            </div>
          </div>

          <form>
            <div className="mt-7">
              <label className="block text-[20px] font-[500]">
                {" "}
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Enter name here"
                className="border border-[#AEAAAE] rounded-[6px] w-full h-[49px] mt-3 p-2 "
              />
            </div>
            <div className="flex justify-between mt-3">
              <div>
                <label className="block  text-[20px] font-[500]">
                  Appointment Date
                </label>
                <input
                  type="date"
                  className="border border-[#AEAAAE] w-[300px] rounded-[6px] h-[49px] mt-3 p-2 "
                />
              </div>
              <div>
                <label className="block  text-[20px] font-[500]">
                  Appointment Time
                </label>
                <input
                  type="time"
                  className="border border-[#AEAAAE] w-[300px] rounded-[6px] h-[49px] mt-3 p-2 "
                />
              </div>
            </div>

            <div>
              <div className="mt-3">
                <label htmlFor="" className="block  text-[20px] font-[500]">
                  Department
                </label>
                <div className="relative mt-3">
                  <label
                    htmlFor=""
                    className="absolute -top-2 left-3 w-[93px] text-[12px] font-[400] bg-[#FFFBFE] px-[4px]"
                  >
                    Department
                  </label>
                  <select
                    name="gender"
                    className="border border-[#AEAAAE] rounded-lg px-[12px] py-[16px]  w-full h-[59px] "
                  >
                    <option value="married">Departments</option>
                    <option value="single">Doctor</option>
                    <option value="single">Lab</option>
                    <option value="single">Nurse</option>
                  </select>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-[20px] font-[500]">
                  {" "}
                  Reason for visit/ notes
                </label>
                <input
                  type="text"
                  placeholder="Enter name here"
                  className="border border-[#AEAAAE] rounded-[6px] w-full h-[49px] mt-3 p-2 "
                />
              </div>
            </div>

            <div className="mt-10">
              <div className="w-[348px] flex justify-between mx-auto ">
                <div className="flex justify-center items-center w-[113px] h-[52px] bg-[#FFFFFF] border">
                  <h6 className="text-[#000000] flex justify-center ">
                    Cancel
                  </h6>
                </div>
                <div className="flex justify-center items-center w-[219px] h-[52px] bg-[#00943C]">
                  <h6 className="text-[#FFFFFF]">Save Appointment</h6>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
