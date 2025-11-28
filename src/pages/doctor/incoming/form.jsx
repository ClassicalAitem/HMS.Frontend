import React from 'react'

const form = () => {
  return (
    <div>
      <section className="mt-5">
        <div className="flex justify-between">
          {/* Billable items, Billing summary */}

          <div className="flex flex-col gap-5">
            {/* Billable items forms*/}
            <div className="w-[680px] h-[689px] border  border-[#AEAAAE] rounded-[6px]"></div>

            {/* Billing summary */}
            <div className="w-[680px] h-[216px] border  border-[#AEAAAE] rounded-[6px]"></div>
          </div>

          {/* Diagnosis, Treatments and visit information form fields */}
          <div className="flex flex-col gap-5">
            <div className="w-[680px] h-[300px] border border-[#AEAAAE] rounded-[6px] "></div>
            <div className="w-[680px] h-[300px] border border-[#AEAAAE] rounded-[6px]"></div>
            <div className="w-[680px] h-[176px] border  border-[#AEAAAE] rounded-[6px]"></div>
            <div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default form
