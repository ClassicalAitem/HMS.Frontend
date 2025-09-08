/* eslint-disable no-unused-vars */
import React from 'react';
import { CiCalendarDate } from 'react-icons/ci';
import { IoMdMore } from 'react-icons/io';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const OverallDischarge = () => {
  // Pie chart data for Recharts
  const chartData = [
    {
      name: 'Patient Discharged',
      value: 65,
      color: '#10b981',
      shortName: 'Discharged'
    },
    {
      name: 'Patient Admitted', 
      value: 25,
      color: '#f59e0b',
      shortName: 'Admitted'
    },
    {
      name: 'Patient Passed away',
      value: 10,
      color: '#ef4444',
      shortName: 'Passed away'
    }
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  // Custom label function to show percentage in center
  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    return null; // We'll show total percentage in center separately
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="absolute z-10 p-3 rounded-lg border shadow-lg bg-base-300 border-base-300">
          <p className="font-medium text-base-content">{data.name}</p>
          <p className="font-bold text-primary">
            {data.value} ({((data.value / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="shadow-2xl card bg-base-100 shadow-secondary/20">
      <div className="card-body">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">      
          <div className="flex justify-center items-center p-2 rounded-full bg-secondary/70">
            <div className="flex justify-center items-center p-2 rounded-2xl bg-base-200">
              <CiCalendarDate className="w-6 h-auto font-bold text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-regular text-base-content">Overall Discharge</h3>
        </div>
        <button className="p-2 transition-colors text-base-content/40 hover:text-base-content/60">
          <IoMdMore className="w-4 h-4 font-bold text-base-content" />
        </button>
      </div>

      {/* Chart and Legend */}
      <div className="flex flex-col justify-between items-center">
        {/* Recharts Pie Chart */}
        <div className="relative w-44 h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={85}
                paddingAngle={6}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              {/* <Tooltip content={<CustomTooltip />} /> */}
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center percentage text */}
          <div className="relative -top-[50%] left-[50%] transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-4xl font-regular text-base-content">100%</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex justify-center items-center mt-4 space-x-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              ></div>
              <span className="text-sm text-base-content/70">
                {item.value} {item.shortName}
              </span>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
};

export default OverallDischarge;
