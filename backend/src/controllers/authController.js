const bcrypt = require('bcryptjs');
const db = require('../config/db.js');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/userModel.js');

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'supersegredo_patas_unidas_2025_@SEGURO';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// Registrar novo usuário
const register = async (req, res) => {
    try {
        const {
            nome, sobrenome, nome_social, data_nasc, cpf, email, senha,
            logradouro, bairro, numero, complemento, cidade, uf, cep
        } = req.body;
        
        // Validar campos obrigatórios
        if (!nome || !sobrenome || !data_nasc || !cpf || !email || !senha) {
            return res.status(400).json({ 
                success: false,
                error: 'Todos os campos obrigatórios devem ser preenchidos',
                code: 'REQUIRED_FIELDS_MISSING',
                required: ['nome', 'sobrenome', 'data_nasc', 'cpf', 'email', 'senha']
            });
        }
        
        // Validar formato do email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                success: false,
                error: 'Email inválido',
                code: 'INVALID_EMAIL'
            });
        }
        
        // Validar formato do CPF
        const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
        if (!cpfRegex.test(cpf)) {
            return res.status(400).json({ 
                success: false,
                error: 'CPF inválido. Formato esperado: 000.000.000-00',
                code: 'INVALID_CPF_FORMAT'
            });
        }
        
        // Validar força da senha
        if (senha.length < 8) {
            return res.status(400).json({ 
                success: false,
                error: 'A senha deve ter pelo menos 8 caracteres',
                code: 'WEAK_PASSWORD'
            });
        }
        
        // Verificar se email já existe
        const [emailExists] = await db.execute(
            'SELECT id_login FROM login WHERE email = ?',
            [email.toLowerCase()]
        );
        
        if (emailExists.length > 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Email já cadastrado',
                code: 'EMAIL_ALREADY_EXISTS'
            });
        }
        
        // Verificar se CPF já existe usando o Model
        const cpfExists = await Usuario.cpfExists(cpf);
        if (cpfExists) {
            return res.status(400).json({ 
                success: false,
                error: 'CPF já cadastrado',
                code: 'CPF_ALREADY_EXISTS'
            });
        }
        
        // Preparar dados do usuário
        const usuarioData = {
            nome: nome.trim(),
            sobrenome: sobrenome.trim(),
            nome_social: nome_social ? nome_social.trim() : null,
            data_nasc,
            cpf,
            // Endereço opcional
            logradouro: logradouro ? logradouro.trim() : null,
            bairro: bairro ? bairro.trim() : null,
            numero: numero ? parseInt(numero) : null,
            complemento: complemento ? complemento.trim() : null,
            cidade: cidade ? cidade.trim() : null,
            uf: uf ? uf.toUpperCase().trim() : null,
            cep: cep ? cep.replace(/[^\d]/g, '') : null
        };
        
        // Hash da senha
        const hashedPassword = await bcrypt.hash(senha, BCRYPT_SALT_ROUNDS);
        
        // Criar usuário usando o Model
        const userResult = await Usuario.create(usuarioData);
        const id_usuario = userResult.id_usuario;
        
        // Inserir login
        await db.execute(
            `INSERT INTO login (email, senha, id_usuario, id_permissao)
             VALUES (?, ?, ?, 3)`,
            [email.toLowerCase(), hashedPassword, id_usuario]
        );
        
        // Gerar tokens JWT
        const accessToken = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: 3,
                email: email.toLowerCase(),
                nome: usuarioData.nome,
                tem_endereco: userResult.tem_endereco
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        const refreshToken = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: 3,
                email: email.toLowerCase(),
                nome: usuarioData.nome,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
        
        // Buscar informações completas do usuário
        const user = await Usuario.findById(id_usuario);
        
        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            data: {
                user,
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: JWT_EXPIRES_IN
                }
            }
        });
        
    } catch (error) {
        console.error('Erro no registro:', error);
        
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ 
                success: false,
                error: 'Dados duplicados. Verifique se o email ou CPF já está cadastrado.',
                code: 'DUPLICATE_ENTRY'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao registrar usuário',
            code: 'REGISTRATION_ERROR'
        });
    }
};

// Login de usuário
const login = async (req, res) => {
    try {
        const { email, senha } = req.body;
        
        // Validar campos
        if (!email || !senha) {
            return res.status(400).json({ 
                success: false,
                error: 'Email e senha são obrigatórios',
                code: 'CREDENTIALS_MISSING'
            });
        }
        
        // Buscar usuário pelo email usando o Model
        const user = await Usuario.findByEmail(email.toLowerCase().trim());
        
        if (!user) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        // Verificar senha
        const validPassword = await bcrypt.compare(senha, user.senha);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Credenciais inválidas',
                code: 'INVALID_CREDENTIALS'
            });
        }
        
        // Verificar se usuário está ativo (AGORA usando o campo 'atividade')
        if (user.atividade === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Conta desativada. Entre em contato com o suporte.',
                code: 'ACCOUNT_DEACTIVATED'
            });
        }
        
        // Gerar tokens JWT
        const accessToken = jwt.sign(
            { 
                id_usuario: user.id_usuario,
                id_permissao: user.id_permissao,
                email: user.email,
                nome: user.nome,
                tem_endereco: user.id_endereco !== null
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        const refreshToken = jwt.sign(
            { 
                id_usuario: user.id_usuario,
                id_permissao: user.id_permissao,
                email: user.email,
                nome: user.nome,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
        
        // Buscar informações completas do usuário (sem senha)
        const userInfo = await Usuario.findById(user.id_usuario);
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            data: {
                user: userInfo,
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: JWT_EXPIRES_IN
                }
            }
        });
        
    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao realizar login',
            code: 'LOGIN_ERROR'
        });
    }
};

// Obter perfil do usuário autenticado
const getProfile = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        
        const user = await Usuario.findById(id_usuario);
        
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: user
        });
        
    } catch (error) {
        console.error('Erro ao buscar perfil:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao buscar perfil',
            code: 'PROFILE_FETCH_ERROR'
        });
    }
};

// Atualizar perfil
const updateProfile = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const {
            nome, sobrenome, nome_social, data_nasc,
            logradouro, bairro, numero, complemento, cidade, uf, cep
        } = req.body;
        
        // Validar que pelo menos um campo foi fornecido
        const hasBasicData = nome || sobrenome || nome_social || data_nasc;
        const hasAddressData = logradouro || bairro || numero || cidade || uf || cep;
        
        if (!hasBasicData && !hasAddressData) {
            return res.status(400).json({ 
                success: false,
                error: 'Nenhum campo para atualizar foi fornecido',
                code: 'NO_FIELDS_TO_UPDATE'
            });
        }
        
        // Atualizar dados básicos se fornecidos
        if (hasBasicData) {
            await Usuario.update(id_usuario, {
                nome, sobrenome, nome_social, data_nasc
            });
        }
        
        // Atualizar endereço se fornecido
        if (hasAddressData) {
            // Validar campos obrigatórios do endereço
            if (logradouro && bairro && numero && cidade && uf && cep) {
                await Usuario.updateAddress(id_usuario, {
                    logradouro,
                    bairro,
                    numero: parseInt(numero),
                    complemento,
                    cidade,
                    uf: uf.toUpperCase(),
                    cep: cep.replace(/[^\d]/g, '')
                });
            } else if (logradouro || bairro || numero || cidade || uf || cep) {
                return res.status(400).json({ 
                    success: false,
                    error: 'Para atualizar o endereço, todos os campos são obrigatórios: logradouro, bairro, numero, cidade, uf, cep',
                    code: 'INCOMPLETE_ADDRESS'
                });
            }
        }
        
        // Buscar usuário atualizado
        const updatedUser = await Usuario.findById(id_usuario);
        
        // Gerar novo token com dados atualizados
        const token = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: req.user.id_permissao,
                email: req.user.email,
                nome: nome || req.user.nome,
                tem_endereco: updatedUser.tem_endereco || false
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso!',
            data: {
                user: updatedUser,
                token: token
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        
        if (error.message === 'Usuário não encontrado') {
            return res.status(404).json({ 
                success: false,
                error: error.message,
                code: 'USER_NOT_FOUND'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao atualizar perfil',
            code: 'PROFILE_UPDATE_ERROR'
        });
    }
};

// Alterar senha
const changePassword = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        const { senha_atual, nova_senha } = req.body;
        
        // Validar campos
        if (!senha_atual || !nova_senha) {
            return res.status(400).json({ 
                success: false,
                error: 'Senha atual e nova senha são obrigatórias',
                code: 'PASSWORDS_REQUIRED'
            });
        }
        
        // Validar força da nova senha
        if (nova_senha.length < 8) {
            return res.status(400).json({ 
                success: false,
                error: 'A nova senha deve ter pelo menos 8 caracteres',
                code: 'WEAK_NEW_PASSWORD'
            });
        }
        
        // Buscar senha atual
        const [logins] = await db.execute(
            'SELECT senha FROM login WHERE id_usuario = ?',
            [id_usuario]
        );
        
        if (logins.length === 0) {
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Verificar senha atual
        const validPassword = await bcrypt.compare(senha_atual, logins[0].senha);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false,
                error: 'Senha atual incorreta',
                code: 'INCORRECT_CURRENT_PASSWORD'
            });
        }
        
        // Verificar se nova senha é diferente da atual
        const samePassword = await bcrypt.compare(nova_senha, logins[0].senha);
        if (samePassword) {
            return res.status(400).json({ 
                success: false,
                error: 'A nova senha deve ser diferente da senha atual',
                code: 'SAME_PASSWORD'
            });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(nova_senha, BCRYPT_SALT_ROUNDS);
        
        // Atualizar senha
        await db.execute(
            'UPDATE login SET senha = ? WHERE id_usuario = ?',
            [hashedPassword, id_usuario]
        );
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao alterar senha',
            code: 'PASSWORD_CHANGE_ERROR'
        });
    }
};

// Refresh token
const refreshToken = async (req, res) => {
    try {
        const { id_usuario, id_permissao, email, nome } = req.refreshTokenInfo;
        
        // Buscar informações atualizadas do usuário
        const user = await Usuario.findById(id_usuario);
        
        if (!user || user.atividade === 0) {
            return res.status(401).json({ 
                success: false,
                error: 'Usuário não encontrado ou desativado',
                code: 'USER_INACTIVE'
            });
        }
        
        // Gerar novo access token
        const accessToken = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: id_permissao,
                email: email,
                nome: nome,
                tem_endereco: user.tem_endereco || false
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Gerar novo refresh token (rotacionar)
        const refreshToken = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: id_permissao,
                email: email,
                nome: nome,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
        
        res.json({
            success: true,
            message: 'Token atualizado com sucesso!',
            data: {
                access_token: accessToken,
                refresh_token: refreshToken,
                token_type: 'Bearer',
                expires_in: JWT_EXPIRES_IN
            }
        });
        
    } catch (error) {
        console.error('Erro ao refresh token:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao atualizar token',
            code: 'TOKEN_REFRESH_ERROR'
        });
    }
};

// Logout
const logout = (req, res) => {
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
};

// Verificar token
const verifyAuth = (req, res) => {
    res.json({
        success: true,
        message: 'Token válido',
        data: {
            user: req.user,
            tokenInfo: req.tokenInfo
        }
    });
};

// Esqueci minha senha (solicitação)
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: 'Email é obrigatório',
                code: 'EMAIL_REQUIRED'
            });
        }
        
        // Buscar usuário
        const user = await Usuario.findByEmail(email.toLowerCase().trim());
        
        // Por segurança, não informamos se o email existe ou não
        if (!user) {
            return res.json({
                success: true,
                message: 'Se o email existir em nosso sistema, você receberá um link de recuperação'
            });
        }
        
        // Verificar se usuário está ativo
        if (user.atividade === 0) {
            return res.json({
                success: true,
                message: 'Se o email existir em nosso sistema, você receberá um link de recuperação'
            });
        }
        
        // Gerar token de recuperação
        const resetToken = jwt.sign(
            { 
                id_usuario: user.id_usuario,
                email: user.email,
                type: 'password_reset'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // TODO: Em produção, implementar envio de email
        console.log(`Token de recuperação para ${email}: ${resetToken}`);
        
        res.json({
            success: true,
            message: 'Se o email existir em nosso sistema, você receberá um link de recuperação',
            // Em desenvolvimento, retornar o token para teste
            debug: process.env.NODE_ENV === 'development' ? { reset_token: resetToken } : undefined
        });
        
    } catch (error) {
        console.error('Erro ao solicitar recuperação de senha:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao processar solicitação',
            code: 'FORGOT_PASSWORD_ERROR'
        });
    }
};

// Resetar senha (com token)
const resetPassword = async (req, res) => {
    try {
        const { token, nova_senha } = req.body;
        
        if (!token || !nova_senha) {
            return res.status(400).json({ 
                success: false,
                error: 'Token e nova senha são obrigatórios',
                code: 'TOKEN_AND_PASSWORD_REQUIRED'
            });
        }
        
        // Validar força da nova senha
        if (nova_senha.length < 8) {
            return res.status(400).json({ 
                success: false,
                error: 'A nova senha deve ter pelo menos 8 caracteres',
                code: 'WEAK_NEW_PASSWORD'
            });
        }
        
        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ 
                success: false,
                error: 'Token inválido ou expirado',
                code: 'INVALID_OR_EXPIRED_TOKEN'
            });
        }
        
        // Verificar se é um token de reset de senha
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({ 
                success: false,
                error: 'Tipo de token inválido',
                code: 'INVALID_TOKEN_TYPE'
            });
        }
        
        const { id_usuario } = decoded;
        
        // Verificar se usuário existe e está ativo
        const user = await Usuario.findById(id_usuario);
        if (!user || user.atividade === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Usuário não encontrado ou desativado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(nova_senha, BCRYPT_SALT_ROUNDS);
        
        // Atualizar senha
        await db.execute(
            'UPDATE login SET senha = ? WHERE id_usuario = ?',
            [hashedPassword, id_usuario]
        );
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao resetar senha',
            code: 'PASSWORD_RESET_ERROR'
        });
    }
};

// Validar token de reset (novo método)
const validateResetToken = async (req, res) => {
    try {
        const { token } = req.params;
        
        if (!token) {
            return res.status(400).json({ 
                success: false,
                error: 'Token não fornecido',
                code: 'TOKEN_MISSING'
            });
        }
        
        // Verificar token
        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ 
                success: false,
                error: 'Token inválido ou expirado',
                code: 'INVALID_OR_EXPIRED_TOKEN'
            });
        }
        
        // Verificar se é um token de reset de senha
        if (decoded.type !== 'password_reset') {
            return res.status(400).json({ 
                success: false,
                error: 'Tipo de token inválido',
                code: 'INVALID_TOKEN_TYPE'
            });
        }
        
        // Verificar se usuário existe
        const user = await Usuario.findById(decoded.id_usuario);
        if (!user || user.atividade === 0) {
            return res.status(400).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            message: 'Token válido',
            data: {
                email: decoded.email,
                expiresAt: new Date(decoded.exp * 1000)
            }
        });
        
    } catch (error) {
        console.error('Erro ao validar token:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao validar token',
            code: 'TOKEN_VALIDATION_ERROR'
        });
    }
};

// Exportar tudo
module.exports = {
    register,
    login,
    getProfile,
    updateProfile,
    changePassword,
    refreshToken,
    logout,
    verifyAuth,
    forgotPassword,
    resetPassword,
    validateResetToken  
};