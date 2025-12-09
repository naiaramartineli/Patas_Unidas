import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import "./login.css";
import dogImg from "../../../assets/cachorro.png";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [formError, setFormError] = useState("");
  
  const { login, loading, error, forgotPassword } = useAuth();
  const navigate = useNavigate();

  // Recuperação de senha
  const [showRecoverModal, setShowRecoverModal] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverMsg, setRecoverMsg] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  const clearMessages = () => {
    setFormError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    clearMessages();
    
    if (!email.trim()) {
      setFormError("Por favor, digite seu e-mail.");
      return;
    }

    if (!senha.trim()) {
      setFormError("Por favor, digite sua senha.");
      return;
    }

    if (senha.length < 6) {
      setFormError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    const result = await login(email, senha);
    
    if (result.success) {
      // Navega baseado na permissão do usuário
      const userRole = result.data.user.id_permissao;
      if (userRole === 1) {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      setFormError(result.error);
    }
  };

  const handleRecover = async () => {
    setRecoverMsg("");
    
    if (!recoverEmail.trim()) {
      setRecoverMsg("Digite um e-mail válido.");
      return;
    }

    try {
      setRecoverLoading(true);
      const result = await forgotPassword(recoverEmail);
      
      if (result.success) {
        setRecoverMsg("Se o e-mail existir em nosso sistema, você receberá um link de recuperação.");
        setRecoverEmail("");
        setTimeout(() => setShowRecoverModal(false), 3000);
      } else {
        setRecoverMsg(result.error || "Erro ao enviar solicitação.");
      }
    } catch (err) {
      setRecoverMsg("Erro ao conectar com o servidor.");
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <img src={dogImg} alt="Cachorrinho fofo" className="login-dog-image" />
        <div className="login-left-text">
          <h3>Patas Unidas</h3>
          <p>Conectando cães a lares cheios de amor</p>
        </div>
      </div>

      <div className="login-right">
        <form onSubmit={handleLogin}>
          <h2>Bem-vindo de volta!</h2>
          <p className="login-subtitle">Entre com sua conta para continuar</p>

          {(error || formError) && (
            <div className="login-error-msg">
              {formError || error}
            </div>
          )}

          <div className="login-form-group">
            <label>E-mail:</label>
            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearMessages(); }}
              required
              disabled={loading}
            />
          </div>

          <div className="login-form-group">
            <label>Senha:</label>
            <input
              type="password"
              placeholder="Digite sua senha"
              value={senha}
              onChange={(e) => { setSenha(e.target.value); clearMessages(); }}
              required
              disabled={loading}
            />
            <div className="login-forgot-password">
              <button
                type="button"
                className="login-forgot-link"
                onClick={(e) => {
                  e.preventDefault();
                  setShowRecoverModal(true);
                }}
                disabled={loading}
              >
                Esqueci minha senha
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-btn-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="login-spinner"></span>
                Entrando...
              </>
            ) : 'Entrar'}
          </button>

          <div className="login-register-link">
            <p>
              Não tem conta?
              <Link to="/registro" className="login-register-text">
                Cadastre-se aqui
              </Link>
            </p>
          </div>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="login-btn-guest"
            onClick={() => navigate('/caes')}
          >
            Continuar como visitante
          </button>
        </form>
      </div>

      {/* Modal de recuperação de senha */}
      {showRecoverModal && (
        <div className="login-modal-overlay" onClick={() => !recoverLoading && setShowRecoverModal(false)}>
          <div className="login-modal" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3>Recuperar senha</h3>
              <button 
                className="login-modal-close"
                onClick={() => setShowRecoverModal(false)}
                disabled={recoverLoading}
              >
                ×
              </button>
            </div>
            
            <div className="login-modal-body">
              <p>Digite seu e-mail para receber um link de recuperação:</p>
              
              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={recoverEmail}
                onChange={(e) => setRecoverEmail(e.target.value)}
                disabled={recoverLoading}
                className="login-modal-input"
              />

              {recoverMsg && (
                <div className={`login-modal-msg ${recoverMsg.includes('sucesso') ? 'success' : ''}`}>
                  {recoverMsg}
                </div>
              )}
            </div>

            <div className="login-modal-actions">
              <button 
                className="login-modal-btn-primary"
                onClick={handleRecover}
                disabled={recoverLoading}
              >
                {recoverLoading ? (
                  <>
                    <span className="login-modal-spinner"></span>
                    Enviando...
                  </>
                ) : 'Enviar link'}
              </button>
              
              <button 
                className="login-modal-btn-secondary"
                onClick={() => setShowRecoverModal(false)}
                disabled={recoverLoading}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}