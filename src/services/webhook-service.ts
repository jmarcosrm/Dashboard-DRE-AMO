import React from 'react';
import { useNotificationContext } from '../contexts/notification-context';

export interface WebhookPayload {
  fileId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  timestamp: string;
  source: 'google-drive' | 'n8n' | 'manual';
  metadata?: {
    entityCode?: string;
    period?: string;
    accountingPeriod?: string;
    [key: string]: any;
  };
}

export interface ProcessingResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  warnings: string[];
  processingTime: number;
  fileId: string;
  fileName: string;
}

class WebhookService {
  private baseUrl: string;
  private notificationCallbacks: {
    onStart?: (fileName: string) => void;
    onSuccess?: (fileName: string, recordsProcessed: number) => void;
    onError?: (fileName: string, error: string) => void;
    onWarning?: (fileName: string, warning: string, recordsProcessed?: number) => void;
  } = {};

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_URL || '/api';
  }

  setNotificationCallbacks(callbacks: typeof this.notificationCallbacks) {
    this.notificationCallbacks = callbacks;
  }

  async processWebhook(payload: WebhookPayload): Promise<ProcessingResult> {
    try {
      // Notify processing start
      this.notificationCallbacks.onStart?.(payload.fileName);

      const response = await fetch(`${this.baseUrl}/webhooks/process-file`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const result: ProcessingResult = await response.json();

      // Handle notifications based on result
      if (result.success) {
        if (result.warnings.length > 0) {
          this.notificationCallbacks.onWarning?.(
            result.fileName,
            `${result.warnings.length} avisos encontrados`,
            result.recordsProcessed
          );
        } else {
          this.notificationCallbacks.onSuccess?.(result.fileName, result.recordsProcessed);
        }
      } else {
        this.notificationCallbacks.onError?.(
          result.fileName,
          result.errors.join(', ') || 'Erro desconhecido'
        );
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      this.notificationCallbacks.onError?.(payload.fileName, errorMessage);
      
      return {
        success: false,
        recordsProcessed: 0,
        errors: [errorMessage],
        warnings: [],
        processingTime: 0,
        fileId: payload.fileId,
        fileName: payload.fileName,
      };
    }
  }

  async testIntegration(type: 'google-drive' | 'n8n'): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/integrations/test/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro de conexão'
      };
    }
  }

  async getProcessingStatus(fileId: string): Promise<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    result?: ProcessingResult;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/processing/status/${fileId}`);
      return await response.json();
    } catch (error) {
      throw new Error('Erro ao obter status do processamento');
    }
  }

  async retryProcessing(fileId: string): Promise<ProcessingResult> {
    try {
      const response = await fetch(`${this.baseUrl}/processing/retry/${fileId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error('Erro ao tentar reprocessar arquivo');
    }
  }

  // Simulate webhook for testing
  async simulateWebhook(fileName: string, fileContent: string): Promise<ProcessingResult> {
    const payload: WebhookPayload = {
      fileId: `test-${Date.now()}`,
      fileName,
      fileUrl: 'data:text/csv;base64,' + btoa(fileContent),
      fileSize: fileContent.length,
      mimeType: 'text/csv',
      timestamp: new Date().toISOString(),
      source: 'manual',
      metadata: {
        entityCode: 'TEST',
        period: new Date().toISOString().slice(0, 7), // YYYY-MM
      },
    };

    return this.processWebhook(payload);
  }
}

export const webhookService = new WebhookService();

// Hook para usar o serviço de webhook com notificações
export const useWebhookService = () => {
  const notifications = useNotificationContext();

  React.useEffect(() => {
    webhookService.setNotificationCallbacks({
      onStart: notifications.notifyFileProcessingStart,
      onSuccess: notifications.notifyFileProcessingSuccess,
      onError: notifications.notifyFileProcessingError,
      onWarning: notifications.notifyFileProcessingWarning,
    });
  }, [notifications]);

  return webhookService;
};

// Função para configurar listener de webhooks em tempo real (se usando WebSockets)
export const setupWebhookListener = (onWebhook: (payload: WebhookPayload) => void) => {
  // Implementar WebSocket ou Server-Sent Events para receber webhooks em tempo real
  // Por enquanto, retorna uma função de cleanup vazia
  return () => {};
};