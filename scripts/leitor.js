// Gerenciador do adivinhador
class IdentifierManager {
  // Configurar UI do adivinhador
  static setupUI(gameManager) {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");
    const finishButton = document.getElementById("finishGameIdentifier");

    if (options && submitButton) {
      options.forEach((option) => {
        option.addEventListener("click", (e) => {
          IdentifierManager.selectOption(e.currentTarget);
        });
        const optionText = option.querySelector(".option-text");
        if (optionText) optionText.textContent = "Aguardando...";
      });

      submitButton.onclick = () => {
        IdentifierManager.submitAnswer(gameManager);
      };
      submitButton.disabled = true;
    }

    if (finishButton) {
      finishButton.addEventListener("click", () => {
        gameManager.playerFinishedGame();

        // só depois desabilita
        finishButton.disabled = true;
        finishButton.classList.add("disabled-btn");
      });
    }

    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = "Aguardando descrição do ouvinte...";
    }
  }

  // Atualizar opções - MODIFICADO: habilitar opções imediatamente
  static updateOptions(question) {
    const optionsContainer = document.getElementById("optionsContainer");
    const optionButtons = optionsContainer.querySelectorAll(".option-btn");

    if (question && question.displayOptions) {
      question.displayOptions.forEach((option, index) => {
        if (optionButtons[index]) {
          const optionText = optionButtons[index].querySelector(".option-text");
          if (optionText) optionText.textContent = option;
          optionButtons[index].dataset.option = index;
          optionButtons[index].classList.remove("disabled");
        }
      });

      // HABILITAR OPÇÕES IMEDIATAMENTE, SEM AGUARDAR DESCRIÇÃO
      IdentifierManager.enableAnswerOptions();
    } else {
      // Se não há opções, mostrar estado de espera
      optionButtons.forEach((button, index) => {
        const optionText = button.querySelector(".option-text");
        if (optionText) optionText.textContent = "Aguardando...";
        button.classList.add("disabled");
      });
    }
  }

  static resetAnswerInterface() {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");

    // Apenas resetar seleções, não o texto se já temos uma pergunta
    options.forEach((option) => {
      option.classList.remove("selected", "correct", "incorrect");
      option.classList.add("disabled"); // manter desabilitado até enableAnswerOptions()
    });

    if (submitButton) submitButton.disabled = true;
    window.selectedOption = null;
  }
  async loadQuestionForIdentifier(questionId) {
    try {
      this.currentQuestion = this.questions.find((q) => q.id === questionId);
      if (this.currentQuestion) {
        const preparedOptions = QuestionManager.prepareQuestionOptions(
          this.currentQuestion,
          this.wrongOptionsPool
        );
        this.currentQuestion.displayOptions = preparedOptions.options;
        this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;
        IdentifierManager.updateOptions(this.currentQuestion);
        this.updateRoundDisplay();
      }
    } catch (error) {
      console.error("Erro ao carregar pergunta:", error);
    }
  }

  // Atualizar descrição do parceiro - MODIFICADO: não habilita mais opções
  static updatePartnerDescription(description) {
    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = description;
      descElement.classList.add("active");
    }
  }

  // Habilitar opções de resposta
  static enableAnswerOptions() {
    const options = document.querySelectorAll(".option-btn");
    options.forEach((option) => {
      option.classList.remove("disabled");
    });

    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) submitButton.disabled = false;
  }

  // Selecionar opção
  static selectOption(optionElement) {
    if (optionElement.classList.contains("disabled")) return;

    const previouslySelected = document.querySelector(".option-btn.selected");
    if (previouslySelected) {
      previouslySelected.classList.remove("selected");
    }
    optionElement.classList.add("selected");
    window.selectedOption = parseInt(optionElement.dataset.option);
  }

  // Submeter resposta
  static async submitAnswer(gameManager) {
    if (window.selectedOption === null) {
      alert("Selecione uma opção antes de confirmar.");
      return;
    }

    try {
      const isCorrect =
        window.selectedOption ===
        gameManager.currentQuestion.correctDisplayIndex;

      if (isCorrect) {
        const points = IdentifierManager.calculatePoints(
          gameManager.currentQuestion
        );
        gameManager.score += points;
        gameManager.updateScoreDisplay();

        await firebaseDB.db
          .ref(
            `birdbox/games/${gameManager.gameId}/jogadores/${gameManager.playerId}/pontuacao`
          )
          .set(gameManager.score);
      }

      // Desabilita opções após responder
      document
        .querySelectorAll(".option-btn")
        .forEach((option) => option.classList.add("disabled"));

      const submitButton = document.getElementById("submitAnswer");
      if (submitButton) submitButton.disabled = true;

      // Avança **somente o próprio jogador**
      gameManager.advanceToNextRound();
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
    }
  }

  // Calcular pontos
  static calculatePoints(question) {
    const basePoints = 100;
    const difficultyMultiplier = question.dificuldade || 1;
    return basePoints * difficultyMultiplier;
  }
}
