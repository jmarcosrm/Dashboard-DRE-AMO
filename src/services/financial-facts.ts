import { supabase } from '../lib/supabase';
import type { FinancialFact } from '../types';
import type { Database } from '../types/database';

type FinancialFactRow = Database['public']['Tables']['financial_facts']['Row'];
type FinancialFactInsert = Database['public']['Tables']['financial_facts']['Insert'];
type FinancialFactUpdate = Database['public']['Tables']['financial_facts']['Update'];

// Convert database row to FinancialFact type
function mapFinancialFactFromDB(row: FinancialFactRow): FinancialFact {
  return {
    id: row.id,
    entityId: row.entity_id,
    accountId: row.account_id,
    scenarioId: row.scenario_id as FinancialFact['scenarioId'],
    year: row.year,
    month: row.month,
    value: row.value,
    description: row.description || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Convert FinancialFact type to database insert
function mapFinancialFactToDB(fact: Omit<FinancialFact, 'id' | 'createdAt' | 'updatedAt'>): FinancialFactInsert {
  return {
    entity_id: fact.entityId,
    account_id: fact.accountId,
    scenario_id: fact.scenarioId,
    year: fact.year,
    month: fact.month,
    value: fact.value,
    description: fact.description || null
  };
}

// Convert FinancialFact type to database update
function mapFinancialFactToDBUpdate(fact: Partial<FinancialFact>): FinancialFactUpdate {
  const update: FinancialFactUpdate = {};
  
  if (fact.entityId !== undefined) update.entity_id = fact.entityId;
  if (fact.accountId !== undefined) update.account_id = fact.accountId;
  if (fact.scenarioId !== undefined) update.scenario_id = fact.scenarioId;
  if (fact.year !== undefined) update.year = fact.year;
  if (fact.month !== undefined) update.month = fact.month;
  if (fact.value !== undefined) update.value = fact.value;
  if (fact.description !== undefined) update.description = fact.description || null;
  
  return update;
}

export interface FinancialFactFilters {
  entityId?: string;
  accountId?: string;
  scenarioId?: FinancialFact['scenarioId'];
  year?: number;
  month?: number;
  startDate?: { year: number; month: number };
  endDate?: { year: number; month: number };
}

export const financialFactsService = {
  // Get all financial facts
  async getAll(): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .order('year', { ascending: false })
      .order('month', { ascending: false });

    if (error) {
      console.error('Error fetching financial facts:', error);
      throw new Error(`Failed to fetch financial facts: ${error.message}`);
    }

    return data.map(mapFinancialFactFromDB);
  },

  // Get financial fact by ID
  async getById(id: string): Promise<FinancialFact | null> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching financial fact:', error);
      throw new Error(`Failed to fetch financial fact: ${error.message}`);
    }

    return mapFinancialFactFromDB(data);
  },

  // Create new financial fact
  async create(fact: Omit<FinancialFact, 'id' | 'createdAt' | 'updatedAt'>): Promise<FinancialFact> {
    const factData = mapFinancialFactToDB(fact);
    
    const { data, error } = await supabase
      .from('financial_facts')
      .insert(factData)
      .select()
      .single();

    if (error) {
      console.error('Error creating financial fact:', error);
      throw new Error(`Failed to create financial fact: ${error.message}`);
    }

    return mapFinancialFactFromDB(data);
  },

  // Update financial fact
  async update(id: string, updates: Partial<FinancialFact>): Promise<FinancialFact> {
    const updateData = mapFinancialFactToDBUpdate(updates);
    
    const { data, error } = await supabase
      .from('financial_facts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating financial fact:', error);
      throw new Error(`Failed to update financial fact: ${error.message}`);
    }

    return mapFinancialFactFromDB(data);
  },

  // Delete financial fact
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_facts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting financial fact:', error);
      throw new Error(`Failed to delete financial fact: ${error.message}`);
    }
  },

  // Get financial facts with filters
  async getFiltered(filters: FinancialFactFilters): Promise<FinancialFact[]> {
    let query = supabase.from('financial_facts').select('*');

    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters.accountId) {
      query = query.eq('account_id', filters.accountId);
    }

    if (filters.scenarioId) {
      query = query.eq('scenario_id', filters.scenarioId);
    }

    if (filters.year) {
      query = query.eq('year', filters.year);
    }

    if (filters.month) {
      query = query.eq('month', filters.month);
    }

    if (filters.startDate) {
      query = query.gte('year', filters.startDate.year);
      if (filters.startDate.year === filters.endDate?.year) {
        query = query.gte('month', filters.startDate.month);
      }
    }

    if (filters.endDate) {
      query = query.lte('year', filters.endDate.year);
      if (filters.endDate.year === filters.startDate?.year) {
        query = query.lte('month', filters.endDate.month);
      }
    }

    query = query.order('year', { ascending: false }).order('month', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching filtered financial facts:', error);
      throw new Error(`Failed to fetch filtered financial facts: ${error.message}`);
    }

    return data.map(mapFinancialFactFromDB);
  },

  // Get financial facts by entity
  async getByEntity(entityId: string): Promise<FinancialFact[]> {
    return this.getFiltered({ entityId });
  },

  // Get financial facts by account
  async getByAccount(accountId: string): Promise<FinancialFact[]> {
    return this.getFiltered({ accountId });
  },

  // Get financial facts by scenario
  async getByScenario(scenarioId: FinancialFact['scenarioId']): Promise<FinancialFact[]> {
    return this.getFiltered({ scenarioId });
  },

  // Get financial facts by period
  async getByPeriod(year: number, month?: number): Promise<FinancialFact[]> {
    const filters: FinancialFactFilters = { year };
    if (month) {
      filters.month = month;
    }
    return this.getFiltered(filters);
  },

  // Get financial facts for a date range
  async getByDateRange(
    startYear: number,
    startMonth: number,
    endYear: number,
    endMonth: number
  ): Promise<FinancialFact[]> {
    return this.getFiltered({
      startDate: { year: startYear, month: startMonth },
      endDate: { year: endYear, month: endMonth }
    });
  },

  // Bulk create financial facts
  async createBulk(facts: Omit<FinancialFact, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<FinancialFact[]> {
    const factsData = facts.map(mapFinancialFactToDB);
    
    const { data, error } = await supabase
      .from('financial_facts')
      .insert(factsData)
      .select();

    if (error) {
      console.error('Error creating financial facts in bulk:', error);
      throw new Error(`Failed to create financial facts in bulk: ${error.message}`);
    }

    return data.map(mapFinancialFactFromDB);
  },

  // Delete financial facts by filters
  async deleteFiltered(filters: FinancialFactFilters): Promise<void> {
    let query = supabase.from('financial_facts').delete();

    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters.accountId) {
      query = query.eq('account_id', filters.accountId);
    }

    if (filters.scenarioId) {
      query = query.eq('scenario_id', filters.scenarioId);
    }

    if (filters.year) {
      query = query.eq('year', filters.year);
    }

    if (filters.month) {
      query = query.eq('month', filters.month);
    }

    const { error } = await query;

    if (error) {
      console.error('Error deleting filtered financial facts:', error);
      throw new Error(`Failed to delete filtered financial facts: ${error.message}`);
    }
  }
};