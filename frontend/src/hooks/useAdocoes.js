import { useState, useCallback } from 'react';
import { adocaoService } from '../services/adocaoService';

export const useAdocoes = () => {
  const [adocoes, setAdocoes] = useState([]);
  const [adocao, setAdocao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);

  const solicitarAdocao = useCallback(async (id_cao, observacao = '') => {
    try {
      setLoading(true);
      const response = await adocaoService.solicitarAdocao(id_cao, observacao);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao solicitar adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage, code: err.response?.data?.code };
    } finally {
      setLoading(false);
    }
  }, []);

  const listarMinhasAdocoes = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await adocaoService.listarMinhasAdocoes(page, limit);
      setAdocoes(response.data.adocoes);
      setPagination(response.data.paginacao);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao listar adoções';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const listarSolicitacoes = useCallback(async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      const response = await adocaoService.listarSolicitacoes(page, limit, filters);
      setAdocoes(response.data.adocoes);
      setPagination(response.data.paginacao);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao listar solicitações';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarAdocao = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await adocaoService.buscarAdocao(id);
      setAdocao(response.data);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const aprovarAdocao = useCallback(async (id, observacao = '') => {
    try {
      setLoading(true);
      const response = await adocaoService.aprovarAdocao(id, observacao);
      
      // Atualizar a adoção na lista se necessário
      setAdocoes(prev => prev.map(adocao => 
        adocao.id_adotar === id ? { ...adocao, status: 1, status_texto: 'Aprovada' } : adocao
      ));
      
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao aprovar adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage, code: err.response?.data?.code };
    } finally {
      setLoading(false);
    }
  }, []);

  const recusarAdocao = useCallback(async (id, motivo) => {
    try {
      setLoading(true);
      const response = await adocaoService.recusarAdocao(id, motivo);
      
      // Atualizar a adoção na lista se necessário
      setAdocoes(prev => prev.map(adocao => 
        adocao.id_adotar === id ? { ...adocao, status: 2, status_texto: 'Recusada', motivo_recusa: motivo } : adocao
      ));
      
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao recusar adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage, code: err.response?.data?.code };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelarAdocao = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await adocaoService.cancelarAdocao(id);
      
      // Remover a adoção da lista
      setAdocoes(prev => prev.filter(adocao => adocao.id_adotar !== id));
      
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao cancelar adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage, code: err.response?.data?.code };
    } finally {
      setLoading(false);
    }
  }, []);

  const verificarAdocao = useCallback(async (id_cao) => {
    try {
      setLoading(true);
      const response = await adocaoService.verificarAdocao(id_cao);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao verificar adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const buscarEstatisticas = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adocaoService.buscarEstatisticas();
      setStats(response.data);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar estatísticas';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    adocoes,
    adocao,
    loading,
    error,
    pagination,
    stats,
    solicitarAdocao,
    listarMinhasAdocoes,
    listarSolicitacoes,
    buscarAdocao,
    aprovarAdocao,
    recusarAdocao,
    cancelarAdocao,
    verificarAdocao,
    buscarEstatisticas,
    setAdocao,
    setAdocoes,
    clearError: () => setError(null)
  };
};