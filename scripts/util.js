// utils.js - VERSÃO COMPLETA COM SEED PARA ALEATORIEDADE CONTROLADA

class Utils {
  // Embaralhar array (Fisher-Yates algorithm) - VERSÃO MELHORADA COM SEED
  static shuffleArray(array, seed = null) {
    const newArray = [...array];

    if (seed !== null) {
      // Usar seed para randomização controlada
      let random = this.seededRandom(seed);
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
    } else {
      // Randomização normal (Fisher-Yates original)
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
      }
    }

    return newArray;
  }

  // Gerador de números pseudo-aleatórios com seed
  static seededRandom(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  // Gerar ID único para jogos e sessões
  static generateUniqueId(prefix = "") {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9);
    return `${prefix}${timestamp}_${randomStr}`;
  }

  // Gerar opções erradas com base na resposta correta - VERSÃO MELHORADA
  static generateWrongOptions(
    correctAnswer,
    allQuestions,
    count = 3,
    seed = null
  ) {
    const wrongOptions = [];
    const usedIndexes = new Set();

    // Embaralhar perguntas com seed se fornecida
    const shuffledQuestions = seed
      ? this.shuffleArray([...allQuestions], seed)
      : this.shuffleArray([...allQuestions]);

    for (const question of shuffledQuestions) {
      if (wrongOptions.length >= count) break;

      const wrongAnswer = question.resposta_correta;

      // Garantir que a opção errada seja diferente da correta e única
      if (
        wrongAnswer !== correctAnswer &&
        !wrongOptions.includes(wrongAnswer)
      ) {
        wrongOptions.push(wrongAnswer);
      }
    }

    // Se não encontrou opções suficientes, completar com valores padrão
    while (wrongOptions.length < count) {
      const fallbackOption = `Opção ${wrongOptions.length + 1}`;
      if (!wrongOptions.includes(fallbackOption)) {
        wrongOptions.push(fallbackOption);
      }
    }

    return wrongOptions;
  }

  // Formatador de tempo (mm:ss)
  static formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return "00:00";
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Formatador de tempo extenso (minutos e segundos)
  static formatTimeExtended(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return "0 segundos";
    }

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs} segundos`;
    } else if (secs === 0) {
      return `${mins} minuto${mins > 1 ? "s" : ""}`;
    } else {
      return `${mins} minuto${mins > 1 ? "s" : ""} e ${secs} segundo${
        secs > 1 ? "s" : ""
      }`;
    }
  }

  // Obter parâmetro da URL
  static getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Obter todos os parâmetros da URL como objeto
  static getAllUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const params = {};
    for (const [key, value] of urlParams) {
      params[key] = value;
    }
    return params;
  }

  // Debounce function para otimizar eventos
  static debounce(func, wait, immediate = false) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        if (!immediate) func(...args);
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func(...args);
    };
  }

  // Throttle function para limitar frequência de execução
  static throttle(func, limit) {
    let inThrottle;
    return function (...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Validar email
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  // Validar se string está vazia
  static isEmpty(str) {
    return !str || str.trim().length === 0;
  }

  // Capitalizar primeira letra
  static capitalizeFirst(str) {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  // Truncar texto com ellipsis
  static truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substr(0, maxLength) + "...";
  }

  // Gerar cor hexadecimal aleatória
  static generateRandomColor() {
    return (
      "#" +
      Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, "0")
    );
  }

  // Calcular diferença entre duas datas em segundos
  static getTimeDifferenceInSeconds(startTime, endTime = Date.now()) {
    return Math.floor((endTime - startTime) / 1000);
  }

  // Converter segundos para objeto {hours, minutes, seconds}
  static secondsToTime(seconds) {
    if (isNaN(seconds) || seconds < 0) {
      return { hours: 0, minutes: 0, seconds: 0 };
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return { hours, minutes, seconds: secs };
  }

  // Formatar número com separadores de milhar
  static formatNumber(number) {
    return new Intl.NumberFormat("pt-BR").format(number);
  }

  // Clonar objeto profundamente
  static deepClone(obj) {
    if (obj === null || typeof obj !== "object") return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map((item) => this.deepClone(item));
    if (obj instanceof Object) {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  }

  // Mesclar objetos profundamente
  static deepMerge(target, source) {
    const output = this.deepClone(target);

    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            output[key] = this.deepClone(source[key]);
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          output[key] = source[key];
        }
      });
    }

    return output;
  }

  // Verificar se é objeto
  static isObject(item) {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  // Remover acentos de strings
  static removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  // Validar URL
  static isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  // Gerar hash simples para strings
  static generateHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  // Sleep function para delays assíncronos
  static sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Retry function para operações com tentativas
  static async retry(operation, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries) throw error;
        console.warn(
          `Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`
        );
        await this.sleep(delay);
      }
    }
  }

  // Sanitizar HTML para prevenir XSS
  static sanitizeHtml(unsafeText) {
    const div = document.createElement("div");
    div.textContent = unsafeText;
    return div.innerHTML;
  }

  // Copiar texto para área de transferência
  static async copyToClipboard(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback para browsers mais antigos
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error("Falha ao copiar texto:", error);
      return false;
    }
  }

  // Download de dados como arquivo
  static downloadData(data, filename, type = "text/plain") {
    const file = new Blob([data], { type });
    const a = document.createElement("a");
    const url = URL.createObjectURL(file);
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 0);
  }

  // Verificar se está em dispositivo móvel
  static isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  // Verificar se está online
  static isOnline() {
    return navigator.onLine;
  }

  // Adicionar listener para mudanças de conexão
  static onConnectionChange(callback) {
    window.addEventListener("online", () => callback(true));
    window.addEventListener("offline", () => callback(false));
  }

  // Logger com níveis de log
  static logger = {
    log: (message, ...args) => console.log(`📝 ${message}`, ...args),
    info: (message, ...args) => console.info(`ℹ️ ${message}`, ...args),
    warn: (message, ...args) => console.warn(`⚠️ ${message}`, ...args),
    error: (message, ...args) => console.error(`❌ ${message}`, ...args),
    debug: (message, ...args) => console.debug(`🐛 ${message}`, ...args),
    success: (message, ...args) => console.log(`✅ ${message}`, ...args),
  };

  // Medir performance de função
  static measurePerformance(fn, ...args) {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    return {
      result,
      time: end - start,
      timeFormatted: `${(end - start).toFixed(2)}ms`,
    };
  }
}

// Adicionar ao escopo global para fácil acesso
if (typeof window !== "undefined") {
  window.Utils = Utils;
}

// Export para módulos
if (typeof module !== "undefined" && module.exports) {
  module.exports = { Utils };
}
