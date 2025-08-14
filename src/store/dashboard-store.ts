import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardState, DashboardFilters, Entity, FinancialFact, Account, ScenarioType } from '../types';

interface DashboardStore extends DashboardState {
  // Actions para filtros
  setFilters: (filters: Partial<DashboardFilters>) => void;
  resetFilters: () => void;
  
  // Actions para seleções
  setSelectedEntities: (entityIds: string[]) => void;
  setSelectedAccounts: (accountIds: string[]) => void;
  setSelectedScenarios: (scenarios: ScenarioType[]) => void;
  setDateRange: (periodStart: string, periodEnd: string) => void;
  
  // Computed values
  getFilteredData: () => FinancialFact[];
  getSelectedEntitiesData: () => Entity[];
  getKPIs: () => any[];
}

const defaultFilters: DashboardFilters = {
  entityIds: [],
  scenarios: ['real'],
  periodStart: new Date(new Date().getFullYear(), 0, 1).toISOString().slice(0, 7), // Início do ano atual
  periodEnd: new Date().toISOString().slice(0, 7), // Mês atual
  accountIds: []
};

export const useDashboardStore = create<DashboardStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      filters: defaultFilters,
      entities: [],
      accounts: [],
      financialFacts: [],
      kpis: [],
      isLoading: false,
      error: null,
      lastUpdated: null,
      
      // Actions para filtros
      setFilters: (newFilters) => {
        set((state) => ({
          filters: { ...state.filters, ...newFilters },
          lastUpdated: new Date().toISOString()
        }));
      },
      
      resetFilters: () => {
        set({
          filters: defaultFilters,
          lastUpdated: new Date().toISOString()
        });
      },
      

      
      // Actions para seleções
      setSelectedEntities: (entityIds) => {
        set((state) => ({
          filters: { ...state.filters, entityIds },
          lastUpdated: new Date().toISOString()
        }));
      },
      
      setSelectedAccounts: (accountIds) => {
        set((state) => ({
          filters: { ...state.filters, accountIds },
          lastUpdated: new Date().toISOString()
        }));
      },
      
      setSelectedScenarios: (scenarios) => {
        set((state) => ({
          filters: { ...state.filters, scenarios },
          lastUpdated: new Date().toISOString()
        }));
      },
      
      setDateRange: (periodStart, periodEnd) => {
        set((state) => ({
          filters: { ...state.filters, periodStart, periodEnd },
          lastUpdated: new Date().toISOString()
        }));
      },
      
      // Computed values
      getFilteredData: () => {
        // Esta função agora retorna um array vazio pois os dados são gerenciados pelo data-store
        // Pode ser removida ou adaptada para trabalhar com o data-store
        return [];
      },
      
      getSelectedEntitiesData: () => {
        // Esta função agora retorna um array vazio pois os dados são gerenciados pelo data-store
        // Pode ser removida ou adaptada para trabalhar com o data-store
        return [];
      },
      
      getKPIs: () => {
        // Esta função agora retorna um array vazio pois os dados são gerenciados pelo data-store
        // Pode ser removida ou adaptada para trabalhar com o data-store
        return [];
      }
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        filters: state.filters
      })
    }
  )
);