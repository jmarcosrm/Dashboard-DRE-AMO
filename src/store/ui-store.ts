import React from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UIState, Notification } from '../types';

interface UIStore extends UIState {
  // Actions para tema
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  
  // Actions para sidebar
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapsed: () => void;
  
  // Actions para modais
  setModalOpen: (modalId: string, open: boolean) => void;
  closeAllModals: () => void;
  
  // Actions para loading states
  setLoading: (key: string, loading: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  
  // Actions para notificações
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  markNotificationAsRead: (id: string) => void;
  
  // Actions para layout
  setActiveView: (view: string) => void;
  setViewConfig: (config: Record<string, any>) => void;
  
  // Actions para responsividade
  setScreenSize: (size: 'mobile' | 'tablet' | 'desktop' | '4k') => void;
  setIsMobile: (isMobile: boolean) => void;
  
  // Actions para preferências
  setPreferences: (preferences: Partial<UIState['preferences']>) => void;
  
  // Computed values
  getUnreadNotificationsCount: () => number;
  getActiveNotifications: () => Notification[];
  isModalOpen: (modalId: string) => boolean;
  isLoading: (key?: string) => boolean;
}

const defaultPreferences = {
  compactMode: false,
  showAnimations: true,
  autoRefresh: true,
  refreshInterval: 30000, // 30 segundos
  defaultChartType: 'area' as const,
  showTooltips: true,
  highContrast: false,
  reducedMotion: false
};

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      theme: 'light',
      sidebarOpen: true,
      sidebarCollapsed: false,
      modals: {},
      loading: {},
      globalLoading: false,
      notifications: [],
      activeView: 'dashboard',
      viewConfig: {},
      screenSize: 'desktop',
      isMobile: false,
      preferences: defaultPreferences,
      
      // Actions para tema
      setTheme: (theme) => {
        set({ theme });
        // Aplicar tema no documento
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },
      
      toggleTheme: () => {
        const currentTheme = get().theme;
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },
      
      // Actions para sidebar
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },
      
      toggleSidebar: () => {
        set((state) => ({ sidebarOpen: !state.sidebarOpen }));
      },
      
      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },
      
      toggleSidebarCollapsed: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
      },
      
      // Actions para modais
      setModalOpen: (modalId, open) => {
        set((state) => ({
          modals: { ...state.modals, [modalId]: open }
        }));
      },
      
      closeAllModals: () => {
        set({ modals: {} });
      },
      
      // Actions para loading states
      setLoading: (key, loading) => {
        set((state) => ({
          loading: { ...state.loading, [key]: loading }
        }));
      },
      
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading });
      },
      
      // Actions para notificações
      addNotification: (notification) => {
        const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const newNotification: Notification = {
          ...notification,
          id,
          timestamp: new Date().toISOString(),
          read: false
        };
        
        set((state) => ({
          notifications: [newNotification, ...state.notifications]
        }));
        
        // Auto-remover notificações de sucesso após 5 segundos
        if (notification.type === 'success') {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },
      
      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      
      // Actions para layout
      setActiveView: (view) => {
        set({ activeView: view });
      },
      
      setViewConfig: (config) => {
        set((state) => ({
          viewConfig: { ...state.viewConfig, ...config }
        }));
      },
      
      // Actions para responsividade
      setScreenSize: (size) => {
        set({ 
          screenSize: size,
          isMobile: size === 'mobile'
        });
        
        // Auto-colapsar sidebar em mobile
        if (size === 'mobile') {
          set({ sidebarCollapsed: true });
        }
      },
      
      setIsMobile: (isMobile) => {
        set({ isMobile });
      },
      
      // Actions para preferências
      setPreferences: (newPreferences) => {
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences }
        }));
      },
      
      // Computed values
      getUnreadNotificationsCount: () => {
        return get().notifications.filter(n => !n.read).length;
      },
      
      getActiveNotifications: () => {
        return get().notifications.filter(n => !n.read);
      },
      
      isModalOpen: (modalId) => {
        return get().modals[modalId] || false;
      },
      
      isLoading: (key) => {
        if (!key) {
          return get().globalLoading;
        }
        return get().loading[key] || false;
      }
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        preferences: state.preferences
      })
    }
  )
);

// Hook para detectar mudanças de tela
export const useScreenSize = () => {
  const { setScreenSize, setIsMobile } = useUIStore();
  
  React.useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      if (width < 768) {
        setScreenSize('mobile');
        setIsMobile(true);
      } else if (width < 1024) {
        setScreenSize('tablet');
        setIsMobile(false);
      } else if (width < 1920) {
        setScreenSize('desktop');
        setIsMobile(false);
      } else {
        setScreenSize('4k');
        setIsMobile(false);
      }
    };
    
    // Executar na inicialização
    handleResize();
    
    // Adicionar listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [setScreenSize, setIsMobile]);
};