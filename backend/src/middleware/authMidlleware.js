import jwt from 'jsonwebtoken';
import Usuario from '../models/userModel.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supersegredo_patas_unidas_2025_@SEGURO';

// Função auxiliar para logs
const logAuthAttempt = (userId, code, success, details = '') => {
    const timestamp = new Date().toISOString();
    const status = success ? 'SUCESSO' : 'FALHA';
    console.log(`[${timestamp}] [AUTH] Usuário: ${userId || 'N/A'} - Código: ${code} - Status: ${status} ${details ? `- Detalhes: ${details}` : ''}`);
};

// Middleware para verificar autenticação
export const verifyToken = async (req, res, next) => {
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
        
        // Adicionar informações do usuário à requisição
        req.user = {
            id_usuario: usuario.id_usuario,
            id_permissao: usuario.id_permissao,
            email: usuario.email,
            nome: usuario.nome,
            sobrenome: usuario.sobrenome || '',
            tem_endereco: usuario.id_endereco !== null && usuario.id_endereco !== undefined,
            data_cadastro: usuario.data_cadastro || usuario.createdAt
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
export const isAdmin = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ 
            success: false,
            error: 'Usuário não autenticado',
            code: 'USER_NOT_AUTHENTICATED'
        });
    }
    
    // Admin tem id_permissao = 1
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

// Middleware para verificar se é dono do recurso ou admin
export const isOwnerOrAdmin = (resourceUserIdField = 'id_usuario') => {
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

// Middleware para logging de requisições
export const requestLogger = (req, res, next) => {
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

// Exportação padrão
export default {
    verifyToken,
    isAdmin,
    isOwnerOrAdmin,
    requestLogger
};