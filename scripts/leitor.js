// Gerenciador do adivinhador
class IdentifierManager {
  // Configurar UI do adivinhador
  static setupUI(gameManager) {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");
    const finishButton = document.getElementById("finishGame");

    if (options && submitButton) {
      options.forEach((option) => {
        option.addEventListener("click", (e) => {
          IdentifierManager.selectOption(e.currentTarget);
        });
        const optionText = option.querySelector(".option-text");
        if (optionText) optionText.textContent = "Aguardando...";
      });

      submitButton.addEventListener("click", () => {
        IdentifierManager.submitAnswer(gameManager);
      });
      submitButton.disabled = true;
    }

    if (finishButton) {
      finishButton.addEventListener("click", () => {
        gameManager.playerFinishedGame();
      });
    }

    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = "Aguardando descrição do ouvinte...";
    }
  }

  // Atualizar opções
  static updateOptions(question) {
    const optionsContainer = document.getElementById("optionsContainer");
    const optionButtons = optionsContainer.querySelectorAll(".option-btn");

    if (question && question.displayOptions) {
      question.displayOptions.forEach((option, index) => {
        if (optionButtons[index]) {
          optionButtons[index].querySelector(".option-text").textContent =
            option;
          optionButtons[index].dataset.option = index;
          optionButtons[index].classList.remove("disabled");
        }
      });
    }
  }

  // Atualizar descrição do parceiro
  static updatePartnerDescription(description) {
    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = description;
      descElement.classList.add("active");
    }
    IdentifierManager.enableAnswerOptions();
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
    if (window.selectedOption === null || window.selectedOption === undefined) {
      alert("Selecione uma opção antes de confirmar.");
      return;
    }

    try {
      // Verifica se está correta
      const isCorrect =
        window.selectedOption ===
        gameManager.currentQuestion.correctDisplayIndex;

      // Atualiza pontuação
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
      const options = document.querySelectorAll(".option-btn");
      options.forEach((option) => {
        option.classList.add("disabled");
      });

      const submitButton = document.getElementById("submitAnswer");
      if (submitButton) submitButton.disabled = true;

      // Avança para a próxima rodada (sem mostrar resposta)
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

  // Resetar interface
  static resetAnswerInterface() {
    const options = document.querySelectorAll(".option-btn");
    options.forEach((option) => {
      option.classList.remove("selected", "correct", "incorrect", "disabled");
      const optionText = option.querySelector(".option-text");
      if (optionText) optionText.textContent = "Aguardando próxima rodada...";
    });

    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = "Aguardando descrição do ouvinte...";
      descElement.classList.remove("active");
    }

    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) submitButton.disabled = true;
    window.selectedOption = null;
  }
}
