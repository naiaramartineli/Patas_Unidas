import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { setAuthTokens, clearAuthTokens, getAuthTokens } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Verificar autenticação ao carregar
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = useCallback(async () => {
    const tokens = getAuthTokens();
    
    if (!tokens.access_token) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await authService.verifyAuth();
      setUser(response.data.user);
      setError(null);
    } catch (err) {
      console.error('Erro na verificação de autenticação:', err);
      if (err.response?.status === 401) {
        clearAuthTokens();
      }
      setError(err.response?.data?.error || 'Erro de autenticação');
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, senha) => {
    try {
      setLoading(true);
      const response = await authService.login(email, senha);
      
      const { access_token, refresh_token } = response.data.tokens;
      setAuthTokens(access_token, refresh_token);
      
      setUser(response.data.user);
      setError(null);
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro no login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await authService.register(userData);
      
      const { access_token, refresh_token } = response.data.tokens;
      setAuthTokens(access_token, refresh_token);
      
      setUser(response.data.user);
      setError(null);
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro no registro';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.error('Erro no logout:', err);
    } finally {
      clearAuthTokens();
      setUser(null);
      setError(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(profileData);
      
      if (response.data.token) {
        localStorage.setItem('access_token', response.data.token);
      }
      
      setUser(response.data.user || user);
      setError(null);
      
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao atualizar perfil';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [user]);

  const changePassword = useCallback(async (senha_atual, nova_senha) => {
    try {
      setLoading(true);
      const response = await authService.changePassword(senha_atual, nova_senha);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao alterar senha';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao solicitar recuperação';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token, nova_senha) => {
    try {
      setLoading(true);
      const response = await authService.resetPassword(token, nova_senha);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao resetar senha';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.id_permissao === 1,
    isAdopter: user?.id_permissao === 2,
    isSponsor: user?.id_permissao === 3,
    hasAddress: user?.tem_endereco || false,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    checkAuth,
    setUser,
    clearError: () => setError(null)
  };
};