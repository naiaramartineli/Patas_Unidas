import React, { useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import Card from '../../../components/Card/card';
import PatasAleatorias from '../../components/patas/PatasAleatorias';
import Footer from '../../../components/footer/footer';
import './pagamento.css';

import imgPix from '../../assets/icon-apadrinhe.png';
import imgCartao from '../../assets/icon-doacao.png';

// Hook para analytics
const useAnalytics = () => {
  const registrarClique = useCallback(async (acao) => {
    try {
      // Implementação de analytics aqui
      console.log(`Analytics: ${acao}`);
      // Exemplo: await fetch('/api/analytics', { method: 'POST', body: JSON.stringify({ action: acao }) });
    } catch (e) {
      console.warn('Falha ao registrar evento:', e.message);
    }
  }, []);

  return { registrarClique };
};

// Card de doação
const DoacaoCard = ({ 
  titulo = "Faça uma doação", 
  descricao = "Doe amor, doe esperança. Sua contribuição transforma vidas.",
  img = imgCartao,
  textoBotao = "Fazer doação",
  loading = false,
  onClick,
  className = ""
}) => (
  <Card 
    titulo={titulo}
    descricao={descricao}
    img={img}
    textoBotao={loading ? "Aguarde..." : textoBotao}
    classImg={`pagamento-img-doacao ${className}`.trim()}
    onClick={onClick}
    disabled={loading}
  />
);

// Card de apadrinhamento
const ApadrinhamentoCard = ({
  titulo = "Apadrinhe um pet",
  descricao = "Apadrinhar garante alimento, cuidados e carinho aos pets.",
  img = imgPix,
  textoBotao = "Apadrinhar",
  loading = false,
  onClick,
  className = ""
}) => (
  <Card 
    titulo={titulo}
    descricao={descricao}
    img={img}
    textoBotao={loading ? "Aguarde..." : textoBotao}
    onClick={onClick}
    disabled={loading}
    className={className}
  />
);

// Componente de fundo com patinhas
const PagamentoBackground = ({ quantidade = 20 }) => (
  <div className="pagamento-patinhas-background">
    <PatasAleatorias quantidade={quantidade} />
  </div>
);

// Componente principal
export default function Pagamento() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [tipoAcao, setTipoAcao] = useState(null); // 'doacao' ou 'apadrinhamento'
  
  const { registrarClique } = useAnalytics();

  const handleNavegacao = useCallback(async (tipo, path, state = {}) => {
    setTipoAcao(tipo);
    setLoading(true);
    
    try {
      await registrarClique(`clicou_${tipo}`);
      navigate(path, { state: { origem: 'pagamento', tipo, ...state } });
    } catch (error) {
      console.error('Erro durante navegação:', error);
    } finally {
      setLoading(false);
      setTipoAcao(null);
    }
  }, [navigate, registrarClique]);

  const onDoar = useCallback(() => {
    handleNavegacao('doacao', '/pagamento-pix');
  }, [handleNavegacao]);

  const onApadrinhar = useCallback(() => {
    handleNavegacao('apadrinhamento', '/apadrinhar');
  }, [handleNavegacao]);

  return (
    <div className="pagamento-wrapper">
      <Header />
      
      <PagamentoBackground quantidade={20} />

      <div className="pagamento-conteudo">
        <div className="pagamento-conteudo-entre-header-footer">
          <header className="pagamento-header">
            <h1 className="pagamento-titulo-page">
              Escolha uma forma de transformar vidas!
            </h1>
            <p className="pagamento-paragrafo">
              Faça uma doação ou apadrinhe nossos pets e ajude com os cuidados de nossos amigos.
            </p>
          </header>

          <div className="pagamento-container-cards">
            <DoacaoCard
              loading={loading && tipoAcao === 'doacao'}
              onClick={onDoar}
            />
            
            <ApadrinhamentoCard
              loading={loading && tipoAcao === 'apadrinhamento'}
              onClick={onApadrinhar}
            />
          </div>

          <div className="pagamento-informacoes">
            <p className="pagamento-info-texto">
              <strong>Importante:</strong> Todas as doações são direcionadas para cuidados 
              veterinários, alimentação e bem-estar dos animais resgatados.
            </p>
            <p className="pagamento-info-texto">
              Para doações recorrentes ou valores acima de R$ 500, entre em contato conosco.
            </p>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  );
}

// Versão simplificada para uso em outros lugares
export const PagamentoRapido = ({ tipo = 'doacao', valor, onSucesso }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleAcao = useCallback(() => {
    setLoading(true);
    const path = tipo === 'doacao' ? '/pagamento-pix' : '/apadrinhar';
    const state = tipo === 'apadrinhamento' && valor ? { valor } : {};
    
    navigate(path, { state });
  }, [navigate, tipo, valor]);

  return (
    <div className="pagamento-rapido">
      <DoacaoCard
        titulo={tipo === 'doacao' ? "Doação Rápida" : "Apadrinhamento"}
        descricao={tipo === 'doacao' 
          ? "Ajude nossos animais com uma doação rápida" 
          : "Seja o padrinho de um pet especial"}
        textoBotao={loading ? "Processando..." : (tipo === 'doacao' ? "Doar Agora" : "Apadrinhar")}
        loading={loading}
        onClick={handleAcao}
      />
    </div>
  );
};