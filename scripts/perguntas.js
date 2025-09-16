// Gerenciador de perguntas
class QuestionManager {
  // Carregar perguntas do JSON
  static async loadQuestions() {
    try {
      const response = await fetch("/arquivos/dados/perguntas.json");
      if (!response.ok) throw new Error("Erro ao carregar perguntas");

      const data = await response.json();
      const questions = data.perguntas;
      const wrongOptionsPool = data.opcoes_erradas || [];
      const totalRounds = data.configuracoes?.total_rodadas || 4;
      const totalTime = data.configuracoes?.tempo_total_jogo || 180;

      // Selecionar perguntas aleatórias
      const selectedQuestions = Utils.shuffleArray([...questions]).slice(
        0,
        totalRounds
      );

      console.log(
        `Carregadas ${selectedQuestions.length} perguntas para o jogo`
      );

      return {
        questions,
        wrongOptionsPool,
        selectedQuestions,
        totalRounds,
        totalTime,
      };
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
      throw error; // Remove fallback e propaga o erro
    }
  }

  // Preparar opções para uma pergunta
  static prepareQuestionOptions(question, wrongOptionsPool) {
    const options = [];
    const correctAnswer = question.opcoes[question.resposta_correta];
    options.push(correctAnswer);

    // Número total de opções desejadas
    const totalOptions = 4;

    // Filtrar opções erradas que não estão nas opções corretas
    const filteredWrongOptions = wrongOptionsPool.filter(
      (opt) => opt !== correctAnswer && !question.opcoes.includes(opt)
    );

    // Embaralhar e pegar as opções restantes necessárias
    const neededWrongOptions = Utils.shuffleArray(filteredWrongOptions).slice(
      0,
      totalOptions - 1
    );

    options.push(...neededWrongOptions);

    // Embaralhar todas as opções antes de retornar
    const shuffledOptions = Utils.shuffleArray(options);

    // Obter índice da resposta correta
    const correctIndex = shuffledOptions.findIndex(
      (opt) => opt === correctAnswer
    );

    return {
      options: shuffledOptions,
      correctIndex: correctIndex,
    };
  }
}

// Adicione ao GameManager
GameManager.prototype.loadQuestions = async function () {
  const questionData = await QuestionManager.loadQuestions();
  this.questions = questionData.questions;
  this.wrongOptionsPool = questionData.wrongOptionsPool;
  this.selectedQuestions = questionData.selectedQuestions;
  this.totalRounds = questionData.totalRounds;
  this.totalTime = questionData.totalTime;
};
