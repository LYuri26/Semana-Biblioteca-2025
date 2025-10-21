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

    const selectedOption = gameManager.selectedOption;

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
      let points = 0;

      // FEEDBACK VISUAL IMEDIATO
      const selectedElement = document.querySelector(".option-btn.selected");
      const allOptions = document.querySelectorAll(".option-btn");

      if (selectedElement) {
        if (isCorrect) {
          selectedElement.classList.add("correct");
          selectedElement.classList.remove("incorrect");

          // 🎯 CALCULAR PONTOS COM TEMPO - CHAMADA CORRETA
          points = IdentifierManager.calculatePoints(
            gameManager.currentQuestion,
            tempoResposta // Passando o tempo de resposta
          );

          gameManager.score += points;
          gameManager.updateScoreDisplay();

          console.log("🎯 Pontuação calculada:", {
            pontos: points,
            tempo: tempoResposta + "s",
            total: gameManager.score,
          });

          // Feedback visual de acerto com pontos
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
        } else {
          selectedElement.classList.add("incorrect");
          selectedElement.classList.remove("correct");
          selectedElement.innerHTML +=
            ' <span class="feedback-emoji">❌</span>';

          // Mostrar qual era a resposta correta
          const correctElement = document.querySelector(
            `.option-btn[data-option="${gameManager.currentQuestion.correctDisplayIndex}"]`
          );
          if (correctElement) {
            correctElement.classList.add("correct");
            correctElement.innerHTML +=
              ' <span class="feedback-emoji">✅</span>';
          }

          console.log("❌ Resposta incorreta - sem pontos");
        }
      }

      // Salvar pontuação atualizada no Firebase (mesmo que seja 0)
      await firebaseDB.db
        .ref(
          `birdbox/games/${gameManager.gameId}/jogadores/${gameManager.playerId}/pontuacao`
        )
        .set(gameManager.score);

      console.log("💾 Pontuação salva no Firebase:", gameManager.score);

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
            pontos: points,
            perguntaId: gameManager.currentQuestion.id,
            rodada: gameManager.currentRound,
          });

        console.log("📊 Resposta registrada no histórico");
      } catch (historyError) {
        console.warn("⚠️ Não foi possível salvar no histórico:", historyError);
      }

      // Desabilita todas as opções após responder
      allOptions.forEach((option) => {
        option.classList.add("disabled");
        option.style.pointerEvents = "none";
      });

      // Aguardar um pouco para o jogador ver o feedback (2 segundos)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Resetar seleção
      window.selectedOption = null;
      gameManager.selectedOption = null;

      // Limpar classes de feedback e emojis
      allOptions.forEach((btn) => {
        btn.classList.remove("correct", "incorrect", "selected", "disabled");
        btn.style.pointerEvents = "auto";

        // Remover emojis de feedback
        const feedbackEmoji = btn.querySelector(".feedback-emoji");
        if (feedbackEmoji) {
          feedbackEmoji.remove();
        }

        // Remover feedback de pontos
        const pointsFeedback = btn.querySelector(".points-feedback");
        if (pointsFeedback) {
          pointsFeedback.remove();
        }
      });

      // Restaurar texto do botão de submit
      if (submitButton) {
        submitButton.textContent = "Confirmar Resposta";
        submitButton.disabled = true; // Mantém desabilitado até nova seleção
      }

      // Avança LOCALMENTE para próxima pergunta após o feedback
      console.log("➡️ Avançando para próxima rodada após resposta...");
      await gameManager.advanceToNextRound();
    } catch (error) {
      console.error("❌ Erro ao enviar resposta:", error);

      // Re-habilitar interface em caso de erro
      const allOptions = document.querySelectorAll(".option-btn");
      allOptions.forEach((option) => {
        option.classList.remove("disabled");
        option.style.pointerEvents = "auto";
      });

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar Resposta";
      }

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
        const difficultyMultipliers = { 1: 1.0, 2: 1.5, 3: 2.0 };
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
          basePoints * 0.5 // Máximo 50% de perda
        );

        pontosFinais = Math.max(basePoints - pontosPerdidos, basePoints * 0.5); // Mínimo 50% dos pontos

        // 🎯 BÔNUS POR RAPIDEZ (resposta em menos de 3 segundos)
        if (tempoResposta <= 3) {
          const bonusRapidez = Math.floor(basePoints * 0.2); // 20% de bônus
          pontosFinais += bonusRapidez;
          console.log("🚀 Bônus por rapidez!", bonusRapidez);
        }

        console.log("⏰ Cálculo com tempo:", {
          basePoints,
          tempoResposta: tempoResposta + "s",
          pontosPerdidos,
          pontosFinais,
          percentual: Math.round((pontosFinais / basePoints) * 100) + "%",
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
