import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { usersService, type User } from '../services';

interface AuthContextType {
  user: SupabaseUser | null;
  userProfile: User | null;
  loading: boolean;
  isEmailConfirmed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resendConfirmation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEmailConfirmed, setIsEmailConfirmed] = useState(false);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await loadUserProfile(session.user.id);
      }
      
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setIsEmailConfirmed(!!session?.user?.email_confirmed_at);
        
        if (session?.user) {
          // Only load profile if email is confirmed
          if (session.user.email_confirmed_at) {
            await loadUserProfile(session.user.id);
          } else {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const profile = await usersService.getById(userId);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      setUserProfile(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Check if email is not confirmed
        if (error.message.includes('Email not confirmed')) {
          throw new Error('Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.');
        }
        throw error;
      }

      // Check if user profile exists and is active
      if (data.user && data.user.email_confirmed_at) {
        const profile = await usersService.getById(data.user.id);
        if (!profile || !profile.isActive) {
          throw new Error('Sua conta não está ativa ou não foi encontrada. Entre em contato com o administrador.');
        }
      }
    } catch (error: any) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name
          }
        }
      });
      
      if (error) {
        throw error;
      }

      // The user profile will be created automatically by the trigger
      // when the email is confirmed
      if (data.user && !data.user.email_confirmed_at) {
        throw new Error('Conta criada com sucesso! Verifique seu email para confirmar sua conta antes de fazer login.');
      }
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user || !userProfile) {
      throw new Error('No user logged in');
    }

    try {
      const updatedProfile = await usersService.update(user.id, updates);
      setUserProfile(updatedProfile);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const resendConfirmation = async () => {
    if (!user?.email) {
      throw new Error('Nenhum usuário logado ou email não encontrado');
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Error resending confirmation:', error);
      throw new Error('Erro ao reenviar email de confirmação. Tente novamente.');
    }
  };

  const value: AuthContextType = {
    user,
    userProfile,
    loading,
    isEmailConfirmed,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resendConfirmation,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}