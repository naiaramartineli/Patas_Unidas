const Usuario = require('../models/userModel');
const Endereco = require('../models/enderecoModel');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';
const JWT_EXPIRES_IN = '7d';

// Listar todos os usuários (com paginação) - Apenas admin
exports.findAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const result = await Usuario.findAll(page, limit, search);
    
    // Remover dados sensíveis
    const usuariosSeguros = result.usuarios.map(user => {
      const { cpf, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });
    
    res.json({
      usuarios: usuariosSeguros,
      paginacao: result.paginacao
    });
    
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar usuário por ID - Admin pode buscar qualquer um, usuário comum apenas seu próprio
exports.findOne = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;
    const id_permissao = req.user.id_permissao;
    
    // Se não for admin e tentar buscar outro usuário, nega acesso
    if (id_permissao !== 1 && parseInt(id) !== id_usuario) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode buscar seu próprio perfil.' 
      });
    }
    
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Remover dados sensíveis
    const { cpf, senha, ...usuarioSeguro } = usuario;
    
    res.json(usuarioSeguro);
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar perfil do usuário autenticado
exports.getProfile = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    const usuario = await Usuario.findById(id_usuario);
    
    if (!usuario) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Remover dados sensíveis
    const { cpf, senha, ...usuarioSeguro } = usuario;
    
    res.json(usuarioSeguro);
    
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar perfil do usuário (dados básicos)
exports.updateProfile = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    const { nome, sobrenome, nome_social, data_nasc } = req.body;
    
    // Validar campos obrigatórios
    if (!nome || !sobrenome || !data_nasc) {
      return res.status(400).json({ 
        error: 'Nome, sobrenome e data de nascimento são obrigatórios' 
      });
    }
    
    const usuarioData = {
      nome,
      sobrenome,
      nome_social: nome_social || null,
      data_nasc
    };
    
    await Usuario.update(id_usuario, usuarioData);
    
    // Atualizar token com novo nome se necessário
    const token = jwt.sign(
      { 
        id_usuario: req.user.id_usuario,
        id_permissao: req.user.id_permissao,
        email: req.user.email,
        nome: nome,
        tem_endereco: req.user.tem_endereco || false
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({ 
      message: 'Perfil atualizado com sucesso!',
      token: token 
    });
    
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    
    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar permissões do usuário (apenas admin)
exports.updatePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const { id_permissao } = req.body;
    
    // Validar permissão
    if (!id_permissao || ![1, 2, 3].includes(parseInt(id_permissao))) {
      return res.status(400).json({ 
        error: 'Permissão inválida. Valores aceitos: 1 (Adm), 2 (Adotante), 3 (Padrinho)' 
      });
    }
    
    // Verificar se o usuário atual é admin
    if (req.user.id_permissao !== 1) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem alterar permissões.' 
      });
    }
    
    await Usuario.updatePermission(id, id_permissao);
    
    res.json({ message: 'Permissão do usuário atualizada com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao atualizar permissão:', error);
    
    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('não é possível remover')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir usuário (soft delete) - Usuário pode excluir sua conta, admin pode excluir qualquer uma
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;
    const id_permissao = req.user.id_permissao;
    
    // Se não for admin e tentar excluir outro usuário, nega acesso
    if (id_permissao !== 1 && parseInt(id) !== id_usuario) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode excluir sua própria conta.' 
      });
    }
    
    // Verificar se é admin tentando excluir a si mesmo
    if (parseInt(id) === id_usuario && id_permissao === 1) {
      // Verificar se é o último admin
      const stats = await Usuario.getStats();
      if (stats.total_admins <= 1) {
        return res.status(400).json({ 
          error: 'Não é possível excluir o único administrador do sistema' 
        });
      }
    }
    
    await Usuario.delete(id);
    
    res.json({ message: 'Usuário removido com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    
    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    if (error.message.includes('não é possível excluir')) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Adicionar/Atualizar endereço do usuário
exports.addOrUpdateAddress = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
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
      complemento: complemento || null,
      cidade,
      uf: uf.toUpperCase(),
      cep: cepFormatado
    };
    
    const result = await Usuario.addOrUpdateAddress(id_usuario, enderecoData);
    
    // Atualizar token para refletir que agora tem endereço
    const token = jwt.sign(
      { 
        id_usuario: req.user.id_usuario,
        id_permissao: req.user.id_permissao,
        email: req.user.email,
        nome: req.user.nome,
        tem_endereco: true
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: result.message,
      token: token,
      id_endereco: result.id_endereco
    });
    
  } catch (error) {
    console.error('Erro ao adicionar/atualizar endereço:', error);
    
    if (error.message.includes('Campo obrigatório') || 
        error.message.includes('UF inválida') || 
        error.message.includes('CEP inválido')) {
      return res.status(400).json({ error: error.message });
    }
    
    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Remover endereço do usuário
exports.removeAddress = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    await Usuario.removeAddress(id_usuario);
    
    // Atualizar token para refletir que não tem mais endereço
    const token = jwt.sign(
      { 
        id_usuario: req.user.id_usuario,
        id_permissao: req.user.id_permissao,
        email: req.user.email,
        nome: req.user.nome,
        tem_endereco: false
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    res.json({
      message: 'Endereço removido com sucesso!',
      token: token
    });
    
  } catch (error) {
    console.error('Erro ao remover endereço:', error);
    
    if (error.message === 'Usuário não encontrado' || 
        error.message === 'Usuário não possui endereço cadastrado') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar endereço do usuário
exports.getAddress = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    const endereco = await Endereco.findByUserId(id_usuario);
    
    if (!endereco) {
      return res.status(404).json({ error: 'Endereço não encontrado' });
    }
    
    res.json(endereco);
    
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Verificar se usuário tem endereço cadastrado
exports.hasAddress = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    const hasAddress = await Usuario.hasAddress(id_usuario);
    
    res.json(hasAddress);
    
  } catch (error) {
    console.error('Erro ao verificar endereço:', error);
    
    if (error.message === 'Usuário não encontrado') {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar estatísticas de usuários (apenas admin)
exports.getStats = async (req, res) => {
  try {
    // Verificar se é admin
    if (req.user.id_permissao !== 1) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem ver estatísticas.' 
      });
    }
    
    const stats = await Usuario.getStats();
    
    res.json(stats);
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar adoções do usuário (admin pode ver de qualquer um, usuário apenas as suas)
exports.getUserAdoptions = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;
    const id_permissao = req.user.id_permissao;
    
    // Se não for admin e tentar buscar adoções de outro usuário, nega acesso
    if (id_permissao !== 1 && parseInt(id) !== id_usuario) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode ver suas próprias adoções.' 
      });
    }
    
    const adocoes = await Usuario.getAdoptions(id);
    
    res.json(adocoes);
    
  } catch (error) {
    console.error('Erro ao buscar adoções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar apadrinhamentos do usuário (admin pode ver de qualquer um, usuário apenas os seus)
exports.getUserSponsorships = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;
    const id_permissao = req.user.id_permissao;
    
    // Se não for admin e tentar buscar apadrinhamentos de outro usuário, nega acesso
    if (id_permissao !== 1 && parseInt(id) !== id_usuario) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode ver seus próprios apadrinhamentos.' 
      });
    }
    
    const apadrinhamentos = await Usuario.getSponsorships(id);
    
    res.json(apadrinhamentos);
    
  } catch (error) {
    console.error('Erro ao buscar apadrinhamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar minhas adoções (usuário autenticado)
exports.getMyAdoptions = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    const adocoes = await Usuario.getAdoptions(id_usuario);
    
    res.json(adocoes);
    
  } catch (error) {
    console.error('Erro ao buscar minhas adoções:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar meus apadrinhamentos (usuário autenticado)
exports.getMySponsorships = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    const apadrinhamentos = await Usuario.getSponsorships(id_usuario);
    
    res.json(apadrinhamentos);
    
  } catch (error) {
    console.error('Erro ao buscar meus apadrinhamentos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Upload de foto de perfil (simplificado - em produção use multer)
exports.uploadProfilePhoto = async (req, res) => {
  try {
    const id_usuario = req.user.id_usuario;
    
    // Em produção, você processaria o arquivo com multer
    // Aqui é apenas um exemplo simplificado
    const { foto_url } = req.body;
    
    if (!foto_url) {
      return res.status(400).json({ error: 'URL da foto é obrigatória' });
    }
    
    // Em um sistema real, você atualizaria um campo na tabela usuario
    // como 'foto_perfil_url' ou similar
    res.json({ 
      message: 'Foto de perfil atualizada com sucesso!',
      foto_url: foto_url 
    });
    
  } catch (error) {
    console.error('Erro ao fazer upload da foto:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Ativar/Desativar conta do usuário (apenas admin)
exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    // Verificar se é admin
    if (req.user.id_permissao !== 1) {
      return res.status(403).json({ 
        error: 'Acesso negado. Apenas administradores podem ativar/desativar usuários.' 
      });
    }
    
    // Validar parâmetro
    if (ativo === undefined || typeof ativo !== 'boolean') {
      return res.status(400).json({ 
        error: 'Parâmetro "ativo" é obrigatório e deve ser booleano' 
      });
    }
    
    // Verificar se não está tentando desativar a si mesmo
    if (parseInt(id) === req.user.id_usuario && !ativo) {
      return res.status(400).json({ 
        error: 'Não é possível desativar sua própria conta' 
      });
    }
    
    // Verificar se é o último admin sendo desativado
    if (!ativo) {
      const usuario = await Usuario.findById(id);
      if (usuario && usuario.id_permissao === 1) {
        const stats = await Usuario.getStats();
        if (stats.total_admins <= 1) {
          return res.status(400).json({ 
            error: 'Não é possível desativar o único administrador do sistema' 
          });
        }
      }
    }
    
    // Em um sistema real, você teria um campo 'ativo' na tabela usuario
    // Aqui é apenas um exemplo
    res.json({ 
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso!`,
      ativo: ativo
    });
    
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Buscar histórico de atividades do usuário (apenas admin ou próprio usuário)
exports.getUserActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const id_usuario = req.user.id_usuario;
    const id_permissao = req.user.id_permissao;
    
    // Se não for admin e tentar buscar histórico de outro usuário, nega acesso
    if (id_permissao !== 1 && parseInt(id) !== id_usuario) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você só pode ver seu próprio histórico.' 
      });
    }
    
    // Em um sistema real, você teria uma tabela de logs/atividades
    // Aqui retornamos um exemplo simplificado
    const atividades = [
      {
        id: 1,
        tipo: 'login',
        descricao: 'Login realizado no sistema',
        data: new Date().toISOString(),
        ip: '192.168.1.1'
      },
      {
        id: 2,
        tipo: 'perfil_atualizado',
        descricao: 'Perfil atualizado',
        data: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
        ip: '192.168.1.1'
      }
    ];
    
    res.json({
      usuario_id: id,
      total_atividades: atividades.length,
      atividades: atividades
    });
    
  } catch (error) {
    console.error('Erro ao buscar histórico de atividades:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};