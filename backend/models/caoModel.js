const db = require('../config/db');

const Cao = {
  // Criar novo cão
  create: async (caoData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const query = `
        INSERT INTO cao (
          id_usuario, nome, id_raca, sexo, idade, temperamento,
          porte, pelagem, descricao, vacinas, castrado, foto_url,
          valor_apadrinhamento, observacao, data_cadastro, ativo
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 1)
      `;
      
      const [result] = await connection.execute(query, [
        caoData.id_usuario,
        caoData.nome,
        caoData.id_raca,
        caoData.sexo,
        caoData.idade,
        caoData.temperamento,
        caoData.porte,
        caoData.pelagem,
        caoData.descricao,
        caoData.vacinas,
        caoData.castrado,
        caoData.foto_url,
        caoData.valor_apadrinhamento,
        caoData.observacao || null
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

  // Buscar todos os cães com filtros
  findAll: async (filters = {}) => {
    let query = `
      SELECT c.*, r.nome as raca_nome, 
             u.nome as responsavel_nome, u.sobrenome as responsavel_sobrenome
      FROM cao c
      INNER JOIN raca r ON c.id_raca = r.id_raca
      INNER JOIN usuario u ON c.id_usuario = u.id_usuario
      WHERE c.ativo = 1
    `;
    
    const params = [];
    const conditions = [];
    
    // Aplicar filtros
    if (filters.porte) {
      conditions.push('c.porte = ?');
      params.push(filters.porte);
    }
    if (filters.sexo) {
      conditions.push('c.sexo = ?');
      params.push(filters.sexo);
    }
    if (filters.idade) {
      conditions.push('c.idade = ?');
      params.push(filters.idade);
    }
    if (filters.temperamento) {
      conditions.push('c.temperamento = ?');
      params.push(filters.temperamento);
    }
    if (filters.castrado !== undefined) {
      conditions.push('c.castrado = ?');
      params.push(filters.castrado);
    }
    if (filters.id_raca) {
      conditions.push('c.id_raca = ?');
      params.push(filters.id_raca);
    }
    if (filters.id_usuario) {
      conditions.push('c.id_usuario = ?');
      params.push(filters.id_usuario);
    }
    
    if (conditions.length > 0) {
      query += ' AND ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY c.data_cadastro DESC';
    
    const [caes] = await db.execute(query, params);
    return caes;
  },

  // Buscar cão por ID
  findById: async (id) => {
    const query = `
      SELECT c.*, r.nome as raca_nome, 
             u.nome as responsavel_nome, u.sobrenome as responsavel_sobrenome,
             u.email as responsavel_email
      FROM cao c
      INNER JOIN raca r ON c.id_raca = r.id_raca
      INNER JOIN usuario u ON c.id_usuario = u.id_usuario
      WHERE c.id_cao = ? AND c.ativo = 1
    `;
    
    const [caes] = await db.execute(query, [id]);
    return caes[0] || null;
  },

  // Atualizar cão
  update: async (id, caoData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Buscar dados atuais
      const [current] = await connection.execute(
        'SELECT * FROM cao WHERE id_cao = ?',
        [id]
      );
      
      if (current.length === 0) {
        throw new Error('Cão não encontrado');
      }
      
      const currentData = current[0];
      
      // Preparar dados para atualização
      const updateData = {
        nome: caoData.nome || currentData.nome,
        id_raca: caoData.id_raca || currentData.id_raca,
        sexo: caoData.sexo || currentData.sexo,
        idade: caoData.idade || currentData.idade,
        temperamento: caoData.temperamento || currentData.temperamento,
        porte: caoData.porte || currentData.porte,
        pelagem: caoData.pelagem || currentData.pelagem,
        descricao: caoData.descricao || currentData.descricao,
        vacinas: caoData.vacinas || currentData.vacinas,
        castrado: caoData.castrado !== undefined ? caoData.castrado : currentData.castrado,
        foto_url: caoData.foto_url || currentData.foto_url,
        valor_apadrinhamento: caoData.valor_apadrinhamento || currentData.valor_apadrinhamento,
        observacao: caoData.observacao || currentData.observacao,
        ativo: caoData.ativo !== undefined ? caoData.ativo : currentData.ativo
      };
      
      const query = `
        UPDATE cao SET 
          nome = ?, id_raca = ?, sexo = ?, idade = ?, temperamento = ?,
          porte = ?, pelagem = ?, descricao = ?, vacinas = ?, castrado = ?,
          foto_url = ?, valor_apadrinhamento = ?, observacao = ?, 
          ativo = ?, updatedAt = CURDATE()
        WHERE id_cao = ?
      `;
      
      await connection.execute(query, [
        updateData.nome,
        updateData.id_raca,
        updateData.sexo,
        updateData.idade,
        updateData.temperamento,
        updateData.porte,
        updateData.pelagem,
        updateData.descricao,
        updateData.vacinas,
        updateData.castrado,
        updateData.foto_url,
        updateData.valor_apadrinhamento,
        updateData.observacao,
        updateData.ativo,
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

  // Excluir cão (soft delete)
  delete: async (id) => {
    const query = 'UPDATE cao SET ativo = 0, updatedAt = CURDATE() WHERE id_cao = ?';
    const [result] = await db.execute(query, [id]);
    return result.affectedRows > 0;
  },

  // Buscar cães para adoção
  findForAdoption: async () => {
    const query = `
      SELECT c.*, r.nome as raca_nome
      FROM cao c
      INNER JOIN raca r ON c.id_raca = r.id_raca
      WHERE c.ativo = 1 
      AND c.id_cao NOT IN (
        SELECT ac.cao_id_cao 
        FROM adota_cao ac 
        INNER JOIN adotar a ON ac.id_adotar = a.id_adotar
        WHERE ac.status_adocao = 1
      )
      ORDER BY c.data_cadastro DESC
    `;
    
    const [caes] = await db.execute(query);
    return caes;
  },

  // Buscar vacinas do cão
  findVacinas: async (id_cao) => {
    const query = `
      SELECT cv.*, v.nome as vacina_nome, v.descricao
      FROM cao_vacina cv
      INNER JOIN vacina v ON cv.id_vacina = v.id_vacina
      WHERE cv.id_cao = ?
      ORDER BY cv.data DESC
    `;
    
    const [vacinas] = await db.execute(query, [id_cao]);
    return vacinas;
  },

  // Adicionar vacina ao cão
  addVacina: async (vacinaData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      const query = `
        INSERT INTO cao_vacina (id_vacina, id_cao, data, proxima_dose, observacao)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const [result] = await connection.execute(query, [
        vacinaData.id_vacina,
        vacinaData.id_cao,
        vacinaData.data,
        vacinaData.proxima_dose || null,
        vacinaData.observacao || null
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

  // Buscar estatísticas
  getStats: async () => {
    const query = `
      SELECT 
        (SELECT COUNT(*) FROM cao WHERE ativo = 1) as total_caes,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND sexo = 'M') as total_machos,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND sexo = 'F') as total_femeas,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND castrado = 1) as total_castrados,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND porte = 'Pequeno') as total_pequenos,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND porte = 'Médio') as total_medios,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND porte = 'Grande') as total_grandes,
        (SELECT COUNT(*) FROM cao WHERE ativo = 1 AND data_cadastro >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)) as novos_ultimo_mes
    `;
    
    const [stats] = await db.execute(query);
    return stats[0] || {};
  }
};

module.exports = Cao;