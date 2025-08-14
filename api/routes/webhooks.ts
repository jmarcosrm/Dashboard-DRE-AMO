import { Router } from 'express';
import { 
  googleDriveWebhook, 
  setupGoogleDriveWebhook, 
  listGoogleDriveWebhooks 
} from '../webhooks/google-drive';

const router = Router();

/**
 * Rotas para webhooks
 */

// Webhook do Google Drive - recebe notificações de mudanças
router.post('/google-drive', googleDriveWebhook);

// Configurar webhook do Google Drive
router.post('/google-drive/setup', setupGoogleDriveWebhook);

// Listar webhooks ativos do Google Drive
router.get('/google-drive/list', listGoogleDriveWebhooks);

// Endpoint de verificação para webhooks
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'webhooks'
  });
});

export default router;