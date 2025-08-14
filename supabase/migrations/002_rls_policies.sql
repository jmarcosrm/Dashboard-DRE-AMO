-- Enable Row Level Security (RLS) on all tables
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_facts ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Entities policies
CREATE POLICY "Enable read access for all users" ON entities
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON entities
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON entities
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON entities
    FOR DELETE USING (auth.role() = 'authenticated');

-- Accounts policies
CREATE POLICY "Enable read access for all users" ON accounts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON accounts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON accounts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON accounts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Financial facts policies
CREATE POLICY "Enable read access for all users" ON financial_facts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON financial_facts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON financial_facts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON financial_facts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Enable insert for authenticated users" ON users
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Grant specific table permissions
GRANT SELECT ON entities TO anon;
GRANT ALL PRIVILEGES ON entities TO authenticated;

GRANT SELECT ON accounts TO anon;
GRANT ALL PRIVILEGES ON accounts TO authenticated;

GRANT SELECT ON financial_facts TO anon;
GRANT ALL PRIVILEGES ON financial_facts TO authenticated;

GRANT SELECT, INSERT, UPDATE ON users TO authenticated;