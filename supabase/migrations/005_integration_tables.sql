-- Migration: Integration Tables for N8N and Google Drive
-- Description: Create tables for processing logs, file tracking, data mappings, and integration settings

-- Tabela para logs de processamento do N8N
CREATE TABLE n8n_processing_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id VARCHAR(255) NOT NULL,
    execution_id VARCHAR(255) NOT NULL,
    source VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'retrying')),
    records_processed INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_message TEXT,
    processing_time_ms INTEGER,
    payload JSONB,
    result JSONB,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices para n8n_processing_logs
CREATE INDEX idx_n8n_logs_workflow ON n8n_processing_logs(workflow_id);
CREATE INDEX idx_n8n_logs_execution ON n8n_processing_logs(execution_id);
CREATE INDEX idx_n8n_logs_status ON n8n_processing_logs(status);
CREATE INDEX idx_n8n_logs_source ON n8n_processing_logs(source);
CREATE INDEX idx_n8n_logs_created ON n8n_processing_logs(created_at);
CREATE INDEX idx_n8n_logs_retry ON n8n_processing_logs(next_retry_at) WHERE next_retry_at IS NOT NULL;

-- Tabela para arquivos processados do Google Drive
CREATE TABLE processed_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_id VARCHAR(255) NOT NULL UNIQUE,
    file_name VARCHAR(500) NOT NULL,
    file_path TEXT,
    mime_type VARCHAR(255),
    file_size BIGINT,
    drive_modified_time TIMESTAMP WITH TIME ZONE,
    last_processed_at TIMESTAMP WITH TIME ZONE,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed', 'skipped')),
    records_extracted INTEGER DEFAULT 0,
    records_imported INTEGER DEFAULT 0,
    error_message TEXT,
    file_hash VARCHAR(64), -- SHA-256 hash para detectar mudanças
    metadata JSONB, -- Metadados adicionais do arquivo
    mapping_config_id UUID, -- Referência para configuração de mapeamento
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para processed_files
CREATE INDEX idx_processed_files_file_id ON processed_files(file_id);
CREATE INDEX idx_processed_files_status ON processed_files(processing_status);
CREATE INDEX idx_processed_files_modified ON processed_files(drive_modified_time);
CREATE INDEX idx_processed_files_processed ON processed_files(last_processed_at);
CREATE INDEX idx_processed_files_hash ON processed_files(file_hash);

-- Tabela para mapeamentos de dados
CREATE TABLE data_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_pattern VARCHAR(500), -- Padrão regex para nomes de arquivo
    sheet_name VARCHAR(255), -- Nome da planilha (para Excel)
    header_row INTEGER DEFAULT 1, -- Linha do cabeçalho
    data_start_row INTEGER DEFAULT 2, -- Linha onde começam os dados
    column_mappings JSONB NOT NULL, -- Mapeamento de colunas
    validation_rules JSONB, -- Regras de validação
    transformation_rules JSONB, -- Regras de transformação
    default_values JSONB, -- Valores padrão
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para data_mappings
CREATE INDEX idx_data_mappings_name ON data_mappings(name);
CREATE INDEX idx_data_mappings_active ON data_mappings(is_active);
CREATE INDEX idx_data_mappings_pattern ON data_mappings(file_pattern);

-- Tabela para configurações de integração
CREATE TABLE integration_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(255) NOT NULL UNIQUE,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para integration_settings
CREATE INDEX idx_integration_settings_key ON integration_settings(setting_key);
CREATE INDEX idx_integration_settings_active ON integration_settings(is_active);

-- Tabela para notificações de processamento
CREATE TABLE processing_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    source VARCHAR(100) NOT NULL, -- 'n8n', 'google_drive', 'system'
    reference_id UUID, -- ID do log ou arquivo relacionado
    user_id UUID REFERENCES users(id),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para processing_notifications
CREATE INDEX idx_notifications_user ON processing_notifications(user_id);
CREATE INDEX idx_notifications_type ON processing_notifications(type);
CREATE INDEX idx_notifications_source ON processing_notifications(source);
CREATE INDEX idx_notifications_read ON processing_notifications(is_read);
CREATE INDEX idx_notifications_created ON processing_notifications(created_at);

-- Tabela para auditoria de dados financeiros
CREATE TABLE financial_data_audit (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    financial_fact_id UUID REFERENCES financial_facts(id) ON DELETE CASCADE,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    source VARCHAR(100) NOT NULL, -- 'manual', 'n8n', 'google_drive', 'api'
    source_reference VARCHAR(255), -- ID do arquivo ou workflow
    performed_by UUID REFERENCES users(id),
    performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Índices para financial_data_audit
CREATE INDEX idx_audit_fact_id ON financial_data_audit(financial_fact_id);
CREATE INDEX idx_audit_operation ON financial_data_audit(operation);
CREATE INDEX idx_audit_source ON financial_data_audit(source);
CREATE INDEX idx_audit_performed_by ON financial_data_audit(performed_by);
CREATE INDEX idx_audit_performed_at ON financial_data_audit(performed_at);

-- Adicionar referência de mapeamento à tabela processed_files
ALTER TABLE processed_files 
ADD CONSTRAINT fk_processed_files_mapping 
FOREIGN KEY (mapping_config_id) REFERENCES data_mappings(id);

-- Triggers para atualizar updated_at
CREATE TRIGGER update_n8n_processing_logs_updated_at 
    BEFORE UPDATE ON n8n_processing_logs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_processed_files_updated_at 
    BEFORE UPDATE ON processed_files
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_data_mappings_updated_at 
    BEFORE UPDATE ON data_mappings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integration_settings_updated_at 
    BEFORE UPDATE ON integration_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar notificação automaticamente
CREATE OR REPLACE FUNCTION create_processing_notification(
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_message TEXT,
    p_source VARCHAR(100),
    p_reference_id UUID DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO processing_notifications (type, title, message, source, reference_id, user_id)
    VALUES (p_type, p_title, p_message, p_source, p_reference_id, p_user_id)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Função para limpar notificações antigas (mais de 30 dias)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM processing_notifications 
    WHERE created_at < NOW() - INTERVAL '30 days'
    AND is_read = true;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Habilitar RLS nas novas tabelas
ALTER TABLE n8n_processing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE processing_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_data_audit ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para usuários autenticados
CREATE POLICY "Authenticated users can view processing logs" ON n8n_processing_logs
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage processing logs" ON n8n_processing_logs
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view processed files" ON processed_files
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage processed files" ON processed_files
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view data mappings" ON data_mappings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage data mappings" ON data_mappings
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can view integration settings" ON integration_settings
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage integration settings" ON integration_settings
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Users can view their notifications" ON processing_notifications
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their notifications" ON processing_notifications
    FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON processing_notifications
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view audit logs" ON financial_data_audit
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can create audit logs" ON financial_data_audit
    FOR INSERT TO authenticated WITH CHECK (true);

-- Conceder permissões
GRANT ALL PRIVILEGES ON n8n_processing_logs TO authenticated;
GRANT ALL PRIVILEGES ON processed_files TO authenticated;
GRANT ALL PRIVILEGES ON data_mappings TO authenticated;
GRANT ALL PRIVILEGES ON integration_settings TO authenticated;
GRANT ALL PRIVILEGES ON processing_notifications TO authenticated;
GRANT ALL PRIVILEGES ON financial_data_audit TO authenticated;

-- Inserir configurações padrão
INSERT INTO integration_settings (setting_key, setting_value, description) VALUES
('google_drive.enabled', 'true', 'Enable Google Drive integration'),
('google_drive.folder_id', '""', 'Google Drive folder ID to monitor'),
('google_drive.file_types', '["xlsx", "xls", "csv"]', 'Allowed file types for processing'),
('n8n.enabled', 'true', 'Enable N8N webhook integration'),
('n8n.retry_attempts', '3', 'Number of retry attempts for failed processing'),
('n8n.retry_delay_minutes', '5', 'Delay between retry attempts in minutes'),
('processing.auto_mapping', 'true', 'Enable automatic column mapping detection'),
('processing.validation_strict', 'false', 'Enable strict validation mode'),
('notifications.enabled', 'true', 'Enable processing notifications'),
('notifications.email_alerts', 'false', 'Send email alerts for processing events');

-- Inserir mapeamento padrão para DRE
INSERT INTO data_mappings (name, description, column_mappings, validation_rules, default_values) VALUES
('DRE Padrão', 'Mapeamento padrão para planilhas de DRE', 
'{
  "entity_code": {"column": "A", "required": true, "type": "string"},
  "entity_name": {"column": "B", "required": false, "type": "string"},
  "account_code": {"column": "C", "required": true, "type": "string"},
  "account_name": {"column": "D", "required": false, "type": "string"},
  "value": {"column": "E", "required": true, "type": "number"},
  "year": {"column": "F", "required": true, "type": "number"},
  "month": {"column": "G", "required": true, "type": "number"},
  "scenario": {"column": "H", "required": false, "type": "string"},
  "description": {"column": "I", "required": false, "type": "string"}
}',
'{
  "value": {"min": -999999999, "max": 999999999},
  "year": {"min": 2020, "max": 2030},
  "month": {"min": 1, "max": 12},
  "scenario": {"enum": ["real", "budget", "forecast"]}
}',
'{
  "scenario": "real",
  "currency": "BRL"
}');

COMMIT;