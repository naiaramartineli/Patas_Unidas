import api from './api';

export const userService = {
  // Listar todos os usuários (admin)
  findAll: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/usuarios', { params: { page, limit, search } });
    return response.data;
  },

  // Buscar usuário por ID
  findOne: async (id) => {
    const response = await api.get(`/usuarios/${id}`);
    return response.data;
  },

  // Atualizar perfil do usuário
  updateProfile: async (id, profileData) => {
    const response = await api.put(`/usuarios/${id}/profile`, profileData);
    return response.data;
  },

  // Atualizar permissões (admin)
  updatePermission: async (id, id_permissao) => {
    const response = await api.put(`/usuarios/${id}/permission`, { id_permissao });
    return response.data;
  },

  // Excluir usuário
  delete: async (id) => {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  // Adicionar/Atualizar endereço
  addOrUpdateAddress: async (addressData) => {
    const response = await api.post('/usuarios/endereco', addressData);
    return response.data;
  },

  // Remover endereço
  removeAddress: async () => {
    const response = await api.delete('/usuarios/endereco');
    return response.data;
  },

  // Buscar endereço
  getAddress: async () => {
    const response = await api.get('/usuarios/endereco');
    return response.data;
  },

  // Verificar se tem endereço
  hasAddress: async () => {
    const response = await api.get('/usuarios/endereco/verificar');
    return response.data;
  },

  // Buscar estatísticas (admin)
  getStats: async () => {
    const response = await api.get('/usuarios/estatisticas');
    return response.data;
  },

  // Buscar adoções do usuário
  getUserAdoptions: async (id) => {
    const response = await api.get(`/usuarios/${id}/adocoes`);
    return response.data;
  },

  // Buscar apadrinhamentos do usuário
  getUserSponsorships: async (id) => {
    const response = await api.get(`/usuarios/${id}/apadrinhamentos`);
    return response.data;
  },

  // Buscar minhas adoções
  getMyAdoptions: async () => {
    const response = await api.get('/usuarios/adocoes/minhas');
    return response.data;
  },

  // Buscar meus apadrinhamentos
  getMySponsorships: async () => {
    const response = await api.get('/usuarios/apadrinhamentos/meus');
    return response.data;
  },

  // Upload foto de perfil
  uploadProfilePhoto: async (foto) => {
    const formData = new FormData();
    formData.append('foto', foto);
    
    const response = await api.post('/usuarios/foto-perfil', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Ativar/Desativar usuário (admin)
  toggleUserStatus: async (id, ativo) => {
    const response = await api.put(`/usuarios/${id}/status`, { ativo });
    return response.data;
  },

  // Buscar histórico de atividades
  getUserActivity: async (id) => {
    const response = await api.get(`/usuarios/${id}/atividades`);
    return response.data;
  }
};