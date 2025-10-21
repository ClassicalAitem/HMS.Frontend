/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { CiCalendarDate } from 'react-icons/ci';
import { IoMdMore } from 'react-icons/io';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { getMetrics } from '../../../services/api/metricsAPI';

const OverallDischarge = () => {
  // Responsive radius hook
  const [chartRadius, setChartRadius] = useState({ inner: 45, outer: 65 });
  const [metricsData, setMetricsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch metrics data
  useEffect(() => {
    const fetchMetricsData = async () => {
      try {
        setIsLoading(true);
        const response = await getMetrics();
        setMetricsData(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
        setError('Failed to load metrics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMetricsData();

    // Set up polling for dynamic updates (every 30 seconds)
    const intervalId = setInterval(fetchMetricsData, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const updateRadius = () => {
      const width = window.innerWidth;
      
      if (width > 1400) { // 2xl screens
        setChartRadius({ inner: 70, outer: 90 });
      }else { // sm and below
        setChartRadius({ inner: 45, outer: 55 });
      }
    };

    // Initial update
    updateRadius();

    // Add resize listener
    window.addEventListener('resize', updateRadius);
    
    // Cleanup
    return () => window.removeEventListener('resize', updateRadius);
  }, []);

  // Generate chart data from API response or use placeholder data
  const chartData = [
    {
      name: 'Patient Discharged',
      value: metricsData ? (metricsData.totalDischargedPatients || 0) : 1,
      color: '#10b981',
      shortName: 'Discharged'
    },
    {
      name: 'Patient Admitted', 
      value: metricsData ? (metricsData.totalAdmittedPatients || 0) : 1,
      color: '#f59e0b',
      shortName: 'Admitted'
    },
    {
      name: 'Patient Passed away',
      value: metricsData ? (metricsData.totalPassedPatients || 0) : 1,
      color: '#ef4444',
      shortName: 'Passed away'
    },
    {
      name: 'Pending Receipts',
      value: metricsData ? (metricsData.totalPendingReceipt || 0) : 1,
      color: '#3b82f6',
      shortName: 'Pending'
    }
  ];

  // Calculate total patients from metrics data
  const calculateTotalPatients = () => {
    if (!metricsData) return 0;
    
    return (
      (metricsData.totalDischargedPatients || 0) +
      (metricsData.totalAdmittedPatients || 0) +
      (metricsData.totalPassedPatients || 0) +
      (metricsData.totalPendingReceipt || 0)
    );
  };

  const totalPatients = calculateTotalPatients();
  
  // Calculate total from chart data for percentage calculation
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
      <div className="py-2 2xl:py-4 card-body">
      {/* Header */}
      <div className="flex justify-between items-center 2xl:mb-6">
        <div className="flex items-center space-x-4">      
        <div className="flex justify-center items-center p-1 rounded-full 2xl:p-2 bg-secondary/70">
        <div className="flex justify-center items-center p-1 rounded-2xl 2xl:p-2 bg-base-200">
              <CiCalendarDate className="w-4 h-auto font-bold 2xl:w-6 text-primary" />
            </div>
          </div>
          <h3 className="text-base 2xl:text-xl font-regular text-base-content">Overall Discharge</h3>
        </div>
        <button className="p-2 transition-colors text-base-content/40 hover:text-base-content/60">
          <IoMdMore className="w-4 h-4 font-bold text-base-content" />
        </button>
      </div>

      {/* Loading and Error States */}
      {isLoading && !metricsData && (
        <div className="flex justify-center items-center h-32">
          <div className="loading loading-spinner loading-md text-primary"></div>
        </div>
      )}
      
      {error && (
        <div className="flex justify-center items-center h-32">
          <div className="text-error text-center">
            <p>{error}</p>
            <button 
              className="btn btn-sm btn-outline btn-primary mt-2"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                getMetrics()
                  .then(response => {
                    setMetricsData(response.data);
                    setIsLoading(false);
                  })
                  .catch(err => {
                    console.error('Failed to fetch metrics:', err);
                    setError('Failed to load metrics data');
                    setIsLoading(false);
                  });
              }}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Chart and Legend */}
      {!isLoading && !error && (
        <div className="flex flex-col justify-between items-center">
          {/* Recharts Pie Chart */}
          <div className="relative w-32 h-32 2xl:w-46 2xl:h-46">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
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
                <div className="text-2xl 2xl:text-4xl font-regular text-base-content">
                  {totalPatients > 0 ? `${totalPatients}` : '0'}
                </div>
                <div className="w-16 h-2 mt-2 bg-base-300 rounded-full">
                  <div className="h-full w-0 bg-green-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap justify-center items-center mt-1 gap-3 2xl:mt-4">
            {chartData.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-2 h-2 rounded-full 2xl:w-3 2xl:h-3" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs 2xl:text-base text-base-content/70">
                  {metricsData ? item.value : 0} {item.shortName}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default OverallDischarge;
