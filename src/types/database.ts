export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      entities: {
        Row: {
          id: string
          name: string
          code: string
          cnpj: string
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          cnpj: string
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          cnpj?: string
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      accounts: {
        Row: {
          id: string
          code: string
          name: string
          nature: 'revenue' | 'deduction' | 'cost' | 'expense' | 'other_revenue' | 'other_expense'
          level: number
          description: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          nature: 'revenue' | 'deduction' | 'cost' | 'expense' | 'other_revenue' | 'other_expense'
          level: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          nature?: 'revenue' | 'deduction' | 'cost' | 'expense' | 'other_revenue' | 'other_expense'
          level?: number
          description?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      financial_facts: {
        Row: {
          id: string
          entity_id: string
          account_id: string
          scenario_id: 'real' | 'budget' | 'forecast'
          year: number
          month: number
          value: number
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          entity_id: string
          account_id: string
          scenario_id: 'real' | 'budget' | 'forecast'
          year: number
          month: number
          value: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          entity_id?: string
          account_id?: string
          scenario_id?: 'real' | 'budget' | 'forecast'
          year?: number
          month?: number
          value?: number
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_facts_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_facts_account_id_fkey"
            columns: ["account_id"]
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'admin' | 'user' | 'viewer'
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'admin' | 'user' | 'viewer'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'user' | 'viewer'
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      processed_files: {
        Row: {
          id: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          drive_file_id: string | null
          status: string | null
          processed_at: string | null
          error_message: string | null
          rows_processed: number | null
          rows_failed: number | null
          entity_id: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          drive_file_id?: string | null
          status?: string | null
          processed_at?: string | null
          error_message?: string | null
          rows_processed?: number | null
          rows_failed?: number | null
          entity_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          drive_file_id?: string | null
          status?: string | null
          processed_at?: string | null
          error_message?: string | null
          rows_processed?: number | null
          rows_failed?: number | null
          entity_id?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "processed_files_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          event_type: string
          user_id: string | null
          file_id: string | null
          entity_id: string | null
          details: Json | null
          timestamp: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          event_type: string
          user_id?: string | null
          file_id?: string | null
          entity_id?: string | null
          details?: Json | null
          timestamp?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          event_type?: string
          user_id?: string | null
          file_id?: string | null
          entity_id?: string | null
          details?: Json | null
          timestamp?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      data_mappings: {
        Row: {
          id: string
          name: string
          description: string | null
          source_format: string
          mapping_config: Json
          validation_rules: Json | null
          is_active: boolean | null
          entity_id: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          source_format: string
          mapping_config: Json
          validation_rules?: Json | null
          is_active?: boolean | null
          entity_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          source_format?: string
          mapping_config?: Json
          validation_rules?: Json | null
          is_active?: boolean | null
          entity_id?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_mappings_entity_id_fkey"
            columns: ["entity_id"]
            referencedRelation: "entities"
            referencedColumns: ["id"]
          }
        ]
      }
      integration_settings: {
        Row: {
          id: string
          name: string
          type: string
          config: Json
          is_active: boolean | null
          last_sync: string | null
          sync_frequency: string | null
          error_count: number | null
          last_error: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          config: Json
          is_active?: boolean | null
          last_sync?: string | null
          sync_frequency?: string | null
          error_count?: number | null
          last_error?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          config?: Json
          is_active?: boolean | null
          last_sync?: string | null
          sync_frequency?: string | null
          error_count?: number | null
          last_error?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      n8n_processing_logs: {
        Row: {
          id: string
          workflow_id: string | null
          execution_id: string | null
          file_id: string | null
          status: string | null
          started_at: string | null
          completed_at: string | null
          error_message: string | null
          processing_time_ms: number | null
          webhook_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          execution_id?: string | null
          file_id?: string | null
          status?: string | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          processing_time_ms?: number | null
          webhook_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          execution_id?: string | null
          file_id?: string | null
          status?: string | null
          started_at?: string | null
          completed_at?: string | null
          error_message?: string | null
          processing_time_ms?: number | null
          webhook_data?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "n8n_processing_logs_file_id_fkey"
            columns: ["file_id"]
            referencedRelation: "processed_files"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      account_nature: 'revenue' | 'deduction' | 'cost' | 'expense' | 'other_revenue' | 'other_expense'
      scenario_type: 'real' | 'budget' | 'forecast'
      user_role: 'admin' | 'user' | 'viewer'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}