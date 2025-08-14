import * as XLSX from 'xlsx';
import { AccountNature, ScenarioType } from '../types';

export interface DRERow {
  account: string;
  description?: string;
  jan?: number;
  feb?: number;
  mar?: number;
  apr?: number;
  may?: number;
  jun?: number;
  jul?: number;
  aug?: number;
  sep?: number;
  oct?: number;
  nov?: number;
  dec?: number;
  [key: string]: any;
}

export interface ProcessedDREData {
  entityName: string;
  sheetName: string;
  data: DRERow[];
  year: number;
  scenario: ScenarioType;
}

export interface ImportedFinancialFact {
  entityName: string;
  accountName: string;
  accountCode: string;
  accountNature: AccountNature;
  scenario: ScenarioType;
  year: number;
  month: number;
  value: number;
  description?: string;
}

// Mapeamento de contas DRE para natureza contábil
const ACCOUNT_NATURE_MAPPING: Record<string, AccountNature> = {
  'receita': 'revenue',
  'vendas': 'revenue',
  'faturamento': 'revenue',
  'serviços': 'revenue',
  'impostos': 'deduction',
  'deduções': 'deduction',
  'devoluções': 'deduction',
  'cancelamentos': 'deduction',
  'descontos': 'deduction',
  'taxas': 'deduction',
  'comissões': 'deduction',
  'custo': 'cost',
  'cogs': 'cost',
  'cmv': 'cost',
  'despesas': 'expense',
  'administrativas': 'expense',
  'comerciais': 'expense',
  'comercial': 'expense',
  'marketing': 'expense',
  'pessoal': 'expense',
  'salários': 'expense',
  'financeiras': 'expense',
  'juros': 'expense',
  'outras receitas': 'other_revenue',
  'receitas financeiras': 'other_revenue',
  'outras despesas': 'other_expense',
  'despesas não operacionais': 'other_expense'
};

// Mapeamento de meses
const MONTH_MAPPING: Record<string, number> = {
  'jan': 1, 'janeiro': 1,
  'feb': 2, 'fev': 2, 'fevereiro': 2,
  'mar': 3, 'março': 3,
  'apr': 4, 'abr': 4, 'abril': 4,
  'may': 5, 'mai': 5, 'maio': 5,
  'jun': 6, 'junho': 6,
  'jul': 7, 'julho': 7,
  'aug': 8, 'ago': 8, 'agosto': 8,
  'sep': 9, 'set': 9, 'setembro': 9,
  'oct': 10, 'out': 10, 'outubro': 10,
  'nov': 11, 'novembro': 11,
  'dec': 12, 'dez': 12, 'dezembro': 12
};

/**
 * Determina a natureza da conta baseada no nome/descrição
 */
function determineAccountNature(accountName: string): AccountNature {
  const lowerName = accountName.toLowerCase();
  
  for (const [keyword, nature] of Object.entries(ACCOUNT_NATURE_MAPPING)) {
    if (lowerName.includes(keyword)) {
      return nature;
    }
  }
  
  // Default para expense se não conseguir determinar
  return 'expense';
}

/**
 * Gera código da conta baseado no nome
 */
function generateAccountCode(accountName: string, nature: AccountNature): string {
  const prefix = {
    'revenue': '3.1',
    'deduction': '3.2',
    'cost': '4.1',
    'expense': '4.2',
    'other_revenue': '3.3',
    'other_expense': '4.3'
  }[nature];
  
  // Gera um número sequencial baseado no hash do nome
  const hash = accountName.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const sequence = Math.abs(hash % 99) + 1;
  return `${prefix}.${sequence.toString().padStart(2, '0')}`;
}

/**
 * Normaliza valores numéricos
 */
function normalizeValue(value: any): number {
  if (typeof value === 'number') {
    return value;
  }
  
  if (typeof value === 'string') {
    // Remove caracteres não numéricos exceto ponto, vírgula e sinal negativo
    const cleaned = value.replace(/[^\d.,-]/g, '');
    
    // Converte vírgula para ponto (formato brasileiro)
    const normalized = cleaned.replace(',', '.');
    
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  
  return 0;
}

/**
 * Detecta o ano na planilha
 */
function detectYear(worksheet: XLSX.WorkSheet): number {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
  
  for (let row = range.s.r; row <= Math.min(range.e.r, 10); row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const cellValue = cell.v.toString();
        const yearMatch = cellValue.match(/20\d{2}/);
        if (yearMatch) {
          return parseInt(yearMatch[0]);
        }
      }
    }
  }
  
  // Default para 2025 se não encontrar
  return 2025;
}

/**
 * Detecta colunas de meses na planilha
 */
function detectMonthColumns(worksheet: XLSX.WorkSheet): Record<string, number> {
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:Z100');
  const monthColumns: Record<string, number> = {};
  
  // Procura nas primeiras 5 linhas
  for (let row = range.s.r; row <= Math.min(range.e.r, 4); row++) {
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
      const cell = worksheet[cellAddress];
      
      if (cell && cell.v) {
        const cellValue = cell.v.toString().toLowerCase().trim();
        
        for (const [monthKey, monthNumber] of Object.entries(MONTH_MAPPING)) {
          if (cellValue.includes(monthKey)) {
            monthColumns[monthKey] = col;
            break;
          }
        }
      }
    }
  }
  
  return monthColumns;
}

/**
 * Processa uma planilha Excel DRE
 */
export function processExcelFile(file: File): Promise<ProcessedDREData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const results: ProcessedDREData[] = [];
        
        // Processa cada aba da planilha
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const year = detectYear(worksheet);
          const monthColumns = detectMonthColumns(worksheet);
          
          // Converte para JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          const processedRows: DRERow[] = [];
          
          // Processa cada linha
          jsonData.forEach((row: any[], rowIndex) => {
            if (rowIndex < 5) return; // Pula cabeçalhos
            
            const accountName = row[0]?.toString()?.trim();
            if (!accountName || accountName.length < 3) return;
            
            const dreRow: DRERow = {
              account: accountName,
              description: row[1]?.toString()?.trim() || accountName
            };
            
            // Extrai valores dos meses
            Object.entries(monthColumns).forEach(([monthKey, colIndex]) => {
              const value = normalizeValue(row[colIndex]);
              dreRow[monthKey] = value;
            });
            
            processedRows.push(dreRow);
          });
          
          results.push({
            entityName: sheetName,
            sheetName,
            data: processedRows,
            year,
            scenario: 'real' as ScenarioType
          });
        });
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Converte dados DRE processados em fatos financeiros
 */
export function convertToFinancialFacts(processedData: ProcessedDREData[]): ImportedFinancialFact[] {
  const facts: ImportedFinancialFact[] = [];
  
  processedData.forEach(({ entityName, data, year, scenario }) => {
    data.forEach(row => {
      const accountNature = determineAccountNature(row.account);
      const accountCode = generateAccountCode(row.account, accountNature);
      
      // Processa cada mês
      Object.entries(MONTH_MAPPING).forEach(([monthKey, monthNumber]) => {
        const value = row[monthKey as keyof DRERow] as number;
        
        if (value !== undefined && value !== 0) {
          facts.push({
            entityName,
            accountName: row.account,
            accountCode,
            accountNature,
            scenario,
            year,
            month: monthNumber,
            value,
            description: row.description
          });
        }
      });
    });
  });
  
  return facts;
}

/**
 * Valida dados importados
 */
export function validateImportedData(facts: ImportedFinancialFact[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (facts.length === 0) {
    errors.push('Nenhum dado foi importado');
  }
  
  // Verifica duplicatas
  const duplicates = new Set<string>();
  const seen = new Set<string>();
  
  facts.forEach(fact => {
    const key = `${fact.entityName}-${fact.accountCode}-${fact.year}-${fact.month}`;
    if (seen.has(key)) {
      duplicates.add(key);
    }
    seen.add(key);
  });
  
  if (duplicates.size > 0) {
    warnings.push(`${duplicates.size} registros duplicados encontrados`);
  }
  
  // Verifica valores muito altos ou muito baixos
  const extremeValues = facts.filter(fact => 
    Math.abs(fact.value) > 100000000 || (Math.abs(fact.value) < 0.01 && fact.value !== 0)
  );
  
  if (extremeValues.length > 0) {
    warnings.push(`${extremeValues.length} valores extremos encontrados`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}