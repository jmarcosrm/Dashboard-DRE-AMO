import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user' | 'viewer';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user profile is loaded and active
  if (!userProfile || !userProfile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Acesso Negado
          </h2>
          <p className="text-gray-600 mb-4">
            Sua conta não está ativa ou não foi encontrada.
          </p>
          <p className="text-sm text-gray-500">
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = {
      viewer: 1,
      user: 2,
      admin: 3
    };

    const userRoleLevel = roleHierarchy[userProfile.role];
    const requiredRoleLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Acesso Negado
            </h2>
            <p className="text-gray-600 mb-4">
              Você não tem permissão para acessar esta página.
            </p>
            <p className="text-sm text-gray-500">
              Nível de acesso necessário: {requiredRole}
            </p>
            <p className="text-sm text-gray-500">
              Seu nível de acesso: {userProfile.role}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}