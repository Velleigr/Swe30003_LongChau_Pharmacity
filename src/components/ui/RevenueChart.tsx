import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react';

interface RevenueData {
  period: string;
  revenue: number;
  orders: number;
  customers: number;
}

interface RevenueChartProps {
  data: RevenueData[];
  loading?: boolean;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data, loading = false }) => {
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [timePeriod, setTimePeriod] = useState<'day' | 'month' | 'quarterly'>('day');
  const [processedData, setProcessedData] = useState<RevenueData[]>([]);

  useEffect(() => {
    // Process data based on selected time period
    const processData = () => {
      if (!data || data.length === 0) return [];

      const now = new Date();
      let filteredData: RevenueData[] = [];

      switch (timePeriod) {
        case 'day':
          // Show last 30 days
          const last30Days = Array.from({ length: 30 }, (_, i) => {
            const date = new Date(now);
            date.setDate(date.getDate() - (29 - i));
            return date.toISOString().split('T')[0];
          });
          
          filteredData = last30Days.map(date => {
            const existingData = data.find(d => d.period === date);
            return existingData || {
              period: date,
              revenue: Math.random() * 50000 + 10000, // Mock data
              orders: Math.floor(Math.random() * 50) + 10,
              customers: Math.floor(Math.random() * 30) + 5
            };
          });
          break;

        case 'month':
          // Show last 12 months
          const last12Months = Array.from({ length: 12 }, (_, i) => {
            const date = new Date(now);
            date.setMonth(date.getMonth() - (11 - i));
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          });
          
          filteredData = last12Months.map(month => {
            const existingData = data.find(d => d.period.startsWith(month));
            return existingData || {
              period: month,
              revenue: Math.random() * 500000 + 100000, // Mock data
              orders: Math.floor(Math.random() * 500) + 100,
              customers: Math.floor(Math.random() * 200) + 50
            };
          });
          break;

        case 'quarterly':
          // Show last 8 quarters
          const last8Quarters = Array.from({ length: 8 }, (_, i) => {
            const date = new Date(now);
            const currentQuarter = Math.floor(date.getMonth() / 3) + 1;
            const quarterOffset = 7 - i;
            const targetQuarter = currentQuarter - quarterOffset;
            
            let year = date.getFullYear();
            let quarter = targetQuarter;
            
            while (quarter <= 0) {
              quarter += 4;
              year -= 1;
            }
            while (quarter > 4) {
              quarter -= 4;
              year += 1;
            }
            
            return `${year}-Q${quarter}`;
          });
          
          filteredData = last8Quarters.map(quarter => {
            const existingData = data.find(d => d.period === quarter);
            return existingData || {
              period: quarter,
              revenue: Math.random() * 1500000 + 300000, // Mock data
              orders: Math.floor(Math.random() * 1500) + 300,
              customers: Math.floor(Math.random() * 600) + 150
            };
          });
          break;
      }

      return filteredData;
    };

    setProcessedData(processData());
  }, [data, timePeriod]);

  const maxRevenue = Math.max(...processedData.map(d => d.revenue));
  const formatPeriod = (period: string) => {
    if (timePeriod === 'day') {
      return new Date(period).toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' });
    } else if (timePeriod === 'month') {
      const [year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('vi-VN', { 
        year: 'numeric', 
        month: 'short' 
      });
    } else {
      return period;
    }
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
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex items-center space-x-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h2 className="text-xl font-bold text-gray-900">Revenue Analytics</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Time Period Selector */}
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value as 'day' | 'month' | 'quarterly')}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Daily (30 days)</option>
              <option value="month">Monthly (12 months)</option>
              <option value="quarterly">Quarterly (8 quarters)</option>
            </select>
          </div>
          
          {/* Chart Type Selector */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Bar</span>
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Line</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-80 overflow-x-auto">
        <div className="min-w-full h-full flex items-end justify-between px-4 pb-8">
          {processedData.map((item, index) => {
            const height = (item.revenue / maxRevenue) * 100;
            
            return (
              <div key={item.period} className="flex flex-col items-center space-y-2 min-w-0 flex-1">
                {/* Chart Element */}
                <div className="relative flex-1 flex items-end w-full max-w-12">
                  {chartType === 'bar' ? (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${height}%` }}
                      transition={{ duration: 0.8, delay: index * 0.1 }}
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-md relative group cursor-pointer hover:from-blue-700 hover:to-blue-500 transition-colors"
                      style={{ minHeight: '4px' }}
                    >
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                        <div className="text-center">
                          <div className="font-semibold">{formatPeriod(item.period)}</div>
                          <div>${item.revenue.toLocaleString()}</div>
                          <div>{item.orders} orders</div>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="w-full h-full relative">
                      {/* Line Chart Point */}
                      <motion.div
                        initial={{ scale: 0, y: 0 }}
                        animate={{ scale: 1, y: `-${height}%` }}
                        transition={{ duration: 0.8, delay: index * 0.1 }}
                        className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-blue-600 rounded-full group cursor-pointer hover:bg-blue-700 transition-colors z-10"
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                          <div className="text-center">
                            <div className="font-semibold">{formatPeriod(item.period)}</div>
                            <div>${item.revenue.toLocaleString()}</div>
                            <div>{item.orders} orders</div>
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Line Connection */}
                      {index < processedData.length - 1 && (
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ duration: 0.8, delay: (index + 0.5) * 0.1 }}
                          className="absolute bottom-0 left-1/2 w-full h-0.5 bg-blue-600 origin-left"
                          style={{
                            transform: `translateY(-${height}%) rotate(${
                              Math.atan2(
                                ((processedData[index + 1].revenue / maxRevenue) * 100) - height,
                                100 / processedData.length
                              ) * (180 / Math.PI)
                            }deg)`,
                            transformOrigin: 'left center'
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
                
                {/* Period Label */}
                <div className="text-xs text-gray-600 text-center transform -rotate-45 origin-center whitespace-nowrap">
                  {formatPeriod(item.period)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            ${processedData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {processedData.reduce((sum, item) => sum + item.orders, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {Math.round(processedData.reduce((sum, item) => sum + item.revenue, 0) / processedData.length).toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Average Revenue</div>
        </div>
      </div>
    </div>
  );
};

export default RevenueChart;