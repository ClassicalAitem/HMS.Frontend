import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaLock, FaTimes } from "react-icons/fa";
import { AuthLayout, AuthInput } from "@/components/auth";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";
import { updateYourPasswordSchema } from "../../../utils/formValidator";
import { useTheme } from "../../contexts/ThemeContext";

const ForgotPassword = () => {
  // const [formData, setFormData] = useState({
  //   username: "Folake Oluwaseun",
  //   newPassword: "",
  //   confirmPassword: "",
  // });

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));
  // };

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   // Handle password update logic here
  //   console.log("Password update submitted:", formData);
  // };


  

  //White text theme for Dark Background
  const { currentTheme } = useTheme();

  //Made use of yupResolver for validation
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(updateYourPasswordSchema),
  });

  const onSubmit = async (data) => {
    console.log("Password update submitted:", data);
  };

  return (
    <AuthLayout
      title="Update your password"
      subtitle="Kindly Create a new password"
      showCarousel={true}
    >
      {/* Password Update Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username Field (Read-only) */}
        <AuthInput
          type="text"
          name="username"
          // value={formData.username}
          // onChange={handleInputChange}
          placeholder="Enter Your Username"
          icon={FaUser}
          rightIcon={<FaTimes />}
          disabled={true}
          value={"Folake Oluwaseun"}
          theme={currentTheme}
        />

        {/* New Password Field */}
        <AuthInput
          type="password"
          name="newPassword"
          // value={formData.newPassword}
          // onChange={handleInputChange}
          placeholder="Enter Your new Password"
          icon={FaLock}
          rightIcon={<FaTimes />}
          {...register("newPassword")}
          error={!!errors.newPassword}
          theme={currentTheme}
        />
        <p className="text-red-500 text-sm mt-1">
          {errors.newPassword?.message}
        </p>

        {/* Confirm Password Field */}
        <AuthInput
          type="password"
          name="confirmPassword"
          // value={formData.confirmPassword}
          // onChange={handleInputChange}
          placeholder="Confirm Your new Password"
          icon={FaLock}
          rightIcon={<FaTimes />}
          {...register("confirmPassword")}
          error={!!errors.confirmPassword}
          theme={currentTheme}
        />
        <p className="text-red-500 text-sm mt-1">
          {errors.confirmPassword?.message}
        </p>

        {/* Submit Button */}
        <div className="pt-6">
          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg font-semibold transition-colors"
          >
            Sign In
          </button>
        </div>
      </form>

      {/* Back to Login */}
      <div className="text-center mt-8">
        <Link
          to="/login"
          className="text-green-500 hover:text-green-600 text-sm transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
