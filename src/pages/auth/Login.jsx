import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { AuthLayout, AuthInput } from "@/components/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../../utils/formValidator";
import { useTheme } from "../../contexts/ThemeContext";

const Login = () => {
  const navigate = useNavigate();
  const {currentTheme} = useTheme()
  // const [formData, setFormData] = useState({
  //   username: "",
  //   password: "",
  // });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // const handleInputChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormData((prev) => ({
  //     ...prev,
  //     [name]: value,
  //   }));

  // Clear error when user starts typing
  //   if (error) {
  //     setError("");
  //   }
  // };

  // const handleClearInput = (fieldName) => {
  //   setFormData((prev) => ({
  //     ...prev,
  //     [fieldName]: "",
  //   }));
  // };

  //Made use of yupResolver for validation
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate wrong password error for demo
      if (data.password === "wrong") {
        setError("Wrong Password, try again.");
        setIsLoading(false);
        return;
      }

      // Show success modal
      setShowSuccessModal(true);

      // Navigate to dashboard after delay
      setTimeout(() => {
        navigate("/dashboard");
      }, 2000);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const SuccessModal = () => (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#EAFFF3] rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
          >
            <div className="w-20 h-20 bg-gray-800 rounded-full mx-auto mb-6"></div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome Back,
            </h3>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">FOLAKE</h3>
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center justify-center w-full bg-gray-800 text-white py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              <span className="mr-2">→</span>
              Proceed To Dashboard
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <AuthLayout
      title="Welcome Back 😊"
      subtitle="Please log in into your account"
      showCarousel={true}
    >
      {/* Login Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Username Field */}
        <AuthInput
          type="text"
          name="email"
          // value={formData.username}
          // onChange={handleInputChange}
          placeholder="Enter Your Email"
          icon={FaUser}
          showClearButton={true}
          {...register("email")}
          // onClear={() => handleClearInput("username")}
          error={errors.email || !!error}
          theme={currentTheme}
        />
        <p className="text-red-500 text-sm mt-1">{errors.email?.message}</p>

        {/* Password Field */}
        <AuthInput
          type={showPassword ? "text" : "password"}
          name="password"
          // value={formData.password}
          // onChange={handleInputChange}
          placeholder="Enter Your Password"
          icon={FaLock}
          {...register("password")}
          rightIcon={showPassword ? <FaEyeSlash /> : <FaEye />}
          onRightIconClick={() => setShowPassword(!showPassword)}
          error={errors.password || !!error}
          theme={currentTheme}
        />
        <p className="text-red-500 text-sm mt-1">{errors.password?.message}</p>

        {/* Forgot Password */}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-green-500 hover:text-green-600 text-sm transition-colors"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-500 hover:bg-green-600 active:scale-95"
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Signing in...
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      {/* Success Modal */}
      <SuccessModal />
    </AuthLayout>
  );
};

export default Login;
