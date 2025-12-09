import React from "react";
import { mostRequestedTests } from "../../../../data";
import { performanceMetrics } from "../../../../data";
import { workloadSummary } from "../../../../data";

const Analytics = () => {
  return (
    <div>
      <section className="flex justify-between mt-10">
        <div className="w-[420px] h-[320px] border border-[#AEAAAE] rounded-[6px] p-4">
          <h1 className="text-[20px] font-[500]">Most Requested Test</h1>
          <p className="text-[16px] text-[#605D66]">
            {" "}
            Top 5 test types this month
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {mostRequestedTests.map((items, index) => {
              return (
                <div
                  key={index}
                  className="flex justify-between text-[#605D66]"
                >
                  <h1>{items.testType}</h1>
                  <p className="w-[31px] h-[20px] bg-[#E9E8EA] flex justify-center text-[#000000]">
                    {items.count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[420px] h-[320px] border border-[#AEAAAE] rounded-[6px] p-4">
          <h1 className="text-[20px] font-[500]">Performance Metrics</h1>
          <p className="text-[16px] text-[#605D66]">
            {" "}
            Key performance indicators
          </p>

          <div className="mt-10 flex flex-col gap-3">
            {performanceMetrics.map((items, index) => {
              return (
                <div key={index} className="text-[#605D66]">
                  <div className="flex justify-between">
                    <h1>{items.title}</h1>
                    <p>{items.value}%</p>
                  </div>

                  <div className="w-full bg-[#D1CDD8] rounded-full h-3 mt-2">
                    <div
                      className="bg-[#00943C] h-3 rounded-full"
                      style={{ width: `${items.value}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="w-[420px] h-[320px] border border-[#AEAAAE] rounded-[6px] p-4">
          <h1 className="text-[20px] font-[500]">Workload Summary</h1>
          <p className="text-[16px] text-[#605D66]"> Tests by priority level</p>

          <div className="mt-10 flex flex-col gap-3">
            {workloadSummary.map((items, index) => {
              return (
                <div
                  key={index}
                  className="flex justify-between text-[#605D66]"
                >
                  <h1>{items.level}</h1>
                  <p className="w-[31px] h-[20px] bg-[#E9E8EA] flex justify-center text-[#000000]">
                    {items.count}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Analytics;
