import { supabase } from '../config/supabase';
import { withDatabaseCircuitBreaker } from './database-circuit-breaker.js';

// Tipos de eventos de auditoria
export enum AuditEventType {
  FILE_UPLOAD = 'file_upload',
  FILE_PROCESSING_START = 'file_processing_start',
  FILE_PROCESSING_COMPLETE = 'file_processing_complete',
  FILE_PROCESSING_ERROR = 'file_processing_error',
  DATA_VALIDATION = 'data_validation',
  DATA_MAPPING = 'data_mapping',
  DATA_IMPORT = 'data_import',
  DATA_EXPORT = 'data_export',
  CONFIG_CHANGE = 'config_change',
  USER_ACTION = 'user_action',
  SYSTEM_ERROR = 'system_error',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  WEBHOOK_RECEIVED = 'webhook_received',
  INTEGRATION_SYNC = 'integration_sync'
}

// Níveis de severidade
export enum AuditSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Interface para entrada de auditoria
export interface AuditLogEntry {
  event_type: AuditEventType;
  severity: AuditSeverity;
  message: string;
  details?: any;
  user_id?: string;
  session_id?: string;
  file_id?: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  duration_ms?: number;
  metadata?: {
    source?: string;
    version?: string;
    environment?: string;
    correlation_id?: string;
    [key: string]: any;
  };
}

// Interface para filtros de consulta
export interface AuditQueryFilters {
  event_types?: AuditEventType[];
  severity?: AuditSeverity[];
  user_id?: string;
  file_id?: string;
  entity_id?: string;
  start_date?: string;
  end_date?: string;
  search_text?: string;
  limit?: number;
  offset?: number;
}

// Interface para estatísticas de auditoria
export interface AuditStatistics {
  total_events: number;
  events_by_type: { [key in AuditEventType]?: number };
  events_by_severity: { [key in AuditSeverity]?: number };
  events_by_hour: { hour: string; count: number }[];
  top_users: { user_id: string; count: number }[];
  top_files: { file_id: string; file_name?: string; count: number }[];
  error_rate: number;
  average_processing_time: number;
}

/**
 * Logger de auditoria principal
 */
export class AuditLogger {
  private static instance: AuditLogger;
  private batchQueue: AuditLogEntry[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_TIMEOUT = 5000; // 5 segundos

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): AuditLogger {
    if (!AuditLogger.instance) {
      AuditLogger.instance = new AuditLogger();
    }
    return AuditLogger.instance;
  }

  /**
   * Registra um evento de auditoria
   */
  public async log(entry: AuditLogEntry): Promise<void> {
    try {
      // Enriquecer entrada com dados padrão
      const enrichedEntry: AuditLogEntry = {
        ...entry,
        metadata: {
          source: 'financial_data_system',
          version: '1.0.0',
          environment: process.env.NODE_ENV || 'development',
          timestamp: new Date().toISOString(),
          ...entry.metadata
        }
      };

      // Adicionar à fila de lote
      this.batchQueue.push(enrichedEntry);

      // Processar lote se atingiu o tamanho máximo
      if (this.batchQueue.length >= this.BATCH_SIZE) {
        await this.flushBatch();
      } else {
        // Configurar timer para processar lote
        this.scheduleBatchFlush();
      }
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Em caso de erro, tentar log direto
      await this.logDirect(entry);
    }
  }

  /**
   * Log direto sem batching (para casos de erro)
   */
  private async logDirect(entry: AuditLogEntry): Promise<void> {
    try {
      await withDatabaseCircuitBreaker(async () => {
        return await supabase
          .from('audit_logs')
          .insert({
            event_type: entry.event_type,
            severity: entry.severity,
            message: entry.message,
            details: entry.details,
            user_id: entry.user_id,
            session_id: entry.session_id,
            file_id: entry.file_id,
            entity_id: entry.entity_id,
            ip_address: entry.ip_address,
            user_agent: entry.user_agent,
            duration_ms: entry.duration_ms,
            metadata: entry.metadata,
            created_at: new Date().toISOString()
          });
      });
    } catch (error) {
      console.error('Failed to log audit entry directly:', error);
    }
  }

  /**
   * Agenda o flush do lote
   */
  private scheduleBatchFlush(): void {
    if (this.batchTimer) {
      return; // Timer já agendado
    }

    this.batchTimer = setTimeout(async () => {
      await this.flushBatch();
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Processa o lote de entradas
   */
  private async flushBatch(): Promise<void> {
    if (this.batchQueue.length === 0) {
      return;
    }

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    try {
      await withDatabaseCircuitBreaker(async () => {
        const insertData = batch.map(entry => ({
          event_type: entry.event_type,
          severity: entry.severity,
          message: entry.message,
          details: entry.details,
          user_id: entry.user_id,
          session_id: entry.session_id,
          file_id: entry.file_id,
          entity_id: entry.entity_id,
          ip_address: entry.ip_address,
          user_agent: entry.user_agent,
          duration_ms: entry.duration_ms,
          metadata: entry.metadata,
          created_at: new Date().toISOString()
        }));

        return await supabase
          .from('audit_logs')
          .insert(insertData);
      });

      console.log(`Flushed ${batch.length} audit entries`);
    } catch (error) {
      console.error('Error flushing audit batch:', error);
      // Recolocar entradas na fila para tentar novamente
      this.batchQueue.unshift(...batch);
    }
  }

  /**
   * Força o flush de todas as entradas pendentes
   */
  public async flush(): Promise<void> {
    await this.flushBatch();
  }

  /**
   * Registra início de processamento de arquivo
   */
  public async logFileProcessingStart(
    fileId: string,
    fileName: string,
    userId?: string,
    metadata?: any
  ): Promise<string> {
    const correlationId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.log({
      event_type: AuditEventType.FILE_PROCESSING_START,
      severity: AuditSeverity.INFO,
      message: `Started processing file: ${fileName}`,
      file_id: fileId,
      user_id: userId,
      metadata: {
        correlation_id: correlationId,
        file_name: fileName,
        ...metadata
      }
    });

    return correlationId;
  }

  /**
   * Registra conclusão de processamento de arquivo
   */
  public async logFileProcessingComplete(
    fileId: string,
    fileName: string,
    correlationId: string,
    processingTimeMs: number,
    results: {
      totalRows: number;
      validRows: number;
      invalidRows: number;
      duplicates: number;
    },
    userId?: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.FILE_PROCESSING_COMPLETE,
      severity: AuditSeverity.INFO,
      message: `Completed processing file: ${fileName}`,
      file_id: fileId,
      user_id: userId,
      duration_ms: processingTimeMs,
      details: results,
      metadata: {
        correlation_id: correlationId,
        file_name: fileName,
        success_rate: results.totalRows > 0 ? (results.validRows / results.totalRows) * 100 : 0
      }
    });
  }

  /**
   * Registra erro de processamento de arquivo
   */
  public async logFileProcessingError(
    fileId: string,
    fileName: string,
    correlationId: string,
    error: Error,
    processingTimeMs?: number,
    userId?: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.FILE_PROCESSING_ERROR,
      severity: AuditSeverity.ERROR,
      message: `Error processing file: ${fileName} - ${error.message}`,
      file_id: fileId,
      user_id: userId,
      duration_ms: processingTimeMs,
      details: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack
      },
      metadata: {
        correlation_id: correlationId,
        file_name: fileName
      }
    });
  }

  /**
   * Registra validação de dados
   */
  public async logDataValidation(
    fileId: string,
    validationResults: {
      total: number;
      valid: number;
      invalid: number;
      warnings: number;
    },
    correlationId?: string,
    userId?: string
  ): Promise<void> {
    const severity = validationResults.invalid > 0 ? AuditSeverity.WARNING : AuditSeverity.INFO;
    
    await this.log({
      event_type: AuditEventType.DATA_VALIDATION,
      severity,
      message: `Data validation completed: ${validationResults.valid}/${validationResults.total} valid rows`,
      file_id: fileId,
      user_id: userId,
      details: validationResults,
      metadata: {
        correlation_id: correlationId,
        validation_rate: validationResults.total > 0 ? (validationResults.valid / validationResults.total) * 100 : 0
      }
    });
  }

  /**
   * Registra mapeamento de dados
   */
  public async logDataMapping(
    fileId: string,
    mappingResults: {
      mappingsFound: number;
      requiredFieldsMapped: number;
      missingFields: string[];
      averageConfidence: number;
    },
    correlationId?: string,
    userId?: string
  ): Promise<void> {
    const severity = mappingResults.missingFields.length > 0 ? AuditSeverity.WARNING : AuditSeverity.INFO;
    
    await this.log({
      event_type: AuditEventType.DATA_MAPPING,
      severity,
      message: `Data mapping completed: ${mappingResults.mappingsFound} mappings found`,
      file_id: fileId,
      user_id: userId,
      details: mappingResults,
      metadata: {
        correlation_id: correlationId
      }
    });
  }

  /**
   * Registra webhook recebido
   */
  public async logWebhookReceived(
    source: string,
    eventType: string,
    payload: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.WEBHOOK_RECEIVED,
      severity: AuditSeverity.INFO,
      message: `Webhook received from ${source}: ${eventType}`,
      ip_address: ipAddress,
      user_agent: userAgent,
      details: {
        source,
        event_type: eventType,
        payload_size: JSON.stringify(payload).length
      },
      metadata: {
        webhook_source: source
      }
    });
  }

  /**
   * Registra ação do usuário
   */
  public async logUserAction(
    action: string,
    userId: string,
    details?: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.USER_ACTION,
      severity: AuditSeverity.INFO,
      message: `User action: ${action}`,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      details
    });
  }

  /**
   * Registra erro do sistema
   */
  public async logSystemError(
    error: Error,
    context?: string,
    userId?: string,
    additionalDetails?: any
  ): Promise<void> {
    await this.log({
      event_type: AuditEventType.SYSTEM_ERROR,
      severity: AuditSeverity.ERROR,
      message: `System error${context ? ` in ${context}` : ''}: ${error.message}`,
      user_id: userId,
      details: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack,
        context,
        ...additionalDetails
      }
    });
  }
}

/**
 * Instância singleton do logger
 */
export const auditLogger = AuditLogger.getInstance();

/**
 * Funções de conveniência para logging
 */
export const logFileProcessingStart = auditLogger.logFileProcessingStart.bind(auditLogger);
export const logFileProcessingComplete = auditLogger.logFileProcessingComplete.bind(auditLogger);
export const logFileProcessingError = auditLogger.logFileProcessingError.bind(auditLogger);
export const logDataValidation = auditLogger.logDataValidation.bind(auditLogger);
export const logDataMapping = auditLogger.logDataMapping.bind(auditLogger);
export const logWebhookReceived = auditLogger.logWebhookReceived.bind(auditLogger);
export const logUserAction = auditLogger.logUserAction.bind(auditLogger);
export const logSystemError = auditLogger.logSystemError.bind(auditLogger);

/**
 * Consultar logs de auditoria
 */
export async function getAuditLogs(filters: AuditQueryFilters = {}): Promise<{ data: any[]; total: number }> {
  const logs = await queryAuditLogs(filters);
  return { data: logs, total: logs.length };
}

/**
 * Consultar logs de auditoria (função interna)
 */
export async function queryAuditLogs(filters: AuditQueryFilters = {}): Promise<any[]> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (filters.event_types && filters.event_types.length > 0) {
      query = query.in('event_type', filters.event_types);
    }

    // Remover filtro de severity temporariamente para evitar tipo infinito
    // TODO: Implementar filtro de severity corretamente
    // if (filters.severity && filters.severity.length > 0) {
    //   query = query.in('severity', filters.severity);
    // }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    if (filters.file_id) {
      query = query.eq('file_id', filters.file_id);
    }

    if (filters.entity_id) {
      query = query.eq('entity_id', filters.entity_id);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    if (filters.search_text) {
      query = query.ilike('message', `%${filters.search_text}%`);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await query;
    });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error querying audit logs:', error);
    throw error;
  }
}

/**
 * Obter estatísticas de auditoria
 */
export async function getAuditStatistics(
  filters: {
    startDate?: Date;
    endDate?: Date;
    eventTypes?: string[];
    severities?: string[];
  } = {}
): Promise<AuditStatistics> {
  try {
    let query = supabase
      .from('audit_logs')
      .select('event_type, severity, duration_ms, created_at');

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await query;
    });

    if (error) {
      throw error;
    }

    const logs = data || [];

    // Calcular estatísticas
    const eventsByType: { [key in AuditEventType]?: number } = {};
    const eventsBySeverity: { [key in AuditSeverity]?: number } = {};
    const eventsByHour: { [key: string]: number } = {};
    let totalDuration = 0;
    let durationCount = 0;
    let errorCount = 0;

    logs.forEach(log => {
      // Contar por tipo
      eventsByType[log.event_type as AuditEventType] = 
        (eventsByType[log.event_type as AuditEventType] || 0) + 1;

      // Contar por severidade
      eventsBySeverity[log.severity as AuditSeverity] = 
        (eventsBySeverity[log.severity as AuditSeverity] || 0) + 1;

      // Contar por hora
      const hour = new Date(log.created_at).toISOString().slice(0, 13) + ':00:00';
      eventsByHour[hour] = (eventsByHour[hour] || 0) + 1;

      // Calcular duração média
      if (log.duration_ms) {
        totalDuration += log.duration_ms;
        durationCount++;
      }

      // Contar erros
      if (log.severity === AuditSeverity.ERROR || log.severity === AuditSeverity.CRITICAL) {
        errorCount++;
      }
    });

    const eventsByHourArray = Object.entries(eventsByHour)
      .map(([hour, count]) => ({ hour, count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));

    return {
      total_events: logs.length,
      events_by_type: eventsByType,
      events_by_severity: eventsBySeverity,
      events_by_hour: eventsByHourArray,
      top_users: [], // TODO: Implementar consulta específica
      top_files: [], // TODO: Implementar consulta específica
      error_rate: logs.length > 0 ? (errorCount / logs.length) * 100 : 0,
      average_processing_time: durationCount > 0 ? totalDuration / durationCount : 0
    };
  } catch (error) {
    console.error('Error getting audit statistics:', error);
    throw error;
  }
}

/**
 * Limpar logs antigos (manutenção)
 */
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<number> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('audit_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString())
        .select('id');
    });

    if (error) {
      throw error;
    }

    const deletedCount = data?.length || 0;
    console.log(`Cleaned up ${deletedCount} old audit log entries`);
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up old audit logs:', error);
    throw error;
  }
}