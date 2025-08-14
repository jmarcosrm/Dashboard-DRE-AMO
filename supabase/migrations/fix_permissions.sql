-- Conceder permissões para as tabelas principais

-- Permissões para entities
GRANT SELECT, INSERT, UPDATE, DELETE ON entities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON entities TO authenticated;

-- Permissões para accounts
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON accounts TO authenticated;

-- Permissões para financial_facts
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_facts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON financial_facts TO authenticated;

-- Permissões para users
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO authenticated;

-- Permissões para audit_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON audit_logs TO authenticated;

-- Permissões para processed_files
GRANT SELECT, INSERT, UPDATE, DELETE ON processed_files TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON processed_files TO authenticated;

-- Permissões para data_mappings
GRANT SELECT, INSERT, UPDATE, DELETE ON data_mappings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON data_mappings TO authenticated;

-- Permissões para integration_settings
GRANT SELECT, INSERT, UPDATE, DELETE ON integration_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON integration_settings TO authenticated;

-- Permissões para n8n_processing_logs
GRANT SELECT, INSERT, UPDATE, DELETE ON n8n_processing_logs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON n8n_processing_logs TO authenticated;

-- Criar políticas RLS mais permissivas para desenvolvimento

-- Política para entities
DROP POLICY IF EXISTS "Enable all operations for all users" ON entities;
CREATE POLICY "Enable all operations for all users" ON entities
  FOR ALL USING (true) WITH CHECK (true);

-- Política para accounts
DROP POLICY IF EXISTS "Enable all operations for all users" ON accounts;
CREATE POLICY "Enable all operations for all users" ON accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Política para financial_facts
DROP POLICY IF EXISTS "Enable all operations for all users" ON financial_facts;
CREATE POLICY "Enable all operations for all users" ON financial_facts
  FOR ALL USING (true) WITH CHECK (true);

-- Política para users
DROP POLICY IF EXISTS "Enable all operations for all users" ON users;
CREATE POLICY "Enable all operations for all users" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Política para audit_logs
DROP POLICY IF EXISTS "Enable all operations for all users" ON audit_logs;
CREATE POLICY "Enable all operations for all users" ON audit_logs
  FOR ALL USING (true) WITH CHECK (true);

-- Política para processed_files
DROP POLICY IF EXISTS "Enable all operations for all users" ON processed_files;
CREATE POLICY "Enable all operations for all users" ON processed_files
  FOR ALL USING (true) WITH CHECK (true);

-- Política para data_mappings
DROP POLICY IF EXISTS "Enable all operations for all users" ON data_mappings;
CREATE POLICY "Enable all operations for all users" ON data_mappings
  FOR ALL USING (true) WITH CHECK (true);

-- Política para integration_settings
DROP POLICY IF EXISTS "Enable all operations for all users" ON integration_settings;
CREATE POLICY "Enable all operations for all users" ON integration_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Política para n8n_processing_logs
DROP POLICY IF EXISTS "Enable all operations for all users" ON n8n_processing_logs;
CREATE POLICY "Enable all operations for all users" ON n8n_processing_logs
  FOR ALL USING (true) WITH CHECK (true);