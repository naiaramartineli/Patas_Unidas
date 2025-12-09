import { useState, useCallback } from 'react';
import { caoService } from '../services/caoService';

export const useCaes = () => {
  const [caes, setCaes] = useState([]);
  const [cao, setCao] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [stats, setStats] = useState(null);
  const [vacinas, setVacinas] = useState([]);
  const [historico, setHistorico] = useState([]);

  const createCao = useCallback(async (caoData, foto) => {
    try {
      setLoading(true);
      const response = await caoService.create(caoData, foto);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao criar cão';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const findAllCaes = useCallback(async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      const response = await caoService.findAll(page, limit, filters);
      setCaes(response.data.caes);
      setPagination(response.data.paginacao);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar cães';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const findCaoById = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await caoService.findOne(id);
      setCao(response.data);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar cão';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCao = useCallback(async (id, caoData, foto) => {
    try {
      setLoading(true);
      const response = await caoService.update(id, caoData, foto);
      
      // Atualizar na lista se necessário
      setCaes(prev => prev.map(cao => 
        cao.id_cao === id ? { ...cao, ...caoData } : cao
      ));
      
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao atualizar cão';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCao = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await caoService.delete(id);
      
      // Remover da lista
      setCaes(prev => prev.filter(cao => cao.id_cao !== id));
      
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao excluir cão';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const findForAdoption = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await caoService.findForAdoption(page, limit);
      setCaes(response.data.caes);
      setPagination(response.data.paginacao);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar cães para adoção';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getVaccines = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await caoService.getVaccines(id);
      setVacinas(response.data);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar vacinas';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const addVacina = useCallback(async (id, vacinaData) => {
    try {
      setLoading(true);
      const response = await caoService.addVacina(id, vacinaData);
      
      // Atualizar lista de vacinas
      setVacinas(prev => [...prev, response.data]);
      
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao adicionar vacina';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getMedicalHistory = useCallback(async (id) => {
    try {
      setLoading(true);
      const response = await caoService.getMedicalHistory(id);
      setHistorico(response.data);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao buscar histórico';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadPhotos = useCallback(async (id, fotos) => {
    try {
      setLoading(true);
      const response = await caoService.uploadPhotos(id, fotos);
      setError(null);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Erro ao fazer upload de fotos';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await caoService.getStats();
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
    caes,
    cao,
    loading,
    error,
    pagination,
    stats,
    vacinas,
    historico,
    createCao,
    findAllCaes,
    findCaoById,
    updateCao,
    deleteCao,
    findForAdoption,
    getVaccines,
    addVacina,
    getMedicalHistory,
    uploadPhotos,
    getStats,
    setCao,
    setCaes,
    clearError: () => setError(null)
  };
};