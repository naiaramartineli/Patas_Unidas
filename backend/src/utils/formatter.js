
class Formatters {
  /**
   * Remove tudo que não for número
   * @param {string} valor - Valor a ser limpo
   * @returns {string} Valor apenas com números
   */
  static limparNumeros(valor) {
    if (!valor || typeof valor !== 'string') {
      return '';
    }
    return valor.replace(/\D/g, '');
  }

  /**
   * Remove tudo que não for número (específico para CPF)
   * @param {string} cpf - CPF a ser limpo
   * @returns {string} CPF apenas com números
   */
  static limparCPF(cpf) {
    return this.limparNumeros(cpf);
  }

  /**
   * Formata data para YYYY-MM-DD (formato MySQL)
   * @param {string|Date} data - Data a ser formatada
   * @returns {string|null} Data formatada ou null se inválida
   */
  static formatarDataMySQL(data) {
    try {
      if (!data) {
        return null;
      }

      let dataObj;
      
      if (data instanceof Date) {
        dataObj = data;
      } else if (typeof data === 'string') {
        // Tenta interpretar como data ISO
        if (data.includes('T')) {
          dataObj = new Date(data);
        } 
        // Formato brasileiro dd/mm/yyyy
        else if (data.includes('/')) {
          const [dia, mes, ano] = data.split('/').map(Number);
          if (dia && mes && ano) {
            dataObj = new Date(ano, mes - 1, dia);
          }
        }
        // Formato yyyy-mm-dd
        else if (data.includes('-')) {
          const [ano, mes, dia] = data.split('-').map(Number);
          if (ano && mes && dia) {
            dataObj = new Date(ano, mes - 1, dia);
          }
        }
      }

      if (!dataObj || isNaN(dataObj.getTime())) {
        return null;
      }

      const ano = dataObj.getFullYear();
      const mes = String(dataObj.getMonth() + 1).padStart(2, '0');
      const dia = String(dataObj.getDate()).padStart(2, '0');

      return `${ano}-${mes}-${dia}`;
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return null;
    }
  }

  /**
   * Formata data para dd/mm/yyyy (formato brasileiro)
   * @param {string|Date} data - Data a ser formatada
   * @returns {string|null} Data formatada ou null se inválida
   */
  static formatarDataBrasileira(data) {
    try {
      const dataMySQL = this.formatarDataMySQL(data);
      if (!dataMySQL) {
        return null;
      }

      const [ano, mes, dia] = dataMySQL.split('-');
      return `${dia}/${mes}/${ano}`;
    } catch (error) {
      console.error('Erro ao formatar data brasileira:', error);
      return null;
    }
  }

  /**
   * Aplica máscara de CPF (000.000.000-00)
   * @param {string} cpf - CPF a ser mascarado
   * @returns {string} CPF formatado
   */
  static mascararCPF(cpf) {
    const limpo = this.limparCPF(cpf);
    
    if (limpo.length !== 11) {
      return cpf; // Retorna original se não tiver 11 dígitos
    }

    return limpo.replace(
      /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
      '$1.$2.$3-$4'
    );
  }

  /**
   * Aplica máscara de telefone ((00) 00000-0000)
   * @param {string} telefone - Telefone a ser mascarado
   * @returns {string} Telefone formatado
   */
  static mascararTelefone(telefone) {
    const limpo = this.limparNumeros(telefone);
    
    if (limpo.length === 11) {
      return limpo.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        '($1) $2-$3'
      );
    } else if (limpo.length === 10) {
      return limpo.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        '($1) $2-$3'
      );
    }
    
    return telefone;
  }

  /**
   * Aplica máscara de CEP (00000-000)
   * @param {string} cep - CEP a ser mascarado
   * @returns {string} CEP formatado
   */
  static mascararCEP(cep) {
    const limpo = this.limparNumeros(cep);
    
    if (limpo.length === 8) {
      return limpo.replace(
        /^(\d{5})(\d{3})$/,
        '$1-$2'
      );
    }
    
    return cep;
  }

  /**
   * Formata valor monetário (R$ 1.000,00)
   * @param {number|string} valor - Valor a ser formatado
   * @param {boolean} incluirSimbolo - Incluir símbolo R$
   * @returns {string} Valor formatado
   */
  static formatarMoeda(valor, incluirSimbolo = true) {
    try {
      const numero = typeof valor === 'string' 
        ? parseFloat(valor.replace(/[^\d.,]/g, '').replace(',', '.')) 
        : Number(valor);
      
      if (isNaN(numero)) {
        return incluirSimbolo ? 'R$ 0,00' : '0,00';
      }

      const formatado = numero.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });

      return incluirSimbolo ? `R$ ${formatado}` : formatado;
    } catch (error) {
      console.error('Erro ao formatar moeda:', error);
      return incluirSimbolo ? 'R$ 0,00' : '0,00';
    }
  }

  /**
   * Formata nome próprio (capitaliza palavras)
   * @param {string} nome - Nome a ser formatado
   * @returns {string} Nome formatado
   */
  static formatarNome(nome) {
    if (!nome || typeof nome !== 'string') {
      return '';
    }

    // Lista de palavras que não devem ser capitalizadas
    const palavrasMenores = ['de', 'da', 'do', 'das', 'dos', 'e'];
    
    return nome
      .toLowerCase()
      .split(' ')
      .map((palavra, index) => {
        // Primeira palavra sempre capitalizada
        if (index === 0) {
          return palavra.charAt(0).toUpperCase() + palavra.slice(1);
        }
        
        // Palavras menores não são capitalizadas
        if (palavrasMenores.includes(palavra)) {
          return palavra;
        }
        
        return palavra.charAt(0).toUpperCase() + palavra.slice(1);
      })
      .join(' ');
  }

  /**
   * Trunca texto com elipses
   * @param {string} texto - Texto a ser truncado
   * @param {number} maxLength - Tamanho máximo
   * @returns {string} Texto truncado
   */
  static truncarTexto(texto, maxLength = 100) {
    if (!texto || typeof texto !== 'string') {
      return '';
    }
    
    if (texto.length <= maxLength) {
      return texto;
    }
    
    return texto.substring(0, maxLength - 3) + '...';
  }

  /**
   * Normaliza string (remove acentos, coloca em minúsculas)
   * @param {string} texto - Texto a ser normalizado
   * @returns {string} Texto normalizado
   */
  static normalizarTexto(texto) {
    if (!texto || typeof texto !== 'string') {
      return '';
    }
    
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .trim();
  }
}

// Exportações para compatibilidade
module.exports = {
  // Métodos principais
  limparCpf: Formatters.limparCPF.bind(Formatters),
  mascararCpf: Formatters.mascararCPF.bind(Formatters),
  parseDataNascimento: Formatters.formatarDataMySQL.bind(Formatters),
  
  // Novos métodos
  formatarDataMySQL: Formatters.formatarDataMySQL.bind(Formatters),
  formatarDataBrasileira: Formatters.formatarDataBrasileira.bind(Formatters),
  mascararTelefone: Formatters.mascararTelefone.bind(Formatters),
  mascararCEP: Formatters.mascararCEP.bind(Formatters),
  formatarMoeda: Formatters.formatarMoeda.bind(Formatters),
  formatarNome: Formatters.formatarNome.bind(Formatters),
  truncarTexto: Formatters.truncarTexto.bind(Formatters),
  normalizarTexto: Formatters.normalizarTexto.bind(Formatters),
  
  // Classe para uso personalizado
  Formatters
};