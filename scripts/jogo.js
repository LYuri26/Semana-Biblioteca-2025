// Gerenciador principal do jogo BirdBox
// Variáveis de controle
let currentRound = 0;
const totalRounds = 4;
let selectedOption = null;
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

  // Inicializar o jogo
  async initGame(gameId) {
    this.gameId = gameId;
    console.log("Iniciando jogo com ID:", gameId);

    try {
      // Primeiro determinar o papel do jogador
      await this.determinePlayerRole();
      console.log("Papel do jogador determinado:", this.playerRole);

      // Carregar perguntas (agora sem fallback)
      await this.loadQuestions();

      // Resto do código permanece igual...
      this.initializeUI();
      this.setupFirebaseListeners();
      this.startGameTimer();

      if (this.playerRole === "ouvinte") {
        console.log("Ouvinte - preparando primeira pergunta");
        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/currentRound`)
          .set(1);
        await this.loadNextQuestion();
      } else {
        console.log("Adivinhador - aguardando pergunta");
        // Verificar se já existe uma pergunta em andamento
        const questionSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/currentQuestion`)
          .once("value");
        const currentQuestionId = questionSnapshot.val();

        const roundSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/currentRound`)
          .once("value");
        const currentRound = roundSnapshot.val();

        if (currentRound) {
          this.currentRound = currentRound;
          this.updateRoundDisplay();
        }

        if (currentQuestionId) {
          await this.loadQuestionForIdentifier(currentQuestionId);
        }
      }

      this.hideLoadingScreen();
    } catch (error) {
      console.error("Erro ao inicializar jogo:", error);
      alert(
        "Erro ao carregar as perguntas. Verifique se o arquivo perguntas.json existe e está no formato correto."
      );
      window.location.href = "index.html";
    }
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
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        this.restartGame();
      });
    }

    const mainMenuBtn = document.getElementById("mainMenuBtn");
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener("click", () => {
        window.location.href = "index.html";
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

    // Botões de navegação (ouvinte)
    const nextButton = document.getElementById("nextRound");
    const prevButton = document.getElementById("prevRound");
    const finishButton = document.getElementById("finishGame");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        this.advanceToNextRound();
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        if (this.currentRound > 1) {
          this.currentRound--;
          this.updateRoundDisplay();
          this.loadQuestionForCurrentRound();
        }
      });
    }

    if (finishButton) {
      finishButton.addEventListener("click", () => {
        this.playerFinishedGame();
      });
    }
  }

  // Configurar listeners do Firebase
  setupFirebaseListeners() {
    this.gameListener = firebaseDB.db
      .ref(`birdbox/games/${this.gameId}`)
      .on("value", (snapshot) => {
        const gameData = snapshot.val();
        if (!gameData) return;
        this.updateGameState(gameData);
      });

    if (this.playerRole === "adivinhador") {
      this.descriptionListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentDescription`)
        .on("value", (snapshot) => {
          const description = snapshot.val();
          if (description) {
            IdentifierManager.updatePartnerDescription(description);
          }
        });
    }

    this.roundListener = firebaseDB.db
      .ref(`birdbox/games/${this.gameId}/currentRound`)
      .on("value", (snapshot) => {
        const round = snapshot.val();
        if (round && round !== this.currentRound) {
          this.currentRound = round;
          this.updateRoundDisplay();
          if (this.playerRole === "adivinhador") {
            IdentifierManager.resetAnswerInterface();
          }
        }
      });

    if (this.playerRole === "adivinhador") {
      this.questionListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentQuestion`)
        .on("value", async (snapshot) => {
          const questionId = snapshot.val();
          if (questionId && questionId !== (this.currentQuestion?.id || null)) {
            await this.loadQuestionForIdentifier(questionId);
          }
        });
    }

    // Listener para verificar se ambos finalizaram
    this.playersListener = firebaseDB.db
      .ref(`birdbox/games/${this.gameId}/jogadores`)
      .on("value", (snapshot) => {
        this.checkIfBothPlayersFinished(snapshot.val());
      });
  }

  // Atualizar estado do jogo
  updateGameState(gameData) {
    if (gameData.status === "finalizado") {
      this.endGame();
      return;
    }

    if (gameData.jogadores && gameData.jogadores[this.playerId]) {
      const newScore = gameData.jogadores[this.playerId].pontuacao;
      if (newScore !== this.score) {
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
    }

    this.updateRoundDisplay();
  }

  // Carregar pergunta para adivinhador
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

  // Carregar pergunta da rodada atual
  async loadQuestionForCurrentRound() {
    if (this.currentRound <= this.totalRounds) {
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
      }
    }
  }

  // Avançar para próxima rodada
  async advanceToNextRound() {
    if (this.currentRound < this.totalRounds) {
      this.currentRound++;
      await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentRound`)
        .set(this.currentRound);

      if (this.playerRole === "ouvinte") {
        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/currentDescription`)
          .set(null);
        await this.loadNextQuestion();
      } else {
        IdentifierManager.resetAnswerInterface();
        this.updateRoundDisplay();
      }
    } else {
      // Se já está na última, apenas atualiza tela, não encerra
      this.currentRound = this.totalRounds;
      this.updateRoundDisplay();
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

    let allFinished = true;

    Object.keys(playersData).forEach((playerId) => {
      if (!playersData[playerId].finalizado) {
        allFinished = false;
      }
    });

    if (allFinished) {
      await this.endGame();
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
    const roundElement = document.getElementById("currentRound");
    if (roundElement) {
      roundElement.textContent = `${this.currentRound}/${this.totalRounds}`;
    }
  }

  // Atualizar display da pontuação
  updateScoreDisplay() {
    const scoreElement = document.getElementById("playerScore");
    if (scoreElement) {
      scoreElement.textContent = this.score;
    }
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
    const finalScore = document.getElementById("finalScore");
    const roundsCompleted = document.getElementById("roundsCompleted");
    const accuracyPercentage = document.getElementById("accuracyPercentage");

    if (finalScore) finalScore.textContent = this.score;
    if (roundsCompleted)
      roundsCompleted.textContent = Math.min(
        this.currentRound - 1,
        this.totalRounds
      );

    if (this.playerRole === "adivinhador" && accuracyPercentage) {
      const accuracy = this.calculateAccuracy();
      accuracyPercentage.textContent = `${accuracy}%`;
    }

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
    if (this.gameListener) {
      firebaseDB.db
        .ref(`birdbox/games/${this.gameId}`)
        .off("value", this.gameListener);
    }
    if (this.descriptionListener) {
      firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentDescription`)
        .off("value", this.descriptionListener);
    }
    if (this.roundListener) {
      firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentRound`)
        .off("value", this.roundListener);
    }
    if (this.questionListener) {
      firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentQuestion`)
        .off("value", this.questionListener);
    }
    if (this.playersListener) {
      firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/jogadores`)
        .off("value", this.playersListener);
    }

    window.location.reload();
  }

  // Esconder tela de carregamento
  hideLoadingScreen() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }
}

function updateRoundDisplay() {
  const roundNumber = document.getElementById("roundNumber");
  const currentRoundEl = document.getElementById("currentRound");

  if (roundNumber) {
    roundNumber.textContent = `${gameManager.currentRound}/${gameManager.totalRounds}`;
  }
  if (currentRoundEl) {
    currentRoundEl.textContent = `${gameManager.currentRound}/${gameManager.totalRounds}`;
  }
}

// Botão Anterior
const prevBtn = document.getElementById("prevRound");
if (prevBtn) {
  prevBtn.addEventListener("click", () => {
    if (gameManager.currentRound > 1) {
      gameManager.currentRound--;
      gameManager.loadQuestionForCurrentRound();
      updateRoundDisplay();
    }
  });
}

// Botão Próxima
const nextBtn = document.getElementById("nextRound");
if (nextBtn) {
  nextBtn.addEventListener("click", () => {
    gameManager.advanceToNextRound();
    updateRoundDisplay();
  });
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
