import { supabase } from '../config/supabase';
import { FinancialFact } from '../../shared/types';

export class FinancialFactsService {
  async getAll(): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .order('period', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch financial facts: ${error.message}`);
    }
    
    return data || [];
  }

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
      throw new Error(`Failed to fetch financial fact: ${error.message}`);
    }
    
    return data;
  }

  async create(fact: Omit<FinancialFact, 'id' | 'created_at' | 'updated_at'>): Promise<FinancialFact> {
    const { data, error } = await supabase
      .from('financial_facts')
      .insert(fact)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create financial fact: ${error.message}`);
    }
    
    return data;
  }

  async createBatch(facts: Omit<FinancialFact, 'id' | 'created_at' | 'updated_at'>[]): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .insert(facts)
      .select();
    
    if (error) {
      throw new Error(`Failed to create financial facts batch: ${error.message}`);
    }
    
    return data || [];
  }

  async update(id: string, updates: Partial<Omit<FinancialFact, 'id' | 'created_at' | 'updated_at'>>): Promise<FinancialFact> {
    const { data, error } = await supabase
      .from('financial_facts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update financial fact: ${error.message}`);
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('financial_facts')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete financial fact: ${error.message}`);
    }
  }

  async getByEntity(entityId: string): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .eq('entity_id', entityId)
      .order('period', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch financial facts by entity: ${error.message}`);
    }
    
    return data || [];
  }

  async getByAccount(accountId: string): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .eq('account_id', accountId)
      .order('period', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch financial facts by account: ${error.message}`);
    }
    
    return data || [];
  }

  async getByPeriod(period: string): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .eq('period', period)
      .order('entity_id');
    
    if (error) {
      throw new Error(`Failed to fetch financial facts by period: ${error.message}`);
    }
    
    return data || [];
  }

  async getByScenario(scenario: FinancialFact['scenario']): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .eq('scenario', scenario)
      .order('period', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch financial facts by scenario: ${error.message}`);
    }
    
    return data || [];
  }

  async getByEntityAndPeriod(entityId: string, period: string): Promise<FinancialFact[]> {
    const { data, error } = await supabase
      .from('financial_facts')
      .select('*')
      .eq('entity_id', entityId)
      .eq('period', period)
      .order('account_id');
    
    if (error) {
      throw new Error(`Failed to fetch financial facts by entity and period: ${error.message}`);
    }
    
    return data || [];
  }

  async deleteByEntity(entityId: string): Promise<void> {
    const { error } = await supabase
      .from('financial_facts')
      .delete()
      .eq('entity_id', entityId);
    
    if (error) {
      throw new Error(`Failed to delete financial facts by entity: ${error.message}`);
    }
  }

  async deleteByPeriod(period: string): Promise<void> {
    const { error } = await supabase
      .from('financial_facts')
      .delete()
      .eq('period', period);
    
    if (error) {
      throw new Error(`Failed to delete financial facts by period: ${error.message}`);
    }
  }
}

export const financialFactsService = new FinancialFactsService();