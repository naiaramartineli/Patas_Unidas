import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { adocaoService } from '../../../services/adocaoService';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import Modal from '../../../components/Modal/Modal';
import './questionario.css';

export default function Questionario() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busca, setBusca] = useState('');
  const [pagina, setPagina] = useState(1);
  const [pageSize] = useState(10);
  
  // Estados para modais
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [solicitacaoSelecionada, setSolicitacaoSelecionada] = useState(null);
  
  // Modal de recusa
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [idParaRecusar, setIdParaRecusar] = useState(null);
  const [processando, setProcessando] = useState(null);

  // Verificar se o usuário é admin
  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Carregar solicitações
  const carregarSolicitacoes = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const resultado = await adocaoService.listarSolicitacoes(pagina, pageSize, {
        search: busca,
        status: undefined // Carrega todas
      });
      
      if (resultado.success) {
        setSolicitacoes(resultado.data.adocoes);
      } else {
        setError(resultado.error || 'Erro ao carregar solicitações');
      }
    } catch (err) {
      console.error('Erro ao carregar solicitações:', err);
      setError('Não foi possível carregar as solicitações.');
    } finally {
      setLoading(false);
    }
  }, [pagina, busca, pageSize]);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  // Filtrar solicitações
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return solicitacoes;

    return solicitacoes.filter(s => 
      (s.usuario?.nome_completo || '').toLowerCase().includes(termo) ||
      (s.usuario?.email || '').toLowerCase().includes(termo) ||
      (s.cao?.nome || '').toLowerCase().includes(termo)
    );
  }, [solicitacoes, busca]);

  // Paginação
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / pageSize));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice(
    (paginaAtual - 1) * pageSize,
    paginaAtual * pageSize
  );

  // Funções de status
  const atualizarStatus = async (id, status) => {
    if (status === 2) {
      setIdParaRecusar(id);
      setModalRecusaAberto(true);
      return;
    }

    try {
      setProcessando(id);
      
      let resultado;
      if (status === 1) {
        resultado = await adocaoService.aprovarAdocao(id, 'Aprovado pelo administrador');
      } else {
        resultado = await adocaoService.atualizarAdocao(id, { status_adocao: status });
      }
      
      if (resultado.success) {
        await carregarSolicitacoes(); // Recarregar lista
      } else {
        alert(resultado.error || 'Erro ao atualizar status');
      }
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      alert('Erro ao atualizar status da solicitação');
    } finally {
      setProcessando(null);
    }
  };

  const confirmarRecusa = async () => {
    if (!justificativa.trim()) {
      alert('Digite uma justificativa para recusar.');
      return;
    }

    try {
      setProcessando(idParaRecusar);
      const resultado = await adocaoService.recusarAdocao(idParaRecusar, justificativa.trim());
      
      if (resultado.success) {
        await carregarSolicitacoes();
        setJustificativa('');
        setModalRecusaAberto(false);
        setIdParaRecusar(null);
      } else {
        alert(resultado.error || 'Erro ao recusar solicitação');
      }
    } catch (err) {
      console.error('Erro ao recusar:', err);
      alert('Erro ao recusar solicitação');
    } finally {
      setProcessando(null);
    }
  };

  const cancelarRecusa = () => {
    setJustificativa('');
    setModalRecusaAberto(false);
    setIdParaRecusar(null);
  };

  const abrirDetalhes = (solicitacao) => {
    setSolicitacaoSelecionada(solicitacao);
    setDetalhesAberto(true);
  };

  const fecharDetalhes = () => {
    setSolicitacaoSelecionada(null);
    setDetalhesAberto(false);
  };

  const getStatusTexto = (status) => {
    switch (status) {
      case 0: return 'Pendente';
      case 1: return 'Aprovada';
      case 2: return 'Recusada';
      default: return 'Desconhecido';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 0: return 'status-pendente';
      case 1: return 'status-aprovado';
      case 2: return 'status-recusado';
      default: return '';
    }
  };

  return (
    <div className="questionario-admin">
      <div className="questionario-admin-patinhas-bg">
        <PatasAleatorias quantidade={25} />
      </div>

      <Header user={user} isAuthenticated={true} isAdmin={true} />

      <main className="questionario-admin-container">
        <div className="questionario-header">
          <h1>🐾 Controle de Adoções</h1>
          <p className="questionario-subtitle">
            Gerencie as solicitações de adoção do sistema
          </p>
        </div>

        {/* Barra de ferramentas */}
        <div className="questionario-toolbar">
          <div className="questionario-search">
            <input
              type="text"
              className="questionario-search-input"
              placeholder="Buscar por nome, email ou cão..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
          </div>
          
          <div className="questionario-info">
            <span className="questionario-total">
              Total: {filtradas.length} solicitações
            </span>
            <span className="questionario-pagina">
              Página {paginaAtual} de {totalPaginas}
            </span>
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="questionario-error">
            {error}
          </div>
        )}

        {/* Tabela de solicitações */}
        {loading ? (
          <div className="questionario-loading">
            <div className="questionario-spinner"></div>
            <p>Carregando solicitações...</p>
          </div>
        ) : (
          <>
            <div className="questionario-table-container">
              <table className="questionario-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Cão</th>
                    <th>Data Solicitação</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="questionario-empty">
                        Nenhuma solicitação encontrada.
                      </td>
                    </tr>
                  ) : (
                    visiveis.map((solicitacao) => (
                      <tr key={solicitacao.id_adotar}>
                        <td>
                          <div className="questionario-usuario">
                            <strong>{solicitacao.usuario?.nome_completo || 'N/A'}</strong>
                            <small>{solicitacao.usuario?.email}</small>
                          </div>
                        </td>
                        
                        <td>
                          <div className="questionario-cao">
                            <strong>{solicitacao.cao?.nome || 'N/A'}</strong>
                            <small>
                              {solicitacao.cao?.raca} • {solicitacao.cao?.idade} anos
                            </small>
                          </div>
                        </td>
                        
                        <td>
                          {new Date(solicitacao.data_solicitacao).toLocaleDateString('pt-BR')}
                        </td>
                        
                        <td>
                          <span className={`questionario-status ${getStatusClass(solicitacao.status)}`}>
                            {getStatusTexto(solicitacao.status)}
                          </span>
                        </td>
                        
                        <td>
                          <div className="questionario-actions">
                            <select
                              value={solicitacao.status}
                              onChange={(e) => atualizarStatus(solicitacao.id_adotar, parseInt(e.target.value))}
                              disabled={processando === solicitacao.id_adotar}
                              className="questionario-select"
                            >
                              <option value={0}>Pendente</option>
                              <option value={1}>Aprovado</option>
                              <option value={2}>Recusado</option>
                            </select>
                            
                            <button
                              className="questionario-btn-detalhes"
                              onClick={() => abrirDetalhes(solicitacao)}
                              disabled={processando === solicitacao.id_adotar}
                            >
                              Detalhes
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPaginas > 1 && (
              <div className="questionario-paginacao">
                <button
                  onClick={() => setPagina(p => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="questionario-btn-pagina"
                >
                  Anterior
                </button>
                
                <span className="questionario-pagina-info">
                  Página {paginaAtual} de {totalPaginas}
                </span>
                
                <button
                  onClick={() => setPagina(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual === totalPaginas}
                  className="questionario-btn-pagina"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <Footer />

      {/* Modal de recusa */}
      <Modal
        isOpen={modalRecusaAberto}
        onClose={cancelarRecusa}
        title="Justificativa da Recusa"
      >
        <div className="modal-recusa">
          <p className="modal-recusa-texto">
            Por favor, explique o motivo da recusa desta solicitação de adoção:
          </p>
          
          <textarea
            className="modal-recusa-textarea"
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Digite a justificativa aqui..."
            rows={4}
            disabled={!!processando}
          />
          
          <div className="modal-recusa-actions">
            <button
              className="modal-recusa-btn-confirmar"
              onClick={confirmarRecusa}
              disabled={!justificativa.trim() || !!processando}
            >
              {processando ? (
                <>
                  <span className="modal-spinner"></span>
                  Processando...
                </>
              ) : 'Confirmar Recusa'}
            </button>
            
            <button
              className="modal-recusa-btn-cancelar"
              onClick={cancelarRecusa}
              disabled={!!processando}
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de detalhes */}
      <Modal
        isOpen={detalhesAberto}
        onClose={fecharDetalhes}
        title="Detalhes da Solicitação"
        size="lg"
      >
        {solicitacaoSelecionada && (
          <div className="modal-detalhes">
            <div className="modal-detalhes-section">
              <h4>👤 Informações do Usuário</h4>
              <div className="modal-detalhes-content">
                <div className="modal-detalhes-item">
                  <strong>Nome:</strong>
                  <span>{solicitacaoSelecionada.usuario?.nome_completo || 'N/A'}</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Email:</strong>
                  <span>{solicitacaoSelecionada.usuario?.email || 'N/A'}</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Telefone:</strong>
                  <span>{solicitacaoSelecionada.usuario?.telefone || 'N/A'}</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Data Solicitação:</strong>
                  <span>
                    {new Date(solicitacaoSelecionada.data_solicitacao).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-detalhes-section">
              <h4>🐶 Informações do Cão</h4>
              <div className="modal-detalhes-content">
                <div className="modal-detalhes-item">
                  <strong>Nome:</strong>
                  <span>{solicitacaoSelecionada.cao?.nome || 'N/A'}</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Raça:</strong>
                  <span>{solicitacaoSelecionada.cao?.raca || 'N/A'}</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Idade:</strong>
                  <span>{solicitacaoSelecionada.cao?.idade || 'N/A'} anos</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Sexo:</strong>
                  <span>{solicitacaoSelecionada.cao?.sexo === 'M' ? 'Macho' : 'Fêmea'}</span>
                </div>
                <div className="modal-detalhes-item">
                  <strong>Porte:</strong>
                  <span>{solicitacaoSelecionada.cao?.porte || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="modal-detalhes-section">
              <h4>📝 Observações</h4>
              <div className="modal-detalhes-observacao">
                {solicitacaoSelecionada.observacao || 'Nenhuma observação informada.'}
              </div>
            </div>

            {solicitacaoSelecionada.motivo_recusa && (
              <div className="modal-detalhes-section motivo-recusa">
                <h4>❌ Motivo da Recusa</h4>
                <div className="modal-detalhes-motivo">
                  {solicitacaoSelecionada.motivo_recusa}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}