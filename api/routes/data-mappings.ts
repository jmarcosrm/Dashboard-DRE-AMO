import { Router } from 'express';
import {
  listMappingConfigs,
  getMappingConfig,
  createMappingConfig,
  updateMappingConfig,
  deleteMappingConfig,
  getDefaultMappingConfig,
  findMappingByFilePattern,
  listMappingTemplates,
  applyMappingTemplate,
  testMappingConfig
} from '../config/data-mappings';

const router = Router();

// Rotas para configurações de mapeamento
router.get('/configs', listMappingConfigs);
router.get('/configs/default', getDefaultMappingConfig);
router.get('/configs/find-by-pattern', findMappingByFilePattern);
router.get('/configs/:id', getMappingConfig);
router.post('/configs', createMappingConfig);
router.put('/configs/:id', updateMappingConfig);
router.delete('/configs/:id', deleteMappingConfig);

// Rotas para templates
router.get('/templates', listMappingTemplates);
router.post('/templates/:templateId/apply', applyMappingTemplate);

// Rota para testar configuração
router.post('/test', testMappingConfig);

export default router;