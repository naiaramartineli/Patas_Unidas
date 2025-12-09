const db = require('../config/db');

class Vacina {
    
    // Criar nova vacina
    static async create(vacinaData) {
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
            
            // Inserir vacina
            const [result] = await connection.execute(
                `INSERT INTO vacina 
                 (nome, descricao, idade_recomendada, dose_unica, 
                  qtd_doses, intervalo_dose, intervalo_reforco)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    vacinaData.nome,
                    vacinaData.descricao,
                    vacinaData.idade_recomendada,
                    vacinaData.dose_unica,
                    vacinaData.qtd_doses || null,
                    vacinaData.intervalo_dose || null,
                    vacinaData.intervalo_reforco
                ]
            );
            
            await connection.commit();
            
            return {
                id_vacina: result.insertId,
                ...vacinaData
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Buscar todas as vacinas
    static async findAll() {
        try {
            const [vacinas] = await db.execute(
                'SELECT * FROM vacina ORDER BY nome'
            );
            
            return vacinas.map(vacina => ({
                id_vacina: vacina.id_vacina,
                nome: vacina.nome,
                descricao: vacina.descricao,
                idade_recomendada: vacina.idade_recomendada,
                dose_unica: vacina.dose_unica,
                qtd_doses: vacina.qtd_doses,
                intervalo_dose: vacina.intervalo_dose,
                intervalo_reforco: vacina.intervalo_reforco
            }));
        } catch (error) {
            console.error('Erro ao buscar vacinas:', error);
            throw error;
        }
    }
    
    // Buscar vacina por ID
    static async findById(id_vacina) {
        try {
            const [vacinas] = await db.execute(
                'SELECT * FROM vacina WHERE id_vacina = ?',
                [id_vacina]
            );
            
            if (vacinas.length === 0) return null;
            
            return {
                id_vacina: vacinas[0].id_vacina,
                nome: vacinas[0].nome,
                descricao: vacinas[0].descricao,
                idade_recomendada: vacinas[0].idade_recomendada,
                dose_unica: vacinas[0].dose_unica,
                qtd_doses: vacinas[0].qtd_doses,
                intervalo_dose: vacinas[0].intervalo_dose,
                intervalo_reforco: vacinas[0].intervalo_reforco
            };
        } catch (error) {
            console.error('Erro ao buscar vacina por ID:', error);
            throw error;
        }
    }
    
    // Atualizar vacina
    static async update(id_vacina, vacinaData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se vacina existe
            const [existing] = await connection.execute(
                'SELECT id_vacina FROM vacina WHERE id_vacina = ?',
                [id_vacina]
            );
            
            if (existing.length === 0) {
                throw new Error('Vacina não encontrada');
            }
            
            // Verificar se novo nome já existe
            if (vacinaData.nome) {
                const [duplicate] = await connection.execute(
                    'SELECT id_vacina FROM vacina WHERE nome = ? AND id_vacina != ?',
                    [vacinaData.nome, id_vacina]
                );
                
                if (duplicate.length > 0) {
                    throw new Error('Já existe uma vacina com este nome');
                }
            }
            
            // Atualizar vacina
            await connection.execute(
                `UPDATE vacina SET
                 nome = ?, descricao = ?, idade_recomendada = ?,
                 dose_unica = ?, qtd_doses = ?, intervalo_dose = ?,
                 intervalo_reforco = ?
                 WHERE id_vacina = ?`,
                [
                    vacinaData.nome,
                    vacinaData.descricao,
                    vacinaData.idade_recomendada,
                    vacinaData.dose_unica,
                    vacinaData.qtd_doses || null,
                    vacinaData.intervalo_dose || null,
                    vacinaData.intervalo_reforco,
                    id_vacina
                ]
            );
            
            await connection.commit();
            
            return {
                id_vacina,
                ...vacinaData
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Excluir vacina
    static async delete(id_vacina) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se há registros de vacinação usando esta vacina
            const [registros] = await connection.execute(
                'SELECT id FROM cao_vacina WHERE id_vacina = ?',
                [id_vacina]
            );
            
            if (registros.length > 0) {
                throw new Error('Não é possível excluir esta vacina pois existem registros de vacinação associados');
            }
            
            // Excluir vacina
            await connection.execute(
                'DELETE FROM vacina WHERE id_vacina = ?',
                [id_vacina]
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
    
    // Buscar vacinas por tipo/categoria
    static async findByCategory(categoria) {
        try {
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
            
            return vacinas.map(vacina => ({
                id_vacina: vacina.id_vacina,
                nome: vacina.nome,
                descricao: vacina.descricao,
                idade_recomendada: vacina.idade_recomendada,
                dose_unica: vacina.dose_unica,
                qtd_doses: vacina.qtd_doses,
                intervalo_dose: vacina.intervalo_dose,
                intervalo_reforco: vacina.intervalo_reforco
            }));
        } catch (error) {
            console.error('Erro ao buscar vacinas por categoria:', error);
            throw error;
        }
    }
    
    // Buscar vacinas recomendadas por idade
    static async findByAge(idade) {
        try {
            const [vacinas] = await db.execute(
                `SELECT * FROM vacina 
                 WHERE idade_recomendada LIKE ? 
                 ORDER BY nome`,
                [`%${idade}%`]
            );
            
            return vacinas.map(vacina => ({
                id_vacina: vacina.id_vacina,
                nome: vacina.nome,
                descricao: vacina.descricao,
                idade_recomendada: vacina.idade_recomendada,
                dose_unica: vacina.dose_unica,
                qtd_doses: vacina.qtd_doses,
                intervalo_dose: vacina.intervalo_dose,
                intervalo_reforco: vacina.intervalo_reforco
            }));
        } catch (error) {
            console.error('Erro ao buscar vacinas por idade:', error);
            throw error;
        }
    }
    
    // Buscar estatísticas
    static async getStats() {
        try {
            const query = `
                SELECT 
                    (SELECT COUNT(*) FROM vacina) as total_vacinas,
                    (SELECT COUNT(*) FROM vacina WHERE dose_unica = 1) as total_dose_unica,
                    (SELECT COUNT(DISTINCT cv.id_cao) FROM cao_vacina cv) as caes_vacinados,
                    (SELECT COUNT(*) FROM cao_vacina) as total_aplicacoes
            `;
            
            const [stats] = await db.execute(query);
            return stats[0] || {};
        } catch (error) {
            console.error('Erro ao buscar estatísticas de vacinas:', error);
            throw error;
        }
    }
    
    // Buscar vacinas com contagem de aplicações
    static async findAllWithApplicationCount() {
        try {
            const query = `
                SELECT v.*, COUNT(cv.id) as total_aplicacoes
                FROM vacina v
                LEFT JOIN cao_vacina cv ON v.id_vacina = cv.id_vacina
                GROUP BY v.id_vacina
                ORDER BY v.nome
            `;
            
            const [vacinas] = await db.execute(query);
            return vacinas;
        } catch (error) {
            console.error('Erro ao buscar vacinas com contagem:', error);
            throw error;
        }
    }
}

module.exports = Vacina;