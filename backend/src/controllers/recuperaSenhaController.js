const Usuario = require('../models/userModel');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Configuração do email (em produção, use variáveis de ambiente)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE || false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Solicitar recuperação de senha
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    // Gerar token de recuperação
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora
    
    await Usuario.createPasswordResetToken(email, resetToken, resetTokenExpiry);
    
    // Enviar email (em desenvolvimento, apenas retornar o token)
    if (process.env.NODE_ENV === 'production') {
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: email,
        subject: 'Recuperação de Senha - Sistema de Adoção',
        html: `
          <h1>Recuperação de Senha</h1>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          <a href="${resetUrl}">${resetUrl}</a>
          <p>Este link expira em 1 hora.</p>
          <p>Se você não solicitou esta recuperação, ignore este email.</p>
        `
      });
    }
    
    res.json({ 
      message: 'Email de recuperação enviado com sucesso!',
      token: process.env.NODE_ENV === 'development' ? resetToken : null
    });
    
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    
    if (error.message === 'Usuário não encontrado') {
      // Por segurança, não revelar que o usuário não existe
      return res.json({ 
        message: 'Se o email existir, você receberá um link de recuperação' 
      });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Validar token de recuperação
exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const isValid = await Usuario.validatePasswordResetToken(token);
    
    if (!isValid) {
      return res.status(400).json({ 
        error: 'Token inválido ou expirado' 
      });
    }
    
    res.json({ valid: true });
    
  } catch (error) {
    console.error('Erro ao validar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Redefinir senha
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password || password.length < 6) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 6 caracteres' 
      });
    }
    
    await Usuario.resetPassword(token, password);
    
    res.json({ message: 'Senha redefinida com sucesso!' });
    
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    
    if (error.message === 'Token inválido ou expirado') {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};