import api from './api';

export const enderecoService = {
  // Buscar endereço por ID (admin)
  getAddressById: async (id_endereco) => {
    const response = await api.get(`/enderecos/${id_endereco}`);
    return response.data;
  },

  // Buscar endereços por CEP
  getAddressByCep: async (cep) => {
    const response = await api.get(`/enderecos/cep/${cep}`);
    return response.data;
  },

  // Buscar endereços por cidade
  getAddressesByCity: async (cidade, uf, limit = 50) => {
    const response = await api.get(`/enderecos/cidade/${cidade}/${uf}`, { params: { limit } });
    return response.data;
  },

  // Buscar endereços por bairro
  getAddressesByNeighborhood: async (bairro, cidade, uf, limit = 100) => {
    const response = await api.get(`/enderecos/bairro/${bairro}/${cidade}/${uf}`, { params: { limit } });
    return response.data;
  },

  // Criar endereço (admin)
  createAddress: async (addressData) => {
    const response = await api.post('/enderecos', addressData);
    return response.data;
  },

  // Atualizar endereço (admin)
  updateAddress: async (id_endereco, addressData) => {
    const response = await api.put(`/enderecos/${id_endereco}`, addressData);
    return response.data;
  },

  // Excluir endereço (admin)
  deleteAddress: async (id_endereco) => {
    const response = await api.delete(`/enderecos/${id_endereco}`);
    return response.data;
  },

  // Buscar usuários por endereço (admin)
  getUsersByAddress: async (id_endereco) => {
    const response = await api.get(`/enderecos/${id_endereco}/usuarios`);
    return response.data;
  },

  // Buscar estatísticas (admin)
  getStats: async () => {
    const response = await api.get('/enderecos/estatisticas');
    return response.data;
  },

  // Buscar todos os endereços (admin)
  getAllAddresses: async (page = 1, limit = 50) => {
    const response = await api.get('/enderecos', { params: { page, limit } });
    return response.data;
  },

  // Buscar por logradouro (autocomplete)
  searchByStreet: async (logradouro, limit = 20) => {
    const response = await api.get('/enderecos/buscar', { params: { logradouro, limit } });
    return response.data;
  },

  // Buscar cidades por UF
  getCitiesByState: async (uf) => {
    const response = await api.get(`/enderecos/uf/${uf}/cidades`);
    return response.data;
  },

  // Buscar bairros por cidade
  getNeighborhoodsByCity: async (cidade, uf) => {
    const response = await api.get(`/enderecos/cidade/${cidade}/${uf}/bairros`);
    return response.data;
  }
};