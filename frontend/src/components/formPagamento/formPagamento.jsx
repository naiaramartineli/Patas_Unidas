import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { FiRefreshCw } from "react-icons/fi";
import { BsCreditCard2FrontFill } from "react-icons/bs";
import { PiPixLogoLight } from "react-icons/pi";
import { FaGlobeAmericas } from "react-icons/fa";
import "./FormularioPagamento.css";

// Constantes para tipos de pagamento
const METODO_PAGAMENTO = {
  PIX: "pix",
  DEBITO: "debito",
  CREDITO: "credito",
};

const TIPO_PAGAMENTO = {
  DOACAO: "doacao",
  APADRINHAMENTO: "apadrinhamento",
};

// Funções utilitárias
const formatarValorEmReais = (valor) => {
  const num = Number(valor);
  if (isNaN(num) || num <= 0) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const formatarTempo = (segundos) => {
  const min = String(Math.floor(segundos / 60)).padStart(2, "0");
  const seg = String(segundos % 60).padStart(2, "0");
  return `${min}:${seg}`;
};

const gerarQRCodeFake = () =>
  `https://pix.example.com/qrcode/${Math.random().toString(36).substring(2, 15)}`;

const gerarChavePixFake = () =>
  `${Math.random().toString(36).substring(2, 15)}-${Math.random()
    .toString(36)
    .substring(2, 15)}`;

// Componente de seleção de método de pagamento
const MetodoPagamentoSelecao = ({ metodos, selecionado, onSelecionar, className = "" }) => (
  <div className={`opcoes-pagamento ${className}`.trim()}>
    {metodos.map(({ id, label, icon }) => (
      <button
        key={id}
        type="button"
        onClick={() => onSelecionar(id)}
        className={`opcao-pagamento ${selecionado === id ? "selecionado" : ""}`}
        aria-pressed={selecionado === id}
      >
        {icon}
        <span>{label}</span>
      </button>
    ))}
  </div>
);

MetodoPagamentoSelecao.propTypes = {
  metodos: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
    })
  ).isRequired,
  selecionado: PropTypes.string,
  onSelecionar: PropTypes.func.isRequired,
  className: PropTypes.string,
};

// Componente de informação PIX
const PixInfo = ({ 
  qrCode, 
  chavePix, 
  tempoRestante, 
  cronometroZerado, 
  onGerarNovoPix, 
  onCopiarChavePix,
  className = "" 
}) => {
  const handleCopiarChavePix = useCallback(() => {
    navigator.clipboard.writeText(chavePix);
    alert("Chave Pix copiada!");
    onCopiarChavePix?.();
  }, [chavePix, onCopiarChavePix]);

  return (
    <div className={`pix-info ${className}`.trim()}>
      <h3>Escaneie o QR Code para pagar</h3>

      {/* chave pix */}
      <div className="chave-pix-container">
        <input 
          type="text" 
          readOnly 
          value={chavePix} 
          aria-label="Chave Pix"
        />
        <button onClick={handleCopiarChavePix}>
          Copiar chave Pix
        </button>
      </div>

      {/* QR code / recarregar */}
      <div className="qrcode-container">
        {cronometroZerado ? (
          <div 
            className="recarregar-container" 
            onClick={onGerarNovoPix}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onGerarNovoPix()}
          >
            <FiRefreshCw size={48} color="#7e3ff2" className="icone-recarregar" />
            <span className="texto-recarregar">Clique para gerar novo QR Code</span>
          </div>
        ) : (
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
              qrCode
            )}`}
            alt="QR Code Pix"
            loading="lazy"
          />
        )}
      </div>

      {!cronometroZerado && tempoRestante > 0 && (
        <p className="tempo-restante">
          Tempo restante para expirar: {formatarTempo(tempoRestante)}
        </p>
      )}
    </div>
  );
};

PixInfo.propTypes = {
  qrCode: PropTypes.string.isRequired,
  chavePix: PropTypes.string.isRequired,
  tempoRestante: PropTypes.number.isRequired,
  cronometroZerado: PropTypes.bool.isRequired,
  onGerarNovoPix: PropTypes.func.isRequired,
  onCopiarChavePix: PropTypes.func,
  className: PropTypes.string,
};

// Componente de campo do formulário de cartão
const CampoCartao = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  maxLength,
  error,
  className = "",
  disabled = false,
  required = true,
}) => (
  <div className={`form-group ${className}`.trim()}>
    <label>
      {label}
      {required && <span className="required">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      maxLength={maxLength}
      value={value}
      onChange={onChange}
      className={error ? "input-erro" : ""}
      disabled={disabled}
      aria-invalid={!!error}
      aria-required={required}
    />
    {error && <span className="erro-texto" role="alert">{error}</span>}
  </div>
);

CampoCartao.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  error: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

CampoCartao.defaultProps = {
  type: "text",
  placeholder: "",
  disabled: false,
  required: true,
};

// Componente de seletor de país
const PaisSeletor = ({ value, onChange, error, className = "" }) => (
  <div className={`form-group pais-container ${className}`.trim()}>
    <label>
      <FaGlobeAmericas style={{ marginRight: 6 }} />
      País
      <span className="required">*</span>
    </label>
    <select
      value={value}
      onChange={onChange}
      className={error ? "input-erro" : ""}
      aria-invalid={!!error}
    >
      <option value="Brasil">Brasil</option>
      <option value="Estados Unidos">Estados Unidos</option>
      <option value="Portugal">Portugal</option>
      <option value="Outro">Outro</option>
    </select>
    {error && <span className="erro-texto" role="alert">{error}</span>}
  </div>
);

PaisSeletor.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  className: PropTypes.string,
};

// Componente de resumo do pagamento
const ResumoPagamento = ({ 
  valor, 
  tipo = TIPO_PAGAMENTO.DOACAO, 
  className = "" 
}) => {
  const titulo = tipo === TIPO_PAGAMENTO.APADRINHAMENTO 
    ? "Valor de Apadrinhamento:" 
    : "Doação:";

  return (
    <div className={`resumo-container ${className}`.trim()}>
      <div className="resumo-doacao">
        {titulo} <span>{formatarValorEmReais(valor)}</span>
      </div>
      
      <div className="total-pagamento">
        <span>Total a pagar:</span>
        <strong>{formatarValorEmReais(valor)}</strong>
      </div>
    </div>
  );
};

ResumoPagamento.propTypes = {
  valor: PropTypes.number.isRequired,
  tipo: PropTypes.oneOf(Object.values(TIPO_PAGAMENTO)),
  className: PropTypes.string,
};

ResumoPagamento.defaultProps = {
  tipo: TIPO_PAGAMENTO.DOACAO,
};

// Hook personalizado para validação de formulário de cartão
const useValidacaoCartao = () => {
  const validarNumeroCartao = useCallback((numero) => {
    if (!numero.trim()) return "Número do cartão é obrigatório";
    if (numero.replace(/\s/g, "").length < 16) return "Número de cartão inválido";
    return "";
  }, []);

  const validarDataVencimento = useCallback((data) => {
    if (!data.trim()) return "Data de vencimento é obrigatória";
    if (!/^\d{2}\/\d{2}$/.test(data)) return "Formato inválido (MM/AA)";
    return "";
  }, []);

  const validarCVC = useCallback((cvc) => {
    if (!cvc.trim()) return "CVC é obrigatório";
    if (cvc.length < 3) return "CVC inválido";
    return "";
  }, []);

  const validarNomeCartao = useCallback((nome) => {
    if (!nome.trim()) return "Nome no cartão é obrigatório";
    if (nome.length < 3) return "Nome muito curto";
    return "";
  }, []);

  const validarPais = useCallback((pais) => {
    if (!pais.trim()) return "País é obrigatório";
    return "";
  }, []);

  const validarTodos = useCallback((dados) => {
    const erros = {
      numeroCartao: validarNumeroCartao(dados.numeroCartao),
      dataVencimento: validarDataVencimento(dados.dataVencimento),
      cvc: validarCVC(dados.cvc),
      nomeCartao: validarNomeCartao(dados.nomeCartao),
      pais: validarPais(dados.pais),
    };

    return {
      erros,
      valido: Object.values(erros).every(erro => !erro),
    };
  }, [validarNumeroCartao, validarDataVencimento, validarCVC, validarNomeCartao, validarPais]);

  return {
    validarNumeroCartao,
    validarDataVencimento,
    validarCVC,
    validarNomeCartao,
    validarPais,
    validarTodos,
  };
};

// Componente principal FormularioPagamento
export default function FormularioPagamento({
  valorApadrinhamento = 0,
  onContinuar,
  onFalha,
  tipo = TIPO_PAGAMENTO.DOACAO,
  metodosPersonalizados,
  valorMinimo = 0,
  valorMaximo = 10000,
  className = "",
}) {
  // Estados
  const [metodoSelecionado, setMetodoSelecionado] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [chavePix, setChavePix] = useState("");
  const [tempoRestante, setTempoRestante] = useState(300);
  const [cronometroZerado, setCronometroZerado] = useState(false);
  const [salvarMetodo, setSalvarMetodo] = useState(false);
  const [erros, setErros] = useState({});

  // Estados do cartão
  const [numeroCartao, setNumeroCartao] = useState("");
  const [dataVencimento, setDataVencimento] = useState("");
  const [cvc, setCvc] = useState("");
  const [nomeCartao, setNomeCartao] = useState("");
  const [pais, setPais] = useState("Brasil");

  const timerRef = useRef(null);
  const { validarTodos } = useValidacaoCartao();

  // Métodos de pagamento disponíveis
  const metodos = useMemo(() => metodosPersonalizados || [
    { id: METODO_PAGAMENTO.PIX, label: "Pix", icon: <PiPixLogoLight /> },
    { id: METODO_PAGAMENTO.DEBITO, label: "Cartão de débito", icon: <BsCreditCard2FrontFill /> },
    { id: METODO_PAGAMENTO.CREDITO, label: "Cartão de crédito", icon: <BsCreditCard2FrontFill /> },
  ], [metodosPersonalizados]);

  // Validação do valor
  const valorValidado = useMemo(() => {
    const num = Number(valorApadrinhamento);
    if (isNaN(num)) return 0;
    if (num < valorMinimo) return valorMinimo;
    if (num > valorMaximo) return valorMaximo;
    return num;
  }, [valorApadrinhamento, valorMinimo, valorMaximo]);

  // Geração de PIX
  const gerarNovoPix = useCallback(() => {
    setQrCode(gerarQRCodeFake());
    setChavePix(gerarChavePixFake());
    setTempoRestante(300);
    setCronometroZerado(false);
  }, []);

  const selecionarMetodo = useCallback((id) => {
    setErros({});
    clearInterval(timerRef.current);

    if (id === metodoSelecionado) {
      setMetodoSelecionado("");
      setCronometroZerado(false);
      return;
    }

    setMetodoSelecionado(id);

    if (id === METODO_PAGAMENTO.PIX) {
      gerarNovoPix();
    }
  }, [metodoSelecionado, gerarNovoPix]);

  // Cronômetro do PIX
  useEffect(() => {
    if (metodoSelecionado !== METODO_PAGAMENTO.PIX) return;

    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCronometroZerado(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [metodoSelecionado]);

  // Validação do formulário
  const validarFormulario = useCallback(() => {
    const precisaCartao = metodoSelecionado === METODO_PAGAMENTO.DEBITO || 
                         metodoSelecionado === METODO_PAGAMENTO.CREDITO;

    if (!precisaCartao) {
      return { valido: true, erros: {} };
    }

    const dadosCartao = { numeroCartao, dataVencimento, cvc, nomeCartao, pais };
    const { erros: novosErros, valido } = validarTodos(dadosCartao);
    
    setErros(novosErros);
    return { valido, erros: novosErros };
  }, [metodoSelecionado, numeroCartao, dataVencimento, cvc, nomeCartao, pais, validarTodos]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();

    if (!metodoSelecionado) {
      alert("Por favor, selecione um método de pagamento");
      return;
    }

    const { valido } = validarFormulario();
    if (!valido) return;

    // Simulação de processamento
    const pagamentoAprovado = Math.random() < 0.8; // 80% de chance de sucesso

    if (pagamentoAprovado) {
      onContinuar?.();
    } else {
      onFalha?.("Pagamento não aprovado. Tente novamente.");
    }
  }, [metodoSelecionado, validarFormulario, onContinuar, onFalha]);

  // Manipuladores de campo
  const handleNumeroCartaoChange = useCallback((e) => {
    let value = e.target.value.replace(/\D/g, "");
    value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
    setNumeroCartao(value.slice(0, 19));
  }, []);

  const handleDataVencimentoChange = useCallback((e) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length >= 2) {
      value = value.slice(0, 2) + "/" + value.slice(2, 4);
    }
    setDataVencimento(value.slice(0, 5));
  }, []);

  // Verifica se é um método de cartão
  const isMetodoCartao = metodoSelecionado === METODO_PAGAMENTO.DEBITO || 
                        metodoSelecionado === METODO_PAGAMENTO.CREDITO;

  return (
    <div className={`formulario-pagamento ${className}`.trim()}>
      {/* Seleção de método */}
      <MetodoPagamentoSelecao
        metodos={metodos}
        selecionado={metodoSelecionado}
        onSelecionar={selecionarMetodo}
      />

      {/* PIX */}
      {metodoSelecionado === METODO_PAGAMENTO.PIX && (
        <PixInfo
          qrCode={qrCode}
          chavePix={chavePix}
          tempoRestante={tempoRestante}
          cronometroZerado={cronometroZerado}
          onGerarNovoPix={gerarNovoPix}
        />
      )}

      {/* Cartão (débito ou crédito) */}
      {isMetodoCartao && (
        <div className="metodo-info">
          <h3>
            <BsCreditCard2FrontFill style={{ marginRight: 8 }} />
            {metodoSelecionado === METODO_PAGAMENTO.DEBITO
              ? "Pagamento com Cartão de Débito"
              : "Pagamento com Cartão de Crédito"}
          </h3>

          <form onSubmit={handleSubmit} noValidate>
            {/* Número do cartão */}
            <CampoCartao
              label="Número do cartão"
              value={numeroCartao}
              onChange={handleNumeroCartaoChange}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              error={erros.numeroCartao}
            />

            {/* Data + CVC */}
            <div className="form-row">
              <CampoCartao
                label="Data de vencimento"
                value={dataVencimento}
                onChange={handleDataVencimentoChange}
                placeholder="MM/AA"
                maxLength={5}
                error={erros.dataVencimento}
                className="pequeno"
              />

              <CampoCartao
                label="CVC"
                type="password"
                value={cvc}
                onChange={(e) => setCvc(e.target.value.slice(0, 4))}
                placeholder="123"
                maxLength={4}
                error={erros.cvc}
                className="pequeno"
              />
            </div>

            {/* Nome */}
            <CampoCartao
              label="Nome no cartão"
              value={nomeCartao}
              onChange={(e) => setNomeCartao(e.target.value)}
              placeholder="Nome completo"
              error={erros.nomeCartao}
            />

            {/* País */}
            <PaisSeletor
              value={pais}
              onChange={(e) => setPais(e.target.value)}
              error={erros.pais}
            />

            {/* Checkbox */}
            <div className="checkbox-discreto">
              <input
                type="checkbox"
                id="salvarMetodo"
                checked={salvarMetodo}
                onChange={() => setSalvarMetodo(!salvarMetodo)}
                aria-label="Salvar método de pagamento"
              />
              <label htmlFor="salvarMetodo">Salvar método de pagamento</label>
            </div>

            {/* Resumo */}
            <ResumoPagamento 
              valor={valorValidado}
              tipo={tipo}
            />

            {/* Botão */}
            <button type="submit" className="btn-finalizar">
              Finalizar pagamento
            </button>
          </form>
        </div>
      )}

      {/* Mensagem quando nenhum método está selecionado */}
      {!metodoSelecionado && (
        <div className="nenhum-metodo-selecionado">
          <p>Por favor, selecione um método de pagamento acima para continuar.</p>
        </div>
      )}
    </div>
  );
}

// Componente simplificado para uso rápido
export const FormularioPagamentoSimples = ({ 
  valor, 
  onContinuar, 
  tipo = TIPO_PAGAMENTO.DOACAO 
}) => (
  <FormularioPagamento
    valorApadrinhamento={valor}
    onContinuar={onContinuar}
    tipo={tipo}
    metodosPersonalizados={[
      { id: METODO_PAGAMENTO.PIX, label: "Pix", icon: <PiPixLogoLight /> },
    ]}
  />
);

FormularioPagamento.propTypes = {
  valorApadrinhamento: PropTypes.number,
  onContinuar: PropTypes.func,
  onFalha: PropTypes.func,
  tipo: PropTypes.oneOf(Object.values(TIPO_PAGAMENTO)),
  metodosPersonalizados: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
      icon: PropTypes.node.isRequired,
    })
  ),
  valorMinimo: PropTypes.number,
  valorMaximo: PropTypes.number,
  className: PropTypes.string,
};

FormularioPagamentoSimples.propTypes = {
  valor: PropTypes.number.isRequired,
  onContinuar: PropTypes.func.isRequired,
  tipo: PropTypes.oneOf(Object.values(TIPO_PAGAMENTO)),
};

FormularioPagamento.defaultProps = {
  valorApadrinhamento: 0,
  tipo: TIPO_PAGAMENTO.DOACAO,
  valorMinimo: 0,
  valorMaximo: 10000,
  className: "",
};

FormularioPagamentoSimples.defaultProps = {
  tipo: TIPO_PAGAMENTO.DOACAO,
};

// Exportar constantes para uso externo
export { METODO_PAGAMENTO, TIPO_PAGAMENTO };