const ApiKey = require('../models/apiKeyModel');

// Middleware para verificar API Key
exports.verifyApiKey = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    // Verificar se a API Key foi fornecida
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API Key não fornecida',
        message: 'Forneça uma API Key válida no cabeçalho x-api-key ou no parâmetro apiKey',
        code: 'API_KEY_MISSING'
      });
    }
    
    // Buscar API Key no banco de dados
    const apiKeyData = await ApiKey.findByKey(apiKey);
    
    if (!apiKeyData) {
      return res.status(403).json({ 
        error: 'API Key inválida',
        message: 'A API Key fornecida não é válida ou expirou',
        code: 'API_KEY_INVALID'
      });
    }
    
    // Verificar se a API Key está ativa
    if (!apiKeyData.ativo || apiKeyData.ativo !== 1) {
      return res.status(403).json({ 
        error: 'API Key inativa',
        message: 'A API Key fornecida está inativa',
        code: 'API_KEY_INACTIVE'
      });
    }
    
    // Verificar se a API Key expirou
    if (apiKeyData.data_expiracao && new Date(apiKeyData.data_expiracao) < new Date()) {
      return res.status(403).json({ 
        error: 'API Key expirada',
        message: 'A API Key fornecida expirou',
        code: 'API_KEY_EXPIRED'
      });
    }
    
    // Registrar uso da API Key
    await ApiKey.registrarUso(apiKeyData.id_api_key, {
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      endpoint: req.path,
      method: req.method
    });
    
    // Adicionar informações da API Key à requisição
    req.apiKeyInfo = {
      id: apiKeyData.id_api_key,
      nome: apiKeyData.nome,
      permissoes: apiKeyData.permissoes ? JSON.parse(apiKeyData.permissoes) : [],
      limite_requisicoes: apiKeyData.limite_requisicoes,
      usuario_id: apiKeyData.usuario_id
    };
    
    // Log do uso (opcional)
    console.log(`API Key usada: ${apiKey.substring(0, 8)}... (${apiKeyData.nome}) para rota: ${req.path}`);
    
    next();
    
  } catch (error) {
    console.error('Erro na verificação da API Key:', error);
    
    // Em caso de erro no banco, verificar chaves de desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const developmentKeys = [
        'dev_patas_unidas_2024',
        'test_api_key_patas',
        'integration_key_123'
      ];
      
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (developmentKeys.includes(apiKey)) {
        req.apiKeyInfo = {
          id: 0,
          nome: 'Development Key',
          permissoes: ['read', 'write', 'delete'],
          limite_requisicoes: 1000,
          usuario_id: null
        };
        return next();
      }
    }
    
    res.status(500).json({ 
      error: 'Erro interno do servidor',
      code: 'INTERNAL_SERVER_ERROR'
    });
  }
};

// Middleware para verificar API Key com permissões específicas
exports.verifyApiKeyWithPermissions = (requiredPermissions = []) => {
  return async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(401).json({ 
          error: 'API Key não fornecida',
          code: 'API_KEY_MISSING'
        });
      }
      
      // Buscar API Key no banco de dados
      const apiKeyData = await ApiKey.findByKey(apiKey);
      
      if (!apiKeyData) {
        return res.status(403).json({ 
          error: 'API Key inválida',
          code: 'API_KEY_INVALID'
        });
      }
      
      // Verificar se a API Key está ativa
      if (!apiKeyData.ativo || apiKeyData.ativo !== 1) {
        return res.status(403).json({ 
          error: 'API Key inativa',
          code: 'API_KEY_INACTIVE'
        });
      }
      
      // Obter permissões da API Key
      const permissions = apiKeyData.permissoes ? JSON.parse(apiKeyData.permissoes) : [];
      
      // Verificar se a API Key tem todas as permissões necessárias
      const hasAllPermissions = requiredPermissions.every(perm => 
        permissions.includes(perm)
      );
      
      if (!hasAllPermissions) {
        const missing = requiredPermissions.filter(perm => 
          !permissions.includes(perm)
        );
        
        return res.status(403).json({ 
          error: 'Permissões insuficientes',
          message: `API Key não tem permissões suficientes. Faltando: ${missing.join(', ')}`,
          code: 'API_KEY_INSUFFICIENT_PERMISSIONS'
        });
      }
      
      // Registrar uso da API Key
      await ApiKey.registrarUso(apiKeyData.id_api_key, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        endpoint: req.path,
        method: req.method
      });
      
      // Adicionar informações da API Key à requisição
      req.apiKeyInfo = {
        id: apiKeyData.id_api_key,
        nome: apiKeyData.nome,
        permissoes: permissions,
        limite_requisicoes: apiKeyData.limite_requisicoes,
        usuario_id: apiKeyData.usuario_id
      };
      
      next();
      
    } catch (error) {
      console.error('Erro na verificação da API Key com permissões:', error);
      res.status(500).json({ 
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
};

// Middleware para limitar requisições por API Key
exports.rateLimitByApiKey = (limit = 100, windowMs = 15 * 60 * 1000) => {
  return async (req, res, next) => {
    try {
      const apiKey = req.headers['x-api-key'] || req.query.apiKey;
      
      if (!apiKey) {
        return res.status(401).json({ 
          error: 'API Key não fornecida',
          code: 'API_KEY_MISSING'
        });
      }
      
      // Buscar API Key no banco de dados
      const apiKeyData = await ApiKey.findByKey(apiKey);
      
      if (!apiKeyData) {
        return res.status(403).json({ 
          error: 'API Key inválida',
          code: 'API_KEY_INVALID'
        });
      }
      
      // Usar limite da API Key se definido, senão usar o padrão
      const rateLimit = apiKeyData.limite_requisicoes || limit;
      
      // Verificar rate limit
      const usage = await ApiKey.checkRateLimit(apiKeyData.id_api_key, rateLimit, windowMs);
      
      if (usage.exceeded) {
        const resetTime = new Date(usage.resetTime).toISOString();
        
        return res.status(429).json({
          error: 'Limite de requisições excedido',
          message: `Máximo de ${rateLimit} requisições por ${windowMs / 60000} minutos`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: resetTime,
          limit: rateLimit,
          remaining: 0,
          reset: resetTime
        });
      }
      
      // Registrar uso da API Key
      await ApiKey.registrarUso(apiKeyData.id_api_key, {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        endpoint: req.path,
        method: req.method
      });
      
      // Adicionar cabeçalhos de rate limiting
      res.setHeader('X-RateLimit-Limit', rateLimit);
      res.setHeader('X-RateLimit-Remaining', usage.remaining);
      res.setHeader('X-RateLimit-Reset', usage.resetTime.toISOString());
      
      next();
      
    } catch (error) {
      console.error('Erro no rate limiting por API Key:', error);
      
      // Em caso de erro, permitir a requisição (fail open) ou bloquear (fail closed)
      if (process.env.NODE_ENV === 'production') {
        // Em produção, podemos optar por bloquear em caso de erro
        return res.status(500).json({ 
          error: 'Erro no sistema de rate limiting',
          code: 'RATE_LIMIT_SYSTEM_ERROR'
        });
      } else {
        // Em desenvolvimento, permitir a requisição
        next();
      }
    }
  };
};

// Middleware para logging de API Key
exports.apiKeyLogger = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toISOString();
  
  // Registrar informações da requisição
  console.log(`[${timestamp}] API Request - Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'none'}, IP: ${clientIp}, Method: ${req.method}, Path: ${req.path}, User-Agent: ${userAgent}`);
  
  // Adicionar informações ao request para uso posterior
  req.apiKeyLogInfo = {
    key: apiKey,
    clientIp,
    userAgent,
    timestamp
  };
  
  next();
};

// Middleware para validar origem da requisição (CORS para API Keys)
exports.validateOrigin = (allowedOrigins = []) => {
  return (req, res, next) => {
    const origin = req.headers.origin || req.headers.referer;
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    // Se não há API Key, passar para outros middlewares (pode ser rota pública)
    if (!apiKey) {
      return next();
    }
    
    // Se não há origem especificada, permitir (pode ser requisição direta)
    if (!origin) {
      return next();
    }
    
    // Extrair domínio da origem
    let originDomain;
    try {
      const url = new URL(origin);
      originDomain = url.hostname;
    } catch (error) {
      // Se não for uma URL válida, usar a origem como está
      originDomain = origin;
    }
    
    // Verificar se a origem está na lista de permitidas
    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin.includes('*')) {
        // Tratar wildcards como *.example.com
        const wildcardDomain = allowedOrigin.replace('*.', '');
        return originDomain.endsWith(wildcardDomain);
      }
      return originDomain === allowedOrigin;
    });
    
    if (!isAllowed && allowedOrigins.length > 0) {
      return res.status(403).json({
        error: 'Origem não permitida',
        message: 'A origem da requisição não está autorizada a usar esta API Key',
        code: 'ORIGIN_NOT_ALLOWED'
      });
    }
    
    next();
  };
};