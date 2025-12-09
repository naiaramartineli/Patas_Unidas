import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { caoService } from '../../../services/caoService';
import { racaService } from '../../../services/racaService';
import { vacinaService } from '../../../services/vacinaService';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import MultiSelectDropdown from '../../../components/MultiSelectDropdown';
import './cadastroCachorro.css';

export default function CadastroCachorro() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();

  const modoEdicao = location.state?.editar || false;
  const cachorroEditando = location.state?.cachorro || {};

  const [formData, setFormData] = useState({
    nome: cachorroEditando.nome || '',
    id_raca: cachorroEditando.id_raca || '',
    sexo: cachorroEditando.sexo || '',
    idade: cachorroEditando.idade || '',
    temperamento: cachorroEditando.temperamento || '',
    porte: cachorroEditando.porte || '',
    pelagem: cachorroEditando.pelagem || '',
    descricao: cachorroEditando.descricao || '',
    vacinas: cachorroEditando.vacinas || '',
    castrado: cachorroEditando.castrado !== undefined ? cachorroEditando.castrado : true,
    valor_apadrinhamento: cachorroEditando.valor_apadrinhamento || '',
    observacao: cachorroEditando.observacao || ''
  });

  const [foto, setFoto] = useState(null);
  const [preview, setPreview] = useState(cachorroEditando.foto_url || null);
  
  const [racas, setRacas] = useState([]);
  const [vacinasList, setVacinasList] = useState([]);
  const [vacinasSelecionadas, setVacinasSelecionadas] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);

  // Verificar se o usuário é admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  // Carregar raças e vacinas
  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoadingData(true);
      
      // Carregar raças
      const racasResult = await racaService.findAll();
      if (racasResult) {
        setRacas(Array.isArray(racasResult) ? racasResult : racasResult.data || []);
      }
      
      // Carregar vacinas
      const vacinasResult = await vacinaService.findAll(1, 100);
      if (vacinasResult?.vacinas) {
        setVacinasList(vacinasResult.vacinas);
      }

      // Se estiver editando, carregar vacinas aplicadas
      if (modoEdicao && cachorroEditando.id) {
        const vacinasCaoResult = await vacinaService.findByDogId(cachorroEditando.id);
        if (vacinasCaoResult) {
          setVacinasSelecionadas(Array.isArray(vacinasCaoResult) ? vacinasCaoResult : vacinasCaoResult.data || []);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFotoChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFoto(file);

    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPreview(cachorroEditando.foto_url || null);
    }
  };

  const handleVacinasChange = (selectedIds) => {
    setVacinasSelecionadas(selectedIds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setErro(false);

    try {
      // Validação básica
      if (!formData.nome.trim()) {
        throw new Error('Nome do cão é obrigatório');
      }
      if (!formData.id_raca) {
        throw new Error('Selecione uma raça');
      }
      if (!formData.idade) {
        throw new Error('Idade é obrigatória');
      }
      if (!formData.porte) {
        throw new Error('Porte é obrigatório');
      }
      if (!formData.sexo) {
        throw new Error('Sexo é obrigatório');
      }
      if (!formData.descricao.trim()) {
        throw new Error('Descrição é obrigatória');
      }

      let resultado;
      
      if (modoEdicao) {
        // Atualizar cão existente
        resultado = await caoService.update(
          cachorroEditando.id,
          formData,
          foto
        );
      } else {
        // Criar novo cão
        resultado = await caoService.create(formData, foto);
      }

      if (resultado.success) {
        // Se tiver vacinas selecionadas, aplicar ao cão
        if (vacinasSelecionadas.length > 0) {
          const caoId = modoEdicao ? cachorroEditando.id : resultado.data.id_cao;
          
          for (const vacinaId of vacinasSelecionadas) {
            try {
              await vacinaService.applyToDog({
                id_vacina: vacinaId,
                id_cao: caoId,
                data: new Date().toISOString().split('T')[0],
                proxima_dose: null, // Pode ser calculado baseado na vacina
                observacao: 'Aplicada no cadastro'
              });
            } catch (vacinaError) {
              console.error('Erro ao aplicar vacina:', vacinaError);
            }
          }
        }

        alert(modoEdicao ? '🐶 Cão atualizado com sucesso!' : '🐶 Cão cadastrado com sucesso!');
        navigate('/admin/caes');
      } else {
        throw new Error(resultado.error || 'Erro ao salvar cão');
      }
    } catch (error) {
      console.error('Erro ao salvar cão:', error);
      setMensagem(`❌ ${error.message || 'Erro ao salvar cão'}`);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  const temperamentos = ['Calmo', 'Ativo', 'Brincalhão', 'Protetor', 'Timido', 'Sociável', 'Independente'];
  const portes = ['Pequeno', 'Médio', 'Grande'];
  const pelagens = ['Curta', 'Média', 'Longa', 'Encaracolada', 'Lisa'];

  return (
    <div className="cadastro-cachorro">
      <Header user={user} isAuthenticated={true} isAdmin={true} />

      <main className="cadastro-cachorro-container">
        <div className="cadastro-cachorro-header">
          <h1>{modoEdicao ? 'Editar Cão' : 'Cadastrar Novo Cão'}</h1>
          <p className="cadastro-cachorro-subtitle">
            {modoEdicao ? 'Atualize as informações do cão' : 'Preencha os dados para cadastrar um novo cão'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="cadastro-cachorro-form">
          {/* Upload de foto */}
          <div className="cadastro-cachorro-foto">
            <label htmlFor="foto" className="cadastro-cachorro-foto-label">
              {preview ? (
                <img 
                  src={preview.includes('http') ? preview : `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}${preview}`}
                  alt="Foto do cão" 
                  className="cadastro-cachorro-foto-preview"
                />
              ) : (
                <div className="cadastro-cachorro-foto-placeholder">
                  🐾
                </div>
              )}
              <div className="cadastro-cachorro-foto-overlay">
                <span>{modoEdicao ? 'Alterar foto' : 'Adicionar foto'}</span>
              </div>
              <input
                id="foto"
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                disabled={loading}
              />
            </label>
          </div>

          {/* Campos do formulário */}
          <div className="cadastro-cachorro-campos">
            <div className="cadastro-cachorro-form-group">
              <label>
                Nome do Cão *
                <input
                  type="text"
                  placeholder="Digite o nome do cão"
                  value={formData.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Raça *
                <select
                  value={formData.id_raca}
                  onChange={(e) => handleChange('id_raca', e.target.value)}
                  required
                  disabled={loading || loadingData}
                >
                  <option value="">Selecione uma raça</option>
                  {racas.map(raca => (
                    <option key={raca.id_raca} value={raca.id_raca}>
                      {raca.nome}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Idade (anos) *
                <input
                  type="number"
                  min="0"
                  max="30"
                  step="0.5"
                  placeholder="Ex: 2.5"
                  value={formData.idade}
                  onChange={(e) => handleChange('idade', e.target.value)}
                  required
                  disabled={loading}
                />
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Sexo *
                <div className="cadastro-cachorro-radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="sexo"
                      value="M"
                      checked={formData.sexo === 'M'}
                      onChange={(e) => handleChange('sexo', e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span>Macho</span>
                  </label>
                  <label className="radio-option">
                    <input
                      type="radio"
                      name="sexo"
                      value="F"
                      checked={formData.sexo === 'F'}
                      onChange={(e) => handleChange('sexo', e.target.value)}
                      required
                      disabled={loading}
                    />
                    <span>Fêmea</span>
                  </label>
                </div>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Porte *
                <select
                  value={formData.porte}
                  onChange={(e) => handleChange('porte', e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Selecione o porte</option>
                  {portes.map(porte => (
                    <option key={porte} value={porte.toLowerCase()}>
                      {porte}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Pelagem
                <select
                  value={formData.pelagem}
                  onChange={(e) => handleChange('pelagem', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecione a pelagem</option>
                  {pelagens.map(pelagem => (
                    <option key={pelagem} value={pelagem.toLowerCase()}>
                      {pelagem}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Temperamento
                <select
                  value={formData.temperamento}
                  onChange={(e) => handleChange('temperamento', e.target.value)}
                  disabled={loading}
                >
                  <option value="">Selecione o temperamento</option>
                  {temperamentos.map(temp => (
                    <option key={temp} value={temp.toLowerCase()}>
                      {temp}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label>
                Vacinas Aplicadas
                <MultiSelectDropdown
                  options={vacinasList.map(v => ({ id: v.id_vacina, nome: v.nome }))}
                  selected={vacinasSelecionadas}
                  onChange={handleVacinasChange}
                  placeholder="Selecione as vacinas"
                  disabled={loading || loadingData}
                />
              </label>
            </div>

            <div className="cadastro-cachorro-form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.castrado}
                  onChange={(e) => handleChange('castrado', e.target.checked)}
                  disabled={loading}
                />
                <span>Castrado</span>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group full-width">
              <label>
                Valor do Apadrinhamento (R$) *
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ex: 50,00"
                  value={formData.valor_apadrinhamento}
                  onChange={(e) => handleChange('valor_apadrinhamento', e.target.value)}
                  required
                  disabled={loading}
                />
                <small>Valor mensal para apadrinhamento</small>
              </label>
            </div>

            <div className="cadastro-cachorro-form-group full-width">
              <label>
                Descrição *
                <textarea
                  placeholder="Descreva o cão, comportamento, histórico, necessidades especiais..."
                  value={formData.descricao}
                  onChange={(e) => handleChange('descricao', e.target.value)}
                  required
                  disabled={loading}
                  rows={4}
                  className="cadastro-cachorro-textarea"
                />
              </label>
            </div>

            <div className="cadastro-cachorro-form-group full-width">
              <label>
                Observações Adicionais
                <textarea
                  placeholder="Informações adicionais, cuidados especiais, histórico médico..."
                  value={formData.observacao}
                  onChange={(e) => handleChange('observacao', e.target.value)}
                  disabled={loading}
                  rows={3}
                  className="cadastro-cachorro-textarea"
                />
              </label>
            </div>
          </div>

          <div className="cadastro-cachorro-actions">
            <button 
              type="submit" 
              className="cadastro-cachorro-btn-submit"
              disabled={loading || loadingData}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  {modoEdicao ? 'Atualizando...' : 'Cadastrando...'}
                </>
              ) : modoEdicao ? 'Atualizar Cão' : 'Cadastrar Cão'}
            </button>
            
            <button 
              type="button" 
              className="cadastro-cachorro-btn-cancel"
              onClick={() => navigate('/admin/caes')}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>

        {mensagem && (
          <div className={`cadastro-cachorro-message ${erro ? 'error' : 'success'}`}>
            {mensagem}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}