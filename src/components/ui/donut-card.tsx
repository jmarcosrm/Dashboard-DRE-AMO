import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { formatCurrency, formatPercentage } from '../../utils/formatters';
import { ChartDataPoint } from '../../types';

interface DonutCardProps {
  title: string;
  data: ChartDataPoint[];
  showLegend?: boolean;
  showTooltip?: boolean;
  showValues?: boolean;
  format?: 'currency' | 'percentage' | 'number';
  innerRadius?: number;
  outerRadius?: number;
  className?: string;
}

export const DonutCard: React.FC<DonutCardProps> = ({
  title,
  data,
  showLegend = true,
  showTooltip = true,
  showValues = true,
  format = 'currency',
  innerRadius = 60,
  outerRadius = 100,
  className = ''
}) => {
  // Calcular total para percentuais
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  // Formatar valor
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return formatCurrency(value);
      case 'percentage':
        return formatPercentage(value);
      case 'number':
        return value.toLocaleString('pt-BR');
      default:
        return value.toString();
    }
  };
  
  // Tooltip customizado
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = ((data.value / total) * 100).toFixed(1);
      
      return (
        <div className="glass-card p-3 shadow-tech">
          <div className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: data.color }}
            />
            <span className="font-medium text-gray-900 dark:text-white">
              {data.name}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div>Valor: {formatValue(data.value)}</div>
            <div>Percentual: {percentage}%</div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Legenda customizada
  const CustomLegend = ({ payload }: any) => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {payload.map((entry: any, index: number) => {
          const percentage = ((entry.payload.value / total) * 100).toFixed(1);
          
          return (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.value} ({percentage}%)
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className={`card-modern p-6 group hover:scale-[1.02] transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-bold bg-gradient-to-r from-tech-600 to-tech-800 dark:from-tech-400 dark:to-tech-600 bg-clip-text text-transparent mb-2">
          {title}
        </h3>
        {showValues && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Total: {formatValue(total)}
          </div>
        )}
      </div>
      
      {/* Gráfico */}
      <div className="relative h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={innerRadius}
              outerRadius={outerRadius}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  className="hover:opacity-80 transition-opacity duration-200"
                />
              ))}
            </Pie>
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            {showLegend && (
              <Legend 
                content={<CustomLegend />}
                wrapperStyle={{ paddingTop: '20px' }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        
        {/* Centro do donut com valor total */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center glass-card p-4 rounded-2xl">
            <div className="text-2xl font-bold bg-gradient-to-r from-tech-600 to-tech-800 dark:from-tech-400 dark:to-tech-600 bg-clip-text text-transparent">
              {formatValue(total)}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider font-medium">
              Total
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};