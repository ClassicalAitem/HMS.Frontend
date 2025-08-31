import { createPortal } from 'react-dom';

const Modal = ({ children, onClose }) => {
  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
      onClick={onClose}
    >
      <div className="bg-white p-4 rounded-lg" onClick={(e) => e.stopPropagation()}>
        {children}
        <button className="mt-4 bg-danger text-white p-3 rounded" onClick={onClose}>
          X
        </button>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
