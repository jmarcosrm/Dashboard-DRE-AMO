import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Auth helpers
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

// Database helpers
export const db = {
  // Entities
  entities: {
    getAll: () => supabase.from('entities').select('*').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('entities').select('*').eq('id', id).single(),
    create: (entity: any) => supabase.from('entities').insert(entity).select().single(),
    update: (id: string, updates: any) => supabase.from('entities').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('entities').delete().eq('id', id)
  },

  // Accounts
  accounts: {
    getAll: () => supabase.from('accounts').select('*').order('code'),
    getById: (id: string) => supabase.from('accounts').select('*').eq('id', id).single(),
    create: (account: any) => supabase.from('accounts').insert(account).select().single(),
    update: (id: string, updates: any) => supabase.from('accounts').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('accounts').delete().eq('id', id)
  },

  // Financial Facts
  financialFacts: {
    getAll: () => supabase.from('financial_facts').select(`
      *,
      entities(name, code),
      accounts(name, code, nature)
    `).order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('financial_facts').select(`
      *,
      entities(name, code),
      accounts(name, code, nature)
    `).eq('id', id).single(),
    getByFilters: (filters: any) => {
      let query = supabase.from('financial_facts').select(`
        *,
        entities(name, code),
        accounts(name, code, nature)
      `);
      
      if (filters.entityId) query = query.eq('entity_id', filters.entityId);
      if (filters.accountId) query = query.eq('account_id', filters.accountId);
      if (filters.scenarioId) query = query.eq('scenario_id', filters.scenarioId);
      if (filters.year) query = query.eq('year', filters.year);
      if (filters.month) query = query.eq('month', filters.month);
      
      return query.order('created_at', { ascending: false });
    },
    create: (fact: any) => supabase.from('financial_facts').insert(fact).select().single(),
    update: (id: string, updates: any) => supabase.from('financial_facts').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('financial_facts').delete().eq('id', id)
  },

  // Users
  users: {
    getAll: () => supabase.from('users').select('*').order('created_at', { ascending: false }),
    getById: (id: string) => supabase.from('users').select('*').eq('id', id).single(),
    create: (user: any) => supabase.from('users').insert(user).select().single(),
    update: (id: string, updates: any) => supabase.from('users').update(updates).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('users').delete().eq('id', id)
  }
};

// Real-time subscriptions
export const subscriptions = {
  entities: (callback: (payload: any) => void) => {
    return supabase
      .channel('entities-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'entities' }, callback)
      .subscribe();
  },

  accounts: (callback: (payload: any) => void) => {
    return supabase
      .channel('accounts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, callback)
      .subscribe();
  },

  financialFacts: (callback: (payload: any) => void) => {
    return supabase
      .channel('financial-facts-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'financial_facts' }, callback)
      .subscribe();
  }
};

export default supabase;