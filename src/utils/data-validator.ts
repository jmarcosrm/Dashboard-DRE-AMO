import { FinancialFact, Account, Entity } from '../types';
import { ProcessedDREData } from './excel-importer';

export interface ValidationError {
  type: 'missing_data' | 'inconsistent_sum' | 'negative_revenue' | 'invalid_period' | 'duplicate_account' | 'missing_account';
  message: string;
  severity: 'error' | 'warning' | 'info';
  entityName?: string;
  accountName?: string;
  period?: string;
  expectedValue?: number;
  actualValue?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  summary: {
    totalErrors: number;
    totalWarnings: number;
    entitiesValidated: number;
    periodsValidated: number;
  };
}

/**
 * Valida dados DRE processados antes da importação
 */
export function validateDREData(
  processedData: ProcessedDREData[],
  existingAccounts: Account[] = [],
  existingEntities: Entity[] = []
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const entitiesValidated = new Set<string>();
  const periodsValidated = new Set<string>();

  processedData.forEach(entityData => {
    entitiesValidated.add(entityData.entityName);
    
    // Validar se a entidade já existe
    const entityExists = existingEntities.some(e => e.name === entityData.entityName);
    if (!entityExists) {
      warnings.push({
        type: 'missing_account',
        message: `Nova entidade será criada: ${entityData.entityName}`,
        severity: 'info',
        entityName: entityData.entityName
      });
    }

    // Validar dados por linha/conta
    const accountNames = new Set<string>();
    
    entityData.data.forEach(row => {
      // Verificar contas duplicadas
      if (accountNames.has(row.account)) {
        errors.push({
          type: 'duplicate_account',
          message: `Conta duplicada encontrada: ${row.account}`,
          severity: 'error',
          entityName: entityData.entityName,
          accountName: row.account
        });
      }
      accountNames.add(row.account);

      // Validar valores por mês
      Object.keys(row).forEach(key => {
        if (key !== 'account' && key !== 'description') {
          const value = row[key] as number;
          const period = `${entityData.year}-${key.padStart(2, '0')}`;
          periodsValidated.add(period);

          // Verificar valores ausentes
          if (value === undefined || value === null || isNaN(value)) {
            warnings.push({
              type: 'missing_data',
              message: `Valor ausente para ${row.account} em ${key}/${entityData.year}`,
              severity: 'warning',
              entityName: entityData.entityName,
              accountName: row.account,
              period
            });
          }

          // Verificar receitas negativas (pode ser válido em alguns casos)
          if (value < 0 && row.account.toLowerCase().includes('receita') && 
              !row.account.toLowerCase().includes('dedução') &&
              !row.account.toLowerCase().includes('desconto')) {
            warnings.push({
              type: 'negative_revenue',
              message: `Receita negativa detectada: ${row.account} = ${value}`,
              severity: 'warning',
              entityName: entityData.entityName,
              accountName: row.account,
              period,
              actualValue: value
            });
          }
        }
      });
    });

    // Validar consistência de somatórios (exemplo: Receita Líquida)
    validateAccountConsistency(entityData, errors, warnings);
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      entitiesValidated: entitiesValidated.size,
      periodsValidated: periodsValidated.size
    }
  };
}

/**
 * Valida consistência entre contas relacionadas
 */
function validateAccountConsistency(
  entityData: ProcessedDREData,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const accounts = entityData.data;
  
  // Encontrar contas principais
  const receitaBruta = accounts.find(a => 
    a.account.toLowerCase().includes('receita') && 
    a.account.toLowerCase().includes('bruta')
  );
  
  const deducoes = accounts.filter(a => 
    a.account.toLowerCase().includes('dedução') ||
    a.account.toLowerCase().includes('imposto') ||
    a.account.toLowerCase().includes('taxa')
  );
  
  const receitaLiquida = accounts.find(a => 
    a.account.toLowerCase().includes('receita') && 
    a.account.toLowerCase().includes('líquida')
  );

  // Validar Receita Líquida = Receita Bruta - Deduções
  if (receitaBruta && receitaLiquida && deducoes.length > 0) {
    Object.keys(receitaBruta).forEach(month => {
      if (month !== 'account' && month !== 'description') {
        const brutaValue = receitaBruta[month] as number || 0;
        const liquidaValue = receitaLiquida[month] as number || 0;
        
        const totalDeducoes = deducoes.reduce((sum, deducao) => {
          return sum + Math.abs(deducao[month] as number || 0);
        }, 0);
        
        const expectedLiquida = brutaValue - totalDeducoes;
        const difference = Math.abs(expectedLiquida - liquidaValue);
        
        // Tolerância de 1% para diferenças de arredondamento
        const tolerance = Math.abs(expectedLiquida * 0.01);
        
        if (difference > tolerance && difference > 100) { // Diferença mínima de R$ 100
          warnings.push({
            type: 'inconsistent_sum',
            message: `Inconsistência na Receita Líquida em ${month}/${entityData.year}: esperado ${expectedLiquida.toFixed(2)}, encontrado ${liquidaValue.toFixed(2)}`,
            severity: 'warning',
            entityName: entityData.entityName,
            period: `${entityData.year}-${month}`,
            expectedValue: expectedLiquida,
            actualValue: liquidaValue
          });
        }
      }
    });
  }
}

/**
 * Valida dados financeiros já importados no sistema
 */
export function validateFinancialFacts(
  facts: FinancialFact[],
  accounts: Account[],
  entities: Entity[]
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  
  const entitiesValidated = new Set<string>();
  const periodsValidated = new Set<string>();

  // Agrupar fatos por entidade e período
  const factsByEntityPeriod = facts.reduce((acc, fact) => {
    const period = `${fact.year}-${fact.month.toString().padStart(2, '0')}`;
    const key = `${fact.entityId}-${period}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(fact);
    return acc;
  }, {} as Record<string, FinancialFact[]>);

  Object.entries(factsByEntityPeriod).forEach(([key, periodFacts]) => {
    const [entityId, period] = key.split('-', 2);
    const entity = entities.find(e => e.id === entityId);
    
    if (!entity) {
      errors.push({
        type: 'missing_account',
        message: `Entidade não encontrada: ${entityId}`,
        severity: 'error',
        period
      });
      return;
    }

    entitiesValidated.add(entity.name);
    periodsValidated.add(period);

    // Verificar contas ausentes
    periodFacts.forEach(fact => {
      const account = accounts.find(a => a.id === fact.accountId);
      if (!account) {
        errors.push({
          type: 'missing_account',
          message: `Conta não encontrada: ${fact.accountId}`,
          severity: 'error',
          entityName: entity.name,
          period
        });
      }
    });

    // Verificar valores zerados ou ausentes para contas principais
    const mainAccounts = ['receita', 'lucro', 'ebitda'];
    mainAccounts.forEach(accountType => {
      const hasAccount = periodFacts.some(fact => {
        const account = accounts.find(a => a.id === fact.accountId);
        return account && account.name.toLowerCase().includes(accountType);
      });

      if (!hasAccount) {
        warnings.push({
          type: 'missing_data',
          message: `Nenhuma conta de ${accountType} encontrada para ${entity.name} em ${period}`,
          severity: 'warning',
          entityName: entity.name,
          period
        });
      }
    });
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    summary: {
      totalErrors: errors.length,
      totalWarnings: warnings.length,
      entitiesValidated: entitiesValidated.size,
      periodsValidated: periodsValidated.size
    }
  };
}

/**
 * Gera relatório de validação em formato legível
 */
export function generateValidationReport(result: ValidationResult): string {
  let report = '=== RELATÓRIO DE VALIDAÇÃO DE DADOS DRE ===\n\n';
  
  report += `Status: ${result.isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO'}\n`;
  report += `Entidades validadas: ${result.summary.entitiesValidated}\n`;
  report += `Períodos validados: ${result.summary.periodsValidated}\n`;
  report += `Total de erros: ${result.summary.totalErrors}\n`;
  report += `Total de avisos: ${result.summary.totalWarnings}\n\n`;

  if (result.errors.length > 0) {
    report += '🚨 ERROS ENCONTRADOS:\n';
    result.errors.forEach((error, index) => {
      report += `${index + 1}. [${error.type.toUpperCase()}] ${error.message}\n`;
      if (error.entityName) report += `   Entidade: ${error.entityName}\n`;
      if (error.period) report += `   Período: ${error.period}\n`;
      if (error.expectedValue !== undefined) {
        report += `   Esperado: ${error.expectedValue} | Encontrado: ${error.actualValue}\n`;
      }
      report += '\n';
    });
  }

  if (result.warnings.length > 0) {
    report += '⚠️ AVISOS:\n';
    result.warnings.forEach((warning, index) => {
      report += `${index + 1}. [${warning.type.toUpperCase()}] ${warning.message}\n`;
      if (warning.entityName) report += `   Entidade: ${warning.entityName}\n`;
      if (warning.period) report += `   Período: ${warning.period}\n`;
      report += '\n';
    });
  }

  if (result.isValid) {
    report += '✅ Todos os dados estão consistentes e prontos para uso!\n';
  }

  return report;
}