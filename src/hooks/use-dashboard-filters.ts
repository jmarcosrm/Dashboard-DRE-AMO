import { useState, useEffect, useMemo } from 'react';
import { DashboardFilters, FinancialFact, Entity, Account, ScenarioType } from '../types';
import { useDataStore } from '../store/data-store';

interface UseDashboardFiltersReturn {
  filters: DashboardFilters;
  setFilters: (filters: DashboardFilters) => void;
  filteredFacts: FinancialFact[];
  availableEntities: Entity[];
  availableAccounts: Account[];
  availablePeriods: string[];
  availableScenarios: ScenarioType[];
  resetFilters: () => void;
  isFiltered: boolean;
  filterSummary: {
    entitiesCount: number;
    accountsCount: number;
    periodsCount: number;
    scenariosCount: number;
    factsCount: number;
  };
}

const defaultFilters: DashboardFilters = {
  entityIds: [],
  scenarios: ['real'],
  periodStart: '',
  periodEnd: '',
  accountIds: []
};

export const useDashboardFilters = (): UseDashboardFiltersReturn => {
  const { financialFacts, entities, accounts } = useDataStore();
  const [filters, setFilters] = useState<DashboardFilters>(defaultFilters);

  // Inicializar filtros com todas as entidades se não houver filtros definidos
  useEffect(() => {
    if (entities.length > 0 && filters.entityIds.length === 0) {
      setFilters(prev => ({
        ...prev,
        entityIds: entities.map(e => e.id)
      }));
    }
  }, [entities, filters.entityIds.length]);

  // Calcular períodos disponíveis
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>();
    financialFacts.forEach(fact => {
      const period = `${fact.year}-${fact.month.toString().padStart(2, '0')}`;
      periods.add(period);
    });
    return Array.from(periods).sort();
  }, [financialFacts]);

  // Calcular cenários disponíveis
  const availableScenarios = useMemo(() => {
    const scenarios = new Set<ScenarioType>();
    financialFacts.forEach(fact => {
      scenarios.add(fact.scenarioId as ScenarioType);
    });
    return Array.from(scenarios);
  }, [financialFacts]);

  // Filtrar fatos financeiros
  const filteredFacts = useMemo(() => {
    return financialFacts.filter(fact => {
      // Filtro por entidade
      if (filters.entityIds.length > 0 && !filters.entityIds.includes(fact.entityId)) {
        return false;
      }

      // Filtro por cenário
      if (filters.scenarios.length > 0 && !filters.scenarios.includes(fact.scenarioId as ScenarioType)) {
        return false;
      }

      // Filtro por conta
      if (filters.accountIds && filters.accountIds.length > 0 && !filters.accountIds.includes(fact.accountId)) {
        return false;
      }

      // Filtro por período
      const factPeriod = `${fact.year}-${fact.month.toString().padStart(2, '0')}`;
      
      if (filters.periodStart && factPeriod < filters.periodStart) {
        return false;
      }
      
      if (filters.periodEnd && factPeriod > filters.periodEnd) {
        return false;
      }

      return true;
    });
  }, [financialFacts, filters]);

  // Entidades disponíveis (baseado nos fatos filtrados)
  const availableEntities = useMemo(() => {
    const entityIds = new Set(filteredFacts.map(fact => fact.entityId));
    return entities.filter(entity => entityIds.has(entity.id));
  }, [entities, filteredFacts]);

  // Contas disponíveis (baseado nos fatos filtrados)
  const availableAccounts = useMemo(() => {
    const accountIds = new Set(filteredFacts.map(fact => fact.accountId));
    return accounts.filter(account => accountIds.has(account.id));
  }, [accounts, filteredFacts]);

  // Verificar se há filtros ativos
  const isFiltered = useMemo(() => {
    return (
      filters.entityIds.length !== entities.length ||
      filters.scenarios.length !== availableScenarios.length ||
      filters.periodStart !== '' ||
      filters.periodEnd !== '' ||
      (filters.accountIds && filters.accountIds.length > 0)
    );
  }, [filters, entities.length, availableScenarios.length]);

  // Resumo dos filtros
  const filterSummary = useMemo(() => {
    const uniqueEntities = new Set(filteredFacts.map(fact => fact.entityId));
    const uniqueAccounts = new Set(filteredFacts.map(fact => fact.accountId));
    const uniquePeriods = new Set(filteredFacts.map(fact => 
      `${fact.year}-${fact.month.toString().padStart(2, '0')}`
    ));
    const uniqueScenarios = new Set(filteredFacts.map(fact => fact.scenarioId));

    return {
      entitiesCount: uniqueEntities.size,
      accountsCount: uniqueAccounts.size,
      periodsCount: uniquePeriods.size,
      scenariosCount: uniqueScenarios.size,
      factsCount: filteredFacts.length
    };
  }, [filteredFacts]);

  // Resetar filtros
  const resetFilters = () => {
    setFilters({
      ...defaultFilters,
      entityIds: entities.map(e => e.id)
    });
  };

  return {
    filters,
    setFilters,
    filteredFacts,
    availableEntities,
    availableAccounts,
    availablePeriods,
    availableScenarios,
    resetFilters,
    isFiltered,
    filterSummary
  };
};

// Hook para filtros específicos de comparação
export const useComparisonFilters = () => {
  const { filteredFacts } = useDashboardFilters();
  
  const getFactsForComparison = (
    entityIds: string[],
    accountIds: string[],
    periods: string[],
    scenarios: ScenarioType[] = ['real']
  ) => {
    return filteredFacts.filter(fact => {
      const factPeriod = `${fact.year}-${fact.month.toString().padStart(2, '0')}`;
      
      return (
        entityIds.includes(fact.entityId) &&
        accountIds.includes(fact.accountId) &&
        periods.includes(factPeriod) &&
        scenarios.includes(fact.scenarioId as ScenarioType)
      );
    });
  };

  const getPeriodsForComparison = (baseDate: string, type: 'month' | 'year' = 'month') => {
    const [year, month] = baseDate.split('-').map(Number);
    
    if (type === 'month') {
      // Comparação mês anterior
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      return [`${prevYear}-${prevMonth.toString().padStart(2, '0')}`, baseDate];
    } else {
      // Comparação ano anterior
      const prevYear = year - 1;
      return [`${prevYear}-${month.toString().padStart(2, '0')}`, baseDate];
    }
  };

  return {
    getFactsForComparison,
    getPeriodsForComparison
  };
};

// Hook para filtros de período específicos
export const usePeriodFilters = () => {
  const getCurrentPeriod = () => {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  const getPreviousPeriod = (period: string) => {
    const [year, month] = period.split('-').map(Number);
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    return `${prevYear}-${prevMonth.toString().padStart(2, '0')}`;
  };

  const getYearToDate = (period: string) => {
    const [year] = period.split('-').map(Number);
    return {
      start: `${year}-01`,
      end: period
    };
  };

  const getQuarter = (period: string) => {
    const [year, month] = period.split('-').map(Number);
    const quarter = Math.ceil(month / 3);
    const startMonth = (quarter - 1) * 3 + 1;
    const endMonth = quarter * 3;
    
    return {
      start: `${year}-${startMonth.toString().padStart(2, '0')}`,
      end: `${year}-${endMonth.toString().padStart(2, '0')}`,
      quarter
    };
  };

  const getLastNMonths = (period: string, n: number) => {
    const periods: string[] = [];
    let [year, month] = period.split('-').map(Number);
    
    for (let i = 0; i < n; i++) {
      periods.unshift(`${year}-${month.toString().padStart(2, '0')}`);
      
      month--;
      if (month === 0) {
        month = 12;
        year--;
      }
    }
    
    return periods;
  };

  return {
    getCurrentPeriod,
    getPreviousPeriod,
    getYearToDate,
    getQuarter,
    getLastNMonths
  };
};