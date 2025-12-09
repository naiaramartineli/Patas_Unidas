// frontend/src/pages/pagesUser/visualizaDoacoes/VisualizaDoacoes.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faArrowLeft, 
  faHandHoldingHeart, 
  faCalendar,
  faMoneyBillWave,
  faReceipt,
  faHistory,
  faDownload
} from "@fortawesome/free-solid-svg-icons";
import { userService } from "../../../services/userService";
import "./visualizaDoacoes.css";

export default function VisualizaDoacoes() {
  const navigate = useNavigate();
  const [doacoes, setDoacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtroMes, setFiltroMes] = useState("todos");
  const [baixandoComprovante, setBaixandoComprovante] = useState(null);

  useEffect(() => {
    const fetchDoacoes = async () => {
      try {
        setLoading(true);
        setError("");

        // TODO: Substituir por serviço específico de doações quando disponível
        // Por enquanto, buscar doações do usuário (pode ser parte das adoções)
        const adocoesData = await userService.getMyAdoptions();
        
        // Simular doações com base nas adoções
        const doacoesSimuladas = [
          {
            id: 1,
            valor: 100.00,
            data: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            metodo: "PIX",
            status: "concluído",
            descricao: "Doação mensal para manutenção"
          },
          {
            id: 2,
            valor: 50.00,
            data: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            metodo: "Cartão de Crédito",
            status: "concluído",
            descricao: "Doação para vacinação"
          },
          {
            id: 3,
            valor: 200.00,
            data: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
            metodo: "PIX",
            status: "concluído",
            descricao: "Doação para castração"
          }
        ];

        // Se tiver dados reais do usuário, combinar
        const doacoesCombinadas = [
          ...doacoesSimuladas,
          ...(Array.isArray(adocoesData) ? adocoesData.map(adocao => ({
            id: `ado-${adocao.id}`,
            valor: adocao.cao?.valor_apadrinhamento || 50,
            data: adocao.created_at || new Date().toISOString(),
            metodo: "Sistema",
            status: adocao.status === 1 ? "concluído" : "pendente",
            descricao: `Apadrinhamento de ${adocao.cao?.nome || "pet"}`
          })) : [])
        ];

        setDoacoes(doacoesCombinadas);
      } catch (err) {
        console.error("Erro ao carregar doações:", err);
        setError("❌ Não foi possível carregar suas doações. Tente novamente.");
        
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoacoes();
  }, [navigate]);

  const doacoesFiltradas = useMemo(() => {
    if (filtroMes === "todos") return doacoes;
    
    const hoje = new Date();
    const mes = parseInt(filtroMes);
    const ano = hoje.getFullYear();
    
    return doacoes.filter(doacao => {
      try {
        const dataDoacao = new Date(doacao.data);
        return dataDoacao.getMonth() === mes && dataDoacao.getFullYear() === ano;
      } catch {
        return false;
      }
    });
  }, [doacoes, filtroMes]);

  const totalDoado = useMemo(
    () => doacoesFiltradas.reduce((acc, d) => acc + (Number(d.valor) || 0), 0),
    [doacoesFiltradas]
  );

  const meses = [
    { value: "todos", label: "Todos os meses" },
    { value: "0", label: "Janeiro" },
    { value: "1", label: "Fevereiro" },
    { value: "2", label: "Março" },
    { value: "3", label: "Abril" },
    { value: "4", label: "Maio" },
    { value: "5", label: "Junho" },
    { value: "6", label: "Julho" },
    { value: "7", label: "Agosto" },
    { value: "8", label: "Setembro" },
    { value: "9", label: "Outubro" },
    { value: "10", label: "Novembro" },
    { value: "11", label: "Dezembro" }
  ];

  const formatarBRL = (valor) => {
    const num = Number(valor) || 0;
    return new Intl.NumberFormat("pt-BR", { 
      style: "currency", 
      currency: "BRL" 
    }).format(num);
  };

  const formatarData = (dataISO) => {
    if (!dataISO) return "—";
    try {
      return new Date(dataISO).toLocaleDateString("pt-BR");
    } catch {
      return "—";
    }
  };

  const formatarHora = (dataISO) => {
    if (!dataISO) return "";
    try {
      return new Date(dataISO).toLocaleTimeString("pt-BR", { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "";
    }
  };

  const baixarComprovante = async (doacaoId) => {
    try {
      setBaixandoComprovante(doacaoId);
      
      // TODO: Implementar download real do comprovante
      // Simular download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      alert("Comprovante baixado com sucesso!");
    } catch (err) {
      console.error("Erro ao baixar comprovante:", err);
      alert("Erro ao baixar comprovante. Tente novamente.");
    } finally {
      setBaixandoComprovante(null);
    }
  };

  const gerarResumo = () => {
    const resumo = `Resumo de Doações\nTotal: ${formatarBRL(totalDoado)}\nQuantidade: ${doacoesFiltradas.length} doações\nPeríodo: ${filtroMes === "todos" ? "Todos os meses" : meses.find(m => m.value === filtroMes)?.label}\n\n`;
    
    const detalhes = doacoesFiltradas.map(d => 
      `- ${formatarData(d.data)}: ${formatarBRL(d.valor)} (${d.metodo}) - ${d.descricao || ''}`
    ).join('\n');
    
    return resumo + detalhes;
  };

  const copiarResumo = () => {
    navigator.clipboard.writeText(gerarResumo())
      .then(() => alert("Resumo copiado para a área de transferência!"))
      .catch(() => alert("Não foi possível copiar o resumo."));
  };

  if (loading) {
    return (
      <div className="visualiza-doacoes-wrapper">
        <Header />
        <div className="doacoes-patinhas-background">
          <PatasAleatorias quantidade={18} />
        </div>
        <main className="visualiza-doacoes-main">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Carregando suas doações...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="visualiza-doacoes-wrapper">
      <Header />

      <div className="doacoes-patinhas-background">
        <PatasAleatorias quantidade={18} />
      </div>

      <main className="visualiza-doacoes-main">
        <div className="doacoes-header">
          <div>
            <h1>
              <FontAwesomeIcon icon={faHandHoldingHeart} /> Minhas Doações
            </h1>
            <p className="subtitulo-doacoes">
              Acompanhe todas as suas contribuições e o impacto positivo gerado 🐾
            </p>
          </div>
          
          <button 
            onClick={() => navigate("/pagamento")}
            className="btn-nova-doacao"
          >
            <FontAwesomeIcon icon={faHandHoldingHeart} /> Nova Doação
          </button>
        </div>

        {error && <div className="erro-mensagem">{error}</div>}

        {/* Filtros e Estatísticas */}
        <div className="doacoes-controle">
          <div className="filtro-container">
            <label htmlFor="filtro-mes">
              <FontAwesomeIcon icon={faCalendar} /> Filtrar por mês:
            </label>
            <select
              id="filtro-mes"
              value={filtroMes}
              onChange={(e) => setFiltroMes(e.target.value)}
              className="select-filtro"
            >
              {meses.map(mes => (
                <option key={mes.value} value={mes.value}>
                  {mes.label}
                </option>
              ))}
            </select>
          </div>

          <div className="estatisticas-rapidas">
            <div className="estatistica-card">
              <FontAwesomeIcon icon={faMoneyBillWave} />
              <div>
                <span className="estatistica-valor">{formatarBRL(totalDoado)}</span>
                <span className="estatistica-label">Total doado</span>
              </div>
            </div>
            <div className="estatistica-card">
              <FontAwesomeIcon icon={faReceipt} />
              <div>
                <span className="estatistica-valor">{doacoesFiltradas.length}</span>
                <span className="estatistica-label">{doacoesFiltradas.length === 1 ? "Doação" : "Doações"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="doacoes-acoes">
          <button onClick={copiarResumo} className="btn-acao">
            <FontAwesomeIcon icon={faHistory} /> Copiar Resumo
          </button>
        </div>

        {doacoesFiltradas.length === 0 ? (
          <div className="nenhuma-doacao">
            <div className="nenhuma-icon">
              <FontAwesomeIcon icon={faHandHoldingHeart} size="4x" />
            </div>
            <h3>Nenhuma doação encontrada</h3>
            <p>{filtroMes === "todos" 
              ? "Você ainda não realizou nenhuma doação." 
              : "Nenhuma doação encontrada para o mês selecionado."}
            </p>
            <button 
              onClick={() => navigate("/pagamento")}
              className="btn-primario"
            >
              <FontAwesomeIcon icon={faHandHoldingHeart} /> Fazer Minha Primeira Doação
            </button>
          </div>
        ) : (
          <>
            <div className="doacoes-lista">
              {doacoesFiltradas
                .sort((a, b) => new Date(b.data) - new Date(a.data))
                .map((doacao) => (
                  <div key={doacao.id} className="doacao-card">
                    <div className="doacao-card-header">
                      <div className="doacao-icon">
                        <FontAwesomeIcon icon={faHandHoldingHeart} />
                      </div>
                      <div>
                        <h2>Doação #{doacao.id.toString().replace('ado-', '')}</h2>
                        <div className="doacao-data-hora">
                          <span>
                            <FontAwesomeIcon icon={faCalendar} /> {formatarData(doacao.data)}
                          </span>
                          {formatarHora(doacao.data) && (
                            <span className="hora">
                              {formatarHora(doacao.data)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="doacao-detalhes">
                      <div className="detalhe-item">
                        <span className="label">Valor:</span>
                        <span className="value valor-destaque">{formatarBRL(doacao.valor)}</span>
                      </div>
                      <div className="detalhe-item">
                        <span className="label">Método:</span>
                        <span className="value">{doacao.metodo || "—"}</span>
                      </div>
                      <div className="detalhe-item">
                        <span className="label">Status:</span>
                        <span className={`status-badge status-${doacao.status || 'pendente'}`}>
                          {doacao.status === 'concluído' ? '✅ Concluído' : '⏳ Pendente'}
                        </span>
                      </div>
                    </div>

                    {doacao.descricao && (
                      <div className="doacao-descricao">
                        <p>{doacao.descricao}</p>
                      </div>
                    )}

                    <div className="doacao-acoes">
                      <button
                        onClick={() => baixarComprovante(doacao.id)}
                        disabled={baixandoComprovante === doacao.id}
                        className="btn-comprovante"
                      >
                        <FontAwesomeIcon icon={faDownload} />
                        {baixandoComprovante === doacao.id ? "Baixando..." : "Comprovante"}
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            <div className="doacoes-resumo">
              <h3>
                <FontAwesomeIcon icon={faHistory} /> Resumo do Período
              </h3>
              <p>Total de doações: <strong>{doacoesFiltradas.length}</strong></p>
              <p>Valor total: <strong>{formatarBRL(totalDoado)}</strong></p>
            </div>
          </>
        )}

        <div className="doacoes-navegacao">
          <button className="btn-voltar" onClick={() => navigate("/perfil")}>
            <FontAwesomeIcon icon={faArrowLeft} /> Voltar ao Perfil
          </button>
          
          {doacoesFiltradas.length > 0 && (
            <button 
              onClick={copiarResumo}
              className="btn-resumo"
            >
              <FontAwesomeIcon icon={faHistory} /> Copiar Resumo
            </button>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}