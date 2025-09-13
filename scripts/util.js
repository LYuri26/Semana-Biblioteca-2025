// Funções utilitárias

class Utils {
  // Embaralhar array (Fisher-Yates algorithm)
  static shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Gerar opções erradas com base na resposta correta
  static generateWrongOptions(correctAnswer, allQuestions, count = 3) {
    const wrongOptions = [];
    const usedIndexes = new Set();

    while (wrongOptions.length < count) {
      const randomIndex = Math.floor(Math.random() * allQuestions.length);

      if (!usedIndexes.has(randomIndex)) {
        usedIndexes.add(randomIndex);
        const wrongAnswer = allQuestions[randomIndex].resposta_correta;

        // Garantir que a opção errada seja diferente da correta
        if (
          wrongAnswer !== correctAnswer &&
          !wrongOptions.includes(wrongAnswer)
        ) {
          wrongOptions.push(wrongAnswer);
        }
      }
    }

    return wrongOptions;
  }

  // Formatador de tempo (mm:ss)
  static formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }

  // Obter parâmetro da URL
  static getUrlParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }

  // Debounce function
  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}
