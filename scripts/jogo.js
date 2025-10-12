// Gerenciador principal do jogo BirdBox - VERSÃO COMPLETA E CORRIGIDA
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
    this.isAdvancing = false;

    // Listeners do Firebase
    this.questionsSyncListener = null;
    this.gameListener = null;
    this.playersListener = null;
    this.roundListener = null;
    this.descriptionListener = null;
    this.gameFinishedListener = null;
    this.questionsListener = null;
  }

  // Inicializar o jogo - VERSÃO COMPLETA CORRIGIDA
  async initGame(gameId) {
    this.gameId = gameId;
    console.log("🎮 Iniciando jogo com ID:", gameId);

    try {
      // 🎯 PRIMEIRO: Debug da estrutura do jogo no Firebase
      await this.debugGameStructure();

      // Determinar o papel do jogador
      await this.determinePlayerRole();
      console.log("🎭 Papel do jogador determinado:", this.playerRole);

      // 🎯 CARREGAR PERGUNTAS ÚNICAS DA DUPLA
      await this.loadAllQuestions();

      // 🎯 VERIFICAR E FORÇAR SINCRONIZAÇÃO SE NECESSÁRIO
      const isSynchronized = await this.verifyQuestionsSynchronization();
      if (!isSynchronized) {
        console.warn(
          "⚠️ Problema de sincronização detectado, forçando sincronização..."
        );
        await this.forceQuestionsSynchronization();
      }

      await this.debugQuestionStructure();
      console.log(
        "📚 Pacote de perguntas da dupla carregado:",
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
        "Erro ao carregar o jogo. Verifique sua conexão e tente novamente."
      );
      window.location.href = "index.html";
    }
  }

  // 🎯 MÉTODO NOVO: Debug avançado da estrutura do jogo
  async debugGameStructure() {
    try {
      console.log("🔍 DEBUG AVANÇADO - Estrutura completa do jogo:");

      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}`)
        .once("value");

      const gameData = gameSnapshot.val();

      if (gameData) {
        console.log("📊 Dados do jogo no Firebase:", {
          id: gameData.id,
          status: gameData.status,
          totalPerguntas: gameData.perguntas ? gameData.perguntas.length : 0,
          totalJogadores: gameData.jogadores
            ? Object.keys(gameData.jogadores).length
            : 0,
          jogadores: gameData.jogadores ? Object.keys(gameData.jogadores) : [],
        });

        if (gameData.perguntas) {
          console.log("📋 PERGUNTAS NO FIREBASE:");
          gameData.perguntas.forEach((q, i) => {
            console.log(`  ${i + 1}.`, {
              id: q.id,
              pergunta: q.pergunta,
              som: q.som,
              opcoes: q.opcoes ? q.opcoes.length : 0,
              resposta: q.resposta_correta,
            });
          });
        } else {
          console.error(
            "❌ NENHUMA PERGUNTA NO FIREBASE - PROBLEMA NO PAREAMENTO!"
          );
        }
      } else {
        console.error("❌ Jogo não encontrado no Firebase!");
      }
    } catch (error) {
      console.error("❌ Erro no debug:", error);
    }
  }

  // 🎯 MÉTODO CORRIGIDO: Carregar perguntas únicas da dupla
  async loadAllQuestions() {
    try {
      console.log("🎯 Buscando perguntas únicas para esta dupla...");

      // 🎯 BUSCAR DADOS COMPLETOS DO JOGO
      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}`)
        .once("value");

      const gameData = gameSnapshot.val();

      if (gameData && gameData.perguntas && gameData.perguntas.length > 0) {
        console.log(
          "✅ Perguntas únicas da dupla encontradas:",
          gameData.perguntas.length
        );

        // 🎯 USAR AS PERGUNTAS ESPECÍFICAS DESTA DUPLA
        this.selectedQuestions = gameData.perguntas;
        this.questions = gameData.perguntas;
        this.totalRounds = gameData.perguntas.length;

        // 🎯 CORRIGIR ESTRUTURA DAS PERGUNTAS SE NECESSÁRIO
        this.fixQuestionStructure();

        // Carregar pool de opções erradas
        await this.loadWrongOptionsPool();

        console.log(
          "🎉 Dupla sincronizada com",
          this.selectedQuestions.length,
          "perguntas únicas"
        );
      } else {
        // FALLBACK: se não encontrar perguntas no Firebase
        console.warn(
          "🔄 Nenhuma pergunta específica da dupla encontrada, usando fallback"
        );
        await this.loadFallbackQuestions();
      }
    } catch (error) {
      console.error("❌ Erro ao carregar perguntas da dupla:", error);
      await this.loadFallbackQuestions();
    }
  }

  // 🎯 MÉTODO NOVO: Corrigir estrutura das perguntas
  fixQuestionStructure() {
    console.log("🔍 Corrigindo estrutura das perguntas...");

    this.selectedQuestions.forEach((question, index) => {
      // Corrigir campo 'pergunta' se estiver undefined
      if (!question.pergunta || question.pergunta === undefined) {
        if (
          question.opcoes &&
          question.opcoes.length > 0 &&
          question.resposta_correta !== undefined
        ) {
          question.pergunta = `Identifique o som: ${
            question.opcoes[question.resposta_correta]
          }`;
          console.log(`🔄 Corrigido pergunta ${index + 1}:`, question.pergunta);
        } else {
          question.pergunta = `Pergunta ${index + 1}`;
          console.warn(
            `⚠️ Pergunta ${index + 1} sem dados suficientes, usando fallback`
          );
        }
      }

      // Padronizar campo de áudio
      if (!question.som && question.audio) {
        question.som = question.audio;
        console.log(`🔄 Corrigido campo de áudio ${index + 1}:`, question.som);
      }

      // Garantir que tenha opções
      if (!question.opcoes || question.opcoes.length === 0) {
        question.opcoes = ["Opção A", "Opção B", "Opção C", "Opção D"];
        question.resposta_correta = 0;
        console.warn(`⚠️ Pergunta ${index + 1} sem opções, usando fallback`);
      }
    });
  }

  // 🎯 MÉTODO NOVO: Carregar pool de opções erradas
  async loadWrongOptionsPool() {
    try {
      const response = await fetch("arquivos/dados/perguntas.json");
      if (response.ok) {
        const data = await response.json();
        this.wrongOptionsPool = data.opcoes_erradas || [];
        console.log(
          "📚 Pool de opções erradas carregado:",
          this.wrongOptionsPool.length
        );
      } else {
        throw new Error("Erro ao carregar arquivo de perguntas");
      }
    } catch (error) {
      console.warn(
        "⚠️ Erro ao carregar pool de opções erradas, usando array vazio:",
        error
      );
      this.wrongOptionsPool = [];
    }
  }

  // 🎯 MÉTODO NOVO: Fallback para perguntas
  async loadFallbackQuestions() {
    try {
      console.log("🔄 Carregando fallback de perguntas...");
      const questionData = await QuestionManager.loadQuestions();
      this.questions = questionData.questions;
      this.selectedQuestions = questionData.selectedQuestions;
      this.wrongOptionsPool = questionData.wrongOptionsPool;
      this.totalRounds = questionData.totalRounds;
      this.totalTime = questionData.totalTime;

      console.log(
        "🔄 Fallback carregado:",
        this.selectedQuestions.length,
        "perguntas"
      );
    } catch (error) {
      console.error("❌ Erro no fallback:", error);
      throw new Error("Não foi possível carregar perguntas");
    }
  }

  // 🎯 MÉTODO CORRIGIDO: Verificar sincronização
  async verifyQuestionsSynchronization() {
    try {
      console.log("🔍 Verificando sincronização de perguntas da dupla...");

      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/perguntas`)
        .once("value");

      const firebaseQuestions = gameSnapshot.val();
      const localQuestions = this.selectedQuestions;

      if (!firebaseQuestions || firebaseQuestions.length === 0) {
        console.warn("⚠️ Nenhuma pergunta no Firebase");
        return false;
      }

      if (!localQuestions || localQuestions.length === 0) {
        console.warn("⚠️ Nenhuma pergunta local");
        return false;
      }

      // Verificar se temos o mesmo número de perguntas
      if (firebaseQuestions.length !== localQuestions.length) {
        console.error("❌ Número de perguntas diferente:", {
          firebase: firebaseQuestions.length,
          local: localQuestions.length,
        });
        return false;
      }

      // Verificar conteúdo das perguntas
      const areSame = this.compareQuestions(firebaseQuestions, localQuestions);

      if (areSame) {
        console.log("✅ PERGUNTAS SINCRONIZADAS: Dupla tem o mesmo pacote");
        return true;
      } else {
        console.error("❌ PERGUNTAS DIFERENTES: Problema de sincronização");
        return false;
      }
    } catch (error) {
      console.error("❌ Erro na verificação de sincronização:", error);
      return false;
    }
  }

  // 🎯 MÉTODO NOVO: Comparar perguntas
  compareQuestions(firebaseQuestions, localQuestions) {
    try {
      // Comparar por ID se disponível, senão por conteúdo
      for (let i = 0; i < firebaseQuestions.length; i++) {
        const firebaseQ = firebaseQuestions[i];
        const localQ = localQuestions[i];

        if (firebaseQ.id && localQ.id) {
          if (firebaseQ.id !== localQ.id) return false;
        } else if (firebaseQ.pergunta !== localQ.pergunta) {
          return false;
        }
      }
      return true;
    } catch (error) {
      console.error("❌ Erro ao comparar perguntas:", error);
      return false;
    }
  }

  // 🎯 MÉTODO NOVO: Forçar sincronização
  async forceQuestionsSynchronization() {
    try {
      console.log("🔄 Forçando sincronização de perguntas...");

      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/perguntas`)
        .once("value");

      const firebaseQuestions = gameSnapshot.val();

      if (firebaseQuestions && firebaseQuestions.length > 0) {
        this.selectedQuestions = firebaseQuestions;
        this.questions = firebaseQuestions;
        this.totalRounds = firebaseQuestions.length;

        // Corrigir estrutura
        this.fixQuestionStructure();

        console.log(
          "✅ Sincronização forçada - Novas perguntas:",
          this.selectedQuestions.length
        );

        // Recarregar a pergunta atual se necessário
        if (this.currentRound <= this.totalRounds) {
          await this.loadQuestionForCurrentRound();
        }

        return true;
      } else {
        console.warn("⚠️ Nenhuma pergunta no Firebase para sincronizar");
        return false;
      }
    } catch (error) {
      console.error("❌ Erro na sincronização forçada:", error);
      return false;
    }
  }

  // 🎯 MÉTODO DE DEBUG: Estrutura das perguntas
  async debugQuestionStructure() {
    console.log("🔍 DEBUG - Estrutura das perguntas carregadas:");

    if (this.selectedQuestions && this.selectedQuestions.length > 0) {
      this.selectedQuestions.forEach((q, index) => {
        console.log(`Pergunta ${index + 1}:`, {
          id: q.id,
          pergunta: q.pergunta,
          som: q.som || q.audio,
          opcoes: q.opcoes ? q.opcoes.length : 0,
          resposta_correta: q.resposta_correta,
          dica: q.dica,
          imagem: q.imagem,
        });
      });
    } else {
      console.warn("⚠️ Nenhuma pergunta carregada em selectedQuestions");
    }
  }

  // Determinar o papel do jogador - VERSÃO CORRIGIDA
  async determinePlayerRole() {
    try {
      // Primeiro verificar se já tem um papel definido
      const snapshot = await firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
        .once("value");

      this.playerRole = snapshot.val();

      if (!this.playerRole) {
        console.log("🎭 Papel não definido, determinando automaticamente...");

        const gameSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/jogadores`)
          .once("value");
        const players = gameSnapshot.val();

        let ouvintesCount = 0;
        let adivinhadoresCount = 0;

        // Contar papéis existentes CORRETAMENTE
        if (players) {
          Object.values(players).forEach((playerData) => {
            if (playerData.papel === "ouvinte") {
              ouvintesCount++;
            } else if (playerData.papel === "adivinhador") {
              adivinhadoresCount++;
            }
          });
        }

        console.log(
          `📊 Papéis existentes - Ouvintes: ${ouvintesCount}, Adivinhadores: ${adivinhadoresCount}`
        );

        // LÓGICA CORRIGIDA: Garantir que tenha um de cada
        if (ouvintesCount === 0) {
          this.playerRole = "ouvinte";
          console.log("🎧 Atribuindo papel: ouvinte (primeiro da dupla)");
        } else if (adivinhadoresCount === 0) {
          this.playerRole = "adivinhador";
          console.log("🔍 Atribuindo papel: adivinhador (segundo da dupla)");
        } else {
          // Se por algum motivo já tem dois, usar fallback seguro
          this.playerRole = Math.random() > 0.5 ? "ouvinte" : "adivinhador";
          console.log(
            "🎲 Usando fallback aleatório para papel:",
            this.playerRole
          );
        }

        console.log("✅ Papel final atribuído:", this.playerRole);

        // Salvar o papel no Firebase
        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
          .set(this.playerRole);
      } else {
        console.log("✅ Papel já definido:", this.playerRole);
      }

      return this.playerRole;
    } catch (error) {
      console.error("❌ Erro ao determinar papel:", error);
      // Fallback seguro
      this.playerRole = Math.random() > 0.5 ? "ouvinte" : "adivinhador";
      console.log("🔄 Usando fallback devido a erro:", this.playerRole);

      // Tentar salvar o fallback
      try {
        await firebaseDB.db
          .ref(`birdbox/games/${this.gameId}/jogadores/${this.playerId}/papel`)
          .set(this.playerRole);
      } catch (e) {
        console.error("❌ Erro ao salvar fallback:", e);
      }

      return this.playerRole;
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
        this.cleanupFirebaseListeners();
        window.location.href = "index.html";
      });
    }

    const rankingBtn = document.getElementById("rankingBtn");
    if (rankingBtn) {
      rankingBtn.addEventListener("click", () => {
        this.cleanupFirebaseListeners();
        window.location.href = "ranking.html";
      });
    }
  }

  // Configurar todos os botões - VERSÃO CORRIGIDA
  setupAllButtons() {
    // Botão de confirmar resposta (adivinhador) - APENAS UMA VEZ
    const submitButton = document.getElementById("submitAnswer");
    if (submitButton) {
      // Remover event listeners existentes primeiro
      submitButton.replaceWith(submitButton.cloneNode(true));

      // Adicionar novo listener
      const newSubmitButton = document.getElementById("submitAnswer");
      newSubmitButton.addEventListener("click", () => {
        console.log("🎯 Submit button clicado - chamando submitAnswer");
        IdentifierManager.submitAnswer(this);
      });
    }

    // Botões de navegação (ouvinte)
    const nextButton = document.getElementById("nextRound");
    const prevButton = document.getElementById("prevRound");

    // Botões de finalizar - CORREÇÃO: IDs específicos
    const finishListenerBtn = document.getElementById("finishGameListener");
    const finishIdentifierBtn = document.getElementById("finishGameIdentifier");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        ListenerManager.advanceToNextRound(this);
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        ListenerManager.goToPreviousRound(this);
      });
    }

    if (finishListenerBtn) {
      finishListenerBtn.addEventListener("click", () => {
        this.playerFinishedGame();
        finishListenerBtn.disabled = true;
        finishListenerBtn.classList.add("disabled-btn");
      });
    }

    if (finishIdentifierBtn) {
      finishIdentifierBtn.addEventListener("click", () => {
        this.playerFinishedGame();
        finishIdentifierBtn.disabled = true;
        finishIdentifierBtn.classList.add("disabled-btn");
      });
    }
  }

  // 🎯 CONFIGURAÇÃO COMPLETA DOS LISTENERS DO FIREBASE
  setupFirebaseListeners() {
    console.log("🔌 Configurando listeners do Firebase...", {
      gameId: this.gameId,
      playerRole: this.playerRole,
    });

    try {
      // 🎯 LISTENER PRINCIPAL: SINCRONIZAÇÃO DE PERGUNTAS DA DUPLA
      this.questionsSyncListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/perguntas`)
        .on("value", (snapshot) => {
          const firebaseQuestions = snapshot.val();
          console.log("📡 Listener: Perguntas da dupla no Firebase", {
            quantidade: firebaseQuestions ? firebaseQuestions.length : 0,
            rodadaAtual: this.currentRound,
          });

          if (firebaseQuestions && firebaseQuestions.length > 0) {
            const needsSync =
              this.needsQuestionsSynchronization(firebaseQuestions);

            if (needsSync) {
              console.log("🔄 Sincronizando perguntas locais com Firebase");
              this.synchronizeQuestions(firebaseQuestions);
            }
          }
        });

      // 📊 LISTENER: ESTADO GERAL DO JOGO
      this.gameListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}`)
        .on("value", (snapshot) => {
          const gameData = snapshot.val();
          if (!gameData) return;

          this.updateGameState(gameData);
        });

      // 👥 LISTENER: STATUS DOS JOGADORES
      this.playersListener = firebaseDB.db
        .ref(`birdbox/games/${this.gameId}/jogadores`)
        .on("value", (snapshot) => {
          const playersData = snapshot.val();
          if (!playersData) return;

          this.checkIfBothPlayersFinished(playersData);
          this.updatePartnerStatus(playersData);
        });

      console.log("✅ Todos os listeners do Firebase configurados com sucesso");
    } catch (error) {
      console.error(
        "❌ Erro crítico ao configurar listeners do Firebase:",
        error
      );
    }
  }

  // 🎯 MÉTODO AUXILIAR: Verificar se precisa sincronizar
  needsQuestionsSynchronization(firebaseQuestions) {
    if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
      return true;
    }

    if (this.selectedQuestions.length !== firebaseQuestions.length) {
      return true;
    }

    return !this.compareQuestions(firebaseQuestions, this.selectedQuestions);
  }

  // 🎯 MÉTODO AUXILIAR: Sincronizar perguntas
  synchronizeQuestions(firebaseQuestions) {
    try {
      console.log("🔄 Iniciando sincronização de perguntas...");

      const oldRound = this.currentRound;
      const oldQuestionsCount = this.selectedQuestions.length;

      this.selectedQuestions = firebaseQuestions;
      this.questions = firebaseQuestions;
      this.totalRounds = firebaseQuestions.length;

      this.fixQuestionStructure();

      console.log("📊 Sincronização concluída:", {
        perguntasAntigas: oldQuestionsCount,
        perguntasNovas: this.selectedQuestions.length,
      });

      if (this.currentRound > this.totalRounds) {
        this.currentRound = Math.max(1, this.totalRounds);
      }

      if (
        this.gameState === "playing" &&
        this.currentRound <= this.totalRounds
      ) {
        this.loadQuestionForCurrentRound();
      }

      this.updateRoundDisplay();
    } catch (error) {
      console.error("❌ Erro durante sincronização:", error);
    }
  }

  // 🎯 MÉTODO AUXILIAR: Atualizar status do parceiro
  updatePartnerStatus(playersData) {
    if (!playersData) return;

    try {
      const partnerId = Object.keys(playersData).find(
        (id) => id !== this.playerId
      );
      if (!partnerId) return;

      const partner = playersData[partnerId];

      if (this.playerRole === "ouvinte") {
        const statusElement = document.getElementById("partnerStatus");
        if (statusElement) {
          statusElement.textContent = partner.finalizado
            ? "Adivinhador finalizou!"
            : "Adivinhador ativo";
          statusElement.className = partner.finalizado
            ? "partner-status finished"
            : "partner-status active";
        }
      } else {
        const statusElement = document.getElementById("partnerDescription");
        if (statusElement) {
          statusElement.textContent = partner.finalizado
            ? "Ouvinte finalizou!"
            : "Ouvinte ativo";
          statusElement.className = partner.finalizado
            ? "partner-status finished"
            : "partner-status active";
        }
      }
    } catch (error) {
      console.error("❌ Erro ao atualizar status do parceiro:", error);
    }
  }

  // Limpeza completa dos listeners
  cleanupFirebaseListeners() {
    console.log("🧹 Limpando todos os listeners do Firebase...");

    const listeners = [
      {
        name: "questionsSyncListener",
        path: `birdbox/games/${this.gameId}/perguntas`,
      },
      { name: "gameListener", path: `birdbox/games/${this.gameId}` },
      {
        name: "playersListener",
        path: `birdbox/games/${this.gameId}/jogadores`,
      },
      {
        name: "roundListener",
        path: `birdbox/games/${this.gameId}/currentQuestionIndex`,
      },
      {
        name: "descriptionListener",
        path: `birdbox/games/${this.gameId}/descricaoAtual`,
      },
      {
        name: "gameFinishedListener",
        path: `birdbox/games/${this.gameId}/status`,
      },
      {
        name: "questionsListener",
        path: `birdbox/games/${this.gameId}/selectedQuestions`,
      },
    ];

    let removedCount = 0;

    listeners.forEach((listener) => {
      if (this[listener.name]) {
        try {
          firebaseDB.db.ref(listener.path).off("value", this[listener.name]);
          this[listener.name] = null;
          removedCount++;
        } catch (error) {
          console.error(`❌ Erro ao remover listener ${listener.name}:`, error);
        }
      }
    });

    console.log(`🧹 ${removedCount} listeners removidos`);
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

  // 🎯 CARREGAR PERGUNTA DA RODADA ATUAL - VERSÃO COMPLETA CORRIGIDA
  async loadQuestionForCurrentRound() {
    if (this.currentRound > this.totalRounds) {
      this.handleGameCompletion();
      return;
    }

    // 🎯 REGISTRAR INÍCIO DA PERGUNTA PARA CALCULAR TEMPO DE RESPOSTA
    this.questionStartTime = Date.now();

    if (!this.selectedQuestions || this.selectedQuestions.length === 0) {
      console.error("❌ Nenhuma pergunta disponível");
      this.showErrorState("Erro: Nenhuma pergunta disponível");
      return;
    }

    try {
      console.log(
        "🔄 Carregando pergunta:",
        `Rodada ${this.currentRound}/${this.totalRounds}`,
        `Papel: ${this.playerRole}`
      );

      // 🎯 USA AS PERGUNTAS SINCRONIZADAS DA DUPLA
      this.currentQuestion = this.selectedQuestions[this.currentRound - 1];

      if (!this.currentQuestion) {
        throw new Error(
          `Pergunta não encontrada para rodada ${this.currentRound}`
        );
      }

      console.log("📋 Dados da pergunta SINCRONIZADA:", {
        rodada: this.currentRound,
        id: this.currentQuestion.id || `auto-${Date.now()}`,
        pergunta: this.currentQuestion.pergunta,
        som: this.currentQuestion.som || this.currentQuestion.audio,
      });

      // PREPARAR OPÇÕES
      let preparedOptions;
      try {
        preparedOptions = QuestionManager.prepareQuestionOptions(
          this.currentQuestion,
          this.wrongOptionsPool
        );

        if (!preparedOptions.options || preparedOptions.options.length < 2) {
          throw new Error("Opções insuficientes");
        }

        this.currentQuestion.displayOptions = preparedOptions.options;
        this.currentQuestion.correctDisplayIndex = preparedOptions.correctIndex;
      } catch (optionsError) {
        console.error("❌ Erro ao preparar opções:", optionsError);
        this.currentQuestion.displayOptions = [
          "Opção A",
          "Opção B",
          "Opção C",
          "Opção D",
        ];
        this.currentQuestion.correctDisplayIndex = 0;
      }

      // ATUALIZAR INTERFACE
      await this.updateInterfaceForCurrentRole();

      console.log(
        "✅",
        this.playerRole,
        "pronto para rodada",
        this.currentRound,
        "- PERGUNTA SINCRONIZADA"
      );
    } catch (error) {
      console.error("❌ Erro em loadQuestionForCurrentRound:", error);
      await this.handleLoadError(error);
    }
  }

  // 🎯 MÉTODO AUXILIAR: Atualizar interface por papel
  async updateInterfaceForCurrentRole() {
    if (this.playerRole === "ouvinte") {
      console.log(
        "🎵 [OUVINTE] Configurando interface para rodada",
        this.currentRound
      );
      ListenerManager.prepareAudio(this.currentQuestion);
      ListenerManager.updateInterface(this.currentRound, this.totalRounds);
    } else {
      console.log(
        "🎯 [ADIVINHADOR] Configurando interface para rodada",
        this.currentRound
      );
      IdentifierManager.updateOptions(this.currentQuestion);
      this.updateRoundDisplay();
      IdentifierManager.enableAnswerOptions();
      this.selectedOption = null;
      IdentifierManager.resetAnswerInterface();
    }
  }

  // 🎯 MÉTODO AUXILIAR: Tratamento de erro
  async handleLoadError(error) {
    const errorMessage = `Erro ao carregar pergunta: ${error.message}`;
    console.error("❌", errorMessage);

    if (this.playerRole === "ouvinte") {
      ListenerManager.showErrorState(errorMessage);
    } else {
      IdentifierManager.showErrorState(errorMessage);
    }
  }

  // 🎯 MÉTODO AUXILIAR: Conclusão do jogo
  handleGameCompletion() {
    console.log("🎉 [CONCLUSÃO] Jogo completado por", this.playerRole);

    if (this.playerRole === "ouvinte") {
      ListenerManager.showCompletionState(this.totalRounds);
    } else {
      IdentifierManager.showCompletionState(this.totalRounds);
    }

    if (this.currentRound >= this.totalRounds) {
      this.playerFinishedGame();
    }
  }

  // 🎯 MÉTODO AUXILIAR: Mostrar erro
  showErrorState(message) {
    const errorElement =
      document.getElementById("errorMessage") || this.createErrorElement();
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.style.display = "block";
    }
  }

  // 🎯 MÉTODO AUXILIAR: Criar elemento de erro
  createErrorElement() {
    const errorElement = document.createElement("div");
    errorElement.id = "errorMessage";
    errorElement.style.cssText = `
      background: #f8d7da;
      color: #721c24;
      padding: 10px;
      border-radius: 5px;
      margin: 10px 0;
      border: 1px solid #f5c6cb;
    `;

    const container = document.querySelector(".container") || document.body;
    container.prepend(errorElement);
    return errorElement;
  }

  // Avançar para próxima rodada
  async advanceToNextRound() {
    if (this.isAdvancing) return;
    this.isAdvancing = true;

    console.log("🔄 Iniciando advanceToNextRound...", {
      role: this.playerRole,
      currentRound: this.currentRound,
      totalRounds: this.totalRounds,
    });

    try {
      if (this.currentRound < this.totalRounds) {
        this.currentRound++;
        console.log(
          "➡️",
          this.playerRole,
          "avançou para rodada:",
          this.currentRound
        );

        this.updateRoundDisplay();
        await this.loadQuestionForCurrentRound();

        console.log(
          "✅",
          this.playerRole,
          "carregou pergunta",
          this.currentRound
        );
      } else if (this.currentRound === this.totalRounds) {
        console.log(
          "🎯",
          this.playerRole,
          "na última rodada:",
          this.currentRound
        );
        this.currentRound = this.totalRounds;
        this.updateRoundDisplay();
      }
    } catch (error) {
      console.error("❌ Erro em advanceToNextRound:", error);
    } finally {
      setTimeout(() => {
        this.isAdvancing = false;
      }, 100);
    }
  }

  // Resto dos métodos permanecem iguais...
  async checkAndAdvanceRound() {
    await firebaseDB.db
      .ref(
        `birdbox/games/${this.gameId}/jogadores/${this.playerId}/readyForNextRound`
      )
      .set(false);
    this.advanceToNextRound();
  }

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

  async checkIfBothPlayersFinished(playersData) {
    if (!playersData) return;
    const allFinished = Object.values(playersData).every((p) => p.finalizado);
    if (allFinished) {
      await this.endGame();
    }
  }

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

  resetAnswerInterface() {
    if (this.playerRole === "adivinhador") {
      IdentifierManager.resetAnswerInterface();
    }
  }

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

  updateScoreDisplay() {
    const scoreEl = document.getElementById("playerScore");
    if (scoreEl) scoreEl.textContent = this.score;
  }

  async endGame() {
    clearInterval(this.timerInterval);
    this.gameState = "finished";
    await this.saveFinalScore();
    this.showGameOverScreen();
  }

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

  showGameOverScreen() {
    const gameOverOverlay = document.getElementById("gameOverOverlay");
    if (gameOverOverlay) gameOverOverlay.classList.add("active");
  }

  calculateAccuracy() {
    const totalAnswered = Math.min(this.currentRound - 1, this.totalRounds);
    if (totalAnswered === 0) return 0;
    const expectedScore = totalAnswered * 100;
    return Math.round((this.score / expectedScore) * 100);
  }

  restartGame() {
    console.log("🔄 Reiniciando jogo...");
    this.cleanupFirebaseListeners();
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    window.location.reload();
  }

  hideLoadingScreen() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (loadingOverlay) loadingOverlay.classList.remove("active");
  }
}

// Event listeners globais - VERSÃO CORRIGIDA
document.querySelectorAll(".option-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // CORREÇÃO: Usar window.selectedOption consistentemente
    window.selectedOption = parseInt(btn.dataset.option);

    // CORREÇÃO: Também atualizar no gameManager para consistência
    if (typeof gameManager !== "undefined") {
      gameManager.selectedOption = window.selectedOption;
    }

    const submitBtn = document.getElementById("submitAnswer");
    if (submitBtn) submitBtn.disabled = false;

    document
      .querySelectorAll(".option-btn")
      .forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");

    resetInactivityTimer();

    console.log("✅ Opção selecionada:", window.selectedOption);
  });
});

const submitBtn = document.getElementById("submitAnswer");
if (submitBtn) {
  submitBtn.addEventListener("click", () => {
    if (gameManager.selectedOption !== null) {
      IdentifierManager.submitAnswer(gameManager);
      submitBtn.disabled = true;
      gameManager.selectedOption = null;
      resetInactivityTimer();
    }
  });
}

document.querySelectorAll("#finishGame").forEach((btn) => {
  btn.addEventListener("click", () => {
    gameManager.playerFinishedGame();
  });
});

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    gameManager.playerFinishedGame();
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
