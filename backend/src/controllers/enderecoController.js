const Endereco = require('../models/enderecoModel');

// Buscar endereço por ID (apenas para ADM)
exports.getAddressById = async (req, res) => {
    try {
        const { id_endereco } = req.params;
        
        const endereco = await Endereco.findById(id_endereco);
        
        if (!endereco) {
            return res.status(404).json({
                success: false,
                error: 'Endereço não encontrado',
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: endereco
        });
        
    } catch (error) {
        console.error('Erro ao buscar endereço por ID:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereço',
            code: 'ADDRESS_FETCH_ERROR'
        });
    }
};

// Buscar endereço do usuário autenticado
exports.getMyAddress = async (req, res) => {
    try {
        const id_usuario = req.user.id_usuario;
        
        const endereco = await Endereco.findByUserId(id_usuario);
        
        if (!endereco) {
            return res.status(404).json({
                success: false,
                error: 'Endereço não encontrado',
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: endereco
        });
        
    } catch (error) {
        console.error('Erro ao buscar endereço do usuário:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereço',
            code: 'ADDRESS_FETCH_ERROR'
        });
    }
};

// Buscar endereços por CEP
exports.getAddressByCep = async (req, res) => {
    try {
        const { cep } = req.params;
        
        if (!cep) {
            return res.status(400).json({
                success: false,
                error: 'CEP é obrigatório',
                code: 'CEP_REQUIRED'
            });
        }
        
        const enderecos = await Endereco.findByCep(cep);
        
        if (enderecos.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Nenhum endereço encontrado para este CEP',
                code: 'NO_ADDRESS_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: enderecos
        });
        
    } catch (error) {
        console.error('Erro ao buscar endereços por CEP:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereços',
            code: 'CEP_SEARCH_ERROR'
        });
    }
};

// Buscar endereços por cidade
exports.getAddressesByCity = async (req, res) => {
    try {
        const { cidade, uf } = req.params;
        const { limit } = req.query;
        
        if (!cidade || !uf) {
            return res.status(400).json({
                success: false,
                error: 'Cidade e UF são obrigatórios',
                code: 'CITY_UF_REQUIRED'
            });
        }
        
        const enderecos = await Endereco.findByCity(
            cidade, 
            uf.toUpperCase(), 
            parseInt(limit) || 50
        );
        
        if (enderecos.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Nenhum endereço encontrado para esta cidade',
                code: 'NO_ADDRESS_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: enderecos
        });
        
    } catch (error) {
        console.error('Erro ao buscar endereços por cidade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereços',
            code: 'CITY_SEARCH_ERROR'
        });
    }
};

// Buscar endereços por bairro
exports.getAddressesByNeighborhood = async (req, res) => {
    try {
        const { bairro, cidade, uf } = req.params;
        const { limit } = req.query;
        
        if (!bairro || !cidade || !uf) {
            return res.status(400).json({
                success: false,
                error: 'Bairro, cidade e UF são obrigatórios',
                code: 'NEIGHBORHOOD_REQUIRED'
            });
        }
        
        const enderecos = await Endereco.findByNeighborhood(
            bairro,
            cidade,
            uf.toUpperCase(),
            parseInt(limit) || 100
        );
        
        if (enderecos.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'Nenhum endereço encontrado para este bairro',
                code: 'NO_ADDRESS_FOUND'
            });
        }
        
        res.json({
            success: true,
            data: enderecos
        });
        
    } catch (error) {
        console.error('Erro ao buscar endereços por bairro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereços',
            code: 'NEIGHBORHOOD_SEARCH_ERROR'
        });
    }
};

// Criar endereço (para ADM ou durante cadastro)
exports.createAddress = async (req, res) => {
    try {
        const {
            logradouro, bairro, numero, complemento, cidade, uf, cep
        } = req.body;
        
        // Validar campos obrigatórios
        const requiredFields = ['logradouro', 'bairro', 'numero', 'cidade', 'uf', 'cep'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    error: `Campo obrigatório faltando: ${field}`,
                    code: 'REQUIRED_FIELD_MISSING',
                    field: field
                });
            }
        }
        
        // Preparar dados do endereço
        const enderecoData = {
            logradouro: logradouro.trim(),
            bairro: bairro.trim(),
            numero: parseInt(numero),
            complemento: complemento ? complemento.trim() : null,
            cidade: cidade.trim(),
            uf: uf.toUpperCase().trim(),
            cep: cep
        };
        
        // Criar endereço
        const endereco = await Endereco.create(enderecoData);
        
        res.status(201).json({
            success: true,
            message: 'Endereço criado com sucesso!',
            data: endereco
        });
        
    } catch (error) {
        console.error('Erro ao criar endereço:', error);
        
        if (error.message.includes('CEP inválido') || error.message.includes('UF inválida')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                code: 'INVALID_DATA'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao criar endereço',
            code: 'ADDRESS_CREATE_ERROR'
        });
    }
};

// Atualizar endereço (apenas para ADM)
exports.updateAddress = async (req, res) => {
    try {
        const { id_endereco } = req.params;
        const {
            logradouro, bairro, numero, complemento, cidade, uf, cep
        } = req.body;
        
        // Validar campos obrigatórios
        const requiredFields = ['logradouro', 'bairro', 'numero', 'cidade', 'uf', 'cep'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return res.status(400).json({
                    success: false,
                    error: `Campo obrigatório faltando: ${field}`,
                    code: 'REQUIRED_FIELD_MISSING',
                    field: field
                });
            }
        }
        
        // Preparar dados do endereço
        const enderecoData = {
            logradouro: logradouro.trim(),
            bairro: bairro.trim(),
            numero: parseInt(numero),
            complemento: complemento ? complemento.trim() : null,
            cidade: cidade.trim(),
            uf: uf.toUpperCase().trim(),
            cep: cep
        };
        
        // Atualizar endereço
        const endereco = await Endereco.update(id_endereco, enderecoData);
        
        res.json({
            success: true,
            message: 'Endereço atualizado com sucesso!',
            data: endereco
        });
        
    } catch (error) {
        console.error('Erro ao atualizar endereço:', error);
        
        if (error.message.includes('Endereço não encontrado')) {
            return res.status(404).json({
                success: false,
                error: error.message,
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        if (error.message.includes('CEP inválido') || error.message.includes('UF inválida')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                code: 'INVALID_DATA'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao atualizar endereço',
            code: 'ADDRESS_UPDATE_ERROR'
        });
    }
};

// Excluir endereço (apenas para ADM)
exports.deleteAddress = async (req, res) => {
    try {
        const { id_endereco } = req.params;
        
        const result = await Endereco.delete(id_endereco);
        
        if (!result) {
            return res.status(404).json({
                success: false,
                error: 'Endereço não encontrado',
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        res.json({
            success: true,
            message: 'Endereço excluído com sucesso!'
        });
        
    } catch (error) {
        console.error('Erro ao excluir endereço:', error);
        
        if (error.message.includes('Endereço não encontrado')) {
            return res.status(404).json({
                success: false,
                error: error.message,
                code: 'ADDRESS_NOT_FOUND'
            });
        }
        
        if (error.message.includes('usuários vinculados')) {
            return res.status(400).json({
                success: false,
                error: error.message,
                code: 'ADDRESS_IN_USE'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao excluir endereço',
            code: 'ADDRESS_DELETE_ERROR'
        });
    }
};

// Buscar usuários por endereço (apenas para ADM)
exports.getUsersByAddress = async (req, res) => {
    try {
        const { id_endereco } = req.params;
        
        const usuarios = await Endereco.findUsersByAddressId(id_endereco);
        
        res.json({
            success: true,
            data: usuarios
        });
        
    } catch (error) {
        console.error('Erro ao buscar usuários por endereço:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar usuários',
            code: 'USERS_FETCH_ERROR'
        });
    }
};

// Buscar estatísticas de endereços (apenas para ADM)
exports.getStats = async (req, res) => {
    try {
        const stats = await Endereco.getStats();
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas de endereços:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar estatísticas',
            code: 'STATS_FETCH_ERROR'
        });
    }
};

// Buscar todos os endereços (com paginação - apenas para ADM)
exports.getAllAddresses = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;
        
        const result = await Endereco.findAll(
            parseInt(page),
            parseInt(limit)
        );
        
        res.json({
            success: true,
            data: result
        });
        
    } catch (error) {
        console.error('Erro ao buscar todos os endereços:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereços',
            code: 'ADDRESSES_FETCH_ERROR'
        });
    }
};

// Buscar endereço por logradouro (autocomplete)
exports.searchByStreet = async (req, res) => {
    try {
        const { logradouro } = req.query;
        const { limit } = req.query;
        
        if (!logradouro || logradouro.length < 3) {
            return res.status(400).json({
                success: false,
                error: 'Digite pelo menos 3 caracteres para busca',
                code: 'MIN_SEARCH_LENGTH'
            });
        }
        
        const enderecos = await Endereco.searchByStreet(
            logradouro,
            parseInt(limit) || 20
        );
        
        res.json({
            success: true,
            data: enderecos
        });
        
    } catch (error) {
        console.error('Erro ao buscar endereço por logradouro:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar endereços',
            code: 'STREET_SEARCH_ERROR'
        });
    }
};

// Buscar cidades por UF
exports.getCitiesByState = async (req, res) => {
    try {
        const { uf } = req.params;
        
        if (!uf) {
            return res.status(400).json({
                success: false,
                error: 'UF é obrigatória',
                code: 'UF_REQUIRED'
            });
        }
        
        const cidades = await Endereco.getCitiesByState(uf.toUpperCase());
        
        res.json({
            success: true,
            data: cidades
        });
        
    } catch (error) {
        console.error('Erro ao buscar cidades por UF:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar cidades',
            code: 'CITIES_FETCH_ERROR'
        });
    }
};

// Buscar bairros por cidade
exports.getNeighborhoodsByCity = async (req, res) => {
    try {
        const { cidade, uf } = req.params;
        
        if (!cidade || !uf) {
            return res.status(400).json({
                success: false,
                error: 'Cidade e UF são obrigatórios',
                code: 'CITY_UF_REQUIRED'
            });
        }
        
        const bairros = await Endereco.getNeighborhoodsByCity(
            cidade,
            uf.toUpperCase()
        );
        
        res.json({
            success: true,
            data: bairros
        });
        
    } catch (error) {
        console.error('Erro ao buscar bairros por cidade:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor ao buscar bairros',
            code: 'NEIGHBORHOODS_FETCH_ERROR'
        });
    }
};