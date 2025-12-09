import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../../../../components/Header/Header';
import Footer from '../../../../components/footer/footer';
import PatasAleatorias from '../../components/patas/PatasAleatorias';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faPaw, 
  faHandHoldingHeart, 
  faDonate, 
  faSignOutAlt,
  faUser,
  faSpinner
} from '@fortawesome/free-solid-svg-icons';
import './PerfilUsuario.css';

// Hook para buscar dados do usuário
const usePerfilUsuario = () => {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const carregarDados = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        navigate('/login');
        return;
      }

      // Carregar dados em paralelo para melhor performance
      const [userRes, apadrinhamentosRes, doacoesRes, adocoesRes] = await Promise.allSettled([
        fetch(`https://sua-api.com/api/usuarios/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://sua-api.com/api/apadrinhamentos/usuario/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://sua-api.com/api/doacoes/usuario/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch(`https://sua-api.com/api/adocoes/usuario/${userId}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      // Processar dados do usuário
      if (userRes.status === 'rejected') throw new Error('Erro ao buscar dados do usuário');
      const userData = await userRes.value.json();

      // Processar apadrinhamentos
      const apadrinhamentosData = apadrinhamentosRes.status === 'fulfilled' 
        ? await apadrinhamentosRes.value.json()
        : [];

      // Processar doações
      const doacoesData = doacoesRes.status === 'fulfilled'
        ? await doacoesRes.value.json()
        : { total: 0, quantidade: 0, doacoes: [] };

      // Processar adoções
      const adocoesData = adocoesRes.status === 'fulfilled'
        ? await adocoesRes.value.json()
        : [];

      // Montar objeto do usuário
      setUsuario({
        id: userData.id_usuario || userData.id,
        nome: userData.nome || "Usuário",
        email: userData.email || "",
        telefone: userData.telefone || "",
        cidade: userData.cidade || "",
        estado: userData.estado || "",
        fotoPerfil: userData.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.nome || 'U')}&background=7c428f&color=fff&size=150`,
        petsApadrinhados: apadrinhamentosData.map(a => ({
          id: a.cachorroId || a.id_cao,
          nome: a.cachorro?.nome || a.nome || 'Pet',
          foto: a.cachorro?.imagem || a.imagem || '/assets/doguinho-default.jpg',
          dataInicio: a.data_inicio,
        })),
        doacoesRealizadas: doacoesData.quantidade || 0,
        valorTotalDoado: doacoesData.total || 0,
        doacoes: doacoesData.doacoes || [],
        petsAdotados: adocoesData.map(ad => ({
          id: ad.cachorroId || ad.id_cao,
          nome: ad.cachorro?.nome || ad.nome || 'Pet',
          foto: ad.cachorro?.imagem || ad.imagem || '/assets/doguinho-default.jpg',
          dataAdocao: ad.data_adocao,
        })),
        ultimaAtividade: userData.ultima_atividade,
        dataCadastro: userData.data_cadastro,
      });

      setErro(false);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      setMensagem('❌ Erro ao carregar perfil. Tente novamente.');
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return {
    usuario,
    loading,
    erro,
    mensagem,
    recarregar: carregarDados,
  };
};

// Componente de header do perfil
const PerfilHeader = ({ usuario, onEditProfile, onEditFoto }) => (
  <section className="perfil-info-basica">
    <div className="perfil-foto-container">
      <img 
        src={usuario.fotoPerfil} 
        alt={`Foto de ${usuario.nome}`} 
        className="perfil-foto"
        loading="lazy"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}&background=7c428f&color=fff`;
        }}
      />
      <button 
        className="btn-editar-foto" 
        onClick={onEditFoto}
        aria-label="Alterar foto de perfil"
      >
        <FontAwesomeIcon icon={faEdit} />
      </button>
    </div>
    
    <div className="perfil-detalhes">
      <h1 className="perfil-nome">{usuario.nome}</h1>
      <div className="perfil-info-lista">
        <p className="perfil-info-item">
          <strong>Email:</strong> {usuario.email}
        </p>
        {usuario.telefone && (
          <p className="perfil-info-item">
            <strong>Telefone:</strong> {usuario.telefone}
          </p>
        )}
        {usuario.cidade && usuario.estado && (
          <p className="perfil-info-item">
            <strong>Localização:</strong> {usuario.cidade} - {usuario.estado}
          </p>
        )}
        {usuario.dataCadastro && (
          <p className="perfil-info-item">
            <strong>Membro desde:</strong> {new Date(usuario.dataCadastro).toLocaleDateString('pt-BR')}
          </p>
        )}
      </div>
      
      <button 
        className="btn-editar-perfil" 
        onClick={onEditProfile}
        aria-label="Editar perfil"
      >
        <FontAwesomeIcon icon={faEdit} /> Editar Perfil
      </button>
    </div>
  </section>
);

// Card de estatística
const EstatisticaCard = ({ 
  icon, 
  title, 
  value, 
  subtitle,
  onClick,
  children,
  className = ""
}) => (
  <div 
    className={`relatorio-card ${className}`.trim()}
    onClick={onClick}
    role={onClick ? "button" : "article"}
    tabIndex={onClick ? 0 : -1}
    onKeyDown={(e) => onClick && e.key === 'Enter' && onClick()}
  >
    <FontAwesomeIcon icon={icon} className="relatorio-icon" />
    <h3 className="relatorio-card-title">{title}</h3>
    <div className="relatorio-card-value">{value}</div>
    {subtitle && <p className="relatorio-card-subtitle">{subtitle}</p>}
    {children}
  </div>
);

EstatisticaCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  onClick: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
};

// Lista de pets (miniaturas)
const PetsLista = ({ pets, title, emptyMessage, onPetClick, className = "" }) => (
  <div className={`pets-lista ${className}`.trim()}>
    <h4 className="pets-lista-title">{title}</h4>
    {pets.length > 0 ? (
      <div className="pets-lista-container">
        {pets.slice(0, 3).map(pet => (
          <div 
            key={pet.id}
            className="pet-miniatura"
            onClick={() => onPetClick?.(pet)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onPetClick?.(pet)}
            aria-label={`Ver detalhes de ${pet.nome}`}
          >
            <img 
              src={pet.foto} 
              alt={pet.nome}
              loading="lazy"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/assets/doguinho-default.jpg';
              }}
            />
            <span className="pet-miniatura-nome">{pet.nome}</span>
          </div>
        ))}
        {pets.length > 3 && (
          <div className="pet-miniatura mais">
            <span>+{pets.length - 3}</span>
            <span>mais</span>
          </div>
        )}
      </div>
    ) : (
      <p className="pets-lista-vazia">{emptyMessage}</p>
    )}
  </div>
);

PetsLista.propTypes = {
  pets: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  emptyMessage: PropTypes.string.isRequired,
  onPetClick: PropTypes.func,
  className: PropTypes.string,
};

// Componente principal
export default function PerfilUsuario() {
  const navigate = useNavigate();
  const { usuario, loading, erro, mensagem, recarregar } = usePerfilUsuario();

  const handleEditProfile = useCallback(() => {
    navigate('/configuracoes');
  }, [navigate]);

  const handleEditarFoto = useCallback(() => {
    navigate('/configuracoes', { state: { scrollTo: 'foto' } });
  }, [navigate]);

  const handleLogout = useCallback(() => {
    // Limpar dados de autenticação
    ['authToken', 'currentUser', 'userId', 'token'].forEach(key => 
      localStorage.removeItem(key)
    );
    sessionStorage.clear();
    
    // Redirecionar para home
    navigate('/', { replace: true });
  }, [navigate]);

  const handleVerDoacoes = useCallback(() => {
    navigate('/visualiza-doacoes');
  }, [navigate]);

  const handleVerApadrinhamentos = useCallback(() => {
    navigate('/visualiza-apadrinhamento');
  }, [navigate]);

  const handleVerAdocoes = useCallback(() => {
    navigate('/visualiza-adocoes');
  }, [navigate]);

  const handlePetClick = useCallback((pet) => {
    navigate(`/pet/${pet.id}`);
  }, [navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="perfil-usuario-wrapper">
        <Header />
        <div className="perfil-patinhas-background">
          <PatasAleatorias quantidade={15} />
        </div>
        <main className="perfil-usuario-main">
          <div className="perfil-loading">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Carregando seu perfil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (erro || !usuario) {
    return (
      <div className="perfil-usuario-wrapper">
        <Header />
        <main className="perfil-usuario-main">
          <div className="perfil-erro">
            <p>{mensagem || '❌ Erro ao carregar perfil.'}</p>
            <div className="perfil-erro-acoes">
              <button 
                onClick={() => navigate('/')}
                className="btn-voltar"
              >
                Voltar para Home
              </button>
              <button 
                onClick={recarregar}
                className="btn-tentar-novamente"
              >
                Tentar Novamente
              </button>
            </div>
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
        <PerfilHeader 
          usuario={usuario}
          onEditProfile={handleEditProfile}
          onEditFoto={handleEditarFoto}
        />

        <section className="perfil-relatorio">
          <h2 className="perfil-relatorio-titulo">Minhas Atividades</h2>
          
          <div className="relatorio-cards">
            {/* Pets Apadrinhados */}
            <EstatisticaCard
              icon={faPaw}
              title="Pets Apadrinhados"
              value={usuario.petsApadrinhados.length}
              subtitle="Seus afilhados"
              onClick={handleVerApadrinhamentos}
            >
              <PetsLista
                pets={usuario.petsApadrinhados}
                title="Meus Afilhados"
                emptyMessage="Você ainda não apadrinhou nenhum pet."
                onPetClick={handlePetClick}
              />
            </EstatisticaCard>

            {/* Doações Realizadas */}
            <EstatisticaCard
              icon={faDonate}
              title="Doações Realizadas"
              value={usuario.doacoesRealizadas}
              subtitle={`Total: R$ ${usuario.valorTotalDoado.toFixed(2)}`}
              onClick={handleVerDoacoes}
            >
              {usuario.doacoesRealizadas > 0 ? (
                <button 
                  className="btn-ver-mais"
                  onClick={handleVerDoacoes}
                  aria-label="Ver histórico de doações"
                >
                  Ver Histórico
                </button>
              ) : (
                <p className="texto-vazio">Nenhuma doação realizada ainda.</p>
              )}
            </EstatisticaCard>

            {/* Pets Adotados */}
            <EstatisticaCard
              icon={faHandHoldingHeart}
              title="Pets Adotados"
              value={usuario.petsAdotados.length}
              subtitle="Seus companheiros"
              onClick={handleVerAdocoes}
            >
              <PetsLista
                pets={usuario.petsAdotados}
                title="Meus Pets"
                emptyMessage="Nenhum pet adotado ainda."
                onPetClick={handlePetClick}
              />
            </EstatisticaCard>
          </div>
        </section>

        {/* Seção de atividade recente (opcional) */}
        {usuario.ultimaAtividade && (
          <section className="perfil-atividade">
            <h3>Última Atividade</h3>
            <p className="atividade-texto">
              Sua última atividade foi em {new Date(usuario.ultimaAtividade).toLocaleDateString('pt-BR')}
            </p>
          </section>
        )}

        {/* Ações do perfil */}
        <section className="perfil-acoes">
          <button 
            className="btn-logout" 
            onClick={handleLogout}
            aria-label="Sair da conta"
          >
            <FontAwesomeIcon icon={faSignOutAlt} /> Sair
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// Versão simplificada para modais ou componentes menores
export const MiniPerfil = ({ onEdit, onLogout }) => {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados básicos do usuário
    const carregarMiniPerfil = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('currentUser') || '{}');
        setUsuario(userData);
      } finally {
        setLoading(false);
      }
    };

    carregarMiniPerfil();
  }, []);

  if (loading) {
    return (
      <div className="mini-perfil">
        <FontAwesomeIcon icon={faSpinner} spin />
        <span>Carregando...</span>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="mini-perfil">
        <FontAwesomeIcon icon={faUser} />
        <span>Usuário não encontrado</span>
      </div>
    );
  }

  return (
    <div className="mini-perfil">
      <div className="mini-perfil-info">
        <img 
          src={usuario.fotoPerfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(usuario.nome)}&background=7c428f&color=fff`}
          alt={usuario.nome}
          className="mini-perfil-foto"
        />
        <div className="mini-perfil-detalhes">
          <strong>{usuario.nome}</strong>
          <span>{usuario.email}</span>
        </div>
      </div>
      <div className="mini-perfil-acoes">
        {onEdit && (
          <button onClick={onEdit} className="btn-mini-editar">
            <FontAwesomeIcon icon={faEdit} /> Editar
          </button>
        )}
        {onLogout && (
          <button onClick={onLogout} className="btn-mini-sair">
            <FontAwesomeIcon icon={faSignOutAlt} /> Sair
          </button>
        )}
      </div>
    </div>
  );
};