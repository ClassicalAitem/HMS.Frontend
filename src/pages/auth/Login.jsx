/* eslint-disable */
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash, FaUser, FaLock } from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
import { AuthLayout, AuthInput } from "@/components/auth";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema } from "../../../utils/formValidator";
import { useTheme } from "../../contexts/ThemeContext";
import usersData from "@/data/users.json";

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
  const [loggedInUser, setLoggedInUser] = useState(null);

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

      // Find user in users data
      const user = usersData.find(u => u.username === data.email && u.password === data.password);
      
      if (!user) {
        setError("Invalid email or password. Please try again.");
        setIsLoading(false);
        return;
      }

        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('authToken', 'mock-jwt-token-' + user.id);

        // Store logged-in user for success modal
        setLoggedInUser(user);

        // Show success modal
        setShowSuccessModal(true);

      // Navigate to role-specific dashboard after delay
      setTimeout(() => {
        const dashboardPath = getDashboardPath(user.role);
        navigate(dashboardPath);
      }, 2000);
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
      reset();
    }
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case 'frontdesk':
        return '/dashboard/frontdesk';
      case 'nurse':
        return '/dashboard/nurse';
      case 'doctor':
        return '/dashboard/doctor';
      case 'admin':
        return '/dashboard/admin';
      case 'superAdmin':
        return '/dashboard/superadmin';
      case 'cashier':
        return '/dashboard/cashier';
      default:
        return '/dashboard/frontdesk';
    }
  };

  const getUserInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name[0].toUpperCase();
  };

  const SuccessModal = () => (
    <AnimatePresence>
      {showSuccessModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex fixed inset-0 z-50 justify-center items-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="bg-[#EAFFF3] rounded-2xl p-8 max-w-sm w-full mx-4 text-center"
          >
            <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-primary flex items-center justify-center overflow-hidden">
              {loggedInUser?.avatar ? (
                <img 
                  src={loggedInUser.avatar} 
                  alt={loggedInUser.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {getUserInitials(loggedInUser?.name)}
                </span>
              )}
            </div>
            <h3 className="mb-2 text-2xl font-bold text-primary">
              Welcome Back,
            </h3>
            <h3 className="mb-6 text-2xl font-bold text-gray-800">
              {loggedInUser?.name?.toUpperCase() || 'USER'}
            </h3>
            <button
              onClick={() => {
                const dashboardPath = getDashboardPath(loggedInUser?.role);
                navigate(dashboardPath);
              }}
              className="flex justify-center items-center py-3 w-full font-medium rounded-lg transition-colors text-base-100 bg-primary hover:bg-primary/80"
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
          className="text-sm 2xl:text-base"
        />
        <p className="mt-1 text-sm text-red-500">{errors.email?.message}</p>

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
          className="text-sm 2xl:text-base"
        />
        <p className="mt-1 text-sm text-red-500">{errors.password?.message}</p>

        {/* Forgot Password */}
        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm transition-colors 2xl:text-base text-primary hover:text-green-600"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-3 2xl:py-4 rounded-lg font-semibold text-white transition-all duration-200 ${
            isLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-primary hover:bg-green-500 active:scale-95"
          }`}
        >
          {isLoading ? (
            <div className="flex justify-center items-center">
              <div className="mr-2 w-5 h-5 rounded-full border-b-2 border-white animate-spin"></div>
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
