import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { useCaes } from '../../../hooks/useCaes';
import { useAdocoes } from '../../../hooks/useAdocoes';
import { userService } from '../../../services/userService';
import Header from '../../../components/Header';
import DogSection from '../../../components/dogSection/DogSection';
import CardsSection from '../../../components/CardSection/CardSection';
import QuemSomos from '../../../components/quemSomos/QuemSomos';
import FeedbacksCarousel from '../../../components/feedback/FeedbacksCarousel';
import Footer from '../../../components/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import './HomeAdm.css';

export default function HomeAdm() {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const { caes, loading: loadingCaes, getStats: getCaesStats } = useCaes();
  const { stats: statsAdocoes, buscarEstatisticas } = useAdocoes();
  
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalAdmins: 0,
    totalCaes: 0,
    caesDisponiveis: 0,
    totalAdocoes: 0,
    adocoesPendentes: 0
  });
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário é admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      // Carregar estatísticas de usuários
      const userStats = await userService.getStats();
      
      // Carregar estatísticas de cães
      const caesStats = await getCaesStats();
      
      // Carregar estatísticas de adoções
      await buscarEstatisticas();
      
      setStats({
        totalUsuarios: userStats?.total_usuarios || 0,
        totalAdmins: userStats?.total_admins || 0,
        totalCaes: caesStats?.total_caes || 0,
        caesDisponiveis: caesStats?.disponiveis || 0,
        totalAdocoes: statsAdocoes?.total_adocoes || 0,
        adocoesPendentes: statsAdocoes?.pendentes || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const irParaCadastro = () => {
    navigate('/admin/cadastro');
  };

  const irParaGerenciamento = (path) => {
    navigate(`/admin${path}`);
  };

  return (
    <div className="home-adm">
      {/* Patinhas decorativas no fundo */}
      <div className="home-adm-patinhas-bg">
        <PatasAleatorias quantidade={20} />
      </div>

      {/* Cabeçalho personalizado para admin */}
      <Header 
        user={user} 
        isAuthenticated={true} 
        isAdmin={true}
        onLogout={handleLogout}
      />

      {/* Seção de boas-vindas */}
      <section className="home-adm-welcome">
        <div className="home-adm-welcome-content">
          <h1>Bem-vindo(a), {user?.nome}!</h1>
          <p className="home-adm-subtitle">
            Painel Administrativo - Patas Unidas
          </p>
          <p className="home-adm-descricao">
            Gerencie adoções, usuários, cães e muito mais através do painel administrativo.
          </p>
        </div>
      </section>

      {/* Estatísticas rápidas */}
      <section className="home-adm-stats">
        <div className="home-adm-container">
          <h2>Estatísticas do Sistema</h2>
          
          {loading ? (
            <div className="home-adm-loading">
              <div className="spinner"></div>
              <p>Carregando estatísticas...</p>
            </div>
          ) : (
            <div className="home-adm-stats-grid">
              <div className="home-adm-stat-card">
                <div className="home-adm-stat-icon">👥</div>
                <div className="home-adm-stat-content">
                  <h3>{stats.totalUsuarios}</h3>
                  <p>Usuários</p>
                </div>
              </div>
              
              <div className="home-adm-stat-card">
                <div className="home-adm-stat-icon">👑</div>
                <div className="home-adm-stat-content">
                  <h3>{stats.totalAdmins}</h3>
                  <p>Administradores</p>
                </div>
              </div>
              
              <div className="home-adm-stat-card">
                <div className="home-adm-stat-icon">🐕</div>
                <div className="home-adm-stat-content">
                  <h3>{stats.totalCaes}</h3>
                  <p>Cães Cadastrados</p>
                </div>
              </div>
              
              <div className="home-adm-stat-card">
                <div className="home-adm-stat-icon">🏠</div>
                <div className="home-adm-stat-content">
                  <h3>{stats.caesDisponiveis}</h3>
                  <p>Cães para Adoção</p>
                </div>
              </div>
              
              <div className="home-adm-stat-card">
                <div className="home-adm-stat-icon">📋</div>
                <div className="home-adm-stat-content">
                  <h3>{stats.totalAdocoes}</h3>
                  <p>Total de Adoções</p>
                </div>
              </div>
              
              <div className="home-adm-stat-card">
                <div className="home-adm-stat-icon">⏳</div>
                <div className="home-adm-stat-content">
                  <h3>{stats.adocoesPendentes}</h3>
                  <p>Adoções Pendentes</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Acesso rápido */}
      <section className="home-adm-quick-access">
        <div className="home-adm-container">
          <h2>Acesso Rápido</h2>
          <div className="home-adm-access-grid">
            <button 
              className="home-adm-access-card"
              onClick={() => irParaGerenciamento('/usuarios')}
            >
              <div className="home-adm-access-icon">👥</div>
              <h4>Gerenciar Usuários</h4>
              <p>Visualize e gerencie todos os usuários do sistema</p>
            </button>
            
            <button 
              className="home-adm-access-card"
              onClick={() => irParaGerenciamento('/caes')}
            >
              <div className="home-adm-access-icon">🐕</div>
              <h4>Gerenciar Cães</h4>
              <p>Cadastre e gerencie cães disponíveis para adoção</p>
            </button>
            
            <button 
              className="home-adm-access-card"
              onClick={() => irParaGerenciamento('/adocoes')}
            >
              <div className="home-adm-access-icon">📋</div>
              <h4>Solicitações de Adoção</h4>
              <p>Aprove ou recuse solicitações de adoção</p>
            </button>
            
            <button 
              className="home-adm-access-card"
              onClick={() => irParaGerenciamento('/racas')}
            >
              <div className="home-adm-access-icon">🏷️</div>
              <h4>Gerenciar Raças</h4>
              <p>Adicione e gerencie as raças do sistema</p>
            </button>
            
            <button 
              className="home-adm-access-card"
              onClick={() => irParaGerenciamento('/vacinas')}
            >
              <div className="home-adm-access-icon">💉</div>
              <h4>Gerenciar Vacinas</h4>
              <p>Controle o registro de vacinas dos cães</p>
            </button>
            
            <button 
              className="home-adm-access-card"
              onClick={() => irParaGerenciamento('/relatorios')}
            >
              <div className="home-adm-access-icon">📊</div>
              <h4>Relatórios</h4>
              <p>Visualize relatórios e estatísticas detalhadas</p>
            </button>
          </div>
        </div>
      </section>

      {/* Últimas adoções pendentes */}
      <section className="home-adm-pending">
        <div className="home-adm-container">
          <h2>Adoções Recentes</h2>
          <div className="home-adm-pending-content">
            <p>Gerencie as solicitações de adoção mais recentes.</p>
            <button 
              className="home-adm-btn-primary"
              onClick={() => irParaGerenciamento('/adocoes')}
            >
              Ver Todas as Solicitações
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}