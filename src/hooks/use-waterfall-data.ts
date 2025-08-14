import { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import { calculateDREMetrics, generateWaterfallData, WaterfallData } from '../utils/dre-calculator';
import { WaterfallDataPoint } from '../types';

export function useWaterfallData(entityId?: string, year?: number, month?: number): {
  data: WaterfallDataPoint[];
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const waterfallData = useMemo(() => {
    if (!financialFacts.length || !accounts.length) {
      return [];
    }
    
    // Calcular métricas DRE
    const metrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    // Gerar dados do waterfall
    const waterfallRawData = generateWaterfallData(metrics);
    
    // Converter para o formato esperado pelo componente
    const convertedData: WaterfallDataPoint[] = waterfallRawData.map(item => ({
      name: item.name,
      value: item.value,
      cumulative: item.cumulative,
      type: item.type
    }));
    
    return convertedData;
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    data: waterfallData,
    isLoading,
    error
  };
}

/**
 * Hook para dados de waterfall comparativo (atual vs anterior)
 */
export function useComparativeWaterfallData(
  entityId?: string, 
  year?: number, 
  month?: number
): {
  currentData: WaterfallDataPoint[];
  previousData: WaterfallDataPoint[];
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const { currentData, previousData } = useMemo(() => {
    if (!financialFacts.length || !accounts.length || !year || !month) {
      return { currentData: [], previousData: [] };
    }
    
    // Período atual
    const currentMetrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    // Período anterior
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    
    const previousMetrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      prevYear,
      prevMonth
    );
    
    // Gerar dados do waterfall para ambos os períodos
    const currentWaterfall = generateWaterfallData(currentMetrics);
    const previousWaterfall = generateWaterfallData(previousMetrics);
    
    // Converter para o formato esperado
    const currentData: WaterfallDataPoint[] = currentWaterfall.map(item => ({
      name: item.name,
      value: item.value,
      cumulative: item.cumulative,
      type: item.type
    }));
    
    const previousData: WaterfallDataPoint[] = previousWaterfall.map(item => ({
      name: item.name,
      value: item.value,
      cumulative: item.cumulative,
      type: item.type
    }));
    
    return { currentData, previousData };
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    currentData,
    previousData,
    isLoading,
    error
  };
}

/**
 * Hook para dados de waterfall por entidade (comparação entre filiais)
 */
export function useEntityWaterfallComparison(
  entityIds: string[], 
  year?: number, 
  month?: number
): {
  entitiesData: Array<{
    entityId: string;
    entityName: string;
    data: WaterfallDataPoint[];
  }>;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, entities, isLoading, error } = useDashboardStore();
  
  const entitiesData = useMemo(() => {
    if (!financialFacts.length || !accounts.length || !entities.length) {
      return [];
    }
    
    return entityIds.map(entityId => {
      const entity = entities.find(e => e.id === entityId);
      
      if (!entity) {
        return {
          entityId,
          entityName: 'Entidade não encontrada',
          data: []
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
      
      // Gerar dados do waterfall
      const waterfallRawData = generateWaterfallData(metrics);
      
      // Converter para o formato esperado
      const data: WaterfallDataPoint[] = waterfallRawData.map(item => ({
        name: item.name,
        value: item.value,
        cumulative: item.cumulative,
        type: item.type
      }));
      
      return {
        entityId,
        entityName: entity.name,
        data
      };
    });
  }, [financialFacts, accounts, entities, entityIds, year, month]);
  
  return {
    entitiesData,
    isLoading,
    error
  };
}