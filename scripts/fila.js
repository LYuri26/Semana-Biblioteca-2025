// Lógica de fila para o jogo BirdBox

class QueueManager {
  constructor() {
    this.playerId = localStorage.getItem("playerId");
    this.playerName = localStorage.getItem("playerName");
    this.queueListener = null;
    this.isLookingForMatch = false;
    this.gameCheckInterval = null;
  }

  // Entrar na fila
  async enterQueue() {
    if (!this.playerId || !this.playerName) {
      console.error("ID ou nome do jogador não encontrado");
      alert("Erro: Dados do jogador não encontrados. Volte à página inicial.");
      window.location.href = "index.html";
      return false;
    }

    console.log(
      `Jogador ${this.playerName} (${this.playerId}) entrando na fila`
    );

    // Primeiro verificar se já está em um jogo ativo
    const inGame = await this.checkAndRedirectToExistingGame();
    if (inGame) {
      console.log("Já está em jogo ativo, redirecionando...");
      return true;
    }

    // Verificar se já está na fila
    const alreadyInQueue = await this.checkIfAlreadyInQueue();
    if (alreadyInQueue) {
      console.log("Já está na fila, aguardando parceiro...");
      this.isLookingForMatch = true;
      this.listenForGameCreation();
      this.updateQueueStatus("Aguardando parceiro...");
      return true;
    }

    // Verificar novamente se não entrou em um jogo durante a verificação
    const inGameNow = await this.checkAndRedirectToExistingGame();
    if (inGameNow) {
      console.log("Entrou em jogo durante a verificação, redirecionando...");
      return true;
    }

    this.isLookingForMatch = true;

    // Adicionar jogador à fila
    const success = await firebaseDB.addPlayerToQueue(
      this.playerId,
      this.playerName
    );

    if (success) {
      console.log("Adicionado à fila com sucesso");
      this.listenForGameCreation();
      this.updateQueueStatus("Procurando parceiro...");
      this.startGameCheckInterval();
      return true;
    } else {
      console.error("Falha ao entrar na fila");
      this.updateQueueStatus("Erro ao entrar na fila");
      return false;
    }
  }
  // Sair da fila
  async leaveQueue() {
    console.log("Saindo da fila...");
    this.isLookingForMatch = false;

    if (this.queueListener) {
      firebaseDB.stopListeningToQueue(this.queueListener);
      this.queueListener = null;
    }

    if (this.gameCheckInterval) {
      clearInterval(this.gameCheckInterval);
      this.gameCheckInterval = null;
    }

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

  async checkAndRedirectToExistingGame() {
    try {
      const gameSnapshot = await firebaseDB.db
        .ref(`birdbox/players/${this.playerId}/currentGame`)
        .once("value");
      const gameId = gameSnapshot.val();

      if (gameId) {
        // Verificar se o jogo ainda está ativo
        const gameSnapshot = await firebaseDB.db
          .ref(`birdbox/games/${gameId}`)
          .once("value");
        const gameData = gameSnapshot.val();

        if (gameData && gameData.status === "ativo") {
          console.log(
            "Jogador já está em uma partida ativa, redirecionando..."
          );
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

  // Ouvir por criação de jogos para este jogador
  listenForGameCreation() {
    this.queueListener = firebaseDB.db
      .ref(`birdbox/players/${this.playerId}/currentGame`)
      .on("value", async (snapshot) => {
        const gameId = snapshot.val();
        if (gameId && this.isLookingForMatch) {
          console.log("Jogo encontrado, redirecionando:", gameId);

          // Verificar se o jogo realmente existe e é válido
          try {
            const gameSnapshot = await firebaseDB.db
              .ref(`birdbox/games/${gameId}`)
              .once("value");
            const gameData = gameSnapshot.val();

            if (gameData && gameData.status === "ativo") {
              // Parar de escutar e redirecionar
              this.stopListening();
              window.location.href = `jogo.html?gameId=${gameId}`;
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
        // Verificar diretamente na fila se há parceiros
        const queueSnapshot = await firebaseDB.queueRef.once("value");
        const queue = queueSnapshot.val();

        if (queue) {
          const playerIds = Object.keys(queue);
          const otherPlayers = playerIds.filter((id) => id !== this.playerId);

          if (otherPlayers.length > 0) {
            console.log(
              `Encontrado(s) ${otherPlayers.length} outro(s) jogador(es) na fila`
            );
          }
        }

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
            this.stopListening();
            window.location.href = `jogo.html?gameId=${gameId}`;
          }
        }
      } catch (error) {
        console.error("Erro na verificação periódica:", error);
      }
    }, 3000);
  }

  // Parar de escutar
  stopListening() {
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

    this.isLookingForMatch = false;
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
}

// Instância global do gerenciador de fila
const queueManager = new QueueManager();
