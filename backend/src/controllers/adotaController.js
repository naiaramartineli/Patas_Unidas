import AdotaModel from '../models/adotaModel.js';

/**
 * Controlador para gerenciar adoções
 */
class AdotaController {
    /**
     * Solicitar adoção de um cão
     */
    static async solicitarAdocao(req, res) {
        try {
            const id_usuario = req.user.id_usuario;
            const { id_cao, observacao } = req.body;

            // Validações
            if (!id_usuario) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Usuário não autenticado',
                    code: 'USER_NOT_AUTHENTICATED'
                });
            }

            if (!id_cao) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID do cão é obrigatório',
                    code: 'DOG_ID_REQUIRED'
                });
            }

            // Verificar se usuário pode adotar
            const verificacao = await AdotaModel.canUserAdopt(id_usuario, id_cao);
            
            if (!verificacao.pode_adotar) {
                return res.status(400).json({
                    success: false,
                    error: verificacao.motivo,
                    code: 'ADOPTION_NOT_ALLOWED'
                });
            }

            // Criar solicitação
            const resultado = await AdotaModel.create(id_usuario, id_cao, { observacao });

            res.status(201).json({
                success: true,
                message: 'Solicitação de adoção criada com sucesso!',
                data: resultado
            });

        } catch (error) {
            console.error('Erro ao solicitar adoção:', error);
            
            if (error.message.includes('não encontrado') || 
                error.message.includes('não disponível') ||
                error.message.includes('já tem uma solicitação') ||
                error.message.includes('já foi adotado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'ADOPTION_VALIDATION_ERROR'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno ao processar solicitação de adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Listar adoções do usuário autenticado
     */
    static async listarMinhasAdocoes(req, res) {
        try {
            const id_usuario = req.user.id_usuario;
            const { page = 1, limit = 10 } = req.query;

            if (!id_usuario) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Usuário não autenticado',
                    code: 'USER_NOT_AUTHENTICATED'
                });
            }

            const resultado = await AdotaModel.findByUserId(id_usuario, parseInt(page), parseInt(limit));

            // Formatar resposta
            const adocoesFormatadas = resultado.adocoes.map(adocao => ({
                id_adotar: adocao.id_adotar,
                status: adocao.status_adocao,
                status_texto: adocao.status_texto,
                motivo_recusa: adocao.motivo_recusa,
                observacao: adocao.observacao,
                data_solicitacao: adocao.data_solicitacao,
                data_aprovacao: adocao.data_aprovacao,
                ativo: adocao.ativo === 1,
                cao: {
                    id_cao: adocao.cao_id_cao,
                    nome: adocao.cao_nome,
                    foto_url: adocao.cao_foto ? `${process.env.API_URL || 'http://localhost:3001'}${adocao.cao_foto}` : null,
                    descricao: adocao.cao_descricao,
                    idade: adocao.cao_idade,
                    sexo: adocao.cao_sexo,
                    raca: adocao.raca_nome
                }
            }));

            res.json({
                success: true,
                data: {
                    adocoes: adocoesFormatadas,
                    paginacao: resultado.paginacao
                }
            });

        } catch (error) {
            console.error('Erro ao listar adoções do usuário:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar adoções',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * ADMIN: Listar todas as solicitações
     */
    static async listarSolicitacoes(req, res) {
        try {
            // Verificar se é admin
            if (req.user.id_permissao !== 1) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem listar todas as solicitações.',
                    code: 'ACCESS_DENIED_ADMIN_ONLY'
                });
            }

            const { page = 1, limit = 10, status, search, id_usuario } = req.query;
            
            const filters = {};
            if (status !== undefined) filters.status = status;
            if (search) filters.search = search;
            if (id_usuario) filters.id_usuario = id_usuario;

            const resultado = await AdotaModel.findAll(parseInt(page), parseInt(limit), filters);

            // Formatar resposta
            const adocoesFormatadas = resultado.adocoes.map(item => ({
                id_adotar: item.id_adotar,
                status: item.status_adocao,
                status_texto: item.status_texto,
                motivo_recusa: item.motivo_recusa,
                observacao: item.observacao,
                data_solicitacao: item.data_solicitacao,
                data_aprovacao: item.data_aprovacao,
                data_atualizacao: item.data_atualizacao,
                ativo: item.ativo === 1,
                usuario: {
                    id_usuario: item.id_usuario,
                    nome_completo: item.usuario_nome_completo,
                    nome_social: item.usuario_nome_social,
                    email: item.usuario_email,
                    telefone: item.usuario_telefone
                },
                cao: {
                    id_cao: item.cao_id_cao,
                    nome: item.cao_nome,
                    foto_url: item.cao_foto ? `${process.env.API_URL || 'http://localhost:3001'}${item.cao_foto}` : null,
                    idade: item.cao_idade,
                    sexo: item.cao_sexo,
                    raca: item.raca_nome
                }
            }));

            res.json({
                success: true,
                data: {
                    adocoes: adocoesFormatadas,
                    paginacao: resultado.paginacao
                }
            });

        } catch (error) {
            console.error('Erro ao listar solicitações:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao listar solicitações',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Buscar adoção por ID
     */
    static async buscarAdocao(req, res) {
        try {
            const { id } = req.params;
            const id_usuario = req.user.id_usuario;
            const isAdmin = req.user.id_permissao === 1;

            const adocao = await AdotaModel.findById(id);

            if (!adocao) {
                return res.status(404).json({
                    success: false,
                    error: 'Adoção não encontrada',
                    code: 'ADOPTION_NOT_FOUND'
                });
            }

            // Verificar permissão (usuário só pode ver suas próprias adoções, admin pode ver todas)
            if (!isAdmin && parseInt(adocao.id_usuario) !== parseInt(id_usuario)) {
                return res.status(403).json({
                    success: false,
                    error: 'Acesso negado. Você só pode visualizar suas próprias adoções.',
                    code: 'ACCESS_DENIED_OWNER_ONLY'
                });
            }

            // Formatar resposta
            const adocaoFormatada = {
                id_adotar: adocao.id_adotar,
                status: adocao.status_adocao,
                motivo_recusa: adocao.motivo_recusa,
                observacao: adocao.observacao,
                data_solicitacao: adocao.data_solicitacao,
                data_aprovacao: adocao.data_aprovacao,
                data_atualizacao: adocao.data_atualizacao,
                ativo: adocao.ativo === 1,
                usuario: {
                    id_usuario: adocao.id_usuario,
                    nome: adocao.usuario_nome,
                    sobrenome: adocao.usuario_sobrenome,
                    nome_social: adocao.usuario_nome_social,
                    email: adocao.usuario_email
                },
                cao: {
                    id_cao: adocao.cao_id_cao,
                    nome: adocao.cao_nome,
                    foto_url: adocao.cao_foto ? `${process.env.API_URL || 'http://localhost:3001'}${adocao.cao_foto}` : null,
                    descricao: adocao.cao_descricao,
                    idade: adocao.cao_idade,
                    sexo: adocao.cao_sexo,
                    raca: adocao.raca_nome
                }
            };

            res.json({
                success: true,
                data: adocaoFormatada
            });

        } catch (error) {
            console.error('Erro ao buscar adoção:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Atualizar adoção (APENAS ADMIN)
     */
    static async atualizarAdocao(req, res) {
        try {
            // Verificar se é admin
            if (req.user.id_permissao !== 1) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem atualizar adoções.',
                    code: 'ACCESS_DENIED_ADMIN_ONLY'
                });
            }

            const { id } = req.params;
            const { status_adocao, motivo_recusa, observacao } = req.body;

            // Validar dados
            const dadosAtualizacao = {};
            if (status_adocao !== undefined) {
                if (![0, 1, 2].includes(parseInt(status_adocao))) {
                    return res.status(400).json({
                        success: false,
                        error: 'Status inválido. Valores permitidos: 0 (pendente), 1 (aprovada), 2 (recusada)',
                        code: 'INVALID_STATUS'
                    });
                }
                dadosAtualizacao.status_adocao = parseInt(status_adocao);
            }

            if (motivo_recusa !== undefined) {
                dadosAtualizacao.motivo_recusa = motivo_recusa;
            }

            if (observacao !== undefined) {
                dadosAtualizacao.observacao = observacao;
            }

            if (Object.keys(dadosAtualizacao).length === 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Nenhum campo válido para atualização fornecido',
                    code: 'NO_VALID_FIELDS'
                });
            }

            const resultado = await AdotaModel.update(id, dadosAtualizacao);

            res.json({
                success: true,
                message: resultado.message,
                data: resultado
            });

        } catch (error) {
            console.error('Erro ao atualizar adoção:', error);
            
            if (error.message.includes('não encontrada') ||
                error.message.includes('Nenhum campo válido') ||
                error.message.includes('já foi adotado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'ADOPTION_UPDATE_ERROR'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno ao atualizar adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Aprovar adoção (APENAS ADMIN)
     */
    static async aprovarAdocao(req, res) {
        try {
            // Verificar se é admin
            if (req.user.id_permissao !== 1) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem aprovar adoções.',
                    code: 'ACCESS_DENIED_ADMIN_ONLY'
                });
            }

            const { id } = req.params;
            const { observacao } = req.body;

            const resultado = await AdotaModel.approve(id, { observacao });

            // Enviar email de confirmação (se configurado)
            try {
                const emailService = await import('../utils/emailService.js');
                // Aqui você precisaria buscar os dados do usuário e do cão para enviar o email
                // await emailService.enviarConfirmacaoAdocao({...});
            } catch (emailError) {
                console.error('Erro ao enviar email de confirmação:', emailError);
                // Não falha a operação principal por erro de email
            }

            res.json({
                success: true,
                message: resultado.message,
                data: resultado
            });

        } catch (error) {
            console.error('Erro ao aprovar adoção:', error);
            
            if (error.message.includes('não encontrada') ||
                error.message.includes('já foi aprovada') ||
                error.message.includes('já foi adotado')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'ADOPTION_APPROVE_ERROR'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno ao aprovar adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Recusar adoção (APENAS ADMIN)
     */
    static async recusarAdocao(req, res) {
        try {
            // Verificar se é admin
            if (req.user.id_permissao !== 1) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem recusar adoções.',
                    code: 'ACCESS_DENIED_ADMIN_ONLY'
                });
            }

            const { id } = req.params;
            const { motivo } = req.body;

            if (!motivo || motivo.trim() === '') {
                return res.status(400).json({
                    success: false,
                    error: 'Motivo da recusa é obrigatório',
                    code: 'MOTIVO_REQUIRED'
                });
            }

            const resultado = await AdotaModel.reject(id, motivo.trim());

            res.json({
                success: true,
                message: resultado.message,
                data: resultado
            });

        } catch (error) {
            console.error('Erro ao recusar adoção:', error);
            
            if (error.message.includes('não encontrada') ||
                error.message.includes('já foi aprovada') ||
                error.message.includes('Motivo da recusa')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'ADOPTION_REJECT_ERROR'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno ao recusar adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Cancelar adoção (usuário ou admin)
     */
    static async cancelarAdocao(req, res) {
        try {
            const { id } = req.params;
            const id_usuario = req.user.id_usuario;
            const isAdmin = req.user.id_permissao === 1;

            // Se não for admin, verificar se a adoção pertence ao usuário
            if (!isAdmin) {
                const adocao = await AdotaModel.findById(id);
                if (!adocao) {
                    return res.status(404).json({
                        success: false,
                        error: 'Adoção não encontrada',
                        code: 'ADOPTION_NOT_FOUND'
                    });
                }

                if (parseInt(adocao.id_usuario) !== parseInt(id_usuario)) {
                    return res.status(403).json({
                        success: false,
                        error: 'Acesso negado. Você só pode cancelar suas próprias adoções.',
                        code: 'ACCESS_DENIED_OWNER_ONLY'
                    });
                }
            }

            const resultado = await AdotaModel.delete(id);

            res.json({
                success: true,
                message: resultado.message,
                data: resultado
            });

        } catch (error) {
            console.error('Erro ao cancelar adoção:', error);
            
            if (error.message.includes('não encontrada') ||
                error.message.includes('Não é possível cancelar')) {
                return res.status(400).json({
                    success: false,
                    error: error.message,
                    code: 'ADOPTION_CANCEL_ERROR'
                });
            }

            res.status(500).json({
                success: false,
                error: 'Erro interno ao cancelar adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Buscar estatísticas de adoções (APENAS ADMIN)
     */
    static async buscarEstatisticas(req, res) {
        try {
            // Verificar se é admin
            if (req.user.id_permissao !== 1) {
                return res.status(403).json({ 
                    success: false,
                    error: 'Acesso negado. Apenas administradores podem ver estatísticas.',
                    code: 'ACCESS_DENIED_ADMIN_ONLY'
                });
            }

            const stats = await AdotaModel.getStats();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Erro ao buscar estatísticas:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao buscar estatísticas',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }

    /**
     * Verificar se usuário pode adotar um cão específico
     */
    static async verificarAdocao(req, res) {
        try {
            const id_usuario = req.user.id_usuario;
            const { id_cao } = req.params;

            if (!id_usuario) {
                return res.status(401).json({ 
                    success: false,
                    error: 'Usuário não autenticado',
                    code: 'USER_NOT_AUTHENTICATED'
                });
            }

            if (!id_cao) {
                return res.status(400).json({ 
                    success: false,
                    error: 'ID do cão é obrigatório',
                    code: 'DOG_ID_REQUIRED'
                });
            }

            const verificacao = await AdotaModel.canUserAdopt(id_usuario, id_cao);

            res.json({
                success: true,
                data: verificacao
            });

        } catch (error) {
            console.error('Erro ao verificar adoção:', error);
            res.status(500).json({
                success: false,
                error: 'Erro interno ao verificar adoção',
                code: 'INTERNAL_SERVER_ERROR'
            });
        }
    }
}

// Exportação
export default AdotaController;

// Exportação para compatibilidade com as rotas existentes
export const solicitarAdocao = (req, res) => AdotaController.solicitarAdocao(req, res);
export const listarMinhasAdocoes = (req, res) => AdotaController.listarMinhasAdocoes(req, res);
export const listarSolicitacoes = (req, res) => AdotaController.listarSolicitacoes(req, res);
export const buscarAdocao = (req, res) => AdotaController.buscarAdocao(req, res);
export const atualizarSolicitacao = (req, res) => AdotaController.atualizarAdocao(req, res);
export const cancelarAdocao = (req, res) => AdotaController.cancelarAdocao(req, res);
export const aprovarAdocao = (req, res) => AdotaController.aprovarAdocao(req, res);
export const recusarAdocao = (req, res) => AdotaController.recusarAdocao(req, res);
export const buscarEstatisticas = (req, res) => AdotaController.buscarEstatisticas(req, res);
export const verificarAdocao = (req, res) => AdotaController.verificarAdocao(req, res);