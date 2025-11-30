import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { doctorIncomingPatientDetails } from "../../../../data";
import { MdOutlineCancel } from "react-icons/md";
import { diagnosis } from "../../../../data";

const PatientDiagnosis = () => {
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

            {/* Patient diagnosis */}
            <section className="mt-10">
              <h5>Last Updated: 12:00AM 01/01/01</h5>

              <div className="mt-5">
                {diagnosis.map((testResult, index) => {
                  return (
                    <div
                      key={index}
                      className="h-[230px] flex flex-col justify-center p-5 border-[#AEAAAE] border rounded-[10px] "
                    >
                      <div className="flex flex-col">
                        <div className="flex justify-between">
                          <h5 className="flex gap-2">
                            Type: <span>{testResult.type}</span>
                          </h5>
                          <h5 className="flex gap-2">
                            Diagnosis: <span> {testResult.diagnosis}</span>
                          </h5>
                        </div>
                        <div className="flex justify-between py-10">
                          <h5 className="flex gap-2">
                            Allergies: <span>{testResult.Allergies}</span>
                          </h5>
                          <h5 className="flex gap-2">
                            Date: <span> {testResult.date}</span>
                          </h5>
                        </div>
                        <div>
                          <h5 className="flex gap-2">
                            Admission: <span>{testResult.type}</span>
                          </h5>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <h5 className="text-[20px]">Additional Note</h5>
                <div>
                  <textarea
                    placeholder="Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat.

Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. 

Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio dignissim qui blandit praesent "
                    className="h-[220px] w-full rounded-[10px] border-[#AEAAAE] border p-5 "
                  ></textarea>
                </div>
              </div>
            </section>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PatientDiagnosis;
