import React from "react";
import { Header } from "@/components/common";
import SideBar from "@/components/admin/dashboard/SideBar";
import { useState } from "react";
import { PiUsersThree } from "react-icons/pi";
import {  FaLock } from "react-icons/fa";
import { FiUser, FiEye, FiEyeOff } from "react-icons/fi";
import { GoHome } from "react-icons/go";
import { HiOutlineViewGridAdd } from "react-icons/hi";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { registrationSchema, staffRegistrationSchema } from "../../../../utils/formValidator";
import StaffList from "../../../pages/admin/users/StaffList";
import { usersAPI } from "../../../services/api/usersAPI";
import toast from "react-hot-toast";

const steps = [
  { label: "User Details", icon: <FiUser /> },
];

const Users = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(staffRegistrationSchema),
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const onSubmit = async (data) => {
    const payload = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      role: data.role,
      password: data.password,
    };

    try {
      await toast.promise(usersAPI.createUser(payload), {
        loading: "Creating staff...",
        success: "Staff created successfully",
        error: (e) => e?.response?.data?.message || "Failed to create staff",
      });

      // Reset form, go to Staff List and refresh list
      reset();
      setCurrentStep(0);
      setActiveTab("Staff List");
      setRefreshKey((k) => k + 1);
    } catch (error) {
      // Error toast handled above
    }
  };

  const [activeTab, setActiveTab] = useState("Staff List");
  const [currentStep, setCurrentStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // function to navigate to the next button

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  return (
    <div className="flex h-screen bg-base-200">
      <SideBar />

      <div className="flex overflow-hidden flex-col flex-1">
        <Header />

        <div className="overflow-y-auto flex-1">
          <section className="p-7 ">
            {/* Page Heading */}
            <div className="flex gap-10">
              <div className={`w-[343px]${
                      activeTab === "Staff Registration"
                        ? " text-primary"
                        : "text-gray-500"
                    }`} >
                <div className="flex items-center gap-5">
                  <button onClick={() => setActiveTab("Staff Registration")} className="text-[32px] font-[400]">
                    Staff Registration
                  </button>
                  <PiUsersThree size={30} />
                </div>
                <p className="text-[12px]">Register new Staff</p>
              </div>

              <div className="w-1 bg-base-300"/>

              <div className={` w-[343px] ${
                      activeTab === "Staff List"
                        ? " text-primary"
                        : "text-gray-500"
                    }`} >
                <div className="flex items-center gap-5 ">
                  <button onClick={() => setActiveTab("Staff List")} className="text-[32px] font-[400] " >
                    Staff List
                  </button>
                  <PiUsersThree size={30} className={` text-[#605D66] ${
                      activeTab === "Staff List"
                        ? " text-primary"
                        : "text-gray-500"
                    }`} />
                </div>
                <p className="text-[12px]">
                  View the total staffs under management
                </p>
              </div>
            </div>

            {/* Registration form section */}
            <section>
              {activeTab === "Staff Registration" && (
                <div className="flex justify-between gap-3  overflow-hidden mt-5">
                  <div className="w-[490px] bg-base-100">
                    <div className="flex flex-col py-10 items-start gap-6">
                      <div className="flex items-center gap-3">
                        <h4 className="w-8 h-8 flex items-center justify-center rounded-full border-2 bg-green-500 text-white border-green-500">
                          {steps[0].icon}
                        </h4>
                        <span className="font-medium text-green-600">{steps[0].label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="w-[850px] bg-base-100 px-10 py-10">
                    <form onSubmit={handleSubmit(onSubmit)}>
                      {/* User details (single step) */}
                      <div className="w-[800px]">
                        <label className="block">Name</label>
                        <div className="flex justify-between">
                          <div>
                            <input
                              type="text"
                              placeholder="First name"
                              className="w-[370px] h-[59px] border border-base-300 rounded-[6px] p-3"
                              {...register("firstName")}
                            />
                            {errors.firstName && (
                              <p className="text-red-500">{errors?.firstName?.message}</p>
                            )}
                          </div>
                          <div>
                            <input
                              type="text"
                              placeholder="Last name"
                              className="w-[370px] h-[59px] border border-base-300 rounded-[6px] p-3"
                              {...register("lastName")}
                            />
                            {errors.lastName && (
                              <p className="text-red-500">{errors?.lastName?.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="my-4">
                          <label className="block">Email address</label>
                          <div className="relative mt-3">
                            <label className="absolute -top-2 left-3 w-[110px] text-[12px] font-[400] bg-base-100 px-[4px]">Enter your email</label>
                            <input
                              type="email"
                              placeholder="user@example.com"
                              className="block border border-base-300 w-full py-[16px] px-[12px] rounded-[6px]"
                              {...register("email")}
                            />
                          </div>
                          {errors.email && (
                            <p className="text-red-500">{errors?.email?.message}</p>
                          )}
                        </div>

                        <div className="my-4">
                          <label className="block">Staff Role</label>
                          <div className="relative mt-3">
                            <label className="absolute -top-2 left-3 w-[93px] text-[12px] font-[400] bg-base-100 px-[4px]">Select role</label>
                            <select className="border rounded-lg px-[12px] py-[16px] w-full h-[59px]" {...register("role", { required: true })}>
                              <option value="doctor">Doctor</option>
                              <option value="nurse">Nurse</option>
                              <option value="front-desk">Frontdesk</option>
                              <option value="cashier">Cashier</option>
                              <option value="pharmacist">Pharmacist</option>
                              <option value="admin">Admin</option>
                            </select>
                          </div>
                          {errors.role && (
                            <p className="text-red-500">{errors?.role?.message}</p>
                          )}
                        </div>

                        <div className="my-4">
                          <label className="block">Password</label>
                          <div className="relative mt-3">
                            <label className="absolute -top-2 left-3 w-[85px] text-[12px] font-[400] bg-base-100 px-[4px]">Min 8 chars</label>
                            <input
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter a secure password"
                              className="block border border-base-300 w-full py-[16px] px-[12px] rounded-[6px]"
                              {...register("password", { required: true, minLength: 8 })}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="btn btn-ghost btn-xs absolute right-2 top-1/2 -translate-y-1/2"
                            >
                              {showPassword ? (
                                <FiEyeOff className="w-4 h-4" />
                              ) : (
                                <FiEye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {errors.password && (
                            <p className="text-red-500">{errors?.password?.message}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-end mt-10">
                          <button type="submit" className="bg-primary rounded-[20px] w-[180px] h-[39px] flex items-center justify-center gap-2 text-primary-content">
                            Create Staff
                          </button>
                        </div>
                      </div>
                    </form>

                    {currentStep === 1 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-4">
                          Residential Address
                        </h2>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-4">
                          Additional details
                        </h2>
                      </div>
                    )}

                    {currentStep === 3 && (
                      <div className="w-[800px]">
                        <h2 className="text-lg font-semibold mb-4">Create password</h2>
                        <div className="my-4">
                          <label className="block">Password</label>
                          <div className="relative mt-3">
                            <label className="absolute -top-2 left-3 w-[85px] text-[12px] font-[400] bg-base-100 px-[4px]">Min 8 chars</label>
                            <input
                              type="password"
                              placeholder="Enter a secure password"
                              className="block border border-base-300 w-full py-[16px] px-[12px] rounded-[6px]"
                              {...register("password", { required: true, minLength: 8 })}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-10">
                          <button
                            type="button"
                            onClick={handleBack}
                            className="rounded-[20px] w-[140px] h-[39px] flex items-center justify-center gap-2 border border-primary text-primary"
                          >
                            Back
                          </button>
                          <button
                            type="submit"
                            className="bg-primary rounded-[20px] w-[180px] h-[39px] flex items-center justify-center gap-2 text-primary-content"
                          >
                            Create Staff
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>

            {activeTab === "Staff List" && (
              <StaffList refreshKey={refreshKey} />
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default Users;
