import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types/auth.types';
import { apiService } from '../services/api.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<{ message: string; token?: string }>;
  resetPassword: (token: string, password: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const profile = await apiService.getProfile();
          setUser(profile);
        } catch (err) {
          console.error('Failed to load profile:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleAuthResponse = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.token);
    localStorage.setItem('token', response.token);
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.login({ email, password });
      handleAuthResponse(response);
    } catch (err: any) {
      const errorMessage = err.error || 'Login failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.register(data);
      handleAuthResponse(response);
    } catch (err: any) {
      const errorMessage = err.error || err.errors?.[0]?.msg || 'Registration failed. Please try again.';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    apiService.logout().catch(console.error);
  };

  const requestPasswordReset = async (email: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.requestPasswordReset({ email });
      return response;
    } catch (err: any) {
      const errorMessage = err.error || 'Failed to request password reset';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async (token: string, password: string) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await apiService.resetPassword({ token, password });
      handleAuthResponse(response); // Auto-login after successful reset
    } catch (err: any) {
      const errorMessage = err.error || err.errors?.[0]?.msg || 'Failed to reset password';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    error,
    clearError
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
