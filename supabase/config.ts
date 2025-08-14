import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bedgpuwdsoliccoaojso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZGdwdXdkc29saWNjb2FvanNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxMzc1NDcsImV4cCI6MjA3MDcxMzU0N30.Hy1ZznQW8_5UuGnM1IV7emdrJoiK_M6Yd5Ph8SL8nGQ';

// Cliente Supabase para uso no frontend
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
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

// Tipos para as tabelas do banco
export interface SupabaseEntity {
  id: string;
  name: string;
  code: string;
  type: 'subsidiary' | 'consolidated' | 'division';
  cnpj?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseAccount {
  id: string;
  name: string;
  code: string;
  level: number;
  nature: 'revenue' | 'deduction' | 'cost' | 'expense' | 'other_revenue' | 'other_expense';
  parent_id?: string;
  sort_order: number;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupabaseFinancialFact {
  id: string;
  entity_id: string;
  account_id: string;
  scenario: 'real' | 'budget' | 'forecast';
  year: number;
  month: number;
  value: number;
  description?: string;
  currency?: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'analyst' | 'viewer';
  preferences?: any;
  created_at: string;
  updated_at: string;
}

// Funções utilitárias para conversão de tipos
export const convertSupabaseEntityToLocal = (entity: SupabaseEntity) => ({
  id: entity.id,
  name: entity.name,
  code: entity.code,
  type: entity.type,
  cnpj: entity.cnpj || '',
  address: entity.address || '',
  isActive: entity.is_active,
  createdAt: entity.created_at,
  updatedAt: entity.updated_at
});

export const convertLocalEntityToSupabase = (entity: any) => ({
  name: entity.name,
  code: entity.code,
  type: entity.type,
  cnpj: entity.cnpj,
  address: entity.address,
  is_active: entity.isActive
});

export const convertSupabaseAccountToLocal = (account: SupabaseAccount) => ({
  id: account.id,
  name: account.name,
  code: account.code,
  level: account.level,
  nature: account.nature,
  parentId: account.parent_id,
  sortOrder: account.sort_order,
  description: account.description,
  isActive: account.is_active,
  createdAt: account.created_at,
  updatedAt: account.updated_at
});

export const convertLocalAccountToSupabase = (account: any) => ({
  name: account.name,
  code: account.code,
  level: account.level,
  nature: account.nature,
  parent_id: account.parentId,
  sort_order: account.sortOrder,
  description: account.description,
  is_active: account.isActive
});

export const convertSupabaseFactToLocal = (fact: SupabaseFinancialFact) => ({
  id: fact.id,
  entityId: fact.entity_id,
  accountId: fact.account_id,
  scenarioId: fact.scenario,
  year: fact.year,
  month: fact.month,
  value: fact.value,
  description: fact.description,
  currency: fact.currency,
  createdAt: fact.created_at,
  updatedAt: fact.updated_at
});

export const convertLocalFactToSupabase = (fact: any) => ({
  entity_id: fact.entityId,
  account_id: fact.accountId,
  scenario: fact.scenarioId,
  year: fact.year,
  month: fact.month,
  value: fact.value,
  description: fact.description,
  currency: fact.currency || 'BRL'
});

export default supabase;