import { FinancialFact, Entity, Account } from '../types';

export interface DREMetrics {
  // Receitas
  receitaBruta: number;
  receitaLiquida: number;
  
  // Deduções
  totalDeducoes: number;
  impostos: number;
  taxasCartao: number;
  comissoes: number;
  devolucoes: number;
  
  // Custos
  cogs: number; // Cost of Goods Sold
  
  // Lucros
  lucroBruto: number;
  
  // Despesas Operacionais
  despesasOperacionais: number;
  despesasAdministrativas: number;
  despesasComerciais: number;
  despesasPessoal: number;
  
  // EBITDA
  ebitda: number;
  
  // Despesas Financeiras
  despesasFinanceiras: number;
  
  // Outras Receitas/Despesas
  outrasReceitas: number;
  outrasDespesas: number;
  
  // Lucro Líquido
  lucroLiquido: number;
  
  // Margens (%)
  margemBruta: number;
  margemEbitda: number;
  margemLiquida: number;
  
  // Indicadores de Eficiência (%)
  taxaImpostos: number;
  cogsPercentual: number;
  despesasOperacionaisPercentual: number;
}

export interface DREComparison {
  current: DREMetrics;
  previous: DREMetrics;
  budget?: DREMetrics;
  variance: {
    receitaLiquida: number;
    lucroBruto: number;
    ebitda: number;
    lucroLiquido: number;
    margemBruta: number;
    margemEbitda: number;
    margemLiquida: number;
  };
}

export interface WaterfallData {
  name: string;
  value: number;
  cumulative: number;
  type: 'positive' | 'negative' | 'total';
  category: 'revenue' | 'deduction' | 'cost' | 'expense' | 'result';
}

/**
 * Calcula métricas DRE a partir dos fatos financeiros
 */
export function calculateDREMetrics(
  facts: FinancialFact[],
  accounts: Account[],
  entityId?: string,
  year?: number,
  month?: number
): DREMetrics {
  // Filtrar fatos conforme parâmetros
  let filteredFacts = facts;
  
  if (entityId) {
    filteredFacts = filteredFacts.filter(f => f.entityId === entityId);
  }
  
  if (year) {
    filteredFacts = filteredFacts.filter(f => f.year === year);
  }
  
  if (month) {
    filteredFacts = filteredFacts.filter(f => f.month === month);
  }
  
  // Criar mapa de contas para facilitar lookup
  const accountMap = new Map(accounts.map(acc => [acc.id, acc]));
  
  // Inicializar métricas
  const metrics: DREMetrics = {
    receitaBruta: 0,
    receitaLiquida: 0,
    totalDeducoes: 0,
    impostos: 0,
    taxasCartao: 0,
    comissoes: 0,
    devolucoes: 0,
    cogs: 0,
    lucroBruto: 0,
    despesasOperacionais: 0,
    despesasAdministrativas: 0,
    despesasComerciais: 0,
    despesasPessoal: 0,
    ebitda: 0,
    despesasFinanceiras: 0,
    outrasReceitas: 0,
    outrasDespesas: 0,
    lucroLiquido: 0,
    margemBruta: 0,
    margemEbitda: 0,
    margemLiquida: 0,
    taxaImpostos: 0,
    cogsPercentual: 0,
    despesasOperacionaisPercentual: 0
  };
  
  // Processar cada fato financeiro
  filteredFacts.forEach(fact => {
    const account = accountMap.get(fact.accountId);
    if (!account) return;
    
    const value = fact.value;
    const accountName = account.name.toLowerCase();
    const accountNature = account.nature;
    
    switch (accountNature) {
      case 'revenue':
        metrics.receitaBruta += value;
        break;
        
      case 'deduction':
        const deductionValue = Math.abs(value);
        metrics.totalDeducoes += deductionValue;
        
        if (accountName.includes('imposto') || accountName.includes('icms') || 
            accountName.includes('pis') || accountName.includes('cofins') || 
            accountName.includes('iss')) {
          metrics.impostos += deductionValue;
        } else if (accountName.includes('taxa') || accountName.includes('cartão')) {
          metrics.taxasCartao += deductionValue;
        } else if (accountName.includes('comissão') || accountName.includes('comissao')) {
          metrics.comissoes += deductionValue;
        } else if (accountName.includes('devolução') || accountName.includes('devolucao') || 
                   accountName.includes('cancelamento')) {
          metrics.devolucoes += deductionValue;
        }
        break;
        
      case 'cost':
        metrics.cogs += Math.abs(value);
        break;
        
      case 'expense':
        const expenseValue = Math.abs(value);
        metrics.despesasOperacionais += expenseValue;
        
        if (accountName.includes('administrativ') || accountName.includes('admin')) {
          metrics.despesasAdministrativas += expenseValue;
        } else if (accountName.includes('comercial') || accountName.includes('venda') || 
                   accountName.includes('marketing')) {
          metrics.despesasComerciais += expenseValue;
        } else if (accountName.includes('pessoal') || accountName.includes('salário') || 
                   accountName.includes('salario') || accountName.includes('folha')) {
          metrics.despesasPessoal += expenseValue;
        } else if (accountName.includes('financeira') || accountName.includes('juro')) {
          metrics.despesasFinanceiras += expenseValue;
        }
        break;
        
      case 'other_revenue':
        metrics.outrasReceitas += value;
        break;
        
      case 'other_expense':
        metrics.outrasDespesas += Math.abs(value);
        break;
    }
  });
  
  // Calcular métricas derivadas
  metrics.receitaLiquida = metrics.receitaBruta - metrics.totalDeducoes;
  metrics.lucroBruto = metrics.receitaLiquida - metrics.cogs;
  metrics.ebitda = metrics.lucroBruto - metrics.despesasOperacionais + metrics.outrasReceitas;
  metrics.lucroLiquido = metrics.ebitda - metrics.despesasFinanceiras - metrics.outrasDespesas;
  
  // Calcular margens (evitar divisão por zero)
  if (metrics.receitaLiquida > 0) {
    metrics.margemBruta = (metrics.lucroBruto / metrics.receitaLiquida) * 100;
    metrics.margemEbitda = (metrics.ebitda / metrics.receitaLiquida) * 100;
    metrics.margemLiquida = (metrics.lucroLiquido / metrics.receitaLiquida) * 100;
    metrics.taxaImpostos = (metrics.impostos / metrics.receitaBruta) * 100;
    metrics.cogsPercentual = (metrics.cogs / metrics.receitaLiquida) * 100;
    metrics.despesasOperacionaisPercentual = (metrics.despesasOperacionais / metrics.receitaLiquida) * 100;
  }
  
  return metrics;
}

/**
 * Compara métricas DRE entre períodos
 */
export function compareDREMetrics(
  current: DREMetrics,
  previous: DREMetrics,
  budget?: DREMetrics
): DREComparison {
  const variance = {
    receitaLiquida: previous.receitaLiquida > 0 ? 
      ((current.receitaLiquida - previous.receitaLiquida) / previous.receitaLiquida) * 100 : 0,
    lucroBruto: previous.lucroBruto > 0 ? 
      ((current.lucroBruto - previous.lucroBruto) / previous.lucroBruto) * 100 : 0,
    ebitda: previous.ebitda > 0 ? 
      ((current.ebitda - previous.ebitda) / previous.ebitda) * 100 : 0,
    lucroLiquido: previous.lucroLiquido > 0 ? 
      ((current.lucroLiquido - previous.lucroLiquido) / previous.lucroLiquido) * 100 : 0,
    margemBruta: current.margemBruta - previous.margemBruta,
    margemEbitda: current.margemEbitda - previous.margemEbitda,
    margemLiquida: current.margemLiquida - previous.margemLiquida
  };
  
  return {
    current,
    previous,
    budget,
    variance
  };
}

/**
 * Gera dados para gráfico Waterfall da formação do Lucro Líquido
 */
export function generateWaterfallData(metrics: DREMetrics): WaterfallData[] {
  const data: WaterfallData[] = [];
  let cumulative = 0;
  
  // Receita Bruta
  cumulative += metrics.receitaBruta;
  data.push({
    name: 'Receita Bruta',
    value: metrics.receitaBruta,
    cumulative,
    type: 'positive',
    category: 'revenue'
  });
  
  // Deduções
  cumulative -= metrics.totalDeducoes;
  data.push({
    name: 'Deduções',
    value: -metrics.totalDeducoes,
    cumulative,
    type: 'negative',
    category: 'deduction'
  });
  
  // Receita Líquida
  data.push({
    name: 'Receita Líquida',
    value: metrics.receitaLiquida,
    cumulative,
    type: 'total',
    category: 'result'
  });
  
  // COGS
  cumulative -= metrics.cogs;
  data.push({
    name: 'COGS',
    value: -metrics.cogs,
    cumulative,
    type: 'negative',
    category: 'cost'
  });
  
  // Lucro Bruto
  data.push({
    name: 'Lucro Bruto',
    value: metrics.lucroBruto,
    cumulative,
    type: 'total',
    category: 'result'
  });
  
  // Despesas Operacionais
  cumulative -= metrics.despesasOperacionais;
  data.push({
    name: 'Despesas Operacionais',
    value: -metrics.despesasOperacionais,
    cumulative,
    type: 'negative',
    category: 'expense'
  });
  
  // EBITDA
  data.push({
    name: 'EBITDA',
    value: metrics.ebitda,
    cumulative,
    type: 'total',
    category: 'result'
  });
  
  // Despesas Financeiras
  if (metrics.despesasFinanceiras > 0) {
    cumulative -= metrics.despesasFinanceiras;
    data.push({
      name: 'Despesas Financeiras',
      value: -metrics.despesasFinanceiras,
      cumulative,
      type: 'negative',
      category: 'expense'
    });
  }
  
  // Outras Receitas
  if (metrics.outrasReceitas > 0) {
    cumulative += metrics.outrasReceitas;
    data.push({
      name: 'Outras Receitas',
      value: metrics.outrasReceitas,
      cumulative,
      type: 'positive',
      category: 'revenue'
    });
  }
  
  // Outras Despesas
  if (metrics.outrasDespesas > 0) {
    cumulative -= metrics.outrasDespesas;
    data.push({
      name: 'Outras Despesas',
      value: -metrics.outrasDespesas,
      cumulative,
      type: 'negative',
      category: 'expense'
    });
  }
  
  // Lucro Líquido
  data.push({
    name: 'Lucro Líquido',
    value: metrics.lucroLiquido,
    cumulative,
    type: 'total',
    category: 'result'
  });
  
  return data;
}

/**
 * Gera dados para gráfico Donut de composição de despesas
 */
export function generateExpenseComposition(metrics: DREMetrics): Array<{
  name: string;
  value: number;
  percentage: number;
  color: string;
}> {
  const total = metrics.despesasOperacionais;
  
  if (total === 0) return [];
  
  const data = [
    {
      name: 'Despesas Administrativas',
      value: metrics.despesasAdministrativas,
      percentage: (metrics.despesasAdministrativas / total) * 100,
      color: '#3B82F6'
    },
    {
      name: 'Despesas Comerciais',
      value: metrics.despesasComerciais,
      percentage: (metrics.despesasComerciais / total) * 100,
      color: '#10B981'
    },
    {
      name: 'Despesas com Pessoal',
      value: metrics.despesasPessoal,
      percentage: (metrics.despesasPessoal / total) * 100,
      color: '#F59E0B'
    },
    {
      name: 'Outras Despesas',
      value: total - metrics.despesasAdministrativas - metrics.despesasComerciais - metrics.despesasPessoal,
      percentage: ((total - metrics.despesasAdministrativas - metrics.despesasComerciais - metrics.despesasPessoal) / total) * 100,
      color: '#EF4444'
    }
  ].filter(item => item.value > 0);
  
  return data;
}

/**
 * Gera dados para gráfico Donut de composição de deduções
 */
export function generateDeductionComposition(metrics: DREMetrics): Array<{
  name: string;
  value: number;
  percentage: number;
  color: string;
}> {
  const total = metrics.totalDeducoes;
  
  if (total === 0) return [];
  
  const data = [
    {
      name: 'Impostos',
      value: metrics.impostos,
      percentage: (metrics.impostos / total) * 100,
      color: '#DC2626'
    },
    {
      name: 'Taxas de Cartão',
      value: metrics.taxasCartao,
      percentage: (metrics.taxasCartao / total) * 100,
      color: '#7C3AED'
    },
    {
      name: 'Comissões',
      value: metrics.comissoes,
      percentage: (metrics.comissoes / total) * 100,
      color: '#059669'
    },
    {
      name: 'Devoluções',
      value: metrics.devolucoes,
      percentage: (metrics.devolucoes / total) * 100,
      color: '#D97706'
    }
  ].filter(item => item.value > 0);
  
  return data;
}

/**
 * Calcula tendências mensais
 */
export function calculateMonthlyTrends(
  facts: FinancialFact[],
  accounts: Account[],
  entityId: string,
  year: number
): Array<{
  month: number;
  monthName: string;
  metrics: DREMetrics;
}> {
  const trends = [];
  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];
  
  for (let month = 1; month <= 12; month++) {
    const metrics = calculateDREMetrics(facts, accounts, entityId, year, month);
    trends.push({
      month,
      monthName: monthNames[month - 1],
      metrics
    });
  }
  
  return trends;
}