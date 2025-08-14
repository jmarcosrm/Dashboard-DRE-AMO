import { Request, Response } from 'express';
import { supabase } from './supabase';
import { withDatabaseCircuitBreaker } from '../utils/database-circuit-breaker.js';
import { FINANCIAL_FIELDS, type ColumnMapping, type MappingConfig } from '../utils/column-mapper';

// Interface para configuração de mapeamento salva
export interface SavedMappingConfig {
  id: string;
  name: string;
  description?: string;
  file_pattern?: string; // Regex para identificar arquivos que usam este mapeamento
  mapping_config: MappingConfig;
  column_mappings: ColumnMapping[];
  is_default: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Interface para template de mapeamento
export interface MappingTemplate {
  id: string;
  name: string;
  description: string;
  category: 'financial' | 'accounting' | 'budget' | 'custom';
  mapping_config: MappingConfig;
  suggested_mappings: Partial<ColumnMapping>[];
}

/**
 * Listar todas as configurações de mapeamento
 */
export async function listMappingConfigs(req: Request, res: Response) {
  try {
    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .select('*')
        .order('created_at', { ascending: false });
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      data: data || []
    });
  } catch (error) {
    console.error('Error listing mapping configs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list mapping configurations'
    });
  }
}

/**
 * Obter configuração de mapeamento específica
 */
export async function getMappingConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .select('*')
        .eq('id', id)
        .single();
    });

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Mapping configuration not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error getting mapping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mapping configuration'
    });
  }
}

/**
 * Criar nova configuração de mapeamento
 */
export async function createMappingConfig(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      file_pattern,
      mapping_config,
      column_mappings,
      is_default = false
    } = req.body;

    // Validar dados obrigatórios
    if (!name || !mapping_config) {
      return res.status(400).json({
        success: false,
        error: 'Name and mapping_config are required'
      });
    }

    // Validar mapeamentos
    const validationResult = validateMappingConfig(mapping_config, column_mappings);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mapping configuration',
        details: validationResult.errors
      });
    }

    // Remover lógica de is_default pois não existe na tabela
    // TODO: Implementar lógica de mapeamento padrão se necessário

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .insert({
          name,
          description,
          source_format: file_pattern || 'excel',
          mapping_config,
          validation_rules: { column_mappings },
          is_active: true,
          created_by: null // TODO: Usar ID do usuário autenticado
        })
        .select()
        .single();
    });

    if (error) {
      throw error;
    }

    res.status(201).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error creating mapping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create mapping configuration'
    });
  }
}

/**
 * Atualizar configuração de mapeamento
 */
export async function updateMappingConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      file_pattern,
      mapping_config,
      column_mappings,
      is_default
    } = req.body;

    // Validar mapeamentos se fornecidos
    if (mapping_config) {
      // TODO: Implementar validação de mapping_config
      // const validationResult = validateMappingConfig(mapping_config);
    }

    // Se for padrão, remover flag de outros mapeamentos
    if (is_default) {
      await withDatabaseCircuitBreaker(async () => {
        return await supabase
          .from('data_mappings')
          .update({ is_active: false })
          .neq('id', id);
      });
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (file_pattern !== undefined) updateData.source_format = file_pattern;
    if (mapping_config !== undefined) updateData.mapping_config = mapping_config;
    if (column_mappings !== undefined) updateData.validation_rules = { column_mappings };

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
    });

    if (error) {
      throw error;
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Mapping configuration not found'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error updating mapping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mapping configuration'
    });
  }
}

/**
 * Deletar configuração de mapeamento
 */
export async function deleteMappingConfig(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const { error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .delete()
        .eq('id', id);
    });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'Mapping configuration deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mapping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete mapping configuration'
    });
  }
}

/**
 * Obter configuração padrão de mapeamento
 */
export async function getDefaultMappingConfig(req: Request, res: Response) {
  try {
    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .select('*')
        .eq('is_active', true)
        .limit(1)
        .single();
    });

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    res.json({
      success: true,
      data: data || null
    });
  } catch (error) {
    console.error('Error getting default mapping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get default mapping configuration'
    });
  }
}

/**
 * Buscar configuração de mapeamento por padrão de arquivo
 */
export async function findMappingByFilePattern(req: Request, res: Response) {
  try {
    const { filename } = req.query;

    if (!filename || typeof filename !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Filename parameter is required'
      });
    }

    const { data, error } = await withDatabaseCircuitBreaker(async () => {
      return await supabase
        .from('data_mappings')
        .select('*')
        .not('file_pattern', 'is', null)
        .order('created_at', { ascending: false });
    });

    if (error) {
      throw error;
    }

    // Encontrar primeiro padrão que corresponde
    const matchingConfig = (data || []).find(config => {
      if (!config.file_pattern) return false;
      try {
        const regex = new RegExp(config.file_pattern, 'i');
        return regex.test(filename);
      } catch (e) {
        console.warn('Invalid regex pattern:', config.file_pattern);
        return false;
      }
    });

    res.json({
      success: true,
      data: matchingConfig || null
    });
  } catch (error) {
    console.error('Error finding mapping by file pattern:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find mapping configuration'
    });
  }
}

/**
 * Listar templates de mapeamento predefinidos
 */
export async function listMappingTemplates(req: Request, res: Response) {
  try {
    const templates: MappingTemplate[] = [
      {
        id: 'financial-standard',
        name: 'Padrão Financeiro',
        description: 'Template padrão para dados financeiros com entidade, conta, cenário, período e valor',
        category: 'financial',
        mapping_config: {
          autoDetectFinancialFields: true,
          requiredFields: [
            FINANCIAL_FIELDS.ENTITY,
            FINANCIAL_FIELDS.ACCOUNT,
            FINANCIAL_FIELDS.SCENARIO,
            FINANCIAL_FIELDS.PERIOD,
            FINANCIAL_FIELDS.VALUE
          ],
          dateFormats: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
          numberFormats: {
            decimalSeparator: ',',
            thousandsSeparator: '.'
          }
        },
        suggested_mappings: [
          {
            targetField: FINANCIAL_FIELDS.ENTITY,
            confidence: 0.9,
            validationRules: ['required', 'notEmpty']
          },
          {
            targetField: FINANCIAL_FIELDS.ACCOUNT,
            confidence: 0.9,
            validationRules: ['required', 'notEmpty']
          },
          {
            targetField: FINANCIAL_FIELDS.VALUE,
            confidence: 0.9,
            transformFunction: 'parseNumber',
            validationRules: ['required', 'numeric']
          }
        ]
      },
      {
        id: 'budget-planning',
        name: 'Planejamento Orçamentário',
        description: 'Template para dados de orçamento com múltiplos cenários',
        category: 'budget',
        mapping_config: {
          autoDetectFinancialFields: true,
          requiredFields: [
            FINANCIAL_FIELDS.ENTITY,
            FINANCIAL_FIELDS.ACCOUNT,
            FINANCIAL_FIELDS.SCENARIO,
            FINANCIAL_FIELDS.PERIOD,
            FINANCIAL_FIELDS.VALUE
          ],
          dateFormats: ['DD/MM/YYYY', 'YYYY-MM-DD'],
          numberFormats: {
            decimalSeparator: ',',
            thousandsSeparator: '.'
          },
          entityMapping: {
            column: 'entity',
            defaultValue: 'system'
          },
          accountMapping: {
            column: 'account',
            defaultValue: 'GENERAL'
          },
          // valueMapping removido - não existe no tipo MappingConfig
           // dateMapping removido - não existe no tipo MappingConfig
        },
        suggested_mappings: [
          {
            targetField: FINANCIAL_FIELDS.SCENARIO,
            confidence: 0.8,
            validationRules: ['required']
          },
          {
            targetField: FINANCIAL_FIELDS.COST_CENTER,
            confidence: 0.7,
            validationRules: ['maxLength:50']
          }
        ]
      },
      {
        id: 'accounting-entries',
        name: 'Lançamentos Contábeis',
        description: 'Template para lançamentos contábeis com débito e crédito',
        category: 'accounting',
        mapping_config: {
          autoDetectFinancialFields: true,
          requiredFields: [
            FINANCIAL_FIELDS.ACCOUNT,
            FINANCIAL_FIELDS.PERIOD,
            FINANCIAL_FIELDS.VALUE,
            FINANCIAL_FIELDS.DESCRIPTION
          ],
          dateFormats: ['DD/MM/YYYY'],
          numberFormats: {
            decimalSeparator: ',',
            thousandsSeparator: '.'
          }
        },
        suggested_mappings: [
          {
            targetField: FINANCIAL_FIELDS.DESCRIPTION,
            confidence: 0.8,
            validationRules: ['required', 'maxLength:500']
          }
        ]
      }
    ];

    const { category } = req.query;
    const filteredTemplates = category ? 
      templates.filter(t => t.category === category) : 
      templates;

    res.json({
      success: true,
      data: filteredTemplates
    });
  } catch (error) {
    console.error('Error listing mapping templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list mapping templates'
    });
  }
}

/**
 * Aplicar template de mapeamento
 */
export async function applyMappingTemplate(req: Request, res: Response) {
  try {
    const { templateId } = req.params;
    const { name, description, customMappings = {} } = req.body;

    // Buscar template
    const templatesResponse = await listMappingTemplates(req, res);
    // Note: Esta é uma implementação simplificada. Em produção, 
    // você deveria buscar o template de forma mais direta.
    
    res.json({
      success: true,
      message: 'Template application endpoint - implement based on your needs',
      templateId,
      customizations: { name, description, customMappings }
    });
  } catch (error) {
    console.error('Error applying mapping template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply mapping template'
    });
  }
}

/**
 * Validar configuração de mapeamento
 */
function validateMappingConfig(
  mappingConfig: MappingConfig,
  columnMappings: ColumnMapping[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar campos obrigatórios
  if (!mappingConfig.requiredFields || mappingConfig.requiredFields.length === 0) {
    errors.push('Required fields must be specified');
  }

  // Validar mapeamentos de colunas
  if (!columnMappings || columnMappings.length === 0) {
    errors.push('At least one column mapping must be provided');
  }

  // Verificar se campos obrigatórios estão mapeados
  const mappedFields = columnMappings.map(m => m.targetField);
  const missingRequired = (mappingConfig.requiredFields || []).filter(
    field => !mappedFields.includes(field)
  );

  if (missingRequired.length > 0) {
    errors.push(`Missing required field mappings: ${missingRequired.join(', ')}`);
  }

  // Verificar duplicatas
  const fieldCounts = new Map<string, number>();
  mappedFields.forEach(field => {
    fieldCounts.set(field, (fieldCounts.get(field) || 0) + 1);
  });

  const duplicates = Array.from(fieldCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([field]) => field);

  if (duplicates.length > 0) {
    errors.push(`Duplicate field mappings: ${duplicates.join(', ')}`);
  }

  // Validar confiança dos mapeamentos
  const lowConfidenceMappings = columnMappings.filter(m => m.confidence < 0.3);
  if (lowConfidenceMappings.length > 0) {
    errors.push(`Low confidence mappings detected: ${lowConfidenceMappings.map(m => m.targetField).join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Testar mapeamento com dados de exemplo
 */
export async function testMappingConfig(req: Request, res: Response) {
  try {
    const { mapping_config, column_mappings, sample_data } = req.body;

    if (!mapping_config || !column_mappings || !sample_data) {
      return res.status(400).json({
        success: false,
        error: 'mapping_config, column_mappings, and sample_data are required'
      });
    }

    // Validar configuração
    const validationResult = validateMappingConfig(mapping_config, column_mappings);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: 'Invalid mapping configuration',
        details: validationResult.errors
      });
    }

    // Aplicar mapeamentos aos dados de exemplo
    const { applyColumnMappings } = await import('../utils/column-mapper');
    const mappedData = applyColumnMappings(sample_data, column_mappings, mapping_config);

    // Validar dados mapeados
    const { validateFinancialData } = await import('../utils/validation');
    const validationResults = await Promise.all(
      mappedData.map(async (row) => {
        const validation = await validateFinancialData(row, {
            // accountsService removido - não existe no tipo ValidationConfig
          });
        return { row, validation };
      })
    );

    const validRows = validationResults.filter(r => r.validation.isValid);
    const invalidRows = validationResults.filter(r => !r.validation.isValid);

    res.json({
      success: true,
      data: {
        original_rows: sample_data.length,
        mapped_rows: mappedData.length,
        valid_rows: validRows.length,
        invalid_rows: invalidRows.length,
        sample_mapped_data: mappedData.slice(0, 5), // Primeiras 5 linhas
        validation_errors: invalidRows.slice(0, 10).map(r => r.validation.errors).flat(),
        mapping_validation: validationResult
      }
    });
  } catch (error) {
    console.error('Error testing mapping config:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to test mapping configuration'
    });
  }
}