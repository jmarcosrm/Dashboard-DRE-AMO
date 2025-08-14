import { Entity, Account, FinancialFact, User, Scenario, ScenarioType } from '../types';

// Entidades mock - Empresas modernas
export const mockEntities: Entity[] = [
  {
    id: 'entity-1',
    name: 'Milk Moo Ltda',
    code: 'MILK001',
    cnpj: '15.789.456/0001-23',
    isActive: true,
    createdAt: '2019-03-15T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'entity-2',
    name: 'Pass+Demo Tecnologia',
    code: 'PASS001',
    cnpj: '28.456.123/0001-87',
    isActive: true,
    createdAt: '2020-08-10T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'entity-3',
    name: 'E-commerce Solutions',
    code: 'ECOM001',
    cnpj: '34.567.890/0001-45',
    isActive: true,
    createdAt: '2021-01-20T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'entity-4',
    name: 'Milk Moo Franchise SP',
    code: 'MILK002',
    cnpj: '15.789.456/0002-04',
    isActive: true,
    createdAt: '2022-06-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// Cenários mock
export const mockScenarios: Scenario[] = [
  { id: 'real' as ScenarioType, name: 'Real', description: 'Dados realizados' },
  { id: 'budget' as ScenarioType, name: 'Orçado', description: 'Dados orçamentários' },
  { id: 'forecast' as ScenarioType, name: 'Forecast', description: 'Projeções atualizadas' }
];

// Contas mock (Plano de Contas DRE)
export const mockAccounts: Account[] = [
  // RECEITAS
  {
    id: 'acc-1000',
    code: '3.1.1.001',
    name: 'Receita Bruta de Vendas',
    nature: 'revenue',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-1001',
    code: '3.1.1.002',
    name: 'Receita de Serviços',
    nature: 'revenue',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-1100',
    code: '3.1.2.001',
    name: 'Deduções de Vendas',
    nature: 'deduction',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-1101',
    code: '3.1.2.002',
    name: 'Impostos sobre Vendas',
    nature: 'deduction',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-1102',
    code: '3.1.2.003',
    name: 'Devoluções e Cancelamentos',
    nature: 'deduction',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // CUSTOS
  {
    id: 'acc-2000',
    code: '4.1.1.001',
    name: 'Custo dos Produtos Vendidos',
    nature: 'cost',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-2001',
    code: '4.1.1.002',
    name: 'Custo dos Serviços Prestados',
    nature: 'cost',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // DESPESAS OPERACIONAIS
  {
    id: 'acc-3000',
    code: '4.2.1.001',
    name: 'Despesas Comerciais',
    nature: 'expense',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-3001',
    code: '4.2.1.002',
    name: 'Despesas Administrativas',
    nature: 'expense',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-3002',
    code: '4.2.1.003',
    name: 'Despesas com Pessoal',
    nature: 'expense',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-3003',
    code: '4.2.1.004',
    name: 'Despesas Gerais',
    nature: 'expense',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  
  // OUTRAS RECEITAS/DESPESAS
  {
    id: 'acc-4000',
    code: '4.3.1.001',
    name: 'Receitas Financeiras',
    nature: 'other_revenue',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'acc-4001',
    code: '4.3.2.001',
    name: 'Despesas Financeiras',
    nature: 'other_expense',
    level: 4,
    parentId: null,
    isActive: true,
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z'
  }
];

// Função para gerar fatos financeiros mock
export function generateFinancialFacts(): FinancialFact[] {
  const facts: FinancialFact[] = [];
  const months = [
    '2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06',
    '2024-07', '2024-08', '2024-09', '2024-10', '2024-11', '2024-12'
  ];
  
  // Multiplicadores por entidade baseados no segmento de negócio
  const entityMultipliers: Record<string, number> = {
    'entity-1': 1.0,    // Milk Moo Ltda - Laticínios (base)
    'entity-2': 1.8,    // Pass+Demo - SaaS/Tech (maior margem)
    'entity-3': 2.2,    // E-commerce - Alto volume
    'entity-4': 0.4     // Milk Moo Franchise - Menor porte
  };
  
  // Valores base por conta adaptados para os segmentos (em milhares de reais)
  const getBaseValues = (entityId: string): Record<string, number> => {
    // Milk Moo (Laticínios) - Margens menores, volume médio
    if (entityId === 'entity-1' || entityId === 'entity-4') {
      return {
        'acc-1000': 35000,  // Receita Bruta de Vendas
        'acc-1001': 8000,   // Receita de Serviços
        'acc-1100': -2100,  // Deduções de Vendas
        'acc-1101': -5600,  // Impostos sobre Vendas
        'acc-1102': -700,   // Devoluções
        'acc-2000': -18000, // CPV (alto para laticínios)
        'acc-2001': -3200,  // CSP
        'acc-3000': -4500,  // Despesas Comerciais
        'acc-3001': -3500,  // Despesas Administrativas
        'acc-3002': -6000,  // Despesas com Pessoal
        'acc-3003': -2000,  // Despesas Gerais
        'acc-4000': 300,    // Receitas Financeiras
        'acc-4001': -600    // Despesas Financeiras
      };
    }
    // Pass+Demo (SaaS/Tech) - Margens altas, baixo CPV
    else if (entityId === 'entity-2') {
      return {
        'acc-1000': 25000,  // Receita Bruta de Vendas
        'acc-1001': 35000,  // Receita de Serviços (principal)
        'acc-1100': -1800,  // Deduções de Vendas
        'acc-1101': -9600,  // Impostos sobre Vendas
        'acc-1102': -300,   // Devoluções
        'acc-2000': -3000,  // CPV (baixo para SaaS)
        'acc-2001': -8000,  // CSP (desenvolvimento)
        'acc-3000': -12000, // Despesas Comerciais (marketing digital)
        'acc-3001': -8000,  // Despesas Administrativas
        'acc-3002': -18000, // Despesas com Pessoal (tech)
        'acc-3003': -4000,  // Despesas Gerais
        'acc-4000': 800,    // Receitas Financeiras
        'acc-4001': -400    // Despesas Financeiras
      };
    }
    // E-commerce - Alto volume, margens médias
    else {
      return {
        'acc-1000': 80000,  // Receita Bruta de Vendas
        'acc-1001': 12000,  // Receita de Serviços
        'acc-1100': -4800,  // Deduções de Vendas
        'acc-1101': -14720, // Impostos sobre Vendas
        'acc-1102': -2400,  // Devoluções (alto no e-commerce)
        'acc-2000': -48000, // CPV (produtos)
        'acc-2001': -4800,  // CSP
        'acc-3000': -16000, // Despesas Comerciais (marketing)
        'acc-3001': -6000,  // Despesas Administrativas
        'acc-3002': -8000,  // Despesas com Pessoal
        'acc-3003': -5000,  // Despesas Gerais (logística)
        'acc-4000': 600,    // Receitas Financeiras
        'acc-4001': -1200   // Despesas Financeiras
      };
    }
  };
  
  let factId = 1;
  
  // Gerar fatos para cada entidade, conta, cenário e mês
  mockEntities.forEach(entity => {
    mockAccounts.forEach(account => {
      mockScenarios.forEach(scenario => {
        months.forEach((month, monthIndex) => {
          const baseValues = getBaseValues(entity.id);
          const baseValue = baseValues[account.id] || 0;
          const entityMultiplier = entityMultipliers[entity.id] || 1;
          
          // Variação sazonal específica por segmento
          let seasonalFactor = 1;
          if (entity.id === 'entity-1' || entity.id === 'entity-4') {
            // Milk Moo - sazonalidade de laticínios (verão menor)
            seasonalFactor = monthIndex < 6 ? 1.1 - (monthIndex * 0.02) : 0.9 + (monthIndex * 0.02);
          } else if (entity.id === 'entity-2') {
            // Pass+Demo - crescimento constante SaaS
            seasonalFactor = 1 + (monthIndex * 0.03);
          } else {
            // E-commerce - picos em datas comemorativas
            const peaks = [4, 5, 10, 11]; // Maio, Junho, Novembro, Dezembro
            seasonalFactor = peaks.includes(monthIndex) ? 1.3 : 1 + (monthIndex * 0.02);
          }
          
          // Variação por cenário
          let scenarioFactor = 1;
          if (scenario.id === 'budget') {
            scenarioFactor = 1.08; // Orçado 8% maior
          } else if (scenario.id === 'forecast') {
            scenarioFactor = 1.04; // Forecast 4% maior
          }
          
          // Adicionar variação realista
          const randomFactor = 0.92 + (Math.random() * 0.16);
          
          const finalValue = Math.round(
            baseValue * entityMultiplier * seasonalFactor * scenarioFactor * randomFactor
          );
          
          facts.push({
            id: `fact-${factId++}`,
            entityId: entity.id,
            accountId: account.id,
            scenarioId: scenario.id,
            year: 2024,
            month: monthIndex + 1,
            value: finalValue,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z'
          });
        });
      });
    });
  });
  
  return facts;
}

// Fatos financeiros mock
export const mockFinancialFacts = generateFinancialFacts();

// Usuário mock
export const mockUser: User = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao.silva@empresa.com',
  role: 'admin',
  preferences: {
    theme: 'light',
    language: 'pt-BR',
    currency: 'BRL',
    numberFormat: 'full',
    notifications: {
      email: true,
      push: true,
      alerts: true
    }
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z'
};

// Função para obter dados agregados por período
export function getAggregatedData(entityIds: string[], scenarioId: string, startPeriod: string, endPeriod: string) {
  return mockFinancialFacts.filter(fact => {
    const factPeriod = `${fact.year}-${fact.month.toString().padStart(2, '0')}`;
    return entityIds.includes(fact.entityId) &&
      fact.scenarioId === scenarioId &&
      factPeriod >= startPeriod &&
      factPeriod <= endPeriod;
  });
}

// Função para obter dados de comparação
export function getComparisonData(entityIds: string[], scenarios: string[], period: string) {
  const [year, month] = period.split('-').map(Number);
  return mockFinancialFacts.filter(fact => 
    entityIds.includes(fact.entityId) &&
    scenarios.includes(fact.scenarioId) &&
    fact.year === year &&
    fact.month === month
  );
}

// Função para obter dados de série temporal
export function getTimeSeriesData(entityIds: string[], scenarioId: string, accountIds: string[], periods: string[]) {
  return mockFinancialFacts.filter(fact => {
    const factPeriod = `${fact.year}-${fact.month.toString().padStart(2, '0')}`;
    return entityIds.includes(fact.entityId) &&
      fact.scenarioId === scenarioId &&
      accountIds.includes(fact.accountId) &&
      periods.includes(factPeriod);
  });
}

// Dados para gráficos específicos
export const mockKPIData = {
  receita: {
    id: 'kpi-receita',
    title: 'Receita Total',
    value: 65000000,
    previousValue: 58000000,
    target: 70000000,
    format: 'currency' as const,
    trend: 'up' as const,
    sparklineData: [52000, 55000, 58000, 62000, 65000],
    icon: 'TrendingUp',
    color: '#0ea5e9'
  },
  lucro: {
    id: 'kpi-lucro',
    title: 'Lucro Líquido',
    value: 8500000,
    previousValue: 7200000,
    target: 9000000,
    format: 'currency' as const,
    trend: 'up' as const,
    sparklineData: [6800, 7100, 7200, 7800, 8500],
    icon: 'DollarSign',
    color: '#10b981'
  },
  margem: {
    id: 'kpi-margem',
    title: 'Margem Líquida',
    value: 13.1,
    previousValue: 12.4,
    target: 12.9,
    format: 'percentage' as const,
    trend: 'up' as const,
    sparklineData: [13.1, 12.9, 12.4, 12.6, 13.1],
    icon: 'Percent',
    color: '#f59e0b'
  },
  ebitda: {
    id: 'kpi-ebitda',
    title: 'EBITDA',
    value: 12500000,
    previousValue: 11200000,
    target: 13000000,
    format: 'currency' as const,
    trend: 'up' as const,
    sparklineData: [10800, 11000, 11200, 11800, 12500],
    icon: 'BarChart3',
    color: '#8b5cf6'
  }
};

export const mockWaterfallData = [
  { name: 'Receita Bruta', value: 65000000, cumulative: 65000000, type: 'positive' as const },
  { name: 'Deduções', value: -12000000, cumulative: 53000000, type: 'negative' as const },
  { name: 'Receita Líquida', value: 53000000, cumulative: 53000000, type: 'total' as const },
  { name: 'CPV/CSP', value: -26000000, cumulative: 27000000, type: 'negative' as const },
  { name: 'Lucro Bruto', value: 27000000, cumulative: 27000000, type: 'total' as const },
  { name: 'Despesas Operacionais', value: -18500000, cumulative: 8500000, type: 'negative' as const },
  { name: 'EBITDA', value: 8500000, cumulative: 8500000, type: 'total' as const }
];

export const mockDonutData = [
  { name: 'Receita de Produtos', value: 50000000, color: '#0ea5e9' },
  { name: 'Receita de Serviços', value: 15000000, color: '#3b82f6' },
  { name: 'Outras Receitas', value: 500000, color: '#6366f1' }
];

export const mockAreaChartData = [
  { period: 'Jan', value: 4800000, real: 4800000, budget: 5200000, forecast: 5000000 },
  { period: 'Fev', value: 5100000, real: 5100000, budget: 5400000, forecast: 5200000 },
  { period: 'Mar', value: 5300000, real: 5300000, budget: 5600000, forecast: 5400000 },
  { period: 'Abr', value: 5600000, real: 5600000, budget: 5800000, forecast: 5700000 },
  { period: 'Mai', value: 5800000, real: 5800000, budget: 6000000, forecast: 5900000 },
  { period: 'Jun', value: 6000000, real: 6000000, budget: 6200000, forecast: 6100000 }
];
