const Raca = require('../models/racaModel');

// Criar nova raça
exports.create = async (req, res) => {
  try {
    const { nome } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da raça é obrigatório' });
    }
    
    const id_raca = await Raca.create(nome);
    
    res.status(201).json({
      message: 'Raça cadastrada com sucesso!',
      id_raca: id_raca
    });
    
  } catch (error) {
    console.error('Erro ao criar raça:', error);
    
    if (error.message === 'Raça já cadastrada') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar todas as raças (ativas)
exports.findAll = async (req, res) => {
  try {
    const racas = await Raca.findAll();
    res.json(racas);
    
  } catch (error) {
    console.error('Erro ao buscar raças:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar raça por ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const raca = await Raca.findById(id);
    
    if (!raca) {
      return res.status(404).json({ error: 'Raça não encontrada' });
    }
    
    res.json(raca);
    
  } catch (error) {
    console.error('Erro ao buscar raça:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar raça
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome } = req.body;
    
    if (!nome) {
      return res.status(400).json({ error: 'Nome da raça é obrigatório' });
    }
    
    await Raca.update(id, nome);
    
    res.json({ message: 'Raça atualizada com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar raça:', error);
    
    if (error.message === 'Raça não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message === 'Já existe uma raça com este nome') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir raça (soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Raca.delete(id);
    
    res.json({ message: 'Raça removida com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao remover raça:', error);
    
    if (error.message === 'Raça não encontrada') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('Não é possível excluir')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar raças com contagem de cães
exports.findWithDogCount = async (req, res) => {
  try {
    const racas = await Raca.findWithDogCount();
    res.json(racas);
    
  } catch (error) {
    console.error('Erro ao buscar raças com contagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar estatísticas das raças
exports.getStats = async (req, res) => {
  try {
    const stats = await Raca.getStats();
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar cães por raça
exports.findDogsByRace = async (req, res) => {
  try {
    const { id } = req.params;
    
    const caes = await Raca.findDogsByRaceId(id);
    res.json(caes);
    
  } catch (error) {
    console.error('Erro ao buscar cães por raça:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};