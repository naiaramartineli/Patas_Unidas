const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const Usuario = require('../models/userModel');

// Configurações
const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo_jwt_aqui';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '30d';
const BCRYPT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

// Registrar novo usuário
exports.register = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            nome, sobrenome, nome_social, data_nasc, cpf, email, senha,
            logradouro, bairro, numero, complemento, cidade, uf, cep
        } = req.body;
        
        // Validar campos obrigatórios (endereço não é mais obrigatório)
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
        
        // Validar formato do CPF (simplificado)
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
        const [emailExists] = await connection.execute(
            'SELECT id_login FROM login WHERE email = ?',
            [email]
        );
        
        if (emailExists.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                error: 'Email já cadastrado',
                code: 'EMAIL_ALREADY_EXISTS'
            });
        }
        
        // Verificar se CPF já existe
        const [cpfExists] = await connection.execute(
            'SELECT id_usuario FROM usuario WHERE cpf = ?',
            [cpf]
        );
        
        if (cpfExists.length > 0) {
            await connection.rollback();
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
            email: email.toLowerCase().trim(),
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
        await connection.execute(
            `INSERT INTO login (email, senha, id_usuario, id_permissao)
             VALUES (?, ?, ?, 3)`,
            [usuarioData.email, hashedPassword, id_usuario]
        );
        
        await connection.commit();
        
        // Gerar tokens JWT
        const accessToken = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: 3,
                email: usuarioData.email,
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
                email: usuarioData.email,
                nome: usuarioData.nome,
                type: 'refresh'
            },
            JWT_SECRET,
            { expiresIn: REFRESH_TOKEN_EXPIRES_IN }
        );
        
        // Buscar informações completas do usuário
        const [users] = await db.execute(
            `SELECT u.*, p.nome as permissao_nome 
             FROM usuario u
             INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
             WHERE u.id_usuario = ?`,
            [id_usuario]
        );
        
        const user = users[0];
        
        // Remover dados sensíveis
        const userResponse = {
            id_usuario: user.id_usuario,
            nome: user.nome,
            sobrenome: user.sobrenome,
            nome_social: user.nome_social,
            email: user.email,
            id_permissao: user.id_permissao,
            permissao_nome: user.permissao_nome,
            data_nasc: user.data_nasc,
            tem_endereco: userResult.tem_endereco,
            createdAt: user.createdAt
        };
        
        res.status(201).json({
            success: true,
            message: 'Usuário cadastrado com sucesso!',
            data: {
                user: userResponse,
                tokens: {
                    access_token: accessToken,
                    refresh_token: refreshToken,
                    token_type: 'Bearer',
                    expires_in: JWT_EXPIRES_IN
                }
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro no registro:', error);
        
        if (error.message.includes('já cadastrado')) {
            return res.status(400).json({ 
                success: false,
                error: error.message,
                code: 'DUPLICATE_ENTRY'
            });
        }
        
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao registrar usuário',
            code: 'REGISTRATION_ERROR'
        });
    } finally {
        connection.release();
    }
};

// Login de usuário
exports.login = async (req, res) => {
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
        
        // Verificar se usuário está ativo
        if (user.deleteAt) {
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
        
        // Remover dados sensíveis
        const userResponse = {
            id_usuario: user.id_usuario,
            nome: user.nome,
            sobrenome: user.sobrenome,
            nome_social: user.nome_social,
            email: user.email,
            id_permissao: user.id_permissao,
            permissao_nome: user.permissao_nome,
            data_nasc: user.data_nasc,
            tem_endereco: user.id_endereco !== null,
            createdAt: user.createdAt
        };
        
        res.json({
            success: true,
            message: 'Login realizado com sucesso!',
            data: {
                user: userResponse,
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
exports.getProfile = async (req, res) => {
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
        
        // Remover dados sensíveis
        const { cpf, senha, ...userWithoutSensitive } = user;
        
        res.json({
            success: true,
            data: userWithoutSensitive
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
exports.updateProfile = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const id_usuario = req.user.id_usuario;
        const {
            nome, sobrenome, nome_social, data_nasc,
            logradouro, bairro, numero, complemento, cidade, uf, cep
        } = req.body;
        
        // Validar que pelo menos um campo foi fornecido
        if (!nome && !sobrenome && !nome_social && !data_nasc && 
            !logradouro && !bairro && !numero && !complemento && !cidade && !uf && !cep) {
            return res.status(400).json({ 
                success: false,
                error: 'Nenhum campo para atualizar foi fornecido',
                code: 'NO_FIELDS_TO_UPDATE'
            });
        }
        
        // Buscar usuário atual
        const [users] = await connection.execute(
            `SELECT u.*, e.* FROM usuario u
             LEFT JOIN endereco e ON u.id_endereco = e.id_endereco
             WHERE u.id_usuario = ?`,
            [id_usuario]
        );
        
        if (users.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        const user = users[0];
        
        // Atualizar dados básicos se fornecidos
        if (nome || sobrenome || nome_social || data_nasc) {
            await connection.execute(
                `UPDATE usuario SET
                 nome = ?, sobrenome = ?, nome_social = ?, data_nasc = ?, updateAt = NOW()
                 WHERE id_usuario = ?`,
                [
                    nome || user.nome,
                    sobrenome || user.sobrenome,
                    nome_social !== undefined ? nome_social : user.nome_social,
                    data_nasc || user.data_nasc,
                    id_usuario
                ]
            );
        }
        
        // Atualizar/criar endereço se fornecidos dados de endereço
        if (logradouro || bairro || numero || cidade || uf || cep) {
            if (user.id_endereco) {
                // Atualizar endereço existente
                await connection.execute(
                    `UPDATE endereco SET
                     logradouro = ?, bairro = ?, numero = ?, complemento = ?,
                     cidade = ?, uf = ?, cep = ?
                     WHERE id_endereco = ?`,
                    [
                        logradouro || user.logradouro,
                        bairro || user.bairro,
                        numero || user.numero,
                        complemento !== undefined ? complemento : user.complemento,
                        cidade || user.cidade,
                        uf ? uf.toUpperCase() : user.uf,
                        cep ? cep.replace(/[^\d]/g, '') : user.cep,
                        user.id_endereco
                    ]
                );
            } else {
                // Criar novo endereço
                const [enderecoResult] = await connection.execute(
                    `INSERT INTO endereco 
                     (logradouro, bairro, numero, complemento, cidade, uf, cep)
                     VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [
                        logradouro,
                        bairro,
                        numero,
                        complemento || null,
                        cidade,
                        uf.toUpperCase(),
                        cep.replace(/[^\d]/g, '')
                    ]
                );
                
                await connection.execute(
                    'UPDATE usuario SET id_endereco = ? WHERE id_usuario = ?',
                    [enderecoResult.insertId, id_usuario]
                );
            }
        }
        
        await connection.commit();
        
        // Buscar usuário atualizado
        const updatedUser = await Usuario.findById(id_usuario);
        const { cpf, senha, ...userWithoutSensitive } = updatedUser;
        
        // Gerar novo token com dados atualizados
        const token = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: req.user.id_permissao,
                email: req.user.email,
                nome: nome || req.user.nome,
                tem_endereco: updatedUser.id_endereco !== null
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        res.json({
            success: true,
            message: 'Perfil atualizado com sucesso!',
            data: {
                user: userWithoutSensitive,
                token: token
            }
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao atualizar perfil:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao atualizar perfil',
            code: 'PROFILE_UPDATE_ERROR'
        });
    } finally {
        connection.release();
    }
};

// Alterar senha
exports.changePassword = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
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
        const [logins] = await connection.execute(
            'SELECT senha FROM login WHERE id_usuario = ?',
            [id_usuario]
        );
        
        if (logins.length === 0) {
            await connection.rollback();
            return res.status(404).json({ 
                success: false,
                error: 'Usuário não encontrado',
                code: 'USER_NOT_FOUND'
            });
        }
        
        // Verificar senha atual
        const validPassword = await bcrypt.compare(senha_atual, logins[0].senha);
        
        if (!validPassword) {
            await connection.rollback();
            return res.status(401).json({ 
                success: false,
                error: 'Senha atual incorreta',
                code: 'INCORRECT_CURRENT_PASSWORD'
            });
        }
        
        // Verificar se nova senha é diferente da atual
        const samePassword = await bcrypt.compare(nova_senha, logins[0].senha);
        if (samePassword) {
            await connection.rollback();
            return res.status(400).json({ 
                success: false,
                error: 'A nova senha deve ser diferente da senha atual',
                code: 'SAME_PASSWORD'
            });
        }
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(nova_senha, BCRYPT_SALT_ROUNDS);
        
        // Atualizar senha
        await connection.execute(
            'UPDATE login SET senha = ? WHERE id_usuario = ?',
            [hashedPassword, id_usuario]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao alterar senha',
            code: 'PASSWORD_CHANGE_ERROR'
        });
    } finally {
        connection.release();
    }
};

// Refresh token
exports.refreshToken = async (req, res) => {
    try {
        const { id_usuario, id_permissao, email, nome } = req.refreshTokenInfo;
        
        // Gerar novo access token
        const accessToken = jwt.sign(
            { 
                id_usuario: id_usuario,
                id_permissao: id_permissao,
                email: email,
                nome: nome,
                tem_endereco: req.user?.tem_endereco || false
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        
        // Opcional: gerar novo refresh token (rotacionar)
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

// Logout (client-side apenas - em produção, implementar blacklist de tokens)
exports.logout = (req, res) => {
    // Em um sistema real, você adicionaria o token a uma blacklist
    // ou invalidaria o refresh token
    
    res.json({
        success: true,
        message: 'Logout realizado com sucesso'
    });
};

// Verificar token (endpoint para validar token do frontend)
exports.verifyAuth = (req, res) => {
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
exports.forgotPassword = async (req, res) => {
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
        
        // Gerar token de recuperação (em produção, implemente email)
        const resetToken = jwt.sign(
            { 
                id_usuario: user.id_usuario,
                email: user.email,
                type: 'password_reset'
            },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        
        // Em produção, enviar email com link de recuperação
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
exports.resetPassword = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
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
        
        // Hash da nova senha
        const hashedPassword = await bcrypt.hash(nova_senha, BCRYPT_SALT_ROUNDS);
        
        // Atualizar senha
        await connection.execute(
            'UPDATE login SET senha = ? WHERE id_usuario = ?',
            [hashedPassword, id_usuario]
        );
        
        await connection.commit();
        
        res.json({
            success: true,
            message: 'Senha alterada com sucesso!'
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erro interno do servidor ao resetar senha',
            code: 'PASSWORD_RESET_ERROR'
        });
    } finally {
        connection.release();
    }
};