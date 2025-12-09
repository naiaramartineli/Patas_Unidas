const crypto = require('crypto');

class CryptoCPF {
  constructor() {
    this.ALGORITHM = 'aes-256-cbc';
    this.IV = Buffer.alloc(16, 0);
    this.KEY = this.generateKey();
  }

  /**
   * Gera a chave de criptografia baseada na variável de ambiente
   * @returns {Buffer} Chave de criptografia
   */
  generateKey() {
    if (!process.env.CPF_SECRET) {
      console.error('⚠️  AVISO: CPF_SECRET não definido. Usando valor padrão (NÃO SEGURO PARA PRODUÇÃO!)');
      // Valor padrão apenas para desenvolvimento
      const defaultSecret = 'senha_foda_pra_caralho';
      return crypto
        .createHash('sha256')
        .update(String(defaultSecret))
        .digest('base64')
        .substring(0, 32);
    }

    return crypto
      .createHash('sha256')
      .update(String(process.env.CPF_SECRET))
      .digest('base64')
      .substring(0, 32);
  }

  /**
   * Criptografa um CPF
   * @param {string} cpf - CPF a ser criptografado
   * @returns {string} CPF criptografado em hexadecimal
   */
  criptografar(cpf) {
    try {
      if (!cpf || typeof cpf !== 'string') {
        throw new Error('CPF inválido para criptografia');
      }

      const cipher = crypto.createCipheriv(this.ALGORITHM, this.KEY, this.IV);
      const encrypted = cipher.update(cpf, 'utf8', 'hex') + cipher.final('hex');
      
      return encrypted;
    } catch (error) {
      console.error('Erro ao criptografar CPF:', error);
      throw new Error('Falha ao criptografar CPF');
    }
  }

  /**
   * Descriptografa um CPF criptografado
   * @param {string} hash - Hash criptografado do CPF
   * @returns {string} CPF descriptografado
   */
  descriptografar(hash) {
    try {
      if (!hash || typeof hash !== 'string') {
        throw new Error('Hash inválido para descriptografia');
      }

      const decipher = crypto.createDecipheriv(this.ALGORITHM, this.KEY, this.IV);
      const decrypted = decipher.update(hash, 'hex', 'utf8') + decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('Erro ao descriptografar CPF:', error);
      throw new Error('Falha ao descriptografar CPF');
    }
  }

  /**
   * Verifica se um hash corresponde a um CPF
   * @param {string} hash - Hash criptografado
   * @param {string} cpf - CPF em texto plano para comparação
   * @returns {boolean} True se corresponder
   */
  verificar(hash, cpf) {
    try {
      const decrypted = this.descriptografar(hash);
      return decrypted === cpf;
    } catch (error) {
      return false;
    }
  }

  /**
   * Gera um hash seguro (para armazenamento de CPF)
   * @param {string} cpf - CPF a ser hasheado
   * @returns {Object} Objeto com hash e salt
   */
  gerarHashSeguro(cpf) {
    try {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto
        .pbkdf2Sync(cpf, salt, 1000, 64, 'sha512')
        .toString('hex');
      
      return {
        hash,
        salt,
        algoritmo: 'pbkdf2-sha512'
      };
    } catch (error) {
      console.error('Erro ao gerar hash seguro:', error);
      throw new Error('Falha ao gerar hash de CPF');
    }
  }

  /**
   * Verifica CPF com hash seguro
   * @param {string} cpf - CPF em texto plano
   * @param {string} hash - Hash armazenado
   * @param {string} salt - Salt usado no hash
   * @returns {boolean} True se corresponder
   */
  verificarHashSeguro(cpf, hash, salt) {
    try {
      const hashVerificado = crypto
        .pbkdf2Sync(cpf, salt, 1000, 64, 'sha512')
        .toString('hex');
      
      return hashVerificado === hash;
    } catch (error) {
      return false;
    }
  }
}

// Instância singleton para reutilização
const cryptoCPF = new CryptoCPF();

// Exportações para compatibilidade
module.exports = {
  // Métodos da instância
  criptografarCPF: (cpf) => cryptoCPF.criptografar(cpf),
  descriptografarCPF: (hash) => cryptoCPF.descriptografar(hash),
  verificarCPF: (hash, cpf) => cryptoCPF.verificar(hash, cpf),
  gerarHashSeguroCPF: (cpf) => cryptoCPF.gerarHashSeguro(cpf),
  verificarHashSeguroCPF: (cpf, hash, salt) => cryptoCPF.verificarHashSeguro(cpf, hash, salt),
  
  // Classe para uso personalizado
  CryptoCPF
};