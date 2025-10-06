import React, { useMemo } from "react";
import { PiUsersThree } from "react-icons/pi";
import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const TotalStaff = () => {
  // Responsive radius hook
  const [chartRadius, setChartRadius] = useState({ inner: 45, outer: 65 });

  useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth;

      if (width > 1400) {
        // 2xl screens
        setChartRadius({ inner: 70, outer: 90 });
      } else {
        // sm and below
        setChartRadius({ inner: 45, outer: 55 });
      }
    };

    // Initial update
    updateRadius();

    // Add resize listener
    window.addEventListener("resize", updateRadius);

    // Cleanup
    return () => window.removeEventListener("resize", updateRadius);
  }, []);

  const chartData = [
    {
      name: "Nurse",
      value: 35,
      color: "#8AD3A8",
      shortName: "Nurse",
    },
    {
      name: "Doctors",
      value: 30,
      color: "#E97A46",
      shortName: "Doctors",
    },
    {
      name: "Non medical staff",
      value: 29,
      color: "#B3261E",
      shortName: "Non medical staff",
    },
    {
      name: "Pharmacist",
      value: 28,
      color: "#004A1E",
      shortName: "Pharmacist",
    },
    {
      name: "Cashier",
      value: 28,
      color: "#057A9D",
      shortName: "Cashier",
    },
  ];

  const total = useMemo(() =>
    chartData.reduce((sum, index) => sum + index.value, 0, [chartData])
  );

  // Custom label function to show percentage in center
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }) => {
    return null; // We'll show total percentage in center separately
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="absolute z-10 p-3 rounded-lg border shadow-lg bg-white">
          <p className="font-medium text-gray-700">{data.name}</p>
          <p className="font-bold text-green-600">
            {data.value} ({((data.value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5">
      {/*header */}
      <div className="mt-">
        <div className="w-full  bg-[#FFFFFF] flex flex-col items-start p-7">
          <div className="flex gap-5 items-center ">
            <h5 className="text-[24px] ">Total Staff</h5>
            <PiUsersThree size={24} />
          </div>
          {/*chart */}
          <div className="flex flex-row-reverse items-center lg:gap-30 ">
            <div className=" relative w-32 h-32 2xl:w-44 2xl:h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/*the pie collect the details inside the chartData */}
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={chartRadius.inner}
                    outerRadius={chartRadius.outer}
                    paddingAngle={6}
                    dataKey="value"
                    labelLine={false}
                    label={renderCustomLabel}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Center percentage text */}
              <div className="relative -top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-[24px] 2xl:text-4xl font-regular text-base-content">
                    150
                  </div>
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col mt-1 2xl:mt-4 gap-2">
              {chartData.map((item, index) => (
                <div key={index} className="flex items-center gap-3 ">
                  <div
                    className="w-2 h-2 rounded-full 2xl:w-3 2xl:h-3 mb-1"
                    style={{ backgroundColor: item.color }}
                  ></div>
                  <span className="flex text-xs 2xl:text-base text-base-content/70">
                    {item.shortName}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TotalStaff;
