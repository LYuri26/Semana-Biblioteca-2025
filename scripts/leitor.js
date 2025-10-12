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

  // Submeter resposta - VERSÃO COM TEMPO
  static async submitAnswer(gameManager) {
    const submitButton = document.getElementById("submitAnswer");
    const startTime = gameManager.questionStartTime || Date.now();

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

      // 🎯 CALCULAR TEMPO DE RESPOSTA
      const endTime = Date.now();
      const tempoResposta = Math.round((endTime - startTime) / 1000); // Em segundos

      console.log("📝 Adivinhador submetendo resposta...", {
        selectedOption: selectedOption,
        correctIndex: gameManager.currentQuestion.correctDisplayIndex,
        tempoResposta: tempoResposta + "s",
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
        // 🎯 CALCULAR PONTOS COM TEMPO
        const points = IdentifierManager.calculatePoints(
          gameManager.currentQuestion,
          tempoResposta
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

        // Feedback visual de acerto com pontos
        if (selectedElement) {
          const pointsElement = document.createElement("span");
          pointsElement.className = "points-feedback";
          pointsElement.textContent = `+${points}`;
          pointsElement.style.cssText = `
          color: #4CAF50;
          font-weight: bold;
          margin-left: 10px;
          animation: fadeUp 1s ease-out;
        `;
          selectedElement.appendChild(pointsElement);

          // Remover após animação
          setTimeout(() => {
            if (pointsElement.parentNode) {
              pointsElement.remove();
            }
          }, 1000);
        }
      } else {
        console.log("❌ Resposta incorreta - sem pontos");
        // Feedback visual de erro
        if (selectedElement) {
          selectedElement.innerHTML +=
            ' <span class="feedback-emoji">❌</span>';
        }
      }

      // Registrar resposta no histórico com tempo
      try {
        await firebaseDB.db
          .ref(
            `birdbox/games/${gameManager.gameId}/jogadores/${gameManager.playerId}/respostas/${gameManager.currentRound}`
          )
          .set({
            opcaoSelecionada: selectedOption,
            correta: isCorrect,
            tempo: endTime,
            tempoResposta: tempoResposta,
            pontos: isCorrect ? points : 0,
          });

        console.log("📊 Resposta registrada no histórico");
      } catch (historyError) {
        console.warn("⚠️ Não foi possível salvar no histórico:", historyError);
      }

      // Desabilita opções após responder
      document.querySelectorAll(".option-btn").forEach((option) => {
        option.classList.add("disabled");
        option.style.pointerEvents = "none";
      });

      // Aguardar um pouco para o jogador ver o feedback
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Resetar seleção
      window.selectedOption = null;
      gameManager.selectedOption = null;

      // Limpar classes de feedback
      document.querySelectorAll(".option-btn").forEach((btn) => {
        btn.classList.remove("correct", "incorrect", "selected");
        const emoji = btn.querySelector(".feedback-emoji");
        if (emoji) emoji.remove();
        const pointsFeedback = btn.querySelector(".points-feedback");
        if (pointsFeedback) pointsFeedback.remove();
      });

      // Restaurar texto do botão
      if (submitButton) {
        submitButton.textContent = "Confirmar Resposta";
      }

      // Avança LOCALMENTE para próxima pergunta
      await gameManager.advanceToNextRound();
    } catch (error) {
      console.error("❌ Erro ao enviar resposta:", error);

      // Re-habilitar botão em caso de erro
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar Resposta";
      }

      // Re-habilitar opções em caso de erro
      document.querySelectorAll(".option-btn").forEach((option) => {
        option.classList.remove("disabled");
        option.style.pointerEvents = "auto";
      });

      alert("Erro ao processar resposta. Tente novamente.");
    }
  }

  // 🎯 MÉTODO ATUALIZADO: Calcular pontos com decaimento por tempo
  static calculatePoints(question, tempoResposta = null) {
    try {
      // 🎯 BASE: Usar pontuação base da pergunta ou calcular por dificuldade
      let basePoints = 100; // fallback

      if (question.pontuacao_base !== undefined) {
        basePoints = question.pontuacao_base;
      } else {
        // Calcular baseado na dificuldade se não tiver pontuação_base
        let difficulty = 1;
        if (question.dificuldade !== undefined) {
          difficulty = question.dificuldade;
        }

        // Pontuação variada por dificuldade
        const difficultyMultipliers = { 1: 1.0, 2: 2.5, 3: 4.0 };
        const multiplier = difficultyMultipliers[difficulty] || 1.0;
        basePoints = Math.floor(100 * multiplier);
      }

      // 🎯 DECAIMENTO POR TEMPO (se tempoResposta for fornecido)
      let pontosFinais = basePoints;

      if (tempoResposta !== null && tempoResposta > 0) {
        // Reduzir pontos baseado no tempo de resposta (em segundos)
        const decaimentoPorSegundo = 2; // Perde 2 pontos por segundo
        const pontosPerdidos = Math.min(
          tempoResposta * decaimentoPorSegundo,
          basePoints * 0.7
        ); // Máximo 70% de perda

        pontosFinais = Math.max(basePoints - pontosPerdidos, basePoints * 0.3); // Mínimo 30% dos pontos

        // 🎯 BÔNUS POR RAPIDEZ (resposta em menos de 5 segundos)
        if (tempoResposta <= 5) {
          const bonusRapidez = 50;
          pontosFinais += bonusRapidez;
          console.log("🚀 Bônus por rapidez!", bonusRapidez);
        }

        console.log("⏰ Cálculo com tempo:", {
          basePoints,
          tempoResposta,
          pontosPerdidos,
          pontosFinais,
        });
      }

      // 🎯 ARREDONDAR E GARANTIR VALORES VÁLIDOS
      pontosFinais = Math.max(10, Math.round(pontosFinais)); // Mínimo 10 pontos

      console.log("💰 Pontos calculados:", {
        basePoints,
        tempoResposta,
        pontosFinais,
        questionId: question.id,
        dificuldade: question.dificuldade,
      });

      return pontosFinais;
    } catch (error) {
      console.error("❌ Erro ao calcular pontos:", error);
      return 100; // Fallback seguro
    }
  }
}
