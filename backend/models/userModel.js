const db = require('../config/db');

const Usuario = {
  // Criar novo usuário (sem endereço obrigatório)
  create: async (usuarioData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se email já existe
      const [emailExists] = await connection.execute(
        'SELECT id_login FROM login WHERE email = ?',
        [usuarioData.email]
      );
      
      if (emailExists.length > 0) {
        throw new Error('Email já cadastrado');
      }
      
      // Verificar se CPF já existe
      const [cpfExists] = await connection.execute(
        'SELECT id_usuario FROM usuario WHERE cpf = ?',
        [usuarioData.cpf]
      );
      
      if (cpfExists.length > 0) {
        throw new Error('CPF já cadastrado');
      }
      
      let id_endereco = null;
      
      // Inserir endereço apenas se todos os campos forem fornecidos
      if (usuarioData.logradouro && usuarioData.bairro && usuarioData.numero && 
          usuarioData.cidade && usuarioData.uf && usuarioData.cep) {
        
        const [enderecoResult] = await connection.execute(
          `INSERT INTO endereco 
           (logradouro, bairro, numero, complemento, cidade, uf, cep)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            usuarioData.logradouro,
            usuarioData.bairro,
            usuarioData.numero,
            usuarioData.complemento || null,
            usuarioData.cidade,
            usuarioData.uf.toUpperCase(),
            usuarioData.cep.replace(/[^\d]/g, '')
          ]
        );
        
        id_endereco = enderecoResult.insertId;
      }
      
      // Inserir usuário (padrão: permissão Padrinho - id 3)
      const now = new Date();
      const [usuarioResult] = await connection.execute(
        `INSERT INTO usuario 
         (id_endereco, id_permissao, nome, sobrenome, nome_social, 
          data_nasc, cpf, createdAt, updateAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id_endereco,
          usuarioData.id_permissao || 3,
          usuarioData.nome,
          usuarioData.sobrenome,
          usuarioData.nome_social || null,
          usuarioData.data_nasc,
          usuarioData.cpf,
          now,
          now
        ]
      );
      
      const id_usuario = usuarioResult.insertId;
      
      await connection.commit();
      return {
        id_usuario,
        id_endereco,
        tem_endereco: id_endereco !== null
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Adicionar/Atualizar endereço do usuário
  addOrUpdateAddress: async (id_usuario, enderecoData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Buscar usuário para verificar se já tem endereço
      const [users] = await connection.execute(
        'SELECT id_endereco FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
        [id_usuario]
      );
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = users[0];
      let id_endereco = user.id_endereco;
      
      // Validar dados do endereço
      const requiredFields = ['logradouro', 'bairro', 'numero', 'cidade', 'uf', 'cep'];
      for (const field of requiredFields) {
        if (!enderecoData[field]) {
          throw new Error(`Campo obrigatório faltando: ${field}`);
        }
      }
      
      // Validar UF
      const ufValida = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                        'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                        'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
      
      if (!ufValida.includes(enderecoData.uf.toUpperCase())) {
        throw new Error('UF inválida');
      }
      
      // Validar CEP
      const cepFormatado = enderecoData.cep.replace(/[^\d]/g, '');
      if (cepFormatado.length !== 8) {
        throw new Error('CEP inválido. Deve conter 8 dígitos.');
      }
      
      if (id_endereco) {
        // Atualizar endereço existente
        await connection.execute(
          `UPDATE endereco SET
            logradouro = ?, bairro = ?, numero = ?, complemento = ?,
            cidade = ?, uf = ?, cep = ?
           WHERE id_endereco = ?`,
          [
            enderecoData.logradouro,
            enderecoData.bairro,
            enderecoData.numero,
            enderecoData.complemento || null,
            enderecoData.cidade,
            enderecoData.uf.toUpperCase(),
            cepFormatado,
            id_endereco
          ]
        );
      } else {
        // Criar novo endereço
        const [enderecoResult] = await connection.execute(
          `INSERT INTO endereco 
           (logradouro, bairro, numero, complemento, cidade, uf, cep)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            enderecoData.logradouro,
            enderecoData.bairro,
            enderecoData.numero,
            enderecoData.complemento || null,
            enderecoData.cidade,
            enderecoData.uf.toUpperCase(),
            cepFormatado
          ]
        );
        
        id_endereco = enderecoResult.insertId;
        
        // Atualizar usuário com o novo id_endereco
        await connection.execute(
          'UPDATE usuario SET id_endereco = ?, updateAt = NOW() WHERE id_usuario = ?',
          [id_endereco, id_usuario]
        );
      }
      
      await connection.commit();
      return {
        id_endereco,
        message: id_endereco ? 'Endereço atualizado com sucesso!' : 'Endereço adicionado com sucesso!'
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Remover endereço do usuário (REMOVI este método pois agora está no Endereco Model)
  // O Controller deve usar Endereco.findByUserId e outras operações do Endereco Model

  // Verificar se usuário tem endereço cadastrado
  hasAddress: async (id_usuario) => {
    const query = 'SELECT id_endereco FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL';
    const [users] = await db.execute(query, [id_usuario]);
    
    if (users.length === 0) {
      throw new Error('Usuário não encontrado');
    }
    
    return {
      hasAddress: users[0].id_endereco !== null,
      id_endereco: users[0].id_endereco
    };
  },

  // Restante dos métodos permanecem iguais (findAll, findById, etc.)
  // Buscar todos os usuários (com paginação)
  findAll: async (page = 1, limit = 10, search = '') => {
    let query = `
      SELECT u.*, p.nome as permissao_nome, e.cidade, e.uf
      FROM usuario u
      INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
      LEFT JOIN endereco e ON u.id_endereco = e.id_endereco
      WHERE u.deleteAt IS NULL
    `;
    
    const params = [];
    
    // Aplicar busca
    if (search) {
      query += ` AND (u.nome LIKE ? OR u.sobrenome LIKE ? OR u.cpf LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }
    
    // Contar total
    const countQuery = query.replace(
      'SELECT u.*, p.nome as permissao_nome, e.cidade, e.uf',
      'SELECT COUNT(*) as total'
    );
    
    const [countResult] = await db.execute(countQuery, params);
    const total = countResult[0].total;
    
    // Adicionar ordenação e paginação
    const offset = (page - 1) * limit;
    query += ' ORDER BY u.createdAt DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));
    
    const [usuarios] = await db.execute(query, params);
    
    return {
      usuarios,
      paginacao: {
        pagina_atual: parseInt(page),
        total_paginas: Math.ceil(total / limit),
        total_registros: total,
        limite: parseInt(limit)
      }
    };
  },

  // Buscar usuário por ID
  findById: async (id) => {
    const query = `
      SELECT u.*, p.nome as permissao_nome, e.*, l.email
      FROM usuario u
      INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
      LEFT JOIN endereco e ON u.id_endereco = e.id_endereco
      INNER JOIN login l ON u.id_usuario = l.id_usuario
      WHERE u.id_usuario = ? AND u.deleteAt IS NULL
    `;
    
    const [usuarios] = await db.execute(query, [id]);
    return usuarios[0] || null;
  },

  // Buscar usuário por email
  findByEmail: async (email) => {
    const query = `
      SELECT u.*, l.senha, p.nome as permissao_nome
      FROM usuario u
      INNER JOIN login l ON u.id_usuario = l.id_usuario
      INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
      WHERE l.email = ? AND u.deleteAt IS NULL
    `;
    
    const [usuarios] = await db.execute(query, [email]);
    return usuarios[0] || null;
  },

  // Atualizar usuário (dados básicos, sem endereço)
  update: async (id, usuarioData) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Buscar usuário atual
      const [users] = await connection.execute(
        'SELECT * FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
        [id]
      );
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = users[0];
      
      // Atualizar dados do usuário (não inclui endereço aqui)
      const updateQuery = `
        UPDATE usuario SET
          nome = ?, sobrenome = ?, nome_social = ?, 
          data_nasc = ?, updateAt = NOW()
        WHERE id_usuario = ?
      `;
      
      await connection.execute(updateQuery, [
        usuarioData.nome || user.nome,
        usuarioData.sobrenome || user.sobrenome,
        usuarioData.nome_social || user.nome_social,
        usuarioData.data_nasc || user.data_nasc,
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

  // Atualizar permissão do usuário
  updatePermission: async (id, id_permissao) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se usuário existe
      const [users] = await connection.execute(
        'SELECT id_permissao FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
        [id]
      );
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = users[0];
      
      // Verificar se é o último administrador
      if (user.id_permissao === 1 && parseInt(id_permissao) !== 1) {
        const [admins] = await connection.execute(
          'SELECT COUNT(*) as total FROM usuario WHERE id_permissao = 1 AND deleteAt IS NULL',
          []
        );
        
        if (admins[0].total <= 1) {
          throw new Error('Não é possível remover o único administrador do sistema');
        }
      }
      
      // Atualizar permissão no usuário
      await connection.execute(
        'UPDATE usuario SET id_permissao = ?, updateAt = NOW() WHERE id_usuario = ?',
        [id_permissao, id]
      );
      
      // Atualizar permissão no login
      await connection.execute(
        'UPDATE login SET id_permissao = ? WHERE id_usuario = ?',
        [id_permissao, id]
      );
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Excluir usuário (soft delete)
  delete: async (id) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Verificar se usuário existe
      const [users] = await connection.execute(
        'SELECT id_permissao FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
        [id]
      );
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = users[0];
      
      // Verificar se é o último administrador
      if (user.id_permissao === 1) {
        const [admins] = await connection.execute(
          'SELECT COUNT(*) as total FROM usuario WHERE id_permissao = 1 AND deleteAt IS NULL',
          []
        );
        
        if (admins[0].total <= 1) {
          throw new Error('Não é possível excluir o único administrador do sistema');
        }
      }
      
      // Verificar se usuário tem cães cadastrados ativos
      const [caes] = await connection.execute(
        'SELECT id_cao FROM cao WHERE id_usuario = ? AND ativo = 1',
        [id]
      );
      
      if (caes.length > 0) {
        throw new Error('Não é possível excluir usuário com cães cadastrados ativos');
      }
      
      // Soft delete do usuário
      await connection.execute(
        'UPDATE usuario SET deleteAt = NOW() WHERE id_usuario = ?',
        [id]
      );
      
      // Remover login
      await connection.execute(
        'DELETE FROM login WHERE id_usuario = ?',
        [id]
      );
      
      await connection.commit();
      return true;
      
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
        (SELECT COUNT(*) FROM usuario WHERE deleteAt IS NULL) as total_usuarios,
        (SELECT COUNT(*) FROM usuario WHERE id_permissao = 1 AND deleteAt IS NULL) as total_admins,
        (SELECT COUNT(*) FROM usuario WHERE id_permissao = 2 AND deleteAt IS NULL) as total_adotantes,
        (SELECT COUNT(*) FROM usuario WHERE id_permissao = 3 AND deleteAt IS NULL) as total_padrinhos,
        (SELECT COUNT(*) FROM usuario WHERE deleteAt IS NULL AND MONTH(createdAt) = MONTH(CURDATE())) as novos_este_mes,
        (SELECT COUNT(*) FROM usuario WHERE id_endereco IS NOT NULL AND deleteAt IS NULL) as usuarios_com_endereco,
        (SELECT COUNT(*) FROM usuario WHERE id_endereco IS NULL AND deleteAt IS NULL) as usuarios_sem_endereco
    `;
    
    const [stats] = await db.execute(query);
    return stats[0] || {};
  },

  // Buscar adoções do usuário
  getAdoptions: async (id_usuario) => {
    const query = `
      SELECT a.*, c.nome as cao_nome, c.foto_url,
             ac.status_adocao
      FROM adotar a
      INNER JOIN adota_cao ac ON a.id_adotar = ac.id_adotar
      INNER JOIN cao c ON ac.cao_id_cao = c.id_cao
      WHERE a.id_usuario = ?
      ORDER BY a.data_adocao DESC
    `;
    
    const [adocoes] = await db.execute(query, [id_usuario]);
    return adocoes;
  },

  // Buscar apadrinhamentos do usuário
  getSponsorships: async (id_usuario) => {
    const query = `
      SELECT ap.*, c.nome as cao_nome, c.foto_url,
             ca.valor
      FROM apadrinhar ap
      INNER JOIN apadrinha_cao ac ON ap.id_apadrinhar = ac.id_apadrinhar
      INNER JOIN cao c ON ac.id_cao = c.id_cao
      LEFT JOIN cartao_apadrinha ca ON ap.id_apadrinhar = ca.id_apadrinhar
      WHERE ap.id_usuario = ?
      ORDER BY ap.data DESC
    `;
    
    const [apadrinhamentos] = await db.execute(query, [id_usuario]);
    return apadrinhamentos;
  },

  // Remover endereço do usuário (AGORA usando o Endereco Model indiretamente)
  removeAddress: async (id_usuario) => {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Buscar usuário
      const [users] = await connection.execute(
        'SELECT id_endereco FROM usuario WHERE id_usuario = ? AND deleteAt IS NULL',
        [id_usuario]
      );
      
      if (users.length === 0) {
        throw new Error('Usuário não encontrado');
      }
      
      const user = users[0];
      
      if (!user.id_endereco) {
        throw new Error('Usuário não possui endereço cadastrado');
      }
      
      // Remover referência do endereço no usuário
      await connection.execute(
        'UPDATE usuario SET id_endereco = NULL, updateAt = NOW() WHERE id_usuario = ?',
        [id_usuario]
      );
      
      // Verificar se o endereço está sendo usado por outros usuários
      const [otherUsers] = await connection.execute(
        'SELECT COUNT(*) as count FROM usuario WHERE id_endereco = ?',
        [user.id_endereco]
      );
      
      // Se não estiver sendo usado por outros usuários, excluir o endereço
      if (otherUsers[0].count === 0) {
        await connection.execute(
          'DELETE FROM endereco WHERE id_endereco = ?',
          [user.id_endereco]
        );
      }
      
      await connection.commit();
      return true;
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  // Buscar endereço do usuário (agora delegado para o Endereco Model)
  getAddress: async (id_usuario) => {
    // Este método será removido, pois agora usamos Endereco.findByUserId
    // Mantido apenas para compatibilidade
    const query = `
      SELECT e.* 
      FROM usuario u
      INNER JOIN endereco e ON u.id_endereco = e.id_endereco
      WHERE u.id_usuario = ? AND u.deleteAt IS NULL
    `;
    
    const [enderecos] = await db.execute(query, [id_usuario]);
    return enderecos[0] || null;
  }
};

module.exports = Usuario;