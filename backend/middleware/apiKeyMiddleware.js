// Middleware para verificar API Key
exports.verifyApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  
  // Verificar se a API Key foi fornecida
  if (!apiKey) {
    return res.status(401).json({ 
      error: 'API Key não fornecida',
      message: 'Forneça uma API Key válida no cabeçalho x-api-key ou no parâmetro apiKey'
    });
  }
  
  // Verificar se a API Key é válida
  const validApiKeys = process.env.API_KEYS ? process.env.API_KEYS.split(',') : [];
  
  // Em produção, use variáveis de ambiente
  // Para desenvolvimento, aceita algumas chaves padrão
  const developmentKeys = [
    'dev_patas_unidas_2024',
    'test_api_key_patas',
    'integration_key_123'
  ];
  
  const allValidKeys = [...validApiKeys, ...developmentKeys];
  
  if (!allValidKeys.includes(apiKey)) {
    return res.status(403).json({ 
      error: 'API Key inválida',
      message: 'A API Key fornecida não é válida ou expirou'
    });
  }
  
  // Registrar uso da API Key (opcional, para logs)
  console.log(`API Key usada: ${apiKey.substring(0, 8)}... para rota: ${req.path}`);
  
  next();
};

// Middleware para verificar API Key com permissões específicas
exports.verifyApiKeyWithPermissions = (requiredPermissions = []) => {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API Key não fornecida'
      });
    }
    
    // Em um sistema real, você buscaria as permissões da API Key do banco de dados
    // Aqui estamos simulando com um mapeamento simples
    const apiKeyPermissions = {
      'dev_patas_unidas_2024': ['read', 'write', 'delete'],
      'test_api_key_patas': ['read', 'write'],
      'integration_key_123': ['read']
    };
    
    const permissions = apiKeyPermissions[apiKey] || [];
    
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
        message: `API Key não tem permissões suficientes. Faltando: ${missing.join(', ')}`
      });
    }
    
    next();
  };
};

// Middleware para limitar requisições por API Key
exports.rateLimitByApiKey = (limit = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      return res.status(401).json({ error: 'API Key não fornecida' });
    }
    
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Limpar requisições antigas
    if (requests.has(apiKey)) {
      requests.set(
        apiKey, 
        requests.get(apiKey).filter(time => time > windowStart)
      );
    } else {
      requests.set(apiKey, []);
    }
    
    const apiRequests = requests.get(apiKey);
    
    // Verificar se excedeu o limite
    if (apiRequests.length >= limit) {
      const resetTime = new Date(apiRequests[0] + windowMs).toISOString();
      
      return res.status(429).json({
        error: 'Limite de requisições excedido',
        message: `Máximo de ${limit} requisições por ${windowMs / 60000} minutos`,
        retryAfter: resetTime,
        limit: limit,
        remaining: 0,
        reset: resetTime
      });
    }
    
    // Registrar nova requisição
    apiRequests.push(now);
    
    // Adicionar cabeçalhos de rate limiting
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - apiRequests.length);
    res.setHeader('X-RateLimit-Reset', new Date(apiRequests[0] + windowMs).toISOString());
    
    next();
  };
};

// Middleware para logging de API Key
exports.apiKeyLogger = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;
  const clientIp = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const timestamp = new Date().toISOString();
  
  // Registrar informações da requisição (em produção, use um serviço de logging)
  console.log(`[${timestamp}] API Request - Key: ${apiKey ? apiKey.substring(0, 8) + '...' : 'none'}, IP: ${clientIp}, Method: ${req.method}, Path: ${req.path}, User-Agent: ${userAgent}`);
  
  // Adicionar informações ao request para uso posterior
  req.apiKeyInfo = {
    key: apiKey,
    clientIp,
    userAgent,
    timestamp
  };
  
  next();
};