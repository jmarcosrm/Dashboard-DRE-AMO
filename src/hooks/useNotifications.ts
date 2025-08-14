import { useState, useCallback } from 'react';
import { Notification, NotificationType } from '../components/ui/notification';

interface UseNotificationsReturn {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  showSuccess: (title: string, message?: string, options?: Partial<Notification>) => string;
  showError: (title: string, message?: string, options?: Partial<Notification>) => string;
  showWarning: (title: string, message?: string, options?: Partial<Notification>) => string;
  showInfo: (title: string, message?: string, options?: Partial<Notification>) => string;
}

const DEFAULT_DURATION = 5000;

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const generateId = useCallback(() => {
    return `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      id,
      duration: DEFAULT_DURATION,
      persistent: false,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);
    return id;
  }, [generateId]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const createNotificationHelper = useCallback(
    (type: NotificationType) => 
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type,
        title,
        message,
        ...options,
      });
    },
    [addNotification]
  );

  const showSuccess = useCallback(
    createNotificationHelper('success'),
    [createNotificationHelper]
  );

  const showError = useCallback(
    (title: string, message?: string, options?: Partial<Notification>) => {
      return addNotification({
        type: 'error',
        title,
        message,
        persistent: true, // Errors should be persistent by default
        ...options,
      });
    },
    [addNotification]
  );

  const showWarning = useCallback(
    createNotificationHelper('warning'),
    [createNotificationHelper]
  );

  const showInfo = useCallback(
    createNotificationHelper('info'),
    [createNotificationHelper]
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};

// Hook para notificações de processamento de arquivos
export const useFileProcessingNotifications = () => {
  const notifications = useNotifications();

  const notifyFileProcessingStart = useCallback(
    (fileName: string) => {
      return notifications.showInfo(
        'Processamento Iniciado',
        `Processando arquivo: ${fileName}`,
        { persistent: true }
      );
    },
    [notifications]
  );

  const notifyFileProcessingSuccess = useCallback(
    (fileName: string, recordsProcessed: number) => {
      return notifications.showSuccess(
        'Processamento Concluído',
        `${fileName}: ${recordsProcessed} registros processados com sucesso`,
        { duration: 8000 }
      );
    },
    [notifications]
  );

  const notifyFileProcessingError = useCallback(
    (fileName: string, error: string) => {
      return notifications.showError(
        'Erro no Processamento',
        `${fileName}: ${error}`,
        {
          persistent: true,
          actions: [
            {
              label: 'Ver Detalhes',
              onClick: () => {
                // Navigate to monitoring page
                window.location.href = '/monitoring';
              },
              variant: 'primary'
            }
          ]
        }
      );
    },
    [notifications]
  );

  const notifyFileProcessingWarning = useCallback(
    (fileName: string, warning: string, recordsProcessed?: number) => {
      return notifications.showWarning(
        'Processamento com Avisos',
        `${fileName}: ${warning}${recordsProcessed ? ` (${recordsProcessed} registros processados)` : ''}`,
        { duration: 10000 }
      );
    },
    [notifications]
  );

  const notifyIntegrationStatus = useCallback(
    (integration: string, status: 'connected' | 'disconnected' | 'error', message?: string) => {
      const statusMap = {
        connected: { type: 'success' as const, title: 'Integração Conectada' },
        disconnected: { type: 'warning' as const, title: 'Integração Desconectada' },
        error: { type: 'error' as const, title: 'Erro na Integração' }
      };

      const { type, title } = statusMap[status];
      
      return notifications.addNotification({
        type,
        title,
        message: `${integration}: ${message || status}`,
        persistent: status === 'error',
        duration: status === 'connected' ? 5000 : 8000
      });
    },
    [notifications]
  );

  return {
    ...notifications,
    notifyFileProcessingStart,
    notifyFileProcessingSuccess,
    notifyFileProcessingError,
    notifyFileProcessingWarning,
    notifyIntegrationStatus,
  };
};