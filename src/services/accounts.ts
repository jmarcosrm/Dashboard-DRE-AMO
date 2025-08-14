import { supabase } from '../lib/supabase';
import type { Account } from '../types';
import type { Database } from '../types/database';

type AccountRow = Database['public']['Tables']['accounts']['Row'];
type AccountInsert = Database['public']['Tables']['accounts']['Insert'];
type AccountUpdate = Database['public']['Tables']['accounts']['Update'];

// Convert database row to Account type
function mapAccountFromDB(row: AccountRow): Account {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    nature: row.nature as Account['nature'],
    level: row.level,
    description: row.description || undefined,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Convert Account type to database insert
function mapAccountToDB(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): AccountInsert {
  return {
    code: account.code,
    name: account.name,
    nature: account.nature,
    level: account.level,
    description: account.description || null,
    is_active: account.isActive
  };
}

// Convert Account type to database update
function mapAccountToDBUpdate(account: Partial<Account>): AccountUpdate {
  const update: AccountUpdate = {};
  
  if (account.code !== undefined) update.code = account.code;
  if (account.name !== undefined) update.name = account.name;
  if (account.nature !== undefined) update.nature = account.nature;
  if (account.level !== undefined) update.level = account.level;
  if (account.description !== undefined) update.description = account.description || null;
  if (account.isActive !== undefined) update.is_active = account.isActive;
  
  return update;
}

export const accountsService = {
  // Get all accounts
  async getAll(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .order('code');

    if (error) {
      console.error('Error fetching accounts:', error);
      throw new Error(`Failed to fetch accounts: ${error.message}`);
    }

    return data.map(mapAccountFromDB);
  },

  // Get account by ID
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
      console.error('Error fetching account:', error);
      throw new Error(`Failed to fetch account: ${error.message}`);
    }

    return mapAccountFromDB(data);
  },

  // Create new account
  async create(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account> {
    const accountData = mapAccountToDB(account);
    
    const { data, error } = await supabase
      .from('accounts')
      .insert(accountData)
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      throw new Error(`Failed to create account: ${error.message}`);
    }

    return mapAccountFromDB(data);
  },

  // Update account
  async update(id: string, updates: Partial<Account>): Promise<Account> {
    const updateData = mapAccountToDBUpdate(updates);
    
    const { data, error } = await supabase
      .from('accounts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating account:', error);
      throw new Error(`Failed to update account: ${error.message}`);
    }

    return mapAccountFromDB(data);
  },

  // Delete account
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('accounts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting account:', error);
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  },

  // Get active accounts only
  async getActive(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching active accounts:', error);
      throw new Error(`Failed to fetch active accounts: ${error.message}`);
    }

    return data.map(mapAccountFromDB);
  },

  // Get accounts by nature
  async getByNature(nature: Account['nature']): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('nature', nature)
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching accounts by nature:', error);
      throw new Error(`Failed to fetch accounts by nature: ${error.message}`);
    }

    return data.map(mapAccountFromDB);
  },

  // Get accounts by level
  async getByLevel(level: number): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('level', level)
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching accounts by level:', error);
      throw new Error(`Failed to fetch accounts by level: ${error.message}`);
    }

    return data.map(mapAccountFromDB);
  },

  // Search accounts by name or code
  async search(query: string): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .order('code');

    if (error) {
      console.error('Error searching accounts:', error);
      throw new Error(`Failed to search accounts: ${error.message}`);
    }

    return data.map(mapAccountFromDB);
  },

  // Get revenue accounts
  async getRevenueAccounts(): Promise<Account[]> {
    return this.getByNature('revenue');
  },

  // Get expense accounts
  async getExpenseAccounts(): Promise<Account[]> {
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .in('nature', ['expense', 'cost'])
      .eq('is_active', true)
      .order('code');

    if (error) {
      console.error('Error fetching expense accounts:', error);
      throw new Error(`Failed to fetch expense accounts: ${error.message}`);
    }

    return data.map(mapAccountFromDB);
  }
};