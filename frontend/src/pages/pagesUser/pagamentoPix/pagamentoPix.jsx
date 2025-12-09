// frontend/src/pages/pagesUser/pagamentoPix/PagamentoPix.jsx
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import "./PagamentoPix.css";

export default function PagamentoPix() {
  const location = useLocation();
  const navigate = useNavigate();
  const { valor, descricao, tipo, origem } = location.state || {};
  
  const [qrCode, setQrCode] = useState("");
  const [copiaCola, setCopiaCola] = useState("");
  const [loading, setLoading] = useState(false);
  const [pagamentoProcessado, setPagamentoProcessado] = useState(false);
  const [erro, setErro] = useState("");

  const gerarPix = async () => {
    setLoading(true);
    setErro("");

    try {
      // TODO: Substituir por serviço de pagamento quando disponível
      // Simulação de geração de PIX
      setTimeout(() => {
        const valorFinal = valor || 20;
        const descricaoFinal = descricao || "Doação Patas Unidas";
        const idInterno = `PIX_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Gerar QR Code fictício (base64 de uma imagem placeholder)
        const qrCodePlaceholder = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjI1MCIgdmlld0JveD0iMCAwIDI1MCAyNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjI1MCIgaGVpZ2h0PSIyNTAiIHJ4PSIyMCIgZmlsbD0iIzZEM0E3RSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+UElYICR7dmFsb3JGaW5hbH08L3RleHQ+PC9zdmc+";
        
        setQrCode(qrCodePlaceholder);
        setCopiaCola(`00020126580014br.gov.bcb.pix0136${idInterno}520400005303986540${valorFinal.toFixed(2)}5802BR5913Patas Unidas6009Sao Paulo62070503***6304`);
        
        // Simular confirmação de pagamento após 10 segundos
        setTimeout(() => {
          setPagamentoProcessado(true);
          setLoading(false);
        }, 10000);
        
      }, 1500);

    } catch (err) {
      console.error("Erro ao gerar PIX:", err);
      setErro("Erro ao gerar pagamento PIX. Tente novamente.");
      setLoading(false);
    }
  };

  const copiarCodigo = () => {
    navigator.clipboard.writeText(copiaCola)
      .then(() => {
        alert("Código PIX copiado para a área de transferência!");
      })
      .catch(() => {
        alert("Não foi possível copiar o código. Tente selecionar e copiar manualmente.");
      });
  };

  const voltarOrigem = () => {
    if (origem === 'doacao') {
      navigate('/doacao');
    } else if (origem === 'apadrinhamento') {
      navigate('/apadrinhamento');
    } else {
      navigate('/pagamento');
    }
  };

  const irParaConfirmacao = () => {
    navigate('/pagamento/confirmacao', {
      state: {
        tipo: tipo || 'doacao',
        valor: valor || 20,
        metodo: 'PIX',
        data: new Date().toISOString(),
        status: 'aprovado'
      }
    });
  };

  return (
    <div className="pix-wrapper">
      <Header />

      <div className="pix-patinhas-background">
        <PatasAleatorias quantidade={15} />
      </div>

      <div className="pix-container">
        <div className="pix-header">
          <h1>Pagamento via PIX</h1>
          {descricao && <p className="pix-descricao">{descricao}</p>}
          {valor && <p className="pix-valor">Valor: <strong>R$ {valor.toFixed(2)}</strong></p>}
        </div>

        {erro && (
          <div className="pix-erro">
            <p>{erro}</p>
            <button onClick={gerarPix}>Tentar Novamente</button>
          </div>
        )}

        {pagamentoProcessado ? (
          <div className="pix-confirmacao">
            <div className="confirmacao-icon">✅</div>
            <h2>Pagamento Confirmado!</h2>
            <p>Obrigado pela sua contribuição! Seu pagamento via PIX foi processado com sucesso.</p>
            <div className="confirmacao-detalhes">
              <p><strong>Valor:</strong> R$ {valor || 20}</p>
              <p><strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}</p>
              <p><strong>Status:</strong> Aprovado</p>
            </div>
            <div className="confirmacao-botoes">
              <button onClick={irParaConfirmacao}>Ver Comprovante</button>
              <button onClick={() => navigate('/')} className="btn-secundario">Voltar para Home</button>
            </div>
          </div>
        ) : !qrCode ? (
          <div className="pix-gerar">
            <div className="pix-info">
              <h3>Instruções para pagamento:</h3>
              <ol>
                <li>Clique em "Gerar QR Code"</li>
                <li>Escaneie o QR Code com seu app bancário</li>
                <li>Confira os dados e confirme o pagamento</li>
                <li>Aguarde a confirmação automática</li>
              </ol>
            </div>
            
            <button 
              className="btn-gerar" 
              onClick={gerarPix} 
              disabled={loading}
            >
              {loading ? "Gerando PIX..." : "Gerar QR Code"}
            </button>
            
            <button 
              onClick={voltarOrigem} 
              className="btn-voltar-pix"
            >
              Voltar
            </button>
          </div>
        ) : (
          <div className="pix-box">
            <h3>Escaneie o QR Code com seu app bancário</h3>
            
            <div className="qr-code-container">
              <img
                src={qrCode}
                className="qr-code"
                alt="QR Code PIX"
              />
            </div>

            <p className="pix-valor-display">
              Valor: <strong>R$ {valor || 20}</strong>
            </p>

            <div className="pix-copia-cola">
              <p className="pix-label">Ou copie o código PIX:</p>
              <textarea 
                className="pix-copia" 
                value={copiaCola} 
                readOnly 
                rows="4"
              />
              
              <div className="pix-acoes">
                <button className="btn-copiar" onClick={copiarCodigo}>
                  Copiar Código PIX
                </button>
                <button className="btn-voltar-pix" onClick={() => setQrCode("")}>
                  Gerar Novo QR Code
                </button>
              </div>
            </div>

            <div className="pix-status">
              {loading ? (
                <div className="status-carregando">
                  <div className="spinner"></div>
                  <p>Aguardando confirmação do pagamento...</p>
                  <small>Isso pode levar alguns segundos</small>
                </div>
              ) : (
                <div className="status-aguardando">
                  <p>✅ QR Code gerado com sucesso</p>
                  <small>Escaneie com seu app bancário para pagar</small>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}