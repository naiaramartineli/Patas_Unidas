const db = require('../config/db');

class AdotaModel {
  // =============================
  // BUSCAR POR ID
  // =============================
  static async findById(id_adotar) {
    try {
      const [rows] = await db.execute(
        `SELECT ac.*, 
                u.nome as usuario_nome, u.sobrenome as usuario_sobrenome, 
                u.nome_social as usuario_nome_social, u.email as usuario_email,
                c.nome as cao_nome, c.foto_url as cao_foto, 
                c.descricao as cao_descricao, c.idade as cao_idade,
                r.nome as raca_nome
         FROM adota_cao ac
         INNER JOIN usuario u ON ac.id_usuario = u.id_usuario
         INNER JOIN cao c ON ac.cao_id_cao = c.id_cao
         INNER JOIN raca r ON c.id_raca = r.id_raca
         WHERE ac.id_adotar = ? AND ac.ativo = 1`,
        [id_adotar]
      );
      
      if (rows.length === 0) {
        return null;
      }
      
      return rows[0];
    } catch (error) {
      console.error('Erro ao buscar adoção por ID:', error);
      throw error;
    }
  }

  // =============================
  // CRIAR SOLICITAÇÃO DE ADOÇÃO
  // =============================
  static async create(id_usuario, id_cao, dadosAdicional = {}) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar se o cão está disponível para adoção
      const [cao] = await connection.execute(
        `SELECT id_cao, ativo FROM cao WHERE id_cao = ? AND ativo = 1`,
        [id_cao]
      );

      if (cao.length === 0) {
        throw new Error('Cão não encontrado ou não disponível para adoção');
      }

      // Verificar se o usuário já tem uma solicitação ativa para este cão
      const [solicitacaoExistente] = await connection.execute(
        `SELECT id_adotar FROM adota_cao 
         WHERE id_usuario = ? AND cao_id_cao = ? AND ativo = 1`,
        [id_usuario, id_cao]
      );

      if (solicitacaoExistente.length > 0) {
        throw new Error('Você já tem uma solicitação de adoção ativa para este cão');
      }

      // Verificar se o cão já foi adotado
      const [cãoAdotado] = await connection.execute(
        `SELECT id_adotar FROM adota_cao 
         WHERE cao_id_cao = ? AND status_adocao = 1 AND ativo = 1`,
        [id_cao]
      );

      if (cãoAdotado.length > 0) {
        throw new Error('Este cão já foi adotado');
      }

      // Inserir solicitação de adoção
      const [result] = await connection.execute(
        `INSERT INTO adota_cao (
          id_usuario, cao_id_cao, status_adocao, motivo_recusa, 
          observacao, data_solicitacao, ativo
        ) VALUES (?, ?, 0, NULL, ?, NOW(), 1)`,
        [
          id_usuario, 
          id_cao, 
          dadosAdicional.observacao || null
        ]
      );

      await connection.commit();
      
      return {
        id_adotar: result.insertId,
        message: 'Solicitação de adoção criada com sucesso'
      };
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao criar solicitação de adoção:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =============================
  // LISTAR TODAS AS SOLICITAÇÕES (ADMIN)
  // =============================
  static async findAll(page = 1, limit = 10, filters = {}) {
    try {
      let query = `
        SELECT ac.*, 
               CONCAT(u.nome, ' ', u.sobrenome) as usuario_nome_completo,
               u.nome_social as usuario_nome_social,
               u.email as usuario_email,
               u.telefone as usuario_telefone,
               c.nome as cao_nome,
               c.foto_url as cao_foto,
               c.idade as cao_idade,
               c.sexo as cao_sexo,
               r.nome as raca_nome,
               CASE 
                 WHEN ac.status_adocao = 0 THEN 'Pendente'
                 WHEN ac.status_adocao = 1 THEN 'Aprovada'
                 WHEN ac.status_adocao = 2 THEN 'Recusada'
                 ELSE 'Cancelada'
               END as status_texto
        FROM adota_cao ac
        INNER JOIN usuario u ON ac.id_usuario = u.id_usuario
        INNER JOIN cao c ON ac.cao_id_cao = c.id_cao
        INNER JOIN raca r ON c.id_raca = r.id_raca
        WHERE ac.ativo = 1
      `;
      
      let countQuery = `
        SELECT COUNT(*) as total
        FROM adota_cao ac
        WHERE ac.ativo = 1
      `;
      
      const params = [];
      const countParams = [];

      // Aplicar filtros
      if (filters.status !== undefined) {
        query += ' AND ac.status_adocao = ?';
        countQuery += ' AND ac.status_adocao = ?';
        params.push(filters.status);
        countParams.push(filters.status);
      }

      if (filters.id_usuario) {
        query += ' AND ac.id_usuario = ?';
        countQuery += ' AND ac.id_usuario = ?';
        params.push(filters.id_usuario);
        countParams.push(filters.id_usuario);
      }

      if (filters.search) {
        query += ` AND (
          u.nome LIKE ? OR 
          u.sobrenome LIKE ? OR 
          u.nome_social LIKE ? OR 
          u.email LIKE ? OR
          c.nome LIKE ?
        )`;
        countQuery += ` AND (
          u.nome LIKE ? OR 
          u.sobrenome LIKE ? OR 
          u.nome_social LIKE ? OR 
          u.email LIKE ? OR
          c.nome LIKE ?
        )`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Ordenação
      query += ' ORDER BY ac.data_solicitacao DESC';

      // Paginação
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      // Executar queries
      const [rows] = await db.execute(query, params);
      const [countResult] = await db.execute(countQuery, countParams);
      
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        adocoes: rows,
        paginacao: {
          pagina_atual: parseInt(page),
          total_paginas: totalPages,
          total_registros: total,
          por_pagina: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Erro ao buscar adoções:', error);
      throw error;
    }
  }

  // =============================
  // BUSCAR ADOÇÕES POR USUÁRIO
  // =============================
  static async findByUserId(id_usuario, page = 1, limit = 10) {
    try {
      const query = `
        SELECT ac.*, 
               c.nome as cao_nome,
               c.foto_url as cao_foto,
               c.descricao as cao_descricao,
               c.idade as cao_idade,
               c.sexo as cao_sexo,
               r.nome as raca_nome,
               CASE 
                 WHEN ac.status_adocao = 0 THEN 'Pendente'
                 WHEN ac.status_adocao = 1 THEN 'Aprovada'
                 WHEN ac.status_adocao = 2 THEN 'Recusada'
                 ELSE 'Cancelada'
               END as status_texto
        FROM adota_cao ac
        INNER JOIN cao c ON ac.cao_id_cao = c.id_cao
        INNER JOIN raca r ON c.id_raca = r.id_raca
        WHERE ac.id_usuario = ? AND ac.ativo = 1
        ORDER BY ac.data_solicitacao DESC
        LIMIT ? OFFSET ?
      `;
      
      const countQuery = `
        SELECT COUNT(*) as total
        FROM adota_cao ac
        WHERE ac.id_usuario = ? AND ac.ativo = 1
      `;
      
      const offset = (page - 1) * limit;
      
      const [rows] = await db.execute(query, [id_usuario, limit, offset]);
      const [countResult] = await db.execute(countQuery, [id_usuario]);
      
      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        adocoes: rows,
        paginacao: {
          pagina_atual: parseInt(page),
          total_paginas: totalPages,
          total_registros: total,
          por_pagina: parseInt(limit),
          has_next: page < totalPages,
          has_prev: page > 1
        }
      };
    } catch (error) {
      console.error('Erro ao buscar adoções do usuário:', error);
      throw error;
    }
  }

  // =============================
  // ATUALIZAR ADOÇÃO
  // =============================
  static async update(id_adotar, dadosAtualizacao) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar se a adoção existe
      const [adocao] = await connection.execute(
        'SELECT * FROM adota_cao WHERE id_adotar = ? AND ativo = 1',
        [id_adotar]
      );

      if (adocao.length === 0) {
        throw new Error('Adoção não encontrada');
      }

      // Validar dados de atualização
      const camposPermitidos = ['status_adocao', 'motivo_recusa', 'observacao'];
      const camposParaAtualizar = {};
      
      Object.keys(dadosAtualizacao).forEach(key => {
        if (camposPermitidos.includes(key) && dadosAtualizacao[key] !== undefined) {
          camposParaAtualizar[key] = dadosAtualizacao[key];
        }
      });

      if (Object.keys(camposParaAtualizar).length === 0) {
        throw new Error('Nenhum campo válido para atualização');
      }

      // Se status for alterado para 1 (aprovada), verificar se o cão já foi adotado
      if (camposParaAtualizar.status_adocao === 1) {
        const [caoAdotado] = await connection.execute(
          `SELECT id_adotar FROM adota_cao 
           WHERE cao_id_cao = ? AND status_adocao = 1 AND id_adotar != ? AND ativo = 1`,
          [adocao[0].cao_id_cao, id_adotar]
        );

        if (caoAdotado.length > 0) {
          throw new Error('Este cão já foi adotado por outra pessoa');
        }
      }

      // Montar query de atualização
      const setClause = Object.keys(camposParaAtualizar)
        .map(key => `${key} = ?`)
        .join(', ');
      
      const values = Object.values(camposParaAtualizar);
      values.push(id_adotar);

      await connection.execute(
        `UPDATE adota_cao SET ${setClause}, data_atualizacao = NOW() 
         WHERE id_adotar = ?`,
        values
      );

      // Se a adoção foi aprovada, marcar o cão como adotado
      if (camposParaAtualizar.status_adocao === 1) {
        await connection.execute(
          'UPDATE cao SET adotado = 1 WHERE id_cao = ?',
          [adocao[0].cao_id_cao]
        );
      }

      await connection.commit();
      
      return {
        message: 'Adoção atualizada com sucesso',
        id_adotar: id_adotar,
        campos_atualizados: camposParaAtualizar
      };
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao atualizar adoção:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =============================
  // CANCELAR ADOÇÃO (SOFT DELETE)
  // =============================
  static async delete(id_adotar) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar se a adoção existe
      const [adocao] = await connection.execute(
        'SELECT * FROM adota_cao WHERE id_adotar = ? AND ativo = 1',
        [id_adotar]
      );

      if (adocao.length === 0) {
        throw new Error('Adoção não encontrada');
      }

      // Não permitir cancelar adoções já aprovadas sem autorização especial
      if (adocao[0].status_adocao === 1) {
        throw new Error('Não é possível cancelar uma adoção já aprovada');
      }

      // Soft delete
      await connection.execute(
        'UPDATE adota_cao SET ativo = 0, data_atualizacao = NOW() WHERE id_adotar = ?',
        [id_adotar]
      );

      await connection.commit();
      
      return {
        message: 'Adoção cancelada com sucesso',
        id_adotar: id_adotar
      };
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao cancelar adoção:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =============================
  // APROVAR ADOÇÃO
  // =============================
  static async approve(id_adotar, dadosAprovacao = {}) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar se a adoção existe
      const [adocao] = await connection.execute(
        'SELECT * FROM adota_cao WHERE id_adotar = ? AND ativo = 1',
        [id_adotar]
      );

      if (adocao.length === 0) {
        throw new Error('Adoção não encontrada');
      }

      // Verificar se já foi aprovada
      if (adocao[0].status_adocao === 1) {
        throw new Error('Esta adoção já foi aprovada anteriormente');
      }

      // Verificar se o cão já foi adotado
      const [caoAdotado] = await connection.execute(
        `SELECT id_adotar FROM adota_cao 
         WHERE cao_id_cao = ? AND status_adocao = 1 AND ativo = 1`,
        [adocao[0].cao_id_cao]
      );

      if (caoAdotado.length > 0) {
        throw new Error('Este cão já foi adotado por outra pessoa');
      }

      // Atualizar status para aprovado
      await connection.execute(
        `UPDATE adota_cao 
         SET status_adocao = 1, 
             data_aprovacao = NOW(),
             observacao = COALESCE(?, observacao),
             data_atualizacao = NOW()
         WHERE id_adotar = ?`,
        [dadosAprovacao.observacao || null, id_adotar]
      );

      // Marcar o cão como adotado
      await connection.execute(
        'UPDATE cao SET adotado = 1 WHERE id_cao = ?',
        [adocao[0].cao_id_cao]
      );

      // Rejeitar outras solicitações para o mesmo cão
      await connection.execute(
        `UPDATE adota_cao 
         SET status_adocao = 2, 
             motivo_recusa = 'Cão adotado por outra pessoa',
             data_atualizacao = NOW()
         WHERE cao_id_cao = ? 
           AND id_adotar != ? 
           AND status_adocao = 0 
           AND ativo = 1`,
        [adocao[0].cao_id_cao, id_adotar]
      );

      await connection.commit();
      
      return {
        message: 'Adoção aprovada com sucesso',
        id_adotar: id_adotar,
        id_cao: adocao[0].cao_id_cao,
        id_usuario: adocao[0].id_usuario
      };
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao aprovar adoção:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // =============================
  // RECUSAR ADOÇÃO
  // =============================
  static async reject(id_adotar, motivo) {
    try {
      if (!motivo || motivo.trim() === '') {
        throw new Error('Motivo da recusa é obrigatório');
      }

      // Verificar se a adoção existe
      const [adocao] = await db.execute(
        'SELECT * FROM adota_cao WHERE id_adotar = ? AND ativo = 1',
        [id_adotar]
      );

      if (adocao.length === 0) {
        throw new Error('Adoção não encontrada');
      }

      // Não permitir recusar adoções já aprovadas
      if (adocao[0].status_adocao === 1) {
        throw new Error('Não é possível recusar uma adoção já aprovada');
      }

      await db.execute(
        `UPDATE adota_cao 
         SET status_adocao = 2, 
             motivo_recusa = ?,
             data_atualizacao = NOW()
         WHERE id_adotar = ?`,
        [motivo, id_adotar]
      );

      return {
        message: 'Adoção recusada com sucesso',
        id_adotar: id_adotar
      };
    } catch (error) {
      console.error('Erro ao recusar adoção:', error);
      throw error;
    }
  }

  // =============================
  // BUSCAR ESTATÍSTICAS
  // =============================
  static async getStats() {
    try {
      const [stats] = await db.execute(`
        SELECT 
          COUNT(*) as total_adocoes,
          SUM(CASE WHEN status_adocao = 0 THEN 1 ELSE 0 END) as total_pendentes,
          SUM(CASE WHEN status_adocao = 1 THEN 1 ELSE 0 END) as total_aprovadas,
          SUM(CASE WHEN status_adocao = 2 THEN 1 ELSE 0 END) as total_recusadas,
          SUM(CASE WHEN ativo = 0 THEN 1 ELSE 0 END) as total_canceladas,
          MIN(data_solicitacao) as primeira_adocao,
          MAX(data_solicitacao) as ultima_adocao
        FROM adota_cao
        WHERE ativo = 1
      `);

      const [adocoesPorMes] = await db.execute(`
        SELECT 
          DATE_FORMAT(data_solicitacao, '%Y-%m') as mes,
          COUNT(*) as total
        FROM adota_cao
        WHERE ativo = 1
        GROUP BY DATE_FORMAT(data_solicitacao, '%Y-%m')
        ORDER BY mes DESC
        LIMIT 12
      `);

      const [usuariosTop] = await db.execute(`
        SELECT 
          u.id_usuario,
          CONCAT(u.nome, ' ', u.sobrenome) as nome,
          u.email,
          COUNT(ac.id_adotar) as total_adocoes
        FROM adota_cao ac
        INNER JOIN usuario u ON ac.id_usuario = u.id_usuario
        WHERE ac.ativo = 1
        GROUP BY u.id_usuario, u.nome, u.sobrenome, u.email
        ORDER BY total_adocoes DESC
        LIMIT 10
      `);

      return {
        ...stats[0],
        adocoes_por_mes: adocoesPorMes,
        usuarios_top: usuariosTop
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de adoções:', error);
      throw error;
    }
  }

  // =============================
  // VERIFICAR SE USUÁRIO PODE ADOTAR
  // =============================
  static async canUserAdopt(id_usuario, id_cao) {
    try {
      // Verificar se usuário tem permissão para adotar
      const [permissao] = await db.execute(`
        SELECT p.adotar 
        FROM usuario u
        INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
        WHERE u.id_usuario = ?
      `, [id_usuario]);

      if (permissao.length === 0 || permissao[0].adotar !== 1) {
        return {
          pode_adotar: false,
          motivo: 'Usuário não tem permissão para adotar'
        };
      }

      // Verificar se cão está disponível
      const [cao] = await db.execute(`
        SELECT id_cao, ativo, adotado 
        FROM cao 
        WHERE id_cao = ? AND ativo = 1
      `, [id_cao]);

      if (cao.length === 0) {
        return {
          pode_adotar: false,
          motivo: 'Cão não encontrado ou não disponível'
        };
      }

      if (cao[0].adotado === 1) {
        return {
          pode_adotar: false,
          motivo: 'Cão já foi adotado'
        };
      }

      // Verificar se usuário já tem solicitação para este cão
      const [solicitacaoExistente] = await db.execute(`
        SELECT id_adotar 
        FROM adota_cao 
        WHERE id_usuario = ? AND cao_id_cao = ? AND ativo = 1
      `, [id_usuario, id_cao]);

      if (solicitacaoExistente.length > 0) {
        return {
          pode_adotar: false,
          motivo: 'Usuário já tem uma solicitação ativa para este cão'
        };
      }

      // Verificar limite de solicitações ativas (ex: máximo 3)
      const [solicitacoesAtivas] = await db.execute(`
        SELECT COUNT(*) as total
        FROM adota_cao 
        WHERE id_usuario = ? AND status_adocao = 0 AND ativo = 1
      `, [id_usuario]);

      if (solicitacoesAtivas[0].total >= 3) {
        return {
          pode_adotar: false,
          motivo: 'Usuário atingiu o limite de solicitações pendentes (3)'
        };
      }

      return {
        pode_adotar: true,
        motivo: 'Usuário pode solicitar adoção'
      };
    } catch (error) {
      console.error('Erro ao verificar se usuário pode adotar:', error);
      throw error;
    }
  }
}

module.exports = AdotaModel;