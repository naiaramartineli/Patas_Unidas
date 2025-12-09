import api from './api';

export const vacinaService = {
  // Criar vacina (admin)
  create: async (vacinaData) => {
    const response = await api.post('/vacinas', vacinaData);
    return response.data;
  },

  // Listar todas as vacinas
  findAll: async (page = 1, limit = 10, search = '') => {
    const response = await api.get('/vacinas', { params: { page, limit, search } });
    return response.data;
  },

  // Buscar vacina por ID
  findOne: async (id) => {
    const response = await api.get(`/vacinas/${id}`);
    return response.data;
  },

  // Atualizar vacina (admin)
  update: async (id, vacinaData) => {
    const response = await api.put(`/vacinas/${id}`, vacinaData);
    return response.data;
  },

  // Excluir vacina (admin)
  delete: async (id) => {
    const response = await api.delete(`/vacinas/${id}`);
    return response.data;
  },

  // Buscar vacinas por categoria
  findByCategory: async (categoria) => {
    const response = await api.get(`/vacinas/categoria/${categoria}`);
    return response.data;
  },

  // Buscar vacinas por idade recomendada
  findByAge: async (idade) => {
    const response = await api.get(`/vacinas/idade/${idade}`);
    return response.data;
  },

  // Buscar estatísticas
  getStats: async () => {
    const response = await api.get('/vacinas/estatisticas');
    return response.data;
  },

  // Buscar vacinas aplicadas a um cão
  findByDogId: async (id_cao) => {
    const response = await api.get(`/vacinas/cao/${id_cao}`);
    return response.data;
  },

  // Aplicar vacina a um cão
  applyToDog: async (aplicacaoData) => {
    const response = await api.post('/vacinas/aplicar', aplicacaoData);
    return response.data;
  }
};