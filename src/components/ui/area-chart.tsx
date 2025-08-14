import React from 'react';
import { 
  AreaChart as RechartsAreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { formatCurrency, formatCompactNumber } from '../../utils/formatters';
import { TimeSeriesDataPoint } from '../../types';

interface AreaChartProps {
  title: string;
  data: TimeSeriesDataPoint[];
  dataKeys: { key: string; name: string; color: string }[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  format?: 'currency' | 'number' | 'percentage';
  height?: number;
  className?: string;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  title,
  data,
  dataKeys,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  format = 'currency',
  height = 300,
  className = ''
}) => {
  // Formatar valor
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'number':
        return formatCompactNumber(value);
      case 'percentage':
        return `${value.toFixed(1)}%`;
      default:
        return value.toString();
    }
  };
  
  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </div>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatValue(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Legenda customizada
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-6 mt-4">
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
      </div>
      
      {/* Gráfico */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsAreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-gray-200 dark:stroke-gray-700"
              />
            )}
            
            <XAxis 
              dataKey="period"
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
            />
            
            <YAxis 
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            {showLegend && (
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            )}
            
            {dataKeys.map((item, index) => (
              <Area
                key={item.key}
                type="monotone"
                dataKey={item.key}
                stackId={1}
                stroke={item.color}
                fill={item.color}
                fillOpacity={0.6}
                strokeWidth={2}
                className="hover:fill-opacity-80 transition-all duration-200"
              />
            ))}
          </RechartsAreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};