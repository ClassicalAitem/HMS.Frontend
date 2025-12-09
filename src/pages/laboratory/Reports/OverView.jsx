import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { testTypeData } from "../../../../data";
import { weeklyTestsData } from "../../../../data";
import { monthlyPerformanceData } from "../../../../data";

const OverView = () => {
  return (
    <section>
      <div className="flex justify-between mt-5">
        {/* Test TypeDistribution Chart */}
        <div className="w-[680px] h-[272px] rounded-[6px] p-5 bg-[#FFFFFF] border border-[#AEAAAE] shadow-sm">
          <div className="flex gap-10">
            <div className="ml-5">
              <div>
                <h2 className="text-[20px] font-[400] text-[#111215]">
                  Test Type Distribution
                </h2>
                <p className="text-[12px] text-[#605D66] mt-1">
                  Breakdown by test category
                </p>
              </div>

              <div className="space-y-3 mt-3 ">
                {testTypeData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-[11px] h-[11px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-[12px] text-[#000000]">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="">
              <div className="flex-1 min-w-[300px]">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={testTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {testTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        padding: "8px 12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
        {/* Tests Completed (This Week) Chart */}
        <div className="w-[680px] h-[272px] rounded-[6px] p-5  bg-[#FFFFFF] border border-[#AEAAAE] shadow-sm">
          <div>
            <h2 className="text-[20px] font-[400] text-[#111215]">
              Tests Completed (This Week)
            </h2>
            <p className="text-[12px] text-[#605D66] mt-1">
              Daily breakdown of completed tests
            </p>
          </div>

          <div className="mt-5">
            <ResponsiveContainer width="100%" height={156}>
              <BarChart
                data={weeklyTestsData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#AEAAAE"
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#000000", fontSize: 12 }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#605D66", fontSize: 12 }}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px 12px",
                  }}
                  cursor={{ fill: "rgba(0, 148, 60, 0.1)" }}
                />
                <Bar
                  dataKey="tests"
                  fill="#8EC0A3"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      {/* Monthly Performance Trend */}

      <section className="mt-10">
        <div className="w-full h-[504px] rounded-[6px] p-5 bg-[#FFFFFF] border border-[#AEAAAE] shadow-sm">
          <div>
            <h2 className="text-[37px] font-[400] text-[#111215]">
              Monthly Performance Trend
            </h2>
            <p className="text-[22px] text-[#605D66] mt-1">
              Completed vs pending tests over time
            </p>
          </div>

          <div className="mt-10">
            <ResponsiveContainer width="100%" height={294}>
              <LineChart
                data={monthlyPerformanceData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 13 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#6b7280", fontSize: 13 }}
                  ticks={[0, 200, 400, 600, 800]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px 16px",
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  iconType="circle"
                  wrapperStyle={{ paddingTop: "20px" }}
                />
                <Line
                  type="linear"
                  dataKey="completed"
                  stroke="#11AD4B"
                  strokeWidth={1}
                  activeDot={{ r: 6 }}
                  name="Completed"
                />
                <Line
                  type="monotone"
                  dataKey="pending"
                  stroke="#F54A00"
                  strokeWidth={2}
                  activeDot={{ r: 6 }}
                  name="Pending"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </section>
  );
};

export default OverView;
