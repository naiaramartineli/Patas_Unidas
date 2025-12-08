const Endereco = require('../models/enderecoModel');

// Buscar endereço por ID
exports.findById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const endereco = await Endereco.findById(id);
    
    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    res.json(endereco);
    
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar endereços por CEP
exports.findByCep = async (req, res) => {
  try {
    const { cep } = req.params;
    
    // Formatar CEP (remover traços e espaços)
    const formattedCep = cep.replace(/[^\d]/g, '');
    
    if (formattedCep.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido. Deve conter 8 dígitos.' });
    }
    
    const enderecos = await Endereco.findByCep(formattedCep);
    
    res.json(enderecos);
    
  } catch (error) {
    console.error('Erro ao buscar endereço por CEP:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar endereços por cidade
exports.findByCity = async (req, res) => {
  try {
    const { cidade, uf, limit } = req.query;
    
    if (!cidade || !uf) {
      return res.status(400).json({ 
        error: 'Cidade e UF são obrigatórios' 
      });
    }
    
    const enderecos = await Endereco.findByCity(cidade, uf, limit || 50);
    
    res.json(enderecos);
    
  } catch (error) {
    console.error('Erro ao buscar endereços por cidade:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar endereços por bairro
exports.findByNeighborhood = async (req, res) => {
  try {
    const { bairro, cidade, uf } = req.query;
    
    if (!bairro || !cidade || !uf) {
      return res.status(400).json({ 
        error: 'Bairro, cidade e UF são obrigatórios' 
      });
    }
    
    const enderecos = await Endereco.findByNeighborhood(bairro, cidade, uf);
    
    res.json(enderecos);
    
  } catch (error) {
    console.error('Erro ao buscar endereços por bairro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar endereço
exports.create = async (req, res) => {
  try {
    const {
      logradouro, bairro, numero, complemento, cidade, uf, cep
    } = req.body;
    
    // Validar campos obrigatórios
    if (!logradouro || !bairro || !numero || !cidade || !uf || !cep) {
      return res.status(400).json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }
    
    // Validar UF
    const ufValida = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    
    if (!ufValida.includes(uf.toUpperCase())) {
      return res.status(400).json({ error: 'UF inválida' });
    }
    
    // Validar CEP
    const cepFormatado = cep.replace(/[^\d]/g, '');
    if (cepFormatado.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido. Deve conter 8 dígitos.' });
    }
    
    const enderecoData = {
      logradouro,
      bairro,
      numero,
      complemento,
      cidade,
      uf,
      cep
    };
    
    const id_endereco = await Endereco.create(enderecoData);
    
    res.status(201).json({
      message: 'Endereço criado com sucesso!',
      id_endereco: id_endereco
    });
    
  } catch (error) {
    console.error('Erro ao criar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar endereço
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      logradouro, bairro, numero, complemento, cidade, uf, cep
    } = req.body;
    
    // Validar campos obrigatórios
    if (!logradouro || !bairro || !numero || !cidade || !uf || !cep) {
      return res.status(400).json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      });
    }
    
    // Validar UF
    const ufValida = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                      'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                      'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
    
    if (!ufValida.includes(uf.toUpperCase())) {
      return res.status(400).json({ error: 'UF inválida' });
    }
    
    // Validar CEP
    const cepFormatado = cep.replace(/[^\d]/g, '');
    if (cepFormatado.length !== 8) {
      return res.status(400).json({ error: 'CEP inválido. Deve conter 8 dígitos.' });
    }
    
    const enderecoData = {
      logradouro,
      bairro,
      numero,
      complemento,
      cidade,
      uf,
      cep
    };
    
    await Endereco.update(id, enderecoData);
    
    res.json({ message: 'Endereço atualizado com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar endereço:', error);
    
    if (error.message === 'Endereço não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir endereço
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    
    await Endereco.delete(id);
    
    res.json({ message: 'Endereço excluído com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao excluir endereço:', error);
    
    if (error.message === 'Endereço não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('não é possível excluir')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar endereço por usuário
exports.findByUser = async (req, res) => {
  try {
    const { id_usuario } = req.params;
    
    const endereco = await Endereco.findByUserId(id_usuario);
    
    if (!endereco) {
      return res.status(404).json({ 
        error: 'Usuário não possui endereço cadastrado ou não encontrado' 
      });
    }
    
    res.json(endereco);
    
  } catch (error) {
    console.error('Erro ao buscar endereço por usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar usuários por endereço
exports.findUsersByAddress = async (req, res) => {
  try {
    const { id_endereco } = req.params;
    
    const usuarios = await Endereco.findUsersByAddressId(id_endereco);
    
    // Remover dados sensíveis
    const usuariosSeguros = usuarios.map(user => {
      const { cpf, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });
    
    res.json({
      endereco_id: id_endereco,
      total_usuarios: usuariosSeguros.length,
      usuarios: usuariosSeguros
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários por endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar todos os endereços (com paginação)
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    
    const result = await Endereco.findAll(page, limit);
    
    res.json(result);
    
  } catch (error) {
    console.error('Erro ao buscar endereços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar estatísticas de endereços
exports.getStats = async (req, res) => {
  try {
    const stats = await Endereco.getStats();
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas de endereços:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Verificar se endereço existe
exports.exists = async (req, res) => {
  try {
    const { id } = req.params;
    
    const exists = await Endereco.exists(id);
    
    res.json({ exists });
    
  } catch (error) {
    console.error('Erro ao verificar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};