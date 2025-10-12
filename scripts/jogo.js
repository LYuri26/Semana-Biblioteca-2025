// Gerenciador principal do jogo BirdBox
// Variáveis de controle

let inactivityTimer = null;

class GameManager {
  constructor() {
    this.gameId = null;
    this.playerId = localStorage.getItem("playerId");
    this.playerName = localStorage.getItem("playerName");
    this.playerRole = null;
    this.currentQuestion = null;
    this.currentRound = 1;
    this.totalRounds = 4;
    this.score = 0;
    this.totalTime = 180;
    this.timerInterval = null;
    this.questions = [];
    this.selectedQuestions = [];
    this.wrongOptionsPool = [];
    this.gameState = "loading";
    this.selectedOption = null;
    this.audioPlayer = null;
    this.gameListener = null;
    this.descriptionListener = null;
    this.roundListener = null;
    this.questionListener = null;
    this.playersListener = null;
  }

  async checkAndAdvanceRound() {
    // Apenas este jogador avança, independente do parceiro
    await firebaseDB.db
      .ref(
        `birdbox/games/${this.gameId}/jogadores/${this.playerId}/readyForNextRound`
      )
      .set(false);

    this.advanceToNextRound();
  }

  // Inicializar o jogo
  async initGame(gameId) {
    this.gameId = gameId;
    console.log("🎮 Iniciando jogo com ID:", gameId);

    try {
      // Primeiro determinar o papel do jogador
      await this.determinePlayerRole();
      console.log("🎭 Papel do jogador determinado:", this.playerRole);

      // Carregar todas as perguntas disponíveis
      await this.loadAllQuestions();
      console.log("📚 Todas as perguntas carregadas:", this.questions.length);

      // SINCRONIZAR AS PERGUNTAS SELECIONADAS PARA A DUPLA
      await this.syncSelectedQuestions();
      console.log(
        "🔄 Perguntas sincronizadas para a dupla:",
        this.selectedQuestions.length
      );

      // Inicializar interface
      this.initializeUI();

      // Configurar listeners do Firebase
      this.setupFirebaseListeners();

      // Iniciar timer do jogo
      this.startGameTimer();

      // CARREGAMENTO COM PERGUNTAS SINCRONIZADAS
      if (this.playerRole === "ouvinte") {
        console.log("🎧 Ouvinte - carregando primeira pergunta SINCRONIZADA");
        this.currentRound = 1;
        await this.loadQuestionForCurrentRound();
        console.log(
          "✅ Ouvinte carregou pergunta 1 - Pronto para reproduzir áudio"
        );
      } else {
        console.log(
          "🔍 Adivinhador - carregando primeira pergunta SINCRONIZADA"
        );
        this.currentRound = 1;
        await this.loadQuestionForCurrentRound();
        console.log("✅ Adivinhador carregou pergunta 1 - Opções disponíveis");
      }

      this.hideLoadingScreen();

      console.log(
        "✅ Jogo inicializado com sucesso! PERGUNTAS SINCRONIZADAS para a dupla"
      );
    } catch (error) {
      console.error("❌ Erro ao inicializar jogo:", error);
      alert(
        "Erro ao carregar as perguntas. Verifique se o arquivo perguntas.json existe e está no formato correto."
      );
      window.location.href = "index.html";
    }
  }

  // Sincronizar as perguntas selecionadas para a dupla
  async syncSelectedQuestions() {
    try {
      console.log("🔄 Sincronizando perguntas para a dupla...");

      // VERIFICAR ESTRUTURA DAS PERGUNTAS
      console.log("🔍 Estrutura da primeira pergunta:", this.questions[0]);

      console.log("🔄 Sincronizando perguntas para a dupla...");

      // Verificar se já existe uma seleção de perguntas no Firebase
      const questionsSnapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/selectedQuestions`)
        .once("value");

      const existingQuestions = questionsSnapshot.val();

      if (existingQuestions && existingQuestions.length > 0) {
        // Já existe uma seleção - usar a mesma
        console.log(
          "📋 Usando perguntas já selecionadas no Firebase:",
          existingQuestions
        );

        // Encontrar as perguntas completas baseadas nos IDs
        this.selectedQuestions = existingQuestions
          .map((questionId) => this.questions.find((q) => q.id === questionId))
          .filter((q) => q !== undefined);

        console.log(
          "✅ Perguntas recuperadas do Firebase:",
          this.selectedQuestions.map((q) => q.id)
        );
      } else {
        // Primeiro jogador - criar nova seleção
        console.log("🎲 Primeiro jogador - criando nova seleção de perguntas");

        // Selecionar 4 perguntas aleatórias
        const shuffled = Utils.shuffleArray([...this.questions]);
        this.selectedQuestions = shuffled.slice(0, this.totalRounds);

        console.log(
          "📝 Novas perguntas selecionadas:",
          this.selectedQuestions.map((q) => q.id)
        );

        // Salvar no Firebase para o outro jogador usar
        const questionIds = this.selectedQuestions.map((q) => q.id);
        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/selectedQuestions`)
          .set(questionIds);

        console.log("💾 Perguntas salvas no Firebase para sincronização");
      }

      // Garantir que temos exatamente 4 perguntas
      if (this.selectedQuestions.length !== this.totalRounds) {
        console.error(
          "❌ Número incorreto de perguntas selecionadas:",
          this.selectedQuestions.length
        );
        // Fallback: usar as primeiras 4 perguntas
        this.selectedQuestions = this.questions.slice(0, this.totalRounds);
        console.log(
          "🔄 Usando fallback:",
          this.selectedQuestions.map((q) => q.id)
        );
      }

      console.log(
        "🎯 Perguntas finais sincronizadas:",
        this.selectedQuestions.map((q) => ({
          id: q.id,
          pergunta: q.pergunta,
          som: q.som,
        }))
      );
    } catch (error) {
      console.error("❌ Erro ao sincronizar perguntas:", error);
      // Fallback: selecionar perguntas localmente
      const shuffled = Utils.shuffleArray([...this.questions]);
      this.selectedQuestions = shuffled.slice(0, this.totalRounds);
      console.log(
        "🔄 Usando fallback local devido a erro:",
        this.selectedQuestions.map((q) => q.id)
      );
    }
  }

  // Carregar todas as perguntas disponíveis
  async loadAllQuestions() {
    const questionData = await QuestionManager.loadQuestions();
    this.questions = questionData.questions;
    this.wrongOptionsPool = questionData.wrongOptionsPool;
    this.totalRounds = questionData.totalRounds;
    this.totalTime = questionData.totalTime;

    console.log("📖 Todas as perguntas carregadas:", this.questions.length);
  }

  // Determinar o papel do jogador
  async determinePlayerRole() {
    try {
      const snapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
        .once("value");

      this.playerRole = snapshot.val();

      if (!this.playerRole) {
        console.log("Papel não definido, determinando automaticamente...");

        const gameSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/jogadores`)
          .once("value");
        const players = gameSnapshot.val();

        let ouvintesCount = 0;
        let adivinhadoresCount = 0;

        if (players) {
          Object.keys(players).forEach((playerId) => {
            if (players[playerId].papel === "ouvinte") {
              ouvintesCount++;
            } else if (players[playerId].papel === "adivinhador") {
              adivinhadoresCount++;
            }
          });
        }

        console.log(
          `Ouvintes: ${ouvintesCount}, Adivinhadores: ${adivinhadoresCount}`
        );

        if (ouvintesCount === 0) {
          this.playerRole = "ouvinte";
        } else if (adivinhadoresCount === 0) {
          this.playerRole = "adivinhador";
        } else {
          this.playerRole =
            ouvintesCount <= adivinhadoresCount ? "ouvinte" : "adivinhador";
        }

        console.log("Papel atribuído:", this.playerRole);

        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
          .set(this.playerRole);
      }

      console.log("Papel final do jogador:", this.playerRole);
    } catch (error) {
      console.error("Erro ao determinar papel:", error);
      this.playerRole = Math.random() > 0.5 ? "ouvinte" : "adivinhador";
      console.log("Usando fallback para papel:", this.playerRole);
    }
  }

  // Inicializar interface conforme o papel
  initializeUI() {
    document.getElementById("listenerView").classList.add("hidden");
    document.getElementById("identifierView").classList.add("hidden");

    if (this.playerRole === "ouvinte") {
      console.log("Mostrando view do ouvinte");
      document.getElementById("listenerView").classList.remove("hidden");
      ListenerManager.setupUI(this);
    } else {
      console.log("Mostrando view do adivinhador");
      document.getElementById("identifierView").classList.remove("hidden");
      IdentifierManager.setupUI(this);
    }

    this.setupCommonEventListeners();
    this.setupAllButtons();
    this.updateTimerDisplay();
    this.updateRoundDisplay();
    this.updateScoreDisplay();
  }

  // Configurar event listeners comuns
  setupCommonEventListeners() {
    const mainMenuBtn = document.getElementById("mainMenuBtn");
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }

    const rankingBtn = document.getElementById("rankingBtn");
    if (rankingBtn) {
      rankingBtn.addEventListener("click", () => {
        window.location.href = "ranking.html"; // ou outro arquivo que você tiver
      });
    }
  }

  // Configurar todos os botões
  setupAllButtons() {
    // Botão de confirmar resposta (adivinhador)
    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) {
      submitButton.addEventListener("click", () => {
        IdentifierManager.submitAnswer(this);
      });
    }

    // Botões de navegação (ouvinte) - REMOVIDA A SINCRONIZAÇÃO COM FIREBASE
    const nextButton = document.getElementById("nextRound");
    const prevButton = document.getElementById("prevRound");
    const finishButton = document.getElementById("finishGame");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        // Apenas avança localmente - listener já cuida disso
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        // Apenas volta localmente - listener já cuida disso
      });
    }
    if (finishButton) {
      finishButton.addEventListener("click", () => {
        gameManager.playerFinishedGame();

        // só depois desabilita
        finishButton.disabled = true;
        finishButton.classList.add("disabled-btn");
      });
    }
  }

  // Configurar listeners do Firebase
  setupFirebaseListeners() {
    console.log("🔌 Configurando listeners do Firebase...", {
      gameId: this.gameId,
      playerRole: this.playerRole,
    });

    try {
      // LISTENER PARA PERGUNTAS SELECIONADAS (apenas para backup/resync)
      this.questionsListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/selectedQuestions`)
        .on("value", (snapshot) => {
          const questionIds = snapshot.val();
          if (questionIds && questionIds.length > 0) {
            console.log(
              "📋 Firebase: Perguntas selecionadas atualizadas",
              questionIds
            );
            // Pode ser usado para verificar se há discrepância
          }
        });

      // LISTENER PARA PONTUAÇÃO E STATUS
      this.gameListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}`)
        .on("value", (snapshot) => {
          const gameData = snapshot.val();
          if (!gameData) return;
          this.updateGameState(gameData);
        });

      // Listener para verificar se ambos finalizaram
      this.playersListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/jogadores`)
        .on("value", (snapshot) => {
          const playersData = snapshot.val();
          this.checkIfBothPlayersFinished(playersData);
        });

      console.log("✅ Listeners do Firebase configurados");
    } catch (error) {
      console.error("❌ Erro ao configurar listeners do Firebase:", error);
    }
  }

  cleanupFirebaseListeners() {
    console.log("🧹 Limpando listeners do Firebase...");

    const listeners = [
      { name: "questionsListener", ref: this.questionsListener },
      { name: "gameListener", ref: this.gameListener },
      { name: "playersListener", ref: this.playersListener },
    ];

    listeners.forEach((listener) => {
      if (listener.ref) {
        try {
          // Desconectar o listener específico
          if (listener.name === "questionsListener") {
            firebaseDB.db
              .ref(`birdbox/games/${this.gameId}/selectedQuestions`)
              .off("value", listener.ref);
          } else {
            firebaseDB.db
              .ref(`birdbox/games/${this.gameId}`)
              .off("value", listener.ref);
          }
          console.log(`✅ Listener ${listener.name} removido`);
        } catch (error) {
          console.error(`❌ Erro ao remover listener ${listener.name}:`, error);
        }
      }
    });

    // Limpar referências
    this.questionsListener = null;
    this.gameListener = null;
    this.playersListener = null;

    console.log("✅ Todos os listeners foram limpos");
  }

  // Atualizar estado do jogo - APENAS PONTUAÇÃO E STATUS FINAL
  updateGameState(gameData) {
    // Verificar se o jogo foi finalizado
    if (gameData.status === "finalizado") {
      this.endGame();
      return;
    }

    // Apenas atualizar pontuação do próprio jogador
    if (gameData.jogadores && gameData.jogadores[this.playerId]) {
      const newScore = gameData.jogadores[this.playerId].pontuacao;
      if (newScore !== this.score) {
        console.log("🔄 Pontuação atualizada via Firebase:", {
          antigo: this.score,
          novo: newScore,
        });
        this.score = newScore;
        this.updateScoreDisplay();
      }
    }
  }

  // Carregar próxima pergunta
  async loadNextQuestion() {
    if (this.currentRound > this.totalRounds) {
      // Se já passou do total, mantém na última rodada
      this.currentRound = this.totalRounds;
      this.updateRoundDisplay();
      return; // não finaliza aqui
    }

    this.currentQuestion = this.selectedQuestions[this.currentRound - 1];

    await firebaseDB.db
      .ref(`birdbox/games/${this.gameId}/currentQuestion`)
      .set(this.currentQuestion.id);

    const preparedOptions = QuestionManager.prepareQuestionOptions(
      this.currentQuestion,
      this.wrongOptionsPool
    );
    this.currentQuestion.displayOptions = preparedOptions.options;
    this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;
    if (this.playerRole === "ouvinte") {
      ListenerManager.prepareAudio(this.currentQuestion);
      ListenerManager.updateInterface(this.currentRound, this.totalRounds);
    } else {
      IdentifierManager.updateOptions(this.currentQuestion);
    }

    this.updateRoundDisplay();
  }

  // Carregar pergunta para adivinhador
  async loadQuestionForIdentifier(questionId) {
    try {
      console.log("🔄 Adivinhador: Carregando pergunta ID:", questionId);

      // Encontrar a pergunta no array de perguntas
      this.currentQuestion = this.questions.find((q) => q.id === questionId);

      if (!this.currentQuestion) {
        console.error("❌ Pergunta não encontrada no array local:", questionId);
        console.log(
          "📋 Perguntas disponíveis:",
          this.questions.map((q) => ({ id: q.id, pergunta: q.pergunta }))
        );
        IdentifierManager.showWaitingState();
        return;
      }

      console.log("✅ Pergunta carregada:", {
        id: this.currentQuestion.id,
        pergunta: this.currentQuestion.pergunta,
        som: this.currentQuestion.som,
      });

      const preparedOptions = QuestionManager.prepareQuestionOptions(
        this.currentQuestion,
        this.wrongOptionsPool
      );
      this.currentQuestion.displayOptions = preparedOptions.options;
      this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;

      console.log("📝 Opções preparadas:", {
        options: preparedOptions.options,
        correctIndex: preparedOptions.correctIndex,
      });

      IdentifierManager.updateOptions(this.currentQuestion);
      this.updateRoundDisplay();

      // HABILITAR OPÇÕES IMEDIATAMENTE
      IdentifierManager.enableAnswerOptions();
      console.log("🎯 Opções habilitadas para resposta");
    } catch (error) {
      console.error("❌ Erro ao carregar pergunta:", error);
      IdentifierManager.showWaitingState();
    }
  }

  // Carregar pergunta da rodada atual - PARA AMBOS OS JOGADORES
  // Carregar pergunta da rodada atual - PARA AMBOS OS JOGADORES (COMPLETAMENTE INDEPENDENTES)
  async loadQuestionForCurrentRound() {
    if (this.currentRound <= this.totalRounds) {
      try {
        console.log(
          "🔄 Carregando pergunta da rodada:",
          this.currentRound,
          "- Papel:",
          this.playerRole
        );

        // Busca a pergunta correspondente à rodada atual (AMBOS OS JOGADORES)
        this.currentQuestion = this.selectedQuestions[this.currentRound - 1];

        if (!this.currentQuestion) {
          console.error(
            "❌ Pergunta não encontrada para rodada:",
            this.currentRound
          );
          return;
        }

        console.log("📋 Dados da pergunta:", {
          round: this.currentRound,
          questionId: this.currentQuestion.id,
          pergunta: this.currentQuestion.pergunta,
          som: this.currentQuestion.som,
        });

        // *** REMOVIDO: OUVINTE NÃO ATUALIZA MAIS O FIREBASE AO NAVEGAR ***
        // CADA JOGADOR É COMPLETAMENTE INDEPENDENTE

        // Prepara as opções (apenas em memória local - AMBOS OS JOGADORES)
        const preparedOptions = QuestionManager.prepareQuestionOptions(
          this.currentQuestion,
          this.wrongOptionsPool
        );
        this.currentQuestion.displayOptions = preparedOptions.options;
        this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;

        // ATUALIZA INTERFACE CONFORME O PAPEL
        if (this.playerRole === "ouvinte") {
          console.log(
            "🎵 Ouvinte preparando áudio para rodada",
            this.currentRound
          );
          ListenerManager.prepareAudio(this.currentQuestion);
          ListenerManager.updateInterface(this.currentRound, this.totalRounds);
        } else {
          console.log(
            "🎯 Adivinhador preparando opções para rodada",
            this.currentRound
          );
          IdentifierManager.updateOptions(this.currentQuestion);
          this.updateRoundDisplay();
        }

        console.log(
          "✅",
          this.playerRole,
          "carregou pergunta",
          this.currentRound,
          "LOCALMENTE"
        );
      } catch (error) {
        console.error("❌ Erro em loadQuestionForCurrentRound:", error);
      }
    } else {
      console.log("🏁", this.playerRole, "completou todas as rodadas");
    }
  }

  async advanceToNextRound() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    console.log("🔄 Iniciando advanceToNextRound...", {
      role: this.playerRole,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
    });

    try {
      // AMBOS OS JOGADORES AVANÇAM LOCALMENTE
      if (this.currentRound < this.totalRounds) {
        this.currentRound++;
        console.log(
          "➡️",
          this.playerRole,
          "avançou para rodada:",
          this.currentRound
        );

        // Atualiza display da rodada
        this.updateRoundDisplay();

        // Carrega a próxima pergunta LOCALMENTE
        await this.loadQuestionForCurrentRound();

        console.log(
          "✅",
          this.playerRole,
          "carregou pergunta",
          this.currentRound,
          "localmente"
        );
      } else if (this.currentRound === this.totalRounds) {
        // Última rodada - não avança mais
        console.log(
          "🎯",
          this.playerRole,
          "na última rodada:",
          this.currentRound
        );
        this.currentRound = this.totalRounds;
        this.updateRoundDisplay();

        if (this.currentRound >= this.totalRounds) {
          console.log("🏁", this.playerRole, "completou todas as rodadas");
        }
      }
    } catch (error) {
      console.error("❌ Erro em advanceToNextRound:", error);
    } finally {
      setTimeout(() => {
        this.isAdvancing = false;
        console.log("✅ advanceToNextRound concluído");
      }, 100);
    }
  }

  // Quando um jogador finaliza
  async playerFinishedGame() {
    try {
      await firebaseDB.db
        .ref(
          `birdbox/games/${this.gameId}/jogadores/${this.playerId}/finalizado`
        )
        .set(true);

      this.showWaitingMessage();
    } catch (error) {
      console.error("Erro ao marcar jogo como finalizado:", error);
    }
  }

  // Verificar se ambos finalizaram
  async checkIfBothPlayersFinished(playersData) {
    if (!playersData) return;

    const allFinished = Object.values(playersData).every((p) => p.finalizado);

    if (allFinished) {
      await this.endGame(); // só termina quando ambos finalizam
    }
  }

  // Mostrar mensagem de espera
  showWaitingMessage() {
    if (this.playerRole === "ouvinte") {
      const statusElement = document.getElementById("partnerStatus");
      if (statusElement) {
        statusElement.textContent = "Aguardando adivinhador finalizar...";
      }
    } else {
      const descElement = document.getElementById("partnerDescription");
      if (descElement) {
        descElement.textContent = "Aguardando ouvinte finalizar...";
      }
    }
  }

  // Resetar interface de resposta
  resetAnswerInterface() {
    if (this.playerRole === "adivinhador") {
      IdentifierManager.resetAnswerInterface();
    }
  }

  // Iniciar timer do jogo
  startGameTimer() {
    this.timerInterval = setInterval(() => {
      this.totalTime--;
      if (this.totalTime <= 0) {
        clearInterval(this.timerInterval);
        this.endGame();
        return;
      }
      this.updateTimerDisplay();
    }, 1000);
  }

  // Atualizar display do timer
  updateTimerDisplay() {
    const minutes = Math.floor(this.totalTime / 60);
    const seconds = this.totalTime % 60;
    const timerElement = document.getElementById("gameTimer");
    if (timerElement) {
      timerElement.textContent = `${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }
  }

  // Atualizar display da rodada
  updateRoundDisplay() {
    const roundEl = document.getElementById("currentRound");
    const roundNumber = document.getElementById("roundNumber");
    if (roundEl)
      roundEl.textContent = `${this.currentRound}/${this.totalRounds}`;
    if (roundNumber)
      roundNumber.textContent = `${this.currentRound}/${this.totalRounds}`;

    const prevBtn = document.getElementById("prevRound");
    if (prevBtn) prevBtn.disabled = this.currentRound <= 1;

    const nextBtn = document.getElementById("nextRound");
    if (nextBtn) nextBtn.disabled = this.currentRound >= this.totalRounds;
  }

  // Atualizar display da pontuação
  updateScoreDisplay() {
    const scoreEl = document.getElementById("playerScore");
    if (scoreEl) scoreEl.textContent = this.score;
  }

  // Finalizar o jogo
  async endGame() {
    clearInterval(this.timerInterval);
    this.gameState = "finished";
    await this.saveFinalScore();
    this.showGameOverScreen();
  }

  // Salvar pontuação final
  async saveFinalScore() {
    try {
      await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/status`)
        .set("finalizado");
      await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/finalizadoEm`)
        .set(Date.now());
    } catch (error) {
      console.error("Erro ao salvar pontuação final:", error);
    }
  }

  // Mostrar tela de fim de jogo
  showGameOverScreen() {
    const gameOverOverlay = document.getElementById("gameOverOverlay");
    if (gameOverOverlay) gameOverOverlay.classList.add("active");
  }

  // Calcular precisão do adivinhador
  calculateAccuracy() {
    const totalAnswered = Math.min(this.currentRound - 1, this.totalRounds);
    if (totalAnswered === 0) return 0;
    const expectedScore = totalAnswered * 100;
    return Math.round((this.score / expectedScore) * 100);
  }

  // Reiniciar o jogo
  restartGame() {
    console.log("🔄 Reiniciando jogo...");

    // Limpar todos os listeners primeiro
    this.cleanupFirebaseListeners();

    // Limpar intervalos de tempo
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }

    // Recarregar a página
    console.log("🔄 Recarregando página...");
    window.location.reload();
  }

  // Esconder tela de carregamento
  hideLoadingScreen() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }
}

// Seleção de opções (habilita Confirmar)
document.querySelectorAll(".option-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    gameManager.selectedOption = btn.dataset.option;
    const submitBtn = document.getElementById("submitAnswer");
    if (submitBtn) submitBtn.disabled = false;

    // Destaque visual
    document
      .querySelectorAll(".option-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    resetInactivityTimer();
  });
});

// Confirmar Resposta
const submitBtn = document.getElementById("submitAnswer");
if (submitBtn) {
  submitBtn.addEventListener("click", () => {
    if (gameManager.selectedOption !== null) {
      IdentifierManager.submitAnswer(gameManager); // chama lógica central
      submitBtn.disabled = true;
      gameManager.selectedOption = null;
      resetInactivityTimer();
    }
  });
}

// Finalizar jogo manualmente
document.querySelectorAll("#finishGame").forEach((btn) => {
  btn.addEventListener("click", () => {
    gameManager.playerFinishedGame(); // usa método da classe
  });
});

// Encerramento automático por inatividade (3 min)
function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    gameManager.playerFinishedGame(); // só marca jogador como finalizado
  }, 3 * 60 * 1000);
}

// Instância global do gerenciador de jogo
const gameManager = new GameManager();

// Inicialização quando a página carrega
document.addEventListener("DOMContentLoaded", function () {
  const gameId = Utils.getUrlParameter("gameId");
  if (gameId) {
    console.log("Iniciando jogo com ID:", gameId);
    gameManager.initGame(gameId);
  } else {
    console.error("Game ID não encontrado na URL");
    alert("Erro: ID do jogo não encontrado. Voltando ao menu.");
    window.location.href = "index.html";
  }
});
