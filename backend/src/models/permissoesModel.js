const db = require('../config/db');

class PermissaoModel {
  // Buscar permissão por ID
  static async findById(id_permissao) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM permissoes 
         WHERE id_permissao = ?`,
        [id_permissao]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar permissão por ID:', error);
      throw error;
    }
  }

  // Buscar permissão por nome
  static async findByNome(nome) {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM permissoes 
         WHERE nome = ?`,
        [nome]
      );
      
      return rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar permissão por nome:', error);
      throw error;
    }
  }

  // Listar todas as permissões
  static async findAll() {
    try {
      const [rows] = await db.execute(
        `SELECT * FROM permissoes 
         ORDER BY nome`
      );
      
      return rows;
    } catch (error) {
      console.error('Erro ao buscar todas as permissões:', error);
      throw error;
    }
  }

  // Criar nova permissão (apenas admin)
  static async create(permissaoData) {
    try {
      const {
        nome,
        adotar = 0,
        apadrinhar = 0,
        cadastrar = 0
      } = permissaoData;

      // Verificar se já existe permissão com este nome
      const existing = await this.findByNome(nome);
      if (existing) {
        throw new Error('Já existe uma permissão com este nome');
      }

      const [result] = await db.execute(
        `INSERT INTO permissoes (nome, adotar, apadrinhar, cadastrar)
         VALUES (?, ?, ?, ?)`,
        [nome, adotar, apadrinhar, cadastrar]
      );

      return {
        id_permissao: result.insertId,
        message: 'Permissão criada com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar permissão:', error);
      throw error;
    }
  }

  // Atualizar permissão
  static async update(id_permissao, permissaoData) {
    try {
      // Verificar se permissão existe
      const existing = await this.findById(id_permissao);
      if (!existing) {
        throw new Error('Permissão não encontrada');
      }

      // Não permitir atualizar permissões padrão (1: Admin, 2: Adotante, 3: Padrinho)
      if ([1, 2, 3].includes(parseInt(id_permissao))) {
        throw new Error('Não é possível editar permissões padrão do sistema');
      }

      const {
        nome,
        adotar,
        apadrinhar,
        cadastrar
      } = permissaoData;

      // Verificar se novo nome já existe (para outra permissão)
      if (nome && nome !== existing.nome) {
        const duplicate = await this.findByNome(nome);
        if (duplicate && duplicate.id_permissao !== parseInt(id_permissao)) {
          throw new Error('Já existe uma permissão com este nome');
        }
      }

      await db.execute(
        `UPDATE permissoes SET
          nome = COALESCE(?, nome),
          adotar = COALESCE(?, adotar),
          apadrinhar = COALESCE(?, apadrinhar),
          cadastrar = COALESCE(?, cadastrar)
         WHERE id_permissao = ?`,
        [
          nome, adotar, apadrinhar, cadastrar,
          id_permissao
        ]
      );

      return { message: 'Permissão atualizada com sucesso' };
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      throw error;
    }
  }

  // Excluir permissão
  static async delete(id_permissao) {
    const connection = await db.getConnection();
    
    try {
      await connection.beginTransaction();

      // Verificar se permissão existe
      const existing = await this.findById(id_permissao);
      if (!existing) {
        throw new Error('Permissão não encontrada');
      }

      // Não permitir excluir permissões padrão
      if ([1, 2, 3].includes(parseInt(id_permissao))) {
        throw new Error('Não é possível excluir permissões padrão do sistema');
      }

      // Verificar se há usuários usando esta permissão
      const [users] = await connection.execute(
        'SELECT COUNT(*) as total FROM usuario WHERE id_permissao = ?',
        [id_permissao]
      );

      if (users[0].total > 0) {
        throw new Error('Não é possível excluir esta permissão pois existem usuários usando-a');
      }

      // Excluir permissão
      await connection.execute(
        'DELETE FROM permissoes WHERE id_permissao = ?',
        [id_permissao]
      );

      await connection.commit();
      return { message: 'Permissão excluída com sucesso' };
    } catch (error) {
      await connection.rollback();
      console.error('Erro ao excluir permissão:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  // Buscar estatísticas de permissões
  static async getStats() {
    try {
      const [stats] = await db.execute(
        `SELECT 
          COUNT(*) as total_permissoes,
          SUM(adotar) as total_com_adotar,
          SUM(apadrinhar) as total_com_apadrinhar,
          SUM(cadastrar) as total_com_cadastrar
         FROM permissoes`
      );

      const [usage] = await db.execute(
        `SELECT p.nome, COUNT(u.id_usuario) as total_usuarios
         FROM permissoes p
         LEFT JOIN usuario u ON p.id_permissao = u.id_permissao
         GROUP BY p.id_permissao, p.nome
         ORDER BY total_usuarios DESC`
      );

      return {
        ...stats[0],
        uso_permissoes: usage
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas de permissões:', error);
      throw error;
    }
  }

  // Buscar permissões com contagem de usuários
  static async findWithUserCount() {
    try {
      const [rows] = await db.execute(
        `SELECT p.*, COUNT(u.id_usuario) as total_usuarios
         FROM permissoes p
         LEFT JOIN usuario u ON p.id_permissao = u.id_permissao
         GROUP BY p.id_permissao
         ORDER BY p.nome`
      );

      return rows;
    } catch (error) {
      console.error('Erro ao buscar permissões com contagem de usuários:', error);
      throw error;
    }
  }

  // Verificar se usuário tem permissão específica
  static async userHasPermission(id_usuario, permissionName) {
    try {
      // Validar nome da permissão (só pode ser adotar, apadrinhar ou cadastrar)
      const validPermissions = ['adotar', 'apadrinhar', 'cadastrar'];
      if (!validPermissions.includes(permissionName)) {
        return false;
      }

      const [rows] = await db.execute(
        `SELECT p.${permissionName} as tem_permissao
         FROM usuario u
         INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
         WHERE u.id_usuario = ?`,
        [id_usuario]
      );

      if (rows.length === 0) {
        return false;
      }

      return rows[0].tem_permissao === 1;
    } catch (error) {
      console.error('Erro ao verificar permissão do usuário:', error);
      return false;
    }
  }

  // Buscar todas as permissões de um usuário
  static async getUserPermissions(id_usuario) {
    try {
      const [rows] = await db.execute(
        `SELECT p.*
         FROM usuario u
         INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
         WHERE u.id_usuario = ?`,
        [id_usuario]
      );

      return rows[0] || null;
    } catch (error) {
      console.error('Erro ao buscar permissões do usuário:', error);
      throw error;
    }
  }

  // Criar permissões padrão do sistema (se não existirem)
  static async createDefaultPermissions() {
    try {
      const defaultPermissions = [
        {
          id_permissao: 1,
          nome: 'Administrador',
          adotar: 1,
          apadrinhar: 1,
          cadastrar: 1
        },
        {
          id_permissao: 2,
          nome: 'Adotante',
          adotar: 1,
          apadrinhar: 2,
          cadastrar: 0
        },
        {
          id_permissao: 3,
          nome: 'Padrinho',
          adotar: 0,
          apadrinhar: 1,
          cadastrar: 0
        }
      ];

      const created = [];

      for (const perm of defaultPermissions) {
        const existing = await this.findById(perm.id_permissao);
        
        if (!existing) {
          // Inserir com ID específico
          await db.execute(
            `INSERT INTO permissoes (id_permissao, nome, adotar, apadrinhar, cadastrar)
             VALUES (?, ?, ?, ?, ?)`,
            [
              perm.id_permissao, perm.nome, perm.adotar, perm.apadrinhar, perm.cadastrar
            ]
          );
          created.push(perm.nome);
        }
      }

      return {
        message: created.length > 0 
          ? `Permissões padrão criadas: ${created.join(', ')}` 
          : 'Todas as permissões padrão já existem',
        criadas: created
      };
    } catch (error) {
      console.error('Erro ao criar permissões padrão:', error);
      throw error;
    }
  }

  // Método para popular permissões em massa (para testes/seed)
  static async seedPermissions() {
    try {
      const permissions = [
        {
          nome: 'Admin',
          adotar: 1,
          apadrinhar: 1,
          cadastrar: 1
        },
        {
          nome: 'Adotante',
          adotar: 1,
          apadrinhar: 1,
          cadastrar: 0
        },
        {
          nome: 'Padrinho',
          adotar: 0,
          apadrinhar: 1,
          cadastrar: 0
        },
        {
          nome: 'Visualizador',
          adotar: 0,
          apadrinhar: 0,
          cadastrar: 0
        }
      ];

      const results = [];
      
      for (const perm of permissions) {
        const existing = await this.findByNome(perm.nome);
        
        if (!existing) {
          const result = await this.create(perm);
          results.push(result);
        }
      }

      return {
        message: `Seed executado. ${results.length} permissões criadas/verificadas.`,
        resultados: results
      };
    } catch (error) {
      console.error('Erro ao executar seed de permissões:', error);
      throw error;
    }
  }
}

module.exports = PermissaoModel;