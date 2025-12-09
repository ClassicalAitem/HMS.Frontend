import React from "react";

const AddItemsModals = ({ showModal, setShowModal }) => {
   if (!showModal) return null;
  return (
    <div className="fixed inset-0 z-50 p-2 bg-black/10 backdrop-blur-[1px] bg-opacity-40 flex justify-center items-start overflow-y-auto">
      <div className="bg-[#FFFFFF] shadow-lg p-6 max-w-[633px] w-full h-[734px] mt-10 rounded-lg">
        <div className="">
          <div>
            <h1 className="text-[#00943C] text-[24px] font-[500]">
              Add New Inventory Item
            </h1>
            <p className="text-[16px] text-[#605D66] mt-3">
              Add a new item to the laboratory inventory
            </p>
          </div>

          <form>
            <div>
              <label className="block text-[20px] mt-5"> Item Name</label>
              <input
                type="text"
                placeholder="Enter item here"
                className="input w-full h-[56px] mt-2"
              />
            </div>

            <div>
              <label className="block text-[20px] mt-3"> Category Name</label>
              <input
                type="text"
                placeholder="e.g consumables, reagents"
                className="input w-full h-[56px] mt-2"
              />
            </div>

            <div className="flex justify-between mt-3">
              <div>
                <label className="block text-[20px] ">Min Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input w-[280px] h-[56px] "
                />
              </div>

              <div>
                <label className="block text-[20px] "> Current Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input w-[280px] h-[56px] "
                />
              </div>
            </div>

            <div className="flex justify-between mt-3">
              <div>
                <label className="block text-[20px] ">Max Stock</label>
                <input
                  type="number"
                  placeholder="0"
                  className="input w-[280px] h-[56px]"
                />
              </div>

              <div>
                <label className="block text-[20px]">Unit</label>
                <input
                  type="number"
                  placeholder="e.g boxes, ml. pieces"
                  className="input w-[280px] h-[56px] "
                />
              </div>
            </div>

            <div>
              <label className="block text-[20px] mt-3">
                Supplier / Vendor
              </label>
              <input
                type="text"
                placeholder="Enter supplier/vendor name"
                className="input w-full h-[56px] mt-2"
              />
            </div>

            <div className="flex justify-center mt-5 gap-4 mx-auto">
              <button
                onClick={() => setShowModal(false)}
                className="w-[178px] h-[52px]  text-[#000000] border       rounded-[6px]"
                type="button"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="w-[178px] h-[52px] bg-[#00943C] text-[#FFFFFF] rounded-[6px]"
              >
                Add Items
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddItemsModals;
