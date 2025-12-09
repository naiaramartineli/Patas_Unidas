// frontend/src/pages/pagesUser/perfilUsuario/PerfilUsuario.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import Footer from '../../../components/footer/footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faPaw, 
  faHandHoldingHeart, 
  faDonate, 
  faSignOutAlt,
  faHeart,
  faHome
} from '@fortawesome/free-solid-svg-icons';
import { authService } from '../../../services/authService';
import { userService } from '../../../services/userService';
import { adocaoService } from '../../../services/adocaoService';
import './PerfilUsuario.css';

export default function PerfilUsuario() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [estatisticas, setEstatisticas] = useState({
    doacoesTotal: 0,
    doacoesCount: 0,
    apadrinhamentosCount: 0,
    adocoesCount: 0
  });

  useEffect(() => {
    const fetchDadosUsuario = async () => {
      try {
        setLoading(true);
        
        // 1) Buscar perfil do usuário
        const profileResponse = await authService.getProfile();
        
        if (!profileResponse?.usuario) {
          throw new Error('Usuário não encontrado');
        }

        const userData = profileResponse.usuario;
        
        // 2) Buscar dados específicos do usuário
        const [adocoesData, userAdoptions, userSponsorships] = await Promise.all([
          adocaoService.listarMinhasAdocoes(),
          userService.getMyAdoptions(),
          userService.getMySponsorships()
        ]);

        // Processar adoções
        const adocoesAprovadas = adocoesData.filter(adocao => adocao.status === 1);
        
        // Montar objeto do usuário
        setUsuario({
          nome: userData.nome || "Usuário",
          email: userData.email || "",
          telefone: userData.telefone || "",
          cidade: userData.cidade || "",
          estado: userData.estado || "",
          fotoPerfil: userData.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome || 'U')}&background=7c428f&color=fff&size=150`,
        });

        // Estatísticas
        setEstatisticas({
          doacoesTotal: userAdoptions?.total || 0,
          doacoesCount: userAdoptions?.count || 0,
          apadrinhamentosCount: userSponsorships?.length || 0,
          adocoesCount: adocoesAprovadas.length || 0
        });

        setError(false);
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        
        if (error.response?.status === 401) {
          setMensagem('Sessão expirada. Faça login novamente.');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          setMensagem('❌ Erro ao carregar perfil. Tente novamente.');
        }
        
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchDadosUsuario();
  }, [navigate]);

  const handleEditProfile = () => {
    navigate('/configuracoes');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      localStorage.clear();
      sessionStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleEditarFoto = () => {
    navigate('/configuracoes', { state: { scrollTo: 'foto' } });
  };

  const handleVerAdocoes = () => {
    navigate('/visualiza-adocoes');
  };

  const handleVerApadrinhamentos = () => {
    navigate('/visualiza-apadrinhamento');
  };

  const handleVerDoacoes = () => {
    navigate('/visualiza-doacoes');
  };

  if (loading) {
    return (
      <div className="perfil-usuario-wrapper">
        <Header />
        <PatasAleatorias quantidade={15} />
        <main className="perfil-usuario-main">
          <div className="loading-container">
            <p>Carregando seu perfil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className="perfil-usuario-wrapper">
        <Header />
        <PatasAleatorias quantidade={15} />
        <main className="perfil-usuario-main">
          <div className="erro-container">
            <p>{mensagem || '❌ Erro ao carregar perfil.'}</p>
            <button onClick={() => navigate('/')}>Voltar para Home</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="perfil-usuario-wrapper">
      <Header />

      <div className="perfil-patinhas-background">
        <PatasAleatorias quantidade={20} />
      </div>

      <main className="perfil-usuario-main">
        <h1>Meu Perfil</h1>

        <section className="perfil-info-basica">
          <div className="perfil-foto-container">
            <img 
              src={usuario.fotoPerfil} 
              alt="Foto de Perfil" 
              className="perfil-foto" 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}&background=7c428f&color=fff&size=150`;
              }}
            />
            <button className="btn-editar-foto" onClick={handleEditarFoto}>
              <FontAwesomeIcon icon={faEdit} />
            </button>
          </div>
          
          <div className="perfil-detalhes">
            <h2>{usuario.nome}</h2>
            <p><strong>Email:</strong> {usuario.email}</p>
            {usuario.telefone && <p><strong>Telefone:</strong> {usuario.telefone}</p>}
            {(usuario.cidade || usuario.estado) && (
              <p><strong>Localização:</strong> {usuario.cidade} {usuario.estado ? `- ${usuario.estado}` : ''}</p>
            )}
            
            <div className="perfil-acoes-rapidas">
              <button className="btn-editar-perfil" onClick={handleEditProfile}>
                <FontAwesomeIcon icon={faEdit} /> Editar Perfil
              </button>
              <button className="btn-voltar-home" onClick={() => navigate('/')}>
                <FontAwesomeIcon icon={faHome} /> Voltar para Home
              </button>
            </div>
          </div>
        </section>

        <section className="perfil-relatorio">
          <h2>Minhas Atividades</h2>

          <div className="relatorio-cards">
            {/* Pets Apadrinhados */}
            <div className="relatorio-card" onClick={handleVerApadrinhamentos}>
              <div className="relatorio-card-header">
                <FontAwesomeIcon icon={faHeart} className="relatorio-icon" />
                <h3>Pets Apadrinhados</h3>
              </div>
              <div className="relatorio-card-body">
                <p className="relatorio-numero">{estatisticas.apadrinhamentosCount}</p>
                <p className="relatorio-texto">{estatisticas.apadrinhamentosCount === 1 ? 'pet apadrinhado' : 'pets apadrinhados'}</p>
              </div>
              <div className="relatorio-card-footer">
                <button className="btn-ver-detalhes">
                  Ver Detalhes →
                </button>
              </div>
            </div>

            {/* Doações Realizadas */}
            <div className="relatorio-card" onClick={handleVerDoacoes}>
              <div className="relatorio-card-header">
                <FontAwesomeIcon icon={faDonate} className="relatorio-icon" />
                <h3>Doações Realizadas</h3>
              </div>
              <div className="relatorio-card-body">
                <p className="relatorio-numero">{estatisticas.doacoesCount}</p>
                <p className="relatorio-texto">{estatisticas.doacoesCount === 1 ? 'doação' : 'doações'}</p>
                <p className="relatorio-valor">Total: R$ {estatisticas.doacoesTotal.toFixed(2)}</p>
              </div>
              <div className="relatorio-card-footer">
                <button className="btn-ver-detalhes">
                  Ver Histórico →
                </button>
              </div>
            </div>

            {/* Pets Adotados */}
            <div className="relatorio-card" onClick={handleVerAdocoes}>
              <div className="relatorio-card-header">
                <FontAwesomeIcon icon={faPaw} className="relatorio-icon" />
                <h3>Pets Adotados</h3>
              </div>
              <div className="relatorio-card-body">
                <p className="relatorio-numero">{estatisticas.adocoesCount}</p>
                <p className="relatorio-texto">{estatisticas.adocoesCount === 1 ? 'pet adotado' : 'pets adotados'}</p>
              </div>
              <div className="relatorio-card-footer">
                <button className="btn-ver-detalhes">
                  Ver Adoções →
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="perfil-acoes">
          <button className="btn-logout" onClick={handleLogout}>
            <FontAwesomeIcon icon={faSignOutAlt} /> Sair
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}