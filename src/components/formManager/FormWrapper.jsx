import React from 'react';
import { Field } from 'formik';

// Form Wrapper
export const FormWrapper = ({ title, children, ...props }) => {
  return (
    <div className=" p-0 lg:p-4 rounded-lg ">
      <h3>{title}</h3>
      <form {...props} className="space-y-4">
        {children}
      </form>
    </div>
  );
};

// Input Component
export const Input = ({ label, name, className, type = 'text', ...props }) => (
  <div className="w-full my-1">
    <label htmlFor={name} className="block my-1 text-xs font-bold">
      {label}
    </label>
    <Field name={name}>
      {({ form }) => (
        <input
          id={name}
          name={name}
          type={type}
          className={`block w-full rounded-lg border border-gray text-dark p-2.5 sm:text-xs  ${className}`}
          onChange={(event) => {
            if (type === 'file') {
              const file = event.currentTarget.files[0]; // Get the first file (if multiple files are not allowed)
              form.setFieldValue(name, file); // Set the file object in Formik
            } else {
              form.handleChange(event); // Handle other input types normally
            }
          }}
          {...props}
        />
      )}
    </Field>
    <Field>
      {({ form }) =>
        form.touched[name] && form.errors[name] ? (
          <span className="text-sm font-light text-danger">{form.errors[name]}</span>
        ) : null
      }
    </Field>
  </div>
);

// Select Component
export const Select = ({ label, name, options, ...props }) => (
  <div className="my-1 w-full">
    <label className="block my-1 text-xs text-dark-gray font-bold">{label}</label>
    <Field as="select" name={name} className="w-full p-2 border rounded text-xs" {...props}>
      <option value="">Select an option</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </Field>
    <Field>
      {({ form }) =>
        form.touched[name] && form.errors[name] ? (
          <span className="text-sm font-light text-danger">{form.errors[name]}</span>
        ) : null
      }
    </Field>
  </div>
);

// Submit Button Component
export const SubmitButton = ({ label, isLoading }) => (
  <button
    type="submit"
    className={`p-2 ${isLoading ? 'bg-dark-gray' : 'bg-light-green'} w-full rounded-lg px-5 text-center text-sm font-medium text-white bg-green py-2.5 hover:bg-light-green focus:ring-0 focus:outline-none`}
    disabled={isLoading}
  >
    {isLoading ? 'Please wait...' : label}
  </button>
);

// Enhanced TextArea Component using CKEditor
export const EnhancedTextArea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  id,
  rows = 5,
  ...props
}) => {
  return (
    <div className="mb-4 w-full">
      <label htmlFor={id || name} className="block mb-1 font-bold text-xs">
        {label}
      </label>
      <textarea
        id={id || name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder || `Enter your ${label.toLowerCase()}`}
        rows={rows}
        className="w-full h-[100px] border rounded-lg p-3 focus:outline-none focus:ring-0 text-xs"
        {...props}
      />
    </div>
  );
};
