import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCaes } from '../../../hooks/useCaes';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import SearchBar from '../../../components/SearchBar';
import Filtro from '../../../components/Filtro';
import CardVitrine from '../../../components/CardVitrine';
import './vitrineAdm.css';

export default function VitrineAdm() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { caes, loading, pagination, findAllCaes, deleteCao } = useCaes();
  
  const [filtros, setFiltros] = useState({
    sexo: '',
    porte: '',
    idade: '',
    temperamento: '',
    castrado: ''
  });

  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [deletingId, setDeletingId] = useState(null);

  const itensPorPagina = 12;

  // Verificar se o usuário é admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  // Carregar cães
  useEffect(() => {
    loadCaes();
  }, [paginaAtual, filtros, busca]);

  const loadCaes = async () => {
    await findAllCaes(paginaAtual, itensPorPagina, {
      ...filtros,
      search: busca
    });
  };

  const atualizarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({
      ...prev,
      [campo]: valor,
    }));
    setPaginaAtual(1);
  }, []);

  const handleSearch = useCallback((termo) => {
    setBusca(termo);
    setPaginaAtual(1);
  }, []);

  const classificarIdade = (idade) => {
    const anos = Number(idade);
    if (isNaN(anos)) return "Indefinido";
    if (anos <= 1) return "Filhote";
    if (anos <= 7) return "Adulto";
    return "Idoso";
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja inativar este cão?')) {
      return;
    }

    try {
      setDeletingId(id);
      const resultado = await deleteCao(id);
      
      if (resultado.success) {
        alert('Cão inativado com sucesso!');
        await loadCaes(); // Recarregar lista
      } else {
        alert(resultado.error || 'Erro ao inativar cão');
      }
    } catch (error) {
      console.error('Erro ao inativar cão:', error);
      alert('Erro ao inativar cão');
    } finally {
      setDeletingId(null);
    }
  };

  const handleEdit = (cao) => {
    navigate('/admin/caes/editar', { 
      state: { 
        editar: true, 
        cachorro: {
          ...cao,
          idade: parseFloat(cao.idade)
        }
      } 
    });
  };

  const handleActivate = async (id) => {
    if (!window.confirm('Deseja reativar este cão?')) {
      return;
    }

    try {
      setDeletingId(id);
      
      // Aqui você precisaria implementar um método para ativar o cão
      // Por enquanto, vamos usar o método de update
      // const resultado = await caoService.update(id, { ativo: 1 });
      
      alert('Funcionalidade de ativação em desenvolvimento');
      
      await loadCaes(); // Recarregar lista
    } catch (error) {
      console.error('Erro ao ativar cão:', error);
      alert('Erro ao ativar cão');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddNew = () => {
    navigate('/admin/caes/novo');
  };

  const handleNextPage = () => {
    if (pagination && paginaAtual < pagination.totalPages) {
      setPaginaAtual(paginaAtual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="vitrine-adm">
      <PatasAleatorias quantidade={20} />

      <Header user={user} isAuthenticated={true} isAdmin={true} />

      <div className="vitrine-adm-content">
        <div className="vitrine-adm-header">
          <div className="vitrine-adm-header-left">
            <h1>Gerenciamento de Cães</h1>
            <p className="vitrine-adm-subtitle">
              Gerencie todos os cães cadastrados no sistema
            </p>
          </div>
          <div className="vitrine-adm-header-right">
            <button 
              className="vitrine-adm-btn-add"
              onClick={handleAddNew}
            >
              + Novo Cão
            </button>
          </div>
        </div>

        <div className="vitrine-adm-toolbar">
          <div className="vitrine-adm-search">
            <SearchBar
              placeholder="Pesquisar por nome, raça ou descrição..."
              onChange={(e) => handleSearch(e.target.value)}
              value={busca}
            />
          </div>
          
          <div className="vitrine-adm-filters">
            <Filtro 
              filtros={filtros} 
              atualizarFiltro={atualizarFiltro} 
              modoADM={true}
            />
          </div>
        </div>

        {loading ? (
          <div className="vitrine-adm-loading">
            <div className="vitrine-adm-spinner"></div>
            <p>Carregando cães...</p>
          </div>
        ) : (
          <>
            <div className="vitrine-adm-results">
              <div className="vitrine-adm-results-header">
                <p>
                  Mostrando {caes.length} de {pagination?.totalItems || 0} cães
                  {busca && ` para "${busca}"`}
                </p>
                <span className="vitrine-adm-page-info">
                  Página {paginaAtual} de {pagination?.totalPages || 1}
                </span>
              </div>

              {caes.length > 0 ? (
                <div className="vitrine-adm-grid">
                  {caes.map((cao) => (
                    <div key={cao.id_cao} className="vitrine-adm-card-wrapper">
                      <div className="vitrine-adm-card-actions">
                        <button
                          className="vitrine-adm-action-btn edit"
                          onClick={() => handleEdit(cao)}
                          disabled={deletingId === cao.id_cao}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        
                        {cao.ativo === 1 ? (
                          <button
                            className="vitrine-adm-action-btn delete"
                            onClick={() => handleDelete(cao.id_cao)}
                            disabled={deletingId === cao.id_cao}
                            title="Inativar"
                          >
                            {deletingId === cao.id_cao ? '...' : '🗑️'}
                          </button>
                        ) : (
                          <button
                            className="vitrine-adm-action-btn activate"
                            onClick={() => handleActivate(cao.id_cao)}
                            disabled={deletingId === cao.id_cao}
                            title="Ativar"
                          >
                            {deletingId === cao.id_cao ? '...' : '✅'}
                          </button>
                        )}
                      </div>
                      
                      <CardVitrine 
                        data={{
                          ...cao,
                          idade: classificarIdade(cao.idade),
                          idadeNumero: parseFloat(cao.idade)
                        }}
                        isAdmin={true}
                      />
                      
                      <div className="vitrine-adm-card-footer">
                        <span className={`vitrine-adm-status ${cao.ativo ? 'active' : 'inactive'}`}>
                          {cao.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                        <span className="vitrine-adm-criado-por">
                          Cadastrado por: {cao.usuario?.nome || 'Admin'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vitrine-adm-empty">
                  <p>Nenhum cão encontrado com os filtros selecionados.</p>
                  <button 
                    className="vitrine-adm-btn-clear"
                    onClick={() => {
                      setFiltros({
                        sexo: '',
                        porte: '',
                        idade: '',
                        temperamento: '',
                        castrado: ''
                      });
                      setBusca('');
                    }}
                  >
                    Limpar Filtros
                  </button>
                </div>
              )}
            </div>

            {pagination && pagination.totalPages > 1 && (
              <div className="vitrine-adm-pagination">
                <button
                  onClick={handlePrevPage}
                  disabled={paginaAtual === 1}
                  className="vitrine-adm-pagination-btn"
                >
                  ← Anterior
                </button>
                
                <div className="vitrine-adm-pagination-info">
                  <span>Página {paginaAtual} de {pagination.totalPages}</span>
                  <span className="vitrine-adm-total-items">
                    Total: {pagination.totalItems} cães
                  </span>
                </div>
                
                <button
                  onClick={handleNextPage}
                  disabled={paginaAtual === pagination.totalPages}
                  className="vitrine-adm-pagination-btn"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}