import React from 'react';
import { 
  BarChart3, 
  PieChart, 
  FileText, 
  Settings, 
  Users, 
  Home, 
  TrendingUp, 
  Calculator, 
  Database,
  ChevronLeft,
  ChevronRight,
  Edit,
  Zap,
  Activity,
  Map,
  Link2,
  Monitor
} from 'lucide-react';
import { useUIStore } from '../../store';
import { useLocation, Link } from 'react-router-dom';

interface SidebarProps {
  className?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
    path: '/'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <TrendingUp className="w-5 h-5" />,
    path: '/analytics',
    children: [
      {
        id: 'dre-analysis',
        label: 'Análise DRE',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/analytics/dre'
      },
      {
        id: 'comparisons',
        label: 'Comparações',
        icon: <PieChart className="w-4 h-4" />,
        path: '/analytics/comparisons'
      },
      {
        id: 'trends',
        label: 'Tendências',
        icon: <TrendingUp className="w-4 h-4" />,
        path: '/analytics/trends'
      }
    ]
  },
  {
    id: 'reports',
    label: 'Relatórios',
    icon: <FileText className="w-5 h-5" />,
    path: '/reports',
    children: [
      {
        id: 'financial-reports',
        label: 'Relatórios Financeiros',
        icon: <Calculator className="w-4 h-4" />,
        path: '/reports/financial'
      },
      {
        id: 'custom-reports',
        label: 'Relatórios Customizados',
        icon: <FileText className="w-4 h-4" />,
        path: '/reports/custom'
      }
    ]
  },
  {
    id: 'admin',
    label: 'Administração',
    icon: <Database className="w-5 h-5" />,
    path: '/admin',
    children: [
      {
        id: 'entities',
        label: 'Entidades',
        icon: <Database className="w-4 h-4" />,
        path: '/admin/entities'
      },
      {
        id: 'accounts',
        label: 'Plano de Contas',
        icon: <BarChart3 className="w-4 h-4" />,
        path: '/admin/accounts'
      },
      {
        id: 'users',
        label: 'Usuários',
        icon: <Users className="w-4 h-4" />,
        path: '/admin/users'
      }
    ]
  },
  {
    id: 'data-editor',
    label: 'Editor de Dados',
    icon: <Edit className="w-5 h-5" />,
    path: '/data-editor'
  },
  {
    id: 'integrations',
    label: 'Integrações',
    icon: <Link2 className="w-5 h-5" />,
    path: '/integrations',
    children: [
      {
        id: 'integration-settings',
        label: 'Configurações',
        icon: <Settings className="w-4 h-4" />,
        path: '/integrations/settings'
      }
    ]
  },
  {
    id: 'monitoring',
    label: 'Monitoramento',
    icon: <Monitor className="w-5 h-5" />,
    path: '/monitoring',
    children: [
      {
        id: 'monitoring-dashboard',
        label: 'Dashboard',
        icon: <Activity className="w-4 h-4" />,
        path: '/monitoring/dashboard'
      }
    ]
  },
  {
    id: 'data-mappings',
    label: 'Mapeamento de Dados',
    icon: <Map className="w-5 h-5" />,
    path: '/data-mappings',
    children: [
      {
        id: 'data-mappings-configure',
        label: 'Configurar',
        icon: <Settings className="w-4 h-4" />,
        path: '/data-mappings/configure'
      }
    ]
  },
  {
    id: 'settings',
    label: 'Configurações',
    icon: <Settings className="w-5 h-5" />,
    path: '/settings'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const { sidebarOpen, sidebarCollapsed, setSidebarCollapsed, isMobile } = useUIStore();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = React.useState<string[]>(['analytics', 'reports', 'admin', 'integrations', 'monitoring', 'data-mappings']);
  
  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };
  
  const isActive = (path: string) => {
    return location.pathname === path || 
           (path !== '/' && location.pathname.startsWith(path));
  };
  
  const renderMenuItem = (item: MenuItem, level: number = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const active = isActive(item.path);
    
    return (
      <div key={item.id}>
        {hasChildren ? (
          <button
            onClick={() => toggleExpanded(item.id)}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors duration-200 ${
              active 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            <div className="flex items-center space-x-3">
              {item.icon}
              {(!sidebarCollapsed || isMobile) && (
                <span className="font-medium">{item.label}</span>
              )}
            </div>
            {(!sidebarCollapsed || isMobile) && (
              <ChevronRight 
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-90' : ''
                }`} 
              />
            )}
          </button>
        ) : (
          <Link
            to={item.path}
            className={`flex items-center space-x-3 p-3 rounded-lg transition-colors duration-200 ${
              active 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${level > 0 ? 'ml-4' : ''}`}
          >
            {item.icon}
            {(!sidebarCollapsed || isMobile) && (
              <span className="font-medium">{item.label}</span>
            )}
            {item.badge && (!sidebarCollapsed || isMobile) && (
              <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-xs px-2 py-1 rounded-full">
                {item.badge}
              </span>
            )}
          </Link>
        )}
        
        {hasChildren && isExpanded && (!sidebarCollapsed || isMobile) && (
          <div className="mt-1 space-y-1">
            {item.children!.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };
  
  if (!sidebarOpen && isMobile) {
    return null;
  }
  
  return (
    <>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => useUIStore.getState().setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={`
          ${isMobile ? 'fixed' : 'relative'} 
          ${isMobile ? 'z-50' : 'z-30'}
          ${sidebarCollapsed && !isMobile ? 'w-16' : 'w-64'}
          ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}
          h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          transition-all duration-300 ease-in-out flex flex-col
          ${className}
        `}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {(!sidebarCollapsed || isMobile) && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DRE</span>
              </div>
              <div>
                <h2 className="font-bold text-gray-900 dark:text-white text-sm">
                  Financial Dashboard
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Enterprise
                </p>
              </div>
            </div>
          )}
          
          {!isMobile && (
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Toggle sidebar"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map(item => renderMenuItem(item))}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          {(!sidebarCollapsed || isMobile) && (
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <div>Financial Dashboard v1.0</div>
              <div className="mt-1">© 2024 Enterprise Corp</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};