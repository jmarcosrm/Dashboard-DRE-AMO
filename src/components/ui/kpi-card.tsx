import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatCurrency, formatPercentage, getVariationColor } from '../../utils/formatters';
import { KPIData } from '../../types';
import { SparklineChart } from './sparkline-chart';

interface KPICardProps {
  data: KPIData;
  showSparkline?: boolean;
  showComparison?: boolean;
  showTarget?: boolean;
  className?: string;
}

export const KPICard: React.FC<KPICardProps> = ({
  data,
  showSparkline = true,
  showComparison = true,
  showTarget = true,
  className = ''
}) => {
  const { title, value, previousValue, target, sparklineData, format = 'currency' } = data;
  
  // Calcular variação
  const variation = previousValue ? ((value - previousValue) / previousValue) * 100 : 0;
  const targetVariation = target ? ((value - target) / target) * 100 : 0;
  
  // Determinar ícone de tendência
  const getTrendIcon = (value: number) => {
    if (value > 0) return <TrendingUp className="w-4 h-4" />;
    if (value < 0) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };
  
  // Formatar valor principal
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
  
  return (
    <div className={`card-modern p-6 group hover:scale-[1.02] transition-all duration-300 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {title}
        </h3>
        {showSparkline && sparklineData && (
          <div className="w-16 h-8">
            <SparklineChart 
              data={sparklineData} 
              color={getVariationColor(variation)}
            />
          </div>
        )}
      </div>
      
      {/* Valor Principal */}
      <div className="mb-4">
        <div className="text-3xl font-bold bg-gradient-to-r from-tech-600 to-tech-800 dark:from-tech-400 dark:to-tech-600 bg-clip-text text-transparent mb-1">
          {formatValue(value)}
        </div>
        
        {/* Comparações */}
        <div className="flex flex-col space-y-1">
          {showComparison && previousValue && (
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 text-sm ${getVariationColor(variation)}`}>
                {getTrendIcon(variation)}
                <span className="font-medium">
                  {formatPercentage(Math.abs(variation))}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs período anterior
              </span>
            </div>
          )}
          
          {showTarget && target && (
            <div className="flex items-center space-x-2">
              <div className={`flex items-center space-x-1 text-sm ${getVariationColor(targetVariation)}`}>
                {getTrendIcon(targetVariation)}
                <span className="font-medium">
                  {formatPercentage(Math.abs(targetVariation))}
                </span>
              </div>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                vs meta ({formatValue(target)})
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Barra de Progresso para Meta */}
      {showTarget && target && (
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
            <span>Progresso da Meta</span>
            <span>{Math.round((value / target) * 100)}%</span>
          </div>
          <div className="w-full bg-white/20 dark:bg-black/20 rounded-full h-3 backdrop-blur-sm">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${
                value >= target 
                  ? 'bg-gradient-to-r from-green-400 to-green-600 shadow-neon' 
                  : value >= target * 0.8 
                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' 
                    : 'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${Math.min((value / target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};