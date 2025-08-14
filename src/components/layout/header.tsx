import React from 'react';
import { 
  Menu, 
  X, 
  Search, 
  Bell, 
  Settings, 
  User, 
  Moon, 
  Sun, 
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useUIStore } from '../../store';
import { useAuth } from '../../contexts/auth-context';

interface HeaderProps {
  className?: string;
}

export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { 
    theme, 
    sidebarOpen, 
    sidebarCollapsed,
    toggleSidebar, 
    toggleTheme,
    getUnreadNotificationsCount,
    addNotification
  } = useUIStore();
  
  const { userProfile, signOut } = useAuth();
  
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const unreadCount = getUnreadNotificationsCount();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addNotification({
        type: 'info',
        title: 'Busca realizada',
        message: `Buscando por: ${searchQuery}`
      });
      setSearchQuery('');
    }
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
      addNotification({
        type: 'success',
        title: 'Logout realizado',
        message: 'Você foi desconectado com sucesso'
      });
    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Erro no logout',
        message: 'Não foi possível fazer logout. Tente novamente.'
      });
    }
    setShowUserMenu(false);
  };
  
  return (
    <header className={`glass-card border-b border-white/20 dark:border-white/10 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Menu Toggle */}
          <button
            onClick={toggleSidebar}
            className="glass-button p-3 text-gray-700 dark:text-gray-300 neon-glow"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </button>
          
          {/* Logo/Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 tech-gradient rounded-2xl flex items-center justify-center shadow-neon animate-float">
              <span className="text-white font-bold text-sm">DRE</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold bg-gradient-to-r from-tech-600 to-tech-800 dark:from-tech-400 dark:to-tech-600 bg-clip-text text-transparent">
                Financial Dashboard
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                Enterprise Analytics
              </p>
            </div>
          </div>
        </div>
        
        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar contas, entidades, relatórios..."
                className="input focus:ring-tech-500 focus:shadow-neon"
              />
            </div>
          </form>
        </div>
        
        {/* Right Section */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="glass-button p-3 text-gray-700 dark:text-gray-300 neon-glow"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5" />
            ) : (
              <Sun className="w-5 h-5" />
            )}
          </button>
          
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="glass-button p-3 text-gray-700 dark:text-gray-300 neon-glow relative"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-neon-pink animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-card shadow-tech z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Notificações
                  </h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {unreadCount === 0 ? (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      Nenhuma notificação
                    </div>
                  ) : (
                    <div className="p-2">
                      <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          Sistema atualizado
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Novos dados disponíveis
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Settings */}
          <button
            className="glass-button p-3 text-gray-700 dark:text-gray-300 neon-glow"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 glass-button p-3 text-gray-700 dark:text-gray-300 neon-glow"
            >
              <div className="w-8 h-8 tech-gradient rounded-full flex items-center justify-center shadow-neon">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {userProfile?.name || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {userProfile?.role || 'user'}
                </div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 glass-card shadow-tech z-50">
                <div className="p-2">
                  <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Perfil</span>
                  </button>
                  <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200">
                    <Settings className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Configurações</span>
                  </button>
                  <hr className="my-2 border-gray-200 dark:border-gray-700" />
                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200 text-red-600 dark:text-red-400"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Sair</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Search */}
      <div className="md:hidden px-4 pb-4">
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
            />
          </div>
        </form>
      </div>
    </header>
  );
};