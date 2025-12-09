import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { vacinaService } from '../../../services/vacinaService';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import './cadastroVacina.css';

export default function CadastroVacina() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [vacina, setVacina] = useState({
    nome: '',
    descricao: '',
    idade_recomendada: '',
    dose_unica: false,
    qtd_doses: '',
    intervalo_dose: '',
    intervalo_reforco: ''
  });
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);

  // Verificar se o usuário é admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  const handleChange = (field, value) => {
    setVacina(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setErro(false);

    try {
      // Validação básica
      if (!vacina.nome.trim()) {
        throw new Error('Nome da vacina é obrigatório');
      }
      if (!vacina.idade_recomendada) {
        throw new Error('Idade recomendada é obrigatória');
      }

      // Preparar dados para envio
      const vacinaData = {
        nome: vacina.nome.trim(),
        descricao: vacina.descricao.trim(),
        idade_recomendada: parseInt(vacina.idade_recomendada),
        dose_unica: vacina.dose_unica,
        qtd_doses: vacina.qtd_doses ? parseInt(vacina.qtd_doses) : null,
        intervalo_dose: vacina.intervalo_dose ? parseInt(vacina.intervalo_dose) : null,
        intervalo_reforco: vacina.intervalo_reforco ? parseInt(vacina.intervalo_reforco) : 12 // default 12 meses
      };

      const result = await vacinaService.create(vacinaData);
      
      if (result.success) {
        setMensagem(`✅ Vacina "${vacina.nome}" cadastrada com sucesso!`);
        setErro(false);
        
        // Limpar formulário
        setVacina({
          nome: '',
          descricao: '',
          idade_recomendada: '',
          dose_unica: false,
          qtd_doses: '',
          intervalo_dose: '',
          intervalo_reforco: ''
        });

        // Remover mensagem após 5 segundos
        setTimeout(() => {
          setMensagem('');
        }, 5000);
      } else {
        throw new Error(result.error || 'Erro ao cadastrar vacina');
      }
    } catch (error) {
      console.error('Erro ao cadastrar vacina:', error);
      setMensagem(`❌ ${error.message || 'Erro ao cadastrar vacina'}`);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-vacina">
      <div className="cadastro-vacina-patinhas-bg">
        <PatasAleatorias quantidade={20} />
      </div>

      <Header user={user} isAuthenticated={true} isAdmin={true} />

      <main className="cadastro-vacina-container">
        <div className="cadastro-vacina-header">
          <h1>Cadastrar Nova Vacina</h1>
          <p className="cadastro-vacina-subtitle">
            Adicione uma nova vacina ao sistema para controle de saúde dos cães
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-vacina-form">
          <div className="cadastro-vacina-form-grid">
            <div className="cadastro-vacina-form-group">
              <label>
                Nome da Vacina *
                <input
                  type="text"
                  value={vacina.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  placeholder="Ex: Antirrábica, V8, V10"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <div className="cadastro-vacina-form-group">
              <label>
                Idade Recomendada (meses) *
                <input
                  type="number"
                  min="0"
                  value={vacina.idade_recomendada}
                  onChange={(e) => handleChange('idade_recomendada', e.target.value)}
                  placeholder="Ex: 2 (para 2 meses)"
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <div className="cadastro-vacina-form-group">
              <label>
                Quantidade de Doses
                <input
                  type="number"
                  min="1"
                  value={vacina.qtd_doses}
                  onChange={(e) => handleChange('qtd_doses', e.target.value)}
                  placeholder="Ex: 3"
                  disabled={loading || vacina.dose_unica}
                />
              </label>
            </div>

            <div className="cadastro-vacina-form-group">
              <label>
                Intervalo entre Doses (meses)
                <input
                  type="number"
                  min="1"
                  value={vacina.intervalo_dose}
                  onChange={(e) => handleChange('intervalo_dose', e.target.value)}
                  placeholder="Ex: 21 (dias)"
                  disabled={loading || vacina.dose_unica}
                />
              </label>
            </div>

            <div className="cadastro-vacina-form-group">
              <label>
                Intervalo de Reforço (meses) *
                <input
                  type="number"
                  min="1"
                  value={vacina.intervalo_reforco}
                  onChange={(e) => handleChange('intervalo_reforco', e.target.value)}
                  placeholder="Ex: 12 (anual)"
                  required
                  disabled={loading}
                />
                <small>Período para reforço após última dose</small>
              </label>
            </div>

            <div className="cadastro-vacina-form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={vacina.dose_unica}
                  onChange={(e) => handleChange('dose_unica', e.target.checked)}
                  disabled={loading}
                />
                <span>Dose Única</span>
                <small>Marque se a vacina é aplicada em dose única</small>
              </label>
            </div>
          </div>

          <div className="cadastro-vacina-form-group">
            <label>
              Descrição
              <textarea
                value={vacina.descricao}
                onChange={(e) => handleChange('descricao', e.target.value)}
                placeholder="Informações sobre a vacina, proteção oferecida, efeitos colaterais..."
                disabled={loading}
                rows={4}
                className="cadastro-vacina-textarea"
              />
            </label>
          </div>

          <div className="cadastro-vacina-actions">
            <button 
              type="submit" 
              className="cadastro-vacina-btn-submit"
              disabled={loading || !vacina.nome.trim() || !vacina.idade_recomendada}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Cadastrando...
                </>
              ) : 'Cadastrar Vacina'}
            </button>
            
            <button 
              type="button" 
              className="cadastro-vacina-btn-cancel"
              onClick={() => navigate('/admin/vacinas')}
              disabled={loading}
            >
              Voltar para Lista
            </button>
          </div>
        </form>

        {mensagem && (
          <div className={`cadastro-vacina-message ${erro ? 'error' : 'success'}`}>
            {mensagem}
          </div>
        )}

        <div className="cadastro-vacina-info">
          <h3>💉 Informações sobre vacinas</h3>
          <ul>
            <li><strong>Idade recomendada:</strong> Idade mínima para aplicação</li>
            <li><strong>Intervalo entre doses:</strong> Tempo entre aplicações da mesma vacina</li>
            <li><strong>Intervalo de reforço:</strong> Quando aplicar a próxima dose de reforço</li>
            <li><strong>Dose única:</strong> Para vacinas que não precisam de reforço</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}