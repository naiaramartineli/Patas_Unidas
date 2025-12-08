const db = require('../config/db');

const Vacina = {
  // Criar nova vacina
  create: async (vacinaData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se vacina já existe
      const [existing] = await connection.execute(
        'SELECT id_vacina FROM vacina WHERE nome = ?',
        [vacinaData.nome]
      );
      
      if (existing.length > 0) {
        throw new Error('Vacina já cadastrada');
      }
      
      const query = `
        INSERT INTO vacina 
        (nome, descricao, idade_recomendada, dose_unica, 
         qtd_doses, intervalo_dose, intervalo_reforco)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        vacinaData.nome,
        vacinaData.descricao,
        vacinaData.idade_recomendada,
        vacinaData.dose_unica,
        vacinaData.qtd_doses || null,
        vacinaData.intervalo_dose || null,
        vacinaData.intervalo_reforco
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

  // Buscar todas as vacinas
  findAll: async () => {
    const query = 'SELECT * FROM vacina ORDER BY nome';
    const [vacinas] = await db.execute(query);
    return vacinas;
  },

  // Buscar vacina por ID
  findById: async (id) => {
    const query = 'SELECT * FROM vacina WHERE id_vacina = ?';
    const [vacinas] = await db.execute(query, [id]);
    return vacinas[0] || null;
  },

  // Atualizar vacina
  update: async (id, vacinaData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se vacina existe
      const [existing] = await connection.execute(
        'SELECT id_vacina FROM vacina WHERE id_vacina = ?',
        [id]
      );
      
      if (existing.length === 0) {
        throw new Error('Vacina não encontrada');
      }
      
      // Verificar se novo nome já existe
      if (vacinaData.nome) {
        const [duplicate] = await connection.execute(
          'SELECT id_vacina FROM vacina WHERE nome = ? AND id_vacina != ?',
          [vacinaData.nome, id]
        );
        
        if (duplicate.length > 0) {
          throw new Error('Já existe uma vacina com este nome');
        }
      }
      
      const query = `
        UPDATE vacina SET
          nome = ?, descricao = ?, idade_recomendada = ?,
          dose_unica = ?, qtd_doses = ?, intervalo_dose = ?,
          intervalo_reforco = ?
        WHERE id_vacina = ?
      `;
      
      await connection.execute(query, [
        vacinaData.nome,
        vacinaData.descricao,
        vacinaData.idade_recomendada,
        vacinaData.dose_unica,
        vacinaData.qtd_doses || null,
        vacinaData.intervalo_dose || null,
        vacinaData.intervalo_reforco,
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

  // Excluir vacina
  delete: async (id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se há registros de vacinação usando esta vacina
      const [registros] = await connection.execute(
        'SELECT id FROM cao_vacina WHERE id_vacina = ?',
        [id]
      );
      
      if (registros.length > 0) {
        throw new Error('Não é possível excluir esta vacina pois existem registros de vacinação associados');
      }
      
      const query = 'DELETE FROM vacina WHERE id_vacina = ?';
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

  // Buscar vacinas por tipo/categoria
  findByCategory: async (categoria) => {
    let query = 'SELECT * FROM vacina WHERE 1=1';
    const params = [];
    
    if (categoria === 'obrigatoria') {
      query += ' AND nome IN (?, ?, ?)';
      params.push('V8/V10', 'Antirrábica', 'Giárdia');
    } else if (categoria === 'opcional') {
      query += ' AND nome NOT IN (?, ?, ?)';
      params.push('V8/V10', 'Antirrábica', 'Giárdia');
    }
    
    query += ' ORDER BY nome';
    
    const [vacinas] = await db.execute(query, params);
    return vacinas;
  },

  // Buscar vacinas recomendadas por idade
  findByAge: async (idade) => {
    const query = `
      SELECT * FROM vacina 
      WHERE idade_recomendada LIKE ? 
      ORDER BY nome
    `;
    
    const [vacinas] = await db.execute(query, [`%${idade}%`]);
    return vacinas;
  },

  // Buscar estatísticas
  getStats: async () => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM vacina) as total_vacinas,
        (SELECT COUNT(*) FROM vacina WHERE dose_unica = 1) as total_dose_unica,
        (SELECT COUNT(DISTINCT cv.id_cao) FROM cao_vacina cv) as caes_vacinados,
        (SELECT COUNT(*) FROM cao_vacina) as total_aplicacoes
    `;
    
    const [stats] = await db.execute(query);
    return stats[0] || {};
  }
};

module.exports = Vacina;