// frontend/src/pages/pagesUser/home/Home.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import DogSection from '../../../components/dogSection/dogSection';
import CardsSection from '../../../components/CardSection/CardSection';
import QuemSomos from '../../../components/quemSomos/quemSomos';
import FeedbacksCarousel from '../../../components/feedback/feedback';
import Footer from '../../../components/footer/footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import { caoService } from '../../../services/caoService';
import { adocaoService } from '../../../services/adocaoService';
import './home.css';

export default function HomeUsuario() {
  const navigate = useNavigate();
  const [cachorrosDestaque, setCachorrosDestaque] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    adocoesConcluidas: 0,
    petsAguardando: 0,
    doacoesRecebidas: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        
        // Buscar cachorros para destaque (últimos 4 adicionados)
        const cachorrosData = await caoService.findAll(1, 4, { status: 'disponivel' });
        
        // Buscar estatísticas (simulado - ajustar quando tiver endpoint específico)
        // const stats = await adocaoService.buscarEstatisticas();
        
        setCachorrosDestaque(cachorrosData);
        
        // Estatísticas simuladas
        setEstatisticas({
          adocoesConcluidas: 245,
          petsAguardando: cachorrosData.length,
          doacoesRecebidas: 1890
        });
        
      } catch (error) {
        console.error('Erro ao carregar dados da home:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  const irParaCadastro = () => {
    navigate('/cadastro');
  };

  const irParaVitrine = () => {
    navigate('/vitrine-user');
  };

  const irParaDoacao = () => {
    navigate('/pagamento');
  };

  const corrigirURL = (foto_url) => {
    if (!foto_url) return "/assets/doguinho-default.jpg";
    if (foto_url.startsWith("http")) return foto_url;
    if (foto_url.startsWith("/uploads")) return `http://localhost:3001${foto_url}`;
    if (foto_url.startsWith("uploads")) return `http://localhost:3001/${foto_url}`;
    return `http://localhost:3001/uploads/caes/${foto_url}`;
  };

  return (
    <div className="home-usuario">
      {/* Patinhas decorativas no fundo */}
      <div className="home-usuario-patinhas-bg">
        <PatasAleatorias quantidade={20} />
      </div>

      {/* Cabeçalho */}
      <Header onCadastroClick={irParaCadastro} />

      {/* Hero Section */}
      <section className="home-hero">
        <div className="hero-content">
          <h1>Dando amor e lar para quem mais precisa</h1>
          <p>
            Somos uma ONG dedicada ao resgate, cuidado e adoção responsável de animais. 
            Juntos, transformamos vidas todos os dias.
          </p>
          <div className="hero-buttons">
            <button onClick={irParaVitrine} className="btn-hero-primary">
              Ver Pets para Adoção
            </button>
            <button onClick={irParaDoacao} className="btn-hero-secondary">
              Quero Ajudar
            </button>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="home-estatisticas">
        <div className="estatisticas-container">
          <div className="estatistica-item">
            <h3>{estatisticas.adocoesConcluidas}+</h3>
            <p>Adoções Realizadas</p>
          </div>
          <div className="estatistica-item">
            <h3>{estatisticas.petsAguardando}</h3>
            <p>Pets Aguardando Lar</p>
          </div>
          <div className="estatistica-item">
            <h3>{estatisticas.doacoesRecebidas}</h3>
            <p>Doações Recebidas</p>
          </div>
          <div className="estatistica-item">
            <h3>24/7</h3>
            <p>Cuidados e Amor</p>
          </div>
        </div>
      </section>

      {/* Seção com cachorros em destaque */}
      <section className="home-destaque">
        <h2>Pets Recentes</h2>
        <p>Conheça alguns dos nossos amigos que chegaram recentemente</p>
        
        {loading ? (
          <div className="loading-pets">
            <p>Carregando nossos amigos...</p>
          </div>
        ) : cachorrosDestaque.length > 0 ? (
          <div className="destaque-grid">
            {cachorrosDestaque.slice(0, 4).map(pet => (
              <div 
                key={pet.id} 
                className="pet-destaque-card"
                onClick={() => navigate('/apadrinhamento', { 
                  state: { 
                    cachorroSelecionado: {
                      ...pet,
                      img: corrigirURL(pet.foto_url),
                      valorApadrinhamento: pet.valor_apadrinhamento || 50
                    }
                  } 
                })}
              >
                <img 
                  src={corrigirURL(pet.foto_url)} 
                  alt={pet.nome}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/assets/doguinho-default.jpg";
                  }}
                />
                <div className="pet-destaque-info">
                  <h3>{pet.nome}</h3>
                  <p>{pet.raca?.nome || 'SRD'} • {pet.idade} anos</p>
                  <p className="pet-status">Disponível para adoção</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="sem-pets">Nenhum pet disponível no momento</p>
        )}
        
        <button onClick={irParaVitrine} className="btn-ver-todos">
          Ver todos os pets
        </button>
      </section>

      {/* Seção de cards de ação */}
      <section className="home-acoes">
        <CardsSection />
      </section>

      {/* Seção Quem Somos */}
      <section className="home-quem-somos">
        <QuemSomos />
      </section>

      {/* Depoimentos */}
      <section className="home-depoimentos">
        <h2>Histórias que nos inspiram</h2>
        <p>Veja o que dizem quem já adotou ou ajudou nossos pets</p>
        <FeedbacksCarousel />
      </section>

      {/* CTA Final */}
      <section className="home-cta">
        <div className="cta-content">
          <h2>Pronto para fazer a diferença?</h2>
          <p>Seja adotando, apadrinhando ou doando, você pode transformar uma vida hoje mesmo.</p>
          <div className="cta-buttons">
            <button onClick={irParaVitrine} className="btn-cta-primary">
              Quero Adotar
            </button>
            <button onClick={irParaDoacao} className="btn-cta-secondary">
              Quero Ajudar
            </button>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <Footer />
    </div>
  );
}