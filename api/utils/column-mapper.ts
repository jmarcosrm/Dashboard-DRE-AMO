import { FileMetadata } from './file-parser';

// Interface para mapeamento de colunas
export interface ColumnMapping {
  sourceColumn: string;
  sourceIndex: number;
  targetField: string;
  confidence: number; // 0-1
  transformFunction?: string;
  validationRules?: string[];
}

// Interface para configuração de mapeamento
export interface MappingConfig {
  autoDetectFinancialFields: boolean;
  customMappings?: { [key: string]: string };
  requiredFields?: string[];
  dateFormats?: string[];
  numberFormats?: {
    decimalSeparator: string;
    thousandsSeparator: string;
  };
  entityMapping?: {
    column: string;
    defaultValue?: string;
  };
  accountMapping?: {
    column: string;
    defaultValue?: string;
  };
}

// Campos financeiros padrão que o sistema reconhece
export const FINANCIAL_FIELDS = {
  // Campos obrigatórios
  ENTITY: 'entity',
  ACCOUNT: 'account', 
  SCENARIO: 'scenario',
  PERIOD: 'period',
  VALUE: 'value',
  
  // Campos opcionais
  DESCRIPTION: 'description',
  CURRENCY: 'currency',
  UNIT: 'unit',
  CATEGORY: 'category',
  SUBCATEGORY: 'subcategory',
  COST_CENTER: 'cost_center',
  PROJECT: 'project',
  DEPARTMENT: 'department',
  
  // Campos de auditoria
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  SOURCE: 'source',
  BATCH_ID: 'batch_id'
} as const;

// Padrões de reconhecimento para cada campo
const FIELD_PATTERNS = {
  [FINANCIAL_FIELDS.ENTITY]: [
    /entidade/i, /entity/i, /empresa/i, /company/i, /organizacao/i, /organization/i,
    /filial/i, /subsidiary/i, /unidade/i, /unit/i
  ],
  [FINANCIAL_FIELDS.ACCOUNT]: [
    /conta/i, /account/i, /codigo.*conta/i, /account.*code/i, /plano.*conta/i,
    /chart.*account/i, /gl.*account/i, /contabil/i
  ],
  [FINANCIAL_FIELDS.SCENARIO]: [
    /cenario/i, /scenario/i, /versao/i, /version/i, /orcamento/i, /budget/i,
    /real/i, /actual/i, /forecast/i, /previsao/i
  ],
  [FINANCIAL_FIELDS.PERIOD]: [
    /periodo/i, /period/i, /data/i, /date/i, /mes/i, /month/i, /ano/i, /year/i,
    /trimestre/i, /quarter/i, /semestre/i, /semester/i
  ],
  [FINANCIAL_FIELDS.VALUE]: [
    /valor/i, /value/i, /amount/i, /montante/i, /saldo/i, /balance/i,
    /debito/i, /debit/i, /credito/i, /credit/i, /total/i
  ],
  [FINANCIAL_FIELDS.DESCRIPTION]: [
    /descricao/i, /description/i, /historico/i, /history/i, /memo/i,
    /observacao/i, /observation/i, /comentario/i, /comment/i
  ],
  [FINANCIAL_FIELDS.CURRENCY]: [
    /moeda/i, /currency/i, /coin/i, /brl/i, /usd/i, /eur/i
  ],
  [FINANCIAL_FIELDS.UNIT]: [
    /unidade/i, /unit/i, /medida/i, /measure/i, /qty/i, /quantidade/i, /quantity/i
  ],
  [FINANCIAL_FIELDS.CATEGORY]: [
    /categoria/i, /category/i, /classe/i, /class/i, /grupo/i, /group/i,
    /tipo/i, /type/i
  ],
  [FINANCIAL_FIELDS.SUBCATEGORY]: [
    /subcategoria/i, /subcategory/i, /subclasse/i, /subclass/i,
    /subgrupo/i, /subgroup/i, /subtipo/i, /subtype/i
  ],
  [FINANCIAL_FIELDS.COST_CENTER]: [
    /centro.*custo/i, /cost.*center/i, /cc/i, /centro.*responsabilidade/i,
    /responsibility.*center/i
  ],
  [FINANCIAL_FIELDS.PROJECT]: [
    /projeto/i, /project/i, /obra/i, /job/i, /contrato/i, /contract/i
  ],
  [FINANCIAL_FIELDS.DEPARTMENT]: [
    /departamento/i, /department/i, /setor/i, /sector/i, /area/i,
    /divisao/i, /division/i
  ]
};

// Configuração padrão
const DEFAULT_MAPPING_CONFIG: MappingConfig = {
  autoDetectFinancialFields: true,
  requiredFields: [
    FINANCIAL_FIELDS.ENTITY,
    FINANCIAL_FIELDS.ACCOUNT,
    FINANCIAL_FIELDS.SCENARIO,
    FINANCIAL_FIELDS.PERIOD,
    FINANCIAL_FIELDS.VALUE
  ],
  dateFormats: [
    'DD/MM/YYYY',
    'MM/DD/YYYY', 
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'MM-DD-YYYY',
    'YYYY/MM/DD'
  ],
  numberFormats: {
    decimalSeparator: ',',
    thousandsSeparator: '.'
  }
};

/**
 * Mapeia automaticamente colunas para campos financeiros
 */
export function autoMapColumns(
  metadata: FileMetadata,
  config: Partial<MappingConfig> = {}
): ColumnMapping[] {
  const mappingConfig = { ...DEFAULT_MAPPING_CONFIG, ...config };
  const mappings: ColumnMapping[] = [];
  
  console.log('Starting automatic column mapping...');
  
  // Aplicar mapeamentos customizados primeiro
  if (mappingConfig.customMappings) {
    for (const [sourceColumn, targetField] of Object.entries(mappingConfig.customMappings)) {
      const columnIndex = metadata.columns.findIndex(col => 
        col.name.toLowerCase() === sourceColumn.toLowerCase()
      );
      
      if (columnIndex !== -1) {
        mappings.push({
          sourceColumn: metadata.columns[columnIndex].name,
          sourceIndex: columnIndex,
          targetField,
          confidence: 1.0, // Mapeamento manual tem confiança máxima
          transformFunction: getTransformFunction(targetField, metadata.columns[columnIndex])
        });
      }
    }
  }
  
  // Auto-detectar campos financeiros
  if (mappingConfig.autoDetectFinancialFields) {
    const autoMappings = detectFinancialFields(metadata, mappingConfig);
    
    // Adicionar apenas mapeamentos que não conflitam com os customizados
    for (const mapping of autoMappings) {
      const existingMapping = mappings.find(m => 
        m.sourceIndex === mapping.sourceIndex || m.targetField === mapping.targetField
      );
      
      if (!existingMapping) {
        mappings.push(mapping);
      }
    }
  }
  
  // Validar mapeamentos obrigatórios
  const validationResult = validateMappings(mappings, mappingConfig);
  
  console.log('Column mapping completed:', {
    totalMappings: mappings.length,
    requiredFieldsMapped: validationResult.requiredFieldsMapped,
    missingFields: validationResult.missingFields,
    averageConfidence: mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length
  });
  
  return mappings;
}

/**
 * Detecta automaticamente campos financeiros baseado em padrões
 */
function detectFinancialFields(
  metadata: FileMetadata,
  config: MappingConfig
): ColumnMapping[] {
  const mappings: ColumnMapping[] = [];
  
  for (const column of metadata.columns) {
    const bestMatch = findBestFieldMatch(column, metadata);
    
    if (bestMatch && bestMatch.confidence >= 0.3) { // Threshold mínimo de confiança
      mappings.push({
        sourceColumn: column.name,
        sourceIndex: column.index,
        targetField: bestMatch.field,
        confidence: bestMatch.confidence,
        transformFunction: getTransformFunction(bestMatch.field, column),
        validationRules: getValidationRules(bestMatch.field)
      });
    }
  }
  
  return mappings;
}

/**
 * Encontra o melhor campo correspondente para uma coluna
 */
function findBestFieldMatch(
  column: FileMetadata['columns'][0],
  metadata: FileMetadata
): { field: string; confidence: number } | null {
  let bestMatch: { field: string; confidence: number } | null = null;
  
  for (const [field, patterns] of Object.entries(FIELD_PATTERNS)) {
    const confidence = calculateFieldConfidence(column, patterns, metadata);
    
    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = { field, confidence };
    }
  }
  
  return bestMatch;
}

/**
 * Calcula confiança de mapeamento baseado em múltiplos fatores
 */
function calculateFieldConfidence(
  column: FileMetadata['columns'][0],
  patterns: RegExp[],
  metadata: FileMetadata
): number {
  let confidence = 0;
  
  // 1. Correspondência de nome (peso: 60%)
  const nameMatch = patterns.some(pattern => pattern.test(column.name));
  if (nameMatch) {
    confidence += 0.6;
  }
  
  // 2. Análise de tipo de dados (peso: 25%)
  const typeScore = getTypeCompatibilityScore(column, patterns);
  confidence += typeScore * 0.25;
  
  // 3. Análise de amostras (peso: 15%)
  const sampleScore = getSampleCompatibilityScore(column, patterns);
  confidence += sampleScore * 0.15;
  
  return Math.min(confidence, 1.0);
}

/**
 * Calcula score de compatibilidade de tipo
 */
function getTypeCompatibilityScore(
  column: FileMetadata['columns'][0],
  patterns: RegExp[]
): number {
  // Determinar campo baseado nos padrões
  const fieldName = Object.entries(FIELD_PATTERNS)
    .find(([_, fieldPatterns]) => fieldPatterns === patterns)?.[0];
  
  if (!fieldName) return 0;
  
  // Verificar compatibilidade de tipo
  switch (fieldName) {
    case FINANCIAL_FIELDS.VALUE:
      return column.type === 'number' ? 1.0 : 0.3;
    
    case FINANCIAL_FIELDS.PERIOD:
      return column.type === 'date' ? 1.0 : column.type === 'text' ? 0.7 : 0.2;
    
    case FINANCIAL_FIELDS.ENTITY:
    case FINANCIAL_FIELDS.ACCOUNT:
    case FINANCIAL_FIELDS.SCENARIO:
      return column.type === 'text' ? 1.0 : 0.4;
    
    default:
      return column.type === 'text' ? 0.8 : 0.5;
  }
}

/**
 * Calcula score de compatibilidade de amostras
 */
function getSampleCompatibilityScore(
  column: FileMetadata['columns'][0],
  patterns: RegExp[]
): number {
  if (column.samples.length === 0) return 0.5;
  
  // Determinar campo baseado nos padrões
  const fieldName = Object.entries(FIELD_PATTERNS)
    .find(([_, fieldPatterns]) => fieldPatterns === patterns)?.[0];
  
  if (!fieldName) return 0;
  
  let score = 0;
  const sampleCount = column.samples.length;
  
  for (const sample of column.samples) {
    if (sample === null || sample === undefined) continue;
    
    const sampleStr = String(sample).toLowerCase();
    
    switch (fieldName) {
      case FINANCIAL_FIELDS.VALUE:
        // Verificar se parece com valor monetário
        if (/^-?[\d.,]+$/.test(sampleStr)) {
          score += 1;
        }
        break;
      
      case FINANCIAL_FIELDS.PERIOD:
        // Verificar se parece com data/período
        if (/\d{1,4}[\/-]\d{1,2}[\/-]\d{1,4}/.test(sampleStr) || 
            /\d{4}/.test(sampleStr) || 
            /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i.test(sampleStr)) {
          score += 1;
        }
        break;
      
      case FINANCIAL_FIELDS.SCENARIO:
        // Verificar se parece com cenário
        if (/(real|actual|budget|orcamento|forecast|previsao)/i.test(sampleStr)) {
          score += 1;
        }
        break;
      
      case FINANCIAL_FIELDS.ACCOUNT:
        // Verificar se parece com código de conta
        if (/^\d+(\.\d+)*$/.test(sampleStr) || /^[a-z]\d+/i.test(sampleStr)) {
          score += 1;
        }
        break;
      
      default:
        // Para outros campos, verificar se não está vazio
        if (sampleStr.trim().length > 0) {
          score += 0.5;
        }
    }
  }
  
  return sampleCount > 0 ? score / sampleCount : 0;
}

/**
 * Obtém função de transformação para um campo
 */
function getTransformFunction(
  targetField: string,
  column: FileMetadata['columns'][0]
): string | undefined {
  switch (targetField) {
    case FINANCIAL_FIELDS.VALUE:
      if (column.type !== 'number') {
        return 'parseNumber';
      }
      break;
    
    case FINANCIAL_FIELDS.PERIOD:
      if (column.type !== 'date') {
        return 'parseDate';
      }
      break;
    
    case FINANCIAL_FIELDS.ENTITY:
    case FINANCIAL_FIELDS.ACCOUNT:
    case FINANCIAL_FIELDS.SCENARIO:
      return 'normalizeText';
    
    default:
      if (column.type === 'text') {
        return 'normalizeText';
      }
  }
  
  return undefined;
}

/**
 * Obtém regras de validação para um campo
 */
function getValidationRules(targetField: string): string[] {
  const rules: string[] = [];
  
  switch (targetField) {
    case FINANCIAL_FIELDS.VALUE:
      rules.push('required', 'numeric', 'finite');
      break;
    
    case FINANCIAL_FIELDS.ENTITY:
    case FINANCIAL_FIELDS.ACCOUNT:
    case FINANCIAL_FIELDS.SCENARIO:
      rules.push('required', 'notEmpty', 'maxLength:100');
      break;
    
    case FINANCIAL_FIELDS.PERIOD:
      rules.push('required', 'validDate');
      break;
    
    case FINANCIAL_FIELDS.DESCRIPTION:
      rules.push('maxLength:500');
      break;
    
    default:
      rules.push('maxLength:255');
  }
  
  return rules;
}

/**
 * Valida se os mapeamentos atendem aos requisitos
 */
function validateMappings(
  mappings: ColumnMapping[],
  config: MappingConfig
): {
  isValid: boolean;
  requiredFieldsMapped: string[];
  missingFields: string[];
  duplicateFields: string[];
  lowConfidenceFields: string[];
} {
  const mappedFields = mappings.map(m => m.targetField);
  const requiredFields = config.requiredFields || [];
  
  const requiredFieldsMapped = requiredFields.filter(field => mappedFields.includes(field));
  const missingFields = requiredFields.filter(field => !mappedFields.includes(field));
  
  // Verificar campos duplicados
  const fieldCounts = new Map<string, number>();
  mappedFields.forEach(field => {
    fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
  });
  const duplicateFields = Array.from(fieldCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([field]) => field);
  
  // Verificar campos com baixa confiança
  const lowConfidenceFields = mappings
    .filter(m => m.confidence < 0.5)
    .map(m => m.targetField);
  
  const isValid = missingFields.length === 0 && duplicateFields.length === 0;
  
  return {
    isValid,
    requiredFieldsMapped,
    missingFields,
    duplicateFields,
    lowConfidenceFields
  };
}

/**
 * Aplica transformações de dados baseado nos mapeamentos
 */
export function applyColumnMappings(
  rows: any[][],
  mappings: ColumnMapping[],
  config: Partial<MappingConfig> = {}
): any[] {
  const mappingConfig = { ...DEFAULT_MAPPING_CONFIG, ...config };
  const transformedRows: any[] = [];
  
  for (const row of rows) {
    const transformedRow: any = {};
    
    for (const mapping of mappings) {
      const sourceValue = row[mapping.sourceIndex];
      let transformedValue = sourceValue;
      
      // Aplicar função de transformação se especificada
      if (mapping.transformFunction && sourceValue !== null && sourceValue !== undefined) {
        transformedValue = applyTransformation(
          sourceValue,
          mapping.transformFunction,
          mappingConfig
        );
      }
      
      transformedRow[mapping.targetField] = transformedValue;
    }
    
    // Adicionar campos padrão se não mapeados
    addDefaultFields(transformedRow, mappingConfig);
    
    transformedRows.push(transformedRow);
  }
  
  return transformedRows;
}

/**
 * Aplica transformação específica a um valor
 */
function applyTransformation(
  value: any,
  transformFunction: string,
  config: MappingConfig
): any {
  switch (transformFunction) {
    case 'parseNumber':
      return parseNumberValue(value, config.numberFormats!);
    
    case 'parseDate':
      return parseDateValue(value, config.dateFormats!);
    
    case 'normalizeText':
      return normalizeTextValue(value);
    
    default:
      return value;
  }
}

/**
 * Parse valor numérico considerando formato brasileiro
 */
function parseNumberValue(
  value: any,
  numberFormats: { decimalSeparator: string; thousandsSeparator: string }
): number | null {
  if (typeof value === 'number') return value;
  
  const str = String(value).trim();
  if (!str) return null;
  
  // Remover caracteres não numéricos exceto separadores
  let cleanStr = str.replace(/[^\d.,\-+]/g, '');
  
  // Tratar formato brasileiro (1.234,56)
  if (numberFormats.decimalSeparator === ',' && numberFormats.thousandsSeparator === '.') {
    // Se tem vírgula, assumir que é decimal
    if (cleanStr.includes(',')) {
      const parts = cleanStr.split(',');
      if (parts.length === 2) {
        // Remover pontos da parte inteira
        const integerPart = parts[0].replace(/\./g, '');
        cleanStr = integerPart + '.' + parts[1];
      }
    } else {
      // Apenas pontos - remover se for separador de milhares
      const dotCount = (cleanStr.match(/\./g) || []).length;
      if (dotCount > 1 || (dotCount === 1 && cleanStr.split('.')[1].length > 2)) {
        cleanStr = cleanStr.replace(/\./g, '');
      }
    }
  }
  
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Parse valor de data
 */
function parseDateValue(value: any, dateFormats: string[]): Date | null {
  if (value instanceof Date) return value;
  
  const str = String(value).trim();
  if (!str) return null;
  
  // Tentar parse direto primeiro
  const directParse = new Date(str);
  if (!isNaN(directParse.getTime())) {
    return directParse;
  }
  
  // Tentar formatos específicos
  for (const format of dateFormats) {
    const parsed = parseDateWithFormat(str, format);
    if (parsed) return parsed;
  }
  
  return null;
}

/**
 * Parse data com formato específico
 */
function parseDateWithFormat(dateStr: string, format: string): Date | null {
  // Implementação simplificada - em produção usar biblioteca como moment.js
  const formatMap: { [key: string]: RegExp } = {
    'DD/MM/YYYY': /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    'MM/DD/YYYY': /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
    'YYYY-MM-DD': /^(\d{4})-(\d{1,2})-(\d{1,2})$/,
    'DD-MM-YYYY': /^(\d{1,2})-(\d{1,2})-(\d{4})$/,
    'MM-DD-YYYY': /^(\d{1,2})-(\d{1,2})-(\d{4})$/
  };
  
  const regex = formatMap[format];
  if (!regex) return null;
  
  const match = dateStr.match(regex);
  if (!match) return null;
  
  let year: number, month: number, day: number;
  
  switch (format) {
    case 'DD/MM/YYYY':
    case 'DD-MM-YYYY':
      day = parseInt(match[1]);
      month = parseInt(match[2]) - 1; // JavaScript months are 0-based
      year = parseInt(match[3]);
      break;
    
    case 'MM/DD/YYYY':
    case 'MM-DD-YYYY':
      month = parseInt(match[1]) - 1;
      day = parseInt(match[2]);
      year = parseInt(match[3]);
      break;
    
    case 'YYYY-MM-DD':
      year = parseInt(match[1]);
      month = parseInt(match[2]) - 1;
      day = parseInt(match[3]);
      break;
    
    default:
      return null;
  }
  
  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Normaliza valor de texto
 */
function normalizeTextValue(value: any): string {
  if (value === null || value === undefined) return '';
  
  return String(value)
    .trim()
    .replace(/\s+/g, ' ') // Normalizar espaços
    .replace(/[\u200B-\u200D\uFEFF]/g, ''); // Remover caracteres invisíveis
}

/**
 * Adiciona campos padrão se não foram mapeados
 */
function addDefaultFields(
  row: any,
  config: MappingConfig
): void {
  // Adicionar entidade padrão se não mapeada
  if (!row[FINANCIAL_FIELDS.ENTITY] && config.entityMapping?.defaultValue) {
    row[FINANCIAL_FIELDS.ENTITY] = config.entityMapping.defaultValue;
  }
  
  // Adicionar conta padrão se não mapeada
  if (!row[FINANCIAL_FIELDS.ACCOUNT] && config.accountMapping?.defaultValue) {
    row[FINANCIAL_FIELDS.ACCOUNT] = config.accountMapping.defaultValue;
  }
  
  // Adicionar campos de auditoria
  row[FINANCIAL_FIELDS.CREATED_AT] = new Date().toISOString();
  row[FINANCIAL_FIELDS.SOURCE] = 'file_import';
}

/**
 * Gera relatório de mapeamento
 */
export function generateMappingReport(
  mappings: ColumnMapping[],
  validation: ReturnType<typeof validateMappings>
): string {
  let report = '=== COLUMN MAPPING REPORT ===\n\n';
  
  // Status geral
  report += `MAPPING STATUS: ${validation.isValid ? 'VALID ✅' : 'INVALID ❌'}\n`;
  report += `TOTAL MAPPINGS: ${mappings.length}\n`;
  report += `REQUIRED FIELDS MAPPED: ${validation.requiredFieldsMapped.length}\n\n`;
  
  // Mapeamentos encontrados
  if (mappings.length > 0) {
    report += 'COLUMN MAPPINGS:\n';
    mappings.forEach((mapping, index) => {
      const confidenceIcon = mapping.confidence >= 0.8 ? '🟢' : 
                            mapping.confidence >= 0.5 ? '🟡' : '🔴';
      
      report += `${index + 1}. ${mapping.sourceColumn} → ${mapping.targetField} ${confidenceIcon}\n`;
      report += `   Confidence: ${(mapping.confidence * 100).toFixed(1)}%\n`;
      
      if (mapping.transformFunction) {
        report += `   Transform: ${mapping.transformFunction}\n`;
      }
      
      if (mapping.validationRules && mapping.validationRules.length > 0) {
        report += `   Validation: ${mapping.validationRules.join(', ')}\n`;
      }
      
      report += '\n';
    });
  }
  
  // Problemas encontrados
  if (validation.missingFields.length > 0) {
    report += 'MISSING REQUIRED FIELDS:\n';
    validation.missingFields.forEach(field => {
      report += `- ${field} ❌\n`;
    });
    report += '\n';
  }
  
  if (validation.duplicateFields.length > 0) {
    report += 'DUPLICATE FIELD MAPPINGS:\n';
    validation.duplicateFields.forEach(field => {
      report += `- ${field} ⚠️\n`;
    });
    report += '\n';
  }
  
  if (validation.lowConfidenceFields.length > 0) {
    report += 'LOW CONFIDENCE MAPPINGS:\n';
    validation.lowConfidenceFields.forEach(field => {
      report += `- ${field} 🔴\n`;
    });
    report += '\n';
  }
  
  // Recomendações
  report += 'RECOMMENDATIONS:\n';
  
  if (validation.isValid) {
    report += '- Mapping is ready for data processing ✅\n';
  } else {
    if (validation.missingFields.length > 0) {
      report += '- Map missing required fields before processing\n';
    }
    if (validation.duplicateFields.length > 0) {
      report += '- Resolve duplicate field mappings\n';
    }
  }
  
  if (validation.lowConfidenceFields.length > 0) {
    report += '- Review low confidence mappings manually\n';
  }
  
  const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
  if (avgConfidence < 0.7) {
    report += '- Consider manual mapping review due to low average confidence\n';
  }
  
  return report;
}