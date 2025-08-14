import { useMemo } from 'react';
import { useDashboardStore } from '../store/dashboard-store';
import { calculateDREMetrics, compareDREMetrics, DREMetrics, DREComparison } from '../utils/dre-calculator';
import { KPIData } from '../types';
import { formatCurrency, formatPercentage } from '../utils/formatters';

export interface DREKPIs {
  receitaLiquida: KPIData;
  lucroBruto: KPIData;
  ebitda: KPIData;
  lucroLiquido: KPIData;
  margemBruta: KPIData;
  margemEbitda: KPIData;
  margemLiquida: KPIData;
  cogsPercentual: KPIData;
  despesasOperacionaisPercentual: KPIData;
  taxaImpostos: KPIData;
}

export function useDREKPIs(entityId?: string, year?: number, month?: number): {
  kpis: DREKPIs;
  metrics: DREMetrics;
  comparison: DREComparison | null;
  isLoading: boolean;
  error: string | null;
} {
  const { financialFacts, accounts, isLoading, error } = useDashboardStore();
  
  const result = useMemo(() => {
    if (!financialFacts.length || !accounts.length) {
      return {
        kpis: createEmptyKPIs(),
        metrics: createEmptyMetrics(),
        comparison: null
      };
    }
    
    // Calcular métricas do período atual
    const currentMetrics = calculateDREMetrics(
      financialFacts,
      accounts,
      entityId,
      year,
      month
    );
    
    // Calcular métricas do período anterior para comparação
    let previousMetrics: DREMetrics | null = null;
    let comparison: DREComparison | null = null;
    
    if (year && month) {
      const prevMonth = month === 1 ? 12 : month - 1;
      const prevYear = month === 1 ? year - 1 : year;
      
      previousMetrics = calculateDREMetrics(
        financialFacts,
        accounts,
        entityId,
        prevYear,
        prevMonth
      );
      
      comparison = compareDREMetrics(currentMetrics, previousMetrics);
    }
    
    // Gerar dados de sparkline (últimos 12 meses)
    const sparklineData = generateSparklineData(
      financialFacts,
      accounts,
      entityId,
      year || new Date().getFullYear()
    );
    
    // Criar KPIs
    const kpis: DREKPIs = {
      receitaLiquida: {
        id: 'receita-liquida',
        title: 'Receita Líquida',
        value: currentMetrics.receitaLiquida,
        previousValue: previousMetrics?.receitaLiquida,
        format: 'currency',
        trend: getTrend(currentMetrics.receitaLiquida, previousMetrics?.receitaLiquida),
        sparklineData: sparklineData.receitaLiquida,
        color: '#3B82F6'
      },
      
      lucroBruto: {
        id: 'lucro-bruto',
        title: 'Lucro Bruto',
        value: currentMetrics.lucroBruto,
        previousValue: previousMetrics?.lucroBruto,
        format: 'currency',
        trend: getTrend(currentMetrics.lucroBruto, previousMetrics?.lucroBruto),
        sparklineData: sparklineData.lucroBruto,
        color: '#10B981'
      },
      
      ebitda: {
        id: 'ebitda',
        title: 'EBITDA',
        value: currentMetrics.ebitda,
        previousValue: previousMetrics?.ebitda,
        format: 'currency',
        trend: getTrend(currentMetrics.ebitda, previousMetrics?.ebitda),
        sparklineData: sparklineData.ebitda,
        color: '#F59E0B'
      },
      
      lucroLiquido: {
        id: 'lucro-liquido',
        title: 'Lucro Líquido',
        value: currentMetrics.lucroLiquido,
        previousValue: previousMetrics?.lucroLiquido,
        format: 'currency',
        trend: getTrend(currentMetrics.lucroLiquido, previousMetrics?.lucroLiquido),
        sparklineData: sparklineData.lucroLiquido,
        color: '#8B5CF6'
      },
      
      margemBruta: {
        id: 'margem-bruta',
        title: 'Margem Bruta',
        value: currentMetrics.margemBruta,
        previousValue: previousMetrics?.margemBruta,
        format: 'percentage',
        trend: getTrend(currentMetrics.margemBruta, previousMetrics?.margemBruta),
        sparklineData: sparklineData.margemBruta,
        color: '#06B6D4'
      },
      
      margemEbitda: {
        id: 'margem-ebitda',
        title: 'Margem EBITDA',
        value: currentMetrics.margemEbitda,
        previousValue: previousMetrics?.margemEbitda,
        format: 'percentage',
        trend: getTrend(currentMetrics.margemEbitda, previousMetrics?.margemEbitda),
        sparklineData: sparklineData.margemEbitda,
        color: '#84CC16'
      },
      
      margemLiquida: {
        id: 'margem-liquida',
        title: 'Margem Líquida',
        value: currentMetrics.margemLiquida,
        previousValue: previousMetrics?.margemLiquida,
        format: 'percentage',
        trend: getTrend(currentMetrics.margemLiquida, previousMetrics?.margemLiquida),
        sparklineData: sparklineData.margemLiquida,
        color: '#EF4444'
      },
      
      cogsPercentual: {
        id: 'cogs-percentual',
        title: 'COGS % Receita',
        value: currentMetrics.cogsPercentual,
        previousValue: previousMetrics?.cogsPercentual,
        format: 'percentage',
        trend: getTrend(currentMetrics.cogsPercentual, previousMetrics?.cogsPercentual, true), // Invertido: menor é melhor
        sparklineData: sparklineData.cogsPercentual,
        color: '#F97316'
      },
      
      despesasOperacionaisPercentual: {
        id: 'despesas-operacionais-percentual',
        title: 'Despesas Op. % Receita',
        value: currentMetrics.despesasOperacionaisPercentual,
        previousValue: previousMetrics?.despesasOperacionaisPercentual,
        format: 'percentage',
        trend: getTrend(currentMetrics.despesasOperacionaisPercentual, previousMetrics?.despesasOperacionaisPercentual, true),
        sparklineData: sparklineData.despesasOperacionaisPercentual,
        color: '#EC4899'
      },
      
      taxaImpostos: {
        id: 'taxa-impostos',
        title: 'Taxa de Impostos',
        value: currentMetrics.taxaImpostos,
        previousValue: previousMetrics?.taxaImpostos,
        format: 'percentage',
        trend: getTrend(currentMetrics.taxaImpostos, previousMetrics?.taxaImpostos, true),
        sparklineData: sparklineData.taxaImpostos,
        color: '#6366F1'
      }
    };
    
    return {
      kpis,
      metrics: currentMetrics,
      comparison
    };
  }, [financialFacts, accounts, entityId, year, month]);
  
  return {
    ...result,
    isLoading,
    error
  };
}

function getTrend(current: number, previous?: number, inverted = false): 'up' | 'down' | 'stable' {
  if (!previous || previous === 0) return 'stable';
  
  const diff = current - previous;
  
  if (Math.abs(diff) < 0.01) return 'stable';
  
  if (inverted) {
    return diff > 0 ? 'down' : 'up';
  }
  
  return diff > 0 ? 'up' : 'down';
}

function generateSparklineData(
  facts: any[],
  accounts: any[],
  entityId?: string,
  year?: number
): Record<string, number[]> {
  const data: Record<string, number[]> = {
    receitaLiquida: [],
    lucroBruto: [],
    ebitda: [],
    lucroLiquido: [],
    margemBruta: [],
    margemEbitda: [],
    margemLiquida: [],
    cogsPercentual: [],
    despesasOperacionaisPercentual: [],
    taxaImpostos: []
  };
  
  if (!year) return data;
  
  // Gerar dados dos últimos 12 meses
  for (let month = 1; month <= 12; month++) {
    const metrics = calculateDREMetrics(facts, accounts, entityId, year, month);
    
    data.receitaLiquida.push(metrics.receitaLiquida);
    data.lucroBruto.push(metrics.lucroBruto);
    data.ebitda.push(metrics.ebitda);
    data.lucroLiquido.push(metrics.lucroLiquido);
    data.margemBruta.push(metrics.margemBruta);
    data.margemEbitda.push(metrics.margemEbitda);
    data.margemLiquida.push(metrics.margemLiquida);
    data.cogsPercentual.push(metrics.cogsPercentual);
    data.despesasOperacionaisPercentual.push(metrics.despesasOperacionaisPercentual);
    data.taxaImpostos.push(metrics.taxaImpostos);
  }
  
  return data;
}

function createEmptyKPIs(): DREKPIs {
  const emptyKPI = (id: string, title: string, format: 'currency' | 'percentage' = 'currency'): KPIData => ({
    id,
    title,
    value: 0,
    format,
    trend: 'stable'
  });
  
  return {
    receitaLiquida: emptyKPI('receita-liquida', 'Receita Líquida'),
    lucroBruto: emptyKPI('lucro-bruto', 'Lucro Bruto'),
    ebitda: emptyKPI('ebitda', 'EBITDA'),
    lucroLiquido: emptyKPI('lucro-liquido', 'Lucro Líquido'),
    margemBruta: emptyKPI('margem-bruta', 'Margem Bruta', 'percentage'),
    margemEbitda: emptyKPI('margem-ebitda', 'Margem EBITDA', 'percentage'),
    margemLiquida: emptyKPI('margem-liquida', 'Margem Líquida', 'percentage'),
    cogsPercentual: emptyKPI('cogs-percentual', 'COGS % Receita', 'percentage'),
    despesasOperacionaisPercentual: emptyKPI('despesas-operacionais-percentual', 'Despesas Op. % Receita', 'percentage'),
    taxaImpostos: emptyKPI('taxa-impostos', 'Taxa de Impostos', 'percentage')
  };
}

function createEmptyMetrics(): DREMetrics {
  return {
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
}