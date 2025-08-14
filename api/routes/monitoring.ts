import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { withDatabaseCircuitBreaker } from '../utils/database-circuit-breaker.js';
import { auditLogger, getAuditLogs, getAuditStatistics, cleanupOldAuditLogs, AuditEventType, AuditSeverity } from '../utils/audit-logger';

const router = Router();

// Interface para estatísticas de processamento
interface ProcessingStats {
  totalFiles: number;
  successfulFiles: number;
  failedFiles: number;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  averageProcessingTime: number;
  lastProcessedAt: string | null;
}

// Interface para estatísticas de sistema
interface SystemStats {
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: NodeJS.CpuUsage;
  activeConnections: number;
  errorRate: number;
}

// Obter estatísticas gerais de processamento
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await withDatabaseCircuitBreaker(async () => {
      // Estatísticas de arquivos processados
      const { data: fileStats } = await supabase
        .from('processed_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (!fileStats) {
        throw new Error('Failed to fetch file statistics');
      }

      const totalFiles = fileStats.length;
      const successfulFiles = fileStats.filter(f => f.status === 'completed').length;
      const failedFiles = fileStats.filter(f => f.status === 'failed').length;
      
      const totalRows = fileStats.reduce((sum, f) => sum + (f.rows_processed || 0) + (f.rows_failed || 0), 0);
      const validRows = fileStats.reduce((sum, f) => sum + (f.rows_processed || 0), 0);
      const invalidRows = fileStats.reduce((sum, f) => sum + (f.rows_failed || 0), 0);
      const duplicateRows = 0; // Não disponível na estrutura atual
      
      // Tempo de processamento não está disponível na estrutura atual
      const averageProcessingTime = 0;

      const lastProcessedAt = fileStats.length > 0 ? fileStats[0].created_at : null;

      return {
        totalFiles,
        successfulFiles,
        failedFiles,
        totalRows,
        validRows,
        invalidRows,
        duplicateRows,
        averageProcessingTime,
        lastProcessedAt
      } as ProcessingStats;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error fetching processing stats:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_stats');
    res.status(500).json({ error: 'Failed to fetch processing statistics' });
  }
});

// Obter estatísticas do sistema
router.get('/system', async (req: Request, res: Response) => {
  try {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calcular taxa de erro das últimas 24 horas
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const auditStats = await getAuditStatistics({
      startDate: yesterday,
      endDate: new Date(),
      eventTypes: ['SYSTEM_ERROR', 'FILE_PROCESSING_ERROR']
    });
    
    const totalEvents = auditStats.total_events;
    const errorEvents = (auditStats.events_by_type['SYSTEM_ERROR'] || 0) + (auditStats.events_by_type['FILE_PROCESSING_ERROR'] || 0);
    const errorRate = totalEvents > 0 ? (errorEvents / totalEvents) * 100 : 0;

    const systemStats: SystemStats = {
      uptime,
      memoryUsage,
      cpuUsage,
      activeConnections: 0, // Implementar se necessário
      errorRate
    };

    res.json(systemStats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_system_stats');
    res.status(500).json({ error: 'Failed to fetch system statistics' });
  }
});

// Obter logs de auditoria
router.get('/audit-logs', async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      eventType,
      startDate,
      endDate,
      userId,
      correlationId
    } = req.query;

    const filters: any = {};
    
    if (severity) filters.severity = severity;
    if (eventType) filters.eventType = eventType;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (userId) filters.userId = userId;
    if (correlationId) filters.correlationId = correlationId;

    const logs = await getAuditLogs({
      ...filters,
      page: parseInt(page as string),
      limit: parseInt(limit as string)
    });

    res.json(logs);
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_audit_logs');
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Obter estatísticas de auditoria
router.get('/audit-stats', async (req: Request, res: Response) => {
  try {
    const {
      startDate,
      endDate,
      eventTypes,
      severities
    } = req.query;

    const filters: any = {};
    
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (eventTypes) filters.eventTypes = (eventTypes as string).split(',');
    if (severities) filters.severities = (severities as string).split(',');

    const stats = await getAuditStatistics(filters);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching audit statistics:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_audit_stats');
    res.status(500).json({ error: 'Failed to fetch audit statistics' });
  }
});

// Obter arquivos processados recentemente
router.get('/recent-files', async (req: Request, res: Response) => {
  try {
    const { limit = 20 } = req.query;

    const files = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('processed_files')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string));

      if (error) throw error;
      return data;
    });

    res.json(files);
  } catch (error) {
    console.error('Error fetching recent files:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_recent_files');
    res.status(500).json({ error: 'Failed to fetch recent files' });
  }
});

// Obter detalhes de um arquivo específico
router.get('/files/:fileId', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.params;

    const fileDetails = await withDatabaseCircuitBreaker(async () => {
      // Buscar dados do arquivo
      const { data: fileData, error: fileError } = await supabase
        .from('processed_files')
        .select('*')
        .eq('drive_file_id', fileId)
        .single();

      if (fileError) throw fileError;

      // Buscar logs relacionados
      const logs = await getAuditLogs({
        limit: 100
      });

      return {
        file: fileData,
        logs: logs.data
      };
    });

    res.json(fileDetails);
  } catch (error) {
    console.error('Error fetching file details:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_file_details');
    res.status(500).json({ error: 'Failed to fetch file details' });
  }
});

// Limpar logs antigos
router.delete('/cleanup', async (req: Request, res: Response) => {
  try {
    const { days = 30 } = req.query;
    
    const result = await cleanupOldAuditLogs(parseInt(days as string));
    
    await auditLogger.log({
      event_type: AuditEventType.SYSTEM_MAINTENANCE,
      severity: AuditSeverity.INFO,
      message: `Audit logs cleanup completed`,
      details: { 
        daysOld: days,
        deletedCount: result
      }
    });

    res.json({
      message: 'Cleanup completed successfully',
      deletedCount: result
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    await auditLogger.logSystemError(error as Error, 'monitoring_cleanup');
    res.status(500).json({ error: 'Failed to cleanup logs' });
  }
});

// Health check endpoint
router.get('/health', async (req: Request, res: Response) => {
  try {
    // Verificar conexão com Supabase
    const { data, error } = await supabase
      .from('processed_files')
      .select('count')
      .limit(1);

    if (error) {
      throw new Error(`Database connection failed: ${error.message}`);
    }

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'connected',
      memory: process.memoryUsage(),
      version: process.version
    };

    res.json(health);
  } catch (error) {
    console.error('Health check failed:', error);
    
    const health = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: 'disconnected',
      error: (error as Error).message,
      memory: process.memoryUsage(),
      version: process.version
    };

    res.status(503).json(health);
  }
});

export default router;