import * as yup from "yup";

// * Form Validation User's Login
export const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email("Email must be a valid email address")
    .required("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is invalid"),

  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters"),
});

// * Form Validation For Update New User's Password

export const updateYourPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required("Please enter your new password")
    .min(8, "Password must be at lease 8 characters"),

  confirmPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword"), null], "Password must match"),
});

// * Form Validation For Change Password (with current password)
export const changePasswordSchema = yup.object().shape({
  currentPassword: yup
    .string()
    .required("Current password is required"),

  newPassword: yup
    .string()
    .required("Please enter your new password")
    .min(8, "Password must be at least 8 characters"),

  confirmPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword"), null], "Passwords must match"),
});

export const registrationSchema = yup.object().shape({
  firstName: yup.string().required("First Name is required"),
  lastName: yup.string().required("Last Name is required"),
  age: yup
    .number("Must be a number")
    .typeError("Age must be a valid number")
    .required("Age is required")
    .positive("age must be positive")
    .integer("age must be an integer"),
  email: yup
    .string()
    .email("Email must be a valid email address")
    .required("Email is required")
    .matches(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email is invalid"),
  dateOfBirth: yup.date()
  .typeError("Date of Birth must be a valid date")
  .required("Date of Birth is required"),
});

