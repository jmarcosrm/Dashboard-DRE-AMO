import { supabase } from '../config/supabase';
import { Entity } from '../../shared/types';

export class EntitiesService {
  async getAll(): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .order('name');
    
    if (error) {
      throw new Error(`Failed to fetch entities: ${error.message}`);
    }
    
    return data || [];
  }

  async getById(id: string): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch entity: ${error.message}`);
    }
    
    return data;
  }

  async create(entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'>): Promise<Entity> {
    const { data, error } = await supabase
      .from('entities')
      .insert(entity)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create entity: ${error.message}`);
    }
    
    return data;
  }

  async update(id: string, updates: Partial<Omit<Entity, 'id' | 'created_at' | 'updated_at'>>): Promise<Entity> {
    const { data, error } = await supabase
      .from('entities')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to update entity: ${error.message}`);
    }
    
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', id);
    
    if (error) {
      throw new Error(`Failed to delete entity: ${error.message}`);
    }
  }

  async findByName(name: string): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('name', name)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find entity by name: ${error.message}`);
    }
    
    return data;
  }

  async findByCode(code: string): Promise<Entity | null> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to find entity by code: ${error.message}`);
    }
    
    return data;
  }
}

export const entitiesService = new EntitiesService();