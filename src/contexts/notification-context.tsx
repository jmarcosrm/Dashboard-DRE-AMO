import React, { createContext, useContext } from 'react';
import { useNotifications, useFileProcessingNotifications } from '../hooks/useNotifications';
import { NotificationContainer } from '../components/ui/notification';

type NotificationContextType = ReturnType<typeof useFileProcessingNotifications>;

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const notifications = useFileProcessingNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
      <NotificationContainer
        notifications={notifications.notifications}
        onClose={notifications.removeNotification}
      />
    </NotificationContext.Provider>
  );
};