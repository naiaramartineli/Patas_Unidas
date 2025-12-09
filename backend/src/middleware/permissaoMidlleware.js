const Permissao = require('../models/permissaoModel');

// Middleware para verificar permissão de adotar
exports.canAdopt = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const permissao = await Permissao.findById(req.user.id_permissao);
    
    if (!permissao) {
      return res.status(403).json({ error: 'Permissão não encontrada' });
    }
    
    // Verificar se a permissão tem o campo adotar ou se é admin (id_permissao = 1)
    const canAdopt = req.user.id_permissao === 1 || 
                     permissao.adotar === 1 || 
                     permissao.adotar === true;
    
    if (!canAdopt) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para adotar.' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação de permissão de adoção:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar permissão de apadrinhar
exports.canSponsor = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const permissao = await Permissao.findById(req.user.id_permissao);
    
    if (!permissao) {
      return res.status(403).json({ error: 'Permissão não encontrada' });
    }
    
    // Verificar se a permissão tem o campo apadrinhar ou se é admin (id_permissao = 1)
    const canSponsor = req.user.id_permissao === 1 || 
                       permissao.apadrinhar === 1 || 
                       permissao.apadrinhar === true;
    
    if (!canSponsor) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para apadrinhar.' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação de permissão de apadrinhamento:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar permissão de cadastrar
exports.canRegister = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const permissao = await Permissao.findById(req.user.id_permissao);
    
    if (!permissao) {
      return res.status(403).json({ error: 'Permissão não encontrada' });
    }
    
    // Verificar se a permissão tem o campo cadastrar ou se é admin (id_permissao = 1)
    const canRegister = req.user.id_permissao === 1 || 
                        permissao.cadastrar === 1 || 
                        permissao.cadastrar === true;
    
    if (!canRegister) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para cadastrar.' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação de permissão de cadastro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar múltiplas permissões
exports.checkPermissions = (permissions) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Se for admin, tem todas as permissões
      if (req.user.id_permissao === 1) {
        return next();
      }
      
      const permissao = await Permissao.findById(req.user.id_permissao);
      
      if (!permissao) {
        return res.status(403).json({ error: 'Permissão não encontrada' });
      }
      
      const missingPermissions = [];
      
      // Verificar cada permissão requerida
      for (const permission of permissions) {
        if (!permissao[permission] || 
            (permissao[permission] !== 1 && permissao[permission] !== true)) {
          missingPermissions.push(permission);
        }
      }
      
      if (missingPermissions.length > 0) {
        return res.status(403).json({ 
          error: `Acesso negado. Permissões insuficientes: ${missingPermissions.join(', ')}` 
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Erro na verificação de múltiplas permissões:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middleware para verificar permissão específica por nome
exports.hasPermission = (permissionName) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Se for admin, tem todas as permissões
      if (req.user.id_permissao === 1) {
        return next();
      }
      
      const permissao = await Permissao.findById(req.user.id_permissao);
      
      if (!permissao) {
        return res.status(403).json({ error: 'Permissão não encontrada' });
      }
      
      const hasPermission = permissao[permissionName] === 1 || 
                            permissao[permissionName] === true;
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Acesso negado. Permissão '${permissionName}' necessária.` 
        });
      }
      
      next();
      
    } catch (error) {
      console.error(`Erro na verificação de permissão '${permissionName}':`, error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middleware para verificar se o usuário pode gerenciar um recurso específico
exports.canManageResource = (resourceType) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não autenticado' });
      }
      
      // Se for administrador, permite acesso
      if (req.user.id_permissao === 1) {
        return next();
      }
      
      const permissao = await Permissao.findById(req.user.id_permissao);
      
      if (!permissao) {
        return res.status(403).json({ error: 'Permissão não encontrada' });
      }
      
      let hasPermission = false;
      
      // Mapear tipo de recurso para permissão
      switch (resourceType.toLowerCase()) {
        case 'cao':
        case 'cachorro':
        case 'dog':
          hasPermission = permissao.cadastrar === 1 || permissao.cadastrar === true;
          break;
        case 'adocao':
        case 'adotar':
          hasPermission = permissao.adotar === 1 || permissao.adotar === true;
          break;
        case 'apadrinhamento':
        case 'apadrinhar':
        case 'sponsor':
          hasPermission = permissao.apadrinhar === 1 || permissao.apadrinhar === true;
          break;
        case 'usuario':
        case 'user':
          hasPermission = req.user.id_permissao === 1; // Apenas admin pode gerenciar usuários
          break;
        case 'raca':
          hasPermission = req.user.id_permissao === 1; // Apenas admin pode gerenciar raças
          break;
        case 'vacina':
          hasPermission = req.user.id_permissao === 1; // Apenas admin pode gerenciar vacinas
          break;
        default:
          hasPermission = false;
      }
      
      if (!hasPermission) {
        return res.status(403).json({ 
          error: `Acesso negado. Você não tem permissão para gerenciar ${resourceType}.` 
        });
      }
      
      next();
      
    } catch (error) {
      console.error('Erro na verificação de gerenciamento de recurso:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  };
};

// Middleware para verificar permissão de visualização
exports.canView = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const permissao = await Permissao.findById(req.user.id_permissao);
    
    if (!permissao) {
      return res.status(403).json({ error: 'Permissão não encontrada' });
    }
    
    // Verificar se a permissão tem o campo visualizar
    const canView = req.user.id_permissao === 1 || 
                    permissao.visualizar === 1 || 
                    permissao.visualizar === true;
    
    if (!canView) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para visualizar este recurso.' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação de permissão de visualização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar permissão de edição
exports.canEdit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const permissao = await Permissao.findById(req.user.id_permissao);
    
    if (!permissao) {
      return res.status(403).json({ error: 'Permissão não encontrada' });
    }
    
    // Verificar se a permissão tem o campo editar
    const canEdit = req.user.id_permissao === 1 || 
                    permissao.editar === 1 || 
                    permissao.editar === true;
    
    if (!canEdit) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para editar este recurso.' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação de permissão de edição:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Middleware para verificar permissão de exclusão
exports.canDelete = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const permissao = await Permissao.findById(req.user.id_permissao);
    
    if (!permissao) {
      return res.status(403).json({ error: 'Permissão não encontrada' });
    }
    
    // Verificar se a permissão tem o campo excluir
    const canDelete = req.user.id_permissao === 1 || 
                      permissao.excluir === 1 || 
                      permissao.excluir === true;
    
    if (!canDelete) {
      return res.status(403).json({ 
        error: 'Acesso negado. Você não tem permissão para excluir este recurso.' 
      });
    }
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação de permissão de exclusão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};