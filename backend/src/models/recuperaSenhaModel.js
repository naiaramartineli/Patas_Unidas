const db = require('../config/db');
const crypto = require('crypto');

class ResetSenha {
    
    // Criar token de recuperação
    static async createToken(id_usuario, expiresInHours = 1) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Gerar token único
            const resetToken = crypto.randomBytes(32).toString('hex');
            const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
            
            // Definir expiração
            const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
            
            // Invalidar tokens anteriores
            await connection.execute(
                'UPDATE reset_senha SET usado = 1 WHERE id_usuario = ? AND usado = 0',
                [id_usuario]
            );
            
            // Inserir novo token
            const [result] = await connection.execute(
                `INSERT INTO reset_senha (id_usuario, token_hash, expires_at, criado_em)
                VALUES (?, ?, ?, NOW())`,
                [id_usuario, resetTokenHash, expiresAt]
            );
            
            await connection.commit();
            
            return {
                id: result.insertId,
                token: resetToken,
                tokenHash: resetTokenHash,
                expiresAt: expiresAt,
                criado_em: new Date()
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar token por hash
    static async findByTokenHash(tokenHash) {
        try {
            const [tokens] = await db.execute(
                `SELECT rs.*, u.nome, u.email, l.email as login_email
                FROM reset_senha rs
                INNER JOIN usuario u ON rs.id_usuario = u.id_usuario
                INNER JOIN login l ON u.id_usuario = l.id_usuario
                WHERE rs.token_hash = ? AND rs.usado = 0 AND rs.expires_at > NOW()
                AND u.atividade = 1
                LIMIT 1`,
                [tokenHash]
            );
            
            if (tokens.length === 0) return null;
            
            return {
                id: tokens[0].id,
                id_usuario: tokens[0].id_usuario,
                token_hash: tokens[0].token_hash,
                expires_at: tokens[0].expires_at,
                usado: tokens[0].usado,
                criado_em: tokens[0].criado_em,
                usuario_nome: tokens[0].nome,
                usuario_email: tokens[0].email,
                login_email: tokens[0].login_email
            };
        } catch (error) {
            console.error('Erro ao buscar token por hash:', error);
            throw error;
        }
    }
    
    // Buscar token por usuário
    static async findByUserId(id_usuario, onlyValid = true) {
        try {
            let query = `SELECT * FROM reset_senha WHERE id_usuario = ?`;
            const params = [id_usuario];
            
            if (onlyValid) {
                query += ' AND usado = 0 AND expires_at > NOW()';
            }
            
            query += ' ORDER BY criado_em DESC LIMIT 1';
            
            const [tokens] = await db.execute(query, params);
            
            if (tokens.length === 0) return null;
            
            return {
                id: tokens[0].id,
                id_usuario: tokens[0].id_usuario,
                token_hash: tokens[0].token_hash,
                expires_at: tokens[0].expires_at,
                usado: tokens[0].usado,
                criado_em: tokens[0].criado_em
            };
        } catch (error) {
            console.error('Erro ao buscar token por usuário:', error);
            throw error;
        }
    }
    
    // Marcar token como usado
    static async markAsUsed(id) {
        try {
            const [result] = await db.execute(
                'UPDATE reset_senha SET usado = 1 WHERE id = ?',
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao marcar token como usado:', error);
            throw error;
        }
    }
    
    // Invalidar todos os tokens de um usuário
    static async invalidateAllUserTokens(id_usuario) {
        try {
            const [result] = await db.execute(
                'UPDATE reset_senha SET usado = 1 WHERE id_usuario = ? AND usado = 0',
                [id_usuario]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao invalidar tokens do usuário:', error);
            throw error;
        }
    }
    
    // Limpar tokens expirados
    static async cleanupExpiredTokens() {
        try {
            const [result] = await db.execute(
                'DELETE FROM reset_senha WHERE expires_at < NOW() OR usado = 1'
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Erro ao limpar tokens expirados:', error);
            throw error;
        }
    }
    
    // Verificar se token é válido
    static async isValidToken(token) {
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const tokenRecord = await this.findByTokenHash(tokenHash);
            return tokenRecord !== null;
        } catch (error) {
            console.error('Erro ao verificar token:', error);
            throw error;
        }
    }
    
    // Buscar estatísticas
    static async getStats() {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM reset_senha) as total_tokens,
                    (SELECT COUNT(*) FROM reset_senha WHERE usado = 1) as tokens_usados,
                    (SELECT COUNT(*) FROM reset_senha WHERE usado = 0 AND expires_at > NOW()) as tokens_ativos,
                    (SELECT COUNT(*) FROM reset_senha WHERE expires_at < NOW() AND usado = 0) as tokens_expirados,
                    (SELECT COUNT(DISTINCT id_usuario) FROM reset_senha) as usuarios_com_tokens,
                    (SELECT COUNT(*) FROM reset_senha WHERE DATE(criado_em) = CURDATE()) as tokens_hoje
            `;
            
            const [stats] = await db.execute(query);
            return stats[0] || {};
        } catch (error) {
            console.error('Erro ao buscar estatísticas de tokens:', error);
            throw error;
        }
    }
    
    // Buscar histórico de tokens por usuário
    static async getHistoryByUser(id_usuario, limit = 10) {
        try {
            const [history] = await db.execute(
                `SELECT 
                    rs.*,
                    CASE 
                        WHEN rs.usado = 1 THEN 'USADO'
                        WHEN rs.expires_at < NOW() THEN 'EXPIRADO'
                        ELSE 'ATIVO'
                    END as status_descricao
                FROM reset_senha rs
                WHERE rs.id_usuario = ?
                ORDER BY rs.criado_em DESC
                LIMIT ?`,
                [id_usuario, limit]
            );
            
            return history.map(item => ({
                id: item.id,
                token_hash: item.token_hash,
                expires_at: item.expires_at,
                usado: item.usado,
                criado_em: item.criado_em,
                status_descricao: item.status_descricao
            }));
        } catch (error) {
            console.error('Erro ao buscar histórico de tokens:', error);
            throw error;
        }
    }
    
    // Buscar token mais recente por email
    static async findLatestByEmail(email) {
        try {
            const [tokens] = await db.execute(
                `SELECT rs.*, u.nome, u.email as user_email
                FROM reset_senha rs
                INNER JOIN usuario u ON rs.id_usuario = u.id_usuario
                INNER JOIN login l ON u.id_usuario = l.id_usuario
                WHERE l.email = ? AND rs.usado = 0 AND rs.expires_at > NOW()
                ORDER BY rs.criado_em DESC
                LIMIT 1`,
                [email]
            );
            
            if (tokens.length === 0) return null;
            
            return {
                id: tokens[0].id,
                id_usuario: tokens[0].id_usuario,
                token_hash: tokens[0].token_hash,
                expires_at: tokens[0].expires_at,
                criado_em: tokens[0].criado_em,
                usuario_nome: tokens[0].nome,
                usuario_email: tokens[0].user_email
            };
        } catch (error) {
            console.error('Erro ao buscar token por email:', error);
            throw error;
        }
    }
    
    // Validar token e retornar usuário
    static async validateTokenAndGetUser(token) {
        try {
            const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
            const tokenData = await this.findByTokenHash(tokenHash);
            
            if (!tokenData) {
                return null;
            }
            
            return {
                id_usuario: tokenData.id_usuario,
                usuario_nome: tokenData.usuario_nome,
                usuario_email: tokenData.usuario_email,
                token_id: tokenData.id
            };
        } catch (error) {
            console.error('Erro ao validar token e buscar usuário:', error);
            throw error;
        }
    }
}

module.exports = ResetSenha;