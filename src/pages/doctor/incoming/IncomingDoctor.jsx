import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { RiArrowLeftRightFill } from "react-icons/ri";
import { incomingFromDoctor } from "../../../../data";
import PatientDetails from "./PatientDetails";
import { Link, useNavigate } from "react-router-dom";

const IncomingDoctor = () => {
  const navigate = useNavigate();

  const handleViewPayment = (id) => {
    navigate(`/dashboard/incoming/patientdetails/${id}`);
  };
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            <div>
              <div>
                <div className="flex items-center gap-5 ">
                  <RiArrowLeftRightFill size={25} color="#00943C" />
                  <h1 className="text-[32px] text-[#00943C] ">incoming</h1>
                </div>
                <p className="text-[12px]">
                  Check out the patient sent to you.
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-3 mt-10">
              {incomingFromDoctor.map((doctorsRequest, index) => {
                return (
                  <div
                    key={index}
                    className="w-[600px] h-[216px] bg-[#EFF9F3] ml-5 mt-2 text-[#000000] shadow p-5"
                  >
                    <h1 className="text-[12px]">
                      Sent By: {doctorsRequest.sentBy}
                    </h1>

                    <div className="flex justify-between mt-5 px-5">
                      <div>
                        <img
                          src={doctorsRequest.img}
                          alt=""
                          className="w-[52px] h-[52px] bg-fit rounded-full"
                        />
                      </div>
                      <div className="flex flex-col gap-3 text-[12px]">
                        <p>Name: {doctorsRequest.name}</p>
                        <p>Patient ID: {doctorsRequest.patientId}</p>
                      </div>
                      <div className="flex flex-col gap-3 text-[12px]">
                        <p>Insurance: {doctorsRequest.insurance}</p>
                        <p>Registered: {doctorsRequest.Registered}</p>
                      </div>
                    </div>

                    <div className="flex justify-center mt-10 underline text0[16px]">
                      <button
                        onClick={() =>
                          handleViewPayment(doctorsRequest.patientId)
                        }
                      >
                        {doctorsRequest.paymentDetails}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default IncomingDoctor;
