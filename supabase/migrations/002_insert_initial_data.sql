-- Inserir entidades iniciais
INSERT INTO entities (name, code, type, cnpj, address) VALUES
('Milk Moo Ltda', 'MILK001', 'subsidiary', '12.345.678/0001-90', 'Rua das Vacas, 123 - São Paulo, SP'),
('Pass+Demo Tecnologia', 'PASS001', 'subsidiary', '98.765.432/0001-10', 'Av. Inovação, 456 - Rio de Janeiro, RJ'),
('E-commerce Solutions', 'ECOM001', 'subsidiary', '11.222.333/0001-44', 'Rua Digital, 789 - Belo Horizonte, MG'),
('Consolidado Grupo', 'CONS001', 'consolidated', '', 'Matriz - São Paulo, SP');

-- Inserir plano de contas
INSERT INTO accounts (name, code, level, nature, sort_order) VALUES
-- Nível 1 - Receitas
('Receita Bruta', 'REC001', 1, 'revenue', 1),
('Vendas de Produtos', 'REC002', 2, 'revenue', 2),
('Vendas de Serviços', 'REC003', 2, 'revenue', 3),
('Outras Receitas Operacionais', 'REC004', 2, 'revenue', 4),

-- Nível 1 - Deduções
('Deduções da Receita', 'DED001', 1, 'deduction', 5),
('Impostos sobre Vendas', 'DED002', 2, 'deduction', 6),
('Devoluções e Cancelamentos', 'DED003', 2, 'deduction', 7),
('Descontos Comerciais', 'DED004', 2, 'deduction', 8),

-- Nível 1 - Custos
('Custo dos Produtos Vendidos', 'CPV001', 1, 'cost', 9),
('Matéria Prima', 'CPV002', 2, 'cost', 10),
('Mão de Obra Direta', 'CPV003', 2, 'cost', 11),
('Custos Indiretos de Fabricação', 'CPV004', 2, 'cost', 12),

-- Nível 1 - Despesas Operacionais
('Despesas Comerciais', 'DOP001', 1, 'expense', 13),
('Salários Vendas', 'DOP002', 2, 'expense', 14),
('Comissões', 'DOP003', 2, 'expense', 15),
('Marketing e Publicidade', 'DOP004', 2, 'expense', 16),

('Despesas Administrativas', 'DOP005', 1, 'expense', 17),
('Salários Administrativos', 'DOP006', 2, 'expense', 18),
('Aluguel', 'DOP007', 2, 'expense', 19),
('Energia Elétrica', 'DOP008', 2, 'expense', 20),
('Telefone e Internet', 'DOP009', 2, 'expense', 21),
('Material de Escritório', 'DOP010', 2, 'expense', 22),

-- Outras Receitas e Despesas
('Outras Receitas', 'OUT001', 1, 'other_revenue', 23),
('Receitas Financeiras', 'OUT002', 2, 'other_revenue', 24),
('Outras Despesas', 'OUT003', 1, 'other_expense', 25),
('Despesas Financeiras', 'OUT004', 2, 'other_expense', 26);

-- Atualizar parent_id para criar hierarquia
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'REC001') WHERE code IN ('REC002', 'REC003', 'REC004');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'DED001') WHERE code IN ('DED002', 'DED003', 'DED004');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'CPV001') WHERE code IN ('CPV002', 'CPV003', 'CPV004');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'DOP001') WHERE code IN ('DOP002', 'DOP003', 'DOP004');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'DOP005') WHERE code IN ('DOP006', 'DOP007', 'DOP008', 'DOP009', 'DOP010');
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'OUT001') WHERE code = 'OUT002';
UPDATE accounts SET parent_id = (SELECT id FROM accounts WHERE code = 'OUT003') WHERE code = 'OUT004';

-- Inserir fatos financeiros de exemplo para 2024
INSERT INTO financial_facts (entity_id, account_id, scenario, year, month, value) 
SELECT 
    e.id as entity_id,
    a.id as account_id,
    'real' as scenario,
    2024 as year,
    m.month,
    CASE 
        WHEN a.nature = 'revenue' AND a.level = 1 THEN 
            CASE 
                WHEN e.code = 'MILK001' THEN 1200000 + (RANDOM() * 200000)
                WHEN e.code = 'PASS001' THEN 800000 + (RANDOM() * 150000)
                WHEN e.code = 'ECOM001' THEN 1500000 + (RANDOM() * 300000)
                ELSE 0
            END
        WHEN a.nature = 'deduction' AND a.level = 1 THEN 
            CASE 
                WHEN e.code = 'MILK001' THEN -(120000 + (RANDOM() * 20000))
                WHEN e.code = 'PASS001' THEN -(80000 + (RANDOM() * 15000))
                WHEN e.code = 'ECOM001' THEN -(150000 + (RANDOM() * 30000))
                ELSE 0
            END
        WHEN a.nature = 'cost' AND a.level = 1 THEN 
            CASE 
                WHEN e.code = 'MILK001' THEN -(480000 + (RANDOM() * 80000))
                WHEN e.code = 'PASS001' THEN -(240000 + (RANDOM() * 40000))
                WHEN e.code = 'ECOM001' THEN -(750000 + (RANDOM() * 150000))
                ELSE 0
            END
        WHEN a.nature = 'expense' AND a.level = 1 THEN 
            CASE 
                WHEN e.code = 'MILK001' THEN -(200000 + (RANDOM() * 30000))
                WHEN e.code = 'PASS001' THEN -(150000 + (RANDOM() * 25000))
                WHEN e.code = 'ECOM001' THEN -(250000 + (RANDOM() * 40000))
                ELSE 0
            END
        WHEN a.nature = 'other_revenue' AND a.level = 1 THEN 
            CASE 
                WHEN e.code = 'MILK001' THEN 15000 + (RANDOM() * 5000)
                WHEN e.code = 'PASS001' THEN 10000 + (RANDOM() * 3000)
                WHEN e.code = 'ECOM001' THEN 20000 + (RANDOM() * 8000)
                ELSE 0
            END
        WHEN a.nature = 'other_expense' AND a.level = 1 THEN 
            CASE 
                WHEN e.code = 'MILK001' THEN -(8000 + (RANDOM() * 2000))
                WHEN e.code = 'PASS001' THEN -(5000 + (RANDOM() * 1500))
                WHEN e.code = 'ECOM001' THEN -(12000 + (RANDOM() * 3000))
                ELSE 0
            END
        ELSE 0
    END as value
FROM entities e
CROSS JOIN accounts a
CROSS JOIN (SELECT generate_series(1, 12) as month) m
WHERE e.type = 'subsidiary' 
  AND a.level = 1
  AND a.nature IN ('revenue', 'deduction', 'cost', 'expense', 'other_revenue', 'other_expense');

-- Inserir dados de orçamento (budget) para 2024
INSERT INTO financial_facts (entity_id, account_id, scenario, year, month, value) 
SELECT 
    entity_id,
    account_id,
    'budget' as scenario,
    year,
    month,
    value * (1.05 + (RANDOM() * 0.1)) -- Orçamento 5-15% maior que o real
FROM financial_facts 
WHERE scenario = 'real' AND year = 2024;

-- Inserir dados de forecast para 2024
INSERT INTO financial_facts (entity_id, account_id, scenario, year, month, value) 
SELECT 
    entity_id,
    account_id,
    'forecast' as scenario,
    year,
    month,
    value * (1.02 + (RANDOM() * 0.06)) -- Forecast 2-8% maior que o real
FROM financial_facts 
WHERE scenario = 'real' AND year = 2024;