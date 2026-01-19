import React from 'react';
import { IoCloseCircleOutline } from "react-icons/io5";

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="flex fixed inset-0 z-50 justify-center items-center backdrop-blur-sm bg-black/70">
      <div className="mx-4 w-full max-w-md shadow-xl card bg-white">
        <div className="p-6 card-body">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
              {title}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <IoCloseCircleOutline size={24} />
            </button>
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-500">
              {message}
            </p>
          </div>

          <div className="flex gap-3 mt-6 justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-md text-sm font-medium focus:outline-none"
              onClick={onClose}
            >
              {cancelText}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-[#00943C] text-white hover:bg-[#007a31] rounded-md text-sm font-medium focus:outline-none"
              onClick={onConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;