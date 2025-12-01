import React from "react";
import { Header } from "@/components/common";
import Sidebar from "../../../components/doctor/dashboard/Sidebar";
import { MdOutlineCancel } from "react-icons/md";
import patient from "../../../assets/images/patients.jpg";
import { useState } from "react";
import { billing } from "../../../../data";
import { IoMdAdd } from "react-icons/io";
import { RiDeleteBin6Line } from "react-icons/ri";
import DiagnosisFormField from "./DiagnosisFormField";
import CashierModal from "./modals/CashierModal";
import PharmacyModal from "./modals/PharmacyModal";

const IncomingCashier = () => {
  const [activeButton, setActiveButton] = useState("cashier");
  const [showModal, setShowModal] = useState(false);

  const subtotal = 900000;
  const vat = subtotal * 0.05;
  const total = subtotal + vat;

  const prescriptionInformation = [
    { label: "Visit Date", value: "October 14, 2025" },
    { label: "Prescribing Doctor", value: "Dr. Folake Flakes" },
    { label: "Total Medications", value: "1" },
  ];
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
                  Send To Cashier
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

            <div className="mt-5 bg-[#E9E8EA] rounded-[6px] w-[410px] h-[54px] flex justify-center items-center px-2">
              <button
                onClick={() => setActiveButton("cashier")}
                className={`w-[201px] h-[36px] text-[#000000] rounded-[6px] transition-colors duration-200 
          ${
            activeButton === "cashier"
              ? "bg-[#00943C] text-[#FFFFFF]"
              : "text-[]"
          }`}
              >
                Send to Cashier
              </button>

              <button
                onClick={() => setActiveButton("pharmacy")}
                className={`w-[201px] h-[36px] text-[#000000] rounded-[6px] transition-colors duration-200 
          ${activeButton === "pharmacy" ? "bg-[#00943C] text-[#FFFFFF]" : ""}`}
              >
                Send to Pharmacy
              </button>
            </div>

            {/* Form Section for cashier */}

            {activeButton === "cashier" && (
              <section className="mt-5">
                <form>
                  <div className="flex justify-between">
                    {/* Billable items, Billing summary */}

                    <div className="flex flex-col gap-5">
                      {/* Billable items forms*/}
                      <div className="w-[680px] h-[689px] border  border-[#AEAAAE] rounded-[6px] p-3">
                        <h1 className="text-[20px] mt-5 font-[500]">
                          Billable Items
                        </h1>

                        <div className="flex flex-col gap-5 mt-5">
                          {billing.map((bills, index) => {
                            return (
                              <div
                                key={index}
                                className="flex items-center justify-between bg-[#F0EEF3] p-3 rounded-lg border"
                              >
                                <div>
                                  <p className="font-medium">{bills.name}</p>
                                  <p className="text-[12px]">{bills.service}</p>
                                </div>
                                <div className="flex items-center gap-2 text-[#000000]">
                                  <p className="text-[14px]">
                                    Qty: {bills.qty}
                                  </p>
                                  ₦{bills.price.toLocaleString()}
                                  <button>
                                    <RiDeleteBin6Line color="#DC362E" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <div className="mt-5">
                          <h4>Add New items</h4>

                          <select className="w-full h-[55px]  p-2 input">
                            <option>Select Service</option>
                          </select>

                          <select className="w-full h-[55px] input p-2  mt-5">
                            <option>Item name</option>
                          </select>

                          <div className="flex gap-2 mt-2">
                            <div className="flex flex-col gap-2 w-1/2">
                              <label htmlFor="Quantity">Quantity</label>
                              <input
                                type="number"
                                placeholder="Qty"
                                className="  h-[55px] input p-2"
                              />
                            </div>

                            <div className="flex flex-col gap-2 w-1/2">
                              <label htmlFor="Quantity">Quantity</label>
                              <input
                                type="number"
                                placeholder="Price"
                                className=" input h-[55px]  p-2"
                              />
                            </div>
                          </div>

                          <div className="flex justify-center mt-5">
                            <button className="flex items-center btn w-full h-[62px] text-[24px] font-normal">
                              {" "}
                              <IoMdAdd /> Add Item
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Billing summary */}
                      <div className="w-[680px] h-[216px] border  border-[#AEAAAE] rounded-[6px] p-3">
                        <h1 className="text-[20px] mt-2">Billing summary</h1>

                        <div className="mt-5  text-[#AEAAAE]">
                          <div className="flex justify-between ">
                            <span>Subtotal</span>
                            <span>₦{subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>VAT (5%)</span>
                            <span>₦{vat.toLocaleString()}</span>
                          </div>
                          <div className="border-[#AEAAAE] border-t pt-5 mt-5 font-semibold flex justify-between text-[#000000]">
                            <span>Total Amount</span>
                            <span>₦{total.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis, Treatments and visit information form fields */}
                    <div>
                      <DiagnosisFormField />
                    </div>
                  </div>
                  <div className="flex justify-center mt-15 mb-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault(), setShowModal(true);
                      }}
                      className=" btn w-[230px] h-[56px] text-[20px] font-normal"
                    >
                      {" "}
                      Send To Cashier
                    </button>
                    {showModal && <CashierModal setShowModal={setShowModal} />}
                  </div>
                </form>

                {/* send to cashier Modal pops up on click */}
              </section>
            )}

            {/* Switching to Pharmacy */}
            {activeButton === "pharmacy" && (
              <section className="mt-5">
                <form>
                  <div className="flex justify-between">
                    {/* Billable items, Billing summary */}

                    <div className="flex flex-col gap-5">
                      {/*  prescriptions*/}
                      <div className="w-[680px] h-[642px] border  border-[#AEAAAE] rounded-[6px] p-3">
                        <h1 className="text-[20px] mt-5 font-[500]">
                          prescriptions
                        </h1>
                        <input
                          type="text"
                          placeholder="Drug Name:
Dosage:
Frequency:
Duration:
Instructions"
                          className="border w-full h-[158px] mt-3 rounded-[8px]  input"
                        />
                        <div className="mt-3">
                          <label htmlFor="Add New Medication" className="block">
                            Add New Medication
                          </label>
                          <input
                            type="text"
                            placeholder="Medication Name"
                            className="h-[55px] w-full rounded-[8px] p-2 input "
                          />

                          <div className="flex gap-2 mt-2">
                            <div className="flex flex-col gap-2 w-1/2">
                              <label htmlFor="Dosage">Dosage</label>
                              <input
                                type="text"
                                placeholder="(eg.500 mg)"
                                className="  h-[55px] input p-2 text-[#000000]"
                              />
                            </div>

                            <div className="flex flex-col gap-2 w-1/2">
                              <label htmlFor="Frequency">Frequency</label>
                              <input
                                type="text"
                                placeholder="(e.g., 2x daily) "
                                className=" input h-[55px]  p-2"
                              />
                            </div>
                          </div>
                          <div className="mt-5  ">
                            <textarea
                              placeholder="Special instructions (optional)"
                              className="h-[90px] input w-full p-2"
                            ></textarea>
                          </div>

                          <div className="flex justify-center mt-5">
                            <button className="flex items-center btn w-full h-[62px] text-[24px] font-normal">
                              {" "}
                              <IoMdAdd /> Add Item
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Allergy check */}
                      <div className="w-[680px] h-[104px] border  border-[#AEAAAE] rounded-[6px] p-2">
                        <div>
                          <h3 className="text-[20px] text-[#000000]">
                            Allergy Check
                          </h3>
                          <p className="text-[#605D66] mt-4">
                            Please verify patient allergies before dispensing
                            medication
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Diagnosis, Treatments and visit information form fields */}
                    <div className="flex flex-col gap-5">
                      <div className="w-[680px] h-[300px] border border-[#AEAAAE] rounded-[6px] p-3">
                        <div>
                          <div className=" mt-3 p-3 ">
                            <h2 className="text-[20px] font-[500] mb-2">
                              Diagnosis
                            </h2>
                            <textarea
                              className="bg-[#F0EEF3] w-full border rounded-[6px] p-2 h-[211px] text-[16px]"
                              placeholder="Enter diagnosis details..."
                            />
                          </div>
                        </div>
                      </div>
                      <div className="w-[680px] h-[300px] border border-[#AEAAAE] rounded-[6px]">
                        {" "}
                        <div className=" mt-3 p-3 ">
                          <h2 className="text-[20px] font-[500] mb-2">
                            Pharmacy Notes
                          </h2>
                          <textarea
                            className="bg-[#F0EEF3] w-full border rounded-[6px] p-2 h-[211px] text-[16px]"
                            placeholder="Enter any special instructions for the pharmacist"
                          />
                        </div>
                      </div>
                      <div className="w-[680px] h-[176px] border  border-[#AEAAAE] rounded-[6px] p-3">
                        <h1 className="text-[20px]">
                          Prescription Information
                        </h1>
                        <div className="mt-5">
                          {prescriptionInformation.map((invoice, index) => {
                            return (
                              <div key={index} className="mt-1">
                                <div className="flex justify-between">
                                  <p className="">{invoice.label}</p>
                                  <p>{invoice.value}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center mt-15 mb-20">
                    <button
                      onClick={(e) => {
                        e.preventDefault(), setShowModal(true);
                      }}
                      className=" btn w-[230px] h-[56px] text-[20px] font-normal"
                    >
                      {" "}
                      Send To Pharmacy
                    </button>
                    {showModal && <PharmacyModal setShowModal={setShowModal} />}
                  </div>
                </form>
              </section>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default IncomingCashier;
