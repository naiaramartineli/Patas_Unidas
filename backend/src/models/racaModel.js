const db = require('../config/db');

class Raca {
    
    // Criar nova raça
    static async create(racaData) {
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
            
            // Inserir raça
            const [result] = await connection.execute(
                'INSERT INTO raca (nome, createdAt) VALUES (?, CURDATE())',
                [racaData.nome]
            );
            
            await connection.commit();
            
            return {
                id_raca: result.insertId,
                nome: racaData.nome,
                createdAt: new Date().toISOString().split('T')[0]
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar todas as raças
    static async findAll() {
        try {
            const [racas] = await db.execute(
                'SELECT * FROM raca WHERE deletedAt IS NULL ORDER BY nome'
            );
            
            return racas.map(raca => ({
                id_raca: raca.id_raca,
                nome: raca.nome,
                createdAt: raca.createdAt,
                updateAt: raca.updateAt,
                deletedAt: raca.deletedAt
            }));
        } catch (error) {
            console.error('Erro ao buscar raças:', error);
            throw error;
        }
    }
    
    // Buscar raça por ID
    static async findById(id_raca) {
        try {
            const [racas] = await db.execute(
                'SELECT * FROM raca WHERE id_raca = ? AND deletedAt IS NULL',
                [id_raca]
            );
            
            if (racas.length === 0) return null;
            
            return {
                id_raca: racas[0].id_raca,
                nome: racas[0].nome,
                createdAt: racas[0].createdAt,
                updateAt: racas[0].updateAt,
                deletedAt: racas[0].deletedAt
            };
        } catch (error) {
            console.error('Erro ao buscar raça por ID:', error);
            throw error;
        }
    }
    
    // Atualizar raça
    static async update(id_raca, racaData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se raça existe
            const [existing] = await connection.execute(
                'SELECT id_raca FROM raca WHERE id_raca = ? AND deletedAt IS NULL',
                [id_raca]
            );
            
            if (existing.length === 0) {
                throw new Error('Raça não encontrada');
            }
            
            // Verificar se novo nome já existe
            if (racaData.nome) {
                const [duplicate] = await connection.execute(
                    'SELECT id_raca FROM raca WHERE nome = ? AND id_raca != ? AND deletedAt IS NULL',
                    [racaData.nome, id_raca]
                );
                
                if (duplicate.length > 0) {
                    throw new Error('Já existe uma raça com este nome');
                }
            }
            
            // Atualizar raça
            await connection.execute(
                'UPDATE raca SET nome = ?, updateAt = CURDATE() WHERE id_raca = ?',
                [racaData.nome, id_raca]
            );
            
            await connection.commit();
            
            return {
                id_raca,
                nome: racaData.nome,
                updateAt: new Date().toISOString().split('T')[0]
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Excluir raça (soft delete)
    static async delete(id_raca) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se há cães usando esta raça
            const [caes] = await connection.execute(
                'SELECT id_cao FROM cao WHERE id_raca = ? AND ativo = 1',
                [id_raca]
            );
            
            if (caes.length > 0) {
                throw new Error('Não é possível excluir esta raça pois existem cães cadastrados com ela');
            }
            
            // Soft delete da raça
            const [result] = await connection.execute(
                'UPDATE raca SET deletedAt = CURDATE() WHERE id_raca = ?',
                [id_raca]
            );
            
            await connection.commit();
            
            return result.affectedRows > 0;
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar raças com contagem de cães
    static async findAllWithDogCount() {
        try {
            const [racas] = await db.execute(
                `SELECT r.*, COUNT(c.id_cao) as total_caes
                FROM raca r
                LEFT JOIN cao c ON r.id_raca = c.id_raca AND c.ativo = 1
                WHERE r.deletedAt IS NULL
                GROUP BY r.id_raca
                ORDER BY r.nome`
            );
            
            return racas.map(raca => ({
                id_raca: raca.id_raca,
                nome: raca.nome,
                total_caes: raca.total_caes,
                createdAt: raca.createdAt,
                updateAt: raca.updateAt
            }));
        } catch (error) {
            console.error('Erro ao buscar raças com contagem:', error);
            throw error;
        }
    }
    
    // Buscar raças por nome (para autocomplete)
    static async searchByName(searchTerm) {
        try {
            const [racas] = await db.execute(
                `SELECT * FROM raca 
                WHERE nome LIKE ? AND deletedAt IS NULL 
                ORDER BY nome 
                LIMIT 10`,
                [`%${searchTerm}%`]
            );
            
            return racas.map(raca => ({
                id_raca: raca.id_raca,
                nome: raca.nome,
                createdAt: raca.createdAt
            }));
        } catch (error) {
            console.error('Erro ao buscar raças por nome:', error);
            throw error;
        }
    }
    
    // Verificar se raça existe
    static async exists(nome) {
        try {
            const [racas] = await db.execute(
                'SELECT id_raca FROM raca WHERE nome = ? AND deletedAt IS NULL',
                [nome]
            );
            return racas.length > 0;
        } catch (error) {
            console.error('Erro ao verificar existência de raça:', error);
            throw error;
        }
    }
    
    // Buscar estatísticas de raças
    static async getStats() {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM raca WHERE deletedAt IS NULL) as total_racas,
                    (SELECT COUNT(DISTINCT c.id_raca) FROM cao c WHERE c.ativo = 1) as racas_com_caes,
                    (SELECT r.nome FROM raca r 
                     LEFT JOIN cao c ON r.id_raca = c.id_raca AND c.ativo = 1 
                     WHERE r.deletedAt IS NULL 
                     GROUP BY r.id_raca 
                     ORDER BY COUNT(c.id_cao) DESC 
                     LIMIT 1) as raca_mais_comum,
                    (SELECT COUNT(*) FROM raca WHERE deletedAt IS NOT NULL) as racas_excluidas
            `;
            
            const [stats] = await db.execute(query);
            return stats[0] || {};
        } catch (error) {
            console.error('Erro ao buscar estatísticas de raças:', error);
            throw error;
        }
    }
}

module.exports = Raca;