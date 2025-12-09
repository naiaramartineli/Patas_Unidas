import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import { userService } from '../../../services/userService';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import PatasAleatorias from '../../../components/patas/PatasAleatorias';
import './cadastroAdm.css';

export default function CadastroAdm() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nome: '',
    sobrenome: '',
    nome_social: '',
    cpf: '',
    data_nasc: '',
    email: '',
    telefone: '',
    senha: '',
    confirmar_senha: '',
    id_permissao: 1 // Admin tem permissão 1
  });

  const [errors, setErrors] = useState({});
  const [mensagem, setMensagem] = useState('');
  const [erro, setErro] = useState(false);

  // Verificar se o usuário atual é admin
  if (!isAdmin) {
    navigate('/dashboard');
    return null;
  }

  // Máscaras
  const mascaraCPF = (v) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  };

  const mascaraTelefone = (v) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
  };

  const handleChange = (field, value) => {
    let formattedValue = value;

    if (field === 'cpf') {
      formattedValue = mascaraCPF(value);
    } else if (field === 'telefone') {
      formattedValue = mascaraTelefone(value);
    }

    setForm(prev => ({ 
      ...prev, 
      [field]: formattedValue 
    }));

    // Limpa erro do campo
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!form.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!form.sobrenome.trim()) newErrors.sobrenome = "Sobrenome é obrigatório";
    if (!form.cpf.trim()) newErrors.cpf = "CPF é obrigatório";
    if (!form.data_nasc) newErrors.data_nasc = "Data de nascimento é obrigatória";
    
    // Valida idade mínima
    if (form.data_nasc) {
      const birthDate = new Date(form.data_nasc);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        newErrors.data_nasc = "Administrador deve ter pelo menos 18 anos";
      }
    }
    
    if (!form.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "E-mail inválido";
    }
    
    if (!form.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    } else if (form.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = "Telefone inválido";
    }
    
    if (!form.senha.trim()) {
      newErrors.senha = "Senha é obrigatória";
    } else if (form.senha.length < 8) {
      newErrors.senha = "A senha deve ter pelo menos 8 caracteres";
    }
    
    if (!form.confirmar_senha.trim()) {
      newErrors.confirmar_senha = "Confirme sua senha";
    } else if (form.senha !== form.confirmar_senha) {
      newErrors.confirmar_senha = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    setErro(false);

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Preparar payload para registro de admin
      const payload = {
        nome: form.nome.trim(),
        sobrenome: form.sobrenome.trim(),
        nome_social: form.nome_social ? form.nome_social.trim() : null,
        cpf: form.cpf.replace(/\D/g, ''),
        data_nasc: form.data_nasc,
        email: form.email.trim().toLowerCase(),
        telefone: form.telefone.replace(/\D/g, ''),
        senha: form.senha,
        // Para admin, podemos criar diretamente com permissão 1
        // ou usar o endpoint de updatePermission após criação
      };

      // Primeiro criar o usuário (usando o auth service)
      const auth = await import('../../../services/authService');
      const registerResult = await auth.authService.register(payload);
      
      if (!registerResult.success) {
        throw new Error(registerResult.error || 'Erro ao cadastrar administrador');
      }

      const userId = registerResult.data.user.id_usuario;

      // Como o registro cria usuário com permissão 3 por padrão,
      // precisamos atualizar para admin (permissão 1)
      try {
        await userService.updatePermission(userId, 1);
        
        setMensagem('✅ Administrador cadastrado com sucesso!');
        setErro(false);
        
        // Limpar formulário
        setForm({
          nome: '',
          sobrenome: '',
          nome_social: '',
          cpf: '',
          data_nasc: '',
          email: '',
          telefone: '',
          senha: '',
          confirmar_senha: '',
          id_permissao: 1
        });

        // Disparar evento para atualização da lista de admins (se necessário)
        window.dispatchEvent(new CustomEvent('admin:update'));
        
      } catch (permissionError) {
        console.error('Erro ao definir permissão de admin:', permissionError);
        setMensagem('⚠️ Usuário criado, mas não foi possível definir permissão de administrador.');
        setErro(true);
      }

    } catch (error) {
      console.error('Erro ao cadastrar admin:', error);
      setMensagem(`❌ ${error.message || 'Erro ao cadastrar administrador'}`);
      setErro(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cadastro-admin">
      <div className="cadastro-admin-patinhas-bg">
        <PatasAleatorias quantidade={20} />
      </div>

      <Header user={user} isAuthenticated={true} isAdmin={true} />

      <main className="cadastro-admin-container">
        <div className="cadastro-admin-header">
          <h1>Cadastrar Novo Administrador</h1>
          <p className="cadastro-admin-subtitle">
            Preencha os dados abaixo para criar uma nova conta de administrador
          </p>
        </div>

        <form className="cadastro-admin-form" onSubmit={handleSubmit}>
          <div className="cadastro-admin-form-grid">
            <div className="cadastro-admin-form-group">
              <label>
                Nome *
                <input
                  type="text"
                  placeholder="Nome do administrador"
                  value={form.nome}
                  onChange={(e) => handleChange('nome', e.target.value)}
                  disabled={loading}
                  className={errors.nome ? 'error' : ''}
                />
                {errors.nome && <span className="error-message">{errors.nome}</span>}
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                Sobrenome *
                <input
                  type="text"
                  placeholder="Sobrenome"
                  value={form.sobrenome}
                  onChange={(e) => handleChange('sobrenome', e.target.value)}
                  disabled={loading}
                  className={errors.sobrenome ? 'error' : ''}
                />
                {errors.sobrenome && <span className="error-message">{errors.sobrenome}</span>}
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                Nome Social (opcional)
                <input
                  type="text"
                  placeholder="Nome social"
                  value={form.nome_social}
                  onChange={(e) => handleChange('nome_social', e.target.value)}
                  disabled={loading}
                />
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                CPF *
                <input
                  type="text"
                  placeholder="000.000.000-00"
                  value={form.cpf}
                  onChange={(e) => handleChange('cpf', e.target.value)}
                  disabled={loading}
                  maxLength="14"
                  className={errors.cpf ? 'error' : ''}
                />
                {errors.cpf && <span className="error-message">{errors.cpf}</span>}
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                Data de Nascimento *
                <input
                  type="date"
                  value={form.data_nasc}
                  onChange={(e) => handleChange('data_nasc', e.target.value)}
                  disabled={loading}
                  className={errors.data_nasc ? 'error' : ''}
                />
                {errors.data_nasc && <span className="error-message">{errors.data_nasc}</span>}
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                E-mail *
                <input
                  type="email"
                  placeholder="email@exemplo.com"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={loading}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                Telefone *
                <input
                  type="text"
                  placeholder="(00) 00000-0000"
                  value={form.telefone}
                  onChange={(e) => handleChange('telefone', e.target.value)}
                  disabled={loading}
                  maxLength="15"
                  className={errors.telefone ? 'error' : ''}
                />
                {errors.telefone && <span className="error-message">{errors.telefone}</span>}
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                Senha *
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={form.senha}
                  onChange={(e) => handleChange('senha', e.target.value)}
                  disabled={loading}
                  className={errors.senha ? 'error' : ''}
                />
                {errors.senha && <span className="error-message">{errors.senha}</span>}
                <small className="password-hint">
                  Use pelo menos 8 caracteres com letras, números e símbolos
                </small>
              </label>
            </div>

            <div className="cadastro-admin-form-group">
              <label>
                Confirmar Senha *
                <input
                  type="password"
                  placeholder="Digite a senha novamente"
                  value={form.confirmar_senha}
                  onChange={(e) => handleChange('confirmar_senha', e.target.value)}
                  disabled={loading}
                  className={errors.confirmar_senha ? 'error' : ''}
                />
                {errors.confirmar_senha && <span className="error-message">{errors.confirmar_senha}</span>}
              </label>
            </div>
          </div>

          <div className="cadastro-admin-permissao">
            <label className="permissao-label">
              <input
                type="checkbox"
                checked={form.id_permissao === 1}
                onChange={() => handleChange('id_permissao', 1)}
                disabled={loading}
              />
              <span>Permissão de Administrador</span>
              <small className="permissao-hint">
                Este usuário terá acesso completo ao sistema administrativo
              </small>
            </label>
          </div>

          <div className="cadastro-admin-actions">
            <button 
              type="submit" 
              className="cadastro-admin-btn-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Cadastrando...
                </>
              ) : 'Cadastrar Administrador'}
            </button>
            
            <button 
              type="button" 
              className="cadastro-admin-btn-cancel"
              onClick={() => navigate('/admin/usuarios')}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>

        {mensagem && (
          <div className={`cadastro-admin-message ${erro ? 'error' : 'success'}`}>
            {mensagem}
          </div>
        )}

        <div className="cadastro-admin-info">
          <h3>📋 Informações importantes</h3>
          <ul>
            <li>Administradores têm acesso completo ao sistema</li>
            <li>É possível alterar permissões posteriormente</li>
            <li>O e-mail deve ser único no sistema</li>
            <li>A senha será criptografada e segura</li>
          </ul>
        </div>
      </main>

      <Footer />
    </div>
  );
}