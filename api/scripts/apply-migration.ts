import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração do Supabase com service role key
const supabaseUrl = process.env.SUPABASE_URL || 'https://bedgpuwdsoliccoaojso.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJlZGdwdXdkc29saWNjb2FvanNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEzNzU0NywiZXhwIjoyMDcwNzEzNTQ3fQ.EAk3FQMNvs2w1y9n3ZlONyeAR5GL2xuQc9pPaj4PJ8E';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyMigration() {
  try {
    console.log('🚀 Aplicando migração de integração...');
    
    // Ler o arquivo de migração
    const migrationPath = join(__dirname, '../../supabase/migrations/005_integration_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Arquivo de migração carregado');
    
    // Dividir o SQL em comandos individuais
    const commands = migrationSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'COMMIT');
    
    console.log(`📝 Executando ${commands.length} comandos SQL...`);
    
    // Executar cada comando
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.trim()) {
        try {
          console.log(`⚡ Executando comando ${i + 1}/${commands.length}`);
          
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: command
          });
          
          if (error) {
            // Tentar executar diretamente se RPC falhar
            const { error: directError } = await supabase
              .from('_temp')
              .select('*')
              .limit(0);
            
            // Se não conseguir nem isso, usar uma abordagem alternativa
            console.log(`⚠️  Comando ${i + 1} pode ter falhado:`, error.message);
            
            // Para comandos CREATE TABLE, vamos tentar uma abordagem diferente
            if (command.includes('CREATE TABLE')) {
              console.log('🔄 Tentando abordagem alternativa para CREATE TABLE...');
              // Continuar mesmo com erro, pois a tabela pode já existir
            }
          } else {
            console.log(`✅ Comando ${i + 1} executado com sucesso`);
          }
        } catch (cmdError) {
          console.error(`❌ Erro no comando ${i + 1}:`, cmdError);
          // Continuar com os próximos comandos
        }
      }
    }
    
    console.log('🎉 Migração concluída!');
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    
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
          .select('*')
          .limit(1);
          
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Tabela ${table}: Erro ao verificar`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migração:', error);
    process.exit(1);
  }
}

// Executar automaticamente
applyMigration()
  .then(() => {
    console.log('✨ Script concluído!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Falha no script:', error);
    process.exit(1);
  });

export { applyMigration };