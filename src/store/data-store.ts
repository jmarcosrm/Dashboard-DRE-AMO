import { create } from 'zustand';
import { Entity, Account, FinancialFact } from '../types';
import { entitiesService, accountsService, financialFactsService, type FinancialFactFilters } from '../services';

interface DataState {
  // Entities
  entities: Entity[];
  entitiesLoading: boolean;
  entitiesError: string | null;
  
  // Accounts
  accounts: Account[];
  accountsLoading: boolean;
  accountsError: string | null;
  
  // Financial Facts
  financialFacts: FinancialFact[];
  financialFactsLoading: boolean;
  financialFactsError: string | null;
  
  // General
  lastUpdated: string | null;
}

interface DataActions {
  // Entity actions
  loadEntities: () => Promise<void>;
  createEntity: (entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Entity>;
  updateEntity: (id: string, updates: Partial<Entity>) => Promise<Entity>;
  deleteEntity: (id: string) => Promise<void>;
  searchEntities: (query: string) => Promise<Entity[]>;
  
  // Account actions
  loadAccounts: () => Promise<void>;
  createAccount: (account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Account>;
  updateAccount: (id: string, updates: Partial<Account>) => Promise<Account>;
  deleteAccount: (id: string) => Promise<void>;
  searchAccounts: (query: string) => Promise<Account[]>;
  getAccountsByNature: (nature: Account['nature']) => Promise<Account[]>;
  
  // Financial Facts actions
  loadFinancialFacts: (filters?: FinancialFactFilters) => Promise<void>;
  createFinancialFact: (fact: Omit<FinancialFact, 'id' | 'createdAt' | 'updatedAt'>) => Promise<FinancialFact>;
  updateFinancialFact: (id: string, updates: Partial<FinancialFact>) => Promise<FinancialFact>;
  deleteFinancialFact: (id: string) => Promise<void>;
  createBulkFinancialFacts: (facts: Omit<FinancialFact, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<FinancialFact[]>;
  
  // Utility actions
  refreshAll: () => Promise<void>;
  clearErrors: () => void;
}

type DataStore = DataState & DataActions;

export const useDataStore = create<DataStore>((set, get) => ({
  // Initial state
  entities: [],
  entitiesLoading: false,
  entitiesError: null,
  
  accounts: [],
  accountsLoading: false,
  accountsError: null,
  
  financialFacts: [],
  financialFactsLoading: false,
  financialFactsError: null,
  
  lastUpdated: null,
  
  // Entity actions
  loadEntities: async () => {
    set({ entitiesLoading: true, entitiesError: null });
    try {
      const entities = await entitiesService.getAll();
      set({ 
        entities, 
        entitiesLoading: false, 
        lastUpdated: new Date().toISOString() 
      });
    } catch (error) {
      set({ 
        entitiesError: error instanceof Error ? error.message : 'Erro ao carregar entidades',
        entitiesLoading: false 
      });
    }
  },
  
  createEntity: async (entityData) => {
    set({ entitiesLoading: true, entitiesError: null });
    try {
      const newEntity = await entitiesService.create(entityData);
      set((state) => ({ 
        entities: [...state.entities, newEntity],
        entitiesLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return newEntity;
    } catch (error) {
      set({ 
        entitiesError: error instanceof Error ? error.message : 'Erro ao criar entidade',
        entitiesLoading: false 
      });
      throw error;
    }
  },
  
  updateEntity: async (id, updates) => {
    set({ entitiesLoading: true, entitiesError: null });
    try {
      const updatedEntity = await entitiesService.update(id, updates);
      set((state) => ({ 
        entities: state.entities.map(entity => 
          entity.id === id ? updatedEntity : entity
        ),
        entitiesLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return updatedEntity;
    } catch (error) {
      set({ 
        entitiesError: error instanceof Error ? error.message : 'Erro ao atualizar entidade',
        entitiesLoading: false 
      });
      throw error;
    }
  },
  
  deleteEntity: async (id) => {
    set({ entitiesLoading: true, entitiesError: null });
    try {
      await entitiesService.delete(id);
      set((state) => ({ 
        entities: state.entities.filter(entity => entity.id !== id),
        entitiesLoading: false,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      set({ 
        entitiesError: error instanceof Error ? error.message : 'Erro ao deletar entidade',
        entitiesLoading: false 
      });
      throw error;
    }
  },
  
  searchEntities: async (query) => {
    try {
      return await entitiesService.search(query);
    } catch (error) {
      set({ 
        entitiesError: error instanceof Error ? error.message : 'Erro ao buscar entidades'
      });
      return [];
    }
  },
  
  // Account actions
  loadAccounts: async () => {
    set({ accountsLoading: true, accountsError: null });
    try {
      const accounts = await accountsService.getAll();
      set({ 
        accounts, 
        accountsLoading: false, 
        lastUpdated: new Date().toISOString() 
      });
    } catch (error) {
      set({ 
        accountsError: error instanceof Error ? error.message : 'Erro ao carregar contas',
        accountsLoading: false 
      });
    }
  },
  
  createAccount: async (accountData) => {
    set({ accountsLoading: true, accountsError: null });
    try {
      const newAccount = await accountsService.create(accountData);
      set((state) => ({ 
        accounts: [...state.accounts, newAccount],
        accountsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return newAccount;
    } catch (error) {
      set({ 
        accountsError: error instanceof Error ? error.message : 'Erro ao criar conta',
        accountsLoading: false 
      });
      throw error;
    }
  },
  
  updateAccount: async (id, updates) => {
    set({ accountsLoading: true, accountsError: null });
    try {
      const updatedAccount = await accountsService.update(id, updates);
      set((state) => ({ 
        accounts: state.accounts.map(account => 
          account.id === id ? updatedAccount : account
        ),
        accountsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return updatedAccount;
    } catch (error) {
      set({ 
        accountsError: error instanceof Error ? error.message : 'Erro ao atualizar conta',
        accountsLoading: false 
      });
      throw error;
    }
  },
  
  deleteAccount: async (id) => {
    set({ accountsLoading: true, accountsError: null });
    try {
      await accountsService.delete(id);
      set((state) => ({ 
        accounts: state.accounts.filter(account => account.id !== id),
        accountsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      set({ 
        accountsError: error instanceof Error ? error.message : 'Erro ao deletar conta',
        accountsLoading: false 
      });
      throw error;
    }
  },
  
  searchAccounts: async (query) => {
    try {
      return await accountsService.search(query);
    } catch (error) {
      set({ 
        accountsError: error instanceof Error ? error.message : 'Erro ao buscar contas'
      });
      return [];
    }
  },
  
  getAccountsByNature: async (nature) => {
    try {
      return await accountsService.getByNature(nature);
    } catch (error) {
      set({ 
        accountsError: error instanceof Error ? error.message : 'Erro ao buscar contas por natureza'
      });
      return [];
    }
  },
  
  // Financial Facts actions
  loadFinancialFacts: async (filters) => {
    set({ financialFactsLoading: true, financialFactsError: null });
    try {
      const facts = filters 
        ? await financialFactsService.getFiltered(filters)
        : await financialFactsService.getAll();
      set({ 
        financialFacts: facts, 
        financialFactsLoading: false, 
        lastUpdated: new Date().toISOString() 
      });
    } catch (error) {
      set({ 
        financialFactsError: error instanceof Error ? error.message : 'Erro ao carregar fatos financeiros',
        financialFactsLoading: false 
      });
    }
  },
  
  createFinancialFact: async (factData) => {
    set({ financialFactsLoading: true, financialFactsError: null });
    try {
      const newFact = await financialFactsService.create(factData);
      set((state) => ({ 
        financialFacts: [...state.financialFacts, newFact],
        financialFactsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return newFact;
    } catch (error) {
      set({ 
        financialFactsError: error instanceof Error ? error.message : 'Erro ao criar fato financeiro',
        financialFactsLoading: false 
      });
      throw error;
    }
  },
  
  updateFinancialFact: async (id, updates) => {
    set({ financialFactsLoading: true, financialFactsError: null });
    try {
      const updatedFact = await financialFactsService.update(id, updates);
      set((state) => ({ 
        financialFacts: state.financialFacts.map(fact => 
          fact.id === id ? updatedFact : fact
        ),
        financialFactsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return updatedFact;
    } catch (error) {
      set({ 
        financialFactsError: error instanceof Error ? error.message : 'Erro ao atualizar fato financeiro',
        financialFactsLoading: false 
      });
      throw error;
    }
  },
  
  deleteFinancialFact: async (id) => {
    set({ financialFactsLoading: true, financialFactsError: null });
    try {
      await financialFactsService.delete(id);
      set((state) => ({ 
        financialFacts: state.financialFacts.filter(fact => fact.id !== id),
        financialFactsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      set({ 
        financialFactsError: error instanceof Error ? error.message : 'Erro ao deletar fato financeiro',
        financialFactsLoading: false 
      });
      throw error;
    }
  },
  
  createBulkFinancialFacts: async (factsData) => {
    set({ financialFactsLoading: true, financialFactsError: null });
    try {
      const newFacts = await financialFactsService.createBulk(factsData);
      set((state) => ({ 
        financialFacts: [...state.financialFacts, ...newFacts],
        financialFactsLoading: false,
        lastUpdated: new Date().toISOString()
      }));
      return newFacts;
    } catch (error) {
      set({ 
        financialFactsError: error instanceof Error ? error.message : 'Erro ao criar fatos financeiros em lote',
        financialFactsLoading: false 
      });
      throw error;
    }
  },
  
  // Utility actions
  refreshAll: async () => {
    await Promise.all([
      get().loadEntities(),
      get().loadAccounts(),
      get().loadFinancialFacts()
    ]);
  },
  
  clearErrors: () => {
    set({ 
      entitiesError: null, 
      accountsError: null, 
      financialFactsError: null 
    });
  }
}));