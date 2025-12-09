const Vacina = require('../models/vacinaModel');

// Criar nova vacina
exports.create = async (req, res) => {
  try {
    const {
      nome, descricao, idade_recomendada, dose_unica,
      qtd_doses, intervalo_dose, intervalo_reforco
    } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !descricao || !idade_recomendada || dose_unica === undefined || !intervalo_reforco) {
      return res.status(400).json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }
    
    // Validar se dose_unica é booleano
    if (typeof dose_unica !== 'boolean' && dose_unica !== 0 && dose_unica !== 1) {
      return res.status(400).json({ 
        error: 'O campo dose_unica deve ser verdadeiro ou falso' 
      });
    }
    
    const vacinaData = {
      nome,
      descricao,
      idade_recomendada,
      dose_unica: dose_unica ? 1 : 0,
      qtd_doses: qtd_doses || null,
      intervalo_dose: intervalo_dose || null,
      intervalo_reforco
    };
    
    const id_vacina = await Vacina.create(vacinaData);
    
    res.status(201).json({
      message: 'Vacina cadastrada com sucesso!',
      id_vacina: id_vacina
    });
    
  } catch (error) {
    console.error('Erro ao criar vacina:', error);
    
    if (error.message === 'Vacina já cadastrada') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar todas as vacinas
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const result = await Vacina.findAll(page, limit, search);
    
    res.json({
      vacinas: result.vacinas,
      paginacao: result.paginacao
    });
    
  } catch (error) {
    console.error('Erro ao buscar vacinas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar vacina por ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vacina = await Vacina.findById(id);
    
    if (!vacina) {
      return res.status(404).json({ error: 'Vacina não encontrada' });
    }
    
    res.json(vacina);
    
  } catch (error) {
    console.error('Erro ao buscar vacina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar vacina
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, descricao, idade_recomendada, dose_unica,
      qtd_doses, intervalo_dose, intervalo_reforco
    } = req.body;
    
    // Validar se dose_unica é booleano (se fornecido)
    if (dose_unica !== undefined && typeof dose_unica !== 'boolean' && dose_unica !== 0 && dose_unica !== 1) {
      return res.status(400).json({ 
        error: 'O campo dose_unica deve ser verdadeiro ou falso' 
      });
    }
    
    const vacinaData = {
      nome,
      descricao,
      idade_recomendada,
      dose_unica: dose_unica !== undefined ? (dose_unica ? 1 : 0) : undefined,
      qtd_doses,
      intervalo_dose,
      intervalo_reforco
    };
    
    await Vacina.update(id, vacinaData);
    
    res.json({ message: 'Vacina atualizada com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar vacina:', error);
    
    if (error.message === 'Vacina não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Já existe uma vacina com este nome') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir vacina
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Vacina.delete(id);
    
    res.json({ message: 'Vacina removida com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao remover vacina:', error);
    
    if (error.message === 'Vacina não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Não é possível excluir')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar vacinas por categoria
exports.findByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;
    
    if (!['obrigatoria', 'opcional'].includes(categoria)) {
      return res.status(400).json({ 
        error: 'Categoria inválida. Use: obrigatoria ou opcional' 
      });
    }
    
    const vacinas = await Vacina.findByCategory(categoria);
    res.json(vacinas);
    
  } catch (error) {
    console.error('Erro ao buscar vacinas por categoria:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar vacinas recomendadas por idade
exports.findByAge = async (req, res) => {
  try {
    const { idade } = req.params;
    
    if (!idade || isNaN(idade)) {
      return res.status(400).json({ 
        error: 'Idade inválida. Deve ser um número' 
      });
    }
    
    const vacinas = await Vacina.findByAge(idade);
    res.json(vacinas);
    
  } catch (error) {
    console.error('Erro ao buscar vacinas por idade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar estatísticas das vacinas
exports.getStats = async (req, res) => {
  try {
    const stats = await Vacina.getStats();
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar vacinas aplicadas a um cão específico
exports.findByDogId = async (req, res) => {
  try {
    const { id_cao } = req.params;
    
    if (!id_cao) {
      return res.status(400).json({ 
        error: 'ID do cão é obrigatório' 
      });
    }
    
    const vacinas = await Vacina.findByDogId(id_cao);
    res.json(vacinas);
    
  } catch (error) {
    console.error('Erro ao buscar vacinas do cão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Registrar aplicação de vacina em cão
exports.applyToDog = async (req, res) => {
  try {
    const { id_vacina, id_cao, data, proxima_dose, observacao } = req.body;
    
    if (!id_vacina || !id_cao || !data) {
      return res.status(400).json({ 
        error: 'ID da vacina, ID do cão e data são obrigatórios' 
      });
    }
    
    const aplicacaoId = await Vacina.applyToDog({
      id_vacina,
      id_cao,
      data,
      proxima_dose,
      observacao
    });
    
    res.status(201).json({
      message: 'Vacina aplicada com sucesso!',
      id_aplicacao: aplicacaoId
    });
    
  } catch (error) {
    console.error('Erro ao aplicar vacina:', error);
    
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};