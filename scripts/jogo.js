// Gerenciador principal do jogo BirdBox
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
  }

  // Inicializar o jogo
  async initGame(gameId) {
    this.gameId = gameId;
    console.log("Iniciando jogo com ID:", gameId);

    try {
      // Primeiro determinar o papel do jogador
      await this.determinePlayerRole();
      console.log("Papel do jogador determinado:", this.playerRole);

      // Carregar perguntas
      await this.loadQuestions();

      // Iniciar interface conforme o papel
      this.initializeUI();

      // Configurar ouvintes do Firebase
      this.setupFirebaseListeners();

      // Iniciar timer global
      this.startGameTimer();

      // Se for o ouvinte, iniciar primeira pergunta
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
      alert("Erro ao carregar o jogo. Tente novamente.");
      window.location.href = "index.html";
    }
  }

  // Carregar perguntas do JSON
  async loadQuestions() {
    try {
      const response = await fetch("../arquivos/dados/perguntas.json");
      if (!response.ok) {
        throw new Error("Erro ao carregar perguntas");
      }

      const data = await response.json();
      this.questions = data.perguntas;
      this.wrongOptionsPool = data.opcoes_erradas || [];

      // Configurações do jogo
      this.totalRounds = data.configuracoes?.total_rodadas || 4;
      this.totalTime = data.configuracoes?.tempo_total_jogo || 180;

      // Selecionar perguntas aleatórias
      this.selectedQuestions = Utils.shuffleArray([...this.questions]).slice(
        0,
        this.totalRounds
      );

      console.log(
        `Carregadas ${this.selectedQuestions.length} perguntas para o jogo`
      );
    } catch (error) {
      console.error("Erro ao carregar perguntas:", error);
      // Fallback para perguntas embutidas se necessário
      this.questions = this.getFallbackQuestions();
      this.selectedQuestions = Utils.shuffleArray([...this.questions]).slice(
        0,
        this.totalRounds
      );
      this.wrongOptionsPool = this.getFallbackWrongOptions();
    }
  }

  // Determinar o papel do jogador
  async determinePlayerRole() {
    try {
      // Primeiro verificar se já tem papel salvo no Firebase
      const snapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
        .once("value");

      this.playerRole = snapshot.val();

      if (!this.playerRole) {
        console.log("Papel não definido, determinando automaticamente...");

        // Verificar quantos ouvintes já existem no jogo
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

        // Atribuir papel baseado no que falta
        if (ouvintesCount === 0) {
          this.playerRole = "ouvinte";
        } else if (adivinhadoresCount === 0) {
          this.playerRole = "adivinhador";
        } else {
          // Se ambos já existem, verificar qual tem menos
          this.playerRole =
            ouvintesCount <= adivinhadoresCount ? "ouvinte" : "adivinhador";
        }

        console.log("Papel atribuído:", this.playerRole);

        // Salvar o papel no Firebase
        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
          .set(this.playerRole);
      }

      console.log("Papel final do jogador:", this.playerRole);
    } catch (error) {
      console.error("Erro ao determinar papel:", error);
      // Fallback: alternar entre os papéis
      this.playerRole = Math.random() > 0.5 ? "ouvinte" : "adivinhador";
      console.log("Usando fallback para papel:", this.playerRole);
    }
  }

  // Inicializar interface conforme o papel
  initializeUI() {
    // Esconder ambas as views primeiro
    document.getElementById("listenerView").classList.add("hidden");
    document.getElementById("identifierView").classList.add("hidden");

    // Mostrar a view correta baseada no papel
    if (this.playerRole === "ouvinte") {
      console.log("Mostrando view do ouvinte");
      document.getElementById("listenerView").classList.remove("hidden");
      this.setupListenerUI();
    } else {
      console.log("Mostrando view do adivinhador");
      document.getElementById("identifierView").classList.remove("hidden");
      this.setupIdentifierUI();
    }

    // Configurar event listeners comuns
    this.setupCommonEventListeners();

    // Atualizar displays iniciais
    this.updateTimerDisplay();
    this.updateRoundDisplay();
    this.updateScoreDisplay();
  }

  // Configurar UI do ouvinte
  setupListenerUI() {
    const playButton = document.getElementById("playSound");
    const replayButton = document.getElementById("replaySound");

    if (playButton && replayButton) {
      playButton.addEventListener("click", () => this.playCurrentSound());
      replayButton.addEventListener("click", () => this.playCurrentSound());

      // Configurar elemento de áudio
      this.audioPlayer = document.getElementById("soundPlayer");
      if (this.audioPlayer) {
        this.audioPlayer.addEventListener("ended", () => {
          if (replayButton) replayButton.disabled = false;
        });
      }
    }

    // Atualizar status inicial
    this.updateListenerInterface();
  }

  // Configurar UI do adivinhador
  setupIdentifierUI() {
    const options = document.querySelectorAll(".option-btn");
    const submitButton = document.getElementById("submitAnswer");

    if (options && submitButton) {
      options.forEach((option) => {
        option.addEventListener("click", (e) => {
          this.selectOption(e.currentTarget);
        });

        // Inicializar texto das opções
        const optionText = option.querySelector(".option-text");
        if (optionText) {
          optionText.textContent = "Aguardando...";
        }
      });

      submitButton.addEventListener("click", () => {
        this.submitAnswer();
      });

      submitButton.disabled = true;
    }

    // Inicializar descrição
    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = "Aguardando descrição do ouvinte...";
    }
  }

  // Configurar event listeners comuns
  setupCommonEventListeners() {
    // Botão jogar novamente
    const playAgainBtn = document.getElementById("playAgainBtn");
    if (playAgainBtn) {
      playAgainBtn.addEventListener("click", () => {
        this.restartGame();
      });
    }

    // Botão menu principal
    const mainMenuBtn = document.getElementById("mainMenuBtn");
    if (mainMenuBtn) {
      mainMenuBtn.addEventListener("click", () => {
        window.location.href = "index.html";
      });
    }
  }

  // Configurar listeners do Firebase
  setupFirebaseListeners() {
    // Listener para mudanças no estado do jogo
    this.gameListener = firebaseDB.db
      .ref(`birdbox/games/${this.gameId}`)
      .on("value", (snapshot) => {
        const gameData = snapshot.val();
        if (!gameData) {
          console.log("Jogo não encontrado no Firebase");
          return;
        }

        this.updateGameState(gameData);
      });

    // Listener para descrições do parceiro (apenas para adivinhador)
    if (this.playerRole === "adivinhador") {
      this.descriptionListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentDescription`)
        .on("value", (snapshot) => {
          const description = snapshot.val();
          if (description) {
            console.log("Nova descrição recebida:", description);
            this.updatePartnerDescription(description);
          }
        });
    }

    // Listener para mudanças de rodada
    this.roundListener = firebaseDB.db
      .ref(`birdbox/games/${this.gameId}/currentRound`)
      .on("value", (snapshot) => {
        const round = snapshot.val();
        if (round && round !== this.currentRound) {
          console.log("Nova rodada iniciada:", round);
          this.currentRound = round;
          this.updateRoundDisplay();

          // Se for adivinhador, resetar interface
          if (this.playerRole === "adivinhador") {
            this.resetAnswerInterface();
          }
        }
      });

    // Listener para mudanças de pergunta (apenas para adivinhador)
    if (this.playerRole === "adivinhador") {
      this.questionListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentQuestion`)
        .on("value", async (snapshot) => {
          const questionId = snapshot.val();
          if (questionId && questionId !== (this.currentQuestion?.id || null)) {
            console.log("Nova pergunta recebida:", questionId);
            await this.loadQuestionForIdentifier(questionId);
          }
        });
    }
  }

  // Atualizar estado do jogo
  updateGameState(gameData) {
    // Verificar se o jogo foi finalizado
    if (gameData.status === "finalizado") {
      this.endGame();
      return;
    }

    // Atualizar pontuações se necessário
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
      this.endGame();
      return;
    }

    this.currentQuestion = this.selectedQuestions[this.currentRound - 1];

    // Atualizar pergunta atual no Firebase
    await firebaseDB.db
      .ref(`birdbox/games/${this.gameId}/currentQuestion`)
      .set(this.currentQuestion.id);

    // Preparar opções para esta pergunta
    const preparedOptions = this.prepareQuestionOptions(this.currentQuestion);
    this.currentQuestion.displayOptions = preparedOptions.options;
    this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;

    // Para o ouvinte: preparar áudio e interface
    if (this.playerRole === "ouvinte") {
      this.prepareAudioForListener();
      this.updateListenerInterface();
    }

    this.updateRoundDisplay();
  }

  // Preparar opções para uma pergunta
  prepareQuestionOptions(question) {
    const options = [];

    // Adicionar resposta correta
    const correctAnswer = question.opcoes[question.resposta_correta];
    options.push(correctAnswer);

    // Selecionar 3 opções erradas aleatórias do pool
    const wrongOptions = Utils.shuffleArray([...this.wrongOptionsPool])
      .filter((opt) => opt !== correctAnswer && !question.opcoes.includes(opt))
      .slice(0, 3);

    options.push(...wrongOptions);

    // Embaralhar as opções
    const shuffledOptions = Utils.shuffleArray(options);

    // Encontrar o índice da resposta correta após embaralhamento
    const newCorrectIndex = shuffledOptions.findIndex(
      (opt) => opt === correctAnswer
    );

    return {
      options: shuffledOptions,
      correctIndex: newCorrectIndex,
    };
  }

  // Preparar áudio para o ouvinte
  prepareAudioForListener() {
    if (this.audioPlayer && this.currentQuestion) {
      const soundPath = `../arquivos/sons/${this.currentQuestion.som}`;
      this.audioPlayer.src = soundPath;

      // Habilitar botões de áudio
      const playButton = document.getElementById("playSound");
      const replayButton = document.getElementById("replaySound");

      if (playButton) playButton.disabled = false;
      if (replayButton) replayButton.disabled = true;
    }
  }

  // Reproduzir som atual
  playCurrentSound() {
    if (this.audioPlayer) {
      this.audioPlayer.play().catch((error) => {
        console.error("Erro ao reproduzir áudio:", error);
        alert("Erro ao reproduzir o som. Verifique se o arquivo existe.");
      });

      // Desabilitar botão de play enquanto toca
      const playButton = document.getElementById("playSound");
      if (playButton) playButton.disabled = true;
    }
  }

  // Carregar pergunta para adivinhador
  async loadQuestionForIdentifier(questionId) {
    try {
      // Encontrar a pergunta pelo ID
      this.currentQuestion = this.questions.find((q) => q.id === questionId);

      if (this.currentQuestion) {
        console.log(
          "Pergunta carregada para adivinhador:",
          this.currentQuestion
        );

        // Preparar opções
        const preparedOptions = this.prepareQuestionOptions(
          this.currentQuestion
        );
        this.currentQuestion.displayOptions = preparedOptions.options;
        this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;

        // Atualizar interface
        this.updateIdentifierOptions();
        this.updateRoundDisplay();
      }
    } catch (error) {
      console.error("Erro ao carregar pergunta:", error);
    }
  }

  // Atualizar interface do ouvinte
  updateListenerInterface() {
    const statusElement = document.getElementById("partnerStatus");
    if (statusElement) {
      statusElement.textContent = "Descreva o som para seu parceiro";
    }

    const roundInfo = document.getElementById("roundInfo");
    if (roundInfo) {
      roundInfo.textContent = `Rodada ${this.currentRound} de ${this.totalRounds}`;
    }
  }

  // Atualizar opções para o adivinhador
  updateIdentifierOptions() {
    const optionsContainer = document.getElementById("optionsContainer");
    const optionButtons = optionsContainer.querySelectorAll(".option-btn");

    if (this.currentQuestion && this.currentQuestion.displayOptions) {
      this.currentQuestion.displayOptions.forEach((option, index) => {
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
  updatePartnerDescription(description) {
    const descElement = document.getElementById("partnerDescription");
    if (descElement) {
      descElement.textContent = description;
      descElement.classList.add("active");
    }

    // Habilitar opções de resposta
    this.enableAnswerOptions();
  }

  // Habilitar opções de resposta para adivinhador
  enableAnswerOptions() {
    const options = document.querySelectorAll(".option-btn");
    options.forEach((option) => {
      option.classList.remove("disabled");
    });

    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) submitButton.disabled = false;
  }

  // Selecionar opção
  selectOption(optionElement) {
    // Desselecionar opção anterior
    const previouslySelected = document.querySelector(".option-btn.selected");
    if (previouslySelected) {
      previouslySelected.classList.remove("selected");
    }

    // Selecionar nova opção
    optionElement.classList.add("selected");
    this.selectedOption = parseInt(optionElement.dataset.option);
  }

  // Submeter resposta
  async submitAnswer() {
    if (this.selectedOption === null) {
      alert("Selecione uma opção antes de confirmar.");
      return;
    }

    // Verificar se a resposta está correta usando o índice de exibição
    const isCorrect =
      this.selectedOption === this.currentQuestion.correctDisplayIndex;

    // Atualizar pontuação
    if (isCorrect) {
      const points = this.calculatePoints();
      this.score += points;
      this.updateScoreDisplay();

      // Atualizar pontuação no Firebase
      await firebaseDB.db
        .ref(
          `birdbox/games/${this.gameId}/jogadores/${this.playerId}/pontuacao`
        )
        .set(this.score);

      // Feedback visual de acerto
      this.showAnswerFeedback(true);
    } else {
      this.showAnswerFeedback(false);
    }

    // Avançar para próxima rodada após delay
    setTimeout(() => {
      this.advanceToNextRound();
    }, 2000);
  }

  // Calcular pontos baseado na dificuldade
  calculatePoints() {
    const basePoints = 100;
    const difficultyMultiplier = this.currentQuestion.dificuldade;
    return basePoints * difficultyMultiplier;
  }

  // Mostrar feedback visual da resposta
  showAnswerFeedback(isCorrect) {
    const options = document.querySelectorAll(".option-btn");

    options.forEach((option) => {
      const optionIndex = parseInt(option.dataset.option);

      if (optionIndex === this.currentQuestion.correctDisplayIndex) {
        option.classList.add("correct");
      } else if (optionIndex === this.selectedOption && !isCorrect) {
        option.classList.add("incorrect");
      }

      option.classList.add("disabled");
    });

    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) submitButton.disabled = true;
  }

  // Avançar para próxima rodada
  async advanceToNextRound() {
    this.currentRound++;

    // Atualizar rodada no Firebase
    await firebaseDB.db
      .ref(`birdbox/games/${this.gameId}/currentRound`)
      .set(this.currentRound);

    if (this.playerRole === "ouvinte") {
      // Limpar descrição atual
      await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/currentDescription`)
        .set(null);

      // Carregar próxima pergunta
      await this.loadNextQuestion();
    } else {
      // Para adivinhador, apenas atualizar a interface
      this.resetAnswerInterface();
      this.updateRoundDisplay();
    }
  }

  // Resetar interface de resposta
  resetAnswerInterface() {
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

    this.selectedOption = null;
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

    // Salvar pontuação final
    await this.saveFinalScore();

    // Mostrar tela de resultados
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

    // Calcular precisão (se for adivinhador)
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

    // Calcular baseado nas respostas corretas
    const expectedScore = totalAnswered * 100;
    return Math.round((this.score / expectedScore) * 100);
  }

  // Reiniciar o jogo
  restartGame() {
    // Limpar listeners do Firebase
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

    window.location.reload();
  }

  // Esconder tela de carregamento
  hideLoadingScreen() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }

  // Perguntas de fallback
  getFallbackQuestions() {
    return [
      {
        id: 1,
        som: "floresta.mp3",
        descricao:
          "O ar é úmido e fresco, cheiro de terra molhada e vegetação densa.",
        opcoes: ["Floresta Tropical", "Deserto", "Praia", "Montanha"],
        resposta_correta: 0,
        dificuldade: 1,
        categoria: "natureza",
      },
      {
        id: 2,
        som: "chuva.mp3",
        descricao:
          "Milhares de pequenos impactos suaves, uma cortina líquida que envolve tudo.",
        opcoes: ["Chuva Moderada", "Ventania", "Cachoeira", "Rio"],
        resposta_correta: 0,
        dificuldade: 1,
        categoria: "clima",
      },
    ];
  }

  // Opções erradas de fallback
  getFallbackWrongOptions() {
    return [
      "Deserto",
      "Montanha",
      "Cidade",
      "Praia",
      "Ventania",
      "Nevasca",
      "Tempestade",
      "Rio",
      "Lago",
      "Oceano",
      "Floresta",
      "Campo",
    ];
  }

  // Debug do estado do jogo
  debugGameState() {
    console.log("=== DEBUG DO JOGO ===");
    console.log("Game ID:", this.gameId);
    console.log("Player ID:", this.playerId);
    console.log("Player Name:", this.playerName);
    console.log("Player Role:", this.playerRole);
    console.log("Current Round:", this.currentRound);
    console.log("Total Rounds:", this.totalRounds);
    console.log("Score:", this.score);
    console.log("Current Question:", this.currentQuestion);
    console.log("Selected Questions:", this.selectedQuestions.length);

    // Verificar elementos da UI
    console.log(
      "Listener View visible:",
      !document.getElementById("listenerView").classList.contains("hidden")
    );
    console.log(
      "Identifier View visible:",
      !document.getElementById("identifierView").classList.contains("hidden")
    );
  }
}

// Instância global do gerenciador de jogo
const gameManager = new GameManager();

// Inicialização quando a página carrega
document.addEventListener("DOMContentLoaded", function () {
  // Obter gameId da URL
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

// Debug adicional após inicialização
setTimeout(() => {
  if (typeof gameManager !== "undefined") {
    gameManager.debugGameState();
  }
}, 3000);
