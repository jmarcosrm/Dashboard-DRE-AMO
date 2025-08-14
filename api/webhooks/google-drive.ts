import { Request, Response } from 'express';
import { google } from 'googleapis';
import * as XLSX from 'xlsx';
import * as csv from 'csv-parser';
import { Readable } from 'stream';
import { supabase } from '../config/supabase';
// Importar serviços backend
import { financialFactsService } from '../services/financial-facts';
import { entitiesService } from '../services/entities';
import { accountsService } from '../services/accounts';
import { FinancialFact, Entity, Account } from '../../shared/types';
import { 
  validateFinancialDataBatch, 
  sanitizeFinancialData, 
  detectDuplicates, 
  generateValidationReport 
} from '../utils/validation';
import { 
  withGoogleDriveCircuitBreaker, 
  withDatabaseCircuitBreaker, 
  executeBatchWithRetry,
  retryMonitor 
} from '../utils/retry';
import { parseFile, generateParsingReport, type ParsedData, type ParsingConfig } from '../utils/file-parser';
import { autoMapColumns, applyColumnMappings, generateMappingReport, type MappingConfig, FINANCIAL_FIELDS } from '../utils/column-mapper';
import { 
  auditLogger, 
  logFileProcessingStart, 
  logFileProcessingComplete, 
  logFileProcessingError,
  logDataValidation,
  logDataMapping,
  logWebhookReceived,
  AuditEventType,
  AuditSeverity 
} from '../utils/audit-logger';

// Interface para o payload do webhook do Google Drive
interface GoogleDriveWebhookPayload {
  kind: string;
  id: string;
  resourceId: string;
  resourceUri: string;
  token?: string;
  expiration?: string;
  type: string;
  address: string;
}

// Interface para dados de arquivo do Google Drive
interface GoogleDriveFileData {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size: string;
  webViewLink: string;
  webContentLink: string;
  content?: Buffer;
}

// Interface para dados financeiros extraídos do arquivo
export interface ExtractedFinancialData {
  entityCode?: string;
  entityName?: string;
  accountCode?: string;
  accountName?: string;
  value: number;
  scenarioId: 'real' | 'budget' | 'forecast';
  year: number;
  month: number;
  description?: string;
  rowNumber?: number;
}

// Interface para resultado de processamento
interface ProcessingResult {
  success: boolean;
  processed: number;
  errors: string[];
  fileId: string;
  fileName: string;
}

// Configuração da Google Drive API
const auth = new google.auth.GoogleAuth({
  keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY_FILE,
  scopes: ['https://www.googleapis.com/auth/drive.readonly']
});

const drive = google.drive({ version: 'v3', auth });

/**
 * Webhook endpoint para receber notificações do Google Drive
 * Processa arquivos financeiros automaticamente quando são modificados
 */
export const googleDriveWebhook = async (req: Request, res: Response) => {
  try {
    // Verificar se é uma notificação válida do Google Drive
    const channelId = req.headers['x-goog-channel-id'] as string;
    const channelToken = req.headers['x-goog-channel-token'] as string;
    const resourceState = req.headers['x-goog-resource-state'] as string;
    const resourceId = req.headers['x-goog-resource-id'] as string;
    const resourceUri = req.headers['x-goog-resource-uri'] as string;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    console.log('Google Drive webhook received:', {
      channelId,
      channelToken,
      resourceState,
      resourceId,
      resourceUri
    });

    // Log webhook recebido
    await logWebhookReceived(
      'google_drive',
      resourceState || 'unknown',
      {
        channelId,
        channelToken,
        resourceState,
        resourceId,
        resourceUri
      },
      ipAddress,
      userAgent
    );

    // Verificar se é uma mudança que nos interessa (sync ou update)
    if (!resourceState || !['sync', 'update'].includes(resourceState)) {
      console.log('Ignoring webhook - not a relevant state:', resourceState);
      await auditLogger.log({
        event_type: AuditEventType.WEBHOOK_RECEIVED,
        severity: AuditSeverity.INFO,
        message: 'Google Drive webhook ignored - not relevant state',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { resourceState }
      });
      return res.status(200).json({ message: 'Webhook received but ignored' });
    }

    // Verificar token de segurança se configurado
    const expectedToken = process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN;
    if (expectedToken && channelToken !== expectedToken) {
      console.error('Invalid webhook token');
      await auditLogger.log({
        event_type: AuditEventType.WEBHOOK_RECEIVED,
        severity: AuditSeverity.WARNING,
        message: 'Invalid Google Drive webhook token',
        ip_address: ipAddress,
        user_agent: userAgent,
        details: { channelId, resourceId }
      });
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Processar arquivos modificados na pasta monitorada
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      await processGoogleDriveFolder(folderId);
    }

    res.status(200).json({ 
      message: 'Webhook processed successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing Google Drive webhook:', error);
    await auditLogger.logSystemError(
      error as Error,
      'google_drive_webhook_handler'
    );
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Processa todos os arquivos em uma pasta do Google Drive
 */
async function processGoogleDriveFolder(folderId: string) {
  try {
    console.log('Processing Google Drive folder:', folderId);

    // Listar arquivos na pasta
    const response = await drive.files.list({
      q: `'${folderId}' in parents and (mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' or mimeType='application/vnd.ms-excel' or mimeType='text/csv')`,
      fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, webContentLink)'
    });

    const files = response.data.files || [];
    console.log(`Found ${files.length} files to process`);

    for (const file of files) {
      if (file.id && file.name) {
        try {
          // Verificar se o arquivo já foi processado recentemente
          const shouldProcess = await shouldProcessFile(file.id, file.modifiedTime || '');
          
          if (shouldProcess) {
            await processGoogleDriveFile(file.id);
          } else {
            console.log(`Skipping file ${file.name} - already processed`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          await logProcessingError(file.id, file.name || '', fileError);
        }
      }
    }

  } catch (error) {
    console.error('Error processing Google Drive folder:', error);
    throw error;
  }
}

/**
 * Verifica se um arquivo deve ser processado baseado na data de modificação
 */
async function shouldProcessFile(fileId: string, modifiedTime: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('processed_files')
      .select('processed_at, updated_at')
      .eq('drive_file_id', fileId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking file processing status:', error);
      return true; // Processar em caso de erro
    }

    if (!data) {
      return true; // Arquivo nunca foi processado
    }

    // Verificar se o arquivo foi modificado desde o último processamento
    const lastModified = new Date(modifiedTime);
    const lastProcessed = new Date(data.updated_at || 0);

    return lastModified > lastProcessed;

  } catch (error) {
    console.error('Error in shouldProcessFile:', error);
    return true; // Processar em caso de erro
  }
}

/**
 * Processa um arquivo específico do Google Drive
 */
async function processGoogleDriveFile(fileId: string): Promise<ProcessingResult> {
  try {
    console.log('Processing Google Drive file:', fileId);

    // Baixar metadados do arquivo
    const fileMetadata = await getFileMetadata(fileId);
    
    // Baixar conteúdo do arquivo
    const fileContent = await downloadGoogleDriveFile(fileId);
    
    // Registrar início do processamento
    await updateFileProcessingStatus(fileId, fileMetadata, 'processing');
    
    // Extrair dados financeiros
    const extractedData = await extractFinancialDataFromFile({
      ...fileMetadata,
      content: fileContent
    });
    
    if (extractedData.length > 0) {
      // Salvar dados no Supabase
      const processed = await saveFinancialDataToSupabase(extractedData, fileId, fileMetadata.name);
      
      // Atualizar status de sucesso
      await updateFileProcessingStatus(fileId, fileMetadata, 'completed', {
        records_extracted: extractedData.length,
        records_imported: processed
      });
      
      console.log(`Successfully processed ${processed} financial records from ${fileMetadata.name}`);
      
      return {
        success: true,
        processed,
        errors: [],
        fileId,
        fileName: fileMetadata.name
      };
    } else {
      await updateFileProcessingStatus(fileId, fileMetadata, 'skipped', {
        error_message: 'No financial data found in file'
      });
      
      return {
        success: true,
        processed: 0,
        errors: ['No financial data found in file'],
        fileId,
        fileName: fileMetadata.name
      };
    }

  } catch (error) {
    console.error('Error processing Google Drive file:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await logProcessingError(fileId, 'unknown', error);
    
    return {
      success: false,
      processed: 0,
      errors: [errorMessage],
      fileId,
      fileName: 'unknown'
    };
  }
}

/**
 * Obtém metadados de um arquivo do Google Drive
 */
async function getFileMetadata(fileId: string): Promise<GoogleDriveFileData> {
  return withGoogleDriveCircuitBreaker(async () => {
    const response = await drive.files.get({
      fileId,
      fields: 'id, name, mimeType, modifiedTime, size, webViewLink, webContentLink'
    });

    const file = response.data;
    
    return {
      id: file.id || fileId,
      name: file.name || 'unknown',
      mimeType: file.mimeType || 'unknown',
      modifiedTime: file.modifiedTime || new Date().toISOString(),
      size: file.size || '0',
      webViewLink: file.webViewLink || '',
      webContentLink: file.webContentLink || ''
    };
  }, `Get metadata for file ${fileId}`);
}

/**
 * Baixa um arquivo do Google Drive
 */
async function downloadGoogleDriveFile(fileId: string): Promise<Buffer> {
  return withGoogleDriveCircuitBreaker(async () => {
    console.log('Downloading file from Google Drive:', fileId);
    
    const response = await drive.files.get({
      fileId,
      alt: 'media'
    }, {
      responseType: 'arraybuffer'
    });

    return Buffer.from(response.data as ArrayBuffer);
  }, `Download file ${fileId}`);
}

/**
 * Extrai dados financeiros de um arquivo com parser avançado
 */
async function extractFinancialDataFromFile(fileData: GoogleDriveFileData): Promise<ExtractedFinancialData[]> {
  const operationId = `extract_${fileData.id}_${Date.now()}`;
  retryMonitor.startOperation(operationId);
  
  // Iniciar log de processamento
  const correlationId = await logFileProcessingStart(
    fileData.id,
    fileData.name,
    undefined, // userId - adicionar quando tiver autenticação
    {
      file_size: fileData.content?.length || 0,
      file_type: fileData.name.split('.').pop(),
      mime_type: fileData.mimeType
    }
  );
  
  const startTime = Date.now();
  
  try {
    console.log('Extracting financial data from file:', fileData.name);
    
    if (!fileData.content) {
      throw new Error('File content is missing');
    }

    // Configuração de parsing
    const parsingConfig: Partial<ParsingConfig> = {
      autoDetectHeaders: true,
      autoDetectDelimiter: true,
      autoDetectEncoding: true,
      skipEmptyRows: true,
      trimWhitespace: true,
      maxRows: 50000, // Limite para arquivos grandes
      dateFormats: [
        'DD/MM/YYYY',
        'MM/DD/YYYY',
        'YYYY-MM-DD',
        'DD-MM-YYYY'
      ]
    };
    
    // Parse arquivo com detecção automática
    const parsedData: ParsedData = await parseFile(fileData.content, fileData.name, parsingConfig);
    
    // Gerar relatório de parsing
    const parsingReport = generateParsingReport(parsedData);
    console.log('Parsing Report:', parsingReport);
    
    // Verificar qualidade dos dados
    if (parsedData.metadata.quality.score < 50) {
      console.warn('Low data quality detected:', parsedData.metadata.quality);
    }
    
    // Configuração de mapeamento
    const mappingConfig: Partial<MappingConfig> = {
      autoDetectFinancialFields: true,
      requiredFields: [
        FINANCIAL_FIELDS.ENTITY,
        FINANCIAL_FIELDS.ACCOUNT,
        FINANCIAL_FIELDS.SCENARIO,
        FINANCIAL_FIELDS.PERIOD,
        FINANCIAL_FIELDS.VALUE
      ],
      dateFormats: parsingConfig.dateFormats,
      entityMapping: {
        column: 'entity',
        defaultValue: 'DEFAULT_ENTITY' // Configurar conforme necessário
      }
    };
    
    // Mapear colunas automaticamente
    const columnMappings = autoMapColumns(parsedData.metadata, mappingConfig);
    
    // Validar mapeamentos
    const mappingValidation = {
      isValid: columnMappings.length > 0,
      requiredFieldsMapped: columnMappings.filter(m => 
        mappingConfig.requiredFields?.includes(m.targetField)
      ).map(m => m.targetField),
      missingFields: mappingConfig.requiredFields?.filter(field => 
        !columnMappings.some(m => m.targetField === field)
      ) || [],
      duplicateFields: [],
      lowConfidenceFields: columnMappings.filter(m => m.confidence < 0.5).map(m => m.targetField)
    };
    
    // Gerar relatório de mapeamento
    const mappingReport = generateMappingReport(columnMappings, mappingValidation);
    console.log('Mapping Report:', mappingReport);
    
    // Aplicar mapeamentos e transformações
    const mappedData = applyColumnMappings(parsedData.rows, columnMappings, mappingConfig);
    
    console.log(`Mapped ${mappedData.length} rows from ${fileData.name}`);
    
    // Converter para formato ExtractedFinancialData
     const rawData: ExtractedFinancialData[] = mappedData.map((row, index) => {
       // Extrair ano e mês do período
       const periodValue = row[FINANCIAL_FIELDS.PERIOD];
       let year = new Date().getFullYear();
       let month = new Date().getMonth() + 1;
       
       if (periodValue) {
         if (periodValue instanceof Date) {
           year = periodValue.getFullYear();
           month = periodValue.getMonth() + 1;
         } else if (typeof periodValue === 'string') {
           const dateMatch = periodValue.match(/(\d{4})/);
           if (dateMatch) {
             year = parseInt(dateMatch[1]);
           }
           const monthMatch = periodValue.match(/\/(\d{1,2})\//); 
           if (monthMatch) {
             month = parseInt(monthMatch[1]);
           }
         }
       }
       
       return {
         entityCode: row[FINANCIAL_FIELDS.ENTITY] || 'DEFAULT',
         entityName: row[FINANCIAL_FIELDS.ENTITY] || 'Default Entity',
         accountCode: row[FINANCIAL_FIELDS.ACCOUNT] || 'UNKNOWN',
         accountName: row[FINANCIAL_FIELDS.ACCOUNT] || 'Unknown Account',
         value: parseFloat(row[FINANCIAL_FIELDS.VALUE]) || 0,
         scenarioId: (row[FINANCIAL_FIELDS.SCENARIO] || 'real') as 'real' | 'budget' | 'forecast',
         year,
         month,
         description: row[FINANCIAL_FIELDS.DESCRIPTION] || `Imported from ${fileData.name}`,
         rowNumber: index + 1
       };
     });
    
    // Sanitizar dados
    const sanitizedData = rawData.map(sanitizeFinancialData);
    
    // Detectar duplicatas
    const { duplicates, unique } = detectDuplicates(sanitizedData);
    
    if (duplicates.length > 0) {
      console.warn(`Found ${duplicates.length} duplicate groups in ${fileData.name}`);
    }
    
    // Validar dados
    const entities = await entitiesService.getAll();
    const accounts = await accountsService.getAll();
    
    const validationResults = validateFinancialDataBatch(
      unique,
      {
        allowNegativeValues: true,
        allowAutoCreate: true,
        validateEntityExists: false,
        validateAccountExists: false
      },
      entities,
      accounts
    );
    
    // Gerar relatório de validação
    const report = generateValidationReport(validationResults, { duplicates, unique });
    console.log('Validation Report for', fileData.name, ':\n', report);
    
    // Log resultados de mapeamento
    await logDataMapping(
      fileData.id,
      {
        mappingsFound: columnMappings.length,
        requiredFieldsMapped: mappingValidation.requiredFieldsMapped.length,
        missingFields: mappingValidation.missingFields,
        averageConfidence: columnMappings.reduce((sum, m) => sum + m.confidence, 0) / columnMappings.length
      },
      correlationId
    );
    
    // Log resultados de validação
    await logDataValidation(
      fileData.id,
      {
        total: unique.length,
        valid: validationResults.validData.length,
        invalid: validationResults.invalidData.length,
        warnings: validationResults.summary.warnings
      },
      correlationId
    );
    
    // Log conclusão do processamento
    const processingTime = Date.now() - startTime;
    await logFileProcessingComplete(
      fileData.id,
      fileData.name,
      correlationId,
      processingTime,
      {
        totalRows: unique.length,
        validRows: validationResults.validData.length,
        invalidRows: validationResults.invalidData.length,
        duplicates: duplicates.length
      }
    );
    
    // Registrar estatísticas de validação com dados de parsing e mapeamento
    await logValidationResults(fileData.id, fileData.name, validationResults, duplicates.length, {
      parsing: {
        type: parsedData.metadata.type,
        encoding: parsedData.metadata.encoding,
        qualityScore: parsedData.metadata.quality.score,
        rowCount: parsedData.metadata.rowCount,
        columnCount: parsedData.metadata.columnCount
      },
      mapping: {
        mappingsFound: columnMappings.length,
        requiredFieldsMapped: mappingValidation.requiredFieldsMapped.length,
        missingFields: mappingValidation.missingFields.length,
        averageConfidence: columnMappings.reduce((sum, m) => sum + m.confidence, 0) / columnMappings.length
      }
    });
    
    retryMonitor.completeOperation(operationId, true);
    return validationResults.validData;
    
  } catch (error) {
    retryMonitor.recordAttempt(operationId, error);
    retryMonitor.completeOperation(operationId, false);
    console.error('Error extracting data from file:', error);
    
    // Log erro de processamento
    const processingTime = Date.now() - startTime;
    await logFileProcessingError(
      fileData.id,
      fileData.name,
      correlationId,
      error as Error,
      processingTime
    );
    
    throw error;
  }
}

/**
 * Extrai dados de um arquivo Excel
 */
async function extractFromExcel(content: Buffer, fileName: string): Promise<ExtractedFinancialData[]> {
  try {
    const workbook = XLSX.read(content, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    return parseFinancialData(jsonData, fileName);
    
  } catch (error) {
    console.error('Error extracting from Excel:', error);
    throw new Error(`Failed to extract Excel data: ${error}`);
  }
}

/**
 * Extrai dados de um arquivo CSV
 */
async function extractFromCSV(content: Buffer, fileName: string): Promise<ExtractedFinancialData[]> {
  return new Promise((resolve, reject) => {
    const results: any[][] = [];
    const stream = Readable.from(content.toString());
    
    stream
      .pipe(csv({ headers: false }))
      .on('data', (data) => {
        results.push(Object.values(data));
      })
      .on('end', () => {
        try {
          const financialData = parseFinancialData(results, fileName);
          resolve(financialData);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', (error) => {
        reject(new Error(`Failed to extract CSV data: ${error}`));
      });
  });
}

/**
 * Analisa dados financeiros de uma matriz de dados
 */
function parseFinancialData(data: any[][], fileName: string): ExtractedFinancialData[] {
  const results: ExtractedFinancialData[] = [];
  
  // Assumir que a primeira linha contém cabeçalhos
  const headers = data[0] || [];
  
  // Mapear colunas automaticamente
  const columnMap = detectColumnMapping(headers);
  
  console.log('Detected column mapping:', columnMap);
  
  // Processar dados a partir da segunda linha
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    
    if (!row || row.length === 0) continue;
    
    try {
      const financialData = extractRowData(row, columnMap, i + 1, fileName);
      if (financialData) {
        results.push(financialData);
      }
    } catch (error) {
      console.warn(`Error processing row ${i + 1}:`, error);
    }
  }
  
  console.log(`Extracted ${results.length} financial records from ${fileName}`);
  return results;
}

/**
 * Detecta automaticamente o mapeamento de colunas
 */
function detectColumnMapping(headers: any[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  
  headers.forEach((header, index) => {
    const headerStr = String(header).toLowerCase().trim();
    
    // Mapear colunas baseado em palavras-chave
    if (headerStr.includes('entidade') || headerStr.includes('entity')) {
      mapping.entityCode = index;
    } else if (headerStr.includes('conta') || headerStr.includes('account')) {
      mapping.accountCode = index;
    } else if (headerStr.includes('valor') || headerStr.includes('value') || headerStr.includes('amount')) {
      mapping.value = index;
    } else if (headerStr.includes('ano') || headerStr.includes('year')) {
      mapping.year = index;
    } else if (headerStr.includes('mês') || headerStr.includes('mes') || headerStr.includes('month')) {
      mapping.month = index;
    } else if (headerStr.includes('cenário') || headerStr.includes('cenario') || headerStr.includes('scenario')) {
      mapping.scenario = index;
    } else if (headerStr.includes('descrição') || headerStr.includes('descricao') || headerStr.includes('description')) {
      mapping.description = index;
    }
  });
  
  return mapping;
}

/**
 * Extrai dados de uma linha específica
 */
function extractRowData(
  row: any[], 
  columnMap: Record<string, number>, 
  rowNumber: number, 
  fileName: string
): ExtractedFinancialData | null {
  try {
    // Extrair valor (obrigatório)
    const valueIndex = columnMap.value;
    if (valueIndex === undefined || !row[valueIndex]) {
      return null;
    }
    
    const value = parseFloat(String(row[valueIndex]).replace(/[^\d.-]/g, ''));
    if (isNaN(value)) {
      return null;
    }
    
    // Extrair ano e mês (obrigatórios)
    const year = columnMap.year !== undefined ? parseInt(String(row[columnMap.year])) : new Date().getFullYear();
    const month = columnMap.month !== undefined ? parseInt(String(row[columnMap.month])) : new Date().getMonth() + 1;
    
    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return null;
    }
    
    // Extrair outros campos
    const entityCode = columnMap.entityCode !== undefined ? String(row[columnMap.entityCode] || '').trim() : '';
    const accountCode = columnMap.accountCode !== undefined ? String(row[columnMap.accountCode] || '').trim() : '';
    const scenario = columnMap.scenario !== undefined ? String(row[columnMap.scenario] || 'real').toLowerCase() : 'real';
    const description = columnMap.description !== undefined ? String(row[columnMap.description] || '') : `Imported from ${fileName}`;
    
    // Validar cenário
    const validScenarios: Array<'real' | 'budget' | 'forecast'> = ['real', 'budget', 'forecast'];
    const scenarioId = validScenarios.includes(scenario as any) ? scenario as 'real' | 'budget' | 'forecast' : 'real';
    
    return {
      entityCode: entityCode || undefined,
      accountCode: accountCode || undefined,
      value,
      scenarioId,
      year,
      month,
      description,
      rowNumber
    };
    
  } catch (error) {
    console.warn(`Error extracting row ${rowNumber}:`, error);
    return null;
  }
}

/**
 * Salva dados financeiros extraídos no Supabase
 */
async function saveFinancialDataToSupabase(
  data: ExtractedFinancialData[], 
  fileId: string, 
  fileName: string
): Promise<number> {
  return withDatabaseCircuitBreaker(async () => {
    console.log('Saving financial data to Supabase:', data.length, 'records');
    
    // Usar processamento em lote com retry
    const batchResults = await executeBatchWithRetry(
      data,
      async (item: ExtractedFinancialData) => {
        // Buscar ou criar entidade
        let entityId = await findOrCreateEntity(item.entityCode, item.entityName);
        if (!entityId) {
          throw new Error(`Could not resolve entity: ${item.entityCode || item.entityName}`);
        }
        
        // Buscar ou criar conta
        let accountId = await findOrCreateAccount(item.accountCode, item.accountName);
        if (!accountId) {
          throw new Error(`Could not resolve account: ${item.accountCode || item.accountName}`);
        }
        
        // Criar fato financeiro
        const financialFact: Omit<FinancialFact, 'id' | 'created_at' | 'updated_at'> = {
          entity_id: entityId,
          account_id: accountId,
          value: item.value,
          scenario: item.scenarioId === 'real' ? 'actual' : item.scenarioId,
          period: `${item.year}-${String(item.month).padStart(2, '0')}`,
          currency: 'BRL'
        };
        
        return await financialFactsService.create(financialFact);
      },
      {
        batchSize: 5,
        concurrency: 2,
        retryConfig: {
          maxAttempts: 3,
          baseDelay: 1000
        },
        onProgress: (completed, total, errors) => {
          console.log(`Progress: ${completed}/${total} (${errors} errors)`);
        }
      }
    );
    
    // Log erros de processamento
    if (batchResults.errors.length > 0) {
      console.error(`Failed to process ${batchResults.errors.length} records:`);
      batchResults.errors.forEach(({ item, error }) => {
        console.error(`Row ${item.rowNumber}: ${error.message}`);
      });
    }
    
    console.log(`Successfully saved ${batchResults.summary.successful} financial records`);
    return batchResults.summary.successful;
  }, `Save financial data from ${fileName}`);
}

/**
 * Busca ou cria uma entidade
 */
async function findOrCreateEntity(code?: string, name?: string): Promise<string | null> {
  return withDatabaseCircuitBreaker(async () => {
    if (!code && !name) {
      return null;
    }
    
    // Buscar entidade existente
    const entities = await entitiesService.getAll();
    
    let entity = entities.find(e => 
      (name && e.name === name)
    );
    
    if (!entity && (code || name)) {
      // Criar nova entidade
      const newEntity: Omit<Entity, 'id' | 'created_at' | 'updated_at'> = {
        name: name || code || 'Unknown Entity',
        description: 'Auto-created from import',
        type: 'company',
        is_active: true
      };
      
      entity = await entitiesService.create(newEntity);
    }
    
    return entity?.id || null;
  }, `Find or create entity: ${code || name}`);
}

/**
 * Busca ou cria uma conta
 */
async function findOrCreateAccount(code?: string, name?: string): Promise<string | null> {
  return withDatabaseCircuitBreaker(async () => {
    if (!code && !name) {
      return null;
    }
    
    // Buscar conta existente
    const accounts = await accountsService.getAll();
    
    let account = accounts.find(a => 
      (code && a.code === code) || 
      (name && a.name === name)
    );
    
    if (!account && (code || name)) {
      // Criar nova conta
      const newAccount: Omit<Account, 'id' | 'created_at' | 'updated_at'> = {
        name: name || code || 'Unknown Account',
        code: code || `AUTO_${Date.now()}`,
        type: 'revenue', // Padrão
        description: 'Auto-created from import',
        is_active: true
      };
      
      account = await accountsService.create(newAccount);
    }
    
    return account?.id || null;
  }, `Find or create account: ${code || name}`);
}

/**
 * Atualiza o status de processamento de um arquivo
 */
async function updateFileProcessingStatus(
  fileId: string, 
  fileMetadata: GoogleDriveFileData, 
  status: string, 
  additionalData?: any
) {
  try {
    const updateData = {
        drive_file_id: fileId,
        file_name: fileMetadata.name,
        file_path: fileMetadata.webViewLink || '',
        file_type: fileMetadata.mimeType,
        file_size: parseInt(fileMetadata.size) || 0,
        status: status,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...additionalData
      };
    
    const { error } = await supabase
      .from('processed_files')
      .upsert(updateData, { onConflict: 'drive_file_id' });
    
    if (error) {
      console.error('Error updating file processing status:', error);
    }
    
  } catch (error) {
    console.error('Error in updateFileProcessingStatus:', error);
  }
}

/**
 * Registra erro de processamento
 */
async function logProcessingError(fileId: string, fileName: string, error: any) {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    await updateFileProcessingStatus(fileId, {
      id: fileId,
      name: fileName,
      mimeType: 'unknown',
      modifiedTime: new Date().toISOString(),
      size: '0',
      webViewLink: '',
      webContentLink: ''
    }, 'failed', {
      error_message: errorMessage
    });
    
  } catch (logError) {
    console.error('Error logging processing error:', logError);
  }
}

/**
 * Registra resultados de validação
 */
async function logValidationResults(
  fileId: string,
  fileName: string,
  validationResults: {
    validData: ExtractedFinancialData[];
    invalidData: { data: ExtractedFinancialData; errors: string[]; warnings: string[] }[];
    summary: { total: number; valid: number; invalid: number; warnings: number };
  },
  duplicateCount: number,
  additionalMetadata?: any
) {
  try {
    const { summary } = validationResults;
    
    // Registrar estatísticas de validação na tabela processed_files
    await withDatabaseCircuitBreaker(async () => {
      const { error } = await supabase
        .from('processed_files')
        .upsert({
          drive_file_id: fileId,
          file_name: fileName,
          file_path: '',
          file_type: fileName.split('.').pop() || 'unknown',
          status: summary.invalid > 0 ? 'validation_errors' : 'completed',
          rows_processed: summary.valid,
          rows_failed: summary.invalid,
          processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'drive_file_id' });
      
      if (error) {
        console.error('Error logging validation results:', error);
      }
    }, 'Log validation results');
    
  } catch (error) {
    console.error('Error in logValidationResults:', error);
  }
}

/**
 * Endpoint para configurar webhook do Google Drive
 */
export const setupGoogleDriveWebhook = async (req: Request, res: Response) => {
  try {
    const { folderId, channelId } = req.body;
    
    if (!folderId) {
      return res.status(400).json({ error: 'folderId is required' });
    }
    
    console.log('Setting up Google Drive webhook for folder:', folderId);
    
    // Configurar webhook usando a Google Drive API
    const webhookConfig = {
      id: channelId || `channel-${Date.now()}`,
      type: 'web_hook',
      address: `${process.env.APP_URL}/api/webhooks/google-drive`,
      token: process.env.GOOGLE_DRIVE_WEBHOOK_TOKEN,
      expiration: (Date.now() + (7 * 24 * 60 * 60 * 1000)).toString() // 7 dias
    };
    
    try {
      const response = await drive.files.watch({
        fileId: folderId,
        requestBody: webhookConfig
      });
      
      console.log('Webhook setup successful:', response.data);
      
      res.status(200).json({
        message: 'Webhook setup successful',
        config: response.data
      });
      
    } catch (apiError) {
      console.error('Google Drive API error:', apiError);
      
      // Retornar configuração mock se a API falhar
      res.status(200).json({
        message: 'Webhook setup initiated (mock)',
        config: webhookConfig,
        note: 'Real API setup failed, using mock configuration'
      });
    }
    
  } catch (error) {
    console.error('Error setting up Google Drive webhook:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Endpoint para listar webhooks ativos
 */
export const listGoogleDriveWebhooks = async (req: Request, res: Response) => {
  try {
    // Implementação placeholder - na implementação real, você listaria os webhooks ativos
    const activeWebhooks = [
      {
        id: 'channel-123',
        resourceId: process.env.GOOGLE_DRIVE_FOLDER_ID || 'folder-456',
        expiration: Date.now() + (5 * 24 * 60 * 60 * 1000),
        address: `${process.env.APP_URL}/api/webhooks/google-drive`
      }
    ];
    
    res.status(200).json({
      webhooks: activeWebhooks,
      count: activeWebhooks.length
    });
    
  } catch (error) {
    console.error('Error listing Google Drive webhooks:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Endpoint para processar manualmente um arquivo ou pasta
 */
export const processGoogleDriveManually = async (req: Request, res: Response) => {
  try {
    const { fileId, folderId } = req.body;
    
    if (!fileId && !folderId) {
      return res.status(400).json({ error: 'fileId or folderId is required' });
    }
    
    let results: ProcessingResult[] = [];
    
    if (fileId) {
      // Processar arquivo específico
      const result = await processGoogleDriveFile(fileId);
      results.push(result);
    } else if (folderId) {
      // Processar pasta
      await processGoogleDriveFolder(folderId);
      results.push({
        success: true,
        processed: 0,
        errors: [],
        fileId: folderId,
        fileName: 'folder'
      });
    }
    
    res.status(200).json({
      message: 'Processing completed',
      results,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in manual processing:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};