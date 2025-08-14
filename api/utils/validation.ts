import { ExtractedFinancialData } from '../webhooks/google-drive';
import { Entity, Account } from '../../shared/types';
import { withDatabaseCircuitBreaker } from './database-circuit-breaker.js';

// Interface para resultado de validação
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  data?: ExtractedFinancialData;
}

// Interface para configurações de validação
export interface ValidationConfig {
  allowNegativeValues: boolean;
  maxValue: number;
  minValue: number;
  requiredFields: string[];
  allowedScenarios: string[];
  validateEntityExists: boolean;
  validateAccountExists: boolean;
  allowAutoCreate: boolean;
}

// Configuração padrão de validação
const DEFAULT_VALIDATION_CONFIG: ValidationConfig = {
  allowNegativeValues: true,
  maxValue: 999999999999, // 1 trilhão
  minValue: -999999999999,
  requiredFields: ['value', 'year', 'month'],
  allowedScenarios: ['real', 'budget', 'forecast'],
  validateEntityExists: false, // Permitir auto-criação
  validateAccountExists: false, // Permitir auto-criação
  allowAutoCreate: true
};

/**
 * Valida dados financeiros extraídos
 */
export function validateFinancialData(
  data: ExtractedFinancialData,
  config: Partial<ValidationConfig> = {},
  existingEntities: Entity[] = [],
  existingAccounts: Account[] = []
): ValidationResult {
  const validationConfig = { ...DEFAULT_VALIDATION_CONFIG, ...config };
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Validar campos obrigatórios
    validateRequiredFields(data, validationConfig.requiredFields, errors);

    // Validar valor
    validateValue(data.value, validationConfig, errors, warnings);

    // Validar data (ano e mês)
    validateDate(data.year, data.month, errors, warnings);

    // Validar cenário
    validateScenario(data.scenarioId, validationConfig.allowedScenarios, errors);

    // Validar entidade
    validateEntity(data, existingEntities, validationConfig, errors, warnings);

    // Validar conta
    validateAccount(data, existingAccounts, validationConfig, errors, warnings);

    // Validar consistência dos dados
    validateDataConsistency(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      data: errors.length === 0 ? data : undefined
    };

  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
      warnings: []
    };
  }
}

/**
 * Valida campos obrigatórios
 */
function validateRequiredFields(
  data: ExtractedFinancialData,
  requiredFields: string[],
  errors: string[]
) {
  for (const field of requiredFields) {
    const value = (data as any)[field];
    
    if (value === undefined || value === null || value === '') {
      errors.push(`Required field '${field}' is missing or empty`);
    }
  }
}

/**
 * Valida valor financeiro
 */
function validateValue(
  value: number,
  config: ValidationConfig,
  errors: string[],
  warnings: string[]
) {
  // Verificar se é um número válido
  if (isNaN(value) || !isFinite(value)) {
    errors.push('Value must be a valid number');
    return;
  }

  // Verificar valores negativos
  if (!config.allowNegativeValues && value < 0) {
    errors.push('Negative values are not allowed');
  }

  // Verificar limites
  if (value > config.maxValue) {
    errors.push(`Value ${value} exceeds maximum allowed value ${config.maxValue}`);
  }

  if (value < config.minValue) {
    errors.push(`Value ${value} is below minimum allowed value ${config.minValue}`);
  }

  // Avisos para valores suspeitos
  if (Math.abs(value) > 1000000000) { // 1 bilhão
    warnings.push(`Very large value detected: ${value}. Please verify.`);
  }

  if (value === 0) {
    warnings.push('Zero value detected. This may be intentional or indicate missing data.');
  }
}

/**
 * Valida data (ano e mês)
 */
function validateDate(
  year: number,
  month: number,
  errors: string[],
  warnings: string[]
) {
  const currentYear = new Date().getFullYear();

  // Validar ano
  if (isNaN(year) || year < 1900 || year > currentYear + 10) {
    errors.push(`Invalid year: ${year}. Must be between 1900 and ${currentYear + 10}`);
  }

  // Validar mês
  if (isNaN(month) || month < 1 || month > 12) {
    errors.push(`Invalid month: ${month}. Must be between 1 and 12`);
  }

  // Avisos para datas futuras
  if (year > currentYear || (year === currentYear && month > new Date().getMonth() + 1)) {
    warnings.push(`Future date detected: ${month}/${year}. Please verify if this is intentional.`);
  }

  // Avisos para datas muito antigas
  if (year < currentYear - 5) {
    warnings.push(`Old date detected: ${month}/${year}. Please verify if this data is still relevant.`);
  }
}

/**
 * Valida cenário
 */
function validateScenario(
  scenarioId: string,
  allowedScenarios: string[],
  errors: string[]
) {
  if (!allowedScenarios.includes(scenarioId)) {
    errors.push(`Invalid scenario '${scenarioId}'. Allowed scenarios: ${allowedScenarios.join(', ')}`);
  }
}

/**
 * Valida entidade
 */
function validateEntity(
  data: ExtractedFinancialData,
  existingEntities: Entity[],
  config: ValidationConfig,
  errors: string[],
  warnings: string[]
) {
  const { entityCode, entityName } = data;

  // Se não há código nem nome da entidade
  if (!entityCode && !entityName) {
    if (!config.allowAutoCreate) {
      errors.push('Entity code or name is required');
      return;
    } else {
      warnings.push('No entity specified. A default entity will be used.');
      return;
    }
  }

  // Verificar se a entidade existe
  if (config.validateEntityExists && existingEntities.length > 0) {
    const entityExists = existingEntities.some(e => 
      (entityName && e.name === entityName)
    );

    if (!entityExists && !config.allowAutoCreate) {
      errors.push(`Entity '${entityCode || entityName}' does not exist and auto-creation is disabled`);
    } else if (!entityExists) {
      warnings.push(`Entity '${entityCode || entityName}' will be auto-created`);
    }
  }

  // Validar formato do código da entidade
  if (entityCode) {
    if (entityCode.length > 50) {
      errors.push('Entity code is too long (max 50 characters)');
    }
    
    if (!/^[A-Za-z0-9_-]+$/.test(entityCode)) {
      warnings.push('Entity code contains special characters. Consider using only letters, numbers, hyphens and underscores.');
    }
  }

  // Validar nome da entidade
  if (entityName && entityName.length > 200) {
    errors.push('Entity name is too long (max 200 characters)');
  }
}

/**
 * Valida conta
 */
function validateAccount(
  data: ExtractedFinancialData,
  existingAccounts: Account[],
  config: ValidationConfig,
  errors: string[],
  warnings: string[]
) {
  const { accountCode, accountName } = data;

  // Se não há código nem nome da conta
  if (!accountCode && !accountName) {
    if (!config.allowAutoCreate) {
      errors.push('Account code or name is required');
      return;
    } else {
      warnings.push('No account specified. A default account will be used.');
      return;
    }
  }

  // Verificar se a conta existe
  if (config.validateAccountExists && existingAccounts.length > 0) {
    const accountExists = existingAccounts.some(a => 
      (accountCode && a.code === accountCode) || 
      (accountName && a.name === accountName)
    );

    if (!accountExists && !config.allowAutoCreate) {
      errors.push(`Account '${accountCode || accountName}' does not exist and auto-creation is disabled`);
    } else if (!accountExists) {
      warnings.push(`Account '${accountCode || accountName}' will be auto-created`);
    }
  }

  // Validar formato do código da conta
  if (accountCode) {
    if (accountCode.length > 50) {
      errors.push('Account code is too long (max 50 characters)');
    }
    
    // Validar formato de plano de contas (opcional)
    if (/^\d+(\.\d+)*$/.test(accountCode)) {
      // Código numérico hierárquico (ex: 1.1.1.001)
      const levels = accountCode.split('.');
      if (levels.length > 6) {
        warnings.push('Account code has many hierarchy levels. Consider simplifying.');
      }
    }
  }

  // Validar nome da conta
  if (accountName && accountName.length > 200) {
    errors.push('Account name is too long (max 200 characters)');
  }
}

/**
 * Valida consistência dos dados
 */
function validateDataConsistency(
  data: ExtractedFinancialData,
  errors: string[],
  warnings: string[]
) {
  // Verificar consistência entre código e nome da entidade
  if (data.entityCode && data.entityName) {
    // Se ambos estão presentes, verificar se fazem sentido juntos
    const codeWords = data.entityCode.toLowerCase().split(/[_-]/);
    const nameWords = data.entityName.toLowerCase().split(/\s+/);
    
    const hasCommonWords = codeWords.some(codeWord => 
      nameWords.some(nameWord => 
        nameWord.includes(codeWord) || codeWord.includes(nameWord)
      )
    );
    
    if (!hasCommonWords && data.entityCode.length > 3) {
      warnings.push('Entity code and name seem unrelated. Please verify.');
    }
  }

  // Verificar consistência entre código e nome da conta
  if (data.accountCode && data.accountName) {
    const codeWords = data.accountCode.toLowerCase().split(/[._-]/);
    const nameWords = data.accountName.toLowerCase().split(/\s+/);
    
    const hasCommonWords = codeWords.some(codeWord => 
      nameWords.some(nameWord => 
        nameWord.includes(codeWord) || codeWord.includes(nameWord)
      )
    );
    
    if (!hasCommonWords && data.accountCode.length > 3 && !/^\d+(\.\d+)*$/.test(data.accountCode)) {
      warnings.push('Account code and name seem unrelated. Please verify.');
    }
  }

  // Verificar se a descrição é muito genérica
  if (data.description) {
    const genericDescriptions = [
      'imported',
      'data',
      'value',
      'amount',
      'financial',
      'record'
    ];
    
    const isGeneric = genericDescriptions.some(generic => 
      data.description!.toLowerCase().includes(generic)
    );
    
    if (isGeneric && data.description.length < 20) {
      warnings.push('Description seems generic. Consider adding more specific information.');
    }
  }
}

/**
 * Valida um lote de dados financeiros
 */
export function validateFinancialDataBatch(
  dataArray: ExtractedFinancialData[],
  config: Partial<ValidationConfig> = {},
  existingEntities: Entity[] = [],
  existingAccounts: Account[] = []
): {
  validData: ExtractedFinancialData[];
  invalidData: { data: ExtractedFinancialData; errors: string[]; warnings: string[] }[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
    warnings: number;
  };
} {
  const validData: ExtractedFinancialData[] = [];
  const invalidData: { data: ExtractedFinancialData; errors: string[]; warnings: string[] }[] = [];
  let totalWarnings = 0;

  for (const data of dataArray) {
    const result = validateFinancialData(data, config, existingEntities, existingAccounts);
    
    if (result.isValid && result.data) {
      validData.push(result.data);
    } else {
      invalidData.push({
        data,
        errors: result.errors,
        warnings: result.warnings
      });
    }
    
    totalWarnings += result.warnings.length;
  }

  return {
    validData,
    invalidData,
    summary: {
      total: dataArray.length,
      valid: validData.length,
      invalid: invalidData.length,
      warnings: totalWarnings
    }
  };
}

/**
 * Sanitiza dados financeiros (limpa e normaliza)
 */
export function sanitizeFinancialData(data: ExtractedFinancialData): ExtractedFinancialData {
  return {
    ...data,
    entityCode: data.entityCode?.trim().toUpperCase(),
    entityName: data.entityName?.trim(),
    accountCode: data.accountCode?.trim().toUpperCase(),
    accountName: data.accountName?.trim(),
    value: Math.round(data.value * 100) / 100, // Arredondar para 2 casas decimais
    description: data.description?.trim() || undefined
  };
}

/**
 * Detecta duplicatas em um lote de dados
 */
export function detectDuplicates(
  dataArray: ExtractedFinancialData[]
): {
  duplicates: ExtractedFinancialData[][];
  unique: ExtractedFinancialData[];
} {
  const seen = new Map<string, ExtractedFinancialData[]>();
  const duplicates: ExtractedFinancialData[][] = [];
  const unique: ExtractedFinancialData[] = [];

  for (const data of dataArray) {
    // Criar chave única baseada nos campos principais
    const key = `${data.entityCode || 'NO_ENTITY'}_${data.accountCode || 'NO_ACCOUNT'}_${data.year}_${data.month}_${data.scenarioId}_${data.value}`;
    
    if (seen.has(key)) {
      const existing = seen.get(key)!;
      existing.push(data);
      
      // Se é a primeira duplicata, adicionar à lista de duplicatas
      if (existing.length === 2) {
        duplicates.push(existing);
      }
    } else {
      seen.set(key, [data]);
      unique.push(data);
    }
  }

  return { duplicates, unique };
}

/**
 * Gera relatório de validação
 */
export function generateValidationReport(
  results: {
    validData: ExtractedFinancialData[];
    invalidData: { data: ExtractedFinancialData; errors: string[]; warnings: string[] }[];
    summary: { total: number; valid: number; invalid: number; warnings: number };
  },
  duplicates: { duplicates: ExtractedFinancialData[][]; unique: ExtractedFinancialData[] }
): string {
  const { summary, invalidData } = results;
  const { duplicates: duplicateGroups } = duplicates;
  
  let report = '=== VALIDATION REPORT ===\n\n';
  
  // Resumo geral
  report += `SUMMARY:\n`;
  report += `- Total records: ${summary.total}\n`;
  report += `- Valid records: ${summary.valid} (${((summary.valid / summary.total) * 100).toFixed(1)}%)\n`;
  report += `- Invalid records: ${summary.invalid} (${((summary.invalid / summary.total) * 100).toFixed(1)}%)\n`;
  report += `- Total warnings: ${summary.warnings}\n`;
  report += `- Duplicate groups: ${duplicateGroups.length}\n\n`;
  
  // Erros por categoria
  if (invalidData.length > 0) {
    const errorCategories = new Map<string, number>();
    
    invalidData.forEach(item => {
      item.errors.forEach(error => {
        const category = error.split(':')[0] || error.substring(0, 30);
        errorCategories.set(category, (errorCategories.get(category) || 0) + 1);
      });
    });
    
    report += `ERROR CATEGORIES:\n`;
    Array.from(errorCategories.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([category, count]) => {
        report += `- ${category}: ${count} occurrences\n`;
      });
    report += '\n';
  }
  
  // Duplicatas
  if (duplicateGroups.length > 0) {
    report += `DUPLICATES DETECTED:\n`;
    duplicateGroups.slice(0, 5).forEach((group, index) => {
      const first = group[0];
      report += `${index + 1}. Entity: ${first.entityCode || 'N/A'}, Account: ${first.accountCode || 'N/A'}, `;
      report += `Date: ${first.month}/${first.year}, Value: ${first.value} (${group.length} duplicates)\n`;
    });
    
    if (duplicateGroups.length > 5) {
      report += `... and ${duplicateGroups.length - 5} more duplicate groups\n`;
    }
    report += '\n';
  }
  
  // Recomendações
  report += `RECOMMENDATIONS:\n`;
  
  if (summary.invalid > 0) {
    report += `- Fix ${summary.invalid} invalid records before importing\n`;
  }
  
  if (duplicateGroups.length > 0) {
    report += `- Review and resolve ${duplicateGroups.length} duplicate groups\n`;
  }
  
  if (summary.warnings > 0) {
    report += `- Review ${summary.warnings} warnings for data quality issues\n`;
  }
  
  if (summary.valid === summary.total && summary.warnings === 0 && duplicateGroups.length === 0) {
    report += `- All data is valid and ready for import! ✅\n`;
  }
  
  return report;
}