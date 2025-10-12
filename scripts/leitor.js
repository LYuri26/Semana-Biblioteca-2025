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
      });

      submitButton.onclick = () => {
        IdentifierManager.submitAnswer(gameManager);
      };
      submitButton.disabled = true;
    }

    if (finishButton) {
      finishButton.addEventListener("click", () => {
        gameManager.playerFinishedGame();
        finishButton.disabled = true;
        finishButton.classList.add("disabled-btn");
      });
    }

    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = "Aguardando descrição do ouvinte...";
    }
  }

  // Atualizar opções - CORRIGIDO: garantir que opções fiquem habilitadas
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

          // CORREÇÃO: Remover completamente a classe disabled e restaurar pointer-events
          optionButtons[index].classList.remove(
            "disabled",
            "selected",
            "correct",
            "incorrect"
          );
          optionButtons[index].style.pointerEvents = "auto";

          // Remover emojis de feedback se existirem
          const feedbackEmoji =
            optionButtons[index].querySelector(".feedback-emoji");
          if (feedbackEmoji) {
            feedbackEmoji.remove();
          }
        }
      });

      if (descElement) {
        descElement.textContent = "Escolha a opção correta!";
        descElement.classList.add("active");
      }

      // CORREÇÃO: Reabilitar completamente as opções
      IdentifierManager.enableAnswerOptions();
    } else {
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

  // CORREÇÃO COMPLETA: Resetar interface sem desabilitar permanentemente
  static resetAnswerInterface() {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");

    // Apenas resetar seleções e feedback visual, NÃO desabilitar
    options.forEach((option) => {
      option.classList.remove("selected", "correct", "incorrect");
      option.style.pointerEvents = "auto"; // Garantir que clicks funcionem

      // Remover emojis de feedback
      const feedbackEmoji = option.querySelector(".feedback-emoji");
      if (feedbackEmoji) {
        feedbackEmoji.remove();
      }
    });

    if (submitButton) submitButton.disabled = true;
    window.selectedOption = null;

    // CORREÇÃO: Se o gameManager estiver disponível, resetar também
    if (typeof gameManager !== "undefined") {
      gameManager.selectedOption = null;
    }
  }

  // CORREÇÃO: Habilitar opções de resposta completamente
  static enableAnswerOptions() {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");

    options.forEach((option) => {
      option.classList.remove("disabled");
      option.style.pointerEvents = "auto"; // Garantir que clicks funcionem
    });

    if (submitButton) submitButton.disabled = false;

    console.log("✅ Opções habilitadas para seleção");
  }

  // Selecionar opção - VERSÃO CORRIGIDA
  static selectOption(optionElement) {
    if (optionElement.classList.contains("disabled")) {
      console.log("⚠️ Opção desabilitada, ignorando clique");
      return;
    }

    const previouslySelected = document.querySelector(".option-btn.selected");
    if (previouslySelected) {
      previouslySelected.classList.remove("selected");
    }

    optionElement.classList.add("selected");

    // CORREÇÃO: Atualizar ambas as variáveis consistentemente
    window.selectedOption = parseInt(optionElement.dataset.option);

    if (typeof gameManager !== "undefined") {
      gameManager.selectedOption = window.selectedOption;
    }

    console.log("🎯 Opção selecionada:", window.selectedOption);

    // CORREÇÃO: Habilitar botão de submit
    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) {
      submitButton.disabled = false;
    }
  }

  // Submeter resposta - VERSÃO CORRIGIDA
  static async submitAnswer(gameManager) {
    const submitButton = document.getElementById("submitAnswer");

    // PREVENIR MÚLTIPLOS CLICKS
    if (submitButton && submitButton.disabled) {
      console.log("⏳ Resposta já sendo processada... ignorando clique duplo");
      return;
    }

    // VERIFICAÇÃO CORRIGIDA: Usar a variável do gameManager como primária
    const selectedOption =
      gameManager.selectedOption !== null
        ? gameManager.selectedOption
        : window.selectedOption;

    if (selectedOption === null) {
      alert("Selecione uma opção antes de confirmar.");
      return;
    }

    if (!gameManager.currentQuestion) {
      console.error("❌ Erro: currentQuestion é null");
      alert("Aguarde a pergunta ser carregada antes de responder.");
      return;
    }

    try {
      // Desabilitar botão IMEDIATAMENTE
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Processando...";
      }

      console.log("📝 Adivinhador submetendo resposta...", {
        selectedOption: selectedOption,
        correctIndex: gameManager.currentQuestion.correctDisplayIndex,
        pergunta: gameManager.currentQuestion.pergunta,
        rodada: gameManager.currentRound,
      });

      const isCorrect =
        selectedOption === gameManager.currentQuestion.correctDisplayIndex;
      console.log("✅ Resposta correta?", isCorrect);

      // FEEDBACK VISUAL IMEDIATO
      const selectedElement = document.querySelector(".option-btn.selected");
      if (selectedElement) {
        if (isCorrect) {
          selectedElement.classList.add("correct");
          selectedElement.classList.remove("incorrect");
        } else {
          selectedElement.classList.add("incorrect");
          selectedElement.classList.remove("correct");

          // Mostrar qual era a resposta correta
          const correctElement = document.querySelector(
            `.option-btn[data-option="${gameManager.currentQuestion.correctDisplayIndex}"]`
          );
          if (correctElement) {
            correctElement.classList.add("correct");
          }
        }
      }

      if (isCorrect) {
        const points = IdentifierManager.calculatePoints(
          gameManager.currentQuestion
        );
        gameManager.score += points;
        gameManager.updateScoreDisplay();

        console.log("🎯 Salvando pontuação no Firebase...", gameManager.score);

        await firebaseDB.db
          .ref(
            `birdbox/games/${gameManager.gameId}/jogadores/${gameManager.playerId}/pontuacao`
          )
          .set(gameManager.score);

        console.log("💾 Pontuação salva no Firebase:", gameManager.score);
      }

      // Registrar resposta no histórico
      try {
        await firebaseDB.db
          .ref(
            `birdbox/games/${gameManager.gameId}/jogadores/${gameManager.playerId}/respostas/${gameManager.currentRound}`
          )
          .set({
            opcaoSelecionada: selectedOption,
            correta: isCorrect,
            tempo: Date.now(),
            pontos: isCorrect
              ? IdentifierManager.calculatePoints(gameManager.currentQuestion)
              : 0,
          });
      } catch (historyError) {
        console.warn("⚠️ Não foi possível salvar no histórico:", historyError);
      }

      // CORREÇÃO: Desabilitar temporariamente as opções durante o feedback
      document.querySelectorAll(".option-btn").forEach((option) => {
        option.style.pointerEvents = "none";
      });

      // Aguardar para o jogador ver o feedback
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // CORREÇÃO: Resetar seleção
      window.selectedOption = null;
      gameManager.selectedOption = null;

      // Avançar para próxima pergunta
      await gameManager.advanceToNextRound();
    } catch (error) {
      console.error("❌ Erro ao enviar resposta:", error);

      // CORREÇÃO: Re-habilitar interface em caso de erro
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar Resposta";
      }

      document.querySelectorAll(".option-btn").forEach((option) => {
        option.style.pointerEvents = "auto";
      });

      alert("Erro ao processar resposta. Tente novamente.");
    }
  }

  // Calcular pontos
  static calculatePoints(question) {
    const basePoints = 100;
    let difficulty = 1;

    if (question.dificuldade !== undefined) {
      difficulty = question.dificuldade;
    } else if (question.difficulty !== undefined) {
      difficulty = question.difficulty;
    } else if (question.nivel !== undefined) {
      difficulty = question.nivel;
    }

    difficulty = Number(difficulty) || 1;
    const points = basePoints * difficulty;

    return points;
  }
}
