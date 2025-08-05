import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DollarSign } from 'lucide-react';

interface ChartData {
  date: string;
  revenue: number;
}

interface RevenueChartProps {
  data: ChartData[];
  loading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading = false }) => {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1); // Avoid division by zero

  const formatPeriod = (period: string) => {
    return new Date(period).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-6">
        <DollarSign className="w-6 h-6 text-green-600" />
        <h2 className="text-xl font-bold text-gray-900">Daily Revenue (Last 7 Days)</h2>
      </div>

      {/* Chart Container */}
      <div className="relative h-80 overflow-x-auto">
        <div className="min-w-full h-full flex items-end justify-between px-4 pb-8">
          {data.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;

            return (
              <div key={item.date} className="flex flex-col items-center space-y-2 min-w-0 flex-1">
                {/* Line Chart Point */}
                <div className="relative flex-1 flex items-end w-full max-w-12">
                  <motion.div
                    initial={{ scale: 0, y: 0 }}
                    animate={{ scale: 1, y: `-${height}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full group cursor-pointer hover:bg-blue-700 transition-colors z-10"
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                      <div className="text-center">
                        <div className="font-semibold">{formatPeriod(item.date)}</div>
                        <div>${item.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Line Connection */}
                  {index < data.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: (index + 0.5) * 0.1 }}
                      className="absolute bottom-0 left-1/2 w-full h-0.5 bg-blue-600 origin-left"
                      style={{
                        transform: `translateY(-${height}%) rotate(${
                          Math.atan2(
                            ((data[index + 1].revenue / maxRevenue) * 100) - height,
                            100 / data.length
                          ) * (180 / Math.PI)
                        }deg)`,
                        transformOrigin: 'left center'
                      }}
                    />
                  )}
                </div>

                {/* Period Label */}
                <div className="text-xs text-gray-600 text-center transform -rotate-45 origin-center whitespace-nowrap">
                  {formatPeriod(item.date)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            ${data.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue (Last 7 Days)</div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;