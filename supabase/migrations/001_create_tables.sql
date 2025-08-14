-- Criar tabela de entidades
CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) DEFAULT 'subsidiary' CHECK (type IN ('subsidiary', 'consolidated', 'division')),
    cnpj VARCHAR(18),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para entities
CREATE INDEX idx_entities_code ON entities(code);
CREATE INDEX idx_entities_type ON entities(type);
CREATE INDEX idx_entities_active ON entities(is_active);

-- Criar tabela de contas
CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5),
    nature VARCHAR(50) NOT NULL CHECK (nature IN ('revenue', 'deduction', 'cost', 'expense', 'other_revenue', 'other_expense')),
    parent_id UUID REFERENCES accounts(id),
    sort_order INTEGER DEFAULT 0,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar índices para accounts
CREATE INDEX idx_accounts_code ON accounts(code);
CREATE INDEX idx_accounts_level ON accounts(level);
CREATE INDEX idx_accounts_nature ON accounts(nature);
CREATE INDEX idx_accounts_parent ON accounts(parent_id);
CREATE INDEX idx_accounts_sort ON accounts(sort_order);

-- Criar tabela de fatos financeiros
CREATE TABLE financial_facts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES entities(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    scenario VARCHAR(20) NOT NULL CHECK (scenario IN ('real', 'budget', 'forecast')),
    year INTEGER NOT NULL,
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    value DECIMAL(15,2) NOT NULL,
    description TEXT,
    currency VARCHAR(3) DEFAULT 'BRL',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(entity_id, account_id, scenario, year, month)
);

-- Criar índices para financial_facts
CREATE INDEX idx_financial_facts_entity ON financial_facts(entity_id);
CREATE INDEX idx_financial_facts_account ON financial_facts(account_id);
CREATE INDEX idx_financial_facts_scenario ON financial_facts(scenario);
CREATE INDEX idx_financial_facts_period ON financial_facts(year, month);
CREATE INDEX idx_financial_facts_composite ON financial_facts(entity_id, scenario, year, month);

-- Criar função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Criar triggers para atualizar updated_at
CREATE TRIGGER update_entities_updated_at BEFORE UPDATE ON entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_financial_facts_updated_at BEFORE UPDATE ON financial_facts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_facts ENABLE ROW LEVEL SECURITY;

-- Criar políticas básicas de segurança
CREATE POLICY "Permitir leitura para usuários anônimos" ON entities
    FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir leitura para usuários anônimos" ON accounts
    FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir leitura para usuários anônimos" ON financial_facts
    FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir todas as operações para usuários autenticados" ON entities
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir todas as operações para usuários autenticados" ON accounts
    FOR ALL TO authenticated USING (true);

CREATE POLICY "Permitir todas as operações para usuários autenticados" ON financial_facts
    FOR ALL TO authenticated USING (true);

-- Conceder permissões
GRANT SELECT ON entities TO anon;
GRANT SELECT ON accounts TO anon;
GRANT SELECT ON financial_facts TO anon;

GRANT ALL PRIVILEGES ON entities TO authenticated;
GRANT ALL PRIVILEGES ON accounts TO authenticated;
GRANT ALL PRIVILEGES ON financial_facts TO authenticated;