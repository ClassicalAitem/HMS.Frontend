import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import patient from "../../../assets/images/patients.jpg";
import { MdOutlineCancel } from "react-icons/md";
import { Link } from "react-router-dom";

const AddNewDiagnosis = () => {
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div className="flex justify-between items-center">
              <div className="w-[571px] flex gap-2">
                <h4 className="text-[32px] text-[#00943C]  border-[#605D66] border-r pr-2 ">
                  Add New Diagnosis
                </h4>

                <div className="flex gap-2">
                  {" "}
                  <img
                    src={patient}
                    alt=""
                    className="h-[50px] w-[50px] rounded-full object-cover"
                  />
                  <div className="flex flex-col text-[#605D66]">
                    <h4 className="text-[20px] ">Leslie Alexander</h4>
                    <p>P-2025-002</p>
                  </div>
                </div>
              </div>
              <div>
                <MdOutlineCancel size={41} color="#605D66" />
              </div>
            </div>

            <div className="mt-10 bg-[#FFFFFF] border-[#AEAAAE] border rounded-[10px]">
              <form className="p-5 ">
                <div className="flex justify-between">
                  <div>
                    <label htmlFor="type" className="text-[20px]">
                      Type
                    </label>
                    <p className="text-[12px]">
                      (Choose a type of service you are rendering)
                    </p>
                    <select className="border border-[#AEAAAE]  rounded-[6px] px-3 h-[56px] w-[650px] focus:outline-none mt-5">
                      <option value="">Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="type" className="text-[20px]">
                      Diagnosis
                    </label>
                    <p className="text-[12px]">
                      (Choose a type of service you are rendering)
                    </p>
                    <select className="border border-[#AEAAAE]  rounded-[6px] px-3 h-[56px] w-[650px] focus:outline-none mt-5">
                      <option value="">Consultation</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-between mt-10">
                  <div>
                    <label htmlFor="type" className="text-[20px]">
                      Type
                    </label>
                    <p className="text-[12px]">
                      (Choose a type of service you are rendering)
                    </p>
                    <select className="border border-[#AEAAAE]  rounded-[6px] px-3 h-[56px] w-[650px] focus:outline-none mt-5">
                      <option value="">Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="type" className="text-[20px]">
                      Type
                    </label>
                    <p className="text-[12px]">
                      (Choose a type of service you are rendering)
                    </p>
                    <select className="border border-[#AEAAAE]  rounded-[6px] px-3 h-[56px] w-[650px] focus:outline-none mt-5">
                      <option value="">Consultation</option>
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div className="mt-10">
                  <h5>Notes</h5>

                  <textarea
                    placeholder="Enter Additional Notes"
                    className="h-[263px] border w-full rounded-[10px] border-[#AEAAAE] p-4"
                  ></textarea>
                </div>

                <div className="flex gap-5 mt-10">
                  <div>
                    <Link to={"/dashboard/doctor/incoming/incomingcashier"}>
                      <button className="text-[#3498DB] underline text-[24px] font-[600]">
                        Send to cashier
                      </button>
                    </Link>

                    <p className="text-[#605D66] text-[12px]">
                      (send to cashier for payments)
                    </p>
                  </div>

                  <div>
                    <button className="text-[#3498DB] underline text-[24px] font-[600]">
                      Send to Pharmacy
                    </button>
                    <p className="text-[#605D66] text-[12px]">
                      (send to Pharmacy for Prescription)
                    </p>
                  </div>
                </div>
              </form>
            </div>
            <div className="mt-20 mb-10 flex justify-center">
              <button className="bg-[#00943C] text-[#FFFFFF] w-[230px] h-[56px] rounded-[6px]">
                Save Now
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default AddNewDiagnosis;
