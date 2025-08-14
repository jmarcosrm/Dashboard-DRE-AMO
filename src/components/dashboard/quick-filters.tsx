import React from 'react';
import { Calendar, Building2, Target, TrendingUp } from 'lucide-react';
import { DashboardFilters, ScenarioType } from '../../types';
import { usePeriodFilters } from '../../hooks/use-dashboard-filters';
import { useDataStore } from '../../store/data-store';

interface QuickFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
  className?: string;
}

const QuickFilters: React.FC<QuickFiltersProps> = ({ 
  filters, 
  onFiltersChange, 
  className = '' 
}) => {
  const { entities } = useDataStore();
  const { getCurrentPeriod, getPreviousPeriod, getYearToDate, getLastNMonths } = usePeriodFilters();

  const currentPeriod = getCurrentPeriod();
  const previousPeriod = getPreviousPeriod(currentPeriod);
  const ytd = getYearToDate(currentPeriod);
  const last12Months = getLastNMonths(currentPeriod, 12);

  // Filtros rápidos predefinidos
  const quickFilters = [
    {
      id: 'current-month',
      label: 'Mês Atual',
      icon: Calendar,
      action: () => onFiltersChange({
        ...filters,
        periodStart: currentPeriod,
        periodEnd: currentPeriod
      })
    },
    {
      id: 'previous-month',
      label: 'Mês Anterior',
      icon: Calendar,
      action: () => onFiltersChange({
        ...filters,
        periodStart: previousPeriod,
        periodEnd: previousPeriod
      })
    },
    {
      id: 'ytd',
      label: 'Acumulado do Ano',
      icon: TrendingUp,
      action: () => onFiltersChange({
        ...filters,
        periodStart: ytd.start,
        periodEnd: ytd.end
      })
    },
    {
      id: 'last-12-months',
      label: 'Últimos 12 Meses',
      icon: TrendingUp,
      action: () => onFiltersChange({
        ...filters,
        periodStart: last12Months[0],
        periodEnd: last12Months[last12Months.length - 1]
      })
    },
    {
      id: 'all-entities',
      label: 'Todas Entidades',
      icon: Building2,
      action: () => onFiltersChange({
        ...filters,
        entityIds: entities.map(e => e.id)
      })
    },
    {
      id: 'real-scenario',
      label: 'Apenas Real',
      icon: Target,
      action: () => onFiltersChange({
        ...filters,
        scenarios: ['real']
      })
    }
  ];

  // Verificar se um filtro rápido está ativo
  const isQuickFilterActive = (filterId: string) => {
    switch (filterId) {
      case 'current-month':
        return filters.periodStart === currentPeriod && filters.periodEnd === currentPeriod;
      case 'previous-month':
        return filters.periodStart === previousPeriod && filters.periodEnd === previousPeriod;
      case 'ytd':
        return filters.periodStart === ytd.start && filters.periodEnd === ytd.end;
      case 'last-12-months':
        return filters.periodStart === last12Months[0] && filters.periodEnd === last12Months[last12Months.length - 1];
      case 'all-entities':
        return filters.entityIds.length === entities.length;
      case 'real-scenario':
        return filters.scenarios.length === 1 && filters.scenarios[0] === 'real';
      default:
        return false;
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Filtros Rápidos
        </h3>
        <button
          onClick={() => onFiltersChange({
            entityIds: entities.map(e => e.id),
            scenarios: ['real'],
            periodStart: '',
            periodEnd: '',
            accountIds: []
          })}
          className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {quickFilters.map(filter => {
          const Icon = filter.icon;
          const isActive = isQuickFilterActive(filter.id);
          
          return (
            <button
              key={filter.id}
              onClick={filter.action}
              className={`
                flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
                ${isActive 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' 
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                }
              `}
            >
              <Icon className="h-4 w-4 mb-1" />
              <span className="text-xs font-medium text-center leading-tight">
                {filter.label}
              </span>
            </button>
          );
        })}
      </div>
      
      {/* Indicadores de Filtros Ativos */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2 text-xs">
          {filters.entityIds.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
              <Building2 className="h-3 w-3 mr-1" />
              {filters.entityIds.length} entidade(s)
            </span>
          )}
          
          {filters.scenarios.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
              <Target className="h-3 w-3 mr-1" />
              {filters.scenarios.join(', ')}
            </span>
          )}
          
          {(filters.periodStart || filters.periodEnd) && (
            <span className="inline-flex items-center px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
              <Calendar className="h-3 w-3 mr-1" />
              {filters.periodStart && filters.periodEnd 
                ? `${filters.periodStart} a ${filters.periodEnd}`
                : filters.periodStart 
                  ? `A partir de ${filters.periodStart}`
                  : `Até ${filters.periodEnd}`
              }
            </span>
          )}
          
          {filters.accountIds && filters.accountIds.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full">
              <TrendingUp className="h-3 w-3 mr-1" />
              {filters.accountIds.length} conta(s)
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuickFilters;