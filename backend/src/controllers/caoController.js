const Cao = require('../models/caoModel');
const path = require('path');
const fs = require('fs');

// Criar um novo cão
exports.create = async (req, res) => {
  try {
    const {
      nome, id_raca, sexo, idade, temperamento, 
      porte, pelagem, descricao, vacinas, castrado, 
      valor_apadrinhamento, observacao
    } = req.body;
    
    // Obter ID do usuário do token
    const id_usuario = req.user.id_usuario;
    
    // Validar campos obrigatórios
    if (!nome || !id_raca || !sexo || !idade || !temperamento || 
        !porte || !pelagem || !descricao || !vacinas || 
        castrado === undefined || !valor_apadrinhamento) {
      return res.status(400).json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }
    
    // Processar upload de foto
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/caes/${req.file.filename}`;
    }
    
    const caoData = {
      id_usuario,
      nome,
      id_raca,
      sexo,
      idade,
      temperamento,
      porte,
      pelagem,
      descricao,
      vacinas,
      castrado: castrado ? 1 : 0,
      foto_url,
      valor_apadrinhamento,
      observacao: observacao || null
    };
    
    const id_cao = await Cao.create(caoData);
    
    res.status(201).json({
      message: 'Cão cadastrado com sucesso!',
      id_cao: id_cao
    });
    
  } catch (error) {
    console.error('Erro ao criar cão:', error);
    
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Listar todos os cães (com filtros e paginação)
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', 
            porte, sexo, idade, temperamento, castrado } = req.query;
    
    const filters = {
      search,
      porte,
      sexo,
      idade,
      temperamento,
      castrado
    };
    
    const result = await Cao.findAll(page, limit, filters);
    
    res.json({
      caes: result.caes,
      paginacao: result.paginacao
    });
    
  } catch (error) {
    console.error('Erro ao buscar cães:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar cão por ID
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    
    const cao = await Cao.findById(id);
    
    if (!cao) {
      return res.status(404).json({ error: 'Cão não encontrado' });
    }
    
    res.json(cao);
    
  } catch (error) {
    console.error('Erro ao buscar cão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar cão
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome, id_raca, sexo, idade, temperamento, 
      porte, pelagem, descricao, vacinas, castrado, 
      valor_apadrinhamento, observacao, ativo
    } = req.body;
    
    // Processar upload de nova foto, se fornecida
    let foto_url = null;
    if (req.file) {
      foto_url = `/uploads/caes/${req.file.filename}`;
      
      // Remover foto antiga se existir
      const cao = await Cao.findById(id);
      if (cao && cao.foto_url && cao.foto_url.startsWith('/uploads/')) {
        const oldPath = path.join(__dirname, '..', '..', 'public', cao.foto_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
    }
    
    const caoData = {
      nome,
      id_raca,
      sexo,
      idade,
      temperamento,
      porte,
      pelagem,
      descricao,
      vacinas,
      castrado: castrado !== undefined ? (castrado ? 1 : 0) : undefined,
      foto_url,
      valor_apadrinhamento,
      observacao,
      ativo: ativo !== undefined ? (ativo ? 1 : 0) : undefined
    };
    
    await Cao.update(id, caoData);
    
    res.json({ message: 'Cão atualizado com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar cão:', error);
    
    if (error.message === 'Cão não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('não encontrada') || error.message.includes('não encontrado')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir cão (soft delete)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Cao.delete(id);
    
    res.json({ message: 'Cão removido com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao remover cão:', error);
    
    if (error.message === 'Cão não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Adicionar vacina ao cão
exports.addVacina = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_vacina, data, proxima_dose, observacao } = req.body;
    
    // Validar campos
    if (!id_vacina || !data) {
      return res.status(400).json({ 
        error: 'ID da vacina e data são obrigatórios' 
      });
    }
    
    await Cao.addVacina(id, {
      id_vacina,
      data,
      proxima_dose,
      observacao
    });
    
    res.status(201).json({
      message: 'Vacina registrada com sucesso!'
    });
    
  } catch (error) {
    console.error('Erro ao adicionar vacina:', error);
    
    if (error.message.includes('não encontrado') || error.message.includes('não encontrada')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar cães para adoção
exports.findForAdoption = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const result = await Cao.findForAdoption(page, limit);
    
    res.json({
      caes: result.caes,
      paginacao: result.paginacao
    });
    
  } catch (error) {
    console.error('Erro ao buscar cães para adoção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar vacinas do cão
exports.getVaccines = async (req, res) => {
  try {
    const { id } = req.params;
    
    const vacinas = await Cao.getVaccines(id);
    
    res.json(vacinas);
    
  } catch (error) {
    console.error('Erro ao buscar vacinas do cão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar histórico médico do cão
exports.getMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const historico = await Cao.getMedicalHistory(id);
    
    res.json(historico);
    
  } catch (error) {
    console.error('Erro ao buscar histórico médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar estatísticas dos cães
exports.getStats = async (req, res) => {
  try {
    const stats = await Cao.getStats();
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Upload de múltiplas fotos para o cão
exports.uploadPhotos = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Nenhuma foto fornecida' });
    }
    
    const fotos_url = req.files.map(file => `/uploads/caes/${file.filename}`);
    
    await Cao.addPhotos(id, fotos_url);
    
    res.json({ 
      message: 'Fotos adicionadas com sucesso!',
      fotos_url: fotos_url
    });
    
  } catch (error) {
    console.error('Erro ao fazer upload das fotos:', error);
    
    if (error.message === 'Cão não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};