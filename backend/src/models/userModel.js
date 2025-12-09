const db = require('../config/db');
const Endereco = require ('./enderecoModel.js');

class Usuario {
    
    // Criar novo usuário
    static async create(usuarioData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            let id_endereco = null;
            
            // Criar endereço se fornecido e completo
            const temEnderecoCompleto = 
                usuarioData.logradouro && 
                usuarioData.bairro && 
                usuarioData.numero && 
                usuarioData.cidade && 
                usuarioData.uf && 
                usuarioData.cep;
            
            if (temEnderecoCompleto) {
                const endereco = await Endereco.create({
                    logradouro: usuarioData.logradouro,
                    bairro: usuarioData.bairro,
                    numero: usuarioData.numero,
                    complemento: usuarioData.complemento,
                    cidade: usuarioData.cidade,
                    uf: usuarioData.uf,
                    cep: usuarioData.cep
                });
                
                id_endereco = endereco.id_endereco;
            }
            
            // Criar usuário
            const now = new Date();
            const [usuarioResult] = await connection.execute(
                `INSERT INTO usuario 
                 (id_endereco, id_permissao, nome, sobrenome, nome_social, 
                  data_nasc, cpf, createdAt, updateAt, atividade)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
                [
                    id_endereco,
                    usuarioData.id_permissao || 3, // Padrão: Padrinho
                    usuarioData.nome,
                    usuarioData.sobrenome,
                    usuarioData.nome_social || null,
                    usuarioData.data_nasc,
                    usuarioData.cpf,
                    now,
                    now
                ]
            );
            
            await connection.commit();
            
            return {
                id_usuario: usuarioResult.insertId,
                tem_endereco: id_endereco !== null
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar usuário por ID
    static async findById(id_usuario) {
        try {
            const [usuarios] = await db.execute(
                `SELECT u.*, p.nome as permissao_nome, l.email
                 FROM usuario u
                 INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
                 INNER JOIN login l ON u.id_usuario = l.id_usuario
                 WHERE u.id_usuario = ? AND u.atividade = 1`,
                [id_usuario]
            );
            
            if (usuarios.length === 0) return null;
            
            const usuario = usuarios[0];
            
            // Buscar endereço se existir
            let endereco = null;
            if (usuario.id_endereco) {
                endereco = await Endereco.findById(usuario.id_endereco);
            }
            
            return {
                ...usuario,
                endereco,
                tem_endereco: usuario.id_endereco !== null
            };
            
        } catch (error) {
            console.error('Erro ao buscar usuário por ID:', error);
            throw error;
        }
    }
    
    // Buscar usuário por email (para login)
    static async findByEmail(email) {
        try {
            const [usuarios] = await db.execute(
                `SELECT u.*, l.senha, p.nome as permissao_nome
                 FROM usuario u
                 INNER JOIN login l ON u.id_usuario = l.id_usuario
                 INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
                 WHERE l.email = ? AND u.atividade = 1`,
                [email]
            );
            
            if (usuarios.length === 0) return null;
            
            return usuarios[0];
        } catch (error) {
            console.error('Erro ao buscar usuário por email:', error);
            throw error;
        }
    }
    
    // Buscar todos os usuários (com paginação)
    static async findAll(page = 1, limit = 10, search = '') {
        try {
            let query = `
                SELECT u.*, p.nome as permissao_nome,
                CASE 
                    WHEN e.id_endereco IS NOT NULL THEN 1
                    ELSE 0
                END as tem_endereco
                FROM usuario u
                INNER JOIN permissoes p ON u.id_permissao = p.id_permissao
                LEFT JOIN endereco e ON u.id_endereco = e.id_endereco
                WHERE u.atividade = 1
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
                'SELECT u.*, p.nome as permissao_nome, CASE WHEN e.id_endereco IS NOT NULL THEN 1 ELSE 0 END as tem_endereco',
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
            
        } catch (error) {
            console.error('Erro ao buscar todos os usuários:', error);
            throw error;
        }
    }
    
    // Atualizar dados básicos do usuário
    static async update(id_usuario, usuarioData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Buscar usuário atual
            const [users] = await connection.execute(
                'SELECT * FROM usuario WHERE id_usuario = ? AND atividade = 1',
                [id_usuario]
            );
            
            if (users.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            const user = users[0];
            
            // Atualizar dados
            await connection.execute(
                `UPDATE usuario SET
                 nome = ?, sobrenome = ?, nome_social = ?, 
                 data_nasc = ?, updateAt = NOW()
                 WHERE id_usuario = ?`,
                [
                    usuarioData.nome || user.nome,
                    usuarioData.sobrenome || user.sobrenome,
                    usuarioData.nome_social !== undefined ? usuarioData.nome_social : user.nome_social,
                    usuarioData.data_nasc || user.data_nasc,
                    id_usuario
                ]
            );
            
            await connection.commit();
            return true;
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Atualizar permissão do usuário
    static async updatePermission(id_usuario, id_permissao) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se usuário existe
            const [users] = await connection.execute(
                'SELECT id_permissao FROM usuario WHERE id_usuario = ? AND atividade = 1',
                [id_usuario]
            );
            
            if (users.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            const user = users[0];
            
            // Verificar se é o último administrador
            if (user.id_permissao === 1 && parseInt(id_permissao) !== 1) {
                const [admins] = await connection.execute(
                    'SELECT COUNT(*) as total FROM usuario WHERE id_permissao = 1 AND atividade = 1',
                    []
                );
                
                if (admins[0].total <= 1) {
                    throw new Error('Não é possível remover o único administrador do sistema');
                }
            }
            
            // Atualizar permissão no usuário
            await connection.execute(
                'UPDATE usuario SET id_permissao = ?, updateAt = NOW() WHERE id_usuario = ?',
                [id_permissao, id_usuario]
            );
            
            // Atualizar permissão no login
            await connection.execute(
                'UPDATE login SET id_permissao = ? WHERE id_usuario = ?',
                [id_permissao, id_usuario]
            );
            
            await connection.commit();
            return true;
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Desativar usuário (soft delete usando o campo 'atividade')
    static async deactivate(id_usuario) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se usuário existe
            const [users] = await connection.execute(
                'SELECT id_permissao FROM usuario WHERE id_usuario = ? AND atividade = 1',
                [id_usuario]
            );
            
            if (users.length === 0) {
                throw new Error('Usuário não encontrado');
            }
            
            const user = users[0];
            
            // Verificar se é o último administrador
            if (user.id_permissao === 1) {
                const [admins] = await connection.execute(
                    'SELECT COUNT(*) as total FROM usuario WHERE id_permissao = 1 AND atividade = 1',
                    []
                );
                
                if (admins[0].total <= 1) {
                    throw new Error('Não é possível desativar o único administrador do sistema');
                }
            }
            
            // Verificar se usuário tem cães cadastrados ativos
            const [caes] = await connection.execute(
                'SELECT id_cao FROM cao WHERE id_usuario = ? AND ativo = 1',
                [id_usuario]
            );
            
            if (caes.length > 0) {
                throw new Error('Não é possível desativar usuário com cães cadastrados ativos');
            }
            
            // Desativar usuário (soft delete)
            await connection.execute(
                'UPDATE usuario SET atividade = 0, updateAt = NOW() WHERE id_usuario = ?',
                [id_usuario]
            );
            
            // Remover login (opcional - pode manter para reativação)
            await connection.execute(
                'DELETE FROM login WHERE id_usuario = ?',
                [id_usuario]
            );
            
            await connection.commit();
            return true;
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Reativar usuário
    static async activate(id_usuario) {
        try {
            await db.execute(
                'UPDATE usuario SET atividade = 1, updateAt = NOW() WHERE id_usuario = ?',
                [id_usuario]
            );
            
            return true;
        } catch (error) {
            console.error('Erro ao reativar usuário:', error);
            throw error;
        }
    }
    
    // Verificar se CPF já existe
    static async cpfExists(cpf) {
        try {
            const [results] = await db.execute(
                'SELECT id_usuario FROM usuario WHERE cpf = ? AND atividade = 1',
                [cpf]
            );
            return results.length > 0;
        } catch (error) {
            console.error('Erro ao verificar CPF:', error);
            throw error;
        }
    }
    
    // Buscar estatísticas
    static async getStats() {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM usuario WHERE atividade = 1) as total_usuarios,
                    (SELECT COUNT(*) FROM usuario WHERE id_permissao = 1 AND atividade = 1) as total_admins,
                    (SELECT COUNT(*) FROM usuario WHERE id_permissao = 2 AND atividade = 1) as total_adotantes,
                    (SELECT COUNT(*) FROM usuario WHERE id_permissao = 3 AND atividade = 1) as total_padrinhos,
                    (SELECT COUNT(*) FROM usuario WHERE atividade = 1 AND MONTH(createdAt) = MONTH(CURDATE())) as novos_este_mes,
                    (SELECT COUNT(*) FROM usuario WHERE id_endereco IS NOT NULL AND atividade = 1) as usuarios_com_endereco,
                    (SELECT COUNT(*) FROM usuario WHERE id_endereco IS NULL AND atividade = 1) as usuarios_sem_endereco
            `;
            
            const [stats] = await db.execute(query);
            return stats[0] || {};
        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            throw error;
        }
    }
}

module.exports = Usuario;