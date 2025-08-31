

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types'; // Import prop-types

export const AlertMessage = ({ alert }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (alert.error || alert.success) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [alert]);

  if (!visible) return null;

  return (
    <div
      className={`flex items-center p-2 mb-2 rounded-lg border ${
        alert.error ? ' text-danger' : 'bg-light-green text-white'
      }`}
      role="alert"
    >
      <div className="ms-3 text-sm font-medium text-center">{alert.error || alert.success}</div>
      <button
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 bg-transparent text-dark rounded-lg p-1.5 hover:bg-white hover:bg-opacity-20 inline-flex items-center justify-center h-8 w-8"
        onClick={() => setVisible(false)}
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-3 h-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  );
};

// Define prop types for AlertMessage
AlertMessage.propTypes = {
  alert: PropTypes.shape({
    error: PropTypes.string,
    success: PropTypes.string
  }).isRequired
};

export const PopupError = ({ message }) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex justify-center items-start mt-4 z-[9999]">
      <div className="py-2 px-3 text-center bg-white mx-auto w-[300px] shadow">
        <span className="text-danger text-xs">{message}</span>
      </div>
    </div>
  );
};

// Define prop types for PopupError
PopupError.propTypes = {
  message: PropTypes.string.isRequired
};
