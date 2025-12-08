const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';

// Middleware para verificar autenticação
exports.verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                success: false,
                error: 'Token não fornecido',
                code: 'TOKEN_MISSING'
            });
        }
        
        const token = authHeader.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                error: 'Token mal formatado',
                code: 'TOKEN_MALFORMED'
            });
        }
        
        // Verificar token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Buscar usuário no banco para verificar se ainda existe/está ativo
        const [users] = await db.execute(
            `SELECT u.*, p.nome as permissao_nome, u.id_endereco
             FROM usuario u
             INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
             WHERE u.id_usuario = ? AND u.deleteAt IS NULL`,
            [decoded.id_usuario]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuário não encontrado ou inativo',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = users[0];
        
        // Adicionar informações do usuário à requisição
        req.user = {
            id_usuario: user.id_usuario,
            id_permissao: user.id_permissao,
            email: decoded.email,
            nome: decoded.nome,
            permissao_nome: user.permissao_nome,
            tem_endereco: user.id_endereco !== null
        };
        
        // Adicionar informações do token à requisição (útil para logs)
        req.tokenInfo = {
            issuedAt: new Date(decoded.iat * 1000),
            expiresAt: new Date(decoded.exp * 1000),
            tokenType: 'Bearer'
        };
        
        next();
        
    } catch (error) {
        console.error('Erro na verificação do token:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token inválido',
                code: 'TOKEN_INVALID'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Token expirado',
                code: 'TOKEN_EXPIRED'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_SERVER_ERROR'
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
    
    if (req.user.id_permissao !== 1) {
        return res.status(403).json({ 
            success: false,
            error: 'Acesso negado. Apenas administradores podem acessar este recurso.',
            code: 'ACCESS_DENIED_ADMIN_ONLY'
        });
    }
    
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
    
    if (req.user.id_permissao !== 1 && req.user.id_permissao !== 2) {
        return res.status(403).json({ 
            success: false,
            error: 'Acesso negado. Apenas adotantes ou administradores podem acessar este recurso.',
            code: 'ACCESS_DENIED_ADOPTER_OR_ADMIN'
        });
    }
    
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
        
        if (!resourceUserId) {
            return res.status(400).json({ 
                success: false,
                error: 'ID do recurso não especificado',
                code: 'RESOURCE_ID_MISSING'
            });
        }
        
        if (parseInt(resourceUserId) !== parseInt(req.user.id_usuario)) {
            return res.status(403).json({ 
                success: false,
                error: 'Acesso negado. Você só pode acessar seus próprios recursos.',
                code: 'ACCESS_DENIED_OWNER_ONLY'
            });
        }
        
        next();
    };
};

// Middleware para verificar se o usuário está ativo
exports.isActiveUser = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuário não autenticado',
                code: 'USER_NOT_AUTHENTICATED'
            });
        }
        
        const [users] = await db.execute(
            'SELECT id_usuario FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
            [req.user.id_usuario]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuário inativo ou excluído',
                code: 'USER_INACTIVE'
            });
        }
        
        next();
        
    } catch (error) {
        console.error('Erro ao verificar usuário ativo:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
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
        return res.status(403).json({ 
            success: false,
            error: 'Endereço não cadastrado. É necessário cadastrar um endereço para realizar esta ação.',
            code: 'ADDRESS_REQUIRED'
        });
    }
    
    next();
};

// Middleware para logging de requisições autenticadas
exports.requestLogger = (req, res, next) => {
    const timestamp = new Date().toISOString();
    const method = req.method;
    const url = req.originalUrl;
    const userAgent = req.headers['user-agent'];
    const clientIp = req.ip || req.connection.remoteAddress;
    
    // Log apenas se usuário estiver autenticado
    if (req.user) {
        console.log(`[${timestamp}] [USER:${req.user.id_usuario}] ${method} ${url} - IP: ${clientIp} - User-Agent: ${userAgent}`);
    }
    
    next();
};

// Middleware para verificar token de refresh (se houver sistema de refresh tokens)
exports.verifyRefreshToken = async (req, res, next) => {
    try {
        const { refresh_token } = req.body;
        
        if (!refresh_token) {
            return res.status(400).json({ 
                success: false,
                error: 'Refresh token não fornecido',
                code: 'REFRESH_TOKEN_MISSING'
            });
        }
        
        // Verificar refresh token
        const decoded = jwt.verify(refresh_token, JWT_SECRET);
        
        // Buscar usuário
        const [users] = await db.execute(
            'SELECT id_usuario, id_permissao FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
            [decoded.id_usuario]
        );
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = users[0];
        
        // Adicionar informações à requisição para o controller gerar novo token
        req.refreshTokenInfo = {
            id_usuario: user.id_usuario,
            id_permissao: user.id_permissao,
            email: decoded.email,
            nome: decoded.nome
        };
        
        next();
        
    } catch (error) {
        console.error('Erro na verificação do refresh token:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                success: false,
                error: 'Refresh token inválido',
                code: 'REFRESH_TOKEN_INVALID'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false,
                error: 'Refresh token expirado',
                code: 'REFRESH_TOKEN_EXPIRED'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor',
            code: 'INTERNAL_SERVER_ERROR'
        });
    }
};

// Middleware para limitar requisições por usuário (rate limiting)
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