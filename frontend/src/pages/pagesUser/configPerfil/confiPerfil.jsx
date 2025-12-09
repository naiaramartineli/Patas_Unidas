// frontend/src/pages/pagesUser/configPerfil/ConfiguracoesPerfil.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../../components/Header/Header";
import Footer from "../../../components/footer/footer";
import PatasAleatorias from "../../../components/patas/PatasAleatorias";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSave, faCamera, faUser } from "@fortawesome/free-solid-svg-icons";
import { authService } from "../../../services/authService";
import { userService } from "../../../services/userService";
import "./ConfiguracoesPerfil.css";

export default function ConfiguracoesPerfil() {
  const navigate = useNavigate();
  const [fotoPerfil, setFotoPerfil] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    senhaAtual: "",
    novaSenha: "",
    confirmSenha: "",
  });
  
  const [loading, setLoading] = useState(false);
  const [loadingDados, setLoadingDados] = useState(true);
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);
  const [userId, setUserId] = useState(null);

  // Buscar dados do usuário
  useEffect(() => {
    const fetchDadosUsuario = async () => {
      try {
        setLoadingDados(true);
        
        // Buscar perfil do usuário autenticado
        const profileData = await authService.getProfile();
        
        if (profileData?.usuario) {
          const usuario = profileData.usuario;
          setUserId(usuario.id);
          
          setForm({
            nome: usuario.nome || "",
            email: usuario.email || "",
            telefone: usuario.telefone || "",
            endereco: usuario.endereco || "",
            senhaAtual: "",
            novaSenha: "",
            confirmSenha: "",
          });

          if (usuario.foto_perfil) {
            setFotoPerfil(usuario.foto_perfil);
          }
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
        setMensagem('❌ Erro ao carregar dados do perfil.');
        setErro(true);
        
        // Verificar se precisa redirecionar para login
        if (error.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoadingDados(false);
      }
    };

    fetchDadosUsuario();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const formatarTelefone = (valor) => {
    return valor
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleTelefoneChange = (e) => {
    setForm({ ...form, telefone: formatarTelefone(e.target.value) });
  };

  const handleFotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFotoFile(file);
      
      const reader = new FileReader();
      reader.onload = (ev) => setFotoPerfil(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensagem('');
    setErro(false);

    // Validações
    if (form.novaSenha && form.novaSenha !== form.confirmSenha) {
      setMensagem('❌ As senhas não coincidem.');
      setErro(true);
      setLoading(false);
      return;
    }

    if (form.novaSenha && form.novaSenha.length < 6) {
      setMensagem('❌ A nova senha deve ter no mínimo 6 caracteres.');
      setErro(true);
      setLoading(false);
      return;
    }

    try {
      if (fotoFile) {
        // Upload da foto de perfil
        await userService.uploadProfilePhoto(fotoFile);
      }

      // Atualizar perfil
      const profileData = {
        nome: form.nome,
        telefone: form.telefone.replace(/\D/g, ''),
        endereco: form.endereco,
      };

      await authService.updateProfile(profileData);

      // Alterar senha se necessário
      if (form.senhaAtual && form.novaSenha) {
        await authService.changePassword(form.senhaAtual, form.novaSenha);
      }

      setMensagem('✅ Dados salvos com sucesso!');
      setErro(false);

      // Limpar campos de senha
      setForm({
        ...form,
        senhaAtual: '',
        novaSenha: '',
        confirmSenha: ''
      });

      // Remover mensagem após 5 segundos
      setTimeout(() => {
        setMensagem('');
      }, 5000);

    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      setMensagem(`❌ ${error.response?.data?.message || 'Erro ao atualizar perfil'}`);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  if (loadingDados) {
    return (
      <div className="config-wrapper">
        <Header />
        <main className="config-main">
          <div className="loading-container">
            <p>Carregando dados do perfil...</p>
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
        <h1>⚙️ Configurações do Perfil</h1>

        <form className="config-form" onSubmit={handleSubmit}>
          {/* Foto de perfil */}
          <div className="foto-section">
            {fotoPerfil ? (
              <img src={fotoPerfil} alt="Foto de perfil" className="foto-preview" />
            ) : (
              <div className="foto-avatar">
                <FontAwesomeIcon icon={faUser} size="3x" />
              </div>
            )}
            <label htmlFor="foto" className="foto-upload">
              <FontAwesomeIcon icon={faCamera} /> Alterar Foto
              <input 
                type="file" 
                id="foto" 
                accept="image/*" 
                onChange={handleFotoChange}
                disabled={loading}
              />
            </label>
          </div>

          {/* Dados Pessoais */}
          <section>
            <h2>📧 Dados Pessoais</h2>
            <label>
              Nome:
              <input 
                type="text" 
                name="nome" 
                value={form.nome} 
                onChange={handleChange}
                required
                disabled={loading}
              />
            </label>
            <label>
              Email:
              <input 
                type="email" 
                name="email" 
                value={form.email} 
                onChange={handleChange}
                required
                disabled={loading || true} // Email geralmente não pode ser alterado
              />
            </label>
            <label>
              Telefone:
              <input 
                type="text" 
                name="telefone" 
                value={form.telefone} 
                onChange={handleTelefoneChange}
                maxLength={15}
                placeholder="(00) 00000-0000"
                required
                disabled={loading}
              />
            </label>
            <label>
              Endereço:
              <textarea 
                name="endereco" 
                value={form.endereco} 
                onChange={handleChange}
                disabled={loading}
                rows="3"
                placeholder="Digite seu endereço completo"
              />
            </label>
          </section>

          {/* Redefinição de senha */}
          <section>
            <h2>🔒 Alterar Senha</h2>
            <p className="senha-info">Deixe em branco se não quiser alterar a senha</p>
            <label>
              Senha Atual:
              <input 
                type="password" 
                name="senhaAtual" 
                value={form.senhaAtual} 
                onChange={handleChange}
                disabled={loading}
                placeholder="Digite sua senha atual"
              />
            </label>
            <label>
              Nova Senha:
              <input 
                type="password" 
                name="novaSenha" 
                value={form.novaSenha} 
                onChange={handleChange}
                minLength={6}
                disabled={loading}
                placeholder="Mínimo 6 caracteres"
              />
            </label>
            <label>
              Confirmar Nova Senha:
              <input 
                type="password" 
                name="confirmSenha" 
                value={form.confirmSenha} 
                onChange={handleChange}
                disabled={loading}
                placeholder="Repita a nova senha"
              />
            </label>
          </section>

          {/* Botão salvar */}
          <button type="submit" className="btn-salvar" disabled={loading}>
            <FontAwesomeIcon icon={faSave} /> 
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          {mensagem && (
            <p className={`mensagem ${erro ? 'mensagem-erro' : 'mensagem-sucesso'}`}>
              {mensagem}
            </p>
          )}
        </form>
      </main>

      <Footer />
    </div>
  );
}