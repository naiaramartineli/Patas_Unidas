import api from './api';

export const racaService = {
  // Criar raça (admin)
  create: async (nome) => {
    const response = await api.post('/racas', { nome });
    return response.data;
  },

  // Listar todas as raças
  findAll: async () => {
    const response = await api.get('/racas');
    return response.data;
  },

  // Buscar raça por ID
  findOne: async (id) => {
    const response = await api.get(`/racas/${id}`);
    return response.data;
  },

  // Atualizar raça (admin)
  update: async (id, nome) => {
    const response = await api.put(`/racas/${id}`, { nome });
    return response.data;
  },

  // Excluir raça (admin)
  delete: async (id) => {
    const response = await api.delete(`/racas/${id}`);
    return response.data;
  },

  // Buscar raças com contagem de cães
  findWithDogCount: async () => {
    const response = await api.get('/racas/contagem');
    return response.data;
  },

  // Buscar estatísticas
  getStats: async () => {
    const response = await api.get('/racas/estatisticas');
    return response.data;
  },

  // Buscar cães por raça
  findDogsByRace: async (id) => {
    const response = await api.get(`/racas/${id}/caes`);
    return response.data;
  }
};