// frontend/src/pages/pagesUser/apadrinhamento/Apadrinhamento.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import { FaHeart, FaDog } from "react-icons/fa";
import Confetti from "react-confetti";
import { adocaoService } from "../../../services/adocaoService";
import { caoService } from "../../../services/caoService";
import "./Apadrinhamento.css";

function useWindowSize() {
  const [size, setSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  useEffect(() => {
    const handleResize = () =>
      setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return size;
}

export default function Apadrinhamento() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [cachorroSelecionado, setCachorroSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { width, height } = useWindowSize();

  const [mostrarPopupPix, setMostrarPopupPix] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [pagamentoId, setPagamentoId] = useState(null);
  const [mostrarPopupFinal, setMostrarPopupFinal] = useState(false);
  const [mostrarPopupAdocao, setMostrarPopupAdocao] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // Buscar cachorro
  useEffect(() => {
    const fetchCachorro = async () => {
      try {
        setLoading(true);
        
        if (location.state?.cachorroSelecionado) {
          setCachorroSelecionado(location.state.cachorroSelecionado);
          setLoading(false);
          return;
        }

        if (id) {
          const data = await caoService.findOne(id);
          setCachorroSelecionado({
            id: data.id,
            nome: data.nome,
            img: data.foto_url,
            sexo: data.sexo,
            porte: data.porte,
            idade: data.idade,
            cor: data.pelagem,
            comportamento: data.comportamento,
            resumo: data.descricao,
            valorApadrinhamento: data.valor_apadrinhamento || 50,
          });
        }
      } catch (err) {
        setError(err.message);
        console.error("Erro ao buscar cachorro:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCachorro();
  }, [id, location.state]);

  const abrirPagamentoPix = async () => {
    try {
      setMostrarPopupPix(true);
      
      // TODO: Integrar com serviço de pagamento PIX
      const response = await fetch("http://localhost:3001/pix/gerar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          valor: cachorroSelecionado.valorApadrinhamento,
          descricao: `Apadrinhamento de ${cachorroSelecionado.nome}`,
        }),
      });

      const data = await response.json();
      setQrCodeData(data.qrCodeBase64);
      setPagamentoId(data.id);
      verificarStatusPagamento(data.id);
    } catch (error) {
      console.error("Erro ao gerar PIX:", error);
    }
  };

  const verificarStatusPagamento = (id) => {
    const interval = setInterval(async () => {
      const res = await fetch(`http://localhost:3001/pix/status/${id}`);
      const data = await res.json();

      if (data.status === "approved") {
        clearInterval(interval);
        setMostrarPopupPix(false);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
        setMostrarPopupFinal(true);
      }
    }, 2000);
  };

  const solicitarAdocao = async () => {
    try {
      await adocaoService.solicitarAdocao(
        cachorroSelecionado.id,
        "Solicitação via botão de adoção na página de apadrinhamento"
      );
      setMostrarPopupAdocao(true);
    } catch (error) {
      console.error("Erro ao solicitar adoção:", error);
      alert("Erro ao solicitar adoção. Tente novamente.");
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <p style={{ color: "#7c428f" }}>Carregando pet...</p>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !cachorroSelecionado) {
    return (
      <>
        <Header />
        <main style={{ padding: "2rem", textAlign: "center" }}>
          <p>Erro ao carregar dados: {error}</p>
          <button onClick={() => navigate("/vitrine-user")}>Voltar para a vitrine</button>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <div className="apadrinhamento-wrapper">
      <Header />
      <div className="apadrinhamento-patinhas-background">
        <PatasAleatorias quantidade={20} />
      </div>

      <main className="apadrinhamento-conteudo">
        <div className="apadrinhamento-step0-container">
          <div className="card-imagem-cachorro">
            <img src={cachorroSelecionado.img} alt={cachorroSelecionado.nome} />
            <div className="nome-cachorro">{cachorroSelecionado.nome}</div>
          </div>

          <div className="apadrinhamento-card-info">
            <h2>{cachorroSelecionado.nome}</h2>
            <p>
              Sexo: {cachorroSelecionado.sexo} <br />
              Porte: {cachorroSelecionado.porte} <br />
              Idade: {cachorroSelecionado.idade} <br />
              Cor: {cachorroSelecionado.cor} <br />
              Comportamento: {cachorroSelecionado.comportamento}
            </p>

            <div className="apadrinhamento-botoes">
              <button
                className="apadrinhamento-btn-apadrinhar"
                onClick={abrirPagamentoPix}
              >
                <FaHeart style={{ marginRight: "8px" }} />
                Apadrinhar (R$ {cachorroSelecionado.valorApadrinhamento})
              </button>

              <button
                className="apadrinhamento-btn-adotar"
                onClick={solicitarAdocao}
              >
                <FaDog style={{ marginRight: "8px" }} />
                Solicitar Adoção
              </button>
            </div>
          </div>
        </div>

        {showConfetti && (
          <Confetti width={width} height={height} recycle={false} numberOfPieces={800} />
        )}
      </main>

      <Footer />

      {/* Popup PIX */}
      {mostrarPopupPix && (
        <div className="pix-popup-overlay">
          <div className="pix-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Pagamento via PIX</h2>
            <p><strong>{cachorroSelecionado.nome}</strong></p>
            <p>Valor: <strong>R$ {cachorroSelecionado.valorApadrinhamento},00</strong></p>
            
            {qrCodeData ? (
              <img
                src={qrCodeData}
                alt="QR Code"
                className="qr-code-image"
              />
            ) : (
              <p>Gerando QR Code...</p>
            )}

            <button onClick={() => setMostrarPopupPix(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Popup Final */}
      {mostrarPopupFinal && (
        <div className="pix-popup-overlay">
          <div className="pix-popup">
            <h2>🎉 Obrigado pelo Apadrinhamento! 🎉</h2>
            <p>
              Seu apoio transforma a vida de <strong>{cachorroSelecionado.nome}</strong> 💜
            </p>
            <p>
              Próxima mensalidade:{" "}
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("pt-BR")}
            </p>
            
            <button onClick={() => {
              setMostrarPopupFinal(false);
              navigate("/vitrine-user");
            }}>
              Voltar para a Vitrine
            </button>

            <button onClick={() => {
              setMostrarPopupFinal(false);
              navigate("/visualiza-apadrinhamento");
            }}>
              Meus Apadrinhamentos
            </button>
          </div>
        </div>
      )}

      {/* Popup Adoção */}
      {mostrarPopupAdocao && (
        <div className="pix-popup-overlay" onClick={() => setMostrarPopupAdocao(false)}>
          <div className="pix-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Solicitação Enviada!</h2>
            <p>
              Sua solicitação de adoção para <strong>{cachorroSelecionado.nome}</strong> foi enviada.
              Nossa equipe entrará em contato em breve!
            </p>
            <button onClick={() => setMostrarPopupAdocao(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}