import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCaes } from '../../../hooks/useCaes';
import Header from '../../../components/Header';
import DogSection from '../../../components/dogSection/DogSection';
import CardsSection from '../../../components/CardSection/CardSection';
import QuemSomos from '../../../components/quemSomos/QuemSomos';
import FeedbacksCarousel from '../../../components/feedback/FeedbacksCarousel';
import Footer from '../../../components/footer/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import './telaInicial.css';

export default function TelaInicial() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { caes, loading, findForAdoption } = useCaes();
  
  const [featuredDogs, setFeaturedDogs] = useState([]);

  useEffect(() => {
    // Carrega cães em destaque para a home
    loadFeaturedDogs();
  }, []);

  const loadFeaturedDogs = async () => {
    const result = await findForAdoption(1, 4); // 4 cães mais recentes
    if (result.success) {
      setFeaturedDogs(result.data.caes.slice(0, 4));
    }
  };

  const irParaCadastro = () => {
    navigate('/registro');
  };

  const irParaSobreNos = () => {
    navigate('/sobre-nos');
  };

  const irParaCaes = () => {
    navigate('/caes');
  };

  const irParaLogin = () => {
    navigate('/login');
  };

  return (
    <div className="tela-inicial">
      {/* Patinhas decorativas no fundo */}
      <div className="tela-inicial-patinhas-bg">
        <PatasAleatorias quantidade={20} />
      </div>

      {/* Cabeçalho */}
      <Header 
        user={user}
        isAuthenticated={isAuthenticated}
        onLoginClick={irParaLogin}
        onCadastroClick={irParaCadastro}
      />

      {/* Hero Section com Dog */}
      <DogSection
        onCadastroClick={irParaCadastro}
        onSobreNosClick={irParaSobreNos}
        onVerCaesClick={irParaCaes}
        nomeUsuario={user?.nome || "Amigo"}
        isAuthenticated={isAuthenticated}
      />

      {/* Destaques - Cães para adoção */}
      <section className="tela-inicial-destaques">
        <div className="tela-inicial-container">
          <h2>Cães que precisam de um lar</h2>
          <p className="tela-inicial-subtitle">
            Conheça alguns dos nossos amigos que estão esperando por uma família
          </p>
          
          {loading ? (
            <div className="tela-inicial-loading">
              <div className="spinner"></div>
              <p>Carregando cães...</p>
            </div>
          ) : featuredDogs.length > 0 ? (
            <div className="tela-inicial-caes-grid">
              {featuredDogs.map((cao) => (
                <div key={cao.id_cao} className="tela-inicial-cao-card">
                  <div className="tela-inicial-cao-image">
                    {cao.foto_url ? (
                      <img 
                        src={`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${cao.foto_url}`}
                        alt={cao.nome}
                      />
                    ) : (
                      <div className="tela-inicial-cao-placeholder">
                        🐾
                      </div>
                    )}
                  </div>
                  <div className="tela-inicial-cao-info">
                    <h4>{cao.nome}</h4>
                    <p className="tela-inicial-cao-raca">{cao.raca_nome}</p>
                    <div className="tela-inicial-cao-details">
                      <span className="tela-inicial-cao-detail">
                        {cao.idade} anos
                      </span>
                      <span className="tela-inicial-cao-detail">
                        {cao.sexo === 'M' ? 'Macho' : 'Fêmea'}
                      </span>
                      <span className="tela-inicial-cao-detail">
                        {cao.porte}
                      </span>
                    </div>
                    <button 
                      className="tela-inicial-cao-btn"
                      onClick={() => navigate(`/caes/${cao.id_cao}`)}
                    >
                      Conhecer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="tela-inicial-no-dogs">
              <p>Nenhum cão disponível no momento.</p>
            </div>
          )}
          
          <div className="tela-inicial-ver-todos">
            <button 
              className="tela-inicial-btn-todos"
              onClick={irParaCaes}
            >
              Ver todos os cães
            </button>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="tela-inicial-estatisticas">
        <div className="tela-inicial-container">
          <div className="tela-inicial-estatistica">
            <h3>+500</h3>
            <p>Cães adotados</p>
          </div>
          <div className="tela-inicial-estatistica">
            <h3>+1000</h3>
            <p>Famílias felizes</p>
          </div>
          <div className="tela-inicial-estatistica">
            <h3>+50</h3>
            <p>Parceiros</p>
          </div>
          <div className="tela-inicial-estatistica">
            <h3>99%</h3>
            <p>Taxa de satisfação</p>
          </div>
        </div>
      </section>

      {/* Seção de cards (como funciona) */}
      <CardsSection />

      {/* Quem somos */}
      <div id="quem-somos">
        <QuemSomos />
      </div>

      {/* Depoimentos */}
      <section className="tela-inicial-depoimentos">
        <div className="tela-inicial-container">
          <h2>Histórias de amor</h2>
          <p className="tela-inicial-subtitle">
            Veja o que as famílias adotantes têm a dizer
          </p>
          <FeedbacksCarousel />
        </div>
      </section>

      {/* CTA Final */}
      <section className="tela-inicial-cta">
        <div className="tela-inicial-container">
          <div className="tela-inicial-cta-content">
            <h3>Pronto para mudar uma vida?</h3>
            <p>
              Adotar é um ato de amor que transforma vidas.<br/>
              Dê ao seu novo amigo uma segunda chance.
            </p>
            <div className="tela-inicial-cta-buttons">
              <button 
                className="tela-inicial-cta-btn-primary"
                onClick={irParaCaes}
              >
                Ver cães disponíveis
              </button>
              {!isAuthenticated && (
                <button 
                  className="tela-inicial-cta-btn-secondary"
                  onClick={irParaCadastro}
                >
                  Cadastre-se para adotar
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Rodapé */}
      <Footer />
    </div>
  );
}