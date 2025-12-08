const db = require('../config/db');
const path = require('path');
const fs = require('fs');

// Criar um novo cão
exports.create = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const {
            nome, id_raca, sexo, idade, temperamento, 
            porte, pelagem, descricao, vacinas, castrado, 
            valor_apadrinhamento, observacao
        } = req.body;
        
        // Obter ID do usuário do token
        const id_usuario = req.user.id_usuario || req.user.id;
        
        // Validar campos obrigatórios
        if (!nome || !id_raca || !sexo || !idade || !temperamento || 
            !porte || !pelagem || !descricao || !vacinas || 
            castrado === undefined || !valor_apadrinhamento) {
            return res.status(400).json({ 
                error: 'Todos os campos obrigatórios devem ser preenchidos' 
            });
        }
        
        // Processar upload de foto
        let foto_url = null;
        if (req.file) {
            foto_url = `/uploads/caes/${req.file.filename}`;
        }
        
        // Inserir cão
        const [result] = await connection.execute(
            `INSERT INTO cao (
                id_usuario, nome, id_raca, sexo, idade, temperamento,
                porte, pelagem, descricao, vacinas, castrado, foto_url,
                valor_apadrinhamento, observacao, data_cadastro, ativo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 1)`,
            [
                id_usuario, nome, id_raca, sexo, idade, temperamento,
                porte, pelagem, descricao, vacinas, castrado, foto_url,
                valor_apadrinhamento, observacao || null
            ]
        );
        
        await connection.commit();
        
        res.status(201).json({
            message: 'Cão cadastrado com sucesso!',
            id_cao: result.insertId
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao criar cão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

// Listar todos os cães (com filtros)
exports.findAll = async (req, res) => {
    try {
        const { porte, sexo, idade, temperamento, castrado } = req.query;
        
        let query = `
            SELECT c.*, r.nome as raca_nome, 
                   u.nome as responsavel_nome, u.sobrenome as responsavel_sobrenome
            FROM cao c
            INNER JOIN raca r ON c.id_raca = r.id_raca
            INNER JOIN usuario u ON c.id_usuario = u.id_usuario
            WHERE c.ativo = 1
        `;
        
        const params = [];
        
        // Aplicar filtros
        if (porte) {
            query += ' AND c.porte = ?';
            params.push(porte);
        }
        if (sexo) {
            query += ' AND c.sexo = ?';
            params.push(sexo);
        }
        if (idade) {
            query += ' AND c.idade = ?';
            params.push(idade);
        }
        if (temperamento) {
            query += ' AND c.temperamento = ?';
            params.push(temperamento);
        }
        if (castrado !== undefined) {
            query += ' AND c.castrado = ?';
            params.push(castrado);
        }
        
        query += ' ORDER BY c.data_cadastro DESC';
        
        const [caes] = await db.execute(query, params);
        
        res.json(caes);
        
    } catch (error) {
        console.error('Erro ao buscar cães:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Buscar cão por ID
exports.findOne = async (req, res) => {
    try {
        const { id } = req.params;
        
        const [caes] = await db.execute(
            `SELECT c.*, r.nome as raca_nome, 
                    u.nome as responsavel_nome, u.sobrenome as responsavel_sobrenome
             FROM cao c
             INNER JOIN raca r ON c.id_raca = r.id_raca
             INNER JOIN usuario u ON c.id_usuario = u.id_usuario
             WHERE c.id_cao = ? AND c.ativo = 1`,
            [id]
        );
        
        if (caes.length === 0) {
            return res.status(404).json({ error: 'Cão não encontrado' });
        }
        
        // Buscar histórico de vacinas
        const [vacinas] = await db.execute(
            `SELECT cv.*, v.nome as vacina_nome, v.descricao
             FROM cao_vacina cv
             INNER JOIN vacina v ON cv.id_vacina = v.id_vacina
             WHERE cv.id_cao = ?
             ORDER BY cv.data DESC`,
            [id]
        );
        
        const cao = {
            ...caes[0],
            vacinas: vacinas
        };
        
        res.json(cao);
        
    } catch (error) {
        console.error('Erro ao buscar cão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Atualizar cão
exports.update = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const {
            nome, id_raca, sexo, idade, temperamento, 
            porte, pelagem, descricao, vacinas, castrado, 
            valor_apadrinhamento, observacao, ativo
        } = req.body;
        
        // Verificar se cão existe
        const [existing] = await connection.execute(
            'SELECT * FROM cao WHERE id_cao = ?',
            [id]
        );
        
        if (existing.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Cão não encontrado' });
        }
        
        // Processar upload de nova foto, se fornecida
        let foto_url = existing[0].foto_url;
        if (req.file) {
            // Remover foto antiga se existir
            if (foto_url && foto_url.startsWith('/uploads/')) {
                const oldPath = path.join(__dirname, '..', '..', 'public', foto_url);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            foto_url = `/uploads/caes/${req.file.filename}`;
        }
        
        // Atualizar cão
        await connection.execute(
            `UPDATE cao SET 
                nome = ?, id_raca = ?, sexo = ?, idade = ?, temperamento = ?,
                porte = ?, pelagem = ?, descricao = ?, vacinas = ?, castrado = ?,
                foto_url = ?, valor_apadrinhamento = ?, observacao = ?, 
                ativo = ?, updatedAt = CURDATE()
             WHERE id_cao = ?`,
            [
                nome || existing[0].nome,
                id_raca || existing[0].id_raca,
                sexo || existing[0].sexo,
                idade || existing[0].idade,
                temperamento || existing[0].temperamento,
                porte || existing[0].porte,
                pelagem || existing[0].pelagem,
                descricao || existing[0].descricao,
                vacinas || existing[0].vacinas,
                castrado !== undefined ? castrado : existing[0].castrado,
                foto_url,
                valor_apadrinhamento || existing[0].valor_apadrinhamento,
                observacao || existing[0].observacao,
                ativo !== undefined ? ativo : existing[0].ativo,
                id
            ]
        );
        
        await connection.commit();
        
        res.json({ message: 'Cão atualizado com sucesso!' });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao atualizar cão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

// Excluir cão (soft delete)
exports.delete = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar se cão existe
        const [existing] = await db.execute(
            'SELECT * FROM cao WHERE id_cao = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({ error: 'Cão não encontrado' });
        }
        
        // Soft delete (marcar como inativo)
        await db.execute(
            'UPDATE cao SET ativo = 0, updatedAt = CURDATE() WHERE id_cao = ?',
            [id]
        );
        
        res.json({ message: 'Cão removido com sucesso!' });
        
    } catch (error) {
        console.error('Erro ao remover cão:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};

// Adicionar vacina ao cão
exports.addVacina = async (req, res) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { id } = req.params;
        const { id_vacina, data, proxima_dose, observacao } = req.body;
        
        // Validar campos
        if (!id_vacina || !data) {
            return res.status(400).json({ 
                error: 'ID da vacina e data são obrigatórios' 
            });
        }
        
        // Verificar se cão existe
        const [cao] = await connection.execute(
            'SELECT id_cao FROM cao WHERE id_cao = ? AND ativo = 1',
            [id]
        );
        
        if (cao.length === 0) {
            await connection.rollback();
            return res.status(404).json({ error: 'Cão não encontrado' });
        }
        
        // Inserir vacina
        const [result] = await connection.execute(
            `INSERT INTO cao_vacina (id_vacina, id_cao, data, proxima_dose, observacao)
             VALUES (?, ?, ?, ?, ?)`,
            [id_vacina, id, data, proxima_dose || null, observacao || null]
        );
        
        await connection.commit();
        
        res.status(201).json({
            message: 'Vacina registrada com sucesso!',
            id: result.insertId
        });
        
    } catch (error) {
        await connection.rollback();
        console.error('Erro ao adicionar vacina:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    } finally {
        connection.release();
    }
};

// Buscar cães para adoção
exports.findForAdoption = async (req, res) => {
    try {
        const [caes] = await db.execute(
            `SELECT c.*, r.nome as raca_nome
             FROM cao c
             INNER JOIN raca r ON c.id_raca = r.id_raca
             WHERE c.ativo = 1 
             AND c.id_cao NOT IN (
                 SELECT ac.cao_id_cao 
                 FROM adota_cao ac 
                 INNER JOIN adotar a ON ac.id_adotar = a.id_adotar
                 WHERE ac.status_adocao = 1
             )
             ORDER BY c.data_cadastro DESC`
        );
        
        res.json(caes);
        
    } catch (error) {
        console.error('Erro ao buscar cães para adoção:', error);
        res.status(500).json({ error: 'Erro interno do servidor' });
    }
};