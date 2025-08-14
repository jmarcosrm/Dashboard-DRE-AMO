import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
  data: number[];
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export const SparklineChart: React.FC<SparklineChartProps> = ({
  data,
  color = '#3b82f6',
  strokeWidth = 2,
  className = ''
}) => {
  // Transformar array de números em formato para Recharts
  const chartData = data.map((value, index) => ({
    index,
    value
  }));
  
  return (
    <div className={`w-full h-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <Line 
            type="monotone" 
            dataKey="value" 
            stroke={color}
            strokeWidth={strokeWidth}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};