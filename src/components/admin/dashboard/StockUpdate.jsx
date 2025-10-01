import React from "react";
import { TbChartDots2 } from "react-icons/tb";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const StockUpdate = () => {
  const stockData = [
    { name: "Ventilators", stock: 90 },
    { name: "MRI Machines", stock: 60 },
    { name: "ECG Units", stock: 100 },
    { name: "Operating Beds", stock: 50 },
  ];
  return (
    <div className="p-5 ">
      <div className="w-full h-[272px] bg-[#FFFFFF] flex flex-col gap-6 items-start p-7">
        <div className="flex gap-5 items-center  ">
          <h5 className="text-[24px] text-[#605D66] ">Stocks Update</h5>
          <TbChartDots2 size={24} color="#605D66" />
        </div>

        <ResponsiveContainer width="100%" height={180}>
          <BarChart
            data={stockData}
            barSize={48}
            barCategoryGap="10%"
            barGap={4}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#E5E7EB"
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#6B7280", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(0,0,0,0.05)" }}
              contentStyle={{
                background: "#F6FFF9",
                border: "none",
                color: "#222",
              }}
            />
            <Bar
              dataKey="stock"
              fill="#8EC0A3"
              radius={[8, 8, 0, 0]}
              label={{ position: "top", fill: "#222", fontSize: 12 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StockUpdate;
