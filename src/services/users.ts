import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type UserRow = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Convert database row to User type
function mapUserFromDB(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role as User['role'],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

// Convert User type to database insert
function mapUserToDB(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): UserInsert {
  return {
    email: user.email,
    name: user.name,
    role: user.role,
    is_active: user.isActive
  };
}

// Convert User type to database update
function mapUserToDBUpdate(user: Partial<User>): UserUpdate {
  const update: UserUpdate = {};
  
  if (user.email !== undefined) update.email = user.email;
  if (user.name !== undefined) update.name = user.name;
  if (user.role !== undefined) update.role = user.role;
  if (user.isActive !== undefined) update.is_active = user.isActive;
  
  return update;
}

export const usersService = {
  // Get all users
  async getAll(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data.map(mapUserFromDB);
  },

  // Get user by ID
  async getById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching user:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return mapUserFromDB(data);
  },

  // Get user by email
  async getByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      console.error('Error fetching user by email:', error);
      throw new Error(`Failed to fetch user by email: ${error.message}`);
    }

    return mapUserFromDB(data);
  },

  // Create new user
  async create(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const userData = mapUserToDB(user);
    
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }

    return mapUserFromDB(data);
  },

  // Update user
  async update(id: string, updates: Partial<User>): Promise<User> {
    const updateData = mapUserToDBUpdate(updates);
    
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return mapUserFromDB(data);
  },

  // Delete user
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting user:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  // Get active users only
  async getActive(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching active users:', error);
      throw new Error(`Failed to fetch active users: ${error.message}`);
    }

    return data.map(mapUserFromDB);
  },

  // Get users by role
  async getByRole(role: User['role']): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('role', role)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Error fetching users by role:', error);
      throw new Error(`Failed to fetch users by role: ${error.message}`);
    }

    return data.map(mapUserFromDB);
  },

  // Search users by name or email
  async search(query: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
      .order('name');

    if (error) {
      console.error('Error searching users:', error);
      throw new Error(`Failed to search users: ${error.message}`);
    }

    return data.map(mapUserFromDB);
  }
};