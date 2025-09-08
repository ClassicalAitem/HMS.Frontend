import React from 'react';
import { FaEllipsisH, FaCalendarAlt } from 'react-icons/fa';

const OverallDischarge = () => {
  // Pie chart data
  const chartData = {
    discharged: 65,
    admitted: 25,
    passedAway: 10
  };

  const total = chartData.discharged + chartData.admitted + chartData.passedAway;
  
  // Calculate percentages and stroke dash arrays for SVG
  const calculateStroke = (value, total, radius) => {
    const percentage = (value / total) * 100;
    const circumference = 2 * Math.PI * radius;
    return {
      percentage,
      strokeDasharray: circumference,
      strokeDashoffset: circumference - (percentage / 100) * circumference
    };
  };

  const radius = 45;
  const dischargedStroke = calculateStroke(chartData.discharged, total, radius);
  const admittedStroke = calculateStroke(chartData.admitted, total, radius);
  const passedAwayStroke = calculateStroke(chartData.passedAway, total, radius);

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-base-200 rounded-full flex items-center justify-center">
            <FaCalendarAlt className="w-5 h-5 text-base-content/60" />
          </div>
          <h3 className="text-lg font-semibold text-base-content">Overall Discharge</h3>
        </div>
        <button className="p-2 text-base-content/40 hover:text-base-content/60 transition-colors">
          <FaEllipsisH className="w-4 h-4" />
        </button>
      </div>

      {/* Chart and Legend */}
      <div className="flex items-center justify-between">
        {/* Pie Chart */}
        <div className="relative flex items-center justify-center">
          <svg width="120" height="120" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f3f4f6"
              strokeWidth="12"
            />
            
            {/* Discharged segment (green) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={dischargedStroke.strokeDasharray}
              strokeDashoffset={dischargedStroke.strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Admitted segment (yellow) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={admittedStroke.strokeDasharray}
              strokeDashoffset={admittedStroke.strokeDashoffset - dischargedStroke.strokeDasharray + dischargedStroke.strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
            
            {/* Passed away segment (red) */}
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={passedAwayStroke.strokeDasharray}
              strokeDashoffset={passedAwayStroke.strokeDashoffset - admittedStroke.strokeDasharray - dischargedStroke.strokeDasharray + admittedStroke.strokeDashoffset}
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          
          {/* Center text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-base-content">100%</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-base-content/70">{chartData.discharged} Patient Discharged</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span className="text-sm text-base-content/70">{chartData.admitted} Patient Admitted</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-sm text-base-content/70">{chartData.passedAway} Patient Passed away</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default OverallDischarge;
