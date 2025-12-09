import React, { useState, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import Stepper from "../../../components/Stepper/Stepper";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import FormularioPagamento from "../../../components/formularioPagamento/formularioPagamento";
import { FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import { caoService } from "../../../services/caoService";
import "./doacao.css";

export default function Doacao() {
  const location = useLocation();
  const navigate = useNavigate();
  const cachorroSelecionado = location.state?.cachorroSelecionado || null;

  const [currentStep, setCurrentStep] = useState(0);
  const [pagamentoSucesso, setPagamentoSucesso] = useState(null);
  const [valorDoacao, setValorDoacao] = useState("");
  const [loadingPagamento, setLoadingPagamento] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState(false);
  const [cachorroDetalhes, setCachorroDetalhes] = useState(null);

  const steps = ["Doação", "Apadrinhamento", "Pagamento", "Confirmação"];

  const valorDoacaoNumber = useMemo(() => {
    const v = parseFloat(String(valorDoacao).replace(",", "."));
    return isNaN(v) ? 0 : v;
  }, [valorDoacao]);

  // Buscar detalhes do cachorro se necessário
  React.useEffect(() => {
    const fetchCachorroDetalhes = async () => {
      if (cachorroSelecionado?.id) {
        try {
          const dados = await caoService.findOne(cachorroSelecionado.id);
          setCachorroDetalhes(dados);
        } catch (error) {
          console.error("Erro ao buscar detalhes do cachorro:", error);
        }
      }
    };

    fetchCachorroDetalhes();
  }, [cachorroSelecionado]);

  const handleStepClick = (stepIndex) => {
    if (stepIndex < currentStep) {
      setCurrentStep(stepIndex);
    }
  };

  const validarValorMinimo = () => valorDoacaoNumber >= 5;

  const handleContinuar = () => {
    if (!validarValorMinimo()) {
      alert("Por favor, insira um valor mínimo de R$ 5,00");
      return;
    }
    setCurrentStep(1);
  };

  const handlePagamentoResultado = (sucesso, dadosPagamento = null) => {
    setPagamentoSucesso(sucesso);
    setCurrentStep(3);
    if (sucesso && dadosPagamento?.mensagem) {
      setMensagem(dadosPagamento.mensagem);
      setErro(false);
    } else if (!sucesso && dadosPagamento?.erro) {
      setMensagem(dadosPagamento.erro);
      setErro(true);
    }
  };

  const handleVoltarConfirmacao = () => {
    setCurrentStep(2);
  };

  // Processar pagamento integrado com backend
  const processarPagamento = async (payloadPagamento) => {
    try {
      setLoadingPagamento(true);
      setMensagem("");
      setErro(false);

      // TODO: Implementar serviço de pagamento quando disponível
      // Por enquanto, simular sucesso após 2 segundos
      setTimeout(() => {
        const sucessoSimulado = Math.random() > 0.2; // 80% de sucesso
        if (sucessoSimulado) {
          handlePagamentoResultado(true, {
            mensagem: "Pagamento aprovado! Obrigado pela sua ajuda.",
            transacaoId: `TRX-${Date.now()}`,
            valor: valorDoacaoNumber
          });
        } else {
          handlePagamentoResultado(false, {
            erro: "Pagamento não autorizado. Verifique os dados e tente novamente."
          });
        }
        setLoadingPagamento(false);
      }, 2000);

    } catch (e) {
      console.error(e);
      handlePagamentoResultado(false, { erro: "Falha ao processar pagamento" });
      setLoadingPagamento(false);
    }
  };

  const corrigirURL = (foto_url) => {
    if (!foto_url) return "";
    if (foto_url.startsWith("http")) return foto_url;
    if (foto_url.startsWith("/uploads")) return `http://localhost:3001${foto_url}`;
    if (foto_url.startsWith("uploads")) return `http://localhost:3001/${foto_url}`;
    return `http://localhost:3001/uploads/caes/${foto_url}`;
  };

  return (
    <div className="pagamento-wrapper">
      <Header />

      <div className="patinhas-background">
        <PatasAleatorias quantidade={20} />
      </div>

      <div className="pagamento-conteudo">
        <div className={`conteudo-entre-header-footer doacao-section step-${currentStep}`}>
          <div className="form-doacao-container">
            <Stepper
              steps={steps}
              currentStep={currentStep}
              onStepClick={handleStepClick}
            />

            {currentStep === 0 && (
              <>
                <h2 className="titulo-doacao">
                  {cachorroSelecionado ? `Doação para ${cachorroSelecionado.nome}` : "Faça sua doação"}
                </h2>

                {cachorroSelecionado && (
                  <div className="cachorro-imagem-container" style={{ marginBottom: "1rem" }}>
                    <img
                      src={corrigirURL(cachorroDetalhes?.foto_url || cachorroSelecionado.img)}
                      alt={cachorroSelecionado.nome}
                      style={{
                        width: "100%",
                        maxHeight: "400px",
                        objectFit: "cover",
                        borderRadius: "12px",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "/assets/doguinho-default.jpg";
                      }}
                    />
                    <h3 style={{ textAlign: "center", marginTop: "10px" }}>
                      {cachorroSelecionado.nome}
                    </h3>
                  </div>
                )}

                <div className="valores-rapidos">
                  <button type="button" onClick={() => setValorDoacao("10.00")}>R$ 10</button>
                  <button type="button" onClick={() => setValorDoacao("25.00")}>R$ 25</button>
                  <button type="button" onClick={() => setValorDoacao("50.00")}>R$ 50</button>
                  <button type="button" onClick={() => setValorDoacao("100.00")}>R$ 100</button>
                </div>

                <div className="input-group">
                  <span className="input-prefix">R$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="Insira um valor"
                    min="5.00"
                    step="0.01"
                    className="input-doacao"
                    value={valorDoacao}
                    onChange={(e) => setValorDoacao(e.target.value)}
                  />
                </div>
                <p className="valor-min">Valor mínimo: R$5,00</p>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "2rem" }}>
                  <button 
                    className="btn-opcao btn-continuar" 
                    onClick={handleContinuar}
                    disabled={!validarValorMinimo()}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {currentStep === 1 && (
              <>
                <div className="etapa-pagamento etapa-1">
                  <h2>Gostaria de apadrinhar algum animal?</h2>
                  <p>
                    Ao apadrinhar, você contribui mensalmente para o bem-estar de um animal
                    resgatado, ajudando com alimentação, vacinas e muito amor. É uma forma
                    especial de criar um laço com um pet em recuperação.
                  </p>
                  
                  {cachorroSelecionado && (
                    <div className="cachorro-selecionado-info">
                      <p>
                        <strong>Pet selecionado:</strong> {cachorroSelecionado.nome}
                      </p>
                      <p>
                        <strong>Valor sugerido para apadrinhamento:</strong> R$ {cachorroSelecionado.valorApadrinhamento || 50},00/mês
                      </p>
                    </div>
                  )}
                </div>

                <div className="botoes-apadrinhamento">
                  <button className="btn-voltar" onClick={() => setCurrentStep(0)}>
                    Voltar
                  </button>
                  <button className="btn-opcao" onClick={() => navigate("/vitrine-user", { 
                    state: { 
                      origem: 'doacao',
                      valorSugerido: valorDoacaoNumber
                    }
                  })}>
                    Escolher um Pet
                  </button>
                  <button className="btn-opcao" onClick={() => setCurrentStep(2)}>
                    Apenas Doação
                  </button>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <FormularioPagamento
                valorDoacao={valorDoacaoNumber}
                descricao={cachorroSelecionado ? `Doação para ${cachorroSelecionado.nome}` : "Doação geral"}
                onVoltar={() => setCurrentStep(1)}
                onContinuar={(payloadPagamento) => processarPagamento(payloadPagamento)}
                onFalha={() => handlePagamentoResultado(false)}
                loading={loadingPagamento}
              />
            )}

            {currentStep === 3 && (
              <div className="etapa-confirmacao card-confirmacao">
                {pagamentoSucesso ? (
                  <>
                    <FaCheckCircle size={100} color="#4BB543" />
                    <h2>Doação realizada com sucesso!</h2>
                    <p>Obrigado por sua contribuição! Sua ajuda faz toda a diferença.</p>
                    {cachorroSelecionado && (
                      <p className="mensagem-destino">
                        Sua doação beneficiará diretamente <strong>{cachorroSelecionado.nome}</strong> 💜
                      </p>
                    )}
                    {mensagem && <p className="mensagem mensagem-sucesso">{mensagem}</p>}
                    <div className="botoes-confirmacao">
                      <button className="btn-voltar" onClick={handleVoltarConfirmacao}>
                        Nova Doação
                      </button>
                      <button className="btn-home" onClick={() => navigate("/")}>
                        Voltar para Home
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <FaTimesCircle size={100} color="#FF4C4C" />
                    <h2>Doação não concluída</h2>
                    <p>Houve um problema ao processar sua doação. Por favor, tente novamente.</p>
                    {mensagem && <p className="mensagem mensagem-erro">{mensagem}</p>}
                    <div className="botoes-confirmacao">
                      <button className="btn-voltar" onClick={handleVoltarConfirmacao}>
                        Tentar Novamente
                      </button>
                      <button className="btn-home" onClick={() => navigate("/pagamento")}>
                        Escolher Outra Forma
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {currentStep === 0 && !cachorroSelecionado && (
            <div className="info-doacao-container">
              <h3>Como sua doação ajuda nossos pets?</h3>
              <p>
                Sua doação é essencial para cuidar dos nossos amigos de quatro patas. Com ela,
                conseguimos oferecer alimentação, vacinas, castração e um ambiente seguro cheio de
                carinho. Cada valor contribui para salvar vidas, proporcionando saúde e esperança
                para os animais que tanto precisam.
              </p>
              <div className="impacto-doacao">
                <div className="impacto-item">
                  <span className="impacto-icon">🍖</span>
                  <span>Alimentação por 1 mês</span>
                </div>
                <div className="impacto-item">
                  <span className="impacto-icon">💉</span>
                  <span>Vacinação completa</span>
                </div>
                <div className="impacto-item">
                  <span className="impacto-icon">🏥</span>
                  <span>Tratamento veterinário</span>
                </div>
                <div className="impacto-item">
                  <span className="impacto-icon">🛏️</span>
                  <span>Abrigo e cuidados</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  );
}