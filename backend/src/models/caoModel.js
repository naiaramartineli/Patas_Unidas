const db = require('../config/db');

class Cao {
    
    // Criar novo cão
    static async create(caoData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Inserir cão
            const [result] = await connection.execute(
                `INSERT INTO cao (
                    id_usuario, nome, id_raca, sexo, idade, temperamento,
                    porte, pelagem, descricao, vacinas, castrado, foto_url,
                    valor_apadrinhamento, observacao, data_cadastro, ativo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 1)`,
                [
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
                ]
            );
            
            await connection.commit();
            
            return {
                id_cao: result.insertId,
                nome: caoData.nome,
                id_usuario: caoData.id_usuario,
                data_cadastro: new Date().toISOString().split('T')[0]
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar todos os cães com filtros
    static async findAll(filters = {}) {
        try {
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
            
            return caes.map(cao => ({
                id_cao: cao.id_cao,
                nome: cao.nome,
                id_raca: cao.id_raca,
                raca_nome: cao.raca_nome,
                sexo: cao.sexo,
                idade: cao.idade,
                temperamento: cao.temperamento,
                porte: cao.porte,
                pelagem: cao.pelagem,
                descricao: cao.descricao,
                vacinas: cao.vacinas,
                castrado: cao.castrado,
                foto_url: cao.foto_url,
                valor_apadrinhamento: cao.valor_apadrinhamento,
                observacao: cao.observacao,
                data_cadastro: cao.data_cadastro,
                updatedAt: cao.updatedAt,
                ativo: cao.ativo,
                responsavel_nome: cao.responsavel_nome,
                responsavel_sobrenome: cao.responsavel_sobrenome
            }));
            
        } catch (error) {
            console.error('Erro ao buscar cães:', error);
            throw error;
        }
    }
    
    // Buscar cão por ID
    static async findById(id_cao) {
        try {
            const [caes] = await db.execute(
                `SELECT c.*, r.nome as raca_nome, 
                       u.nome as responsavel_nome, u.sobrenome as responsavel_sobrenome,
                       u.email as responsavel_email
                FROM cao c
                INNER JOIN raca r ON c.id_raca = r.id_raca
                INNER JOIN usuario u ON c.id_usuario = u.id_usuario
                WHERE c.id_cao = ? AND c.ativo = 1`,
                [id_cao]
            );
            
            if (caes.length === 0) return null;
            
            const cao = caes[0];
            return {
                id_cao: cao.id_cao,
                nome: cao.nome,
                id_raca: cao.id_raca,
                raca_nome: cao.raca_nome,
                sexo: cao.sexo,
                idade: cao.idade,
                temperamento: cao.temperamento,
                porte: cao.porte,
                pelagem: cao.pelagem,
                descricao: cao.descricao,
                vacinas: cao.vacinas,
                castrado: cao.castrado,
                foto_url: cao.foto_url,
                valor_apadrinhamento: cao.valor_apadrinhamento,
                observacao: cao.observacao,
                data_cadastro: cao.data_cadastro,
                updatedAt: cao.updatedAt,
                ativo: cao.ativo,
                id_usuario: cao.id_usuario,
                responsavel_nome: cao.responsavel_nome,
                responsavel_sobrenome: cao.responsavel_sobrenome,
                responsavel_email: cao.responsavel_email
            };
        } catch (error) {
            console.error('Erro ao buscar cão por ID:', error);
            throw error;
        }
    }
    
    // Atualizar cão
    static async update(id_cao, caoData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Buscar dados atuais
            const [current] = await connection.execute(
                'SELECT * FROM cao WHERE id_cao = ?',
                [id_cao]
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
            
            // Atualizar cão
            await connection.execute(
                `UPDATE cao SET 
                    nome = ?, id_raca = ?, sexo = ?, idade = ?, temperamento = ?,
                    porte = ?, pelagem = ?, descricao = ?, vacinas = ?, castrado = ?,
                    foto_url = ?, valor_apadrinhamento = ?, observacao = ?, 
                    ativo = ?, updatedAt = CURDATE()
                WHERE id_cao = ?`,
                [
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
                    id_cao
                ]
            );
            
            await connection.commit();
            
            return {
                id_cao,
                ...updateData
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Excluir cão (soft delete)
    static async delete(id_cao) {
        try {
            const [result] = await db.execute(
                'UPDATE cao SET ativo = 0, updatedAt = CURDATE() WHERE id_cao = ?',
                [id_cao]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erro ao excluir cão:', error);
            throw error;
        }
    }
    
    // Buscar cães para adoção
    static async findForAdoption() {
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
            
            return caes.map(cao => ({
                id_cao: cao.id_cao,
                nome: cao.nome,
                id_raca: cao.id_raca,
                raca_nome: cao.raca_nome,
                sexo: cao.sexo,
                idade: cao.idade,
                temperamento: cao.temperamento,
                porte: cao.porte,
                pelagem: cao.pelagem,
                descricao: cao.descricao,
                vacinas: cao.vacinas,
                castrado: cao.castrado,
                foto_url: cao.foto_url,
                valor_apadrinhamento: cao.valor_apadrinhamento,
                data_cadastro: cao.data_cadastro
            }));
        } catch (error) {
            console.error('Erro ao buscar cães para adoção:', error);
            throw error;
        }
    }
    
    // Buscar vacinas do cão
    static async findVacinas(id_cao) {
        try {
            const [vacinas] = await db.execute(
                `SELECT cv.*, v.nome as vacina_nome, v.descricao
                FROM cao_vacina cv
                INNER JOIN vacina v ON cv.id_vacina = v.id_vacina
                WHERE cv.id_cao = ?
                ORDER BY cv.data DESC`,
                [id_cao]
            );
            
            return vacinas.map(vacina => ({
                id: vacina.id,
                id_vacina: vacina.id_vacina,
                id_cao: vacina.id_cao,
                vacina_nome: vacina.vacina_nome,
                descricao: vacina.descricao,
                data: vacina.data,
                proxima_dose: vacina.proxima_dose,
                observacao: vacina.observacao
            }));
        } catch (error) {
            console.error('Erro ao buscar vacinas do cão:', error);
            throw error;
        }
    }
    
    // Adicionar vacina ao cão
    static async addVacina(vacinaData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Inserir vacina
            const [result] = await connection.execute(
                `INSERT INTO cao_vacina (id_vacina, id_cao, data, proxima_dose, observacao)
                VALUES (?, ?, ?, ?, ?)`,
                [
                    vacinaData.id_vacina,
                    vacinaData.id_cao,
                    vacinaData.data,
                    vacinaData.proxima_dose || null,
                    vacinaData.observacao || null
                ]
            );
            
            await connection.commit();
            
            return {
                id: result.insertId,
                ...vacinaData
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar estatísticas
    static async getStats() {
        try {
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
        } catch (error) {
            console.error('Erro ao buscar estatísticas de cães:', error);
            throw error;
        }
    }
    
    // Buscar cães por responsável
    static async findByResponsavel(id_usuario) {
        try {
            const [caes] = await db.execute(
                `SELECT c.*, r.nome as raca_nome
                FROM cao c
                INNER JOIN raca r ON c.id_raca = r.id_raca
                WHERE c.id_usuario = ? AND c.ativo = 1
                ORDER BY c.data_cadastro DESC`,
                [id_usuario]
            );
            
            return caes.map(cao => ({
                id_cao: cao.id_cao,
                nome: cao.nome,
                raca_nome: cao.raca_nome,
                sexo: cao.sexo,
                idade: cao.idade,
                porte: cao.porte,
                castrado: cao.castrado,
                foto_url: cao.foto_url,
                data_cadastro: cao.data_cadastro
            }));
        } catch (error) {
            console.error('Erro ao buscar cães por responsável:', error);
            throw error;
        }
    }
    
    // Buscar cães disponíveis para apadrinhamento
    static async findForSponsorship() {
        try {
            const [caes] = await db.execute(
                `SELECT c.*, r.nome as raca_nome
                FROM cao c
                INNER JOIN raca r ON c.id_raca = r.id_raca
                WHERE c.ativo = 1 AND c.valor_apadrinhamento > 0
                ORDER BY c.data_cadastro DESC`
            );
            
            return caes.map(cao => ({
                id_cao: cao.id_cao,
                nome: cao.nome,
                raca_nome: cao.raca_nome,
                sexo: cao.sexo,
                idade: cao.idade,
                porte: cao.porte,
                foto_url: cao.foto_url,
                valor_apadrinhamento: cao.valor_apadrinhamento,
                descricao: cao.descricao
            }));
        } catch (error) {
            console.error('Erro ao buscar cães para apadrinhamento:', error);
            throw error;
        }
    }
}

module.exports = Cao;