class CPFUtils {
  /**
   * Remove tudo que não for número de um CPF
   * @param {string} cpf - CPF a ser limpo
   * @returns {string} CPF apenas com números
   */
  static limpar(cpf) {
    if (!cpf || typeof cpf !== 'string') {
      return '';
    }
    return cpf.replace(/\D/g, '');
  }

  /**
   * Aplica máscara ao CPF no formato 000.000.000-00
   * @param {string} cpf - CPF a ser mascarado
   * @returns {string} CPF formatado ou o original se inválido
   */
  static mascarar(cpf) {
    const clean = this.limpar(cpf);
    
    if (clean.length !== 11) {
      return cpf; // Retorna o original se não tiver 11 dígitos
    }

    return clean.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }

  /**
   * Valida se um CPF é válido
   * @param {string} cpf - CPF a ser validado
   * @returns {boolean} True se o CPF for válido
   */
  static validar(cpf) {
    try {
      // Verifica se foi fornecido um valor
      if (!cpf) {
        return false;
      }

      const clean = this.limpar(cpf);

      // Verifica se tem 11 dígitos
      if (clean.length !== 11) {
        return false;
      }

      // Rejeita sequências repetidas (11111111111, 00000000000...)
      if (/^(\d)\1{10}$/.test(clean)) {
        return false;
      }

      // Cálculo do primeiro dígito verificador
      let soma = 0;
      for (let i = 0; i < 9; i++) {
        soma += parseInt(clean.charAt(i)) * (10 - i);
      }

      let resto = soma % 11;
      let digitoVerificador1 = resto < 2 ? 0 : 11 - resto;

      if (digitoVerificador1 !== parseInt(clean.charAt(9))) {
        return false;
      }

      // Cálculo do segundo dígito verificador
      soma = 0;
      for (let i = 0; i < 10; i++) {
        soma += parseInt(clean.charAt(i)) * (11 - i);
      }

      resto = soma % 11;
      let digitoVerificador2 = resto < 2 ? 0 : 11 - resto;

      if (digitoVerificador2 !== parseInt(clean.charAt(10))) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Erro ao validar CPF:', error);
      return false;
    }
  }

  /**
   * Gera um CPF válido para testes (não use em produção!)
   * @returns {string} CPF válido gerado
   */
  static gerarCPFTeste() {
    // Gera 9 números aleatórios
    const numeros = Array.from({ length: 9 }, () => 
      Math.floor(Math.random() * 10)
    );

    // Calcula primeiro dígito
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += numeros[i] * (10 - i);
    }

    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    numeros.push(digito1);

    // Calcula segundo dígito
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += numeros[i] * (11 - i);
    }

    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    numeros.push(digito2);

    // Formata o CPF
    const cpfNumerico = numeros.join('');
    return this.mascarar(cpfNumerico);
  }

  /**
   * Normaliza um CPF (limpa e valida)
   * @param {string} cpf - CPF a ser normalizado
   * @returns {Object} Objeto com status e dados do CPF
   */
  static normalizar(cpf) {
    const limpo = this.limpar(cpf);
    const valido = this.validar(cpf);
    const formatado = valido ? this.mascarar(limpo) : cpf;

    return {
      original: cpf,
      limpo: limpo,
      formatado: formatado,
      valido: valido,
      tamanho: limpo.length
    };
  }

  /**
   * Verifica se dois CPFs são iguais (ignorando formatação)
   * @param {string} cpf1 - Primeiro CPF
   * @param {string} cpf2 - Segundo CPF
   * @returns {boolean} True se os CPFs forem iguais
   */
  static comparar(cpf1, cpf2) {
    if (!cpf1 || !cpf2) {
      return false;
    }

    const limpo1 = this.limpar(cpf1);
    const limpo2 = this.limpar(cpf2);

    return limpo1 === limpo2;
  }

  /**
   * Extrai informações de um CPF
   * @param {string} cpf - CPF a ser analisado
   * @returns {Object} Informações do CPF
   */
  static extrairInformacoes(cpf) {
    const normalizado = this.normalizar(cpf);
    const limpo = normalizado.limpo;

    if (!normalizado.valido || limpo.length !== 11) {
      return {
        valido: false,
        erro: 'CPF inválido'
      };
    }

    // Algumas informações que podem ser úteis (para análise apenas)
    return {
      valido: true,
      formatoOriginal: cpf,
      formatoLimpo: limpo,
      formatoMascarado: normalizado.formatado,
      // Os primeiros 8 dígitos são a base do CPF
      base: limpo.substring(0, 8),
      // Os dígitos 9-10 são o código da unidade federativa
      ufCodigo: parseInt(limpo.substring(8, 9)),
      // Dígitos verificadores
      digitoVerificador1: parseInt(limpo.charAt(9)),
      digitoVerificador2: parseInt(limpo.charAt(10)),
      // CPF completo sem máscara
      completo: limpo
    };
  }
}

// Exportações para compatibilidade com código existente
module.exports = {
  // Métodos estáticos como funções exportadas
  limparCPF: CPFUtils.limpar.bind(CPFUtils),
  mascararCPF: CPFUtils.mascarar.bind(CPFUtils),
  validarCPF: CPFUtils.validar.bind(CPFUtils),
  gerarCPFTeste: CPFUtils.gerarCPFTeste.bind(CPFUtils),
  normalizarCPF: CPFUtils.normalizar.bind(CPFUtils),
  compararCPF: CPFUtils.comparar.bind(CPFUtils),
  extrairInformacoesCPF: CPFUtils.extrairInformacoes.bind(CPFUtils),
  
  // Exporta a classe também, se necessário
  CPFUtils
};