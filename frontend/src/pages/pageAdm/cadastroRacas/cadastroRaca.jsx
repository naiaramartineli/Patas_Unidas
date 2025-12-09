import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { racaService } from '../../../services/racaService';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import './CadastroRaca.css';

export default function CadastroRaca() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);

  // Verificar se o usuário é admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setErro(false);

    try {
      if (!nome.trim()) {
        throw new Error('Nome da raça é obrigatório');
      }

      const result = await racaService.create(nome.trim());
      
      if (result.success) {
        setMensagem(`✅ Raça "${nome}" cadastrada com sucesso!`);
        setErro(false);
        
        // Limpar campos após sucesso
        setNome('');
        setDescricao('');
        
        // Remover mensagem após 5 segundos
        setTimeout(() => {
          setMensagem('');
        }, 5000);
      } else {
        throw new Error(result.error || 'Erro ao cadastrar raça');
      }
    } catch (error) {
      console.error('Erro ao cadastrar raça:', error);
      setMensagem(`❌ ${error.message || 'Erro ao cadastrar raça'}`);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-raca">
      <div className="cadastro-raca-patinhas-bg">
        <PatasAleatorias quantidade={20} />
      </div>

      <Header user={user} isAuthenticated={true} isAdmin={true} />

      <main className="cadastro-raca-container">
        <div className="cadastro-raca-header">
          <h1>Cadastrar Nova Raça</h1>
          <p className="cadastro-raca-subtitle">
            Adicione uma nova raça ao sistema para facilitar o cadastro de cães
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-raca-form">
          <div className="cadastro-raca-form-group">
            <label>
              Nome da Raça *
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Labrador Retriever"
                required
                disabled={loading}
                className="cadastro-raca-input"
              />
              <small className="cadastro-raca-hint">
                Digite o nome oficial da raça
              </small>
            </label>
          </div>

          <div className="cadastro-raca-form-group">
            <label>
              Descrição (opcional)
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Características da raça, temperamento, cuidados especiais..."
                disabled={loading}
                rows={5}
                className="cadastro-raca-textarea"
              />
              <small className="cadastro-raca-hint">
                Informações adicionais sobre a raça
              </small>
            </label>
          </div>

          <div className="cadastro-raca-actions">
            <button 
              type="submit" 
              className="cadastro-raca-btn-submit"
              disabled={loading || !nome.trim()}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Cadastrando...
                </>
              ) : 'Cadastrar Raça'}
            </button>
            
            <button 
              type="button" 
              className="cadastro-raca-btn-cancel"
              onClick={() => navigate('/admin/racas')}
              disabled={loading}
            >
              Voltar para Lista
            </button>
          </div>
        </form>

        {mensagem && (
          <div className={`cadastro-raca-message ${erro ? 'error' : 'success'}`}>
            {mensagem}
          </div>
        )}

        <div className="cadastro-raca-info">
          <h3>ℹ️ Dicas para cadastro de raças</h3>
          <ul>
            <li>Use o nome oficial da raça</li>
            <li>Verifique se a raça já não existe no sistema</li>
            <li>Para raças mistas, use "SRD (Sem Raça Definida)"</li>
            <li>A descrição ajuda outros usuários a conhecerem melhor a raça</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}