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
import apiClient from "../../../services/api/apiClient";

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

  const [chartData, setChartData] = useState([
    { name: "Nurse", value: 0, color: "#8AD3A8", shortName: "Nurse" },
    { name: "Doctors", value: 0, color: "#E97A46", shortName: "Doctors" },
    { name: "Pharmacist", value: 0, color: "#004A1E", shortName: "Pharmacist" },
    { name: "Cashier", value: 0, color: "#057A9D", shortName: "Cashier" },
    { name: "Non medical staff", value: 0, color: "#B3261E", shortName: "Non medical staff" },
  ]);

  // Map backend accountType to chart categories
  const mapAccountTypeToCategory = (accountType = "") => {
    const type = String(accountType).toLowerCase();
    // Official types: admin, doctor, nurse, front-desk, cashier, surgeon
    if (type.includes("doctor") || type.includes("surgeon")) return "Doctors";
    if (type.includes("nurse")) return "Nurse";
    if (type.includes("cashier")) return "Cashier";
    if (type.includes("pharmacist")) return "Pharmacist"; // keep support if present
    if (type.includes("front-desk") || type.includes("frontdesk") || type.includes("admin")) return "Non medical staff";
    // Default bucket for any other roles
    return "Non medical staff";
  };

  // Fetch metrics and aggregate counts by category
  useEffect(() => {
    const fetchAndAggregate = async () => {
      try {
        const res = await apiClient.get("/metrics/getOverallStaff");
        const data = res?.data?.data || {};

        const counts = {
          Nurse: Number(data.totalNurses) || 0,
          Doctors: Number(data.totalDoctors) || 0, // Surgeons not provided in metrics
          Pharmacist: Number(data.totalPharmacists) || 0,
          Cashier: Number(data.totalCashiers) || 0,
          "Non medical staff":
            (Number(data.totalAdmin) || 0) +
            (Number(data.totalFrontDesk) || 0) +
            (Number(data.totalOtherStaff) || 0) +
            (Number(data.totalHr) || 0) +
            (Number(data.totalAccountOfficers) || 0),
        };

        setChartData((prev) => prev.map((item) => ({ ...item, value: counts[item.name] || 0 })));
      } catch (err) {
        console.error("TotalStaff: Failed to fetch users for chart", err);
        // Leave chartData as-is (zeros) on error
      }
    };

    fetchAndAggregate();
  }, []);

  const total = useMemo(() => chartData.reduce((sum, curr) => sum + curr.value, 0), [chartData]);

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
        <div className="absolute z-10 p-3 rounded-lg border shadow-lg bg-base-100">
          <p className="font-medium text-base-content">{data.name}</p>
          <p className="font-bold text-base-content">
            {data.value} ({((data.value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-5 xl:w-3/5 rounded-md shadow-md shadow-base-content/40">
      {/*header */}
      <div className="bg-red-300 flex rounded-md">
        <div className="pl-9  h-[272px] bg-base-100 flex flex-col items-start p-4 w-full">
          <div className="flex gap-5 items-center ">
            <h5 className="text-[24px] ">Total Staff</h5>
            <PiUsersThree size={24} />
          </div>
          {/*chart */}
          <div className="flex flex-row-reverse items-center lg:gap-30 ">
            <div className="relative w-32 h-32 2xl:w-48 2xl:h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  {/*the pie collect the details inside the chartData */}
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={chartRadius.inner}
                    outerRadius={chartRadius.outer}
                    paddingAngle={1}
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
                    {total}
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
