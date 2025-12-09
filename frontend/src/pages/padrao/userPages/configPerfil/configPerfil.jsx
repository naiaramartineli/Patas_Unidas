import React, { useState, useEffect, useCallback } from "react";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../components/patas/PatasAleatorias";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faCamera, faUser, faSpinner } from "@fortawesome/free-solid-svg-icons";
import "./ConfiguracoesPerfil.css";

// Hook para gerenciamento de usuário
const useUsuario = () => {
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarDados = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`https://sua-api.com/api/usuarios/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar dados do usuário');
      }

      const data = await response.json();
      setDadosUsuario(data);
      setErro(null);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErro(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return { dadosUsuario, loading, erro, recarregar: carregarDados };
};

// Componente de foto de perfil
const FotoPerfil = ({ foto, onAlterarFoto, loading = false }) => (
  <div className="foto-section">
    {foto ? (
      <img src={foto} alt="Foto de perfil" className="foto-preview" />
    ) : (
      <div className="foto-avatar">
        <FontAwesomeIcon icon={faUser} />
      </div>
    )}
    <label htmlFor="foto" className={`foto-upload ${loading ? 'disabled' : ''}`}>
      <FontAwesomeIcon icon={loading ? faSpinner : faCamera} spin={loading} />
      {loading ? 'Carregando...' : 'Alterar Foto'}
      <input 
        type="file" 
        id="foto" 
        accept="image/*" 
        onChange={onAlterarFoto}
        disabled={loading}
      />
    </label>
  </div>
);

FotoPerfil.propTypes = {
  foto: PropTypes.string,
  onAlterarFoto: PropTypes.func.isRequired,
  loading: PropTypes.bool,
};

// Componente de seção de formulário
const FormSection = ({ title, children, className = "" }) => (
  <section className={`config-section ${className}`.trim()}>
    <h2>{title}</h2>
    <div className="config-section-content">
      {children}
    </div>
  </section>
);

FormSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  className: PropTypes.string,
};

// Campo de formulário reutilizável
const ConfigField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  maxLength,
  required = false,
  disabled = false,
  error,
  mask,
  className = ""
}) => {
  const handleChange = useCallback((e) => {
    let newValue = e.target.value;
    
    if (mask === 'telefone') {
      newValue = newValue
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    
    onChange(newValue);
  }, [mask, onChange]);

  return (
    <label className={`config-field ${className}`.trim()}>
      <span className="config-field-label">
        {label}
        {required && <span className="required">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        maxLength={maxLength}
        required={required}
        disabled={disabled}
        className={error ? 'input-error' : ''}
      />
      {error && <span className="config-field-error">{error}</span>}
    </label>
  );
};

ConfigField.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  required: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  mask: PropTypes.oneOf(['telefone', 'cpf', 'cep']),
  className: PropTypes.string,
};

// Componente principal
export default function ConfiguracoesPerfil() {
  const { dadosUsuario, loading: loadingDados, erro: erroDados, recarregar } = useUsuario();
  
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    senhaAtual: "",
    novaSenha: "",
    confirmSenha: "",
    pagamento: "Cartão de Crédito",
    chavePix: ""
  });
  
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [errors, setErrors] = useState({});

  // Carregar dados do usuário
  useEffect(() => {
    if (dadosUsuario) {
      setForm({
        nome: dadosUsuario.nome || "",
        email: dadosUsuario.email || "",
        telefone: dadosUsuario.telefone || "",
        endereco: dadosUsuario.endereco || "",
        senhaAtual: "",
        novaSenha: "",
        confirmSenha: "",
        pagamento: dadosUsuario.metodoPagamento || "Cartão de Crédito",
        chavePix: dadosUsuario.chavePix || ""
      });

      if (dadosUsuario.fotoPerfil) {
        setFotoPerfil(dadosUsuario.fotoPerfil);
      }
    }
  }, [dadosUsuario]);

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Limpar erro do campo quando usuário começa a digitar
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  }, [errors]);

  const handleFotoChange = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validação básica da imagem
      if (file.size > 5 * 1024 * 1024) { // 5MB
        setMensagem('❌ A imagem deve ter no máximo 5MB');
        setErro(true);
        return;
      }

      if (!file.type.startsWith('image/')) {
        setMensagem('❌ Por favor, selecione uma imagem válida');
        setErro(true);
        return;
      }

      setFotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPerfil(ev.target.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const validarFormulario = useCallback(() => {
    const novosErrors = {};

    // Validação de campos obrigatórios
    if (!form.nome.trim()) novosErrors.nome = 'Nome é obrigatório';
    if (!form.email.trim()) novosErrors.email = 'Email é obrigatório';
    
    // Validação de email
    if (form.email && !/\S+@\S+\.\S+/.test(form.email)) {
      novosErrors.email = 'Email inválido';
    }

    // Validação de senha
    if (form.novaSenha && form.novaSenha !== form.confirmSenha) {
      novosErrors.confirmSenha = 'As senhas não coincidem';
    }

    if (form.novaSenha && form.novaSenha.length < 6) {
      novosErrors.novaSenha = 'A senha deve ter no mínimo 6 caracteres';
    }

    // Validação de PIX
    if (form.pagamento === "PIX" && !form.chavePix.trim()) {
      novosErrors.chavePix = 'Chave PIX é obrigatória para pagamento via PIX';
    }

    setErrors(novosErrors);
    return Object.keys(novosErrors).length === 0;
  }, [form]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      setMensagem('❌ Por favor, corrija os erros no formulário');
      setErro(true);
      return;
    }

    setLoading(true);
    setMensagem('');
    setErro(false);

    try {
      const userId = localStorage.getItem('userId');
      const token = localStorage.getItem('token');

      if (!userId || !token) {
        throw new Error('Usuário não autenticado');
      }

      const formData = new FormData();
      formData.append('nome', form.nome.trim());
      formData.append('email', form.email.trim());
      formData.append('telefone', form.telefone.replace(/\D/g, ''));
      formData.append('endereco', form.endereco.trim());
      formData.append('metodoPagamento', form.pagamento);
      
      if (form.pagamento === 'PIX') {
        formData.append('chavePix', form.chavePix.trim());
      }

      // Só envia senha se o usuário preencheu
      if (form.senhaAtual && form.novaSenha) {
        formData.append('senhaAtual', form.senhaAtual);
        formData.append('novaSenha', form.novaSenha);
      }

      if (fotoFile) {
        formData.append('fotoPerfil', fotoFile);
      }

      const response = await fetch(`https://sua-api.com/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar perfil');
      }

      setMensagem('✅ Dados salvos com sucesso!');
      setErro(false);

      // Limpa campos de senha
      setForm(prev => ({
        ...prev,
        senhaAtual: '',
        novaSenha: '',
        confirmSenha: ''
      }));

      // Recarrega dados do usuário
      recarregar();

      // Remove a mensagem após 5 segundos
      setTimeout(() => setMensagem(''), 5000);

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMensagem(`❌ ${error.message}`);
      setErro(true);
    } finally {
      setLoading(false);
    }
  }, [form, fotoFile, validarFormulario, recarregar]);

  // Loading state
  if (loadingDados) {
    return (
      <div className="config-wrapper">
        <Header />
        <main className="config-main">
          <div className="loading-state">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Carregando dados do perfil...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error state
  if (erroDados) {
    return (
      <div className="config-wrapper">
        <Header />
        <main className="config-main">
          <div className="error-state">
            <p>❌ {erroDados}</p>
            <button onClick={recarregar} className="btn-tentar-novamente">
              Tentar Novamente
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="config-wrapper">
      <Header />
      
      <div className="config-patinhas-background">
        <PatasAleatorias quantidade={15} />
      </div>

      <main className="config-main">
        <header className="config-header">
          <h1>⚙️ Configurações do Perfil</h1>
          <p className="config-subtitle">Gerencie suas informações pessoais e preferências</p>
        </header>

        <form className="config-form" onSubmit={handleSubmit}>
          {/* Foto de perfil */}
          <FormSection title="🖼️ Foto de Perfil">
            <FotoPerfil
              foto={fotoPerfil}
              onAlterarFoto={handleFotoChange}
              loading={loading}
            />
          </FormSection>

          {/* Dados Pessoais */}
          <FormSection title="📧 Dados Pessoais">
            <ConfigField
              label="Nome"
              value={form.nome}
              onChange={(value) => handleChange('nome', value)}
              placeholder="Seu nome completo"
              required
              disabled={loading}
              error={errors.nome}
            />
            
            <ConfigField
              label="Email"
              type="email"
              value={form.email}
              onChange={(value) => handleChange('email', value)}
              placeholder="seu@email.com"
              required
              disabled={loading}
              error={errors.email}
            />
            
            <ConfigField
              label="Telefone"
              value={form.telefone}
              onChange={(value) => handleChange('telefone', value)}
              placeholder="(00) 00000-0000"
              maxLength={15}
              mask="telefone"
              required
              disabled={loading}
            />
            
            <ConfigField
              label="Endereço"
              value={form.endereco}
              onChange={(value) => handleChange('endereco', value)}
              placeholder="Sua endereço completo"
              disabled={loading}
            />
          </FormSection>

          {/* Alteração de Senha */}
          <FormSection title="🔒 Alterar Senha">
            <p className="config-info">Deixe em branco se não quiser alterar a senha</p>
            
            <ConfigField
              label="Senha Atual"
              type="password"
              value={form.senhaAtual}
              onChange={(value) => handleChange('senhaAtual', value)}
              placeholder="Digite sua senha atual"
              disabled={loading}
            />
            
            <ConfigField
              label="Nova Senha"
              type="password"
              value={form.novaSenha}
              onChange={(value) => handleChange('novaSenha', value)}
              placeholder="Mínimo 6 caracteres"
              minLength={6}
              disabled={loading}
              error={errors.novaSenha}
            />
            
            <ConfigField
              label="Confirmar Nova Senha"
              type="password"
              value={form.confirmSenha}
              onChange={(value) => handleChange('confirmSenha', value)}
              placeholder="Confirme a nova senha"
              disabled={loading}
              error={errors.confirmSenha}
            />
          </FormSection>

          {/* Dados de Pagamento */}
          <FormSection title="💳 Dados de Pagamento">
            <label className="config-field">
              <span className="config-field-label">Método de Pagamento</span>
              <select 
                name="pagamento" 
                value={form.pagamento} 
                onChange={(e) => handleChange('pagamento', e.target.value)}
                disabled={loading}
                className={errors.pagamento ? 'input-error' : ''}
              >
                <option value="Cartão de Crédito">Cartão de Crédito</option>
                <option value="PIX">PIX</option>
                <option value="Boleto">Boleto</option>
              </select>
              {errors.pagamento && <span className="config-field-error">{errors.pagamento}</span>}
            </label>
            
            {form.pagamento === "PIX" && (
              <ConfigField
                label="Chave PIX"
                value={form.chavePix}
                onChange={(value) => handleChange('chavePix', value)}
                placeholder="email@exemplo.com, CPF ou telefone"
                disabled={loading}
                error={errors.chavePix}
                required
              />
            )}
          </FormSection>

          {/* Botão de salvar e mensagens */}
          <div className="config-actions">
            <button 
              type="submit" 
              className="btn-salvar" 
              disabled={loading}
            >
              <FontAwesomeIcon icon={loading ? faSpinner : faSave} spin={loading} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>

            {mensagem && (
              <div className={`config-mensagem ${erro ? 'mensagem-erro' : 'mensagem-sucesso'}`}>
                {mensagem}
              </div>
            )}
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}

// Versão simplificada para uso em modais
export const ConfiguracoesRapidas = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: ''
  });

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Implementação simplificada
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSuccess?.();
      onClose?.();
    } finally {
      setLoading(false);
    }
  }, [onClose, onSuccess]);

  return (
    <div className="configuracoes-rapidas">
      <h3>Configurações Rápidas</h3>
      <form onSubmit={handleSubmit}>
        <ConfigField
          label="Nome"
          value={form.nome}
          onChange={(value) => setForm(prev => ({ ...prev, nome: value }))}
          disabled={loading}
        />
        <ConfigField
          label="Email"
          type="email"
          value={form.email}
          onChange={(value) => setForm(prev => ({ ...prev, email: value }))}
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </form>
    </div>
  );
};