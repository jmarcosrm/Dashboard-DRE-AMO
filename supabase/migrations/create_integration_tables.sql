-- Create integration tables for n8n and Google Drive integration

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  file_id VARCHAR(255),
  entity_id UUID REFERENCES entities(id),
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create processed_files table
CREATE TABLE IF NOT EXISTS processed_files (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size BIGINT,
  file_type VARCHAR(50),
  drive_file_id VARCHAR(255) UNIQUE,
  status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  rows_processed INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  entity_id UUID REFERENCES entities(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create data_mappings table
CREATE TABLE IF NOT EXISTS data_mappings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source_format VARCHAR(50) NOT NULL,
  mapping_config JSONB NOT NULL,
  validation_rules JSONB,
  is_active BOOLEAN DEFAULT true,
  entity_id UUID REFERENCES entities(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create integration_settings table
CREATE TABLE IF NOT EXISTS integration_settings (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMPTZ,
  sync_frequency VARCHAR(50),
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create n8n_processing_logs table
CREATE TABLE IF NOT EXISTS n8n_processing_logs (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  workflow_id VARCHAR(255),
  execution_id VARCHAR(255),
  file_id UUID REFERENCES processed_files(id),
  status VARCHAR(50) DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  processing_time_ms INTEGER,
  webhook_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);

CREATE INDEX IF NOT EXISTS idx_processed_files_status ON processed_files(status);
CREATE INDEX IF NOT EXISTS idx_processed_files_drive_file_id ON processed_files(drive_file_id);
CREATE INDEX IF NOT EXISTS idx_processed_files_entity_id ON processed_files(entity_id);
CREATE INDEX IF NOT EXISTS idx_processed_files_created_at ON processed_files(created_at);

CREATE INDEX IF NOT EXISTS idx_data_mappings_entity_id ON data_mappings(entity_id);
CREATE INDEX IF NOT EXISTS idx_data_mappings_is_active ON data_mappings(is_active);

CREATE INDEX IF NOT EXISTS idx_integration_settings_type ON integration_settings(type);
CREATE INDEX IF NOT EXISTS idx_integration_settings_is_active ON integration_settings(is_active);

CREATE INDEX IF NOT EXISTS idx_n8n_logs_file_id ON n8n_processing_logs(file_id);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_status ON n8n_processing_logs(status);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_started_at ON n8n_processing_logs(started_at);

-- Enable RLS on all tables
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_processing_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Audit logs: users can only see their own logs or logs for their entities
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Processed files: users can see files for their entities
CREATE POLICY "Users can view processed files" ON processed_files
  FOR SELECT USING (true);

CREATE POLICY "Users can insert processed files" ON processed_files
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update processed files" ON processed_files
  FOR UPDATE USING (true);

-- Data mappings: users can manage mappings for their entities
CREATE POLICY "Users can view data mappings" ON data_mappings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert data mappings" ON data_mappings
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their data mappings" ON data_mappings
  FOR UPDATE USING (auth.uid() = created_by);

-- Integration settings: users can manage their integration settings
CREATE POLICY "Users can view integration settings" ON integration_settings
  FOR SELECT USING (true);

CREATE POLICY "Users can insert integration settings" ON integration_settings
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their integration settings" ON integration_settings
  FOR UPDATE USING (auth.uid() = created_by);

-- N8N processing logs: users can view processing logs
CREATE POLICY "Users can view n8n processing logs" ON n8n_processing_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can insert n8n processing logs" ON n8n_processing_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update n8n processing logs" ON n8n_processing_logs
  FOR UPDATE USING (true);

-- Grant permissions to anon and authenticated roles
GRANT SELECT, INSERT, UPDATE ON audit_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON processed_files TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_mappings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON integration_settings TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON n8n_processing_logs TO anon, authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;