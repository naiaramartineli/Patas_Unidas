// models/permissoesModel.js
const db = require ('../config/db.js');

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

    // Buscar todas as permissões
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

    // Verificar se usuário tem permissão específica
    static async userHasPermission(id_usuario, permissionName) {
        try {
            // Validar nome da permissão
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

    // Criar permissões padrão do sistema
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
                    apadrinhar: 0,
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

            for (const perm of defaultPermissions) {
                const existing = await this.findById(perm.id_permissao);
                
                if (!existing) {
                    await db.execute(
                        `INSERT INTO permissoes (id_permissao, nome, adotar, apadrinhar, cadastrar)
                         VALUES (?, ?, ?, ?, ?)`,
                        [
                            perm.id_permissao, 
                            perm.nome, 
                            perm.adotar, 
                            perm.apadrinhar, 
                            perm.cadastrar
                        ]
                    );
                }
            }

            return { message: 'Permissões padrão verificadas/criadas' };
        } catch (error) {
            console.error('Erro ao criar permissões padrão:', error);
            throw error;
        }
    }
}

module.exports = PermissaoModel;