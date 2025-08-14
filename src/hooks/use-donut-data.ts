import { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import { calculateDREMetrics, generateExpenseComposition, generateDeductionComposition } from '../utils/dre-calculator';
import { ChartDataPoint } from '../types';

export interface DonutChartData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

export function useExpenseDonutData(entityId?: string, year?: number, month?: number): {
  data: DonutChartData[];
  total: number;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const result = useMemo(() => {
    if (!financialFacts.length || !accounts.length) {
      return {
        data: [],
        total: 0
      };
    }
    
    // Calcular métricas DRE
    const metrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    // Gerar composição de despesas
    const expenseComposition = generateExpenseComposition(metrics);
    
    return {
      data: expenseComposition,
      total: metrics.despesasOperacionais
    };
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    ...result,
    isLoading,
    error
  };
}

export function useDeductionDonutData(entityId?: string, year?: number, month?: number): {
  data: DonutChartData[];
  total: number;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const result = useMemo(() => {
    if (!financialFacts.length || !accounts.length) {
      return {
        data: [],
        total: 0
      };
    }
    
    // Calcular métricas DRE
    const metrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    // Gerar composição de deduções
    const deductionComposition = generateDeductionComposition(metrics);
    
    return {
      data: deductionComposition,
      total: metrics.totalDeducoes
    };
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    ...result,
    isLoading,
    error
  };
}

/**
 * Hook para dados de composição de receita (Bruta vs Líquida)
 */
export function useRevenueDonutData(entityId?: string, year?: number, month?: number): {
  data: DonutChartData[];
  total: number;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const result = useMemo(() => {
    if (!financialFacts.length || !accounts.length) {
      return {
        data: [],
        total: 0
      };
    }
    
    // Calcular métricas DRE
    const metrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    if (metrics.receitaBruta === 0) {
      return {
        data: [],
        total: 0
      };
    }
    
    // Gerar composição de receita
    const data: DonutChartData[] = [
      {
        name: 'Receita Líquida',
        value: metrics.receitaLiquida,
        percentage: (metrics.receitaLiquida / metrics.receitaBruta) * 100,
        color: '#10B981'
      },
      {
        name: 'Deduções',
        value: metrics.totalDeducoes,
        percentage: (metrics.totalDeducoes / metrics.receitaBruta) * 100,
        color: '#EF4444'
      }
    ];
    
    return {
      data,
      total: metrics.receitaBruta
    };
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    ...result,
    isLoading,
    error
  };
}

/**
 * Hook para dados de composição de margem (Lucro vs Custos/Despesas)
 */
export function useMarginDonutData(entityId?: string, year?: number, month?: number): {
  data: DonutChartData[];
  total: number;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const result = useMemo(() => {
    if (!financialFacts.length || !accounts.length) {
      return {
        data: [],
        total: 0
      };
    }
    
    // Calcular métricas DRE
    const metrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    if (metrics.receitaLiquida === 0) {
      return {
        data: [],
        total: 0
      };
    }
    
    // Gerar composição de margem
    const data: DonutChartData[] = [
      {
        name: 'Lucro Líquido',
        value: metrics.lucroLiquido,
        percentage: (metrics.lucroLiquido / metrics.receitaLiquida) * 100,
        color: '#8B5CF6'
      },
      {
        name: 'COGS',
        value: metrics.cogs,
        percentage: (metrics.cogs / metrics.receitaLiquida) * 100,
        color: '#F59E0B'
      },
      {
        name: 'Despesas Operacionais',
        value: metrics.despesasOperacionais,
        percentage: (metrics.despesasOperacionais / metrics.receitaLiquida) * 100,
        color: '#EF4444'
      },
      {
        name: 'Despesas Financeiras',
        value: metrics.despesasFinanceiras,
        percentage: (metrics.despesasFinanceiras / metrics.receitaLiquida) * 100,
        color: '#6B7280'
      }
    ].filter(item => item.value > 0);
    
    return {
      data,
      total: metrics.receitaLiquida
    };
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    ...result,
    isLoading,
    error
  };
}

/**
 * Hook para comparação de entidades em donut charts
 */
export function useEntityComparisonDonutData(
  entityIds: string[], 
  year?: number, 
  month?: number,
  metric: 'receita' | 'lucro' | 'ebitda' = 'receita'
): {
  data: DonutChartData[];
  total: number;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, entities, isLoading, error } = useDashboardStore();
  
  const result = useMemo(() => {
    if (!financialFacts.length || !accounts.length || !entities.length) {
      return {
        data: [],
        total: 0
      };
    }
    
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    let total = 0;
    
    const data: DonutChartData[] = entityIds.map((entityId, index) => {
      const entity = entities.find(e => e.id === entityId);
      
      if (!entity) {
        return {
          name: 'Entidade não encontrada',
          value: 0,
          percentage: 0,
          color: colors[index % colors.length]
        };
      }
      
      // Calcular métricas para esta entidade
      const metrics = calculateDREMetrics(
        financialFacts,
        accounts,
        entityId,
        year,
        month
      );
      
      let value = 0;
      switch (metric) {
        case 'receita':
          value = metrics.receitaLiquida;
          break;
        case 'lucro':
          value = metrics.lucroLiquido;
          break;
        case 'ebitda':
          value = metrics.ebitda;
          break;
      }
      
      total += value;
      
      return {
        name: entity.name,
        value,
        percentage: 0, // Será calculado depois
        color: colors[index % colors.length]
      };
    }).filter(item => item.value > 0);
    
    // Calcular percentuais
    if (total > 0) {
      data.forEach(item => {
        item.percentage = (item.value / total) * 100;
      });
    }
    
    return {
      data,
      total
    };
  }, [financialFacts, accounts, entities, entityIds, year, month, metric]);
  
  return {
    ...result,
    isLoading,
    error
  };
}