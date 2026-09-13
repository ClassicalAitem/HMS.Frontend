import React from 'react';
import { LuPencilLine } from 'react-icons/lu';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { MdDeleteOutline } from 'react-icons/md';

const PatientPageHeader = ({ onEdit, onDelete, onClose }) => (
  <div className="flex justify-between items-center mb-6">
    <div className="flex items-center space-x-4">
      <div>
        <h1 className="text-xl font-regular text-base-content/70 2xl:text-2xl">Patient Details</h1>
      </div>
    </div>
    <div className="flex items-center">
      {onDelete && (
        <button onClick={onDelete} className="btn btn-ghost btn-sm text-error/70 hover:text-error" title="Delete Patient">
          <MdDeleteOutline className="w-4 h-4 2xl:w-6 2xl:h-6" />
        </button>
      )}
      <button onClick={onEdit} className="btn btn-ghost btn-sm" title="Edit Patient">
        <LuPencilLine className="w-4 h-4 2xl:w-6 2xl:h-6" />
      </button>
      <button onClick={onClose} className="btn btn-ghost btn-sm" title="Close">
        <IoIosCloseCircleOutline className="w-4 h-4 2xl:w-6 2xl:h-6" />
      </button>
    </div>
  </div>
);

export default PatientPageHeader;