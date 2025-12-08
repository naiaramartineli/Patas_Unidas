const db = require('../config/db');

const Raca = {
  // Criar nova raça
  create: async (racaData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se raça já existe
      const [existing] = await connection.execute(
        'SELECT id_raca FROM raca WHERE nome = ? AND deletedAt IS NULL',
        [racaData.nome]
      );
      
      if (existing.length > 0) {
        throw new Error('Raça já cadastrada');
      }
      
      const query = 'INSERT INTO raca (nome, createdAt) VALUES (?, CURDATE())';
      const [result] = await connection.execute(query, [racaData.nome]);
      
      await connection.commit();
      return result.insertId;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Buscar todas as raças
  findAll: async () => {
    const query = 'SELECT * FROM raca WHERE deletedAt IS NULL ORDER BY nome';
    const [racas] = await db.execute(query);
    return racas;
  },

  // Buscar raça por ID
  findById: async (id) => {
    const query = 'SELECT * FROM raca WHERE id_raca = ? AND deletedAt IS NULL';
    const [racas] = await db.execute(query, [id]);
    return racas[0] || null;
  },

  // Atualizar raça
  update: async (id, racaData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se raça existe
      const [existing] = await connection.execute(
        'SELECT id_raca FROM raca WHERE id_raca = ? AND deletedAt IS NULL',
        [id]
      );
      
      if (existing.length === 0) {
        throw new Error('Raça não encontrada');
      }
      
      // Verificar se novo nome já existe
      if (racaData.nome) {
        const [duplicate] = await connection.execute(
          'SELECT id_raca FROM raca WHERE nome = ? AND id_raca != ? AND deletedAt IS NULL',
          [racaData.nome, id]
        );
        
        if (duplicate.length > 0) {
          throw new Error('Já existe uma raça com este nome');
        }
      }
      
      const query = 'UPDATE raca SET nome = ?, updateAt = CURDATE() WHERE id_raca = ?';
      await connection.execute(query, [racaData.nome, id]);
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Excluir raça (soft delete)
  delete: async (id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se há cães usando esta raça
      const [caes] = await connection.execute(
        'SELECT id_cao FROM cao WHERE id_raca = ? AND ativo = 1',
        [id]
      );
      
      if (caes.length > 0) {
        throw new Error('Não é possível excluir esta raça pois existem cães cadastrados com ela');
      }
      
      const query = 'UPDATE raca SET deletedAt = CURDATE() WHERE id_raca = ?';
      const [result] = await connection.execute(query, [id]);
      
      await connection.commit();
      return result.affectedRows > 0;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Buscar raças com contagem de cães
  findAllWithDogCount: async () => {
    const query = `
      SELECT r.*, COUNT(c.id_cao) as total_caes
      FROM raca r
      LEFT JOIN cao c ON r.id_raca = c.id_raca AND c.ativo = 1
      WHERE r.deletedAt IS NULL
      GROUP BY r.id_raca
      ORDER BY r.nome
    `;
    
    const [racas] = await db.execute(query);
    return racas;
  },

  // Buscar raças por nome (para autocomplete)
  searchByName: async (searchTerm) => {
    const query = `
      SELECT * FROM raca 
      WHERE nome LIKE ? AND deletedAt IS NULL 
      ORDER BY nome 
      LIMIT 10
    `;
    
    const [racas] = await db.execute(query, [`%${searchTerm}%`]);
    return racas;
  }
};

module.exports = Raca;