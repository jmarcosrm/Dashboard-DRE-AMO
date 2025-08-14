import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
// Importar serviços backend
import { entitiesService } from '../services/entities';
import { accountsService } from '../services/accounts';
import { financialFactsService } from '../services/financial-facts';
import { Entity, Account, FinancialFact } from '../../shared/types';

// Interface para dados de entrada do N8N
interface N8NWebhookPayload {
  workflowId: string;
  executionId: string;
  data: any;
  timestamp: string;
  source: string;
}

// Interface para dados financeiros do N8N
interface N8NFinancialData {
  entityCode?: string;
  entityName?: string;
  accountCode?: string;
  accountName?: string;
  value: number;
  scenarioId: 'real' | 'budget' | 'forecast';
  year: number;
  month: number;
  description?: string;
  source: string;
}

// Interface para resposta de processamento
interface ProcessingResult {
  success: boolean;
  processed: number;
  errors: string[];
  data?: any;
}

/**
 * Webhook endpoint para receber dados do N8N
 * Processa dados financeiros enviados por workflows do N8N
 */
export const n8nWebhook = async (req: Request, res: Response) => {
  try {
    const payload: N8NWebhookPayload = req.body;
    
    console.log('N8N webhook received:', {
      workflowId: payload.workflowId,
      executionId: payload.executionId,
      source: payload.source,
      timestamp: payload.timestamp
    });

    // Verificar se o payload contém dados válidos
    if (!payload.data) {
      return res.status(400).json({ 
        error: 'No data provided in webhook payload' 
      });
    }

    // Verificar token de segurança se configurado
    const authHeader = req.headers.authorization;
    const expectedToken = process.env.N8N_WEBHOOK_TOKEN;
    
    if (expectedToken) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' });
      }
      
      const token = authHeader.substring(7);
      if (token !== expectedToken) {
        return res.status(401).json({ error: 'Invalid webhook token' });
      }
    }

    // Processar os dados baseado no tipo de workflow
    let result: ProcessingResult;
    
    switch (payload.source) {
      case 'financial-import':
        result = await processFinancialImport(payload.data);
        break;
      case 'entity-sync':
        result = await processEntitySync(payload.data);
        break;
      case 'account-sync':
        result = await processAccountSync(payload.data);
        break;
      default:
        result = await processGenericData(payload.data);
    }

    // Registrar o processamento no log
    await logN8NProcessing({
      workflowId: payload.workflowId,
      executionId: payload.executionId,
      source: payload.source,
      result,
      timestamp: new Date().toISOString()
    });

    res.status(200).json({
      message: 'N8N webhook processed successfully',
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing N8N webhook:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Processa importação de dados financeiros do N8N
 */
async function processFinancialImport(data: N8NFinancialData[]): Promise<ProcessingResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    console.log('Processing financial import from N8N:', data.length, 'records');

    for (const item of data) {
      try {
        // Validar dados obrigatórios
        if (!item.value || !item.year || !item.month) {
          errors.push(`Invalid financial data: missing required fields`);
          continue;
        }

        // Buscar ou criar entidade
        let entityId = await findOrCreateEntity(item.entityCode, item.entityName);
        if (!entityId) {
          errors.push(`Could not find or create entity: ${item.entityCode || item.entityName}`);
          continue;
        }

        // Buscar ou criar conta
        let accountId = await findOrCreateAccount(item.accountCode, item.accountName);
        if (!accountId) {
          errors.push(`Could not find or create account: ${item.accountCode || item.accountName}`);
          continue;
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

        await financialFactsService.create(financialFact);
        processed++;

      } catch (itemError) {
        console.error('Error processing financial item:', itemError);
        errors.push(`Error processing item: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };

  } catch (error) {
    console.error('Error in processFinancialImport:', error);
    return {
      success: false,
      processed,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Processa sincronização de entidades do N8N
 */
async function processEntitySync(data: any[]): Promise<ProcessingResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    console.log('Processing entity sync from N8N:', data.length, 'records');

    for (const item of data) {
      try {
        if (!item.name || !item.code) {
          errors.push('Invalid entity data: missing name or code');
          continue;
        }

        const entity: Omit<Entity, 'id' | 'created_at' | 'updated_at'> = {
          name: item.name,
          description: item.description || 'Synced from N8N',
          type: item.type || 'company',
          is_active: item.isActive !== false
        };

        await entitiesService.create(entity);
        processed++;

      } catch (itemError) {
        console.error('Error processing entity item:', itemError);
        errors.push(`Error processing entity: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };

  } catch (error) {
    console.error('Error in processEntitySync:', error);
    return {
      success: false,
      processed,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Processa sincronização de contas do N8N
 */
async function processAccountSync(data: any[]): Promise<ProcessingResult> {
  const errors: string[] = [];
  let processed = 0;

  try {
    console.log('Processing account sync from N8N:', data.length, 'records');

    for (const item of data) {
      try {
        if (!item.name || !item.code) {
          errors.push('Invalid account data: missing name or code');
          continue;
        }

        const account: Omit<Account, 'id' | 'created_at' | 'updated_at'> = {
          name: item.name,
          code: item.code,
          type: item.type || 'revenue',
          description: item.description || 'Synced from N8N',
          is_active: item.isActive !== false
        };

        await accountsService.create(account);
        processed++;

      } catch (itemError) {
        console.error('Error processing account item:', itemError);
        errors.push(`Error processing account: ${itemError instanceof Error ? itemError.message : 'Unknown error'}`);
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors
    };

  } catch (error) {
    console.error('Error in processAccountSync:', error);
    return {
      success: false,
      processed,
      errors: [...errors, error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Processa dados genéricos do N8N
 */
async function processGenericData(data: any): Promise<ProcessingResult> {
  try {
    console.log('Processing generic data from N8N:', data);
    
    // Implementação básica para dados genéricos
    // Você pode expandir isso baseado nas suas necessidades específicas
    
    return {
      success: true,
      processed: 1,
      errors: [],
      data
    };

  } catch (error) {
    console.error('Error in processGenericData:', error);
    return {
      success: false,
      processed: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

/**
 * Busca ou cria uma entidade baseada no código ou nome
 */
async function findOrCreateEntity(code?: string, name?: string): Promise<string | null> {
  try {
    if (!code && !name) return null;

    // Primeiro, tentar encontrar a entidade existente
    const entities = await entitiesService.getAll();
    
    let entity = entities.find(e => 
      (name && e.name === name)
    );

    if (entity) {
      return entity.id;
    }

    // Se não encontrou, criar nova entidade
    if (code && name) {
      const newEntity: Omit<Entity, 'id' | 'created_at' | 'updated_at'> = {
        name,
        description: 'Auto-created from N8N',
        type: 'company',
        is_active: true
      };

      const created = await entitiesService.create(newEntity);
      return created.id;
    }

    return null;

  } catch (error) {
    console.error('Error in findOrCreateEntity:', error);
    return null;
  }
}

/**
 * Busca ou cria uma conta baseada no código ou nome
 */
async function findOrCreateAccount(code?: string, name?: string): Promise<string | null> {
  try {
    if (!code && !name) return null;

    // Primeiro, tentar encontrar a conta existente
    const accounts = await accountsService.getAll();
    
    let account = accounts.find(a => 
      (code && a.code === code) || 
      (name && a.name === name)
    );

    if (account) {
      return account.id;
    }

    // Se não encontrou, criar nova conta
    if (code && name) {
      const newAccount: Omit<Account, 'id' | 'created_at' | 'updated_at'> = {
        name,
        code,
        type: 'revenue',
        description: 'Auto-created from N8N',
        is_active: true
      };

      const created = await accountsService.create(newAccount);
      return created.id;
    }

    return null;

  } catch (error) {
    console.error('Error in findOrCreateAccount:', error);
    return null;
  }
}

/**
 * Registra o processamento do N8N no log
 */
async function logN8NProcessing(logData: any) {
  try {
    // Aqui você pode implementar logging mais sofisticado
    // Por exemplo, salvar em uma tabela de logs no Supabase
    console.log('N8N Processing Log:', logData);
    
    // Exemplo de como salvar no Supabase (opcional)
    /*
    const { error } = await supabase
      .from('n8n_processing_logs')
      .insert({
        workflow_id: logData.workflowId,
        execution_id: logData.executionId,
        source: logData.source,
        success: logData.result.success,
        processed_count: logData.result.processed,
        errors: logData.result.errors,
        timestamp: logData.timestamp
      });
    
    if (error) {
      console.error('Error saving N8N log:', error);
    }
    */

  } catch (error) {
    console.error('Error in logN8NProcessing:', error);
  }
}

/**
 * Endpoint para verificar status da integração N8N
 */
export const n8nStatus = async (req: Request, res: Response) => {
  try {
    // Verificar conectividade com Supabase
    const { data, error } = await supabase
      .from('entities')
      .select('count')
      .limit(1);

    const isHealthy = !error;

    res.status(200).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      supabase: isHealthy ? 'connected' : 'disconnected',
      version: '1.0.0'
    });

  } catch (error) {
    console.error('Error checking N8N status:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Endpoint para listar logs de processamento do N8N
 */
export const n8nLogs = async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    // Implementação básica - você pode expandir para buscar logs reais
    const mockLogs = [
      {
        id: '1',
        workflowId: 'workflow-123',
        executionId: 'exec-456',
        source: 'financial-import',
        success: true,
        processedCount: 25,
        errors: [],
        timestamp: new Date().toISOString()
      }
    ];

    res.status(200).json({
      logs: mockLogs,
      total: mockLogs.length,
      limit: Number(limit),
      offset: Number(offset)
    });

  } catch (error) {
    console.error('Error fetching N8N logs:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};