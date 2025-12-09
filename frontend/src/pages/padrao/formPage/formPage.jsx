import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import DatePicker from "react-datepicker";
import { subYears } from "date-fns";
import ptBR from "date-fns/locale/pt-BR";
import { format, isValid } from "date-fns";

import "react-datepicker/dist/react-datepicker.css";
import "./formPage.css";
import dogImg from "../../../assets/cachorro.png";

// Máscara para CPF
const formatCPF = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
};

// Máscara para telefone
const formatPhone = (value) => {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

// Validação de CPF
function validarCPF(cpf) {
  if (!cpf) return false;
  
  const clean = cpf.replace(/\D/g, '');
  
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(clean[i], 10) * (10 - i);
  }
  let digito1 = (soma * 10) % 11;
  if (digito1 === 10) digito1 = 0;
  if (digito1 !== parseInt(clean[9], 10)) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(clean[i], 10) * (11 - i);
  }
  let digito2 = (soma * 10) % 11;
  if (digito2 === 10) digito2 = 0;
  if (digito2 !== parseInt(clean[10], 10)) return false;
  
  return true;
}

export default function FormPage() {
  const navigate = useNavigate();
  const { register, loading } = useAuth();

  const [formData, setFormData] = useState({
    nome: "",
    sobrenome: "",
    nome_social: "",
    cpf: "",
    data_nasc: null,
    email: "",
    telefone: "",
    senha: "",
    confirmar_senha: "",
  });

  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");

  // Regras da senha
  const password = formData.senha;
  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-]/.test(password),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);

  // Validação de CPF
  const isCpfValid = validarCPF(formData.cpf);

  // Validação de email
  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Aplica máscaras
    if (name === 'cpf') {
      formattedValue = formatCPF(value);
    } else if (name === 'telefone') {
      formattedValue = formatPhone(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue,
    }));

    // Limpa erro específico do campo
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setServerError("");
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      data_nasc: date,
    }));
    if (errors.data_nasc) {
      setErrors(prev => ({ ...prev, data_nasc: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = "Nome é obrigatório";
    if (!formData.sobrenome.trim()) newErrors.sobrenome = "Sobrenome é obrigatório";
    
    if (!formData.cpf.trim()) {
      newErrors.cpf = "CPF é obrigatório";
    } else if (!isCpfValid) {
      newErrors.cpf = "CPF inválido";
    }
    
    if (!formData.data_nasc) {
      newErrors.data_nasc = "Data de nascimento é obrigatória";
    } else {
      const age = new Date().getFullYear() - formData.data_nasc.getFullYear();
      if (age < 18) {
        newErrors.data_nasc = "Você deve ter pelo menos 18 anos";
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "E-mail é obrigatório";
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = "E-mail inválido";
    }
    
    if (!formData.telefone.trim()) {
      newErrors.telefone = "Telefone é obrigatório";
    } else if (formData.telefone.replace(/\D/g, '').length < 10) {
      newErrors.telefone = "Telefone inválido";
    }
    
    if (!formData.senha.trim()) {
      newErrors.senha = "Senha é obrigatória";
    } else if (!isPasswordStrong) {
      newErrors.senha = "Senha não atende aos requisitos";
    }
    
    if (!formData.confirmar_senha.trim()) {
      newErrors.confirmar_senha = "Confirme sua senha";
    } else if (formData.senha !== formData.confirmar_senha) {
      newErrors.confirmar_senha = "As senhas não coincidem";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

    try {
      // Formata dados para envio
      const payload = {
        nome: formData.nome.trim(),
        sobrenome: formData.sobrenome.trim(),
        nome_social: formData.nome_social ? formData.nome_social.trim() : null,
        cpf: formData.cpf.replace(/\D/g, ''),
        data_nasc: format(formData.data_nasc, 'yyyy-MM-dd'),
        email: formData.email.trim().toLowerCase(),
        telefone: formData.telefone.replace(/\D/g, ''),
        senha: formData.senha,
      };

      const result = await register(payload);
      
      if (result.success) {
        // Navega para dashboard
        if (result.data.user.id_permissao === 1) {
          navigate("/admin/dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setServerError(result.error);
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      setServerError("Erro ao conectar com o servidor. Tente novamente.");
    }
  };

  const maxDate = subYears(new Date(), 18);

  return (
    <div className="formpage-container">
      <div className="formpage-left">
        <img src={dogImg} alt="Cachorrinho fofo" className="formpage-dog-image" />
        <div className="formpage-left-text">
          <h3>Junte-se à nossa família</h3>
          <p>Cadastre-se e comece a fazer a diferença na vida de um cão hoje mesmo!</p>
          <ul className="formpage-benefits">
            <li>✓ Adote um amigo para toda vida</li>
            <li>✓ Receba suporte durante todo processo</li>
            <li>✓ Participe de nossa comunidade</li>
            <li>✓ Acompanhe seu processo de adoção</li>
          </ul>
        </div>
      </div>

      <div className="formpage-right">
        <form onSubmit={handleSubmit} className="formpage-form">
          <h2>Crie sua conta</h2>
          <p className="formpage-subtitle">Preencha os dados abaixo para se cadastrar</p>

          {serverError && (
            <div className="formpage-error-alert">
              {serverError}
            </div>
          )}

          <div className="formpage-row">
            <div className="formpage-form-group">
              <label>Nome *</label>
              <input
                type="text"
                name="nome"
                placeholder="Digite seu nome"
                value={formData.nome}
                onChange={handleChange}
                disabled={loading}
                className={errors.nome ? 'error' : ''}
              />
              {errors.nome && <span className="formpage-error-text">{errors.nome}</span>}
            </div>
            
            <div className="formpage-form-group">
              <label>Sobrenome *</label>
              <input
                type="text"
                name="sobrenome"
                placeholder="Digite seu sobrenome"
                value={formData.sobrenome}
                onChange={handleChange}
                disabled={loading}
                className={errors.sobrenome ? 'error' : ''}
              />
              {errors.sobrenome && <span className="formpage-error-text">{errors.sobrenome}</span>}
            </div>
          </div>

          <div className="formpage-form-group">
            <label>Nome Social (opcional)</label>
            <input
              type="text"
              name="nome_social"
              placeholder="Digite seu nome social"
              value={formData.nome_social}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="formpage-row">
            <div className="formpage-form-group">
              <label>CPF *</label>
              <input
                type="text"
                name="cpf"
                placeholder="000.000.000-00"
                value={formData.cpf}
                onChange={handleChange}
                disabled={loading}
                maxLength="14"
                className={errors.cpf ? 'error' : ''}
              />
              {errors.cpf && <span className="formpage-error-text">{errors.cpf}</span>}
              {formData.cpf && !isCpfValid && !errors.cpf && (
                <span className="formpage-error-text">CPF inválido</span>
              )}
            </div>
            
            <div className="formpage-form-group">
              <label>Data de nascimento *</label>
              <DatePicker
                selected={formData.data_nasc}
                onChange={handleDateChange}
                dateFormat="dd/MM/yyyy"
                maxDate={maxDate}
                minDate={subYears(new Date(), 100)}
                placeholderText="dd/mm/aaaa"
                locale={ptBR}
                showYearDropdown
                showMonthDropdown
                dropdownMode="select"
                disabled={loading}
                className={`formpage-datepicker ${errors.data_nasc ? 'error' : ''}`}
              />
              {errors.data_nasc && <span className="formpage-error-text">{errors.data_nasc}</span>}
            </div>
          </div>

          <div className="formpage-form-group">
            <label>E-mail *</label>
            <input
              type="email"
              name="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="formpage-error-text">{errors.email}</span>}
          </div>

          <div className="formpage-form-group">
            <label>Telefone *</label>
            <input
              type="text"
              name="telefone"
              placeholder="(00) 00000-0000"
              value={formData.telefone}
              onChange={handleChange}
              disabled={loading}
              maxLength="15"
              className={errors.telefone ? 'error' : ''}
            />
            {errors.telefone && <span className="formpage-error-text">{errors.telefone}</span>}
          </div>

          <div className="formpage-row">
            <div className="formpage-form-group">
              <label>Senha *</label>
              <input
                type="password"
                name="senha"
                placeholder="Crie uma senha forte"
                value={formData.senha}
                onChange={handleChange}
                disabled={loading}
                className={errors.senha ? 'error' : ''}
              />
              
              {/* Checklist de regras da senha */}
              <div className="formpage-password-rules">
                <p className="formpage-password-title">Sua senha deve conter:</p>
                <ul>
                  <li className={passwordChecks.length ? 'valid' : 'invalid'}>
                    • Mínimo de 8 caracteres
                  </li>
                  <li className={passwordChecks.upper ? 'valid' : 'invalid'}>
                    • Pelo menos 1 letra maiúscula
                  </li>
                  <li className={passwordChecks.number ? 'valid' : 'invalid'}>
                    • Pelo menos 1 número
                  </li>
                  <li className={passwordChecks.special ? 'valid' : 'invalid'}>
                    • Pelo menos 1 caractere especial
                  </li>
                </ul>
              </div>
              {errors.senha && <span className="formpage-error-text">{errors.senha}</span>}
            </div>

            <div className="formpage-form-group">
              <label>Confirmar Senha *</label>
              <input
                type="password"
                name="confirmar_senha"
                placeholder="Digite a senha novamente"
                value={formData.confirmar_senha}
                onChange={handleChange}
                disabled={loading}
                className={errors.confirmar_senha ? 'error' : ''}
              />
              {errors.confirmar_senha && <span className="formpage-error-text">{errors.confirmar_senha}</span>}
            </div>
          </div>

          <div className="formpage-terms">
            <input type="checkbox" id="terms" required />
            <label htmlFor="terms">
              Concordo com os <Link to="/termos">Termos de Uso</Link> e 
              <Link to="/privacidade"> Política de Privacidade</Link>
            </label>
          </div>

          <button
            type="submit"
            className="formpage-btn-submit"
            disabled={loading || !isPasswordStrong || !isCpfValid}
          >
            {loading ? (
              <>
                <span className="formpage-spinner"></span>
                Cadastrando...
              </>
            ) : 'Criar conta'}
          </button>

          <p className="formpage-login-link">
            Já possui uma conta? <Link to="/login">Faça login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}