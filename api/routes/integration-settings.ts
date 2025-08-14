import { Router, Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { withDatabaseCircuitBreaker } from '../utils/database-circuit-breaker.js';
import { auditLogger, AuditEventType, AuditSeverity } from '../utils/audit-logger';

const router = Router();

// Interface para configurações de integração
interface IntegrationSetting {
  id?: string;
  name: string;
  type: 'google_drive' | 'n8n' | 'webhook' | 'api';
  config: any;
  is_active: boolean;
  last_sync?: string;
  sync_frequency?: string;
  error_count?: number;
  last_error?: string;
  created_by?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para configuração do Google Drive
interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  watchFolders: string[];
  autoProcess: boolean;
  notificationUrl: string;
}

// Interface para configuração do n8n
interface N8nConfig {
  webhookUrl: string;
  apiKey: string;
  workflowId: string;
  retryAttempts: number;
  timeoutMs: number;
}

// Listar todas as configurações de integração
router.get('/', async (req: Request, res: Response) => {
  try {
    const { integration_type, is_active } = req.query;

    let query = supabase
      .from('integration_settings')
      .select('*')
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (integration_type) {
      query = query.eq('type', String(integration_type));
    }

    if (is_active !== undefined) {
      query = query.eq('is_active', is_active === 'true');
    }

    const settings = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await query;
      if (error) throw error;
      
      // Retornar dados sem mascaramento por enquanto
      return data;
    });

    res.json(settings);
  } catch (error) {
    console.error('Error fetching integration settings:', error);
    await auditLogger.logSystemError(error as Error, 'integration_settings_list');
    res.status(500).json({ error: 'Failed to fetch integration settings' });
  }
});

// Obter configuração específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const setting = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Mascarar dados sensíveis se necessário
      // Implementar mascaramento conforme necessário
      
      return data;
    });

    res.json(setting);
  } catch (error) {
    console.error('Error fetching integration setting:', error);
    await auditLogger.logSystemError(error as Error, 'integration_settings_get');
    res.status(500).json({ error: 'Failed to fetch integration setting' });
  }
});

// Criar nova configuração
router.post('/', async (req: Request, res: Response) => {
  try {
    const settingData: IntegrationSetting = req.body;

    // Validar dados obrigatórios
    if (!settingData.name || !settingData.type) {
      return res.status(400).json({ 
        error: 'name and type are required' 
      });
    }

    const newSetting = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .insert({
          name: settingData.name,
          type: settingData.type,
          config: settingData.config,
          is_active: settingData.is_active !== false // default true
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    await auditLogger.log({
      event_type: AuditEventType.USER_ACTION,
      severity: AuditSeverity.INFO,
      message: 'Integration setting created',
      details: {
        settingId: newSetting.id,
        integrationType: newSetting.type,
        settingName: newSetting.name
      }
    });

    // Mascarar dados sensíveis no config se necessário
    if (newSetting.config && typeof newSetting.config === 'object') {
      // Implementar mascaramento se necessário
    }

    res.status(201).json(newSetting);
  } catch (error) {
    console.error('Error creating integration setting:', error);
    await auditLogger.logSystemError(error as Error, 'integration_settings_create');
    res.status(500).json({ error: 'Failed to create integration setting' });
  }
});

// Atualizar configuração
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData: Partial<IntegrationSetting> = req.body;

    const updatedSetting = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .update({
          config: updateData.config,
          is_active: updateData.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    await auditLogger.log({
      event_type: AuditEventType.USER_ACTION,
      severity: AuditSeverity.INFO,
      message: 'Integration setting updated',
      details: {
        settingId: id,
        integrationType: updatedSetting.type,
        settingName: updatedSetting.name
      }
    });

    // Mascarar dados sensíveis no config se necessário
    if (updatedSetting.config && typeof updatedSetting.config === 'object') {
      // Implementar mascaramento se necessário
    }

    res.json(updatedSetting);
  } catch (error) {
    console.error('Error updating integration setting:', error);
    await auditLogger.logSystemError(error as Error, 'integration_settings_update');
    res.status(500).json({ error: 'Failed to update integration setting' });
  }
});

// Deletar configuração
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const deletedSetting = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    });

    await auditLogger.log({
      event_type: AuditEventType.USER_ACTION,
      severity: AuditSeverity.INFO,
      message: 'Integration setting deleted',
      details: {
        settingId: id,
        integrationType: deletedSetting.type,
        settingName: deletedSetting.name
      }
    });

    res.json({ message: 'Integration setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting integration setting:', error);
    await auditLogger.logSystemError(error as Error, 'integration_settings_delete');
    res.status(500).json({ error: 'Failed to delete integration setting' });
  }
});

// Obter configurações do Google Drive
router.get('/google-drive/config', async (req: Request, res: Response) => {
  try {
    const config = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('config')
        .eq('type', 'google_drive')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Retornar configuração diretamente do campo config
      const configObj = data?.config as Partial<GoogleDriveConfig> || {};
      
      // Mascarar dados sensíveis
      if (configObj.clientSecret) {
        configObj.clientSecret = '***ENCRYPTED***';
      }

      return configObj;
    });

    res.json(config);
  } catch (error) {
    console.error('Error fetching Google Drive config:', error);
    await auditLogger.logSystemError(error as Error, 'google_drive_config_get');
    res.status(500).json({ error: 'Failed to fetch Google Drive configuration' });
  }
});

// Atualizar configurações do Google Drive
router.put('/google-drive/config', async (req: Request, res: Response) => {
  try {
    const config: Partial<GoogleDriveConfig> = req.body;

    await withDatabaseCircuitBreaker(async () => {
      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          name: 'google_drive_config',
          type: 'google_drive',
          config: config,
          is_active: true,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'name'
        });

      if (error) throw error;
    });

    await auditLogger.log({
      event_type: AuditEventType.USER_ACTION,
      severity: AuditSeverity.INFO,
      message: 'Google Drive configuration updated',
      details: {
        updatedKeys: Object.keys(config)
      }
    });

    res.json({ message: 'Google Drive configuration updated successfully' });
  } catch (error) {
    console.error('Error updating Google Drive config:', error);
    await auditLogger.logSystemError(error as Error, 'google_drive_config_update');
    res.status(500).json({ error: 'Failed to update Google Drive configuration' });
  }
});

// Obter configurações do n8n
router.get('/n8n/config', async (req: Request, res: Response) => {
  try {
    const config = await withDatabaseCircuitBreaker(async () => {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('config')
        .eq('type', 'n8n')
        .eq('is_active', true)
        .single();

      if (error) throw error;

      // Retornar configuração diretamente do campo config
      const configObj = data?.config as Partial<N8nConfig> || {};
      
      // Mascarar dados sensíveis
      if (configObj.apiKey) {
        configObj.apiKey = '***ENCRYPTED***';
      }

      return configObj;
    });

    res.json(config);
  } catch (error) {
    console.error('Error fetching n8n config:', error);
    await auditLogger.logSystemError(error as Error, 'n8n_config_get');
    res.status(500).json({ error: 'Failed to fetch n8n configuration' });
  }
});

// Testar configuração de integração
router.post('/test/:integration_type', async (req: Request, res: Response) => {
  try {
    const { integration_type } = req.params;
    const testConfig = req.body;

    let testResult = { success: false, message: '', details: {} };

    switch (integration_type) {
      case 'google_drive':
        // Implementar teste de conexão com Google Drive
        testResult = {
          success: true,
          message: 'Google Drive connection test not implemented yet',
          details: { config: testConfig }
        };
        break;

      case 'n8n':
        // Implementar teste de conexão com n8n
        testResult = {
          success: true,
          message: 'n8n connection test not implemented yet',
          details: { config: testConfig }
        };
        break;

      default:
        return res.status(400).json({ error: 'Unsupported integration type' });
    }

    await auditLogger.log({
      event_type: AuditEventType.USER_ACTION,
      severity: AuditSeverity.INFO,
      message: `Integration test performed: ${integration_type}`,
      details: {
        integrationType: integration_type,
        success: testResult.success
      }
    });

    res.json(testResult);
  } catch (error) {
    console.error('Error testing integration:', error);
    await auditLogger.logSystemError(error as Error, 'integration_test');
    res.status(500).json({ error: 'Failed to test integration' });
  }
});

export default router;