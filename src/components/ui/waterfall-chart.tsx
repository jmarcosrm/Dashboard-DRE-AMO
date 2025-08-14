import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { formatCurrency, formatCompactNumber } from '../../utils/formatters';
import { WaterfallDataPoint } from '../../types';

interface WaterfallChartProps {
  title: string;
  data: WaterfallDataPoint[];
  showGrid?: boolean;
  showTooltip?: boolean;
  height?: number;
  className?: string;
}

export const WaterfallChart: React.FC<WaterfallChartProps> = ({
  title,
  data,
  showGrid = true,
  showTooltip = true,
  height = 400,
  className = ''
}) => {
  // Processar dados para waterfall
  const processedData = React.useMemo(() => {
    let runningTotal = 0;
    
    return data.map((item, index) => {
      const isTotal = item.type === 'total';
      const isPositive = item.value > 0;
      const isNegative = item.value < 0;
      
      let start = runningTotal;
      let end = runningTotal + item.value;
      
      if (isTotal) {
        start = 0;
        end = item.value;
        runningTotal = item.value;
      } else {
        runningTotal += item.value;
      }
      
      return {
        ...item,
        start,
        end,
        displayValue: Math.abs(item.value),
        color: isTotal 
          ? '#6366f1' 
          : isPositive 
            ? '#10b981' 
            : '#ef4444'
      };
    });
  }, [data]);
  
  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="font-medium text-gray-900 dark:text-white mb-2">
            {label}
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Valor:
              </span>
              <span className={`text-sm font-medium ${
                data.type === 'total' 
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : data.value > 0 
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
              }`}>
                {formatCurrency(data.value)}
              </span>
            </div>
            {data.type !== 'total' && (
              <div className="flex items-center justify-between space-x-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Acumulado:
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(data.end)}
                </span>
              </div>
            )}
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tipo: {data.type === 'total' ? 'Total' : data.value > 0 ? 'Receita' : 'Custo/Despesa'}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Análise de composição do resultado
        </p>
      </div>
      
      {/* Gráfico */}
      <div style={{ height: `${height}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={processedData} 
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            {showGrid && (
              <CartesianGrid 
                strokeDasharray="3 3" 
                className="stroke-gray-200 dark:stroke-gray-700"
              />
            )}
            
            <XAxis 
              dataKey="name"
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
              angle={-45}
              textAnchor="end"
              height={80}
              interval={0}
            />
            
            <YAxis 
              className="text-xs fill-gray-600 dark:fill-gray-400"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => formatCompactNumber(value)}
            />
            
            {showTooltip && <Tooltip content={<CustomTooltip />} />}
            
            <Bar 
              dataKey="displayValue" 
              radius={[4, 4, 0, 0]}
              className="hover:opacity-80 transition-opacity duration-200"
            >
              {processedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legenda */}
      <div className="flex flex-wrap justify-center gap-6 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Receitas
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Custos/Despesas
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Totais
          </span>
        </div>
      </div>
    </div>
  );
};