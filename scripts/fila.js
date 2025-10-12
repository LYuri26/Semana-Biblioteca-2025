// fila.js - VERSÃO COMPLETA E CORRIGIDA (CÁLCULO DE POSIÇÃO + PREVENÇÃO DE DUPLICAÇÃO)

class QueueManager {
  constructor() {
    this.playerId = localStorage.getItem("playerId");
    this.playerName = localStorage.getItem("playerName");
    this.queueListener = null;
    this.isLookingForMatch = false;
    this.gameCheckInterval = null;
    this.positionCheckInterval = null;
    this.hasEnteredQueue = false; // NOVO: prevenir entrada múltipla
  }

  // Entrar na fila - CORRIGIDO
  async enterQueue() {
    if (!this.playerId || !this.playerName) {
      console.error("ID ou nome do jogador não encontrado");
      alert("Erro: Dados do jogador não encontrados. Volte à página inicial.");
      window.location.href = "index.html";
      return false;
    }

    console.log(
      `Jogador ${this.playerName} (${this.playerId}) tentando entrar na fila`
    );

    // PREVENÇÃO: já entrou na fila?
    if (this.hasEnteredQueue) {
      console.log("⚠️ Já está no processo de entrada na fila, ignorando...");
      return true;
    }

    this.hasEnteredQueue = true;

    // Verificar se já está em jogo ativo
    const inGame = await this.checkAndRedirectToExistingGame();
    if (inGame) {
      console.log("Já está em jogo ativo, redirecionando...");
      this.hasEnteredQueue = false;
      return true;
    }

    // Verificar se já está na fila
    const alreadyInQueue = await this.checkIfAlreadyInQueue();
    if (alreadyInQueue) {
      console.log("Já está na fila, aguardando parceiro...");
      this.isLookingForMatch = true;
      this.listenForGameCreation();
      this.startPositionTracking();
      this.updateQueueStatus("Aguardando parceiro...");

      // 🎯 CORREÇÃO: Verificação imediata da posição
      setTimeout(() => this.forcePositionCheck(), 500);

      return true;
    }

    // Verificar novamente se não entrou em um jogo durante a verificação
    const inGameNow = await this.checkAndRedirectToExistingGame();
    if (inGameNow) {
      console.log("Entrou em jogo durante a verificação, redirecionando...");
      this.hasEnteredQueue = false;
      return true;
    }

    this.isLookingForMatch = true;

    // Adicionar jogador à fila
    const success = await firebaseDB.addPlayerToQueue(
      this.playerId,
      this.playerName
    );

    if (success) {
      console.log("Processo de entrada na fila concluído com sucesso");
      this.listenForGameCreation();
      this.startPositionTracking();
      this.updateQueueStatus("Procurando parceiro...");
      this.startGameCheckInterval();

      // 🎯 CORREÇÃO: Verificação imediata da posição
      setTimeout(() => this.forcePositionCheck(), 1000);

      return true;
    } else {
      console.error("Falha ao entrar na fila");
      this.hasEnteredQueue = false; // Liberar para tentar novamente
      this.updateQueueStatus("Erro ao entrar na fila");
      return false;
    }
  }

  // Sair da fila - CORRIGIDO
  async leaveQueue() {
    console.log("Saindo da fila...");
    this.isLookingForMatch = false;
    this.hasEnteredQueue = false; // Liberar flag
    this.stopAllIntervals();

    const success = await firebaseDB.removePlayerFromQueue(this.playerId);
    if (success) {
      console.log("Removido da fila com sucesso");
    } else {
      console.error("Falha ao remover da fila");
    }

    return success;
  }

  // Verificar se já está na fila
  async checkIfAlreadyInQueue() {
    try {
      const snapshot = await firebaseDB.queueRef
        .child(this.playerId)
        .once("value");
      return snapshot.exists();
    } catch (error) {
      console.error("Erro ao verificar fila:", error);
      return false;
    }
  }

  // Verificar e redirecionar para jogo existente
  async checkAndRedirectToExistingGame() {
    try {
      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/players/${this.playerId}/currentGame`)
        .once("value");
      const gameId = gameSnapshot.val();

      if (gameId) {
        const gameSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${gameId}`)
          .once("value");
        const gameData = gameSnapshot.val();

        if (gameData && gameData.status === "ativo") {
          console.log("Jogador já está em partida ativa, redirecionando...");
          window.location.href = `jogo.html?gameId=${gameId}`;
          return true;
        } else {
          // Limpar gameId inválido
          await firebaseDB.db
            .ref(`birdbox/players/${this.playerId}/currentGame`)
            .remove();
        }
      }
      return false;
    } catch (error) {
      console.error("Erro ao verificar jogo existente:", error);
      return false;
    }
  }

  // 🎯 MÉTODO CORRIGIDO: Iniciar tracking de posição na fila
  startPositionTracking() {
    this.positionCheckInterval = setInterval(async () => {
      if (!this.isLookingForMatch) return;

      try {
        const orderedQueue = await firebaseDB.getOrderedQueue();

        // 🎯 CORREÇÃO: Verificar se a fila existe e tem jogadores
        if (!orderedQueue || orderedQueue.length === 0) {
          console.log("Fila vazia, parando tracking...");
          this.stopPositionTracking();
          this.updatePositionInfo(0, 0, null);
          return;
        }

        const playerInQueue = orderedQueue.find(
          (player) => player.id === this.playerId
        );

        if (playerInQueue) {
          // 🎯 CORREÇÃO: Usar índice real do array + 1 para posição
          const position = orderedQueue.indexOf(playerInQueue) + 1;
          const papel = playerInQueue.papel;
          const totalPlayers = orderedQueue.length;

          console.log(`📊 Posição calculada: ${position}/${totalPlayers}`, {
            playerId: this.playerId,
            queueSize: totalPlayers,
            playerPosition: position,
          });

          // Atualizar UI com informações de posição e papel
          this.updatePositionInfo(position, totalPlayers, papel);
        } else {
          // Jogador não está mais na fila
          console.log("Jogador não encontrado na fila, parando tracking...");
          this.stopPositionTracking();
          this.updatePositionInfo(0, 0, null);
        }
      } catch (error) {
        console.error("Erro ao verificar posição:", error);
        this.updatePositionInfo(0, 0, null);
      }
    }, 2000);
  }

  // Parar tracking de posição
  stopPositionTracking() {
    if (this.positionCheckInterval) {
      clearInterval(this.positionCheckInterval);
      this.positionCheckInterval = null;
    }
  }

  // 🎯 MÉTODO CORRIGIDO: Atualizar informações de posição na UI
  updatePositionInfo(position, totalPlayers, papel) {
    const statusElement = document.getElementById("queueStatus");
    const positionElement =
      document.getElementById("positionInfo") || this.createPositionElement();

    if (statusElement && positionElement) {
      // 🎯 CORREÇÃO: Validação de dados inconsistentes
      if (position > totalPlayers) {
        console.warn("⚠️ Inconsistência detectada: posição > total");
        position = totalPlayers; // Corrigir para valor máximo possível
      }

      if (position === 0 || totalPlayers === 0) {
        positionElement.innerHTML = `
          <div style="text-align: center; margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
            <div>Não está na fila</div>
          </div>
        `;
        return;
      }

      const proximoJogador =
        position === 1
          ? "🎯 Próximo da fila!"
          : `${position - 1} jogador(es) na frente`;

      const papelDisplay = papel === "ouvinte" ? "🎧 Ouvinte" : "📖 Leitor";

      positionElement.innerHTML = `
        <div style="text-align: center; margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 8px;">
          <div>Posição na fila: <strong>${position}º</strong> de ${totalPlayers}</div>
          <div>Seu papel: <strong>${papelDisplay}</strong></div>
          <div style="font-size: 0.9em; color: #ccc; margin-top: 5px;">${proximoJogador}</div>
        </div>
      `;

      // 🎯 CORREÇÃO: Log para debug
      console.log("UI Atualizada:", {
        position,
        totalPlayers,
        papel,
        proximoJogador,
      });
    }
  }

  // Criar elemento de posição se não existir
  createPositionElement() {
    const positionElement = document.createElement("div");
    positionElement.id = "positionInfo";
    positionElement.style.marginTop = "10px";
    positionElement.style.padding = "10px";
    positionElement.style.background = "rgba(255,255,255,0.1)";
    positionElement.style.borderRadius = "8px";
    positionElement.style.textAlign = "center";

    const statusElement = document.getElementById("queueStatus");
    if (statusElement && statusElement.parentNode) {
      statusElement.parentNode.insertBefore(
        positionElement,
        statusElement.nextSibling
      );
    }
    return positionElement;
  }

  // Ouvir por criação de jogos para este jogador
  listenForGameCreation() {
    this.queueListener = firebaseDB.db
      .ref(`birdbox/players/${this.playerId}/currentGame`)
      .on("value", async (snapshot) => {
        const gameId = snapshot.val();
        if (gameId && this.isLookingForMatch) {
          console.log("Jogo encontrado, redirecionando:", gameId);

          try {
            const gameSnapshot = await firebaseDB.db
              .ref(`birdbox/games/${gameId}`)
              .once("value");
            const gameData = gameSnapshot.val();

            if (gameData && gameData.status === "ativo") {
              console.log("Jogo confirmado como ativo, redirecionando...");
              this.stopAllIntervals();
              window.location.href = `jogo.html?gameId=${gameId}`;
            } else {
              console.log("Jogo não está ativo, limpando referência...");
              // Limpar referência inválida
              await firebaseDB.db
                .ref(`birdbox/players/${this.playerId}/currentGame`)
                .remove();
            }
          } catch (error) {
            console.error("Erro ao verificar jogo:", error);
          }
        }
      });
  }

  // Verificar periodicamente por jogos
  startGameCheckInterval() {
    this.gameCheckInterval = setInterval(async () => {
      if (!this.isLookingForMatch) return;

      try {
        // Verificar se foi criado um jogo para este jogador
        const gameSnapshot = await firebaseDB.db
          .ref(`birdbox/players/${this.playerId}/currentGame`)
          .once("value");
        const gameId = gameSnapshot.val();

        if (gameId) {
          const gameDataSnapshot = await firebaseDB.db
            .ref(`birdbox/games/${gameId}`)
            .once("value");
          const gameData = gameDataSnapshot.val();

          if (gameData && gameData.status === "ativo") {
            console.log("Jogo ativo encontrado, redirecionando...");
            this.stopAllIntervals();
            window.location.href = `jogo.html?gameId=${gameId}`;
          } else {
            // Limpar referência inválida
            await firebaseDB.db
              .ref(`birdbox/players/${this.playerId}/currentGame`)
              .remove();
          }
        }

        // Verificar também se ainda está na fila
        const inQueue = await this.checkIfAlreadyInQueue();
        if (!inQueue && this.isLookingForMatch) {
          console.log("Não está mais na fila, parando verificações...");
          this.stopAllIntervals();
        }
      } catch (error) {
        console.error("Erro na verificação periódica:", error);
      }
    }, 3000);
  }

  // Parar todos os intervals e listeners
  stopAllIntervals() {
    console.log("Parando todos os intervals e listeners...");

    if (this.queueListener) {
      firebaseDB.db
        .ref(`birdbox/players/${this.playerId}/currentGame`)
        .off("value", this.queueListener);
      this.queueListener = null;
    }

    if (this.gameCheckInterval) {
      clearInterval(this.gameCheckInterval);
      this.gameCheckInterval = null;
    }

    if (this.positionCheckInterval) {
      clearInterval(this.positionCheckInterval);
      this.positionCheckInterval = null;
    }

    this.isLookingForMatch = false;
    this.hasEnteredQueue = false;
  }

  // Atualizar contador de jogadores na fila
  async updateQueueCount() {
    try {
      const count = await firebaseDB.getQueueCount();
      const countElement = document.getElementById("playersWaiting");
      if (countElement) {
        countElement.textContent = `${count} jogador(es) na fila`;
      }
      return count;
    } catch (error) {
      console.error("Erro ao atualizar contador:", error);
      return 0;
    }
  }

  // Atualizar status da fila na UI
  updateQueueStatus(status) {
    const statusElement = document.getElementById("queueStatus");
    if (statusElement) {
      statusElement.textContent = status;

      // Adicionar classe CSS baseada no status
      statusElement.className = "queue-status";
      if (status.includes("Erro")) {
        statusElement.classList.add("error");
      } else if (
        status.includes("Aguardando") ||
        status.includes("Procurando")
      ) {
        statusElement.classList.add("waiting");
      }
    }
  }

  // Verificar se já está em uma partida ativa
  async checkExistingGame() {
    try {
      const gamesSnapshot = await firebaseDB.gamesRef
        .orderByChild("status")
        .equalTo("ativo")
        .once("value");
      const games = gamesSnapshot.val();

      if (games) {
        for (const gameId in games) {
          const game = games[gameId];
          if (game.jogadores && game.jogadores[this.playerId]) {
            console.log(`Jogador encontrado no jogo ativo: ${gameId}`);
            return { inGame: true, gameId: gameId };
          }
        }
      }

      return { inGame: false };
    } catch (error) {
      console.error("Erro ao verificar partida existente:", error);
      return { inGame: false };
    }
  }

  // 🎯 MÉTODO CORRIGIDO: Obter informações detalhadas da fila
  async getQueueDetails() {
    try {
      const orderedQueue = await firebaseDB.getOrderedQueue();

      // 🎯 CORREÇÃO: Verificar se a fila é válida
      if (!orderedQueue || orderedQueue.length === 0) {
        return {
          position: 0,
          total: 0,
          papel: null,
          queue: [],
        };
      }

      const playerIndex = orderedQueue.findIndex(
        (player) => player.id === this.playerId
      );

      // 🎯 CORREÇÃO: Se não encontrou, posição é 0
      const position = playerIndex !== -1 ? playerIndex + 1 : 0;
      const playerData = playerIndex !== -1 ? orderedQueue[playerIndex] : null;

      console.log("📊 Detalhes da fila calculados:", {
        position,
        total: orderedQueue.length,
        playerFound: playerIndex !== -1,
      });

      return {
        position: position,
        total: orderedQueue.length,
        papel: playerData ? playerData.papel : null,
        queue: orderedQueue,
      };
    } catch (error) {
      console.error("Erro ao obter detalhes da fila:", error);
      return {
        position: 0,
        total: 0,
        papel: null,
        queue: [],
      };
    }
  }

  // Método para verificar o estado atual do jogador
  async getPlayerStatus() {
    const inGame = await this.checkExistingGame();
    const inQueue = await this.checkIfAlreadyInQueue();

    return {
      playerId: this.playerId,
      playerName: this.playerName,
      inGame: inGame.inGame,
      inQueue: inQueue,
      isLookingForMatch: this.isLookingForMatch,
      hasEnteredQueue: this.hasEnteredQueue,
    };
  }

  // 🎯 MÉTODO CORRIGIDO: Debug - mostrar status completo
  async debugStatus() {
    const status = await this.getPlayerStatus();
    const queueDetails = await this.getQueueDetails();
    const queueCount = await firebaseDB.getQueueCount();

    console.log("=== DEBUG QUEUE MANAGER ===");
    console.log("Jogador:", status.playerName, "(", status.playerId, ")");
    console.log("Em jogo:", status.inGame);
    console.log("Na fila:", status.inQueue);
    console.log("Buscando partida:", status.isLookingForMatch);
    console.log("Entrou na fila:", status.hasEnteredQueue);
    console.log("Total na fila (firebase):", queueCount);
    console.log("Detalhes da fila (calculado):", queueDetails);

    // 🎯 CORREÇÃO: Verificar consistência entre os métodos
    if (queueCount !== queueDetails.total) {
      console.warn("⚠️ INCONSISTÊNCIA: queueCount !== queueDetails.total", {
        queueCount,
        queueDetailsTotal: queueDetails.total,
      });
    }

    if (status.inQueue && queueDetails.position === 0) {
      console.warn("⚠️ INCONSISTÊNCIA: inQueue=true mas position=0");
    }

    console.log("=== FIM DEBUG ===");

    return { status, queueDetails, queueCount };
  }

  // 🎯 MÉTODO NOVO: Forçar verificação imediata da posição
  async forcePositionCheck() {
    try {
      const orderedQueue = await firebaseDB.getOrderedQueue();

      if (!orderedQueue || orderedQueue.length === 0) {
        this.updatePositionInfo(0, 0, null);
        return { position: 0, total: 0 };
      }

      const playerIndex = orderedQueue.findIndex(
        (player) => player.id === this.playerId
      );

      if (playerIndex === -1) {
        this.updatePositionInfo(0, 0, null);
        return { position: 0, total: orderedQueue.length };
      }

      const position = playerIndex + 1;
      const playerData = orderedQueue[playerIndex];

      this.updatePositionInfo(position, orderedQueue.length, playerData.papel);

      return {
        position,
        total: orderedQueue.length,
        papel: playerData.papel,
      };
    } catch (error) {
      console.error("Erro na verificação forçada:", error);
      this.updatePositionInfo(0, 0, null);
      return { position: 0, total: 0 };
    }
  }
}

// Instância global do gerenciador de fila
const queueManager = new QueueManager();

// 🎯 ADICIONAR FUNÇÃO GLOBAL PARA DEBUG
if (typeof window !== "undefined") {
  window.queueManager = queueManager;
  window.forcePositionCheck = () => queueManager.forcePositionCheck();
  window.debugQueue = () => queueManager.debugStatus();
}

// CSS para os status (pode ser adicionado no CSS principal)
const style = document.createElement("style");
style.textContent = `
  .queue-status {
    font-weight: bold;
    padding: 5px 10px;
    border-radius: 5px;
    transition: all 0.3s ease;
  }
  
  .queue-status.waiting {
    background-color: #fff3cd;
    color: #856404;
    border: 1px solid #ffeaa7;
  }
  
  .queue-status.error {
    background-color: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
  
  #positionInfo {
    animation: fadeIn 0.5s ease-in;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;
document.head.appendChild(style);
