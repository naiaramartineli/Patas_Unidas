const crypto = require('crypto');
const bcrypt = require('bcrypt');
const db = require('../config/db');
const nodemailer = require('nodemailer');

// Configuração do email
const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
};

const transporter = nodemailer.createTransport(emailConfig);

// Solicitar recuperação de senha
exports.requestPasswordReset = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email é obrigatório' });
    }
    
    // Verificar se usuário existe
    const [users] = await connection.execute(
      `SELECT u.id_usuario, u.nome, l.email 
       FROM usuario u
       INNER JOIN login l ON u.id_usuario = l.id_usuario
       WHERE l.email = ? AND u.deleteAt IS NULL`,
      [email]
    );
    
    if (users.length === 0) {
      await connection.rollback();
      // Por segurança, não informamos se o email existe ou não
      return res.json({ 
        message: 'Se o email existir em nosso sistema, você receberá um link de recuperação' 
      });
    }
    
    const user = users[0];
    
    // Gerar token único
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    
    // Definir expiração (1 hora)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    
    // Verificar se já existe um token ativo para este usuário
    await connection.execute(
      'UPDATE reset_senha SET usado = 1 WHERE id_usuario = ? AND usado = 0',
      [user.id_usuario]
    );
    
    // Inserir novo token
    await connection.execute(
      `INSERT INTO reset_senha (id_usuario, token_hash, expires_at, criado_em)
       VALUES (?, ?, ?, NOW())`,
      [user.id_usuario, resetTokenHash, expiresAt]
    );
    
    // Criar link de recuperação
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/recuperar-senha?token=${resetToken}`;
    
    // Enviar email
    const mailOptions = {
      from: `"Patas Unidas" <${process.env.EMAIL_FROM || 'noreply@patasunidas.com'}>`,
      to: user.email,
      subject: 'Recuperação de Senha - Patas Unidas',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Recuperação de Senha</h2>
          <p>Olá ${user.nome},</p>
          <p>Recebemos uma solicitação para redefinir a senha da sua conta no Patas Unidas.</p>
          <p>Clique no link abaixo para criar uma nova senha:</p>
          <p>
            <a href="${resetLink}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              Redefinir Senha
            </a>
          </p>
          <p>Este link é válido por 1 hora. Se você não solicitou a recuperação de senha, ignore este email.</p>
          <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
          <p>${resetLink}</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            Esta é uma mensagem automática, por favor não responda este email.
          </p>
        </div>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    await connection.commit();
    
    res.json({ 
      message: 'Se o email existir em nosso sistema, você receberá um link de recuperação' 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao solicitar recuperação de senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
};

// Verificar token de recuperação
exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token) {
      return res.status(400).json({ error: 'Token é obrigatório' });
    }
    
    // Hash do token fornecido
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Buscar token no banco
    const [tokens] = await db.execute(
      `SELECT rs.*, u.nome, u.email 
       FROM reset_senha rs
       INNER JOIN usuario u ON rs.id_usuario = u.id_usuario
       WHERE rs.token_hash = ? AND rs.usado = 0 AND rs.expires_at > NOW()
       AND u.deleteAt IS NULL`,
      [tokenHash]
    );
    
    if (tokens.length === 0) {
      return res.status(400).json({ 
        error: 'Token inválido ou expirado' 
      });
    }
    
    res.json({ 
      valid: true,
      email: tokens[0].email,
      nome: tokens[0].nome
    });
    
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Redefinir senha
exports.resetPassword = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const { token, nova_senha } = req.body;
    
    if (!token || !nova_senha) {
      return res.status(400).json({ 
        error: 'Token e nova senha são obrigatórios' 
      });
    }
    
    // Validar força da senha
    if (nova_senha.length < 8) {
      return res.status(400).json({ 
        error: 'A senha deve ter pelo menos 8 caracteres' 
      });
    }
    
    // Hash do token fornecido
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    
    // Buscar token no banco
    const [tokens] = await connection.execute(
      `SELECT rs.* 
       FROM reset_senha rs
       INNER JOIN usuario u ON rs.id_usuario = u.id_usuario
       WHERE rs.token_hash = ? AND rs.usado = 0 AND rs.expires_at > NOW()
       AND u.deleteAt IS NULL`,
      [tokenHash]
    );
    
    if (tokens.length === 0) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'Token inválido ou expirado' 
      });
    }
    
    const resetToken = tokens[0];
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(nova_senha, 10);
    
    // Atualizar senha no login
    await connection.execute(
      'UPDATE login SET senha = ? WHERE id_usuario = ?',
      [hashedPassword, resetToken.id_usuario]
    );
    
    // Marcar token como usado
    await connection.execute(
      'UPDATE reset_senha SET usado = 1 WHERE id = ?',
      [resetToken.id]
    );
    
    // Buscar informações do usuário para email
    const [users] = await connection.execute(
      `SELECT u.nome, u.email 
       FROM usuario u
       INNER JOIN login l ON u.id_usuario = l.id_usuario
       WHERE u.id_usuario = ?`,
      [resetToken.id_usuario]
    );
    
    await connection.commit();
    
    // Enviar email de confirmação
    if (users.length > 0) {
      const user = users[0];
      
      const mailOptions = {
        from: `"Patas Unidas" <${process.env.EMAIL_FROM || 'noreply@patasunidas.com'}>`,
        to: user.email,
        subject: 'Senha Alterada com Sucesso - Patas Unidas',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Senha Alterada</h2>
            <p>Olá ${user.nome},</p>
            <p>Sua senha foi alterada com sucesso.</p>
            <p>Se você não realizou esta alteração, entre em contato imediatamente com nosso suporte.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">
              Esta é uma mensagem automática, por favor não responda este email.
            </p>
          </div>
        `
      };
      
      try {
        await transporter.sendMail(mailOptions);
      } catch (emailError) {
        console.error('Erro ao enviar email de confirmação:', emailError);
        // Não falhar a operação principal por causa do email
      }
    }
    
    res.json({ 
      message: 'Senha alterada com sucesso!' 
    });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao redefinir senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
};

// Alterar senha (usuário logado)
exports.changePassword = async (req, res) => {
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const id_usuario = req.user.id_usuario;
    const { senha_atual, nova_senha } = req.body;
    
    // Validar campos
    if (!senha_atual || !nova_senha) {
      return res.status(400).json({ 
        error: 'Senha atual e nova senha são obrigatórias' 
      });
    }
    
    // Validar força da nova senha
    if (nova_senha.length < 8) {
      return res.status(400).json({ 
        error: 'A nova senha deve ter pelo menos 8 caracteres' 
      });
    }
    
    // Buscar senha atual
    const [logins] = await connection.execute(
      'SELECT senha FROM login WHERE id_usuario = ?',
      [id_usuario]
    );
    
    if (logins.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    
    // Verificar senha atual
    const validPassword = await bcrypt.compare(senha_atual, logins[0].senha);
    
    if (!validPassword) {
      await connection.rollback();
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }
    
    // Verificar se nova senha é diferente da atual
    const samePassword = await bcrypt.compare(nova_senha, logins[0].senha);
    if (samePassword) {
      await connection.rollback();
      return res.status(400).json({ 
        error: 'A nova senha deve ser diferente da senha atual' 
      });
    }
    
    // Hash da nova senha
    const hashedPassword = await bcrypt.hash(nova_senha, 10);
    
    // Atualizar senha
    await connection.execute(
      'UPDATE login SET senha = ? WHERE id_usuario = ?',
      [hashedPassword, id_usuario]
    );
    
    await connection.commit();
    
    res.json({ message: 'Senha alterada com sucesso!' });
    
  } catch (error) {
    await connection.rollback();
    console.error('Erro ao alterar senha:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    connection.release();
  }
};