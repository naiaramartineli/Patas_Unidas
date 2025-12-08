const db = require('../config/db');

const Endereco = {
  // Buscar endereço por ID
  findById: async (id) => {
    const query = 'SELECT * FROM endereco WHERE id_endereco = ?';
    const [enderecos] = await db.execute(query, [id]);
    return enderecos[0] || null;
  },

  // Buscar endereços por CEP
  findByCep: async (cep) => {
    const cepFormatado = cep.replace(/[^\d]/g, '');
    const query = 'SELECT * FROM endereco WHERE cep = ?';
    const [enderecos] = await db.execute(query, [cepFormatado]);
    return enderecos;
  },

  // Buscar endereços por cidade
  findByCity: async (cidade, uf, limit = 50) => {
    let query = 'SELECT * FROM endereco WHERE cidade LIKE ? AND uf = ?';
    const params = [`%${cidade}%`, uf];
    
    query += ' LIMIT ?';
    params.push(parseInt(limit));
    
    const [enderecos] = await db.execute(query, params);
    return enderecos;
  },

  // Buscar endereços por bairro
  findByNeighborhood: async (bairro, cidade, uf, limit = 100) => {
    const query = `
      SELECT * FROM endereco 
      WHERE bairro LIKE ? 
        AND cidade LIKE ? 
        AND uf = ?
      ORDER BY logradouro
      LIMIT ?
    `;
    
    const [enderecos] = await db.execute(query, [
      `%${bairro}%`,
      `%${cidade}%`,
      uf,
      limit
    ]);
    
    return enderecos;
  },

  // Criar endereço
  create: async (enderecoData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Validar e formatar dados
      const cepFormatado = enderecoData.cep.replace(/[^\d]/g, '');
      const ufFormatada = enderecoData.uf.toUpperCase();
      
      const query = `
        INSERT INTO endereco 
        (logradouro, bairro, numero, complemento, cidade, uf, cep)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        enderecoData.logradouro,
        enderecoData.bairro,
        enderecoData.numero,
        enderecoData.complemento || null,
        enderecoData.cidade,
        ufFormatada,
        cepFormatado
      ]);
      
      await connection.commit();
      return result.insertId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Atualizar endereço
  update: async (id, enderecoData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se endereço existe
      const [existing] = await connection.execute(
        'SELECT * FROM endereco WHERE id_endereco = ?',
        [id]
      );
      
      if (existing.length === 0) {
        throw new Error('Endereço não encontrado');
      }
      
      // Validar e formatar dados
      const cepFormatado = enderecoData.cep.replace(/[^\d]/g, '');
      const ufFormatada = enderecoData.uf.toUpperCase();
      
      const query = `
        UPDATE endereco SET
          logradouro = ?, bairro = ?, numero = ?, complemento = ?,
          cidade = ?, uf = ?, cep = ?
        WHERE id_endereco = ?
      `;
      
      await connection.execute(query, [
        enderecoData.logradouro,
        enderecoData.bairro,
        enderecoData.numero,
        enderecoData.complemento || null,
        enderecoData.cidade,
        ufFormatada,
        cepFormatado,
        id
      ]);
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Excluir endereço
  delete: async (id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se há usuários usando este endereço
      const [usuarios] = await connection.execute(
        'SELECT id_usuario FROM usuario WHERE id_endereco = ?',
        [id]
      );
      
      if (usuarios.length > 0) {
        throw new Error('Não é possível excluir este endereço pois existem usuários vinculados a ele');
      }
      
      // Excluir endereço
      const [result] = await connection.execute(
        'DELETE FROM endereco WHERE id_endereco = ?',
        [id]
      );
      
      await connection.commit();
      return result.affectedRows > 0;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Buscar endereço por usuário
  findByUserId: async (id_usuario) => {
    const query = `
      SELECT e.* 
      FROM usuario u
      INNER JOIN endereco e ON u.id_endereco = e.id_endereco
      WHERE u.id_usuario = ? AND u.deleteAt IS NULL
    `;
    
    const [enderecos] = await db.execute(query, [id_usuario]);
    return enderecos[0] || null;
  },

  // Buscar usuários por endereço
  findUsersByAddressId: async (id_endereco) => {
    const query = `
      SELECT u.*, p.nome as permissao_nome
      FROM usuario u
      INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
      WHERE u.id_endereco = ? AND u.deleteAt IS NULL
    `;
    
    const [usuarios] = await db.execute(query, [id_endereco]);
    return usuarios;
  },

  // Buscar estatísticas
  getStats: async () => {
    const query = `
      SELECT 
        COUNT(DISTINCT cidade) as total_cidades,
        COUNT(DISTINCT uf) as total_estados,
        uf,
        COUNT(*) as total_por_estado
      FROM endereco
      GROUP BY uf
      ORDER BY total_por_estado DESC
    `;
    
    const [stats] = await db.execute(query);
    
    // Calcular total geral
    const totalGeral = stats.reduce((sum, item) => sum + item.total_por_estado, 0);
    
    return {
      total_enderecos: totalGeral,
      total_cidades: stats[0]?.total_cidades || 0,
      total_estados: stats[0]?.total_estados || 0,
      distribuicao_por_estado: stats
    };
  },

  // Verificar se endereço existe
  exists: async (id) => {
    const query = 'SELECT 1 FROM endereco WHERE id_endereco = ?';
    const [result] = await db.execute(query, [id]);
    return result.length > 0;
  },

  // Buscar todos os endereços (com paginação)
  findAll: async (page = 1, limit = 50) => {
    const offset = (page - 1) * limit;
    
    const query = `
      SELECT * FROM endereco 
      ORDER BY cidade, bairro, logradouro
      LIMIT ? OFFSET ?
    `;
    
    const [enderecos] = await db.execute(query, [parseInt(limit), parseInt(offset)]);
    
    // Contar total
    const [countResult] = await db.execute('SELECT COUNT(*) as total FROM endereco');
    const total = countResult[0].total;
    
    return {
      enderecos,
      paginacao: {
        pagina_atual: parseInt(page),
        total_paginas: Math.ceil(total / limit),
        total_registros: total,
        limite: parseInt(limit)
      }
    };
  }
};

module.exports = Endereco;