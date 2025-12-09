
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.configurado = false;
    this.configurar();
  }

  /**
   * Configura o transporter de email
   */
  configurar() {
    try {
      const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_SECURE } = process.env;

      if (!EMAIL_USER || !EMAIL_PASS) {
        console.warn('⚠️  Configuração de email incompleta. Verifique as variáveis de ambiente.');
        this.configurado = false;
        return;
      }

      const config = {
        host: EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(EMAIL_PORT) || 587,
        secure: EMAIL_SECURE === 'true' || false,
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS
        }
      };

      // Configurações adicionais para Gmail
      if (config.host.includes('gmail')) {
        config.service = 'gmail';
      }

      this.transporter = nodemailer.createTransport(config);
      this.configurado = true;

      console.log('✓ Serviço de email configurado');
    } catch (error) {
      console.error('❌ Erro ao configurar serviço de email:', error);
      this.configurado = false;
    }
  }

  /**
   * Envia um email
   * @param {Object} options - Opções do email
   * @returns {Promise<Object>} Resultado do envio
   */
  async enviar(options) {
    if (!this.configurado || !this.transporter) {
      throw new Error('Serviço de email não configurado');
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || `"Patas Unidas 🐾" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.htmlParaTexto(options.html),
        cc: options.cc,
        bcc: options.bcc,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      console.log(`✓ Email enviado para: ${options.to} - Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      throw new Error(`Falha ao enviar email: ${error.message}`);
    }
  }

  /**
   * Converte HTML para texto simples (para clients que não suportam HTML)
   * @param {string} html - Conteúdo HTML
   * @returns {string} Texto simplificado
   */
  htmlParaTexto(html) {
    if (!html) return '';

    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }

  /**
   * Envia email de recuperação de senha
   * @param {string} email - Email do destinatário
   * @param {string} token - Token de recuperação
   * @returns {Promise<Object>} Resultado do envio
   */
  async enviarRecuperacaoSenha(email, token) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/resetar-senha/${token}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .button { 
            display: inline-block; 
            padding: 12px 24px; 
            background-color: #4CAF50; 
            color: white; 
            text-decoration: none; 
            border-radius: 5px; 
            margin: 20px 0; 
          }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Patas Unidas 🐾</h1>
          </div>
          <div class="content">
            <h2>Recuperação de Senha</h2>
            <p>Olá,</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para criar uma nova senha:</p>
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Redefinir Senha</a>
            </p>
            <p>Se você não solicitou a recuperação de senha, ignore este email.</p>
            <p>Este link expira em 1 hora.</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Patas Unidas. Todos os direitos reservados.</p>
            <p>Este é um email automático, por favor não responda.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.enviar({
      to: email,
      subject: 'Recuperação de Senha - Patas Unidas',
      html: html
    });
  }

  /**
   * Envia email de confirmação de cadastro
   * @param {string} email - Email do destinatário
   * @param {string} nome - Nome do usuário
   * @returns {Promise<Object>} Resultado do envio
   */
  async enviarConfirmacaoCadastro(email, nome) {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Patas Unidas 🐾</h1>
          </div>
          <div class="content">
            <h2>Bem-vindo(a), ${nome}!</h2>
            <p>Sua conta foi criada com sucesso no sistema Patas Unidas.</p>
            <p>Agora você pode:</p>
            <ul>
              <li>Visualizar animais disponíveis para adoção</li>
              <li>Solicitar adoção de animais</li>
              <li>Apadrinhar animais</li>
              <li>Acompanhar seu histórico</li>
            </ul>
            <p>Acesse nosso sistema e comece a fazer a diferença na vida dos animais!</p>
            <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login">Clique aqui para acessar sua conta</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Patas Unidas. Todos os direitos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.enviar({
      to: email,
      subject: 'Conta criada com sucesso - Patas Unidas',
      html: html
    });
  }

  /**
   * Envia email de confirmação de adoção
   * @param {Object} dados - Dados da adoção
   * @returns {Promise<Object>} Resultado do envio
   */
  async enviarConfirmacaoAdocao(dados) {
    const { email, nomeUsuario, nomeAnimal, dataAdocao, idAdocao } = dados;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
          .content { padding: 30px; background-color: #f9f9f9; }
          .info-box { background: white; padding: 15px; border-radius: 5px; border: 1px solid #ddd; margin: 15px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Patas Unidas 🐾</h1>
            <h2>Confirmação de Adoção</h2>
          </div>
          <div class="content">
            <p>Olá, <strong>${nomeUsuario}</strong>!</p>
            <p>Sua solicitação de adoção foi recebida com sucesso.</p>
            
            <div class="info-box">
              <h3>Detalhes da Adoção:</h3>
              <p><strong>Animal:</strong> ${nomeAnimal}</p>
              <p><strong>Data da Solicitação:</strong> ${new Date(dataAdocao).toLocaleDateString('pt-BR')}</p>
              <p><strong>Número da Solicitação:</strong> #${idAdocao}</p>
            </div>

            <p>Nossa equipe irá analisar sua solicitação e entrará em contato em breve para dar continuidade ao processo.</p>
            
            <p><strong>Próximos passos:</strong></p>
            <ol>
              <li>Análise da documentação</li>
              <li>Visita técnica (se necessário)</li>
              <li>Assinatura do termo de adoção</li>
              <li>Busca do animal</li>
            </ol>

            <p>Obrigado por escolher adotar e dar um lar cheio de amor!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} Patas Unidas. Todos os direitos reservados.</p>
            <p>Dúvidas? Entre em contato: contato@patasunidas.org</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.enviar({
      to: email,
      subject: `Confirmação de Adoção - ${nomeAnimal}`,
      html: html
    });
  }

  /**
   * Verifica a conexão com o servidor de email
   * @returns {Promise<boolean>} True se a conexão for bem-sucedida
   */
  async verificarConexao() {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      console.log('✓ Conexão com servidor de email verificada');
      return true;
    } catch (error) {
      console.error('❌ Falha na conexão com servidor de email:', error);
      return false;
    }
  }
}

// Instância singleton
const emailService = new EmailService();

// Exportação para compatibilidade
module.exports = {
  // Métodos principais
  enviarEmail: (to, subject, html) => emailService.enviar({ to, subject, html }),
  enviarRecuperacaoSenha: (email, token) => emailService.enviarRecuperacaoSenha(email, token),
  enviarConfirmacaoCadastro: (email, nome) => emailService.enviarConfirmacaoCadastro(email, nome),
  enviarConfirmacaoAdocao: (dados) => emailService.enviarConfirmacaoAdocao(dados),
  
  // Gerenciamento
  verificarConexaoEmail: () => emailService.verificarConexao(),
  
  // Classe para uso personalizado
  EmailService
};