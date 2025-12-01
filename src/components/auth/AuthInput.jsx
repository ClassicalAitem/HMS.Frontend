import React from "react";
import { FaTimes } from "react-icons/fa";



const AuthInput = (
  {
    type = "text",
    name,
    value,
    onChange,
    placeholder,
    icon: Icon,
    rightIcon,
    onRightIconClick,
    error = false,
    errorMessage,
    disabled = false,
    onClear,
    showClearButton = false,
    className = "",
    theme = "light",
    ...register
  },
  ref
) => {

  //set text color based on theme
  const textColorClass = theme === "dark" ? "text-white" : "text-gray-800";

  return (
    <div className={className}>
      <div className="relative">
        {/* Left Icon */}
        {Icon && (
          <Icon className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        )}

        {/* Input Field */}
        <input
          ref={ref}
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          {...register}
          className={`w-full ${Icon ? "pl-12" : "pl-4"} pr-12 py-4 border-b-2 ${
            error ? "border-red-500" : "border-gray-200"
          } focus:border-green-500 focus:outline-none transition-colors bg-transparent text-gray-800 placeholder-gray-400 ${
            disabled ? "cursor-not-allowed opacity-50" : ""
          } ${textColorClass}`}
        />

        {/* Right Icon or Clear Button */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {error && (
            <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">!</span>
            </div>
          )}

          {showClearButton && value && !error && (
            <button
              type="button"
              onClick={onClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes />
            </button>
          )}

          {rightIcon && !error && !showClearButton && (
            <button
              type="button"
              onClick={onRightIconClick}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              {rightIcon}
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && errorMessage && (
        <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
      )}
    </div>
  );
};

export default AuthInput;
