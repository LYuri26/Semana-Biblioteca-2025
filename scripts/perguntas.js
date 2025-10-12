// perguntas.js - VERSÃO COMPLETA COM ALEATORIEDADE AVANÇADA

class QuestionManager {
  // Carregar perguntas do JSON
  static async loadQuestions() {
    try {
      const response = await fetch("arquivos/dados/perguntas.json");
      if (!response.ok) throw new Error("Erro ao carregar perguntas");

      const data = await response.json();
      const questions = data.perguntas;
      const wrongOptionsPool = data.opcoes_erradas || [];
      const totalRounds = data.configuracoes?.total_rodadas || 4;
      const totalTime = data.configuracoes?.tempo_total_jogo || 180;

      // Seleção mais aleatória usando timestamp
      const seed = Date.now() % 1000;
      const shuffledQuestions = this.shuffleArray([...questions], seed);
      const selectedQuestions = shuffledQuestions.slice(0, totalRounds);

      console.log(`📚 Carregadas ${selectedQuestions.length} perguntas únicas`);

      return {
        questions,
        wrongOptionsPool,
        selectedQuestions,
        totalRounds,
        totalTime,
      };
    } catch (error) {
      console.error("❌ Erro ao carregar perguntas:", error);
      throw error;
    }
  }

  // Preparar opções com maior aleatoriedade
  static prepareQuestionOptions(question, wrongOptionsPool) {
    const options = [];
    const correctAnswer = question.opcoes[question.resposta_correta];
    options.push(correctAnswer);

    const totalOptions = 4;

    // Filtrar opções erradas de forma mais rigorosa
    const filteredWrongOptions = wrongOptionsPool.filter(
      (opt) =>
        opt !== correctAnswer &&
        !question.opcoes.includes(opt) &&
        opt &&
        opt.trim() !== ""
    );

    // Se não houver opções erradas suficientes, completar com outras opções da pergunta
    let availableWrongOptions = [...filteredWrongOptions];
    if (availableWrongOptions.length < totalOptions - 1) {
      const otherQuestionOptions = question.opcoes.filter(
        (opt) => opt !== correctAnswer
      );
      availableWrongOptions = [
        ...availableWrongOptions,
        ...otherQuestionOptions,
      ];
    }

    // Embaralhar com seed baseada no timestamp
    const seed = Date.now() % 1000;
    const shuffledWrongOptions = this.shuffleArray(availableWrongOptions, seed);

    // Pegar opções únicas
    const neededWrongOptions = shuffledWrongOptions.slice(0, totalOptions - 1);
    options.push(...neededWrongOptions);

    // Embaralhar final com seed diferente
    const finalSeed = (Date.now() + Math.random() * 1000) % 1000;
    const shuffledOptions = this.shuffleArray(options, finalSeed);

    // Obter índice da resposta correta
    const correctIndex = shuffledOptions.findIndex(
      (opt) => opt === correctAnswer
    );

    // Validar que temos uma resposta correta válida
    if (correctIndex === -1) {
      console.warn(
        "⚠️ Resposta correta não encontrada nas opções, usando fallback"
      );
      return {
        options: [...shuffledOptions, correctAnswer],
        correctIndex: shuffledOptions.length,
      };
    }

    return {
      options: shuffledOptions,
      correctIndex: correctIndex,
    };
  }

  // NOVO MÉTODO: Gerar conjunto único de perguntas para uma dupla
  static async generateUniqueQuestionSet(totalRounds = 4) {
    try {
      const response = await fetch("arquivos/dados/perguntas.json");
      if (!response.ok) throw new Error("Erro ao carregar perguntas");

      const data = await response.json();
      const allQuestions = data.perguntas;
      const wrongOptionsPool = data.opcoes_erradas || [];

      if (allQuestions.length < totalRounds) {
        console.warn(
          `⚠️ Poucas perguntas: ${allQuestions.length}, necessário: ${totalRounds}`
        );
        totalRounds = allQuestions.length;
      }

      // Embaralhamento mais agressivo para garantir unicidade
      const uniqueSeed = Date.now() + Math.random() * 1000;
      const shuffledQuestions = this.shuffleArray(
        [...allQuestions],
        uniqueSeed
      );
      const selectedQuestions = shuffledQuestions.slice(0, totalRounds);

      // Preparar cada pergunta com opções únicas
      const preparedQuestions = selectedQuestions.map((question, index) => {
        const optionSeed = uniqueSeed + index;
        const optionsData = this.prepareQuestionOptionsWithSeed(
          question,
          wrongOptionsPool,
          optionSeed
        );

        return {
          pergunta: question.pergunta,
          opcoes: optionsData.options,
          resposta_correta: optionsData.correctIndex,
          dica: question.dica || "",
          imagem: question.imagem || "",
          audio: question.audio || "",
          // Adicionar identificador único para debug
          _uniqueId: `q_${uniqueSeed}_${index}`,
        };
      });

      console.log(
        `🎲 Conjunto único gerado: ${preparedQuestions.length} perguntas`
      );
      return {
        questions: preparedQuestions,
        wrongOptionsPool: wrongOptionsPool,
        totalRounds: totalRounds,
      };
    } catch (error) {
      console.error("❌ Erro ao gerar conjunto único:", error);
      throw error;
    }
  }

  // Versão com seed controlada para maior aleatoriedade
  static prepareQuestionOptionsWithSeed(
    question,
    wrongOptionsPool,
    seed = null
  ) {
    const options = [];
    const correctAnswer = question.opcoes[question.resposta_correta];
    options.push(correctAnswer);

    const totalOptions = 4;

    // Filtrar opções erradas
    const filteredWrongOptions = wrongOptionsPool.filter(
      (opt) =>
        opt !== correctAnswer &&
        !question.opcoes.includes(opt) &&
        opt &&
        opt.trim() !== ""
    );

    // Completar com outras opções da pergunta se necessário
    let availableWrongOptions = [...filteredWrongOptions];
    if (availableWrongOptions.length < totalOptions - 1) {
      const otherQuestionOptions = question.opcoes.filter(
        (opt) => opt !== correctAnswer
      );
      availableWrongOptions = [
        ...availableWrongOptions,
        ...otherQuestionOptions,
      ];
    }

    // Usar seed se fornecida
    const shuffledWrongOptions = seed
      ? this.shuffleArray(availableWrongOptions, seed)
      : this.shuffleArray(availableWrongOptions);

    const neededWrongOptions = shuffledWrongOptions.slice(0, totalOptions - 1);
    options.push(...neededWrongOptions);

    // Embaralhar final
    const finalSeed = seed ? seed + 1 : null;
    const shuffledOptions = finalSeed
      ? this.shuffleArray(options, finalSeed)
      : this.shuffleArray(options);

    const correctIndex = shuffledOptions.findIndex(
      (opt) => opt === correctAnswer
    );

    // Fallback para garantir resposta correta
    if (correctIndex === -1) {
      console.warn(
        "⚠️ Resposta correta perdida no shuffle, adicionando no final"
      );
      return {
        options: [...shuffledOptions, correctAnswer],
        correctIndex: shuffledOptions.length,
      };
    }

    return {
      options: shuffledOptions,
      correctIndex: correctIndex,
    };
  }

  // Método para embaralhar array com seed
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
      // Randomização normal
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

  // Validar conjunto de perguntas
  static validateQuestionSet(questions) {
    const issues = [];

    questions.forEach((q, index) => {
      if (!q.pergunta || q.pergunta.trim() === "") {
        issues.push(`Pergunta ${index + 1}: texto vazio`);
      }

      if (!q.opcoes || q.opcoes.length < 2) {
        issues.push(
          `Pergunta ${index + 1}: poucas opções (${q.opcoes?.length || 0})`
        );
      }

      if (
        q.resposta_correta === undefined ||
        q.resposta_correta < 0 ||
        q.resposta_correta >= q.opcoes.length
      ) {
        issues.push(`Pergunta ${index + 1}: índice de resposta inválido`);
      }

      // Verificar duplicatas
      const uniqueOptions = new Set(q.opcoes);
      if (uniqueOptions.size !== q.opcoes.length) {
        issues.push(`Pergunta ${index + 1}: opções duplicadas`);
      }
    });

    if (issues.length > 0) {
      console.warn("⚠️ Problemas no conjunto de perguntas:", issues);
      return false;
    }

    console.log("✅ Conjunto de perguntas validado com sucesso");
    return true;
  }
}

// Adicione ao GameManager se necessário
if (typeof GameManager !== "undefined") {
  GameManager.prototype.loadQuestions = async function () {
    try {
      // Verificar se o jogo já tem perguntas definidas
      if (this.gameData.perguntas && this.gameData.perguntas.length > 0) {
        console.log("📚 Usando perguntas específicas deste jogo");
        this.selectedQuestions = this.gameData.perguntas;
        this.totalRounds = this.gameData.perguntas.length;

        // Validar as perguntas
        QuestionManager.validateQuestionSet(this.selectedQuestions);
      } else {
        // Fallback: carregar perguntas normalmente
        console.log("📚 Carregando novas perguntas para o jogo");
        const questionData = await QuestionManager.loadQuestions();
        this.selectedQuestions = questionData.selectedQuestions;
        this.totalRounds = questionData.totalRounds;
      }

      console.log(`✅ ${this.selectedQuestions.length} perguntas carregadas`);
    } catch (error) {
      console.error("❌ Erro ao carregar perguntas do jogo:", error);
      throw error;
    }
  };
}

// Export para módulos
if (typeof module !== "undefined" && module.exports) {
  module.exports = { QuestionManager };
}
