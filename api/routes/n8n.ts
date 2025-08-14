import { Router } from 'express';
import { 
  n8nWebhook, 
  n8nStatus, 
  n8nLogs 
} from '../integrations/n8n';

const router = Router();

/**
 * Rotas para integração N8N
 */

// Webhook principal do N8N - recebe dados de workflows
router.post('/webhook', n8nWebhook);

// Status da integração N8N
router.get('/status', n8nStatus);

// Logs de processamento do N8N
router.get('/logs', n8nLogs);

// Endpoint de teste para verificar conectividade
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'n8n-integration',
    version: '1.0.0'
  });
});

// Endpoint para receber dados financeiros específicos
router.post('/financial-data', n8nWebhook);

// Endpoint para sincronização de entidades
router.post('/entities', n8nWebhook);

// Endpoint para sincronização de contas
router.post('/accounts', n8nWebhook);

export default router;