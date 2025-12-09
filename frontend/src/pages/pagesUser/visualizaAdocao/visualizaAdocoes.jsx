// frontend/src/pages/pagesUser/visualizaAdocao/VisualizaAdocoes.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import {
  faHourglassHalf,
  faBan,
  faCheckCircle,
  faArrowLeft,
  faInfoCircle
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { adocaoService } from "../../../services/adocaoService";
import "./VisualizaAdocoes.css";

export default function VisualizaAdocoes() {
  const navigate = useNavigate();
  const [adocoes, setAdocoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [mostrarMotivo, setMostrarMotivo] = useState(false);
  const [motivoRecusa, setMotivoRecusa] = useState("");
  const [petSelecionado, setPetSelecionado] = useState("");

  const etapasLabels = {
    0: "Em análise",
    1: "Adoção aprovada 🎉",
    2: "Adoção recusada"
  };

  const etapaIcon = (status) => {
    switch (status) {
      case 1:
        return faCheckCircle;
      case 2:
        return faBan;
      default:
        return faHourglassHalf;
    }
  };

  // Buscar adoções do usuário
  useEffect(() => {
    const carregarAdocoes = async () => {
      try {
        setLoading(true);
        const data = await adocaoService.listarMinhasAdocoes();
        setAdocoes(data);
        setError("");
      } catch (err) {
        console.error("Erro ao buscar adoções:", err);
        setError("❌ Não foi possível carregar suas adoções.");
      } finally {
        setLoading(false);
      }
    };

    carregarAdocoes();
  }, []);

  const cancelarAdocao = async (id) => {
    if (!window.confirm("Deseja cancelar esta adoção?")) return;

    try {
      await adocaoService.cancelarAdocao(id);
      setAdocoes(prev => prev.filter(a => Number(a.id) !== Number(id)));
      alert("Adoção cancelada com sucesso!");
    } catch (err) {
      console.error("Erro ao cancelar adoção:", err);
      alert("Erro ao cancelar adoção. Tente novamente.");
    }
  };

  const abrirMotivo = (nomePet, motivo) => {
    setPetSelecionado(nomePet);
    setMotivoRecusa(motivo || "O administrador não informou o motivo.");
    setMostrarMotivo(true);
  };

  if (loading) {
    return (
      <div className="visualiza-adocoes-wrapper">
        <Header />
        <PatasAleatorias quantidade={18} />
        <main className="visualiza-adocoes-main">
          <div className="loading-container">
            <p>Carregando suas adoções...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="visualiza-adocoes-wrapper">
      <Header />
      <PatasAleatorias quantidade={18} />

      <main className="visualiza-adocoes-main">
        <h1>Minhas Adoções</h1>

        {error && <p className="erro-mensagem">{error}</p>}

        {adocoes.length === 0 ? (
          <div className="nenhuma-adocao">
            <p>Você não possui solicitações de adoção.</p>
            <button onClick={() => navigate("/vitrine-user")}>Ver pets</button>
          </div>
        ) : (
          <div className="adocao-lista">
            {adocoes.map((adocao) => (
              <div className="adocao-card" key={adocao.id}>
                <div className="adocao-card-left">
                  {adocao.cao?.foto_url ? (
                    <img src={adocao.cao.foto_url} alt={adocao.cao.nome} />
                  ) : (
                    <div className="foto-placeholder">
                      <FontAwesomeIcon icon={faHourglassHalf} size="3x" />
                    </div>
                  )}
                </div>

                <div className="adocao-card-right">
                  <h2>{adocao.cao?.nome || "Pet não encontrado"}</h2>
                  
                  <p className="etapa-status">
                    <FontAwesomeIcon icon={etapaIcon(adocao.status)} />{" "}
                    {etapasLabels[adocao.status] || "Aguardando retorno"}
                  </p>

                  {adocao.observacao && (
                    <p className="observacao">
                      <strong>Observação:</strong> {adocao.observacao}
                    </p>
                  )}

                  <div className="acoes-row">
                    {adocao.status === 2 && adocao.motivo_recusa && (
                      <button
                        className="btn-detalhes"
                        onClick={() => abrirMotivo(adocao.cao?.nome, adocao.motivo_recusa)}
                      >
                        <FontAwesomeIcon icon={faInfoCircle} /> Ver motivo da recusa
                      </button>
                    )}

                    {(adocao.status === 0 || adocao.status === 1) && (
                      <button
                        className="btn-cancelar-adocao"
                        onClick={() => cancelarAdocao(adocao.id)}
                      >
                        <FontAwesomeIcon icon={faBan} /> Cancelar Adoção
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button className="btn-voltar" onClick={() => navigate("/perfil")}>
          <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao Perfil
        </button>
      </main>

      <Footer />

      {/* Modal de motivo */}
      {mostrarMotivo && (
        <div className="modal-overlay" onClick={() => setMostrarMotivo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Motivo da Recusa</h3>
            <p><strong>{petSelecionado}</strong> não pôde ser adotado por:</p>
            <p className="motivo-texto">{motivoRecusa}</p>
            <button className="btn-fechar" onClick={() => setMostrarMotivo(false)}>
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}