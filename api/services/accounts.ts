import { supabase } from '../config/supabase';
import { Account } from '../../shared/types';

export class AccountsService {
  async getAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('code');
    
    if (error) {
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }
    
    return data || [];
  }

  async getById(id: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch account: ${error.message}`);
    }
    
    return data;
  }

  async create(account: Omit<Account, 'id' | 'created_at' | 'updated_at'>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .insert(account)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create account: ${error.message}`);
    }
    
    return data;
  }

  async update(id: string, updates: Partial<Omit<Account, 'id' | 'created_at' | 'updated_at'>>): Promise<Account> {
    const { data, error } = await supabase
      .from('accounts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update account: ${error.message}`);
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }

  async findByCode(code: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find account by code: ${error.message}`);
    }
    
    return data;
  }

  async findByName(name: string): Promise<Account | null> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find account by name: ${error.message}`);
    }
    
    return data;
  }

  async getByType(type: Account['type']): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('type', type)
      .order('code');
    
    if (error) {
      throw new Error(`Failed to fetch accounts by type: ${error.message}`);
    }
    
    return data || [];
  }
}

export const accountsService = new AccountsService();