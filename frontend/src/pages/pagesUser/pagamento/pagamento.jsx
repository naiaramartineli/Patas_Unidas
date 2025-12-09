// frontend/src/pages/pagesUser/pagamento/Pagamento.jsx
import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import Header from '../../../components/Header/Header';
import Card from '../../../components/Card/card';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import Footer from '../../../components/footer/footer';
import { caoService } from '../../../services/caoService';
import './pagamento.css';

import imgPix from '../../../assets/icon-apadrinhe.png';
import imgCartao from '../../../assets/icon-doacao.png';
import imgCachorro from '../../../assets/icon-cachorro.png';

export default function Pagamento() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [petsDisponiveis, setPetsDisponiveis] = useState([]);
  const [showPetsModal, setShowPetsModal] = useState(false);

  // Buscar pets disponíveis para apadrinhamento
  React.useEffect(() => {
    const fetchPetsDisponiveis = async () => {
      try {
        const dados = await caoService.findAll(1, 6, { status: 'disponivel' });
        setPetsDisponiveis(dados.slice(0, 3)); // Mostrar apenas 3
      } catch (error) {
        console.error("Erro ao buscar pets:", error);
      }
    };

    fetchPetsDisponiveis();
  }, []);

  const registrarClique = async (acao) => {
    try {
      // Analytics ou registro de evento
      console.log(`Usuário clicou em: ${acao}`);
    } catch (e) {
      console.warn('Falha ao registrar evento:', e.message);
    }
  };

  const onDoar = async () => {
    setLoading(true);
    await registrarClique('clicou_doacao');

    navigate('/doacao', {
      state: {
        origem: 'pagamento',
        tipo: 'doacao'
      }
    });

    setLoading(false);
  };

  const onApadrinhar = async () => {
    setLoading(true);
    await registrarClique('clicou_apadrinhar');
    
    if (petsDisponiveis.length > 0) {
      setShowPetsModal(true);
    } else {
      navigate('/vitrine-user', {
        state: {
          origem: 'pagamento',
          tipo: 'apadrinhamento'
        }
      });
    }
    
    setLoading(false);
  };

  const selecionarPet = (pet) => {
    setShowPetsModal(false);
    navigate('/apadrinhamento', {
      state: { 
        cachorroSelecionado: pet,
        origem: 'pagamento'
      }
    });
  };

  const verTodosPets = () => {
    setShowPetsModal(false);
    navigate('/vitrine-user', {
      state: {
        origem: 'pagamento',
        tipo: 'apadrinhamento'
      }
    });
  };

  const corrigirURL = (foto_url) => {
    if (!foto_url) return "/assets/doguinho-default.jpg";
    if (foto_url.startsWith("http")) return foto_url;
    if (foto_url.startsWith("/uploads")) return `http://localhost:3001${foto_url}`;
    if (foto_url.startsWith("uploads")) return `http://localhost:3001/${foto_url}`;
    return `http://localhost:3001/uploads/caes/${foto_url}`;
  };

  return (
    <div className="pagamento-wrapper">
      <Header />

      <div className="pagamento-patinhas-background">
        <PatasAleatorias quantidade={20} />
      </div>

      <div className="pagamento-conteudo">
        <div className="pagamento-conteudo-entre-header-footer">
          <h1 className="pagamento-titulo-page">Escolha uma forma de transformar vidas!</h1>
          <p className="pagamento-paragrafo">
            Faça uma doação ou apadrinhe nossos pets e ajude com os cuidados de nossos amigos.
            Cada contribuição faz a diferença na vida de um animal resgatado.
          </p>

          <div className="pagamento-info-section">
            <div className="info-card">
              <h3>💝 Por que contribuir?</h3>
              <ul>
                <li>Fornecemos alimentação e cuidados veterinários</li>
                <li>Preparamos os pets para adoção responsável</li>
                <li>Realizamos campanhas de castração e vacinação</li>
                <li>Oferecemos abrigo temporário e seguro</li>
              </ul>
            </div>
            
            <div className="info-card">
              <h3>📊 Seu impacto</h3>
              <ul>
                <li>R$ 50 = Alimentação de 1 pet por 2 semanas</li>
                <li>R$ 100 = Vacinas para 1 pet</li>
                <li>R$ 200 = Castração de 1 animal</li>
                <li>R$ 500 = Tratamento veterinário completo</li>
              </ul>
            </div>
          </div>

          <div className="pagamento-container-cards">
            <Card 
              titulo="Doação Única" 
              descricao="Faça uma contribuição pontual e ajude nossos pets com alimentação, cuidados médicos e abrigo."
              img={imgCartao} 
              textoBotao={loading ? "Aguarde..." : "Fazer Doação"}
              classImg="pagamento-img-doacao"
              onClick={onDoar}
              disabled={loading}
              badge="🔄 Rápido e Fácil"
            />

            <Card 
              titulo="Apadrinhamento" 
              descricao="Apadrinhe um pet e contribua mensalmente para seu bem-estar. Receba atualizações e crie um laço especial."
              img={imgPix} 
              textoBotao={loading ? "Aguarde..." : "Escolher Pet"}
              onClick={onApadrinhar}
              disabled={loading}
              badge="❤️ Compromisso Mensal"
            />
          </div>

          <div className="pagamento-outras-opcoes">
            <h3>Outras formas de ajudar:</h3>
            <div className="opcoes-lista">
              <button onClick={() => navigate('/vitrine-user')}>
                <span>🐕</span> Conhecer todos os pets
              </button>
              <button onClick={() => navigate('/como-ajudar')}>
                <span>🤝</span> Seja voluntário
              </button>
              <button onClick={() => navigate('/parceiros')}>
                <span>🏢</span> Seja parceiro
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {/* Modal de seleção de pets */}
      {showPetsModal && (
        <div className="pets-modal-overlay" onClick={() => setShowPetsModal(false)}>
          <div className="pets-modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Escolha um pet para apadrinhar</h2>
            <p>Selecione um dos nossos amigos que precisa de um padrinho:</p>
            
            <div className="pets-modal-grid">
              {petsDisponiveis.map(pet => (
                <div 
                  key={pet.id} 
                  className="pet-modal-card"
                  onClick={() => selecionarPet(pet)}
                >
                  <img 
                    src={corrigirURL(pet.foto_url)} 
                    alt={pet.nome}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/assets/doguinho-default.jpg";
                    }}
                  />
                  <div className="pet-modal-info">
                    <h4>{pet.nome}</h4>
                    <p>{pet.porte} • {pet.sexo === 'M' ? 'Macho' : 'Fêmea'}</p>
                    <p className="pet-valor">R$ {pet.valor_apadrinhamento || 50}/mês</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pets-modal-actions">
              <button onClick={verTodosPets} className="btn-ver-todos">
                Ver todos os pets disponíveis
              </button>
              <button onClick={() => setShowPetsModal(false)} className="btn-cancelar">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}