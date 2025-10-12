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
    const descElement = document.getElementById("partnerDescription");

    if (question && question.displayOptions) {
      console.log(
        "🎯 Atualizando opções para o adivinhador:",
        question.displayOptions
      );

      question.displayOptions.forEach((option, index) => {
        if (optionButtons[index]) {
          const optionText = optionButtons[index].querySelector(".option-text");
          if (optionText) optionText.textContent = option;
          optionButtons[index].dataset.option = index;
          optionButtons[index].classList.remove("disabled");
        }
      });

      if (descElement) {
        descElement.textContent = "Escolha a opção correta!";
        descElement.classList.add("active");
      }

      // HABILITAR OPÇÕES IMEDIATAMENTE, SEM AGUARDAR DESCRIÇÃO
      IdentifierManager.enableAnswerOptions();
    } else {
      // Se não há opções, mostrar estado de espera
      optionButtons.forEach((button, index) => {
        const optionText = button.querySelector(".option-text");
        if (optionText) optionText.textContent = "Aguardando...";
        button.classList.add("disabled");
      });

      if (descElement) {
        descElement.textContent = "Aguardando pergunta do ouvinte...";
        descElement.classList.remove("active");
      }
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

  static showWaitingState() {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");
    const descElement = document.getElementById("partnerDescription");

    if (descElement) {
      descElement.textContent = "Aguardando pergunta do ouvinte...";
      descElement.classList.remove("active");
    }

    options.forEach((option, index) => {
      const optionText = option.querySelector(".option-text");
      if (optionText) optionText.textContent = "Aguardando...";
      option.classList.add("disabled");
      option.classList.remove("selected", "correct", "incorrect");
    });

    if (submitButton) {
      submitButton.disabled = true;
    }

    window.selectedOption = null;

    console.log("⏳ Adivinhador em estado de espera - aguardando pergunta");
  }

  // Submeter resposta
  static async submitAnswer(gameManager) {
    // VERIFICAÇÃO CRÍTICA - garantir que temos uma pergunta
    if (!gameManager.currentQuestion) {
      console.error("❌ Erro: currentQuestion é null");
      alert("Aguarde a pergunta ser carregada antes de responder.");
      return;
    }

    if (window.selectedOption === null) {
      alert("Selecione uma opção antes de confirmar.");
      return;
    }

    // PREVENIR MÚLTIPLOS CLICKS
    const submitButton = document.getElementById("submitAnswer");
    if (submitButton && submitButton.disabled) {
      console.log("⏳ Resposta já sendo processada...");
      return;
    }

    try {
      // Desabilitar botão imediatamente para prevenir múltiplos cliques
      if (submitButton) submitButton.disabled = true;

      console.log("📝 Adivinhador submetendo resposta...", {
        selectedOption: window.selectedOption,
        correctIndex: gameManager.currentQuestion.correctDisplayIndex,
        pergunta: gameManager.currentQuestion.pergunta,
        rodada: gameManager.currentRound,
      });

      const isCorrect =
        window.selectedOption ===
        gameManager.currentQuestion.correctDisplayIndex;

      console.log("✅ Resposta correta?", isCorrect);

      if (isCorrect) {
        const points = IdentifierManager.calculatePoints(
          gameManager.currentQuestion
        );
        gameManager.score += points;
        gameManager.updateScoreDisplay();

        console.log(
          "🎯 Tentando salvar pontuação no Firebase...",
          gameManager.score
        );

        await firebaseDB.db
          .ref(
            `birdbox/games/${gameManager.gameId}/jogadores/${gameManager.playerId}/pontuacao`
          )
          .set(gameManager.score);

        console.log("💾 Pontuação salva no Firebase:", gameManager.score);
      } else {
        console.log("❌ Resposta incorreta - sem pontos");
      }

      // Desabilita opções após responder
      document
        .querySelectorAll(".option-btn")
        .forEach((option) => option.classList.add("disabled"));

      // Avança LOCALMENTE para próxima pergunta
      await gameManager.advanceToNextRound();
    } catch (error) {
      console.error("❌ Erro ao enviar resposta:", error);
      // Re-habilitar botão em caso de erro
      if (submitButton) submitButton.disabled = false;
    }
  }

  // Calcular pontos - VERSÃO DEFINITIVA
  static calculatePoints(question) {
    const basePoints = 100;

    // Verificar se a pergunta tem a estrutura esperada
    if (!question) {
      console.warn("⚠️  Pergunta não definida, usando pontos base");
      return basePoints;
    }

    // Tentar diferentes possíveis nomes de campo para dificuldade
    let difficulty = 1;

    if (question.dificuldade !== undefined) {
      difficulty = question.dificuldade;
    } else if (question.difficulty !== undefined) {
      difficulty = question.difficulty;
    } else if (question.nivel !== undefined) {
      difficulty = question.nivel;
    }

    // Garantir que a dificuldade seja um número válido
    difficulty = Number(difficulty) || 1;

    const points = basePoints * difficulty;

    console.log("💰 Pontos calculados:", {
      basePoints,
      difficulty,
      total: points,
      questionId: question.id,
    });

    return points;
  }
}
