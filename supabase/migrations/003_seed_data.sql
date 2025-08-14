-- Insert sample entities
INSERT INTO entities (id, name, code, cnpj, address, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Milk Moo Ltda', 'MILK001', '12.345.678/0001-90', 'Rua das Vacas, 123 - São Paulo, SP', true),
('550e8400-e29b-41d4-a716-446655440002', 'Pass+Demo Tecnologia', 'PASS001', '98.765.432/0001-10', 'Av. Inovação, 456 - Rio de Janeiro, RJ', true),
('550e8400-e29b-41d4-a716-446655440003', 'E-commerce Solutions', 'ECOM001', '11.222.333/0001-44', 'Rua do Comércio, 789 - Belo Horizonte, MG', true);

-- Insert sample accounts (Plano de Contas)
INSERT INTO accounts (id, code, name, nature, level, description, is_active) VALUES
-- Receitas
('660e8400-e29b-41d4-a716-446655440001', '3.1.01', 'Receita Bruta de Vendas', 'revenue', 4, 'Receita total de vendas de produtos/serviços', true),
('660e8400-e29b-41d4-a716-446655440002', '3.1.02', 'Receita de Serviços', 'revenue', 4, 'Receita proveniente de prestação de serviços', true),

-- Deduções
('660e8400-e29b-41d4-a716-446655440003', '3.2.01', 'Impostos sobre Vendas', 'deduction', 4, 'ICMS, PIS, COFINS, ISS', true),
('660e8400-e29b-41d4-a716-446655440004', '3.2.02', 'Devoluções e Cancelamentos', 'deduction', 4, 'Devoluções de mercadorias e cancelamentos', true),
('660e8400-e29b-41d4-a716-446655440005', '3.2.03', 'Descontos Concedidos', 'deduction', 4, 'Descontos comerciais e financeiros', true),

-- Custos
('660e8400-e29b-41d4-a716-446655440006', '4.1.01', 'Custo dos Produtos Vendidos', 'cost', 4, 'Custo direto dos produtos comercializados', true),
('660e8400-e29b-41d4-a716-446655440007', '4.1.02', 'Custo dos Serviços Prestados', 'cost', 4, 'Custo direto dos serviços prestados', true),

-- Despesas Operacionais
('660e8400-e29b-41d4-a716-446655440008', '4.2.01', 'Despesas com Pessoal', 'expense', 4, 'Salários, encargos e benefícios', true),
('660e8400-e29b-41d4-a716-446655440009', '4.2.02', 'Despesas Administrativas', 'expense', 4, 'Despesas gerais de administração', true),
('660e8400-e29b-41d4-a716-446655440010', '4.2.03', 'Despesas Comerciais', 'expense', 4, 'Marketing, vendas e comissões', true),
('660e8400-e29b-41d4-a716-446655440011', '4.2.04', 'Despesas Financeiras', 'expense', 4, 'Juros, taxas e despesas bancárias', true),

-- Outras Receitas
('660e8400-e29b-41d4-a716-446655440012', '3.3.01', 'Receitas Financeiras', 'other_revenue', 4, 'Rendimentos de aplicações financeiras', true),
('660e8400-e29b-41d4-a716-446655440013', '3.3.02', 'Outras Receitas Operacionais', 'other_revenue', 4, 'Receitas diversas operacionais', true),

-- Outras Despesas
('660e8400-e29b-41d4-a716-446655440014', '4.3.01', 'Outras Despesas Operacionais', 'other_expense', 4, 'Despesas diversas operacionais', true),
('660e8400-e29b-41d4-a716-446655440015', '4.3.02', 'Despesas Não Operacionais', 'other_expense', 4, 'Despesas não relacionadas à atividade principal', true);

-- Insert sample financial facts for 2024
INSERT INTO financial_facts (entity_id, account_id, scenario_id, year, month, value, description) VALUES
-- Milk Moo - Janeiro 2024
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'real', 2024, 1, 850000.00, 'Vendas de produtos lácteos'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440003', 'real', 2024, 1, -127500.00, 'ICMS, PIS, COFINS'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440006', 'real', 2024, 1, -425000.00, 'Custo dos produtos'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440008', 'real', 2024, 1, -85000.00, 'Folha de pagamento'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440009', 'real', 2024, 1, -42500.00, 'Despesas administrativas'),
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440010', 'real', 2024, 1, -25500.00, 'Marketing e vendas'),

-- Pass+Demo - Janeiro 2024
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'real', 2024, 1, 320000.00, 'Serviços de tecnologia'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', 'real', 2024, 1, -16000.00, 'ISS e outros impostos'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440007', 'real', 2024, 1, -128000.00, 'Custo dos serviços'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440008', 'real', 2024, 1, -96000.00, 'Folha de pagamento'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440009', 'real', 2024, 1, -32000.00, 'Despesas administrativas'),

-- E-commerce - Janeiro 2024
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'real', 2024, 1, 1200000.00, 'Vendas online'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'real', 2024, 1, -180000.00, 'Impostos sobre vendas'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'real', 2024, 1, -24000.00, 'Devoluções'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440006', 'real', 2024, 1, -720000.00, 'Custo dos produtos'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440008', 'real', 2024, 1, -120000.00, 'Folha de pagamento'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440010', 'real', 2024, 1, -60000.00, 'Marketing digital'),

-- Budget data for comparison
('550e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'budget', 2024, 1, 800000.00, 'Orçamento vendas'),
('550e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'budget', 2024, 1, 300000.00, 'Orçamento serviços'),
('550e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', 'budget', 2024, 1, 1100000.00, 'Orçamento vendas online');

-- Insert sample users
INSERT INTO users (id, email, name, role, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'admin@milkmoo.com', 'João Silva', 'admin', true),
('770e8400-e29b-41d4-a716-446655440002', 'user@passdemo.com', 'Maria Santos', 'user', true),
('770e8400-e29b-41d4-a716-446655440003', 'viewer@ecommerce.com', 'Pedro Costa', 'viewer', true);