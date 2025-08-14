import { createClient } from '@supabase/supabase-js';

// Configuração do Supabase com service role key
const supabaseUrl = process.env.SUPABASE_URL || 'https://bedgpuwdsoliccoaojso.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZGdwdXdkc29saWNjb2FvanNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEzNzU0NywiZXhwIjoyMDcwNzEzNTQ3fQ.EAk3FQMNvs2w1y9n3ZlONyeAR5GL2xuQc9pPaj4PJ8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createIntegrationTables() {
  try {
    console.log('🚀 Criando tabelas de integração...');
    
    // Criar tabela n8n_processing_logs
    console.log('📝 Criando tabela n8n_processing_logs...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS n8n_processing_logs (
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
      `
    });
    
    if (error1) console.log('⚠️ n8n_processing_logs:', error1.message);
    else console.log('✅ n8n_processing_logs criada');
    
    // Criar tabela processed_files
    console.log('📝 Criando tabela processed_files...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS processed_files (
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
          file_hash VARCHAR(64),
          metadata JSONB,
          mapping_config_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error2) console.log('⚠️ processed_files:', error2.message);
    else console.log('✅ processed_files criada');
    
    // Criar tabela data_mappings
    console.log('📝 Criando tabela data_mappings...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS data_mappings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          description TEXT,
          file_pattern VARCHAR(500),
          sheet_name VARCHAR(255),
          header_row INTEGER DEFAULT 1,
          data_start_row INTEGER DEFAULT 2,
          column_mappings JSONB NOT NULL,
          validation_rules JSONB,
          transformation_rules JSONB,
          default_values JSONB,
          is_active BOOLEAN DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error3) console.log('⚠️ data_mappings:', error3.message);
    else console.log('✅ data_mappings criada');
    
    // Criar tabela integration_settings
    console.log('📝 Criando tabela integration_settings...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS integration_settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          setting_key VARCHAR(255) NOT NULL UNIQUE,
          setting_value JSONB NOT NULL,
          description TEXT,
          is_encrypted BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          created_by UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error4) console.log('⚠️ integration_settings:', error4.message);
    else console.log('✅ integration_settings criada');
    
    // Criar tabela processing_notifications
    console.log('📝 Criando tabela processing_notifications...');
    const { error: error5 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS processing_notifications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          type VARCHAR(50) NOT NULL CHECK (type IN ('success', 'warning', 'error', 'info')),
          title VARCHAR(255) NOT NULL,
          message TEXT NOT NULL,
          source VARCHAR(100) NOT NULL,
          reference_id UUID,
          user_id UUID,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (error5) console.log('⚠️ processing_notifications:', error5.message);
    else console.log('✅ processing_notifications criada');
    
    // Criar tabela financial_data_audit
    console.log('📝 Criando tabela financial_data_audit...');
    const { error: error6 } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS financial_data_audit (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          financial_fact_id UUID,
          operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
          old_values JSONB,
          new_values JSONB,
          source VARCHAR(100) NOT NULL,
          source_reference VARCHAR(255),
          performed_by UUID,
          performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          ip_address INET,
          user_agent TEXT
        );
      `
    });
    
    if (error6) console.log('⚠️ financial_data_audit:', error6.message);
    else console.log('✅ financial_data_audit criada');
    
    console.log('🎉 Todas as tabelas foram processadas!');
    
    // Verificar se as tabelas existem
    console.log('🔍 Verificando tabelas...');
    const tables = [
      'n8n_processing_logs',
      'processed_files',
      'data_mappings', 
      'integration_settings',
      'processing_notifications',
      'financial_data_audit'
    ];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
          
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: Tabela existe e acessível`);
        }
      } catch (err) {
        console.log(`❌ ${table}: Erro ao verificar`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

// Executar automaticamente
createIntegrationTables()
  .then(() => {
    console.log('✨ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no script:', error);
    process.exit(1);
  });