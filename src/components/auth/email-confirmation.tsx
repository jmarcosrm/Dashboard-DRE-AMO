import React, { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, Mail, CheckCircle } from 'lucide-react';

export function EmailConfirmation() {
  const { user, resendConfirmation, signOut } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleResendConfirmation = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await resendConfirmation();
      setMessage('Email de confirmação reenviado com sucesso! Verifique sua caixa de entrada.');
    } catch (err: any) {
      setError(err.message || 'Erro ao reenviar email de confirmação.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Confirme seu Email
          </CardTitle>
          <CardDescription>
            Enviamos um link de confirmação para:
            <br />
            <strong className="text-gray-900">{user?.email}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
          
          <div className="text-center text-sm text-gray-600 space-y-2">
            <p>
              Clique no link do email para confirmar sua conta e acessar o sistema.
            </p>
            <p>
              Não recebeu o email? Verifique sua pasta de spam ou solicite um novo.
            </p>
          </div>
          
          <div className="space-y-3">
            <Button
              onClick={handleResendConfirmation}
              disabled={loading}
              className="w-full"
              variant="outline"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : (
                'Reenviar Email de Confirmação'
              )}
            </Button>
            
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="w-full"
            >
              Usar Outro Email
            </Button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>
              Problemas com a confirmação?{' '}
              <a href="mailto:suporte@empresa.com" className="text-blue-600 hover:text-blue-500">
                Entre em contato
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}