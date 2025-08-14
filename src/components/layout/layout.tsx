import React from 'react';
import { Header } from './header';
import { Sidebar } from './sidebar';
import { useUIStore, useScreenSize } from '../../store';
import { Outlet } from 'react-router-dom';

interface LayoutProps {
  children?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { sidebarOpen, sidebarCollapsed, isMobile, theme } = useUIStore();
  
  // Hook para detectar mudanças de tela
  useScreenSize();
  
  // Aplicar tema no documento
  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
  
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <Header />
      
      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main 
          className={`
            flex-1 overflow-auto
            ${!isMobile && sidebarCollapsed ? 'ml-0' : ''}
            transition-all duration-300 ease-in-out
          `}
        >
          <div className="h-full">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};