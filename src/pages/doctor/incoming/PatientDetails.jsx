import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { MdOutlineCancel } from "react-icons/md";
import { doctorIncomingPatientDetails } from "../../../../data";
import { additionalInformation } from "../../../../data";
import MedicalHistory from "./MedicalHistory";
import CurrentVitals from "./CurrentVitals";

const PatientDetails = () => {
  return (
    <div className="flex h-screen ">
      <Sidebar />

      <div className="flex overflow-hidden flex-col flex-1 ">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7">
            {/* patient details section */}
            <section>
              <div className="flex justify-between text-[#AEAAAE]">
                <h1 className="text-[24px]">Patient Details</h1>
                <MdOutlineCancel size={35} />
              </div>

              <div className="mt-10">
                <div>
                  {doctorIncomingPatientDetails.map(
                    (individualPatient, index) => {
                      return (
                        <div key={index} className=" shadow p-4">
                          <div>
                            <div className="flex items-center justify-between">
                              <div className="flex gap-3 items-center border-[#AEAAAE] border-r pr-30">
                                <img
                                  src={individualPatient.image}
                                  alt="..."
                                  className="w-[80px] h-[80px] object-cover rounded-full"
                                />
                                <div className="flex flex-col">
                                  <p className="text-[#605D66] text-[12px]">
                                    Patient Name
                                  </p>
                                  <h5 className="font-[500] text-[24px]">
                                    {individualPatient.patientName}
                                  </h5>
                                </div>
                              </div>

                              <div className="flex flex-col border-[#AEAAAE] border-r pr-30">
                                <p className="text-[#605D66] text-[12px]">
                                  Gender
                                </p>
                                <h5 className="font-[500] text-[24px]">
                                  {individualPatient.gender}
                                </h5>
                              </div>
                              <div className="flex flex-col border-[#AEAAAE] border-r pr-30">
                                <p className="text-[#605D66] text-[12px]">
                                  Phone Number
                                </p>
                                <h5 className="font-[500] text-[24px]">
                                  {individualPatient.phoneNumber}
                                </h5>
                              </div>
                              <div className="flex flex-col">
                                <p className="text-[#605D66] text-[12px]">
                                  Patient ID
                                </p>
                                <h5 className="font-[500] text-[24px]">
                                  {individualPatient.patientId}
                                </h5>
                              </div>
                            </div>

                            <hr className="mt-5 border-[#AEAAAE]" />

                            <div className="flex items-center justify-between">
                              <div className="font-[600]">
                                <h5>
                                  <span className="text-[40px]">.</span>{" "}
                                  Insurance: {individualPatient.insurance}
                                </h5>
                              </div>

                              <div className="flex items-center gap-4 mt-4">
                                <p>status</p>
                                <button className="w-[204px] h-[24px] rounded-full bg-[#3498DB] text-[#FFFFFF]">
                                  {individualPatient.status}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </section>

            {/* Additional info section */}

            <section className="mt-5 ">
              {additionalInformation.map((info, index) => {
                return (
                  <div key={index}>
                    <div className="flex justify-between">
                      <h1 className="text-[24px] font-[400]">
                        Additional Information
                      </h1>

                      <p>Last Visit: {info.lastVisit} </p>
                    </div>

                    <div className="flex justify-between items-center h-[88px] mt-5 shadow ">
                      <div className="w-[460px] h-full flex gap-2 items-center justify-center border-r border-[#AEAAAE] ">
                        <h5>Blood Group: </h5> {info.bloodGroup}
                      </div>
                      <div className="w-[470px] h-full flex gap-2 items-center justify-center border-r border-[#AEAAAE] ">
                        <h5>Genotype: </h5> {info.genotype}
                      </div>
                      <div className="w-[460px] h-full flex gap-2 items-center justify-center">
                        <h5>Blood Group: </h5> {info.bloodGroup}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            <MedicalHistory/>

            <div>
              <CurrentVitals/>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientDetails;
