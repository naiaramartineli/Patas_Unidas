import api from './api';

export const adocaoService = {
  // Solicitar adoção
  solicitarAdocao: async (id_cao, observacao) => {
    const response = await api.post('/adocoes/solicitar', { id_cao, observacao });
    return response.data;
  },

  // Listar minhas adoções
  listarMinhasAdocoes: async (page = 1, limit = 10) => {
    const response = await api.get('/adocoes/minhas', { params: { page, limit } });
    return response.data;
  },

  // Listar todas as solicitações (admin)
  listarSolicitacoes: async (page = 1, limit = 10, filters = {}) => {
    const response = await api.get('/adocoes/solicitacoes', { params: { page, limit, ...filters } });
    return response.data;
  },

  // Buscar adoção por ID
  buscarAdocao: async (id) => {
    const response = await api.get(`/adocoes/${id}`);
    return response.data;
  },

  // Atualizar adoção (admin)
  atualizarAdocao: async (id, dados) => {
    const response = await api.put(`/adocoes/${id}`, dados);
    return response.data;
  },

  // Aprovar adoção (admin)
  aprovarAdocao: async (id, observacao) => {
    const response = await api.post(`/adocoes/${id}/aprovar`, { observacao });
    return response.data;
  },

  // Recusar adoção (admin)
  recusarAdocao: async (id, motivo) => {
    const response = await api.post(`/adocoes/${id}/recusar`, { motivo });
    return response.data;
  },

  // Cancelar adoção
  cancelarAdocao: async (id) => {
    const response = await api.delete(`/adocoes/${id}`);
    return response.data;
  },

  // Verificar se pode adotar
  verificarAdocao: async (id_cao) => {
    const response = await api.get(`/adocoes/verificar/${id_cao}`);
    return response.data;
  },

  // Buscar estatísticas (admin)
  buscarEstatisticas: async () => {
    const response = await api.get('/adocoes/estatisticas');
    return response.data;
  }
};