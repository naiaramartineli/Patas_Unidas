const db = require('../config/db');

class Endereco {
    
    // Buscar endereço por ID
    static async findById(id_endereco) {
        try {
            const [enderecos] = await db.execute(
                'SELECT * FROM endereco WHERE id_endereco = ?',
                [id_endereco]
            );
            
            if (enderecos.length === 0) return null;
            
            return {
                id_endereco: enderecos[0].id_endereco,
                logradouro: enderecos[0].logradouro,
                bairro: enderecos[0].bairro,
                numero: enderecos[0].numero,
                complemento: enderecos[0].complemento,
                cidade: enderecos[0].cidade,
                uf: enderecos[0].uf,
                cep: enderecos[0].cep,
                endereco_completo: `${enderecos[0].logradouro}, ${enderecos[0].numero} - ${enderecos[0].bairro}, ${enderecos[0].cidade} - ${enderecos[0].uf}`
            };
        } catch (error) {
            console.error('Erro ao buscar endereço por ID:', error);
            throw error;
        }
    }
    
    // Buscar endereços por CEP
    static async findByCep(cep) {
        try {
            const cepFormatado = cep.replace(/[^\d]/g, '');
            const [enderecos] = await db.execute(
                'SELECT * FROM endereco WHERE cep = ?',
                [cepFormatado]
            );
            
            return enderecos.map(endereco => ({
                id_endereco: endereco.id_endereco,
                logradouro: endereco.logradouro,
                bairro: endereco.bairro,
                numero: endereco.numero,
                complemento: endereco.complemento,
                cidade: endereco.cidade,
                uf: endereco.uf,
                cep: endereco.cep
            }));
        } catch (error) {
            console.error('Erro ao buscar endereço por CEP:', error);
            throw error;
        }
    }
    
    // Buscar endereços por cidade
    static async findByCity(cidade, uf, limit = 50) {
        try {
            const [enderecos] = await db.execute(
                'SELECT * FROM endereco WHERE cidade LIKE ? AND uf = ? LIMIT ?',
                [`%${cidade}%`, uf, parseInt(limit)]
            );
            
            return enderecos.map(endereco => ({
                id_endereco: endereco.id_endereco,
                logradouro: endereco.logradouro,
                bairro: endereco.bairro,
                numero: endereco.numero,
                complemento: endereco.complemento,
                cidade: endereco.cidade,
                uf: endereco.uf,
                cep: endereco.cep
            }));
        } catch (error) {
            console.error('Erro ao buscar endereço por cidade:', error);
            throw error;
        }
    }
    
    // Buscar endereços por bairro
    static async findByNeighborhood(bairro, cidade, uf, limit = 100) {
        try {
            const [enderecos] = await db.execute(
                `SELECT * FROM endereco 
                 WHERE bairro LIKE ? 
                   AND cidade LIKE ? 
                   AND uf = ?
                 ORDER BY logradouro
                 LIMIT ?`,
                [`%${bairro}%`, `%${cidade}%`, uf, limit]
            );
            
            return enderecos.map(endereco => ({
                id_endereco: endereco.id_endereco,
                logradouro: endereco.logradouro,
                bairro: endereco.bairro,
                numero: endereco.numero,
                complemento: endereco.complemento,
                cidade: endereco.cidade,
                uf: endereco.uf,
                cep: endereco.cep
            }));
        } catch (error) {
            console.error('Erro ao buscar endereço por bairro:', error);
            throw error;
        }
    }
    
    // Criar endereço
    static async create(enderecoData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Validar e formatar dados
            const cepFormatado = enderecoData.cep.replace(/[^\d]/g, '');
            const ufFormatada = enderecoData.uf.toUpperCase();
            
            // Validar CEP
            if (cepFormatado.length !== 8) {
                throw new Error('CEP inválido. Deve conter 8 dígitos.');
            }
            
            // Validar UF
            const ufValida = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
            
            if (!ufValida.includes(ufFormatada)) {
                throw new Error('UF inválida');
            }
            
            // Inserir endereço
            const [result] = await connection.execute(
                `INSERT INTO endereco 
                 (logradouro, bairro, numero, complemento, cidade, uf, cep)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    enderecoData.logradouro,
                    enderecoData.bairro,
                    enderecoData.numero,
                    enderecoData.complemento || null,
                    enderecoData.cidade,
                    ufFormatada,
                    cepFormatado
                ]
            );
            
            await connection.commit();
            
            return {
                id_endereco: result.insertId,
                logradouro: enderecoData.logradouro,
                bairro: enderecoData.bairro,
                numero: enderecoData.numero,
                complemento: enderecoData.complemento,
                cidade: enderecoData.cidade,
                uf: ufFormatada,
                cep: cepFormatado
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Atualizar endereço
    static async update(id_endereco, enderecoData) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se endereço existe
            const [existing] = await connection.execute(
                'SELECT * FROM endereco WHERE id_endereco = ?',
                [id_endereco]
            );
            
            if (existing.length === 0) {
                throw new Error('Endereço não encontrado');
            }
            
            // Validar e formatar dados
            const cepFormatado = enderecoData.cep.replace(/[^\d]/g, '');
            const ufFormatada = enderecoData.uf.toUpperCase();
            
            // Validar CEP
            if (cepFormatado.length !== 8) {
                throw new Error('CEP inválido. Deve conter 8 dígitos.');
            }
            
            // Validar UF
            const ufValida = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
                            'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
                            'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'];
            
            if (!ufValida.includes(ufFormatada)) {
                throw new Error('UF inválida');
            }
            
            // Atualizar endereço
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
                    ufFormatada,
                    cepFormatado,
                    id_endereco
                ]
            );
            
            await connection.commit();
            
            return {
                id_endereco,
                logradouro: enderecoData.logradouro,
                bairro: enderecoData.bairro,
                numero: enderecoData.numero,
                complemento: enderecoData.complemento,
                cidade: enderecoData.cidade,
                uf: ufFormatada,
                cep: cepFormatado
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
    
    // Excluir endereço
    static async delete(id_endereco) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Verificar se endereço existe
            const [existing] = await connection.execute(
                'SELECT * FROM endereco WHERE id_endereco = ?',
                [id_endereco]
            );
            
            if (existing.length === 0) {
                throw new Error('Endereço não encontrado');
            }
            
            // Verificar se há usuários usando este endereço
            const [usuarios] = await connection.execute(
                'SELECT id_usuario FROM usuario WHERE id_endereco = ? AND atividade = 1',
                [id_endereco]
            );
            
            if (usuarios.length > 0) {
                throw new Error('Não é possível excluir este endereço pois existem usuários vinculados a ele');
            }
            
            // Excluir endereço
            await connection.execute(
                'DELETE FROM endereco WHERE id_endereco = ?',
                [id_endereco]
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
    
    // Buscar endereço por usuário
    static async findByUserId(id_usuario) {
        try {
            const [enderecos] = await db.execute(
                `SELECT e.* 
                 FROM usuario u
                 JOIN endereco e ON u.id_endereco = e.id_endereco
                 WHERE u.id_usuario = ? AND u.atividade = 1`,
                [id_usuario]
            );
            
            if (enderecos.length === 0) return null;
            
            const endereco = enderecos[0];
            return {
                id_endereco: endereco.id_endereco,
                logradouro: endereco.logradouro,
                bairro: endereco.bairro,
                numero: endereco.numero,
                complemento: endereco.complemento,
                cidade: endereco.cidade,
                uf: endereco.uf,
                cep: endereco.cep,
                endereco_completo: `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade} - ${endereco.uf}`
            };
        } catch (error) {
            console.error('Erro ao buscar endereço por usuário:', error);
            throw error;
        }
    }
    
    // Buscar usuários por endereço (apenas para ADM)
    static async findUsersByAddressId(id_endereco) {
        try {
            const [usuarios] = await db.execute(
                `SELECT u.*, p.nome as permissao_nome
                 FROM usuario u
                 JOIN permissoes p ON u.id_permissao = p.id_permissao
                 WHERE u.id_endereco = ? AND u.atividade = 1`,
                [id_endereco]
            );
            
            return usuarios.map(usuario => ({
                id_usuario: usuario.id_usuario,
                nome: usuario.nome,
                sobrenome: usuario.sobrenome,
                nome_social: usuario.nome_social,
                email: usuario.email,
                permissao_nome: usuario.permissao_nome,
                data_nasc: usuario.data_nasc
            }));
        } catch (error) {
            console.error('Erro ao buscar usuários por endereço:', error);
            throw error;
        }
    }
    
    // Buscar estatísticas
    static async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(DISTINCT cidade) as total_cidades,
                    COUNT(DISTINCT uf) as total_estados,
                    uf,
                    COUNT(*) as total_por_estado
                FROM endereco
                GROUP BY uf
                ORDER BY total_por_estado DESC
            `;
            
            const [stats] = await db.execute(query);
            
            // Calcular total geral
            const totalGeral = stats.reduce((sum, item) => sum + item.total_por_estado, 0);
            
            return {
                total_enderecos: totalGeral,
                total_cidades: stats[0]?.total_cidades || 0,
                total_estados: stats[0]?.total_estados || 0,
                distribuicao_por_estado: stats.map(item => ({
                    uf: item.uf,
                    total: item.total_por_estado,
                    porcentagem: totalGeral > 0 ? ((item.total_por_estado / totalGeral) * 100).toFixed(2) : '0.00'
                }))
            };
        } catch (error) {
            console.error('Erro ao buscar estatísticas de endereços:', error);
            throw error;
        }
    }
    
    // Verificar se endereço existe
    static async exists(id_endereco) {
        try {
            const [result] = await db.execute(
                'SELECT 1 FROM endereco WHERE id_endereco = ?',
                [id_endereco]
            );
            return result.length > 0;
        } catch (error) {
            console.error('Erro ao verificar se endereço existe:', error);
            throw error;
        }
    }
    
    // Buscar todos os endereços (com paginação - apenas para ADM)
    static async findAll(page = 1, limit = 50) {
        try {
            const offset = (page - 1) * limit;
            
            const [enderecos] = await db.execute(
                `SELECT * FROM endereco 
                 ORDER BY cidade, bairro, logradouro
                 LIMIT ? OFFSET ?`,
                [parseInt(limit), parseInt(offset)]
            );
            
            // Contar total
            const [countResult] = await db.execute('SELECT COUNT(*) as total FROM endereco');
            const total = countResult[0].total;
            
            return {
                enderecos: enderecos.map(endereco => ({
                    id_endereco: endereco.id_endereco,
                    logradouro: endereco.logradouro,
                    bairro: endereco.bairro,
                    numero: endereco.numero,
                    complemento: endereco.complemento,
                    cidade: endereco.cidade,
                    uf: endereco.uf,
                    cep: endereco.cep,
                    endereco_completo: `${endereco.logradouro}, ${endereco.numero} - ${endereco.bairro}, ${endereco.cidade} - ${endereco.uf}`
                })),
                paginacao: {
                    pagina_atual: parseInt(page),
                    total_paginas: Math.ceil(total / limit),
                    total_registros: total,
                    limite: parseInt(limit)
                }
            };
        } catch (error) {
            console.error('Erro ao buscar todos os endereços:', error);
            throw error;
        }
    }
    
    // Buscar endereço por logradouro (para autocomplete)
    static async searchByStreet(logradouro, limit = 20) {
        try {
            const [enderecos] = await db.execute(
                `SELECT DISTINCT logradouro, bairro, cidade, uf
                 FROM endereco 
                 WHERE logradouro LIKE ?
                 ORDER BY logradouro
                 LIMIT ?`,
                [`%${logradouro}%`, limit]
            );
            
            return enderecos;
        } catch (error) {
            console.error('Erro ao buscar endereço por logradouro:', error);
            throw error;
        }
    }
    
    // Buscar cidades por UF
    static async getCitiesByState(uf) {
        try {
            const [cidades] = await db.execute(
                `SELECT DISTINCT cidade 
                 FROM endereco 
                 WHERE uf = ?
                 ORDER BY cidade`,
                [uf]
            );
            
            return cidades.map(item => item.cidade);
        } catch (error) {
            console.error('Erro ao buscar cidades por UF:', error);
            throw error;
        }
    }
    
    // Buscar bairros por cidade
    static async getNeighborhoodsByCity(cidade, uf) {
        try {
            const [bairros] = await db.execute(
                `SELECT DISTINCT bairro 
                 FROM endereco 
                 WHERE cidade = ? AND uf = ?
                 ORDER BY bairro`,
                [cidade, uf]
            );
            
            return bairros.map(item => item.bairro);
        } catch (error) {
            console.error('Erro ao buscar bairros por cidade:', error);
            throw error;
        }
    }
}

module.exports = Endereco;