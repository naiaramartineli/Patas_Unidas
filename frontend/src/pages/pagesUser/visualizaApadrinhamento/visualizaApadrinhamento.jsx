// frontend/src/pages/pagesUser/visualizaApadrinhamento/VisualizaApadrinhamento.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faTimes,
  faArrowLeft,
  faBan,
  faFileAlt,
  faHeart,
  faCalendar,
  faMoneyBillWave
} from "@fortawesome/free-solid-svg-icons";
import { userService } from "../../../services/userService";
import "./visualizaApadrinhamento.css";

export default function VisualizaApadrinhamento() {
  const navigate = useNavigate();
  const [apadrinhamentos, setApadrinhamentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupPetName, setPopupPetName] = useState("");
  const [apadrinhamentoParaCancelar, setApadrinhamentoParaCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);

  useEffect(() => {
    const fetchApadrinhamentos = async () => {
      try {
        setLoading(true);
        setError("");

        // Buscar apadrinhamentos do usuário usando o serviço
        const data = await userService.getMySponsorships();
        
        // Processar dados para formato esperado
        const apadrinhamentosFormatados = Array.isArray(data) ? data : (data.apadrinhamentos || []);
        
        // Filtrar apenas ativos
        const ativos = apadrinhamentosFormatados.filter(
          a => a.status === "ativo" || a.status === "Ativo" || a.status === 1
        );

        setApadrinhamentos(ativos);
      } catch (err) {
        console.error("Erro ao buscar apadrinhamentos:", err);
        setError("❌ Não foi possível carregar seus apadrinhamentos.");
        
        // Se erro de autenticação, redirecionar
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApadrinhamentos();
  }, [navigate]);

  const calcularProximoApadrinhamento = (dataInicio) => {
    if (!dataInicio) return "—";

    try {
      const hoje = new Date();
      const data = new Date(dataInicio);

      // Garantir que a data é válida
      if (isNaN(data.getTime())) return "—";

      // Avançar meses até encontrar uma data futura
      while (data <= hoje) {
        data.setMonth(data.getMonth() + 1);
      }

      return data.toLocaleDateString("pt-BR");
    } catch (e) {
      console.error("Erro ao calcular próxima data:", e);
      return "—";
    }
  };

  const abrirConfirmacaoCancelamento = (apad) => {
    setApadrinhamentoParaCancelar(apad);
  };

  const confirmarCancelamento = async () => {
    if (!apadrinhamentoParaCancelar) return;

    try {
      setCancelando(true);
      
      // TODO: Implementar serviço de cancelamento quando disponível
      // Por enquanto, simular sucesso
      setTimeout(() => {
        // Remover do front
        setApadrinhamentos(prev =>
          prev.filter(a => a.id !== apadrinhamentoParaCancelar.id)
        );

        setPopupPetName(
          apadrinhamentoParaCancelar.nome ||
          apadrinhamentoParaCancelar.cao?.nome ||
          "Pet"
        );

        setShowPopup(true);
        setApadrinhamentoParaCancelar(null);
        setCancelando(false);
      }, 1000);

    } catch (error) {
      console.error("Erro ao cancelar apadrinhamento:", error);
      alert("Erro ao cancelar apadrinhamento. Tente novamente.");
      setCancelando(false);
    }
  };

  const cancelarConfirmacao = () => {
    setApadrinhamentoParaCancelar(null);
  };

  const fecharPopup = () => setShowPopup(false);

  const verRelatorios = (id) => {
    navigate(`/relatorio-apadrinhamento/${id}`, {
      state: { apadrinhamentoId: id }
    });
  };

  const formatarData = (data) => {
    if (!data) return "—";
    try {
      return new Date(data).toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };

  const formatarValor = (v) => {
    const valor = Number(v) || 0;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const corrigirURL = (foto_url) => {
    if (!foto_url) return "/assets/doguinho-default.jpg";
    if (foto_url.startsWith("http")) return foto_url;
    if (foto_url.startsWith("/uploads")) return `http://localhost:3001${foto_url}`;
    if (foto_url.startsWith("uploads")) return `http://localhost:3001/${foto_url}`;
    return `http://localhost:3001/uploads/caes/${foto_url}`;
  };

  if (loading) {
    return (
      <div className="visualiza-apadrinhamento-wrapper">
        <Header />
        <div className="apadrinhamento-patinhas-background">
          <PatasAleatorias quantidade={18} />
        </div>
        <main className="visualiza-apadrinhamento-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando seus apadrinhamentos...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="visualiza-apadrinhamento-wrapper">
      <Header />

      <div className="apadrinhamento-patinhas-background">
        <PatasAleatorias quantidade={18} />
      </div>

      <main className="visualiza-apadrinhamento-main">
        <h1>
          <FontAwesomeIcon icon={faHeart} /> Meus Apadrinhamentos
        </h1>
        
        <p className="subtitulo">
          Acompanhe todos os pets que você está ajudando e suas contribuições
        </p>

        {error && <div className="erro-mensagem">{error}</div>}

        {apadrinhamentos.length === 0 ? (
          <div className="nenhum-apadrinhamento">
            <div className="nenhum-icon">
              <FontAwesomeIcon icon={faHeart} size="4x" />
            </div>
            <h3>Você ainda não apadrinhou nenhum pet</h3>
            <p>Que tal conhecer nossos amigos que precisam de um padrinho?</p>
            <button 
              onClick={() => navigate("/vitrine-user")} 
              className="btn-primario"
            >
              <FontAwesomeIcon icon={faHeart} /> Ver Pets para Apadrinhar
            </button>
          </div>
        ) : (
          <div className="apadrinhamento-lista">
            {apadrinhamentos.map((apad) => {
              const nome = apad.nome || apad.cao?.nome || "Pet";
              const foto = corrigirURL(apad.foto || apad.cao?.foto_url);
              const desc = apad.descricao || apad.cao?.descricao || "Um pet cheio de amor esperando por você!";
              const valorMensal = Number(apad.valorMensal || apad.valor_mensal || apad.cao?.valor_apadrinhamento || 50);
              const dataInicio = apad.dataInicio || apad.data_inicio || apad.created_at;

              return (
                <div key={apad.id} className="apadrinhamento-card">
                  <div className="apadrinhamento-card-left">
                    <img
                      src={foto}
                      alt={nome}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/assets/doguinho-default.jpg";
                      }}
                    />
                  </div>

                  <div className="apadrinhamento-card-right">
                    <div className="apadrinhamento-header">
                      <h2>{nome}</h2>
                      <span className="badge-status">
                        <FontAwesomeIcon icon={faHeart} /> Ativo
                      </span>
                    </div>
                    
                    <p className="descricao">{desc}</p>

                    <div className="info-grid">
                      <div className="info-item">
                        <FontAwesomeIcon icon={faMoneyBillWave} className="info-icon" />
                        <div>
                          <span className="info-label">Valor mensal:</span>
                          <span className="info-value">{formatarValor(valorMensal)}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <FontAwesomeIcon icon={faCalendar} className="info-icon" />
                        <div>
                          <span className="info-label">Início:</span>
                          <span className="info-value">{formatarData(dataInicio)}</span>
                        </div>
                      </div>

                      <div className="info-item">
                        <FontAwesomeIcon icon={faCalendar} className="info-icon" />
                        <div>
                          <span className="info-label">Próximo pagamento:</span>
                          <span className="info-value highlight">
                            {calcularProximoApadrinhamento(dataInicio)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="apadrinhamento-acoes">
                      <button
                        className="btn-relatorios"
                        onClick={() => verRelatorios(apad.id)}
                      >
                        <FontAwesomeIcon icon={faFileAlt} /> Ver Relatórios
                      </button>

                      <button
                        className="btn-cancelar-apad"
                        onClick={() => abrirConfirmacaoCancelamento(apad)}
                        disabled={cancelando}
                      >
                        <FontAwesomeIcon icon={faBan} />
                        {cancelando ? "Cancelando..." : "Cancelar Apadrinhamento"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="botoes-navegacao">
          <button className="btn-voltar" onClick={() => navigate("/perfil")}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao Perfil
          </button>
          
          {apadrinhamentos.length > 0 && (
            <button 
              onClick={() => navigate("/vitrine-user")} 
              className="btn-novo-apadrinhamento"
            >
              <FontAwesomeIcon icon={faHeart} /> Apadrinhar Outro Pet
            </button>
          )}
        </div>
      </main>

      <Footer />

      {/* Modal Confirmar Cancelamento */}
      {apadrinhamentoParaCancelar && (
        <div className="popup-overlay" onClick={cancelarConfirmacao}>
          <div className="popup-content confirmacao" onClick={(e) => e.stopPropagation()}>
            <div className="popup-header">
              <FontAwesomeIcon icon={faBan} size="2x" />
              <h2>Confirmar Cancelamento</h2>
            </div>
            
            <p>
              Tem certeza que deseja cancelar o apadrinhamento de{" "}
              <strong>
                {apadrinhamentoParaCancelar.nome || apadrinhamentoParaCancelar.cao?.nome}
              </strong>
              ?
            </p>
            
            <p className="popup-detalhes">
              Valor mensal: {formatarValor(apadrinhamentoParaCancelar.valorMensal || apadrinhamentoParaCancelar.valor_mensal)}
            </p>

            <div className="popup-acoes">
              <button
                className="btn-confirmar"
                onClick={confirmarCancelamento}
                disabled={cancelando}
              >
                <FontAwesomeIcon icon={faCheck} /> {cancelando ? "Cancelando..." : "Sim, Cancelar"}
              </button>

              <button
                className="btn-cancelar-modal"
                onClick={cancelarConfirmacao}
                disabled={cancelando}
              >
                <FontAwesomeIcon icon={faTimes} /> Não, Manter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Popup de Agradecimento */}
      {showPopup && (
        <div className="popup-overlay" onClick={fecharPopup}>
          <div className="popup-content agradecimento">
            <div className="popup-header">
              <FontAwesomeIcon icon={faHeart} size="2x" color="#7c428f" />
              <h2>Obrigado pelo seu carinho! 💜</h2>
            </div>
            
            <p>
              Agradecemos pelo tempo que você apadrinhou{" "}
              <strong>{popupPetName}</strong>. Seu apoio fez toda a diferença na vida deste pet!
            </p>
            
            <p className="popup-info">
              Você pode voltar a apadrinhar a qualquer momento através da nossa vitrine.
            </p>

            <div className="popup-acoes">
              <button className="btn-fechar-popup" onClick={fecharPopup}>
                Fechar
              </button>
              <button 
                className="btn-vitrine" 
                onClick={() => {
                  fecharPopup();
                  navigate("/vitrine-user");
                }}
              >
                Ver Outros Pets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}