import api from './api';

export const caoService = {
  // Criar cão
  create: async (caoData, foto) => {
    const formData = new FormData();
    
    // Adicionar campos do cão
    Object.keys(caoData).forEach(key => {
      formData.append(key, caoData[key]);
    });
    
    // Adicionar foto se existir
    if (foto) {
      formData.append('foto', foto);
    }
    
    const response = await api.post('/caes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Listar todos os cães
  findAll: async (page = 1, limit = 10, filters = {}) => {
    const response = await api.get('/caes', { params: { page, limit, ...filters } });
    return response.data;
  },

  // Buscar cão por ID
  findOne: async (id) => {
    const response = await api.get(`/caes/${id}`);
    return response.data;
  },

  // Atualizar cão
  update: async (id, caoData, foto) => {
    const formData = new FormData();
    
    // Adicionar campos do cão
    Object.keys(caoData).forEach(key => {
      formData.append(key, caoData[key]);
    });
    
    // Adicionar foto se existir
    if (foto) {
      formData.append('foto', foto);
    }
    
    const response = await api.put(`/caes/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Excluir cão
  delete: async (id) => {
    const response = await api.delete(`/caes/${id}`);
    return response.data;
  },

  // Buscar cães para adoção
  findForAdoption: async (page = 1, limit = 10) => {
    const response = await api.get('/caes/adocao', { params: { page, limit } });
    return response.data;
  },

  // Buscar vacinas do cão
  getVaccines: async (id) => {
    const response = await api.get(`/caes/${id}/vacinas`);
    return response.data;
  },

  // Adicionar vacina
  addVacina: async (id, vacinaData) => {
    const response = await api.post(`/caes/${id}/vacinas`, vacinaData);
    return response.data;
  },

  // Buscar histórico médico
  getMedicalHistory: async (id) => {
    const response = await api.get(`/caes/${id}/historico`);
    return response.data;
  },

  // Upload múltiplas fotos
  uploadPhotos: async (id, fotos) => {
    const formData = new FormData();
    fotos.forEach((foto, index) => {
      formData.append(`fotos`, foto);
    });
    
    const response = await api.post(`/caes/${id}/fotos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Buscar estatísticas
  getStats: async () => {
    const response = await api.get('/caes/estatisticas');
    return response.data;
  }
};