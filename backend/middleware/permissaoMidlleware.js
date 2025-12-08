const db = require('../db');

// Middleware para verificar permissão de adotar
exports.canAdopt = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado' });
    }
    
    const [permissoes] = await db.execute(
      'SELECT adotar FROM permissoes WHERE id_permissao = ?',
      [req.user.id_permissao]
    );
    
    if (permissoes.length === 0) {
      return res.status(403).json({ error: 'Permissões não encontradas' });
    }
    
    if (!permissoes[0].adotar) {
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
    
    const [permissoes] = await db.execute(
      'SELECT apadrinhar FROM permissoes WHERE id_permissao = ?',
      [req.user.id_permissao]
    );
    
    if (permissoes.length === 0) {
      return res.status(403).json({ error: 'Permissões não encontradas' });
    }
    
    if (!permissoes[0].apadrinhar) {
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
    
    const [permissoes] = await db.execute(
      'SELECT cadastrar FROM permissoes WHERE id_permissao = ?',
      [req.user.id_permissao]
    );
    
    if (permissoes.length === 0) {
      return res.status(403).json({ error: 'Permissões não encontradas' });
    }
    
    if (!permissoes[0].cadastrar) {
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
      
      const [permissoes] = await db.execute(
        'SELECT * FROM permissoes WHERE id_permissao = ?',
        [req.user.id_permissao]
      );
      
      if (permissoes.length === 0) {
        return res.status(403).json({ error: 'Permissões não encontradas' });
      }
      
      const userPermissions = permissoes[0];
      const missingPermissions = [];
      
      // Verificar cada permissão requerida
      for (const permission of permissions) {
        if (!userPermissions[permission]) {
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
      
      const [permissoes] = await db.execute(
        'SELECT * FROM permissoes WHERE id_permissao = ?',
        [req.user.id_permissao]
      );
      
      if (permissoes.length === 0) {
        return res.status(403).json({ error: 'Permissões não encontradas' });
      }
      
      if (!permissoes[0][permissionName]) {
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
      
      const [permissoes] = await db.execute(
        'SELECT * FROM permissoes WHERE id_permissao = ?',
        [req.user.id_permissao]
      );
      
      if (permissoes.length === 0) {
        return res.status(403).json({ error: 'Permissões não encontradas' });
      }
      
      let hasPermission = false;
      
      // Mapear tipo de recurso para permissão
      switch (resourceType) {
        case 'cao':
          hasPermission = permissoes[0].cadastrar;
          break;
        case 'adocao':
          hasPermission = permissoes[0].adotar;
          break;
        case 'apadrinhamento':
          hasPermission = permissoes[0].apadrinhar;
          break;
        case 'usuario':
          hasPermission = req.user.id_permissao === 1; // Apenas admin pode gerenciar usuários
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