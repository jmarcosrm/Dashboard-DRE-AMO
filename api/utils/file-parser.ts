import * as XLSX from 'xlsx';
import * as csv from 'csv-parser';
import { Readable } from 'stream';

// Interface para metadados de arquivo detectados
export interface FileMetadata {
  type: 'excel' | 'csv' | 'unknown';
  encoding: string;
  delimiter?: string;
  hasHeaders: boolean;
  sheetCount?: number;
  activeSheet?: string;
  rowCount: number;
  columnCount: number;
  structure: {
    headerRow?: number;
    dataStartRow: number;
    dataEndRow: number;
    emptyRows: number[];
    mergedCells?: string[];
  };
  columns: {
    index: number;
    name: string;
    type: 'text' | 'number' | 'date' | 'boolean' | 'mixed';
    samples: any[];
    nullCount: number;
    uniqueCount: number;
  }[];
  quality: {
    score: number; // 0-100
    issues: string[];
    warnings: string[];
  };
}

// Interface para dados parseados
export interface ParsedData {
  headers: string[];
  rows: any[][];
  metadata: FileMetadata;
  rawData?: any;
}

// Interface para configurações de parsing
export interface ParsingConfig {
  autoDetectHeaders: boolean;
  autoDetectDelimiter: boolean;
  autoDetectEncoding: boolean;
  skipEmptyRows: boolean;
  trimWhitespace: boolean;
  maxRows?: number;
  sheetName?: string;
  headerRow?: number;
  dataStartRow?: number;
  customDelimiters?: string[];
  dateFormats?: string[];
}

// Configuração padrão
const DEFAULT_PARSING_CONFIG: ParsingConfig = {
  autoDetectHeaders: true,
  autoDetectDelimiter: true,
  autoDetectEncoding: true,
  skipEmptyRows: true,
  trimWhitespace: true,
  maxRows: 10000,
  customDelimiters: [',', ';', '\t', '|'],
  dateFormats: [
    'DD/MM/YYYY',
    'MM/DD/YYYY',
    'YYYY-MM-DD',
    'DD-MM-YYYY',
    'MM-DD-YYYY'
  ]
};

/**
 * Parser principal que detecta automaticamente o formato e estrutura do arquivo
 */
export async function parseFile(
  content: Buffer,
  fileName: string,
  config: Partial<ParsingConfig> = {}
): Promise<ParsedData> {
  const parsingConfig = { ...DEFAULT_PARSING_CONFIG, ...config };
  
  console.log('Parsing file:', fileName);
  
  // Detectar tipo de arquivo
  const fileType = detectFileType(content, fileName);
  
  let parsedData: ParsedData;
  
  switch (fileType) {
    case 'excel':
      parsedData = await parseExcelFile(content, fileName, parsingConfig);
      break;
    case 'csv':
      parsedData = await parseCSVFile(content, fileName, parsingConfig);
      break;
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
  
  // Analisar qualidade dos dados
  parsedData.metadata.quality = analyzeDataQuality(parsedData);
  
  console.log('File parsing completed:', {
    type: parsedData.metadata.type,
    rows: parsedData.metadata.rowCount,
    columns: parsedData.metadata.columnCount,
    quality: parsedData.metadata.quality.score
  });
  
  return parsedData;
}

/**
 * Detecta o tipo de arquivo baseado no conteúdo e extensão
 */
function detectFileType(content: Buffer, fileName: string): 'excel' | 'csv' | 'unknown' {
  // Verificar extensão
  const extension = fileName.toLowerCase().split('.').pop();
  
  if (['xlsx', 'xls', 'xlsm'].includes(extension || '')) {
    return 'excel';
  }
  
  if (['csv', 'txt'].includes(extension || '')) {
    // Verificar se realmente é CSV analisando o conteúdo
    const sample = content.slice(0, 1024).toString('utf8');
    if (detectCSVDelimiter(sample)) {
      return 'csv';
    }
  }
  
  // Verificar assinatura de arquivo Excel
  const signature = content.slice(0, 8);
  if (signature.includes(Buffer.from([0x50, 0x4B]))) { // ZIP signature (XLSX)
    return 'excel';
  }
  
  if (signature.includes(Buffer.from([0xD0, 0xCF]))) { // OLE signature (XLS)
    return 'excel';
  }
  
  // Tentar detectar CSV pelo conteúdo
  const textContent = content.toString('utf8');
  if (detectCSVDelimiter(textContent.slice(0, 2048))) {
    return 'csv';
  }
  
  return 'unknown';
}

/**
 * Parse arquivo Excel com detecção automática de estrutura
 */
async function parseExcelFile(
  content: Buffer,
  fileName: string,
  config: ParsingConfig
): Promise<ParsedData> {
  try {
    // Ler workbook
    const workbook = XLSX.read(content, { 
      type: 'buffer',
      cellDates: true,
      cellNF: false,
      cellText: false
    });
    
    // Selecionar planilha
    const sheetName = config.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    if (!worksheet) {
      throw new Error(`Sheet '${sheetName}' not found`);
    }
    
    // Obter range da planilha
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
    
    // Converter para array 2D
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: !config.skipEmptyRows,
      range: config.maxRows ? { s: range.s, e: { r: Math.min(range.e.r, config.maxRows - 1), c: range.e.c } } : undefined
    }) as any[][];
    
    // Detectar estrutura
    const structure = detectExcelStructure(rawData, worksheet, config);
    
    // Extrair headers e dados
    const headers = extractHeaders(rawData, structure, config);
    const dataRows = extractDataRows(rawData, structure, config);
    
    // Analisar colunas
    const columns = analyzeColumns(headers, dataRows);
    
    // Criar metadata
    const metadata: FileMetadata = {
      type: 'excel',
      encoding: 'utf8',
      hasHeaders: structure.headerRow !== undefined,
      sheetCount: workbook.SheetNames.length,
      activeSheet: sheetName,
      rowCount: dataRows.length,
      columnCount: headers.length,
      structure,
      columns,
      quality: { score: 0, issues: [], warnings: [] } // Será calculado depois
    };
    
    return {
      headers,
      rows: dataRows,
      metadata,
      rawData: workbook
    };
    
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error}`);
  }
}

/**
 * Parse arquivo CSV com detecção automática de delimitador e encoding
 */
async function parseCSVFile(
  content: Buffer,
  fileName: string,
  config: ParsingConfig
): Promise<ParsedData> {
  try {
    // Detectar encoding
    const encoding = config.autoDetectEncoding ? detectEncoding(content) : 'utf8';
    const textContent = content.toString(encoding as BufferEncoding);
    
    // Detectar delimitador
    const delimiter = config.autoDetectDelimiter ? 
      detectCSVDelimiter(textContent) : ',';
    
    if (!delimiter) {
      throw new Error('Could not detect CSV delimiter');
    }
    
    // Parse CSV
    const rawData = await parseCSVContent(textContent, delimiter, config);
    
    // Detectar estrutura
    const structure = detectCSVStructure(rawData, config);
    
    // Extrair headers e dados
    const headers = extractHeaders(rawData, structure, config);
    const dataRows = extractDataRows(rawData, structure, config);
    
    // Analisar colunas
    const columns = analyzeColumns(headers, dataRows);
    
    // Criar metadata
    const metadata: FileMetadata = {
      type: 'csv',
      encoding,
      delimiter,
      hasHeaders: structure.headerRow !== undefined,
      rowCount: dataRows.length,
      columnCount: headers.length,
      structure,
      columns,
      quality: { score: 0, issues: [], warnings: [] } // Será calculado depois
    };
    
    return {
      headers,
      rows: dataRows,
      metadata
    };
    
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error}`);
  }
}

/**
 * Detecta delimitador CSV analisando o conteúdo
 */
function detectCSVDelimiter(content: string): string | null {
  const delimiters = [',', ';', '\t', '|', ':'];
  const sample = content.split('\n').slice(0, 10).join('\n'); // Primeiras 10 linhas
  
  let bestDelimiter = null;
  let bestScore = 0;
  
  for (const delimiter of delimiters) {
    const lines = sample.split('\n').filter(line => line.trim());
    if (lines.length < 2) continue;
    
    const counts = lines.map(line => (line.match(new RegExp(`\\${delimiter}`, 'g')) || []).length);
    
    // Verificar consistência
    const avgCount = counts.reduce((a, b) => a + b, 0) / counts.length;
    const variance = counts.reduce((sum, count) => sum + Math.pow(count - avgCount, 2), 0) / counts.length;
    
    // Score baseado na consistência e quantidade
    const score = avgCount > 0 ? avgCount / (1 + variance) : 0;
    
    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
}

/**
 * Detecta encoding do arquivo
 */
function detectEncoding(content: Buffer): string {
  // Verificar BOM
  if (content.slice(0, 3).equals(Buffer.from([0xEF, 0xBB, 0xBF]))) {
    return 'utf8';
  }
  
  if (content.slice(0, 2).equals(Buffer.from([0xFF, 0xFE]))) {
    return 'utf16le';
  }
  
  if (content.slice(0, 2).equals(Buffer.from([0xFE, 0xFF]))) {
    return 'utf16be';
  }
  
  // Tentar detectar por caracteres
  const sample = content.slice(0, 1024);
  
  try {
    const utf8Text = sample.toString('utf8');
    // Verificar se contém caracteres de controle inválidos
    if (!/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/.test(utf8Text)) {
      return 'utf8';
    }
  } catch (e) {
    // UTF-8 falhou
  }
  
  try {
    sample.toString('latin1');
    return 'latin1';
  } catch (e) {
    // Latin1 falhou
  }
  
  return 'utf8'; // Fallback
}

/**
 * Parse conteúdo CSV
 */
function parseCSVContent(
  content: string,
  delimiter: string,
  config: ParsingConfig
): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const results: any[][] = [];
    const stream = Readable.from(content);
    
    stream
      .pipe(csv({
        separator: delimiter,
        headers: false
      }))
      .on('data', (data) => {
        const row = Object.values(data).map(value => 
          config.trimWhitespace && typeof value === 'string' ? value.trim() : value
        );
        results.push(row);
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Detecta estrutura de arquivo Excel
 */
function detectExcelStructure(
  data: any[][],
  worksheet: XLSX.WorkSheet,
  config: ParsingConfig
): FileMetadata['structure'] {
  const structure: FileMetadata['structure'] = {
    dataStartRow: 0,
    dataEndRow: data.length - 1,
    emptyRows: []
  };
  
  // Detectar linhas vazias
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every(cell => cell === null || cell === undefined || cell === '')) {
      structure.emptyRows.push(i);
    }
  }
  
  // Detectar linha de cabeçalho
  if (config.autoDetectHeaders) {
    structure.headerRow = detectHeaderRow(data);
  } else if (config.headerRow !== undefined) {
    structure.headerRow = config.headerRow;
  }
  
  // Ajustar início dos dados
  if (structure.headerRow !== undefined) {
    structure.dataStartRow = structure.headerRow + 1;
  } else {
    // Encontrar primeira linha com dados
    for (let i = 0; i < data.length; i++) {
      if (!structure.emptyRows.includes(i)) {
        structure.dataStartRow = i;
        break;
      }
    }
  }
  
  // Detectar células mescladas
  if (worksheet['!merges']) {
    structure.mergedCells = worksheet['!merges'].map(merge => 
      XLSX.utils.encode_range(merge)
    );
  }
  
  return structure;
}

/**
 * Detecta estrutura de arquivo CSV
 */
function detectCSVStructure(
  data: any[][],
  config: ParsingConfig
): FileMetadata['structure'] {
  const structure: FileMetadata['structure'] = {
    dataStartRow: 0,
    dataEndRow: data.length - 1,
    emptyRows: []
  };
  
  // Detectar linhas vazias
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.every(cell => !cell || cell.toString().trim() === '')) {
      structure.emptyRows.push(i);
    }
  }
  
  // Detectar linha de cabeçalho
  if (config.autoDetectHeaders) {
    structure.headerRow = detectHeaderRow(data);
  } else if (config.headerRow !== undefined) {
    structure.headerRow = config.headerRow;
  }
  
  // Ajustar início dos dados
  if (structure.headerRow !== undefined) {
    structure.dataStartRow = structure.headerRow + 1;
  }
  
  return structure;
}

/**
 * Detecta linha de cabeçalho automaticamente
 */
function detectHeaderRow(data: any[][]): number | undefined {
  if (data.length < 2) return undefined;
  
  // Analisar primeiras linhas
  for (let i = 0; i < Math.min(5, data.length - 1); i++) {
    const currentRow = data[i];
    const nextRow = data[i + 1];
    
    if (!currentRow || !nextRow) continue;
    
    // Verificar se a linha atual parece ser cabeçalho
    const isHeaderLike = analyzeRowAsHeader(currentRow, nextRow);
    
    if (isHeaderLike) {
      return i;
    }
  }
  
  return undefined;
}

/**
 * Analisa se uma linha parece ser cabeçalho
 */
function analyzeRowAsHeader(headerRow: any[], dataRow: any[]): boolean {
  if (headerRow.length !== dataRow.length) return false;
  
  let headerScore = 0;
  let totalColumns = 0;
  
  for (let i = 0; i < headerRow.length; i++) {
    const headerCell = headerRow[i];
    const dataCell = dataRow[i];
    
    if (headerCell === null || headerCell === undefined) continue;
    
    totalColumns++;
    
    // Header é texto, data é número
    if (typeof headerCell === 'string' && typeof dataCell === 'number') {
      headerScore += 2;
    }
    
    // Header é texto, data é diferente
    if (typeof headerCell === 'string' && typeof dataCell !== 'string') {
      headerScore += 1;
    }
    
    // Header contém palavras descritivas
    if (typeof headerCell === 'string') {
      const text = headerCell.toLowerCase();
      const descriptiveWords = ['nome', 'name', 'código', 'code', 'valor', 'value', 'data', 'date', 'descrição', 'description'];
      if (descriptiveWords.some(word => text.includes(word))) {
        headerScore += 1;
      }
    }
  }
  
  return totalColumns > 0 && (headerScore / totalColumns) > 0.5;
}

/**
 * Extrai cabeçalhos baseado na estrutura detectada
 */
function extractHeaders(
  data: any[][],
  structure: FileMetadata['structure'],
  config: ParsingConfig
): string[] {
  if (structure.headerRow !== undefined && data[structure.headerRow]) {
    return data[structure.headerRow].map((header, index) => {
      if (header === null || header === undefined || header === '') {
        return `Column_${index + 1}`;
      }
      return String(header).trim();
    });
  }
  
  // Gerar cabeçalhos automáticos
  const firstDataRow = data[structure.dataStartRow];
  if (firstDataRow) {
    return firstDataRow.map((_, index) => `Column_${index + 1}`);
  }
  
  return [];
}

/**
 * Extrai linhas de dados baseado na estrutura
 */
function extractDataRows(
  data: any[][],
  structure: FileMetadata['structure'],
  config: ParsingConfig
): any[][] {
  const startRow = structure.dataStartRow;
  const endRow = structure.dataEndRow;
  
  const dataRows: any[][] = [];
  
  for (let i = startRow; i <= endRow; i++) {
    if (structure.emptyRows.includes(i)) {
      if (!config.skipEmptyRows) {
        dataRows.push([]);
      }
      continue;
    }
    
    const row = data[i];
    if (row) {
      const processedRow = row.map(cell => {
        if (config.trimWhitespace && typeof cell === 'string') {
          return cell.trim();
        }
        return cell;
      });
      dataRows.push(processedRow);
    }
  }
  
  return dataRows;
}

/**
 * Analisa colunas para detectar tipos e qualidade
 */
function analyzeColumns(headers: string[], rows: any[][]): FileMetadata['columns'] {
  const columns: FileMetadata['columns'] = [];
  
  for (let colIndex = 0; colIndex < headers.length; colIndex++) {
    const columnData = rows.map(row => row[colIndex]).filter(value => 
      value !== null && value !== undefined && value !== ''
    );
    
    const samples = columnData.slice(0, 10); // Primeiras 10 amostras
    const nullCount = rows.length - columnData.length;
    const uniqueValues = new Set(columnData);
    
    columns.push({
      index: colIndex,
      name: headers[colIndex],
      type: detectColumnType(columnData),
      samples,
      nullCount,
      uniqueCount: uniqueValues.size
    });
  }
  
  return columns;
}

/**
 * Detecta tipo de dados de uma coluna
 */
function detectColumnType(data: any[]): 'text' | 'number' | 'date' | 'boolean' | 'mixed' {
  if (data.length === 0) return 'text';
  
  const types = new Set<string>();
  
  for (const value of data.slice(0, 100)) { // Analisar até 100 valores
    if (value === null || value === undefined) continue;
    
    if (typeof value === 'boolean') {
      types.add('boolean');
    } else if (typeof value === 'number') {
      types.add('number');
    } else if (value instanceof Date) {
      types.add('date');
    } else {
      const str = String(value).trim();
      
      // Verificar se é número
      if (/^-?\d+(\.\d+)?$/.test(str)) {
        types.add('number');
      }
      // Verificar se é data
      else if (isDateString(str)) {
        types.add('date');
      }
      // Verificar se é boolean
      else if (/^(true|false|sim|não|yes|no|0|1)$/i.test(str)) {
        types.add('boolean');
      }
      else {
        types.add('text');
      }
    }
  }
  
  if (types.size === 1) {
    return Array.from(types)[0] as any;
  } else if (types.size > 1) {
    return 'mixed';
  }
  
  return 'text';
}

/**
 * Verifica se uma string representa uma data
 */
function isDateString(str: string): boolean {
  const datePatterns = [
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/, // DD/MM/YYYY ou DD-MM-YYYY
    /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/, // YYYY/MM/DD ou YYYY-MM-DD
    /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2}$/,  // DD/MM/YY ou DD-MM-YY
  ];
  
  return datePatterns.some(pattern => pattern.test(str)) && !isNaN(Date.parse(str));
}

/**
 * Analisa qualidade dos dados
 */
function analyzeDataQuality(parsedData: ParsedData): FileMetadata['quality'] {
  const { headers, rows, metadata } = parsedData;
  const issues: string[] = [];
  const warnings: string[] = [];
  
  let score = 100;
  
  // Verificar se há dados
  if (rows.length === 0) {
    issues.push('No data rows found');
    score -= 50;
  }
  
  // Verificar cabeçalhos
  if (!metadata.hasHeaders) {
    warnings.push('No headers detected - using auto-generated column names');
    score -= 10;
  }
  
  // Verificar colunas vazias
  const emptyColumns = metadata.columns.filter(col => col.nullCount === rows.length);
  if (emptyColumns.length > 0) {
    warnings.push(`${emptyColumns.length} completely empty columns found`);
    score -= emptyColumns.length * 5;
  }
  
  // Verificar consistência de colunas
  const inconsistentRows = rows.filter(row => row.length !== headers.length);
  if (inconsistentRows.length > 0) {
    issues.push(`${inconsistentRows.length} rows have inconsistent column count`);
    score -= Math.min(inconsistentRows.length * 2, 30);
  }
  
  // Verificar dados mistos
  const mixedColumns = metadata.columns.filter(col => col.type === 'mixed');
  if (mixedColumns.length > 0) {
    warnings.push(`${mixedColumns.length} columns have mixed data types`);
    score -= mixedColumns.length * 3;
  }
  
  // Verificar linhas vazias
  if (metadata.structure.emptyRows.length > 0) {
    warnings.push(`${metadata.structure.emptyRows.length} empty rows found`);
    score -= Math.min(metadata.structure.emptyRows.length, 10);
  }
  
  // Verificar duplicatas de cabeçalho
  const headerCounts = new Map<string, number>();
  headers.forEach(header => {
    headerCounts.set(header, (headerCounts.get(header) || 0) + 1);
  });
  
  const duplicateHeaders = Array.from(headerCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicateHeaders.length > 0) {
    warnings.push(`Duplicate headers found: ${duplicateHeaders.map(([name]) => name).join(', ')}`);
    score -= duplicateHeaders.length * 5;
  }
  
  // Garantir que o score não seja negativo
  score = Math.max(0, score);
  
  return {
    score,
    issues,
    warnings
  };
}

/**
 * Gera relatório detalhado de parsing
 */
export function generateParsingReport(parsedData: ParsedData): string {
  const { metadata } = parsedData;
  
  let report = '=== FILE PARSING REPORT ===\n\n';
  
  // Informações básicas
  report += `FILE TYPE: ${metadata.type.toUpperCase()}\n`;
  report += `ENCODING: ${metadata.encoding}\n`;
  if (metadata.delimiter) {
    report += `DELIMITER: '${metadata.delimiter}'\n`;
  }
  report += `ROWS: ${metadata.rowCount}\n`;
  report += `COLUMNS: ${metadata.columnCount}\n`;
  report += `HEADERS: ${metadata.hasHeaders ? 'Yes' : 'No'}\n`;
  report += `QUALITY SCORE: ${metadata.quality.score}/100\n\n`;
  
  // Estrutura
  report += `STRUCTURE:\n`;
  if (metadata.structure.headerRow !== undefined) {
    report += `- Header row: ${metadata.structure.headerRow + 1}\n`;
  }
  report += `- Data rows: ${metadata.structure.dataStartRow + 1} to ${metadata.structure.dataEndRow + 1}\n`;
  if (metadata.structure.emptyRows.length > 0) {
    report += `- Empty rows: ${metadata.structure.emptyRows.length}\n`;
  }
  report += '\n';
  
  // Colunas
  report += `COLUMNS ANALYSIS:\n`;
  metadata.columns.forEach((col, index) => {
    report += `${index + 1}. ${col.name} (${col.type})\n`;
    report += `   - Null values: ${col.nullCount}/${metadata.rowCount}\n`;
    report += `   - Unique values: ${col.uniqueCount}\n`;
    if (col.samples.length > 0) {
      report += `   - Samples: ${col.samples.slice(0, 3).map(s => JSON.stringify(s)).join(', ')}\n`;
    }
  });
  report += '\n';
  
  // Problemas
  if (metadata.quality.issues.length > 0) {
    report += `ISSUES:\n`;
    metadata.quality.issues.forEach(issue => {
      report += `- ${issue}\n`;
    });
    report += '\n';
  }
  
  // Avisos
  if (metadata.quality.warnings.length > 0) {
    report += `WARNINGS:\n`;
    metadata.quality.warnings.forEach(warning => {
      report += `- ${warning}\n`;
    });
    report += '\n';
  }
  
  // Recomendações
  report += `RECOMMENDATIONS:\n`;
  
  if (metadata.quality.score < 70) {
    report += `- Data quality is below acceptable threshold (${metadata.quality.score}/100)\n`;
  }
  
  if (metadata.quality.issues.length > 0) {
    report += `- Fix ${metadata.quality.issues.length} critical issues before processing\n`;
  }
  
  if (!metadata.hasHeaders) {
    report += `- Consider adding proper column headers\n`;
  }
  
  const emptyColumns = metadata.columns.filter(col => col.nullCount === metadata.rowCount);
  if (emptyColumns.length > 0) {
    report += `- Remove ${emptyColumns.length} empty columns\n`;
  }
  
  if (metadata.quality.score >= 90) {
    report += `- Data quality is excellent! Ready for processing ✅\n`;
  }
  
  return report;
}