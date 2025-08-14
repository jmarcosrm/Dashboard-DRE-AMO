import React, { useState } from 'react';
import { LoginForm } from '../components/auth/login-form';
import { RegisterForm } from '../components/auth/register-form';
import { EmailConfirmation } from '../components/auth/email-confirmation';
import { useAuth } from '../contexts/auth-context';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

export function AuthPage() {
  const { user, userProfile, loading, isEmailConfirmed } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Show email confirmation if user exists but email is not confirmed
  if (user && !isEmailConfirmed) {
    return <EmailConfirmation />;
  }

  // Redirect to dashboard if authenticated and email confirmed
  if (user && isEmailConfirmed && userProfile?.isActive) {
    return <Navigate to="/" replace />;
  }

  // Show access denied if user is confirmed but profile is inactive
  if (user && isEmailConfirmed && userProfile && !userProfile.isActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
          <p className="text-gray-600 mb-4">
            Sua conta não está ativa ou não foi encontrada.
          </p>
          <p className="text-gray-500 text-sm">
            Entre em contato com o administrador do sistema.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard DRE
          </h1>
          <p className="text-gray-600">
            Sistema de Gestão Financeira
          </p>
        </div>
        
        {isLogin ? (
          <LoginForm onToggleMode={() => setIsLogin(false)} />
        ) : (
          <RegisterForm onToggleMode={() => setIsLogin(true)} />
        )}
        
        <div className="text-center text-sm text-gray-500">
          <p>
            Ao continuar, você concorda com nossos{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Termos de Uso
            </a>{' '}
            e{' '}
            <a href="#" className="text-blue-600 hover:text-blue-500">
              Política de Privacidade
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}