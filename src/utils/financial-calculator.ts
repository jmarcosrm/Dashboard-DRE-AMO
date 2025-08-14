import type { FinancialFact, Account, ComparisonData, TimeSeriesDataPoint, ScenarioType } from '../types';

/**
 * Calculadora Financeira para análises de DRE
 */
export class FinancialCalculator {
  /**
   * Calcula métrica com comparação temporal
   */
  static calculateMetricWithComparison(
    currentValue: number,
    previousValue: number
  ): ComparisonData {
    const variance = currentValue - previousValue;
    const variancePercent = previousValue !== 0 ? (variance / Math.abs(previousValue)) * 100 : 0;
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(variancePercent) > 0.1) {
      trend = variance > 0 ? 'up' : 'down';
    }

    return {
      current: currentValue,
      previous: previousValue,
      variance,
      variancePercent,
      trend,
    };
  }

  /**
   * Calcula margem percentual
   */
  static calculateMargin(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return (numerator / denominator) * 100;
  }

  /**
   * Calcula taxa de crescimento
   */
  static calculateGrowthRate(currentValue: number, previousValue: number): number {
    if (previousValue === 0) return 0;
    return ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
  }

  /**
   * Calcula variância entre valores
   */
  static calculateVariance(actual: number, target: number): {
    absolute: number;
    percentage: number;
    favorable: boolean;
  } {
    const absolute = actual - target;
    const percentage = target !== 0 ? (absolute / Math.abs(target)) * 100 : 0;
    const favorable = absolute >= 0;

    return {
      absolute,
      percentage,
      favorable,
    };
  }

  /**
   * Calcula EBITDA baseado nos fatos financeiros
   */
  static calculateEBITDA(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): number {
    const relevantFacts = facts.filter(
      f => f.entityId === entityId && f.scenarioId === scenario && 
          `${f.year}-${f.month.toString().padStart(2, '0')}` === period
    );

    let revenue = 0;
    let deductions = 0;
    let cogs = 0;
    let expenses = 0;

    relevantFacts.forEach(fact => {
      const account = accounts.find(a => a.id === fact.accountId);
      if (!account) return;

      switch (account.nature) {
        case 'revenue':
          revenue += fact.value;
          break;
        case 'deduction':
          deductions += Math.abs(fact.value);
          break;
        case 'cost':
          cogs += Math.abs(fact.value);
          break;
        case 'expense':
          expenses += Math.abs(fact.value);
          break;
      }
    });

    return revenue - deductions - cogs - expenses;
  }

  /**
   * Calcula receita líquida
   */
  static calculateNetRevenue(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): number {
    const relevantFacts = facts.filter(
      f => f.entityId === entityId && f.scenarioId === scenario && 
          `${f.year}-${f.month.toString().padStart(2, '0')}` === period
    );

    let revenue = 0;
    let deductions = 0;

    relevantFacts.forEach(fact => {
      const account = accounts.find(a => a.id === fact.accountId);
      if (!account) return;

      if (account.nature === 'revenue') {
        revenue += fact.value;
      } else if (account.nature === 'deduction') {
        deductions += Math.abs(fact.value);
      }
    });

    return revenue - deductions;
  }

  /**
   * Calcula lucro bruto
   */
  static calculateGrossProfit(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): number {
    const netRevenue = this.calculateNetRevenue(facts, accounts, entityId, scenario, period);
    
    const relevantFacts = facts.filter(
      f => f.entityId === entityId && f.scenarioId === scenario && 
          `${f.year}-${f.month.toString().padStart(2, '0')}` === period
    );

    let cogs = 0;
    relevantFacts.forEach(fact => {
      const account = accounts.find(a => a.id === fact.accountId);
      if (account?.nature === 'cost') {
        cogs += Math.abs(fact.value);
      }
    });

    return netRevenue - cogs;
  }

  /**
   * Calcula margem bruta
   */
  static calculateGrossMargin(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): number {
    const grossProfit = this.calculateGrossProfit(facts, accounts, entityId, scenario, period);
    const netRevenue = this.calculateNetRevenue(facts, accounts, entityId, scenario, period);
    
    return this.calculateMargin(grossProfit, netRevenue);
  }

  /**
   * Calcula margem EBITDA
   */
  static calculateEBITDAMargin(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): number {
    const ebitda = this.calculateEBITDA(facts, accounts, entityId, scenario, period);
    const netRevenue = this.calculateNetRevenue(facts, accounts, entityId, scenario, period);
    
    return this.calculateMargin(ebitda, netRevenue);
  }

  /**
   * Calcula dados para gráfico waterfall
   */
  static calculateWaterfallData(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): Array<{
    name: string;
    value: number;
    cumulative: number;
    type: 'positive' | 'negative' | 'total';
  }> {
    const relevantFacts = facts.filter(
      f => f.entityId === entityId && f.scenarioId === scenario && 
          `${f.year}-${f.month.toString().padStart(2, '0')}` === period
    );

    const sortedAccounts = accounts
      .filter(a => relevantFacts.some(f => f.accountId === a.id))
      .sort((a, b) => a.code.localeCompare(b.code));

    const waterfallData: Array<{
      name: string;
      value: number;
      cumulative: number;
      type: 'positive' | 'negative' | 'total';
    }> = [];

    let cumulative = 0;

    sortedAccounts.forEach(account => {
      const fact = relevantFacts.find(f => f.accountId === account.id);
      if (!fact) return;

      let value = fact.value;
      
      // Ajustar sinal baseado na natureza da conta
      if (['deduction', 'cost', 'expense'].includes(account.nature)) {
        value = -Math.abs(value);
      }

      cumulative += value;

      waterfallData.push({
        name: account.name,
        value,
        cumulative,
        type: value >= 0 ? 'positive' : 'negative',
      });
    });

    return waterfallData;
  }

  /**
   * Calcula série temporal para gráficos de tendência
   */
  static calculateTimeSeries(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    accountId: string,
    periods: string[]
  ): TimeSeriesDataPoint[] {
    return periods.map(period => {
      const fact = facts.find(
        f => f.entityId === entityId && 
             f.scenarioId === scenario && 
             `${f.year}-${f.month.toString().padStart(2, '0')}` === period && 
             f.accountId === accountId
      );

      return {
        period,
        value: fact?.value || 0,
        scenario: scenario as ScenarioType,
        entity: entityId,
      };
    });
  }

  /**
   * Calcula dados agregados por natureza de conta
   */
  static calculateAggregatedByNature(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string
  ): Record<string, number> {
    const relevantFacts = facts.filter(
      f => f.entityId === entityId && f.scenarioId === scenario && 
          `${f.year}-${f.month.toString().padStart(2, '0')}` === period
    );

    const aggregated: Record<string, number> = {
      revenue: 0,
      deduction: 0,
      cost: 0,
      expense: 0,
      other_revenue: 0,
      other_expense: 0,
    };

    relevantFacts.forEach(fact => {
      const account = accounts.find(a => a.id === fact.accountId);
      if (account) {
        aggregated[account.nature] += fact.value;
      }
    });

    return aggregated;
  }

  /**
   * Calcula projeção simples baseada em tendência linear
   */
  static calculateLinearProjection(
    historicalData: TimeSeriesDataPoint[],
    periodsToProject: number
  ): TimeSeriesDataPoint[] {
    if (historicalData.length < 2) return [];

    // Calcular tendência linear simples
    const values = historicalData.map(d => d.value);
    const n = values.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = values.reduce((sum, val, index) => sum + val * index, 0);
    const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    const projections: TimeSeriesDataPoint[] = [];
    const lastPeriod = historicalData[historicalData.length - 1].period;
    const [year, month] = lastPeriod.split('-').map(Number);

    for (let i = 1; i <= periodsToProject; i++) {
      const projectedValue = intercept + slope * (n + i - 1);
      const newMonth = month + i;
      const newYear = year + Math.floor((newMonth - 1) / 12);
      const adjustedMonth = ((newMonth - 1) % 12) + 1;
      
      const period = `${newYear}-${adjustedMonth.toString().padStart(2, '0')}`;
      
      projections.push({
        period,
        value: Math.max(0, projectedValue), // Evitar valores negativos em projeções
        scenario: 'forecast',
      });
    }

    return projections;
  }

  /**
   * Calcula indicadores de performance (KPIs)
   */
  static calculateKPIs(
    facts: FinancialFact[],
    accounts: Account[],
    entityId: string,
    scenario: string,
    period: string,
    previousPeriod?: string
  ) {
    const netRevenue = this.calculateNetRevenue(facts, accounts, entityId, scenario, period);
    const grossProfit = this.calculateGrossProfit(facts, accounts, entityId, scenario, period);
    const ebitda = this.calculateEBITDA(facts, accounts, entityId, scenario, period);
    const grossMargin = this.calculateGrossMargin(facts, accounts, entityId, scenario, period);
    const ebitdaMargin = this.calculateEBITDAMargin(facts, accounts, entityId, scenario, period);

    const kpis = {
      netRevenue,
      grossProfit,
      ebitda,
      grossMargin,
      ebitdaMargin,
    };

    // Calcular comparações se período anterior fornecido
    if (previousPeriod) {
      const prevNetRevenue = this.calculateNetRevenue(facts, accounts, entityId, scenario, previousPeriod);
      const prevGrossProfit = this.calculateGrossProfit(facts, accounts, entityId, scenario, previousPeriod);
      const prevEbitda = this.calculateEBITDA(facts, accounts, entityId, scenario, previousPeriod);

      return {
        ...kpis,
        comparisons: {
          netRevenue: this.calculateMetricWithComparison(netRevenue, prevNetRevenue),
          grossProfit: this.calculateMetricWithComparison(grossProfit, prevGrossProfit),
          ebitda: this.calculateMetricWithComparison(ebitda, prevEbitda),
        },
      };
    }

    return kpis;
  }
}