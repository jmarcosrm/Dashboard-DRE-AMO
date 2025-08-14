/**
 * Vercel deploy entry handler, for serverless deployment, please don't modify this file
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import { googleDriveWebhook } from './webhooks/google-drive';
import dataMappingsRouter from './routes/data-mappings';
import monitoringRouter from './routes/monitoring';
import integrationSettingsRouter from './routes/integration-settings';
import authRouter from './routes/auth';
import n8nRouter from './routes/n8n';
import webhooksRouter from './routes/webhooks';

const app = express();

app.use(cors());
app.use(express.json());

// Consolidar todas as rotas em um único handler
// Webhooks
app.post('/webhook/google-drive', googleDriveWebhook);
app.use('/webhooks', webhooksRouter);

// Rotas da API
app.use('/auth', authRouter);
app.use('/n8n', n8nRouter);
app.use('/data-mappings', dataMappingsRouter);
app.use('/monitoring', monitoringRouter);
app.use('/integration-settings', integrationSettingsRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}