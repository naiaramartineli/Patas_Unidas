const db = require('../config/db');

// Criar nova raça
exports.create = async (req, res) => {
    try {
        const { nome } = req.body;
        
        if (!nome) {
            return res.status(400).json({ error: 'Nome da raça é obrigatório' });
        }
        
        // Verificar se raça já existe
        const [existing] = await db.execute(
            'SELECT id_raca FROM raca WHERE nome = ? AND deletedAt IS NULL',
            [nome]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Raça já cadastrada' });
        }
        
        // Inserir raça
        const [result] = await db.execute(
            `INSERT INTO raca (nome, createdAt) 
             VALUES (?, CURDATE())`,
            [nome]
        );
        
        res.status(201).json({
            message: 'Raça cadastrada com sucesso!',
            id_raca: result.insertId
        });
        
    } catch (error) {
        console.error('Erro ao criar raça:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Listar todas as raças (ativas)
exports.findAll = async (req, res) => {
    try {
        const [racas] = await db.execute(
            'SELECT * FROM raca WHERE deletedAt IS NULL ORDER BY nome'
        );
        
        res.json(racas);
        
    } catch (error) {
        console.error('Erro ao buscar raças:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar raça por ID
exports.findOne = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [racas] = await db.execute(
            'SELECT * FROM raca WHERE id_raca = ? AND deletedAt IS NULL',
            [id]
        );
        
        if (racas.length === 0) {
            return res.status(404).json({ error: 'Raça não encontrada' });
        }
        
        res.json(racas[0]);
        
    } catch (error) {
        console.error('Erro ao buscar raça:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar raça
exports.update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nome } = req.body;
        
        if (!nome) {
            return res.status(400).json({ error: 'Nome da raça é obrigatório' });
        }
        
        // Verificar se raça existe
        const [existing] = await db.execute(
            'SELECT id_raca FROM raca WHERE id_raca = ? AND deletedAt IS NULL',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Raça não encontrada' });
        }
        
        // Verificar se novo nome já existe (para outra raça)
        const [duplicate] = await db.execute(
            'SELECT id_raca FROM raca WHERE nome = ? AND id_raca != ? AND deletedAt IS NULL',
            [nome, id]
        );
        
        if (duplicate.length > 0) {
            return res.status(400).json({ error: 'Já existe uma raça com este nome' });
        }
        
        // Atualizar raça
        await db.execute(
            'UPDATE raca SET nome = ?, updateAt = CURDATE() WHERE id_raca = ?',
            [nome, id]
        );
        
        res.json({ message: 'Raça atualizada com sucesso!' });
        
    } catch (error) {
        console.error('Erro ao atualizar raça:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Excluir raça (soft delete)
exports.delete = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        
        // Verificar se raça existe
        const [existing] = await connection.execute(
            'SELECT id_raca FROM raca WHERE id_raca = ? AND deletedAt IS NULL',
            [id]
        );
        
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Raça não encontrada' });
        }
        
        // Verificar se há cães usando esta raça
        const [caes] = await connection.execute(
            'SELECT id_cao FROM cao WHERE id_raca = ? AND ativo = 1',
            [id]
        );
        
        if (caes.length > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                error: 'Não é possível excluir esta raça pois existem cães cadastrados com ela' 
            });
        }
        
        // Soft delete
        await connection.execute(
            'UPDATE raca SET deletedAt = CURDATE() WHERE id_raca = ?',
            [id]
        );
        
        await connection.commit();
        
        res.json({ message: 'Raça removida com sucesso!' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao remover raça:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

// Buscar raças com contagem de cães
exports.findWithDogCount = async (req, res) => {
    try {
        const [racas] = await db.execute(
            `SELECT r.*, COUNT(c.id_cao) as total_caes
             FROM raca r
             LEFT JOIN cao c ON r.id_raca = c.id_raca AND c.ativo = 1
             WHERE r.deletedAt IS NULL
             GROUP BY r.id_raca
             ORDER BY r.nome`
        );
        
        res.json(racas);
        
    } catch (error) {
        console.error('Erro ao buscar raças com contagem:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};