// frontend/src/pages/pagesUser/vitrineUsuario/VitrineUsuario.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from '../../../components/Header/Header';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import SearchBar from '../../../components/SearchBar/SearchBar';
import Filtro from '../../../components/filtro/Filtro';
import CardVitrine from '../../../components/CardVitrine/CardVitrine';
import Footer from '../../../components/footer/footer';
import { caoService } from '../../../services/caoService';
import './VitrineUsuario.css';

export default function VitrineUsuario() {
  const navigate = useNavigate();
  const [cachorros, setCachorros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    sexo: '',
    porte: '',
    idade: '',
    cor: '',
    status: 'disponivel', // Filtro por padrão para mostrar apenas disponíveis
  });
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const itensPorPagina = 12;

  // Corrigir URL da imagem
  const corrigirURL = (foto_url) => {
    if (!foto_url) return "/assets/doguinho-default.jpg";
    
    if (foto_url.startsWith("http")) return foto_url;
    if (foto_url.startsWith("/uploads")) return `http://localhost:3001${foto_url}`;
    if (foto_url.startsWith("uploads")) return `http://localhost:3001/${foto_url}`;
    
    return `http://localhost:3001/uploads/caes/${foto_url}`;
  };

  // Buscar cachorros
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Usando o serviço de cachorros
        const dados = await caoService.findAll(paginaAtual, itensPorPagina, filtros);
        
        const normalizados = dados.map(c => ({
          id: c.id,
          id_cao: c.id,
          nome: c.nome,
          raca: c.raca?.nome || c.id_raca,
          cor: c.pelagem,
          sexo: c.sexo,
          idade: Number(c.idade),
          porte: c.porte,
          descricao: c.descricao,
          resumo: c.descricao?.substring(0, 100) + '...',
          comportamento: c.comportamento,
          valorApadrinhamento: Number(c.valor_apadrinhamento) || 50,
          status: c.status,
          img: corrigirURL(c.foto_url)
        }));

        setCachorros(normalizados);
      } catch (err) {
        console.error("Erro ao carregar cachorros:", err);
        setError('❌ Erro ao carregar os cachorros. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [paginaAtual, filtros]);

  // Atualizar filtros
  const atualizarFiltro = useCallback((campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
    setPaginaAtual(1);
  }, []);

  // Filtrar dados localmente (para busca por nome)
  const dadosFiltrados = cachorros.filter(item => {
    const correspondeBusca = item.nome?.toLowerCase().includes(busca.toLowerCase());
    return correspondeBusca;
  });

  // Paginação
  const totalPaginas = Math.ceil(dadosFiltrados.length / itensPorPagina) || 1;
  const indiceInicial = (paginaAtual - 1) * itensPorPagina;
  const dadosPaginados = dadosFiltrados.slice(indiceInicial, indiceInicial + itensPorPagina);

  const paginaAnterior = () => {
    if (paginaAtual > 1) {
      setPaginaAtual(paginaAtual - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const proximaPagina = () => {
    if (paginaAtual < totalPaginas) {
      setPaginaAtual(paginaAtual + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleCardClick = useCallback((cachorro) => {
    navigate('/apadrinhamento', {
      state: { cachorroSelecionado: cachorro }
    });
  }, [navigate]);

  if (loading) {
    return (
      <>
        <PatasAleatorias quantidade={15} />
        <Header />
        <div className="loading-container-user">
          <p>Carregando nossos amigos...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <PatasAleatorias quantidade={15} />
      <div className="vitrine-user-content">
        <Header />

        {error && <div className="erro-mensagem-user">{error}</div>}

        <div className="vitrine-header">
          <h1>Nossos Amigos Esperando por Você</h1>
          <p>Encontre seu novo melhor amigo ou apadrinhe um pet que precisa de ajuda</p>
        </div>

        <div className="vitrine-controls">
          <SearchBar
            placeholder="Buscar por nome..."
            onChange={(e) => setBusca(e.target.value)}
            value={busca}
          />
          
          <Filtro filtros={filtros} atualizarFiltro={atualizarFiltro} />
        </div>

        <div className="resultados-info-user">
          <p>
            Mostrando {dadosPaginados.length} de {dadosFiltrados.length} cachorros
            {filtros.status === 'disponivel' && ' (disponíveis para adoção)'}
          </p>
        </div>

        {dadosPaginados.length === 0 ? (
          <div className="nenhum-resultado">
            <p>Nenhum cachorro encontrado com os filtros atuais.</p>
            <button onClick={() => {
              setFiltros({
                sexo: '',
                porte: '',
                idade: '',
                cor: '',
                status: 'disponivel',
              });
              setBusca('');
            }}>
              Limpar Filtros
            </button>
          </div>
        ) : (
          <>
            <div className="Cards-grid-user">
              {dadosPaginados.map((item) => (
                <div
                  key={item.id}
                  className="card-wrapper-user"
                  onClick={() => handleCardClick(item)}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => e.key === 'Enter' && handleCardClick(item)}
                >
                  <CardVitrine data={item} />
                </div>
              ))}
            </div>

            {totalPaginas > 1 && (
              <nav className="paginacao-wrapper-user">
                <div className="paginacao-user">
                  <button 
                    onClick={paginaAnterior} 
                    disabled={paginaAtual === 1}
                    aria-label="Página anterior"
                  >
                    <ChevronLeft size={32} />
                  </button>

                  <span className="pagina-info">
                    Página {paginaAtual} de {totalPaginas}
                  </span>

                  <button 
                    onClick={proximaPagina} 
                    disabled={paginaAtual === totalPaginas}
                    aria-label="Próxima página"
                  >
                    <ChevronRight size={32} />
                  </button>
                </div>
              </nav>
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  );
}