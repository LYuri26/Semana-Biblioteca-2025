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

    const wrongOptions = Utils.shuffleArray([...wrongOptionsPool])
      .filter((opt) => opt !== correctAnswer && !question.opcoes.includes(opt))
      .slice(0, 3);

    options.push(...wrongOptions);
    const shuffledOptions = Utils.shuffleArray(options);

    const newCorrectIndex = shuffledOptions.findIndex(
      (opt) => opt === correctAnswer
    );

    return {
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
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
