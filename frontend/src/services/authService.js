import api from './api';

export const authService = {
  // Registrar novo usuário
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },

  // Logout
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  // Obter perfil
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Atualizar perfil
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Alterar senha
  changePassword: async (senha_atual, nova_senha) => {
    const response = await api.put('/auth/change-password', { senha_atual, nova_senha });
    return response.data;
  },

  // Esqueci senha
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  // Resetar senha
  resetPassword: async (token, nova_senha) => {
    const response = await api.post(`/auth/reset-password/${token}`, { nova_senha });
    return response.data;
  },

  // Verificar autenticação
  verifyAuth: async () => {
    const response = await api.get('/auth/verify');
    return response.data;
  }
};