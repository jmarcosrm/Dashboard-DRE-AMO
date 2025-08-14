// Tipos compartilhados entre frontend e backend

export interface Entity {
  id: string;
  name: string;
  description?: string;
  type: 'company' | 'department' | 'project' | 'other';
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Account {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialFact {
  id: string;
  entity_id: string;
  account_id: string;
  period: string;
  value: number;
  currency: string;
  scenario: 'actual' | 'budget' | 'forecast';
  created_at: string;
  updated_at: string;
}

export interface IntegrationSetting {
  id: string;
  name: string;
  type: string;
  config: Record<string, any>;
  is_active: boolean;
  last_sync?: string;
  sync_frequency?: string;
  error_count: number;
  last_error?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DataMapping {
  id: string;
  name: string;
  description?: string;
  source_format: string;
  mapping_config: Record<string, any>;
  validation_rules?: Record<string, any>;
  is_active: boolean;
  entity_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProcessedFile {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  file_hash: string;
  source_type: 'google_drive' | 'manual_upload' | 'n8n';
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
  records_processed: number;
  records_failed: number;
  error_details?: Record<string, any>;
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface N8nProcessingLog {
  id: string;
  workflow_id: string;
  execution_id: string;
  file_id?: string;
  status: 'started' | 'processing' | 'completed' | 'failed';
  input_data?: Record<string, any>;
  output_data?: Record<string, any>;
  error_details?: Record<string, any>;
  processing_time_ms?: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Tipos para validação
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ValidationConfig {
  required_fields?: string[];
  field_types?: Record<string, string>;
  custom_validators?: Record<string, (value: any) => ValidationResult>;
}

// Tipos para mapeamento de dados
export interface ColumnMapping {
  source_column: string;
  target_field: string;
  data_type: 'string' | 'number' | 'date' | 'boolean';
  required: boolean;
  default_value?: any;
  transformation?: string;
}

export interface MappingConfig {
  entityMapping: {
    column: string;
    defaultValue: string;
  };
  accountMapping: {
    column: string;
    defaultValue: string;
  };
}

// Tipos para templates de mapeamento
export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  file_pattern: string;
  mapping_config: MappingConfig;
  suggested_mappings: ColumnMapping[];
  created_at: string;
  updated_at: string;
}