import { supabase } from '../lib/supabase';
import type { Entity } from '../types';
import type { Database } from '../types/database';

type EntityRow = Database['public']['Tables']['entities']['Row'];
type EntityInsert = Database['public']['Tables']['entities']['Insert'];
type EntityUpdate = Database['public']['Tables']['entities']['Update'];

// Convert database row to Entity type
function mapEntityFromDB(row: EntityRow): Entity {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    cnpj: row.cnpj || '',
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Convert Entity type to database insert
function mapEntityToDB(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): EntityInsert {
  return {
    name: entity.name,
    code: entity.code,
    cnpj: entity.cnpj,
    is_active: entity.isActive
  };
}

// Convert Entity type to database update
function mapEntityToDBUpdate(entity: Partial<Entity>): EntityUpdate {
  const update: EntityUpdate = {};
  
  if (entity.name !== undefined) update.name = entity.name;
  if (entity.code !== undefined) update.code = entity.code;
  if (entity.cnpj !== undefined) update.cnpj = entity.cnpj;
  if (entity.isActive !== undefined) update.is_active = entity.isActive;
  
  return update;
}

export const entitiesService = {
  // Get all entities
  async getAll(): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching entities:', error);
      throw new Error(`Failed to fetch entities: ${error.message}`);
    }

    return data.map(mapEntityFromDB);
  },

  // Get entity by ID
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
      console.error('Error fetching entity:', error);
      throw new Error(`Failed to fetch entity: ${error.message}`);
    }

    return mapEntityFromDB(data);
  },

  // Create new entity
  async create(entity: Omit<Entity, 'id' | 'createdAt' | 'updatedAt'>): Promise<Entity> {
    const entityData = mapEntityToDB(entity);
    
    const { data, error } = await supabase
      .from('entities')
      .insert(entityData)
      .select()
      .single();

    if (error) {
      console.error('Error creating entity:', error);
      throw new Error(`Failed to create entity: ${error.message}`);
    }

    return mapEntityFromDB(data);
  },

  // Update entity
  async update(id: string, updates: Partial<Entity>): Promise<Entity> {
    const updateData = mapEntityToDBUpdate(updates);
    
    const { data, error } = await supabase
      .from('entities')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating entity:', error);
      throw new Error(`Failed to update entity: ${error.message}`);
    }

    return mapEntityFromDB(data);
  },

  // Delete entity
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('entities')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting entity:', error);
      throw new Error(`Failed to delete entity: ${error.message}`);
    }
  },

  // Get active entities only
  async getActive(): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching active entities:', error);
      throw new Error(`Failed to fetch active entities: ${error.message}`);
    }

    return data.map(mapEntityFromDB);
  },

  // Search entities by name or code
  async search(query: string): Promise<Entity[]> {
    const { data, error } = await supabase
      .from('entities')
      .select('*')
      .or(`name.ilike.%${query}%,code.ilike.%${query}%`)
      .order('name');

    if (error) {
      console.error('Error searching entities:', error);
      throw new Error(`Failed to search entities: ${error.message}`);
    }

    return data.map(mapEntityFromDB);
  }
};