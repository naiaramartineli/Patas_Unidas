const jwt = require('jsonwebtoken');
const Usuario = require('../models/userModel');
const Permissao = require('../models/permissaoModel');

const JWT_SECRET = process.env.JWT_SECRET || 'supersegredo_patas_unidas_2025_@SEGURO';

// Função auxiliar para logs (simplificada sem model de Log)
const logAuthAttempt = (userId, code, success, details = '') => {
  const timestamp = new Date().toISOString();
  const status = success ? 'SUCESSO' : 'FALHA';
  console.log(`[${timestamp}] [AUTH] Usuário: ${userId || 'N/A'} - Código: ${code} - Status: ${status} ${details ? `- Detalhes: ${details}` : ''}`);
};

// Middleware para verificar autenticação
exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            logAuthAttempt(null, 'TOKEN_MISSING', false);
            return res.status(401).json({ 
                success: false,
                error: 'Token não fornecido',
                code: 'TOKEN_MISSING'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            logAuthAttempt(null, 'TOKEN_MALFORMED', false);
            return res.status(401).json({ 
                success: false,
                error: 'Token mal formatado',
                code: 'TOKEN_MALFORMED'
            });
        }
        
        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar usuário no banco para verificar se ainda existe
        const usuario = await Usuario.findById(decoded.id_usuario);
        
        if (!usuario) {
            logAuthAttempt(decoded.id_usuario, 'USER_NOT_FOUND', false);
            return res.status(401).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Buscar informações da permissão
        const permissao = await Permissao.findById(usuario.id_permissao);
        
        if (!permissao) {
            logAuthAttempt(usuario.id_usuario, 'PERMISSION_NOT_FOUND', false);
            return res.status(401).json({ 
                success: false,
                error: 'Permissão não encontrada',
                code: 'PERMISSION_NOT_FOUND'
            });
        }
        
        // Atualizar último login do usuário (se o método existir)
        try {
            if (typeof Usuario.updateLastLogin === 'function') {
                await Usuario.updateLastLogin(usuario.id_usuario);
            }
        } catch (error) {
            console.error('Erro ao atualizar último login:', error);
            // Não interromper o fluxo por este erro
        }
        
        // Adicionar informações do usuário à requisição
        req.user = {
            id_usuario: usuario.id_usuario,
            id_permissao: usuario.id_permissao,
            email: usuario.email,
            nome: usuario.nome,
            sobrenome: usuario.sobrenome || '',
            nome_social: usuario.nome_social || null,
            telefone: usuario.telefone || null,
            cpf: usuario.cpf,
            data_nasc: usuario.data_nasc,
            id_endereco: usuario.id_endereco || null,
            permissao_nome: permissao.nome,
            tem_endereco: usuario.id_endereco !== null && usuario.id_endereco !== undefined,
            data_cadastro: usuario.data_cadastro || usuario.createdAt,
            updateAt: usuario.updateAt || usuario.updatedAt,
            atividade: usuario.atividade,
            foto_url: usuario.foto_url || null,
            endereco: usuario.endereco || null
        };
        
        // Adicionar permissões específicas do usuário (baseado na tabela)
        req.user.permissoes = {
            adotar: permissao.adotar === 1,
            apadrinhar: permissao.apadrinhar === 1,
            cadastrar: permissao.cadastrar === 1
        };
        
        // Adicionar informações do token à requisição
        req.tokenInfo = {
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000),
            tokenType: 'Bearer'
        };
        
        logAuthAttempt(usuario.id_usuario, 'SUCCESS', true);
        next();
        
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        
        let errorCode = 'INTERNAL_SERVER_ERROR';
        let errorMessage = 'Erro interno do servidor';
        let userId = null;
        
        if (error.name === 'JsonWebTokenError') {
            errorCode = 'TOKEN_INVALID';
            errorMessage = 'Token inválido';
        } else if (error.name === 'TokenExpiredError') {
            errorCode = 'TOKEN_EXPIRED';
            errorMessage = 'Token expirado';
            // Tentar extrair userId do token expirado
            try {
                const decoded = jwt.decode(token);
                userId = decoded?.id_usuario;
            } catch (e) {
                // Ignorar erro de decode
            }
        }
        
        logAuthAttempt(userId, errorCode, false, error.message);
        
        res.status(error.name === 'TokenExpiredError' ? 401 : 500).json({ 
            success: false,
            error: errorMessage,
            code: errorCode
        });
    }
};

// Middleware para verificar se é administrador
exports.isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Usuário não autenticado',
            code: 'USER_NOT_AUTHENTICATED'
        });
    }
    
    // Admin tem id_permissao = 1 e todas as permissões = 1
    if (req.user.id_permissao !== 1) {
        console.log(`[AUTH] Acesso admin negado para usuário ${req.user.id_usuario} (permissão: ${req.user.id_permissao})`);
        return res.status(403).json({ 
            success: false,
            error: 'Acesso negado. Apenas administradores podem acessar este recurso.',
            code: 'ACCESS_DENIED_ADMIN_ONLY'
        });
    }
    
    console.log(`[AUTH] Acesso admin concedido para usuário ${req.user.id_usuario}`);
    next();
};

// Middleware para verificar se é adotante ou admin
exports.isAdopterOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Usuário não autenticado',
            code: 'USER_NOT_AUTHENTICATED'
        });
    }
    
    // Admin (id_permissao = 1) ou Adotante (id_permissao = 2)
    if (req.user.id_permissao !== 1 && req.user.id_permissao !== 2) {
        console.log(`[AUTH] Acesso adotante negado para usuário ${req.user.id_usuario} (permissão: ${req.user.id_permissao})`);
        return res.status(403).json({ 
            success: false,
            error: 'Acesso negado. Apenas adotantes ou administradores podem acessar este recurso.',
            code: 'ACCESS_DENIED_ADOPTER_OR_ADMIN'
        });
    }
    
    console.log(`[AUTH] Acesso adotante concedido para usuário ${req.user.id_usuario}`);
    next();
};

// Middleware para verificar se é padrinho ou admin
exports.isSponsorOrAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Usuário não autenticado',
            code: 'USER_NOT_AUTHENTICATED'
        });
    }
    
    // Admin (id_permissao = 1) ou Padrinho (id_permissao = 3)
    if (req.user.id_permissao !== 1 && req.user.id_permissao !== 3) {
        console.log(`[AUTH] Acesso padrinho negado para usuário ${req.user.id_usuario} (permissão: ${req.user.id_permissao})`);
        return res.status(403).json({ 
            success: false,
            error: 'Acesso negado. Apenas padrinhos ou administradores podem acessar este recurso.',
            code: 'ACCESS_DENIED_SPONSOR_OR_ADMIN'
        });
    }
    
    console.log(`[AUTH] Acesso padrinho concedido para usuário ${req.user.id_usuario}`);
    next();
};

// Middleware para verificar se é dono do recurso ou admin
exports.isOwnerOrAdmin = (resourceUserIdField = 'id_usuario') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuário não autenticado',
                code: 'USER_NOT_AUTHENTICATED'
            });
        }
        
        // Se for admin, permite acesso
        if (req.user.id_permissao === 1) {
            console.log(`[AUTH] Acesso admin bypass para usuário ${req.user.id_usuario}`);
            return next();
        }
        
        // Verificar se o usuário é dono do recurso
        let resourceUserId;
        
        // Tentar obter do parâmetro da rota
        resourceUserId = req.params[resourceUserIdField];
        
        // Se não encontrou no parâmetro, tentar no body
        if (!resourceUserId && req.body[resourceUserIdField]) {
            resourceUserId = req.body[resourceUserIdField];
        }
        
        // Se não encontrou no body, tentar no query
        if (!resourceUserId && req.query[resourceUserIdField]) {
            resourceUserId = req.query[resourceUserIdField];
        }
        
        // Se não encontrou em nenhum lugar, verificar se é o próprio perfil
        if (!resourceUserId && req.params.id) {
            resourceUserId = req.params.id;
        }
        
        if (!resourceUserId) {
            console.log(`[AUTH] ID do recurso não encontrado para usuário ${req.user.id_usuario}`);
            return res.status(400).json({ 
                success: false,
                error: 'ID do recurso não especificado',
                code: 'RESOURCE_ID_MISSING'
            });
        }
        
        if (parseInt(resourceUserId) !== parseInt(req.user.id_usuario)) {
            console.log(`[AUTH] Acesso negado: usuário ${req.user.id_usuario} tentou acessar recurso de ${resourceUserId}`);
            return res.status(403).json({ 
                success: false,
                error: 'Acesso negado. Você só pode acessar seus próprios recursos.',
                code: 'ACCESS_DENIED_OWNER_ONLY'
            });
        }
        
        console.log(`[AUTH] Acesso de proprietário concedido para usuário ${req.user.id_usuario}`);
        next();
    };
};

// Middleware para verificar permissão específica (adotar, apadrinhar, cadastrar)
exports.hasPermission = (permissionName) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Usuário não autenticado',
                    code: 'USER_NOT_AUTHENTICATED'
                });
            }
            
            // Validar nome da permissão
            const validPermissions = ['adotar', 'apadrinhar', 'cadastrar'];
            if (!validPermissions.includes(permissionName)) {
                return res.status(400).json({
                    success: false,
                    error: 'Permissão inválida',
                    code: 'INVALID_PERMISSION'
                });
            }
            
            // Se for admin, tem todas as permissões
            if (req.user.id_permissao === 1) {
                console.log(`[AUTH] Permissão ${permissionName} concedida via admin para usuário ${req.user.id_usuario}`);
                return next();
            }
            
            // Verificar se o usuário tem a permissão específica
            const hasPermission = await Permissao.userHasPermission(
                req.user.id_usuario, 
                permissionName
            );
            
            if (!hasPermission) {
                console.log(`[AUTH] Permissão ${permissionName} negada para usuário ${req.user.id_usuario}`);
                return res.status(403).json({ 
                    success: false,
                    error: `Acesso negado. Permissão '${permissionName}' necessária.`,
                    code: 'PERMISSION_DENIED'
                });
            }
            
            console.log(`[AUTH] Permissão ${permissionName} concedida para usuário ${req.user.id_usuario}`);
            next();
            
        } catch (error) {
            console.error(`Erro na verificação de permissão '${permissionName}':`, error);
            res.status(500).json({ 
                success: false,
                error: 'Erro interno do servidor',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    };
};

// Middleware para verificar se o usuário tem permissão de adotar
exports.canAdopt = async (req, res, next) => {
    return exports.hasPermission('adotar')(req, res, next);
};

// Middleware para verificar se o usuário tem permissão de apadrinhar
exports.canSponsor = async (req, res, next) => {
    return exports.hasPermission('apadrinhar')(req, res, next);
};

// Middleware para verificar se o usuário tem permissão de cadastrar
exports.canRegister = async (req, res, next) => {
    return exports.hasPermission('cadastrar')(req, res, next);
};

// Middleware para verificar se o usuário tem endereço cadastrado
exports.hasAddress = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Usuário não autenticado',
            code: 'USER_NOT_AUTHENTICATED'
        });
    }
    
    if (!req.user.tem_endereco) {
        console.log(`[AUTH] Endereço requerido negado para usuário ${req.user.id_usuario}`);
        return res.status(403).json({ 
            success: false,
            error: 'Endereço não cadastrado. É necessário cadastrar um endereço para realizar esta ação.',
            code: 'ADDRESS_REQUIRED'
        });
    }
    
    console.log(`[AUTH] Endereço verificado para usuário ${req.user.id_usuario}`);
    next();
};

// Middleware para logging de requisições
exports.requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.headers['user-agent'];
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Log apenas se usuário estiver autenticado
    if (req.user) {
        console.log(`[${timestamp}] [USER:${req.user.id_usuario}] ${method} ${url} - IP: ${clientIp} - User-Agent: ${userAgent}`);
    } else {
        console.log(`[${timestamp}] [GUEST] ${method} ${url} - IP: ${clientIp} - User-Agent: ${userAgent}`);
    }
    
    next();
};

// Middleware para limitar requisições por usuário
exports.rateLimitByUser = (limit = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        if (!req.user) {
            return next();
        }
        
        const userId = req.user.id_usuario;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        // Limpar requisições antigas
        if (requests.has(userId)) {
            requests.set(
                userId, 
                requests.get(userId).filter(time => time > windowStart)
            );
        } else {
            requests.set(userId, []);
        }
        
        const userRequests = requests.get(userId);
        
        // Verificar se excedeu o limite
        if (userRequests.length >= limit) {
            const resetTime = new Date(userRequests[0] + windowMs).toISOString();
            
            console.log(`[RATE LIMIT] Usuário ${userId} excedeu limite de ${limit} requisições`);
            
            return res.status(429).json({
                success: false,
                error: 'Limite de requisições excedido',
                message: `Máximo de ${limit} requisições por ${windowMs / 60000} minutos`,
                code: 'RATE_LIMIT_EXCEEDED',
                retryAfter: resetTime,
                limit: limit,
                remaining: 0,
                reset: resetTime
            });
        }
        
        // Registrar nova requisição
        userRequests.push(now);
        
        // Adicionar cabeçalhos de rate limiting
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', limit - userRequests.length);
        res.setHeader('X-RateLimit-Reset', new Date(userRequests[0] + windowMs).toISOString());
        
        next();
    };
};