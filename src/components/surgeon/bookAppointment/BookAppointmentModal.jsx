import React from "react";
import { IoMdClose } from "react-icons/io";

const BookAppointmentModal = ({ setShowModal }) => {
  return (
    <div>
      <div className="fixed inset-0 z-50 p-3 bg-black bg-opacity-50 flex items-center justify-center">
        <div className="bg-base-100 rounded-xl shadow-lg p-6 max-w-[688px] w-full max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center">
            <div className="text-primary text-xl md:text-2xl font-semibold">Book Appointment</div>
            <div>
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-ghost btn-sm btn-circle"
                aria-label="Close"
              >
                <IoMdClose size={20} />
              </button>
            </div>
          </div>

          <form>
            <div className="mt-7">
              <label className="block mb-2 text-sm font-medium text-base-content">Patient Name</label>
              <input
                type="text"
                placeholder="Enter name here"
                className="input input-bordered w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">Appointment Date</label>
                <input
                  type="date"
                  className="input input-bordered w-full"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium text-base-content">Appointment Time</label>
                <input
                  type="time"
                  className="input input-bordered w-full"
                />
              </div>
            </div>

            <div>
              <div className="mt-3">
                <label className="block mb-2 text-sm font-medium text-base-content">Department</label>
                <select
                  name="department"
                  className="select select-bordered w-full"
                >
                  <option value="">Departments</option>
                  <option value="doctor">Doctor</option>
                  <option value="lab">Lab</option>
                  <option value="nurse">Nurse</option>
                </select>
              </div>

              <div className="mt-3">
                <label className="block mb-2 text-sm font-medium text-base-content">Reason for visit / notes</label>
                <textarea
                  placeholder="Add notes here"
                  className="textarea textarea-bordered w-full"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setShowModal(false)}
              >
                Save Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookAppointmentModal;
