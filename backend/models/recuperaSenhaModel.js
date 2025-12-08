const db = require('../config/db');
const crypto = require('crypto');

const ResetSenha = {
  // Criar token de recuperação
  createToken: async (id_usuario, expiresInHours = 1) => {
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
        token: resetToken,
        tokenHash: resetTokenHash,
        id: result.insertId,
        expiresAt: expiresAt
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Buscar token por hash
  findByTokenHash: async (tokenHash) => {
    const query = `
      SELECT rs.*, u.nome, u.email, l.email as login_email
      FROM reset_senha rs
      INNER JOIN usuario u ON rs.id_usuario = u.id_usuario
      INNER JOIN login l ON u.id_usuario = l.id_usuario
      WHERE rs.token_hash = ? AND rs.usado = 0 AND rs.expires_at > NOW()
      AND u.deleteAt IS NULL
      LIMIT 1
    `;
    
    const [tokens] = await db.execute(query, [tokenHash]);
    return tokens[0] || null;
  },

  // Buscar token por usuário
  findByUserId: async (id_usuario, onlyValid = true) => {
    let query = `
      SELECT * FROM reset_senha 
      WHERE id_usuario = ?
    `;
    
    const params = [id_usuario];
    
    if (onlyValid) {
      query += ' AND usado = 0 AND expires_at > NOW()';
    }
    
    query += ' ORDER BY criado_em DESC LIMIT 1';
    
    const [tokens] = await db.execute(query, params);
    return tokens[0] || null;
  },

  // Marcar token como usado
  markAsUsed: async (id) => {
    const query = 'UPDATE reset_senha SET usado = 1 WHERE id = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Invalidar todos os tokens de um usuário
  invalidateAllUserTokens: async (id_usuario) => {
    const query = 'UPDATE reset_senha SET usado = 1 WHERE id_usuario = ? AND usado = 0';
    const [result] = await db.execute(query, [id_usuario]);
    return result.affectedRows > 0;
  },

  // Limpar tokens expirados
  cleanupExpiredTokens: async () => {
    const query = 'DELETE FROM reset_senha WHERE expires_at < NOW() OR usado = 1';
    const [result] = await db.execute(query);
    return result.affectedRows;
  },

  // Verificar se token é válido
  isValidToken: async (token) => {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRecord = await ResetSenha.findByTokenHash(tokenHash);
    return tokenRecord !== null;
  },

  // Buscar estatísticas
  getStats: async () => {
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
  },

  // Buscar histórico de tokens por usuário
  getHistoryByUser: async (id_usuario, limit = 10) => {
    const query = `
      SELECT 
        rs.*,
        CASE 
          WHEN rs.usado = 1 THEN 'USADO'
          WHEN rs.expires_at < NOW() THEN 'EXPIRADO'
          ELSE 'ATIVO'
        END as status_descricao
      FROM reset_senha rs
      WHERE rs.id_usuario = ?
      ORDER BY rs.criado_em DESC
      LIMIT ?
    `;
    
    const [history] = await db.execute(query, [id_usuario, limit]);
    return history;
  },

  // Buscar token mais recente por email
  findLatestByEmail: async (email) => {
    const query = `
      SELECT rs.*, u.nome, u.email as user_email
      FROM reset_senha rs
      INNER JOIN usuario u ON rs.id_usuario = u.id_usuario
      INNER JOIN login l ON u.id_usuario = l.id_usuario
      WHERE l.email = ? AND rs.usado = 0 AND rs.expires_at > NOW()
      ORDER BY rs.criado_em DESC
      LIMIT 1
    `;
    
    const [tokens] = await db.execute(query, [email]);
    return tokens[0] || null;
  }
};

module.exports = ResetSenha;